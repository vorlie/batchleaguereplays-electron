const path = require("node:path");
const { exec, spawn } = require("node:child_process");
const { app, BrowserWindow, ipcMain } = require("electron");
const { autoUpdater } = require("electron-updater");

const isDev = !app.isPackaged;
let updateState = {
  status: isDev ? "disabled" : "idle",
  message: isDev ? "Updates are disabled in development." : "Update check has not run yet.",
  currentVersion: app.getVersion(),
  updateInfo: null,
  progress: null,
  error: null,
};

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

function broadcast(channel, payload) {
  BrowserWindow.getAllWindows().forEach((window) => {
    if (!window.isDestroyed()) {
      window.webContents.send(channel, payload);
    }
  });
}

function setUpdateState(nextState) {
  updateState = {
    ...updateState,
    ...nextState,
  };
  broadcast("update-state", updateState);
}

async function checkForUpdates() {
  if (isDev) {
    setUpdateState({
      status: "disabled",
      message: "Updates are disabled in development builds.",
    });
    return updateState;
  }

  await autoUpdater.checkForUpdates();
  return updateState;
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1120,
    minHeight: 680,
    show: false,
    backgroundColor: "#0f1720",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.webContents.send("update-state", updateState);

    if (!isDev) {
      checkForUpdates().catch((error) => {
        setUpdateState({
          status: "error",
          message: "Update check failed.",
          error: error.message,
        });
      });
    }
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadFile(path.join(__dirname, "dist", "index.html"));
  }
}

function execCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, { windowsHide: true, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
        return;
      }

      resolve(stdout);
    });
  });
}

async function getLcuCredentials() {
  const command =
    'powershell -NoProfile -Command "(Get-CimInstance Win32_Process | Where-Object { $_.Name -eq \'LeagueClientUx.exe\' }).CommandLine"';
  const commandLine = await execCommand(command);
  const token = commandLine.match(/--remoting-auth-token=([^\s"]+)/);
  const port = commandLine.match(/--app-port=(\d+)/);

  if (!token || !port) {
    throw new Error("League client process found without remoting credentials.");
  }

  return {
    token: token[1],
    port: port[1],
  };
}

function runCurl(args) {
  return new Promise((resolve, reject) => {
    const child = spawn("curl.exe", args, {
      windowsHide: true,
      shell: false,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => reject(error));
    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
        return;
      }

      reject(new Error(stderr || `curl.exe exited with code ${code}`));
    });
  });
}

function buildManualReplayCommand(gameId, token, port) {
  const url = `https://127.0.0.1:${port}/lol-replays/v1/rofls/${gameId}/download/graceful`;
  return `curl --insecure --user "riot:${token}" -X POST "${url}" -H "Content-Type: application/json" -d "{}"`;
}

ipcMain.handle("fetch-match-history", async () => {
  const { token, port } = await getLcuCredentials();
  const url = `https://127.0.0.1:${port}/lol-match-history/v1/products/lol/current-summoner/matches?begIndex=0&endIndex=100`;
  const rawJson = await runCurl(["--insecure", "--user", `riot:${token}`, "-X", "GET", url]);

  return { rawJson };
});

ipcMain.handle("trigger-replay-download", async (_event, gameId) => {
  if (!gameId) {
    throw new Error("Missing gameId.");
  }

  const { token, port } = await getLcuCredentials();
  const url = `https://127.0.0.1:${port}/lol-replays/v1/rofls/${gameId}/download/graceful`;
  const manualCommand = buildManualReplayCommand(gameId, token, port);
  const response = await runCurl([
    "--insecure",
    "--user",
    `riot:${token}`,
    "-X",
    "POST",
    url,
    "-H",
    "Content-Type: application/json",
    "-d",
    "{}",
  ]);

  return {
    manualCommand,
    response,
  };
});

ipcMain.handle("get-client-patch", async () => {
  const { token, port } = await getLcuCredentials();
  const url = `https://127.0.0.1:${port}/lol-patch/v1/game-version`;
  const rawVersion = await runCurl(["--insecure", "--user", `riot:${token}`, "-X", "GET", url]);
  const fullVersion = JSON.parse(rawVersion);
  const shortVersion = fullVersion.split(".").slice(0, 2).join(".");

  return {
    fullVersion,
    shortVersion,
  };
});

ipcMain.handle("get-update-state", () => updateState);

ipcMain.handle("check-for-updates", () => checkForUpdates());

ipcMain.handle("install-update", () => {
  if (updateState.status !== "downloaded") {
    return {
      ok: false,
      message: "No downloaded update is ready to install.",
    };
  }

  setImmediate(() => {
    autoUpdater.quitAndInstall(false, true);
  });

  return {
    ok: true,
    message: "Restarting to install update.",
  };
});

autoUpdater.on("checking-for-update", () => {
  setUpdateState({
    status: "checking",
    message: "Checking for updates...",
    error: null,
    progress: null,
  });
});

autoUpdater.on("update-available", (info) => {
  setUpdateState({
    status: "available",
    message: `Update ${info.version} is available. Downloading...`,
    updateInfo: info,
    error: null,
  });
});

autoUpdater.on("update-not-available", (info) => {
  setUpdateState({
    status: "current",
    message: "You are running the latest version.",
    updateInfo: info,
    progress: null,
    error: null,
  });
});

autoUpdater.on("download-progress", (progress) => {
  setUpdateState({
    status: "downloading",
    message: `Downloading update: ${Math.round(progress.percent)}%`,
    progress: {
      percent: progress.percent,
      transferred: progress.transferred,
      total: progress.total,
      bytesPerSecond: progress.bytesPerSecond,
    },
  });
});

autoUpdater.on("update-downloaded", (info) => {
  setUpdateState({
    status: "downloaded",
    message: `Update ${info.version} is ready to install.`,
    updateInfo: info,
    progress: null,
    error: null,
  });
});

autoUpdater.on("error", (error) => {
  setUpdateState({
    status: "error",
    message: "Updater error.",
    error: error.message,
    progress: null,
  });
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("leagueReplays", {
  fetchMatchHistory: () => ipcRenderer.invoke("fetch-match-history"),
  triggerReplayDownload: (gameId) => ipcRenderer.invoke("trigger-replay-download", gameId),
  getClientPatch: () => ipcRenderer.invoke("get-client-patch"),
  getUpdateState: () => ipcRenderer.invoke("get-update-state"),
  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
  installUpdate: () => ipcRenderer.invoke("install-update"),
  onAppLog: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("app-log", listener);
    return () => ipcRenderer.removeListener("app-log", listener);
  },
  onUpdateState: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("update-state", listener);
    return () => ipcRenderer.removeListener("update-state", listener);
  },
});

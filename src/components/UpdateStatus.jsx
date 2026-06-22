import { useEffect, useMemo, useState } from "react";

export default function UpdateStatus() {
  const [updateState, setUpdateState] = useState({
    status: "idle",
    message: "Update check has not run yet.",
    currentVersion: "",
    progress: null,
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let disposed = false;

    window.leagueReplays.getUpdateState().then((state) => {
      if (!disposed) {
        setUpdateState(state);
      }
    });

    const unsubscribe = window.leagueReplays.onUpdateState(setUpdateState);

    return () => {
      disposed = true;
      unsubscribe();
    };
  }, []);

  async function handleCheck() {
    setBusy(true);

    try {
      const state = await window.leagueReplays.checkForUpdates();
      setUpdateState(state);
    } finally {
      setBusy(false);
    }
  }

  async function handleInstall() {
    setBusy(true);
    await window.leagueReplays.installUpdate();
  }

  const label = useMemo(() => {
    if (updateState.status === "downloaded") {
      return "Restart to update";
    }

    if (updateState.status === "checking") {
      return "Checking";
    }

    if (updateState.status === "downloading") {
      return `${Math.round(updateState.progress?.percent ?? 0)}%`;
    }

    if (updateState.status === "disabled") {
      return "Dev build";
    }

    return "Check updates";
  }, [updateState]);

  const canCheck = !busy && !["checking", "downloading", "downloaded", "disabled"].includes(updateState.status);
  const canInstall = !busy && updateState.status === "downloaded";

  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="hidden max-w-72 truncate text-xs text-slate-400 xl:block" title={updateState.message}>
        {updateState.message}
      </div>
      <button
        type="button"
        onClick={canInstall ? handleInstall : handleCheck}
        disabled={!canInstall && !canCheck}
        className={`rounded border px-3 py-1 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
          canInstall
            ? "border-emerald-300/50 bg-emerald-300/15 text-emerald-200 hover:bg-emerald-300/25"
            : "border-line text-slate-200 hover:bg-panelSoft"
        }`}
      >
        {label}
      </button>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import MatchDetailsPanel from "./components/MatchDetailsPanel";
import MatchHistoryList from "./components/MatchHistoryList";
import Sidebar from "./components/Sidebar";
import UpdateStatus from "./components/UpdateStatus";
import { useAppInitialization } from "./hooks/useAppInitialization";

export default function App() {
  const initialization = useAppInitialization();
  const [activeSnapshot, setActiveSnapshot] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    return window.leagueReplays.onAppLog((entry) => {
      setLogs((currentLogs) => [entry, ...currentLogs].slice(0, 4));
    });
  }, []);

  const activeSnapshotId = activeSnapshot?.id;

  function handleSelectSnapshot(snapshot) {
    setActiveSnapshot(snapshot);
    setSelectedMatch(snapshot.matches[0] ?? null);
  }

  const banner = useMemo(() => {
    if (initialization.loading) {
      return "Syncing Data Dragon metadata and client patch...";
    }

    if (initialization.error) {
      return `Data Dragon sync failed: ${initialization.error}`;
    }

    return `Data Dragon ${initialization.ddragonVersion ?? "unknown"} ready`;
  }, [initialization.loading, initialization.error, initialization.ddragonVersion]);

  return (
    <div className="flex h-full overflow-hidden bg-ink text-slate-100">
      <Sidebar
        activeSnapshotId={activeSnapshotId}
        onSelectSnapshot={handleSelectSnapshot}
        onSnapshotCreated={handleSelectSnapshot}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-10 shrink-0 items-center justify-between border-b border-line bg-slate-950 px-4">
          <div className="truncate text-xs text-slate-300">{banner}</div>
          <div className="flex items-center gap-2">            
            <button
              type="button"
              onClick={() => window.leagueReplays.openLiveWindow()}
              className="rounded border border-accent bg-accent/15 px-3 py-1 text-xs text-accent font-medium hover:bg-accent hover:text-slate-950 transition"
            >
              🖥️ Popout Live HUD
            </button>
            
            <UpdateStatus /> {/*[cite: 1] */}
          </div>
        </div>
        {logs.length ? (
          <div className="border-b border-line bg-slate-950 px-4 py-2 text-xs text-slate-300">
            {logs[0].message}
          </div>
        ) : null}
        <div className="min-h-0 flex flex-1">
          <MatchHistoryList
            snapshot={activeSnapshot}
            selectedMatchId={selectedMatch?.gameId}
            onSelectMatch={setSelectedMatch}
            championsById={initialization.championsById}
            ddragonVersion={initialization.ddragonVersion}
          />
          <MatchDetailsPanel
            match={selectedMatch}
            championsById={initialization.championsById}
            ddragonVersion={initialization.ddragonVersion}
            clientPatch={initialization.clientPatch}
          />
        </div>
      </div>
    </div>
  );
}

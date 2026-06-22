import { useEffect, useState } from "react";
import { getSnapshots, saveSnapshot } from "../db";
import { extractMatches, formatDate } from "../matchUtils";

export default function Sidebar({ activeSnapshotId, onSelectSnapshot, onSnapshotCreated }) {
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function loadSnapshots() {
    const storedSnapshots = await getSnapshots();
    setSnapshots(storedSnapshots);
    if (!activeSnapshotId && storedSnapshots[0]) {
      onSelectSnapshot(storedSnapshots[0]);
    }
  }

  useEffect(() => {
    loadSnapshots();
  }, []);

  async function handleFetchHistory() {
    setLoading(true);
    setError(null);

    try {
      const result = await window.leagueReplays.fetchMatchHistory();
      const matches = extractMatches(result.rawJson);
      const snapshot = await saveSnapshot(matches, result.rawJson);
      await loadSnapshots();
      onSnapshotCreated(snapshot);
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-line bg-panel">
      <div className="border-b border-line p-4">
        <button
          type="button"
          onClick={handleFetchHistory}
          disabled={loading}
          className="h-11 w-full rounded-md bg-accent px-4 text-sm font-semibold text-slate-950 transition hover:bg-[#e3bc6a] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Fetching..." : "+ Fetch New History"}
        </button>
        {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Sessions
        </div>
        <div className="space-y-2">
          {snapshots.map((snapshot) => (
            <button
              key={snapshot.id}
              type="button"
              onClick={() => onSelectSnapshot(snapshot)}
              className={`w-full rounded-md border px-3 py-3 text-left transition ${
                activeSnapshotId === snapshot.id
                  ? "border-accent bg-panelSoft text-white"
                  : "border-transparent bg-transparent text-slate-300 hover:border-line hover:bg-panelSoft"
              }`}
            >
              <div className="text-sm font-medium">{formatDate(snapshot.createdAt)}</div>
              <div className="mt-1 text-xs text-slate-400">{snapshot.matches.length} matches</div>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

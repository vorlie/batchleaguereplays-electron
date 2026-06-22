import { useMemo, useState } from "react";
import {
  formatDuration,
  formatGameMode,
  getChampionId,
  getGameOutcome,
  getMatchBadges,
  getStats,
} from "../matchUtils";

export default function MatchDetailsPanel({ match, championsById, ddragonVersion, clientPatch }) {
  const [manualCommand, setManualCommand] = useState("");
  const [expanded, setExpanded] = useState(true);
  const [status, setStatus] = useState("");
  const stats = match ? getStats(match) : {};
  const champion = match ? championsById[getChampionId(match)] : null;
  const badges = match ? getMatchBadges(match) : [];

  const portraitUrl = useMemo(() => {
    if (!champion || !ddragonVersion) {
      return null;
    }

    return `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/champion/${champion.image}`;
  }, [champion, ddragonVersion]);

  async function handleDownload() {
    if (!match?.gameId) {
      return;
    }

    setStatus("Sending request...");

    try {
      const result = await window.leagueReplays.triggerReplayDownload(match.gameId);
      setManualCommand(result.manualCommand);
      setStatus("Download command accepted.");
    } catch (downloadError) {
      setStatus(downloadError.message);
    }
  }

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-l border-line bg-panel">
      <div className="border-b border-line p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Client Patch
        </div>
        <div className="mt-1 text-sm text-white">{clientPatch?.shortVersion ?? "Checking..."}</div>
      </div>

      {!match ? (
        <div className="p-4 text-sm text-slate-400">Select a match to inspect details.</div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <button
            type="button"
            onClick={handleDownload}
            className="mb-4 h-11 w-full rounded-md bg-accent px-4 text-sm font-semibold text-slate-950 transition hover:bg-[#e3bc6a]"
          >
            Download Replay
          </button>

          {status ? <div className="mb-4 rounded-md bg-slate-900 p-3 text-sm text-slate-200">{status}</div> : null}

          <div className="mb-5 flex items-center gap-3">
            <div className="h-14 w-14 overflow-hidden rounded-md bg-slate-800">
              {portraitUrl ? <img src={portraitUrl} alt="" className="h-full w-full object-cover" /> : null}
            </div>
            <div className="min-w-0">
              <div className="truncate text-base font-semibold text-white">
                {champion?.name ?? "Unknown Champion"}
              </div>
              <div className="text-sm text-slate-400">Game ID {match.gameId}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Metric label="Result" value={getGameOutcome(match)} />
            <Metric label="Mode" value={formatGameMode(match.gameMode)} />
            <Metric label="Duration" value={formatDuration(match.gameDuration)} />
            <Metric label="Kills" value={stats.kills ?? 0} />
            <Metric label="Deaths" value={stats.deaths ?? 0} />
            <Metric label="Assists" value={stats.assists ?? 0} />
            <Metric label="CS" value={(stats.totalMinionsKilled ?? 0) + (stats.neutralMinionsKilled ?? 0)} />
            <Metric label="Gold" value={stats.goldEarned ?? 0} />
            <Metric label="Damage" value={stats.totalDamageDealtToChampions ?? 0} />
          </div>

          {badges.length ? (
            <div className="mt-5">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Badges
              </div>
              <div className="flex flex-wrap gap-2">
                {badges.map((badge) => (
                  <Badge key={badge.key} badge={badge} />
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-5 rounded-md border border-line bg-slate-950">
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="flex w-full items-center justify-between px-3 py-3 text-left text-sm font-semibold text-white"
            >
              <span>Developer Manual Command</span>
              <span className="text-slate-400">{expanded ? "-" : "+"}</span>
            </button>
            {expanded ? (
              <div className="border-t border-line p-3">
                <code className="block whitespace-pre-wrap break-all text-xs leading-5 text-cyan-200">
                  {manualCommand || "Run Download Replay to generate the exact curl command."}
                </code>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </aside>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-md border border-line bg-panelSoft p-3">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-1 truncate text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

function Badge({ badge }) {
  const toneClass =
    {
      legendary: "border-amber-300/60 bg-amber-300/15 text-amber-200",
      epic: "border-fuchsia-300/50 bg-fuchsia-300/15 text-fuchsia-200",
      rare: "border-sky-300/50 bg-sky-300/15 text-sky-200",
      objective: "border-emerald-300/50 bg-emerald-300/15 text-emerald-200",
      standard: "border-slate-500 bg-slate-700/50 text-slate-200",
    }[badge.tone] ?? "border-slate-500 bg-slate-700/50 text-slate-200";

  return (
    <span className={`rounded border px-2 py-1 text-xs font-semibold ${toneClass}`}>
      {badge.label}
    </span>
  );
}

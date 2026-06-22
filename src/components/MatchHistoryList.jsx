import {
  formatDate,
  formatDuration,
  formatGameMode,
  getChampionId,
  getGameOutcome,
  getMatchBadges,
  getParticipant,
  getStats,
} from "../matchUtils";

export default function MatchHistoryList({
  snapshot,
  selectedMatchId,
  onSelectMatch,
  championsById,
  ddragonVersion,
}) {
  const matches = snapshot?.matches ?? [];

  return (
    <main className="min-w-0 flex-1 bg-ink">
      <div className="flex h-16 items-center justify-between border-b border-line px-5">
        <div>
          <h1 className="text-lg font-semibold text-white">Match History</h1>
          <p className="text-sm text-slate-400">
            {snapshot ? `${matches.length} matches in selected snapshot` : "Select or fetch a snapshot"}
          </p>
        </div>
      </div>

      <div className="h-[calc(100%-4rem)] overflow-y-auto p-4">
        <div className="space-y-2">
          {matches.map((match) => {
            const participant = getParticipant(match);
            const stats = getStats(match);
            const champion = championsById[getChampionId(match)];
            const outcome = getGameOutcome(match);
            const badges = getMatchBadges(match).slice(0, 3);
            const isSelected = selectedMatchId === match.gameId;
            const portraitUrl =
              champion && ddragonVersion
                ? `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/champion/${champion.image}`
                : null;

            return (
              <button
                key={match.gameId}
                type="button"
                onClick={() => onSelectMatch(match)}
                className={`grid w-full grid-cols-[56px_minmax(0,1fr)_92px_92px] items-center gap-4 rounded-md border p-3 text-left transition ${
                  isSelected
                    ? "border-accent bg-panelSoft"
                    : "border-line bg-panel hover:border-slate-500"
                }`}
              >
                <div className="h-12 w-12 overflow-hidden rounded-md bg-slate-800">
                  {portraitUrl ? (
                    <img
                      src={portraitUrl}
                      alt=""
                      className="h-full w-full object-cover"
                      draggable="false"
                    />
                  ) : null}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-white">
                      {champion?.name ?? `Champion ${participant.championId ?? "Unknown"}`}
                    </span>
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
                      {formatGameMode(match.gameMode)}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-400">{formatDate(match.gameCreationDate)}</div>
                  {badges.length ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {badges.map((badge) => (
                        <Badge key={badge.key} badge={badge} />
                      ))}
                    </div>
                  ) : null}
                </div>

                <div>
                  <div className="text-sm font-semibold text-white">
                    {stats.kills ?? 0}/{stats.deaths ?? 0}/{stats.assists ?? 0}
                  </div>
                  <div className="text-xs text-slate-400">KDA</div>
                </div>

                <div className="text-right">
                  <div
                    className={`inline-flex rounded px-2 py-1 text-xs font-bold ${
                      outcome === "Win"
                        ? "bg-emerald-400/15 text-emerald-300"
                        : "bg-red-400/15 text-red-300"
                    }`}
                  >
                    {outcome}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">{formatDuration(match.gameDuration)}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </main>
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
    <span className={`rounded border px-1.5 py-0.5 text-[11px] font-semibold ${toneClass}`}>
      {badge.label}
    </span>
  );
}

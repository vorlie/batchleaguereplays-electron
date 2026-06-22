import { useMemo, useState, useEffect } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { getCompleteLiveContext } from "../liveUtils";

export default function LiveTrackerPanel({ liveData }) {
  const [timeline, setTimeline] = useState([]);
  const live = useMemo(() => getCompleteLiveContext(liveData), [liveData]);

  // Track the timeline updates OR wipe it when the match exits
  useEffect(() => {
    // If live data goes missing (match exited), clear the timeline array
    if (!live) {
      setTimeline([]);
      return;
    }

    setTimeline((prev) => {
      const currentMinute = live.graphNode.timeMarker;
      const lastNode = prev[prev.length - 1];

      if (lastNode && lastNode.timeMarker === currentMinute) {
        return prev;
      }
      return [...prev, live.graphNode];
    });
  }, [live]);

  // This early return stays below the useEffect so the cleanup can actually fire
  if (!live) return null;

  return (
    <main className="flex min-w-0 flex-1 bg-ink overflow-hidden font-sans select-none">
      <div className="flex min-w-0 flex-1 flex-col p-5 overflow-y-auto custom-scrollbar">
        {/* Top Header Section */}
        <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest bg-green-500/15 px-1.5 py-0.5 rounded border border-green-500/30">
                Live Session
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Mode: {live.gameMode}
              </span>
            </div>
            <h1 className="text-xl font-bold text-white mt-0.5">
              {live.activePlayer.summonerName} Monitor
            </h1>
          </div>
          <div className="text-right">
            <div className="text-2xl font-mono font-bold text-green-400 tracking-wider">
              {live.formattedTime}
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">
              Match Time
            </div>
          </div>
        </div>

        {/* Global Overview Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <StatCard label="K / D / A" value={live.activePlayer.kda} accent />
          <StatCard
            label="Creep Score (CS)"
            value={live.activePlayer.creepScore}
          />
          <StatCard
            label="Liquid Gold"
            value={`${live.activePlayer.currentGold}g`}
            color="text-[#e3bc6a]"
          />
          <StatCard
            label="Vision Index"
            value={live.activePlayer.visionScore}
          />
        </div>

        {/* ALL-IN-ONE DASHBOARD WORKSPACE */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
          {/* LEFT SIDE COLUMN: ANALYTICS & STATS (5/12 width) */}
          <div className="xl:col-span-4 space-y-4">
            {/* Real-Time Economic Graph Box */}
            <div className="">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Team Gold Margin Timeline
                </h2>
                <span
                  className={`text-xs font-mono font-bold ${live.goldDifference >= 0 ? "text-sky-400" : "text-rose-400"}`}
                >
                  {live.goldDifference >= 0
                    ? `Blue Lead: +${live.goldDifference}g`
                    : `Red Lead: +${Math.abs(live.goldDifference)}g`}
                </span>
              </div>
              <div className="h-36 w-full bg-slate-950/40 rounded border border-line/40 p-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={timeline}
                    margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="timeMarker"
                      stroke="#475569"
                      fontSize={10}
                      tickLine={false}
                      // Formats the X-axis tick markers on the bottom line (e.g., "5" becomes "5m")
                      tickFormatter={(value) => `${value}m`}
                    />
                    <YAxis stroke="#475569" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#1e293b",
                        color: "#f1f5f9",
                      }}
                      // Formats the tooltip content nicely
                      labelFormatter={(label) => `Time: ${label}m`}
                      formatter={(value) => [`${value}g`, "Gold Diff"]}
                    />
                    <ReferenceLine
                      y={0}
                      stroke="#475569"
                      strokeDasharray="3 3"
                    />
                    <Area
                      type="monotone"
                      dataKey="goldDiff"
                      name="Gold Diff" // Clean fallback name for the Recharts legend/item lookup
                      stroke={live.goldDifference >= 0 ? "#38bdf8" : "#f43f5e"}
                      fill={
                        live.goldDifference >= 0
                          ? "rgba(56,189,248,0.02)"
                          : "rgba(244,63,94,0.02)"
                      }
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Engine UI Core Attributes */}
            <div className="bg-[#010a13] border border-[#1e2328] rounded overflow-hidden shadow-2xl p-4">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#c8aa6e] mb-3">
                Engine UI Core Attributes
              </h2>
              <div className="flex flex-col sm:flex-row gap-8 items-start">
                {/* Keystone tree info */}
                <div className="flex sm:flex-col items-center gap-2 shrink-0 sm:w-24 text-center">
                  <img
                    src={live.activePlayer.keystoneIconUrl}
                    alt={live.activePlayer.keystone}
                    className="w-10 h-10 object-contain border border-[#c8aa6e]/40 p-0.5 rounded-full bg-black/60"
                  />
                  <div>
                    <div className="text-xs text-[#c8aa6e] font-bold tracking-wide font-mono truncate max-w-40">
                      {live.activePlayer.keystone}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {live.activePlayer.primaryTree}
                    </div>
                  </div>
                </div>

                {/* Grid Attributes */}
                <div className="grid grid-cols-2 gap-x-2  w-full font-mono text-xs border-t sm:border-t-0 sm:pl-2 sm:border-l border-[#1e2328]/60 pt-2 sm:pt-0">
                  <StatRowItem
                    icon="statmodsoffenseaddress"
                    label="AD"
                    value={Math.round(
                      live.activePlayer.stats.attackDamage ?? 0,
                    )}
                    color="text-[#e3bc6a]"
                  />
                  <StatRowItem
                    icon="statmodsoffenseadaptiveforce"
                    label="AP"
                    value={Math.round(
                      live.activePlayer.stats.abilityPower ?? 0,
                    )}
                    color="text-indigo-400"
                  />
                  <StatRowItem
                    icon="statmodsdefensearmor"
                    label="ARM"
                    value={Math.round(live.activePlayer.stats.armor ?? 0)}
                  />
                  <StatRowItem
                    icon="statmodsdefensemagicresch"
                    label="MR"
                    value={Math.round(live.activePlayer.stats.magicResist ?? 0)}
                    color="text-sky-400"
                  />
                  <StatRowItem
                    icon="statmodsoffenseattackspeed"
                    label="AS"
                    value={(live.activePlayer.stats.attackSpeed ?? 0).toFixed(
                      2,
                    )}
                    color="text-[#e3bc6a]"
                  />
                  <StatRowItem
                    icon="statmodscoldownreduction"
                    label="AH"
                    value={Math.round(
                      live.activePlayer.stats.cooldownReduction ?? 0,
                    )}
                    color="text-purple-300"
                  />
                  <StatRowItem
                    icon="statmodscritchance"
                    label="CRIT"
                    value={`${Math.round(live.activePlayer.stats.lethality ?? 0)}%`}
                    color="text-rose-400"
                    isV1
                  />
                  <StatRowItem
                    icon="statmodsflexmovementspd"
                    label="MS"
                    value={Math.round(live.activePlayer.stats.moveSpeed ?? 0)}
                  />
                </div>
              </div>

              {/* Extra Dynamic Parameters Grid below */}
              <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-[#1e2328]/60 font-mono text-[11px]">
                <div>
                  <span className="text-slate-500 block text-[10px]">
                    Lifecycle State
                  </span>
                  <span className="text-slate-300 font-bold">
                    {liveData?.activePlayer?.championStats?.currentHealth > 0
                      ? "In Grid"
                      : "Fountain"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">
                    Max Pool Health
                  </span>
                  <span className="text-slate-300 font-bold">
                    {Math.round(
                      liveData?.activePlayer?.championStats?.maxHealth ?? 0,
                    )}{" "}
                    HP
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE COLUMN: TEAM ROSTERS / SCOREBOARD (8/12 width) */}
          <div className="xl:col-span-8 grid grid-cols-1 2xl:grid-cols-2 gap-4 items-start">
            {/* 🟦 BLUE TEAM CONTAINER */}
            <div className="rounded border border-sky-500/30 bg-[#091424]/40 overflow-hidden shadow-lg backdrop-blur-sm">
              <div className="bg-sky-950/40 px-3 py-2 border-b border-sky-500/20 flex justify-between items-center text-xs">
                <span className="font-bold text-sky-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                  Blue Side (Order)
                </span>
                <span className="font-mono text-sky-400/80 text-[11px] font-semibold">
                  {live.blueTeam?.gold
                    ? `${Math.round(live.blueTeam.gold / 100) / 10}k`
                    : "0k"}
                  g • {live.blueTeam?.kills ?? 0} Kills
                </span>
              </div>
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <tbody className="divide-y divide-sky-500/10 text-slate-200">
                    {live.players
                      .filter(
                        (p) =>
                          liveData?.allPlayers?.find(
                            (ap) => ap.summonerName === p.summonerName,
                          )?.team === "ORDER",
                      )
                      .map((player, idx) => (
                        <PlayerRow
                          key={idx}
                          player={player}
                          live={live}
                          team="blue"
                        />
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 🟥 RED TEAM CONTAINER */}
            <div className="rounded border border-rose-500/30 bg-[#1c0d12]/40 overflow-hidden shadow-lg backdrop-blur-sm">
              <div className="bg-rose-950/40 px-3 py-2 border-b border-rose-500/20 flex justify-between items-center text-xs">
                <span className="font-bold text-rose-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                  Red Side (Chaos)
                </span>
                <span className="font-mono text-rose-400/80 text-[11px] font-semibold">
                  {live.redTeam?.gold
                    ? `${Math.round(live.redTeam.gold / 100) / 10}k`
                    : "0k"}
                  g • {live.redTeam?.kills ?? 0} Kills
                </span>
              </div>
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <tbody className="divide-y divide-rose-500/10 text-slate-200">
                    {live.players
                      .filter(
                        (p) =>
                          liveData?.allPlayers?.find(
                            (ap) => ap.summonerName === p.summonerName,
                          )?.team === "CHAOS",
                      )
                      .map((player, idx) => (
                        <PlayerRow
                          key={idx}
                          player={player}
                          live={live}
                          team="red"
                        />
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function PlayerRow({ player, live }) {
  const isDead = player.isDead;
  const isActivePlayer = player.summonerName === live.activePlayer.summonerName;

  const cleanChampionName = player.championName
    ? player.championName.replace(/[^a-zA-Z0-9]/g, "")
    : "Teemo";

  return (
    <tr
      className={`hover:bg-panelSoft/10 transition-colors ${isActivePlayer ? "bg-accent/5 font-bold" : ""}`}
    >
      {/* Champ Avatar & Name */}
      <td className="p-2 flex items-center gap-2 min-w-[140px]">
        <div className="relative w-7 h-7 shrink-0 bg-slate-950 rounded overflow-hidden border border-line/60">
          <img
            src={`https://ddragon.leagueoflegends.com/cdn/14.22.1/img/champion/${cleanChampionName}.png`}
            alt={player.championName}
            className={`w-full h-full object-cover ${isDead ? "grayscale opacity-40" : ""}`}
          />
          {isDead && (
            <span className="absolute inset-0 flex items-center justify-center bg-rose-950/40 text-[9px] font-bold text-rose-400 font-mono">
              ☠️
            </span>
          )}
        </div>
        <div className="min-w-0">
          <div className="font-bold text-slate-200 truncate text-[11px]">
            {player.championName}
          </div>
          <div className="text-[9px] text-slate-500 truncate max-w-[85px]">
            {player.summonerName}
          </div>
        </div>
      </td>

      {/* Stats markers */}
      <td className="p-2 text-slate-300 text-[11px]">
        {player.scores?.kills ?? 0}/{player.scores?.deaths ?? 0}/
        {player.scores?.assists ?? 0}
      </td>
      <td className="p-2 text-slate-400 text-[11px]">
        {player.scores?.creepScore ?? 0} CS
      </td>

      {/* INVENTORY CELL WITH KEY/ID SANITIZATION BLOCK */}
      <td className="p-2">
        <div className="flex gap-1 items-center">
          {Array.from({ length: 7 }, (_, slotIndex) => {
            // Find item matching the current slot index (0 to 6)
            const item = (player.items || []).find(
              (i) =>
                i &&
                i.slot === slotIndex &&
                i.displayName !== "No Item" &&
                (i.id !== 0 || i.itemID !== 0),
            );

            if (item) {
              const finalItemId = item.id ?? item.itemID;
              return (
                <img
                  key={slotIndex}
                  src={`https://ddragon.leagueoflegends.com/cdn/14.22.1/img/item/${finalItemId}.png`}
                  alt={item.displayName}
                  title={`${item.displayName} (Slot ${slotIndex})`}
                  className="w-5.5 h-5.5 rounded border border-line/30 bg-black/40 object-cover"
                  onError={(e) => {
                    e.target.src =
                      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='22' height='22'><rect width='22' height='22' fill='%23090e14'/></svg>";
                  }}
                />
              );
            }

            // Render greyed-out fallback placeholder for unused slots
            return (
              <div
                key={slotIndex}
                className="w-5.5 h-5.5 rounded bg-slate-800/40 border border-slate-700/20"
                title={`Empty Slot ${slotIndex}`}
              />
            );
          })}
        </div>
      </td>

      {/* Dead/Alive Timer status */}
      <td className="p-2 text-right font-sans text-[11px] min-w-[50px]">
        {isDead ? (
          <span className="text-rose-400 font-mono font-bold">
            {player.respawnTimer}s
          </span>
        ) : (
          <span className="text-emerald-500 text-[9px] uppercase font-bold tracking-wider opacity-60">
            • Live
          </span>
        )}
      </td>
    </tr>
  );
}

function StatRowItem({
  icon,
  label,
  value,
  color = "text-slate-200",
  isV1 = false,
}) {
  const basePath = isV1 ? "v1/perk-images" : "assets/perks";
  return (
    <div className="flex items-center justify-between py-0.5">
      <div className="flex items-center gap-1.5">
        <img
          src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/${basePath}/statmods/${icon}.png`}
          alt=""
          className="w-3.5 h-3.5 object-contain opacity-70"
        />
        <span className="text-[10px] text-slate-500">{label}</span>
      </div>
      <span className={`font-bold ${color}`}>{value}</span>
    </div>
  );
}

function StatCard({ label, value, accent, color = "text-white" }) {
  return (
    <div
      className={`rounded border p-2.5 bg-panel ${accent ? "border-accent shadow-[0_0_8px_rgba(56,189,248,0.03)]" : "border-line"}`}
    >
      <div className="text-[10px] text-slate-400 mb-0.5">{label}</div>
      <div className={`text-base font-mono font-bold ${color}`}>{value}</div>
    </div>
  );
}

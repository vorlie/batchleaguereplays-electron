/**
 * Context Parser tailored exactly to the Riot Live Client Data schema.
 * Handles Riot ID taglines smoothly across different local API endpoints.
 */

export function getCompleteLiveContext(liveData) {
  if (!liveData?.activePlayer || !liveData?.allPlayers) return null;

  const { activePlayer, allPlayers, events, gameData } = liveData;

  // 1. Core Match Meta & Time Formatting
  const gameTimeRaw = gameData?.gameTime ?? 0;
  const mins = Math.floor(gameTimeRaw / 60);
  const secs = Math.floor(gameTimeRaw % 60);
  const formattedTime = `${mins}:${String(secs).padStart(2, "0")}`;

  // SAFE MATCHING HELPER: Strips out # tags to match pure name strings safely
  const cleanActiveName = activePlayer.summonerName.split('#')[0];

  // 2. State & Score Placeholders
  let blueTotalGold = 0;
  let redTotalGold = 0;
  let blueTotalKills = 0;
  let redTotalKills = 0;
  let matchedActiveScores = {
    kills: 0,
    deaths: 0,
    assists: 0,
    creepScore: 0,
    wardScore: 0,
  };

  // 3. Process the player array maps
  const processedPlayers = allPlayers.map((player) => {
    const cleanPlayerName = player.summonerName.split('#')[0];
    
    // Inventory total math
    const inventoryValue =
      player.items?.reduce((acc, item) => acc + (item.price ?? 0), 0) ?? 0;

    // Team allocation math (ORDER = Blue Side, CHAOS = Red Side)
    if (player.team === "ORDER") {
      blueTotalGold += inventoryValue;
      blueTotalKills += player.scores?.kills ?? 0;
    } else if (player.team === "CHAOS") {
      redTotalGold += inventoryValue;
      redTotalKills += player.scores?.kills ?? 0;
    }

    // Cross-reference by safe cleaned name strings
    if (cleanPlayerName === cleanActiveName) {
      matchedActiveScores = player.scores ?? matchedActiveScores;
    }

    return {
      summonerName: player.summonerName,
      championName: player.championName,
      isDead: player.isDead,
      respawnTimer: Math.ceil(player.respawnTimer ?? 0),
      scores: player.scores ?? {},
      items: player.items ?? [],
      netWorth: inventoryValue,
    };
  });

  // Find team
  const activePlayerObj = allPlayers.find(
    (p) => p.summonerName.split('#')[0] === cleanActiveName,
  );
  const activePlayerTeam = activePlayerObj?.team ?? "ORDER";
  const unspentCash = Math.floor(activePlayer.currentGold ?? 0);

  if (activePlayerTeam === "ORDER") {
    blueTotalGold += unspentCash;
  } else if (activePlayerTeam === "CHAOS") {
    redTotalGold += unspentCash;
  }

  const absoluteGoldDiff = blueTotalGold - redTotalGold;

  const rawIconPath = activePlayer.fullRunes?.keystone?.rawIconPath;
  const keystoneIconUrl = rawIconPath
    ? `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/${rawIconPath.toLowerCase().split('v1/')[1]}`
    : "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perk-images/styles/7200_domination.png";

  return {
    gameMode: gameData?.gameMode ?? "CLASSIC",
    formattedTime,
    gameTimeRaw,
    goldDifference: absoluteGoldDiff,
    blueTeam: { gold: blueTotalGold, kills: blueTotalKills },
    redTeam: { gold: redTotalGold, kills: redTotalKills },

    activePlayer: {
      summonerName: activePlayer.summonerName,
      currentGold: unspentCash,
      kda: `${matchedActiveScores.kills} / ${matchedActiveScores.deaths} / ${matchedActiveScores.assists}`,
      creepScore: matchedActiveScores.creepScore ?? 0,
      visionScore: Math.floor(matchedActiveScores.wardScore ?? 0),
      stats: activePlayer.championStats ?? {},

      primaryTree: activePlayer.fullRunes?.primaryRuneTree?.displayName ?? "Domination",
      secondaryTree: activePlayer.fullRunes?.secondaryRuneTree?.displayName ?? "Sorcery",
      keystone: activePlayer.fullRunes?.keystone?.displayName ?? "Electrocute",
      
      keystoneIconUrl,

      statRunes: activePlayer.fullRunes?.generalRunes?.slice(1).map((r) => r.displayName) ?? [],
    },
    players: processedPlayers,
    events: events?.Events?.slice().reverse() ?? [],

    graphNode: {
      timeMarker: mins,
      goldDiff: absoluteGoldDiff,
      playerGoldPool: unspentCash,
      playerCS: matchedActiveScores.creepScore ?? 0,
    },
  };
}
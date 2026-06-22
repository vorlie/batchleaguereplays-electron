export function extractMatches(rawJson) {
  const data = JSON.parse(rawJson);
  return data?.games?.games ?? [];
}

export function getParticipant(match) {
  return match?.participants?.[0] ?? {};
}

export function getStats(match) {
  return getParticipant(match)?.stats ?? {};
}

export function getChampionId(match) {
  return getParticipant(match)?.championId ?? 0;
}

export function formatDate(value) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatDuration(seconds) {
  if (!seconds) {
    return "0:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

export function getGameOutcome(match) {
  return getStats(match).win ? "Win" : "Loss";
}

const GAME_MODE_LABELS = {
  KIWI: "ARAM: Mayhem",
};

export function formatGameMode(gameMode) {
  if (!gameMode) {
    return "UNKNOWN";
  }

  return GAME_MODE_LABELS[gameMode] ?? gameMode;
}

export function getMatchBadges(match) {
  const stats = getStats(match);
  const badges = [];

  const addCountBadge = (field, label, tone) => {
    const count = stats[field] ?? 0;
    if (count > 0) {
      badges.push({
        key: field,
        label: count > 1 ? `${label} x${count}` : label,
        tone,
      });
    }
  };

  addCountBadge("unrealKills", "Unreal Kill", "legendary");
  addCountBadge("pentaKills", "Pentakill", "legendary");
  addCountBadge("quadraKills", "Quadrakill", "epic");
  addCountBadge("tripleKills", "Triple Kill", "rare");

  if ((stats.largestKillingSpree ?? 0) >= 10) {
    badges.push({
      key: "godlike",
      label: "Godlike",
      tone: "epic",
    });
  } else if ((stats.largestKillingSpree ?? 0) >= 5) {
    badges.push({
      key: "spree",
      label: `${stats.largestKillingSpree} Kill Spree`,
      tone: "rare",
    });
  }

  addCountBadge("doubleKills", "Double Kill", "standard");

  if (stats.firstBloodKill) {
    badges.push({ key: "firstBloodKill", label: "First Blood", tone: "objective" });
  } else if (stats.firstBloodAssist) {
    badges.push({ key: "firstBloodAssist", label: "First Blood Assist", tone: "objective" });
  }

  if (stats.firstTowerKill) {
    badges.push({ key: "firstTowerKill", label: "First Tower", tone: "objective" });
  } else if (stats.firstTowerAssist) {
    badges.push({ key: "firstTowerAssist", label: "First Tower Assist", tone: "objective" });
  }

  return badges;
}

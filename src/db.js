import { openDB } from "idb";

const DB_NAME = "LeagueReplaysDB";
const DB_VERSION = 1;

const dbPromise = openDB(DB_NAME, DB_VERSION + 1, {
  upgrade(db, oldVersion) {
    if (!db.objectStoreNames.contains("snapshots")) {
      db.createObjectStore("snapshots", { keyPath: "id" });
    }

    if (!db.objectStoreNames.contains("metadata")) {
      db.createObjectStore("metadata", { keyPath: "key" });
    }

    if (!db.objectStoreNames.contains("live_sessions")) {
      db.createObjectStore("live_sessions", { keyPath: "summonerName" });
    }
  },
});

export async function saveSnapshot(matches, rawJson) {
  const db = await dbPromise;
  const snapshot = {
    id: Date.now(),
    createdAt: new Date().toISOString(),
    matches,
    rawJson,
  };

  await db.put("snapshots", snapshot);
  return snapshot;
}

export async function getSnapshots() {
  const db = await dbPromise;
  return (await db.getAll("snapshots")).sort((a, b) => b.id - a.id);
}

export async function getSnapshot(id) {
  const db = await dbPromise;
  return db.get("snapshots", id);
}

export async function getMetadata(key) {
  const db = await dbPromise;
  return db.get("metadata", key);
}

export async function setMetadata(key, value) {
  const db = await dbPromise;
  await db.put("metadata", {
    key,
    value,
    updatedAt: new Date().toISOString(),
  });
}

export async function saveLiveSession(summonerName, liveData) {
  const db = await dbPromise;
  await db.put("live_sessions", {
    summonerName,
    liveData,
    lastUpdated: new Date().toISOString()
  });
}

export async function getLiveSessions() {
  const db = await dbPromise;
  return db.getAll("live_sessions");
}


import { useCallback, useEffect, useMemo, useState } from "react";
import { getMetadata, setMetadata } from "../db";

const DDRAGON_BASE = "https://ddragon.leagueoflegends.com";

export function useAppInitialization() {
  const [ddragonVersion, setDdragonVersion] = useState(null);
  const [clientPatch, setClientPatch] = useState(null);
  const [championsById, setChampionsById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const initialize = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const versionsResponse = await fetch(`${DDRAGON_BASE}/api/versions.json`);
      const versions = await versionsResponse.json();
      const latestVersion = versions[0];
      setDdragonVersion(latestVersion);

      const metadataKey = `champions:${latestVersion}`;
      const cachedMapping = await getMetadata(metadataKey);

      if (cachedMapping?.value) {
        setChampionsById(cachedMapping.value);
      } else {
        const championResponse = await fetch(
          `${DDRAGON_BASE}/cdn/${latestVersion}/data/en_US/champion.json`,
        );
        const championData = await championResponse.json();
        const mapped = Object.values(championData.data ?? {}).reduce((acc, champion) => {
          acc[Number(champion.key)] = {
            id: champion.id,
            name: champion.name,
            image: champion.image?.full ?? `${champion.id}.png`,
          };
          return acc;
        }, {});

        await setMetadata(metadataKey, mapped);
        setChampionsById(mapped);
      }
    } catch (initializationError) {
      setError(initializationError.message);
    }

    try {
      const patch = await window.leagueReplays.getClientPatch();
      setClientPatch(patch);
      await setMetadata("clientPatch", patch);
    } catch {
      setClientPatch({ fullVersion: null, shortVersion: "LCU Offline" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return useMemo(
    () => ({
      ddragonVersion,
      clientPatch,
      championsById,
      loading,
      error,
      refresh: initialize,
    }),
    [ddragonVersion, clientPatch, championsById, loading, error, initialize],
  );
}

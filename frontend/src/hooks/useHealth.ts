import { useCallback, useEffect, useState } from "react";
import { getHealth } from "../services/api";
import type { AsyncState, HealthResponse } from "../types";

export function useHealth() {
  const [state, setState] = useState<AsyncState>("idle");
  const [data, setData] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setState("loading");
    setError(null);
    try {
      const health = await getHealth();
      setData(health);
      setState("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reach the API");
      setState("error");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { state, data, error, refresh };
}

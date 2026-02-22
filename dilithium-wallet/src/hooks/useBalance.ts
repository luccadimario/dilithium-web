import { useCallback, useEffect, useRef, useState } from "react";
import { getAddressInfo } from "../lib/api/node-client";
import type { AddressInfo } from "../lib/api/types";

export function useBalance(address: string | null) {
  const [data, setData] = useState<AddressInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const failCount = useRef(0);

  const refresh = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const info = await getAddressInfo(address);
      setData(info);
      setError(null);
      failCount.current = 0;
    } catch (err) {
      failCount.current++;
      setError(err instanceof Error ? err.message : "Failed to fetch balance");
      // On first failure, set a default so the UI isn't stuck loading
      if (!data) {
        setData({
          address,
          balance: 0,
          transaction_count: 0,
          transactions: [],
        });
      }
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [address, data]);

  useEffect(() => {
    refresh();
    // Poll every 30s normally, back off to 60s after 3 failures
    const interval = setInterval(
      refresh,
      failCount.current >= 3 ? 60_000 : 30_000
    );
    return () => clearInterval(interval);
  }, [refresh]);

  return { data, loading: initialLoad && loading, error, refresh };
}

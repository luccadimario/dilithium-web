import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getAddressInfo } from "../lib/api/node-client";
import type { AddressInfo } from "../lib/api/types";

interface BalanceContextType {
  data: AddressInfo | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const BalanceContext = createContext<BalanceContextType>({
  data: null,
  loading: false,
  error: null,
  refresh: async () => {},
});

export function BalanceProvider({
  address,
  children,
}: {
  address: string | null;
  children: ReactNode;
}) {
  const [data, setData] = useState<AddressInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const failCount = useRef(0);
  const dataRef = useRef(data);
  dataRef.current = data;

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
      if (!dataRef.current) {
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
  }, [address]);

  useEffect(() => {
    if (!address) return;
    setData(null);
    setInitialLoad(true);
    failCount.current = 0;
    refresh();

    const interval = setInterval(refresh, 10_000);
    return () => clearInterval(interval);
  }, [address, refresh]);

  return (
    <BalanceContext.Provider
      value={{ data, loading: initialLoad && loading, error, refresh }}
    >
      {children}
    </BalanceContext.Provider>
  );
}

export function useBalanceContext(): BalanceContextType {
  return useContext(BalanceContext);
}

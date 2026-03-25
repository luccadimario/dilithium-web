'use client';

import { useQuery } from '@tanstack/react-query';
import { API_BASE } from './useExchangeAuth';

export interface OrderBookLevel {
  price: number;
  amount: number;
}

export interface OrderBookSnapshot {
  pair: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
}

export function useOrderBook(pair: string) {
  return useQuery<OrderBookSnapshot>({
    queryKey: ['orderbook', pair],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/orderbook?pair=${pair}`);
      const json = await res.json();
      return json.data ?? { pair, bids: [], asks: [] };
    },
    refetchInterval: 2000,
    staleTime: 1000,
  });
}

export function useTrades(pair: string) {
  return useQuery({
    queryKey: ['trades', pair],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/trades?pair=${pair}&limit=30`);
      const json = await res.json();
      return json.data ?? [];
    },
    refetchInterval: 3000,
    staleTime: 2000,
  });
}

export function useTicker(pair: string) {
  return useQuery({
    queryKey: ['ticker', pair],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/ticker?pair=${pair}`);
      const json = await res.json();
      return json.data ?? {};
    },
    refetchInterval: 5000,
    staleTime: 2000,
  });
}

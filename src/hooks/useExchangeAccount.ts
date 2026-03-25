'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE, authHeader } from './useExchangeAuth';

export function useExchangeAccount(token: string | null) {
  return useQuery({
    queryKey: ['account', token],
    enabled: !!token,
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/account`, {
        headers: authHeader(token),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data ?? null;
    },
    refetchInterval: 5000,
  });
}

export function useDepositAddress(token: string | null, currency: 'eth' | 'btc' | 'dlt') {
  return useQuery({
    queryKey: ['deposit', currency, token],
    enabled: !!token,
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/deposit/${currency}`, {
        headers: authHeader(token),
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data ?? null;
    },
    staleTime: 60_000, // deposit addresses don't change
  });
}

export function useUserOrders(token: string | null) {
  return useQuery({
    queryKey: ['orders', token],
    enabled: !!token,
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/orders`, {
        headers: authHeader(token),
      });
      if (!res.ok) return [];
      const json = await res.json();
      return json.data ?? [];
    },
    refetchInterval: 3000,
  });
}

export function useCancelOrder(token: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: number) => {
      const res = await fetch(`${API_BASE}/order/${orderId}`, {
        method: 'DELETE',
        headers: authHeader(token),
      });
      if (!res.ok) throw new Error('Failed to cancel order');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['account'] });
    },
  });
}

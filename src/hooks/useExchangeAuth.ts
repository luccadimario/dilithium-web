'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useSignMessage, useDisconnect } from 'wagmi';

const STORAGE_KEY = 'exchange_jwt';
const API_BASE = process.env.NEXT_PUBLIC_EXCHANGE_API_URL ?? '/api';

export function useExchangeAuth() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load stored token on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setToken(stored);
    }
  }, []);

  // Clear token when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      setToken(null);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [isConnected]);

  const authenticate = useCallback(async () => {
    if (!address) return;
    setIsAuthenticating(true);
    setError(null);

    try {
      // 1. Get SIWE challenge
      const challengeRes = await fetch(`${API_BASE}/auth/challenge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      if (!challengeRes.ok) throw new Error('Failed to get challenge');
      const { data: { message } } = await challengeRes.json();

      // 2. Sign the SIWE message with the connected wallet
      const signature = await signMessageAsync({ message });

      // 3. Verify signature with backend
      const verifyRes = await fetch(`${API_BASE}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, signature }),
      });
      if (!verifyRes.ok) throw new Error('Signature verification failed');
      const { data: { token: jwt } } = await verifyRes.json();

      localStorage.setItem(STORAGE_KEY, jwt);
      setToken(jwt);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setError(msg);
    } finally {
      setIsAuthenticating(false);
    }
  }, [address, signMessageAsync]);

  const signOut = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    disconnect();
  }, [disconnect]);

  return {
    token,
    isAuthenticated: !!token,
    isAuthenticating,
    error,
    authenticate,
    signOut,
  };
}

export function authHeader(token: string | null): HeadersInit {
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export { API_BASE };

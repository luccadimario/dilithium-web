import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { loadWasm, isWasmReady } from "../lib/crypto/wasm-bridge";
import * as wasm from "../lib/crypto/wasm-bridge";
import { encrypt, decrypt } from "../lib/crypto/encryption";
import {
  saveWallet,
  getAllWallets,
  deleteWallet as dbDeleteWallet,
  getActiveWalletId,
  setActiveWalletId,
  getWallet,
} from "../lib/storage/wallet-db";
import type { StoredWallet } from "../lib/storage/types";

interface WalletState {
  loading: boolean;
  wasmReady: boolean;
  wallets: StoredWallet[];
  activeWallet: StoredWallet | null;
  unlocked: boolean;
  privateKey: Uint8Array | null;
}

interface WalletActions {
  createWallet: (password: string) => Promise<{ mnemonic: string; address: string }>;
  importWallet: (mnemonic: string, password: string) => Promise<string>;
  unlock: (password: string) => Promise<void>;
  lock: () => void;
  switchWallet: (id: string) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
  signTransaction: (txData: string) => string;
  getPublicKeyHex: () => string;
}

type WalletContextType = WalletState & WalletActions;

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>({
    loading: true,
    wasmReady: false,
    wallets: [],
    activeWallet: null,
    unlocked: false,
    privateKey: null,
  });

  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const privateKeyRef = useRef<Uint8Array | null>(null);

  // Initialize WASM + load stored wallets
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadWasm();
        const wallets = await getAllWallets();
        const activeId = await getActiveWalletId();
        const active = activeId
          ? wallets.find((w) => w.id === activeId) ?? wallets[0] ?? null
          : wallets[0] ?? null;

        if (!cancelled) {
          setState((s) => ({
            ...s,
            loading: false,
            wasmReady: true,
            wallets,
            activeWallet: active,
          }));
        }
      } catch (err) {
        console.error("Wallet init failed:", err);
        if (!cancelled) {
          setState((s) => ({ ...s, loading: false }));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-lock after inactivity
  const resetLockTimer = useCallback(() => {
    if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    if (state.unlocked) {
      lockTimerRef.current = setTimeout(
        () => {
          privateKeyRef.current = null;
          setState((s) => ({ ...s, unlocked: false, privateKey: null }));
        },
        5 * 60 * 1000 // 5 minutes
      );
    }
  }, [state.unlocked]);

  useEffect(() => {
    resetLockTimer();
    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, resetLockTimer));
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetLockTimer));
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    };
  }, [resetLockTimer]);

  const createWallet = useCallback(async (password: string) => {
    if (!isWasmReady()) throw new Error("Crypto not ready");

    const mnemonic = wasm.generateMnemonic();
    const keys = wasm.deriveKeys(mnemonic);
    const pubHex = wasm.publicKeyToHex(keys.publicKey);

    const encryptedKey = await encrypt(keys.privateKey, password);
    const wallet: StoredWallet = {
      id: crypto.randomUUID(),
      address: keys.address,
      checksumAddress: keys.address,
      publicKeyHex: pubHex,
      encryptedPrivateKey: encryptedKey,
      createdAt: Date.now(),
    };

    await saveWallet(wallet);
    await setActiveWalletId(wallet.id);

    privateKeyRef.current = keys.privateKey;
    setState((s) => ({
      ...s,
      wallets: [...s.wallets, wallet],
      activeWallet: wallet,
      unlocked: true,
      privateKey: keys.privateKey,
    }));

    // Zero the keys in the WASM result (keys.privateKey is already stored encrypted)
    return { mnemonic, address: keys.address };
  }, []);

  const importWallet = useCallback(
    async (mnemonic: string, password: string) => {
      if (!isWasmReady()) throw new Error("Crypto not ready");
      if (!wasm.validateMnemonic(mnemonic)) {
        throw new Error("Invalid mnemonic phrase");
      }

      const keys = wasm.deriveKeys(mnemonic);
      const pubHex = wasm.publicKeyToHex(keys.publicKey);

      // Check for duplicate
      const existing = await getAllWallets();
      if (existing.some((w) => w.address === keys.address)) {
        throw new Error("This wallet is already imported");
      }

      const encryptedKey = await encrypt(keys.privateKey, password);
      const wallet: StoredWallet = {
        id: crypto.randomUUID(),
        address: keys.address,
        checksumAddress: keys.address,
        publicKeyHex: pubHex,
        encryptedPrivateKey: encryptedKey,
        createdAt: Date.now(),
      };

      await saveWallet(wallet);
      await setActiveWalletId(wallet.id);

      privateKeyRef.current = keys.privateKey;
      setState((s) => ({
        ...s,
        wallets: [...s.wallets, wallet],
        activeWallet: wallet,
        unlocked: true,
        privateKey: keys.privateKey,
      }));

      return keys.address;
    },
    []
  );

  const unlock = useCallback(
    async (password: string) => {
      if (!state.activeWallet) throw new Error("No wallet selected");

      const wallet = await getWallet(state.activeWallet.id);
      if (!wallet) throw new Error("Wallet not found");

      try {
        const privateKey = await decrypt(wallet.encryptedPrivateKey, password);
        privateKeyRef.current = privateKey;
        setState((s) => ({ ...s, unlocked: true, privateKey }));
      } catch {
        throw new Error("Incorrect password");
      }
    },
    [state.activeWallet]
  );

  const lock = useCallback(() => {
    privateKeyRef.current = null;
    setState((s) => ({ ...s, unlocked: false, privateKey: null }));
  }, []);

  const switchWallet = useCallback(async (id: string) => {
    const wallets = await getAllWallets();
    const wallet = wallets.find((w) => w.id === id);
    if (!wallet) throw new Error("Wallet not found");
    await setActiveWalletId(id);
    privateKeyRef.current = null;
    setState((s) => ({
      ...s,
      activeWallet: wallet,
      unlocked: false,
      privateKey: null,
    }));
  }, []);

  const deleteWalletAction = useCallback(
    async (id: string) => {
      await dbDeleteWallet(id);
      const remaining = state.wallets.filter((w) => w.id !== id);
      const newActive = remaining[0] ?? null;
      if (newActive) await setActiveWalletId(newActive.id);
      privateKeyRef.current = null;
      setState((s) => ({
        ...s,
        wallets: remaining,
        activeWallet: newActive,
        unlocked: false,
        privateKey: null,
      }));
    },
    [state.wallets]
  );

  const signTransaction = useCallback((txData: string) => {
    if (!privateKeyRef.current) throw new Error("Wallet is locked");
    const result = wasm.signMessage(privateKeyRef.current, txData);
    return result.signatureHex;
  }, []);

  const getPublicKeyHex = useCallback(() => {
    if (!state.activeWallet) throw new Error("No wallet");
    return state.activeWallet.publicKeyHex;
  }, [state.activeWallet]);

  return (
    <WalletContext.Provider
      value={{
        ...state,
        createWallet,
        importWallet,
        unlock,
        lock,
        switchWallet,
        deleteWallet: deleteWalletAction,
        signTransaction,
        getPublicKeyHex,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextType {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}

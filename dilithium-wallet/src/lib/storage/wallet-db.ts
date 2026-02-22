import { openDB, type IDBPDatabase } from "idb";
import type { StoredWallet, WalletSettings } from "./types";
import { DEFAULT_SETTINGS } from "./types";

const DB_NAME = "dilithium-wallet";
const DB_VERSION = 1;

let dbInstance: IDBPDatabase | null = null;

async function getDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance;
  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("wallets")) {
        db.createObjectStore("wallets", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings");
      }
      if (!db.objectStoreNames.contains("txcache")) {
        const txStore = db.createObjectStore("txcache", { keyPath: "signature" });
        txStore.createIndex("address", "address", { unique: false });
        txStore.createIndex("timestamp", "timestamp", { unique: false });
      }
    },
  });
  return dbInstance;
}

// Wallet operations
export async function saveWallet(wallet: StoredWallet): Promise<void> {
  const db = await getDB();
  await db.put("wallets", wallet);
}

export async function getWallet(id: string): Promise<StoredWallet | undefined> {
  const db = await getDB();
  return db.get("wallets", id);
}

export async function getAllWallets(): Promise<StoredWallet[]> {
  const db = await getDB();
  return db.getAll("wallets");
}

export async function deleteWallet(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("wallets", id);
}

export async function getActiveWalletId(): Promise<string | null> {
  const db = await getDB();
  return (await db.get("settings", "activeWalletId")) ?? null;
}

export async function setActiveWalletId(id: string): Promise<void> {
  const db = await getDB();
  await db.put("settings", id, "activeWalletId");
}

// Settings
export async function getSettings(): Promise<WalletSettings> {
  const db = await getDB();
  const stored = await db.get("settings", "walletSettings");
  return stored ? { ...DEFAULT_SETTINGS, ...stored } : DEFAULT_SETTINGS;
}

export async function saveSettings(settings: WalletSettings): Promise<void> {
  const db = await getDB();
  await db.put("settings", settings, "walletSettings");
}

// Transaction cache
export interface CachedTransaction {
  signature: string;
  from: string;
  to: string;
  amount: number;
  fee: number;
  timestamp: number;
  data?: string;
  address: string; // which of our addresses this relates to
  blockHeight?: number;
  confirmed: boolean;
}

export async function cacheTransactions(
  txs: CachedTransaction[]
): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("txcache", "readwrite");
  for (const t of txs) {
    await tx.store.put(t);
  }
  await tx.done;
}

export async function getCachedTransactions(
  address: string
): Promise<CachedTransaction[]> {
  const db = await getDB();
  const txs = await db.getAllFromIndex("txcache", "address", address);
  return txs.sort((a, b) => b.timestamp - a.timestamp);
}

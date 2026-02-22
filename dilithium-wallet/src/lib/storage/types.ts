import type { EncryptedBlob } from "../crypto/types";

export interface StoredWallet {
  id: string;
  address: string;
  checksumAddress: string;
  publicKeyHex: string;
  encryptedPrivateKey: EncryptedBlob;
  createdAt: number;
  label?: string;
}

export interface WalletSettings {
  autoLockMinutes: number;
  hideBalance: boolean;
  currency: "DLT";
}

export const DEFAULT_SETTINGS: WalletSettings = {
  autoLockMinutes: 5,
  hideBalance: false,
  currency: "DLT",
};

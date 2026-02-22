export interface KeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
  address: string;
}

export interface SignResult {
  signature: Uint8Array;
  signatureHex: string;
}

export interface EncryptedBlob {
  iv: string; // hex
  salt: string; // hex
  ciphertext: string; // hex
  version: 1;
}

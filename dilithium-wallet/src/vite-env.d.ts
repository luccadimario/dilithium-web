/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/vanillajs" />

interface Window {
  dilithiumGenerateMnemonic: () => { mnemonic?: string; error?: string };
  dilithiumValidateMnemonic: (mnemonic: string) => boolean;
  dilithiumDeriveKeys: (mnemonic: string) => {
    publicKey?: Uint8Array;
    privateKey?: Uint8Array;
    address?: string;
    error?: string;
  };
  dilithiumSign: (
    privateKey: Uint8Array,
    message: string
  ) => { signature?: Uint8Array; signatureHex?: string; error?: string };
  dilithiumChecksumAddress: (rawHex: string) => string;
  dilithiumPublicKeyHex: (publicKey: Uint8Array) => string;
}

let wasmReady = false;
let wasmLoadPromise: Promise<void> | null = null;

export function isWasmReady(): boolean {
  return wasmReady;
}

export async function loadWasm(): Promise<void> {
  if (wasmReady) return;
  if (wasmLoadPromise) return wasmLoadPromise;

  wasmLoadPromise = (async () => {
    // Load wasm_exec.js (Go's WASM runtime)
    const execScript = document.createElement("script");
    execScript.src = `${import.meta.env.BASE_URL}wasm/wasm_exec.js`;
    await new Promise<void>((resolve, reject) => {
      execScript.onload = () => resolve();
      execScript.onerror = () => reject(new Error("Failed to load wasm_exec.js"));
      document.head.appendChild(execScript);
    });

    // Instantiate Go WASM
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const go = new (globalThis as any).Go();
    const result = await WebAssembly.instantiateStreaming(
      fetch(`${import.meta.env.BASE_URL}wasm/crypto.wasm`),
      go.importObject
    );
    go.run(result.instance);

    // Verify all functions are available
    const required = [
      "dilithiumGenerateMnemonic",
      "dilithiumValidateMnemonic",
      "dilithiumDeriveKeys",
      "dilithiumSign",
      "dilithiumChecksumAddress",
      "dilithiumPublicKeyHex",
    ];
    for (const fn of required) {
      if (typeof (window as unknown as Record<string, unknown>)[fn] !== "function") {
        throw new Error(`WASM function ${fn} not available`);
      }
    }

    wasmReady = true;
  })();

  return wasmLoadPromise;
}

export function generateMnemonic(): string {
  if (!wasmReady) throw new Error("WASM not loaded");
  const result = window.dilithiumGenerateMnemonic();
  if (result.error) throw new Error(result.error);
  return result.mnemonic!;
}

export function validateMnemonic(mnemonic: string): boolean {
  if (!wasmReady) throw new Error("WASM not loaded");
  return window.dilithiumValidateMnemonic(mnemonic);
}

export function deriveKeys(mnemonic: string) {
  if (!wasmReady) throw new Error("WASM not loaded");
  const result = window.dilithiumDeriveKeys(mnemonic);
  if (result.error) throw new Error(result.error);
  return {
    publicKey: new Uint8Array(result.publicKey!),
    privateKey: new Uint8Array(result.privateKey!),
    address: result.address!,
  };
}

export function signMessage(privateKey: Uint8Array, message: string) {
  if (!wasmReady) throw new Error("WASM not loaded");
  const result = window.dilithiumSign(privateKey, message);
  if (result.error) throw new Error(result.error);
  return {
    signature: new Uint8Array(result.signature!),
    signatureHex: result.signatureHex!,
  };
}

export function checksumAddress(rawHex: string): string {
  if (!wasmReady) throw new Error("WASM not loaded");
  return window.dilithiumChecksumAddress(rawHex);
}

export function publicKeyToHex(publicKey: Uint8Array): string {
  if (!wasmReady) throw new Error("WASM not loaded");
  return window.dilithiumPublicKeyHex(publicKey);
}

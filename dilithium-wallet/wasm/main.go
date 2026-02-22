package main

import (
	"crypto/sha256"
	"crypto/sha512"
	"encoding/hex"
	"syscall/js"

	"github.com/cloudflare/circl/sign/dilithium/mode3"
	"github.com/tyler-smith/go-bip39"
	"golang.org/x/crypto/hkdf"
	"golang.org/x/crypto/pbkdf2"
)

const hkdfSalt = "dilithium-v1-keypair"

func generateMnemonic(_ js.Value, _ []js.Value) any {
	entropy, err := bip39.NewEntropy(256)
	if err != nil {
		return map[string]any{"error": err.Error()}
	}
	mnemonic, err := bip39.NewMnemonic(entropy)
	if err != nil {
		return map[string]any{"error": err.Error()}
	}
	return map[string]any{"mnemonic": mnemonic}
}

func validateMnemonic(_ js.Value, args []js.Value) any {
	if len(args) < 1 {
		return false
	}
	return bip39.IsMnemonicValid(args[0].String())
}

func deriveKeys(_ js.Value, args []js.Value) any {
	if len(args) < 1 {
		return map[string]any{"error": "mnemonic required"}
	}
	mnemonic := args[0].String()

	seed := pbkdf2.Key([]byte(mnemonic), []byte("mnemonic"), 2048, 64, sha512.New)
	reader := hkdf.New(sha256.New, seed, []byte(hkdfSalt), nil)

	pubKey, privKey, err := mode3.GenerateKey(reader)
	if err != nil {
		return map[string]any{"error": err.Error()}
	}

	pubBytes, _ := pubKey.MarshalBinary()
	privBytes, _ := privKey.MarshalBinary()

	pubArray := js.Global().Get("Uint8Array").New(len(pubBytes))
	js.CopyBytesToJS(pubArray, pubBytes)

	privArray := js.Global().Get("Uint8Array").New(len(privBytes))
	js.CopyBytesToJS(privArray, privBytes)

	hash := sha256.Sum256(pubBytes)
	address := hex.EncodeToString(hash[:])[:40]

	return map[string]any{
		"publicKey":  pubArray,
		"privateKey": privArray,
		"address":    address,
	}
}

func sign(_ js.Value, args []js.Value) any {
	if len(args) < 2 {
		return map[string]any{"error": "privateKey and message required"}
	}

	privKeyJS := args[0]
	privBytes := make([]byte, privKeyJS.Get("length").Int())
	js.CopyBytesToGo(privBytes, privKeyJS)

	var privKey mode3.PrivateKey
	if err := privKey.UnmarshalBinary(privBytes); err != nil {
		return map[string]any{"error": "invalid private key: " + err.Error()}
	}

	message := args[1].String()
	sig := make([]byte, mode3.SignatureSize)
	mode3.SignTo(&privKey, []byte(message), sig)

	sigArray := js.Global().Get("Uint8Array").New(len(sig))
	js.CopyBytesToJS(sigArray, sig)

	return map[string]any{
		"signature":    sigArray,
		"signatureHex": hex.EncodeToString(sig),
	}
}

func checksumAddress(_ js.Value, args []js.Value) any {
	if len(args) < 1 {
		return ""
	}
	rawHex := args[0].String()
	hash := sha256.Sum256([]byte("dlt1" + rawHex))
	checksum := hex.EncodeToString(hash[:])[:4]
	return "dlt1" + rawHex + checksum
}

func publicKeyHex(_ js.Value, args []js.Value) any {
	if len(args) < 1 {
		return ""
	}
	pubKeyJS := args[0]
	pubBytes := make([]byte, pubKeyJS.Get("length").Int())
	js.CopyBytesToGo(pubBytes, pubKeyJS)
	return hex.EncodeToString(pubBytes)
}

func main() {
	js.Global().Set("dilithiumGenerateMnemonic", js.FuncOf(generateMnemonic))
	js.Global().Set("dilithiumValidateMnemonic", js.FuncOf(validateMnemonic))
	js.Global().Set("dilithiumDeriveKeys", js.FuncOf(deriveKeys))
	js.Global().Set("dilithiumSign", js.FuncOf(sign))
	js.Global().Set("dilithiumChecksumAddress", js.FuncOf(checksumAddress))
	js.Global().Set("dilithiumPublicKeyHex", js.FuncOf(publicKeyHex))

	// Block forever — WASM must stay alive
	select {}
}

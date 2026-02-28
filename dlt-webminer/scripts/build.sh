#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
WASM_DIR="$PROJECT_DIR/wasm-miner"
WEB_DIR="$PROJECT_DIR/web"

echo "[*] Building WASM miner..."
cd "$WASM_DIR"

# Build with wasm-pack targeting web (ES modules, no bundler needed)
wasm-pack build --target web --release --out-dir "$WASM_DIR/pkg"

echo "[*] Copying WASM artifacts to web directory..."
cp "$WASM_DIR/pkg/dlt_webminer_bg.wasm" "$WEB_DIR/dlt_webminer_bg.wasm"
cp "$WASM_DIR/pkg/dlt_webminer.js" "$WEB_DIR/dlt_webminer.js"

echo "[+] Build complete!"
echo "    WASM: $WEB_DIR/dlt_webminer_bg.wasm"
echo "    JS:   $WEB_DIR/dlt_webminer.js"
echo ""
echo "To serve locally with required headers:"
echo "    cd $WEB_DIR && python3 -c \""
echo "import http.server, functools"
echo "class H(http.server.SimpleHTTPRequestHandler):"
echo "    def end_headers(self):"
echo "        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')"
echo "        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')"
echo "        self.send_header('Cross-Origin-Resource-Policy', 'cross-origin')"
echo "        super().end_headers()"
echo "http.server.HTTPServer(('', 8080), H).serve_forever()"
echo "\""

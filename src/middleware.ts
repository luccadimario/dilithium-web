import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const MINER_HOST = "miner.dilithiumcoin.com";

// Headers required for SharedArrayBuffer (WASM threading)
const COOP_COEP_HEADERS: Record<string, string> = {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "require-corp",
};

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".wasm": "application/wasm",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

function getMimeType(pathname: string): string | undefined {
  const ext = pathname.substring(pathname.lastIndexOf("."));
  return MIME_TYPES[ext];
}

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host")?.split(":")[0] ?? "";

  if (hostname !== MINER_HOST) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // Rewrite /api/* → /api/miner-proxy/* so the Next.js API route handles it
  if (pathname.startsWith("/api/")) {
    const proxyPath = pathname.replace(/^\/api/, "/api/miner-proxy");
    const url = request.nextUrl.clone();
    url.pathname = proxyPath;
    return NextResponse.rewrite(url);
  }

  // Serve static miner files directly from the ASSETS binding
  const assetPath = pathname === "/" || pathname === ""
    ? "/miner/index.html"
    : `/miner${pathname}`;

  const { env } = await getCloudflareContext({ async: true });
  const assetUrl = new URL(assetPath, request.url);
  const assetResponse = await env.ASSETS!.fetch(assetUrl.toString());

  if (!assetResponse.ok) {
    // Fallback: serve index.html for SPA-style routing
    const fallbackUrl = new URL("/miner/index.html", request.url);
    const fallbackResponse = await env.ASSETS!.fetch(fallbackUrl.toString());
    const headers = new Headers(fallbackResponse.headers);
    headers.set("Content-Type", "text/html; charset=utf-8");
    for (const [key, value] of Object.entries(COOP_COEP_HEADERS)) {
      headers.set(key, value);
    }
    return new NextResponse(fallbackResponse.body, {
      status: fallbackResponse.status,
      headers,
    });
  }

  const headers = new Headers(assetResponse.headers);
  const mime = getMimeType(assetPath);
  if (mime) {
    headers.set("Content-Type", mime);
  }
  for (const [key, value] of Object.entries(COOP_COEP_HEADERS)) {
    headers.set(key, value);
  }

  return new NextResponse(assetResponse.body, {
    status: assetResponse.status,
    headers,
  });
}

export const config = {
  matcher: [
    // Match all paths except Next.js internals
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

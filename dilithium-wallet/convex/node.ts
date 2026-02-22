import { httpAction } from "./_generated/server";

// Seed nodes — same list the CLI uses for discovery.
// Probed in order; first healthy response wins per request.
const SEED_NODES = [
  "http://seed.dilithiumcoin.com:8001",
  "http://seed1.dilithiumcoin.com:8001",
  "http://seed2.dilithiumcoin.com:8001",
  "http://seed3.dilithiumcoin.com:8001",
  "http://seed4.dilithiumcoin.com:8001",
  "http://seed5.dilithiumcoin.com:8001",
  "http://node1.dilithiumcoin.com:8001",
  "http://node2.dilithiumcoin.com:8001",
];

// In-memory cache of the best known node (Convex HTTP actions are
// short-lived, but within a single deployment the module scope persists).
let cachedNode: { url: string; height: number; ts: number } | null = null;
const CACHE_TTL_MS = 60_000; // re-discover every 60 seconds

/**
 * Discover the best reachable node by probing /status on each seed.
 * Picks the node with the highest blockchain_height.
 * Returns the base URL (e.g. "http://seed2.dilithiumcoin.com:8001").
 */
async function discoverNode(): Promise<string> {
  // Return cached node if fresh
  if (cachedNode && Date.now() - cachedNode.ts < CACHE_TTL_MS) {
    return cachedNode.url;
  }

  // Probe all seeds concurrently with a 4-second timeout each
  const results = await Promise.allSettled(
    SEED_NODES.map(async (url) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      try {
        const res = await fetch(`${url}/status`, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as {
          blockchain_height?: number;
        };
        return {
          url,
          height: data.blockchain_height ?? 0,
        };
      } finally {
        clearTimeout(timer);
      }
    })
  );

  // Pick the node with the highest chain height
  let best: { url: string; height: number } | null = null;
  for (const r of results) {
    if (r.status === "fulfilled") {
      if (!best || r.value.height > best.height) {
        best = r.value;
      }
    }
  }

  if (!best) {
    throw new Error("All seed nodes unreachable");
  }

  cachedNode = { ...best, ts: Date.now() };
  return best.url;
}

/**
 * Fetch from the best available node.  Falls back through seeds if the
 * cached node goes down mid-request.
 */
async function fetchFromNode(
  path: string,
  init?: RequestInit
): Promise<Response> {
  const nodeUrl = await discoverNode();
  try {
    return await fetch(`${nodeUrl}${path}`, init);
  } catch {
    // Cached node failed — invalidate and retry once with fresh discovery
    cachedNode = null;
    const freshUrl = await discoverNode();
    return await fetch(`${freshUrl}${path}`, init);
  }
}

// ──────────────────────────────────────────────
// HTTP action handlers
// ──────────────────────────────────────────────

// Proxy: GET /api/address?addr=...
export const getAddress = httpAction(async (_ctx, request) => {
  const url = new URL(request.url);
  const addr = url.searchParams.get("addr");

  if (!addr || !/^[a-f0-9]{40}$/i.test(addr)) {
    return new Response(JSON.stringify({ error: "Invalid address" }), {
      status: 400,
      headers: corsHeaders(),
    });
  }

  try {
    const res = await fetchFromNode(
      `/explorer/address?addr=${encodeURIComponent(addr)}`
    );
    const json = await res.json() as Record<string, unknown>;
    // Node wraps in { success, message, data } — unwrap for the client
    const payload = json.data ?? json;
    return new Response(JSON.stringify(payload), {
      status: res.status,
      headers: corsHeaders("application/json"),
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "No reachable nodes" }),
      { status: 502, headers: corsHeaders() }
    );
  }
});

// Proxy: GET /api/status
export const getStatus = httpAction(async () => {
  try {
    const res = await fetchFromNode("/status");
    const json = await res.json() as Record<string, unknown>;
    const payload = json.data ?? json;
    return new Response(JSON.stringify(payload), {
      status: res.status,
      headers: corsHeaders("application/json"),
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "No reachable nodes" }),
      { status: 502, headers: corsHeaders() }
    );
  }
});

// Proxy: POST /api/transaction
// For sends we broadcast to ALL reachable nodes (same as CLI multi-submit)
export const submitTransaction = httpAction(async (_ctx, request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  try {
    const body = await request.text();

    // Basic validation
    const tx = JSON.parse(body);
    if (!tx.from || !tx.to || !tx.amount || !tx.signature || !tx.public_key) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: corsHeaders() }
      );
    }

    // Submit to best node
    const res = await fetchFromNode("/transaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    const json = await res.json() as Record<string, unknown>;
    const data = JSON.stringify(json.data ?? json);

    // Also fan-out to other reachable nodes (fire-and-forget)
    fanOutTransaction(body);

    return new Response(data, {
      status: res.status,
      headers: corsHeaders("application/json"),
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "Transaction submission failed" }),
      { status: 502, headers: corsHeaders() }
    );
  }
});

/**
 * Fire-and-forget broadcast to all other seed nodes for faster propagation.
 */
function fanOutTransaction(body: string) {
  for (const url of SEED_NODES) {
    if (cachedNode && url === cachedNode.url) continue; // already sent to primary
    fetch(`${url}/transaction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    }).catch(() => {}); // ignore failures
  }
}

// Proxy: GET /api/mempool
export const getMempool = httpAction(async () => {
  try {
    const res = await fetchFromNode("/mempool");
    const json = await res.json() as Record<string, unknown>;
    const payload = json.data ?? json;
    return new Response(JSON.stringify(payload), {
      status: res.status,
      headers: corsHeaders("application/json"),
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "No reachable nodes" }),
      { status: 502, headers: corsHeaders() }
    );
  }
});

// CORS preflight handler
export const corsPreflightHandler = httpAction(async () => {
  return new Response(null, { status: 204, headers: corsHeaders() });
});

function corsHeaders(contentType?: string): HeadersInit {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
  if (contentType) {
    headers["Content-Type"] = contentType;
  }
  return headers;
}

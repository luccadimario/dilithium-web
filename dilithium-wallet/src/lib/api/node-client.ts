import type {
  AddressInfo,
  NodeStatus,
  SendTransactionRequest,
  SendTransactionResponse,
} from "./types";

// We proxy through Convex HTTP actions to avoid CORS issues
// and to keep the node IP abstracted from the client.
// In development, we can also hit the node directly.
const CONVEX_SITE_URL = import.meta.env.VITE_CONVEX_SITE_URL ?? "";

async function fetchNode<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${CONVEX_SITE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    // Try to extract a clean message from the node's JSON error response
    try {
      const json = JSON.parse(text);
      if (json.message) throw new Error(json.message);
    } catch (e) {
      if (e instanceof Error && e.message !== text) throw e;
    }
    throw new Error(text || `Request failed (${res.status})`);
  }

  return res.json();
}

export async function getAddressInfo(address: string): Promise<AddressInfo> {
  return fetchNode<AddressInfo>(`/api/address?addr=${encodeURIComponent(address)}`);
}

export async function getNodeStatus(): Promise<NodeStatus> {
  return fetchNode<NodeStatus>("/api/status");
}

export async function sendTransaction(
  tx: SendTransactionRequest
): Promise<SendTransactionResponse> {
  return fetchNode<SendTransactionResponse>("/api/transaction", {
    method: "POST",
    body: JSON.stringify(tx),
  });
}

export async function getMempool(): Promise<{ transactions: SendTransactionRequest[] }> {
  return fetchNode("/api/mempool");
}

export interface AddressInfo {
  address: string;
  balance: number;
  transaction_count: number;
  transactions: NodeTransaction[];
}

export interface NodeTransaction {
  from: string;
  to: string;
  amount: number;
  amount_dlt?: string;
  fee?: number;
  timestamp: number;
  signature: string;
  public_key?: string;
  data?: string;
  block_index?: number;
  block_hash?: string;
}

export interface NodeStatus {
  blockchain_height: number;
  mempool_size: number;
  peer_count: number;
  version: string;
  network: string;
  synced: boolean;
}

export interface SendTransactionRequest {
  from: string;
  to: string;
  amount: number;
  fee: number;
  timestamp: number;
  signature: string;
  public_key: string;
  data?: string;
}

export interface SendTransactionResponse {
  success: boolean;
  message?: string;
  signature?: string;
}

export const DLT_UNIT = 100_000_000;
export const MIN_FEE = 10_000; // 0.0001 DLT
export const NETWORK_NAME = "dilithium-mainnet";

export function formatDLT(baseUnits: number): string {
  const dlt = baseUnits / DLT_UNIT;
  if (dlt === 0) return "0";
  if (dlt < 0.0001) return "< 0.0001";
  return dlt.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8,
  });
}

export function parseDLT(dltString: string): number {
  const parsed = parseFloat(dltString);
  if (isNaN(parsed) || parsed < 0) return 0;
  return Math.round(parsed * DLT_UNIT);
}

export function truncateAddress(addr: string, chars = 8): string {
  if (addr.length <= chars * 2 + 3) return addr;
  return `${addr.slice(0, chars)}...${addr.slice(-chars)}`;
}

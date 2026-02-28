// Transaction Builder — produces byte-identical JSON to Go's json.Marshal.
//
// Critical: field order and omitempty semantics must match Go exactly:
//   Transaction: from, to, amount, fee(omitempty), data(omitempty), timestamp, signature, public_key(omitempty)
//   Block: Index, Timestamp, transactions, MerkleRoot(omitempty), PreviousHash, Hash, Nonce, Difficulty, DifficultyBits(omitempty)

const DLT_UNIT = 100000000; // 1 DLT = 100,000,000 base units
const HALVING_INTERVAL = 250000;
const INITIAL_REWARD = 50 * DLT_UNIT; // 5,000,000,000

/**
 * Compute block reward for a given height, matching Go's GetBlockReward.
 */
export function getBlockReward(height) {
    const halvings = Math.floor(height / HALVING_INTERVAL);
    if (halvings >= 64) return 0;
    let reward = INITIAL_REWARD;
    for (let i = 0; i < halvings; i++) {
        reward = Math.floor(reward / 2);
    }
    if (reward < 1) return 0;
    return reward;
}

/**
 * Serialize a transaction to JSON matching Go's json.Marshal exactly.
 * Handles omitempty for fee, data, and public_key.
 */
export function transactionToJSON(tx) {
    const obj = {
        from: tx.from,
        to: tx.to,
        amount: tx.amount,
    };
    // fee: omitempty (0 is Go's zero value for int64)
    if (tx.fee && tx.fee !== 0) {
        obj.fee = tx.fee;
    }
    // data: omitempty (empty string is Go's zero value)
    if (tx.data && tx.data !== '') {
        obj.data = tx.data;
    }
    obj.timestamp = tx.timestamp;
    obj.signature = tx.signature;
    // public_key: omitempty
    if (tx.public_key && tx.public_key !== '') {
        obj.public_key = tx.public_key;
    }
    return JSON.stringify(obj);
}

/**
 * Build a coinbase transaction matching Go's format.
 */
export function buildCoinbaseTx(minerAddress, blockIndex, reward, totalFees) {
    const now = Math.floor(Date.now() / 1000);
    // Use high-resolution timer for nanos portion of signature (match Go's UnixNano)
    const nanos = Date.now() * 1000000; // millisecond precision * 10^6
    return {
        from: 'SYSTEM',
        to: minerAddress,
        amount: reward + totalFees,
        fee: 0,
        data: '',
        timestamp: now,
        signature: `coinbase-${blockIndex}-${nanos}`,
        public_key: '',
    };
}

/**
 * Serialize a block to JSON matching Go's json.Marshal.
 */
export function blockToJSON(block) {
    const obj = {
        Index: block.Index,
        Timestamp: block.Timestamp,
        transactions: block.transactions.map(tx => {
            const o = { from: tx.from, to: tx.to, amount: tx.amount };
            if (tx.fee && tx.fee !== 0) o.fee = tx.fee;
            if (tx.data && tx.data !== '') o.data = tx.data;
            o.timestamp = tx.timestamp;
            o.signature = tx.signature;
            if (tx.public_key && tx.public_key !== '') o.public_key = tx.public_key;
            return o;
        }),
    };
    if (block.MerkleRoot && block.MerkleRoot !== '') {
        obj.MerkleRoot = block.MerkleRoot;
    }
    obj.PreviousHash = block.PreviousHash;
    obj.Hash = block.Hash;
    obj.Nonce = block.Nonce;
    obj.Difficulty = block.Difficulty;
    if (block.DifficultyBits && block.DifficultyBits !== 0) {
        obj.DifficultyBits = block.DifficultyBits;
    }
    return JSON.stringify(obj);
}

/**
 * Format base units as human-readable DLT string.
 */
export function formatDLT(amount) {
    const whole = Math.floor(amount / DLT_UNIT);
    let frac = amount % DLT_UNIT;
    if (frac < 0) frac = -frac;
    return `${whole}.${frac.toString().padStart(8, '0')}`;
}

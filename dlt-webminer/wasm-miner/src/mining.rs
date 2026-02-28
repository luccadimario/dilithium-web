/// Mining loop — batch nonce search with midstate optimization.
/// Ported from dilithiumcoin/cmd/dilithium-cpu-gpu-miner/worker.go

use crate::sha256::mine_hash_check;
use crate::utils::{write_i64, hash_to_hex};

/// Result of a successful mine_batch call.
pub struct MiningResult {
    pub nonce: i64,
    pub hash_hex: String,
}

/// Mine a batch of nonces, returning the first that meets difficulty.
///
/// Parameters:
/// - h: midstate hash values (8 x u32)
/// - prefix_tail: remaining prefix bytes after midstate boundary
/// - suffix: difficulty string bytes
/// - start_nonce: first nonce to try
/// - stride: increment between nonces (for multi-worker distribution)
/// - batch_size: how many nonces to try in this batch
/// - diff_bits: required number of leading zero bits
/// - midstate_len: number of bytes already processed into the midstate
///
/// Returns Some(MiningResult) if a valid nonce is found, None otherwise.
#[inline(never)]
pub fn mine_batch(
    h: [u32; 8],
    prefix_tail: &[u8],
    suffix: &[u8],
    start_nonce: i64,
    stride: i64,
    batch_size: u32,
    diff_bits: u32,
    midstate_len: u64,
) -> Option<MiningResult> {
    // Pre-allocate stack buffers for zero-allocation hot loop
    let mut nonce_buf = [0u8; 20];
    // remaining = prefix_tail + nonce_decimal + suffix
    // Max size: prefix_tail (< 64) + nonce (up to 20 digits) + suffix (< 20) = ~104 bytes
    let mut remaining = [0u8; 256];

    let tail_len = prefix_tail.len();
    let suffix_len = suffix.len();

    // Copy prefix_tail once (it doesn't change per nonce)
    remaining[..tail_len].copy_from_slice(prefix_tail);

    let mut nonce = start_nonce;

    for _ in 0..batch_size {
        // Write nonce as decimal string
        let nonce_len = write_i64(&mut nonce_buf, nonce);

        // Build remaining: prefix_tail + nonce + suffix
        let total_rem_len = tail_len + nonce_len + suffix_len;
        remaining[tail_len..tail_len + nonce_len].copy_from_slice(&nonce_buf[..nonce_len]);
        remaining[tail_len + nonce_len..total_rem_len].copy_from_slice(suffix);

        // Compute hash from midstate + remaining, check difficulty on u32 words.
        // Serialization to [u8;32] only happens if difficulty check passes (~0.01% of hashes).
        if let Some(hash) = mine_hash_check(h, &remaining[..total_rem_len], midstate_len, diff_bits) {
            return Some(MiningResult {
                nonce,
                hash_hex: hash_to_hex(&hash),
            });
        }

        nonce += stride;
    }

    None
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::sha256::compute_midstate;

    #[test]
    fn test_mine_batch_basic() {
        // Construct a block data string where we know nonce=0 won't meet difficulty 256
        let prefix = b"12345678901234567890test_prefix_data_here_prev_hash_abcdef";
        let suffix = b"6"; // difficulty

        let (state, tail) = compute_midstate(prefix);

        // This should not find a solution at difficulty 256 in 100 attempts
        let result = mine_batch(
            state.h,
            &tail,
            suffix,
            0,    // start_nonce
            1,    // stride
            100,  // batch_size
            256,  // impossible difficulty
            state.len,
        );
        assert!(result.is_none());
    }

    #[test]
    fn test_mine_batch_finds_solution_at_zero_difficulty() {
        let prefix = b"test";
        let suffix = b"1";
        let (state, tail) = compute_midstate(prefix);

        // Difficulty 0 = any hash matches
        let result = mine_batch(
            state.h,
            &tail,
            suffix,
            0,
            1,
            1,
            0, // zero difficulty
            state.len,
        );
        assert!(result.is_some());
        assert_eq!(result.unwrap().nonce, 0);
    }
}

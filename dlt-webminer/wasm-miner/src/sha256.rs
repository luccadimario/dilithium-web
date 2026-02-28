/// Custom SHA-256 implementation with midstate support for mining.
/// Ported from dilithiumcoin/cmd/dilithium-cpu-gpu-miner/sha256.go
///
/// The midstate optimization pre-computes SHA-256 state for the fixed prefix
/// of block data, then only processes the variable nonce + suffix per attempt.

// SHA-256 round constants are inlined directly into the unrolled compression
// rounds via the sha256_round! macro for maximum performance.

/// SHA-256 initial hash values (IV)
pub const INIT_H: [u32; 8] = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
];

#[inline(always)]
fn rotr(x: u32, n: u32) -> u32 {
    (x >> n) | (x << (32 - n))
}

/// Load a big-endian u32 from a byte slice at offset `i*4`.
#[inline(always)]
fn load_be32(block: &[u8], i: usize) -> u32 {
    let off = i * 4;
    (block[off] as u32) << 24
        | (block[off + 1] as u32) << 16
        | (block[off + 2] as u32) << 8
        | (block[off + 3] as u32)
}

/// sigma0 for message schedule expansion
#[inline(always)]
fn sigma0(x: u32) -> u32 {
    rotr(x, 7) ^ rotr(x, 18) ^ (x >> 3)
}

/// sigma1 for message schedule expansion
#[inline(always)]
fn sigma1(x: u32) -> u32 {
    rotr(x, 17) ^ rotr(x, 19) ^ (x >> 10)
}

/// Macro for one SHA-256 compression round. Avoids indexing K256/w by loop
/// variable -- all constants are inlined by the compiler.
macro_rules! sha256_round {
    ($a:expr, $b:expr, $c:expr, $d:expr, $e:expr, $f:expr, $g:expr, $h:expr, $k:expr, $w:expr) => {{
        let s1 = rotr($e, 6) ^ rotr($e, 11) ^ rotr($e, 25);
        let ch = ($e & $f) ^ (!$e & $g);
        let temp1 = $h
            .wrapping_add(s1)
            .wrapping_add(ch)
            .wrapping_add($k)
            .wrapping_add($w);
        let s0 = rotr($a, 2) ^ rotr($a, 13) ^ rotr($a, 22);
        let maj = ($a & $b) ^ ($a & $c) ^ ($b & $c);
        let temp2 = s0.wrapping_add(maj);
        $d = $d.wrapping_add(temp1);
        $h = temp1.wrapping_add(temp2);
    }};
}

/// Macro to expand one message schedule word: w[i] = sigma1(w[i-2]) + w[i-7] + sigma0(w[i-15]) + w[i-16]
macro_rules! schedule {
    ($w:ident, $i:expr) => {
        $w[$i] = sigma1($w[$i - 2])
            .wrapping_add($w[$i - 7])
            .wrapping_add(sigma0($w[$i - 15]))
            .wrapping_add($w[$i - 16])
    };
}

/// Process a single 64-byte block through SHA-256 compression.
/// Fully unrolled for maximum WASM performance.
#[inline(always)]
pub fn sha256_block(h: &mut [u32; 8], block: &[u8]) {
    debug_assert!(block.len() >= 64);

    // Load message schedule from block (big-endian) -- 16 words
    let mut w = [0u32; 64];
    w[0]  = load_be32(block, 0);
    w[1]  = load_be32(block, 1);
    w[2]  = load_be32(block, 2);
    w[3]  = load_be32(block, 3);
    w[4]  = load_be32(block, 4);
    w[5]  = load_be32(block, 5);
    w[6]  = load_be32(block, 6);
    w[7]  = load_be32(block, 7);
    w[8]  = load_be32(block, 8);
    w[9]  = load_be32(block, 9);
    w[10] = load_be32(block, 10);
    w[11] = load_be32(block, 11);
    w[12] = load_be32(block, 12);
    w[13] = load_be32(block, 13);
    w[14] = load_be32(block, 14);
    w[15] = load_be32(block, 15);

    // Extend message schedule -- unrolled
    schedule!(w, 16); schedule!(w, 17); schedule!(w, 18); schedule!(w, 19);
    schedule!(w, 20); schedule!(w, 21); schedule!(w, 22); schedule!(w, 23);
    schedule!(w, 24); schedule!(w, 25); schedule!(w, 26); schedule!(w, 27);
    schedule!(w, 28); schedule!(w, 29); schedule!(w, 30); schedule!(w, 31);
    schedule!(w, 32); schedule!(w, 33); schedule!(w, 34); schedule!(w, 35);
    schedule!(w, 36); schedule!(w, 37); schedule!(w, 38); schedule!(w, 39);
    schedule!(w, 40); schedule!(w, 41); schedule!(w, 42); schedule!(w, 43);
    schedule!(w, 44); schedule!(w, 45); schedule!(w, 46); schedule!(w, 47);
    schedule!(w, 48); schedule!(w, 49); schedule!(w, 50); schedule!(w, 51);
    schedule!(w, 52); schedule!(w, 53); schedule!(w, 54); schedule!(w, 55);
    schedule!(w, 56); schedule!(w, 57); schedule!(w, 58); schedule!(w, 59);
    schedule!(w, 60); schedule!(w, 61); schedule!(w, 62); schedule!(w, 63);

    // Initialize working variables
    let (mut a, mut b, mut c, mut d, mut e, mut f, mut g, mut hv) =
        (h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7]);

    // 64 rounds -- fully unrolled with constants inlined
    // The round macro rotates the register naming, so we alternate the
    // variable positions every round to avoid explicit copies.
    sha256_round!(a, b, c, d, e, f, g, hv, 0x428a2f98, w[0]);
    sha256_round!(hv, a, b, c, d, e, f, g, 0x71374491, w[1]);
    sha256_round!(g, hv, a, b, c, d, e, f, 0xb5c0fbcf, w[2]);
    sha256_round!(f, g, hv, a, b, c, d, e, 0xe9b5dba5, w[3]);
    sha256_round!(e, f, g, hv, a, b, c, d, 0x3956c25b, w[4]);
    sha256_round!(d, e, f, g, hv, a, b, c, 0x59f111f1, w[5]);
    sha256_round!(c, d, e, f, g, hv, a, b, 0x923f82a4, w[6]);
    sha256_round!(b, c, d, e, f, g, hv, a, 0xab1c5ed5, w[7]);

    sha256_round!(a, b, c, d, e, f, g, hv, 0xd807aa98, w[8]);
    sha256_round!(hv, a, b, c, d, e, f, g, 0x12835b01, w[9]);
    sha256_round!(g, hv, a, b, c, d, e, f, 0x243185be, w[10]);
    sha256_round!(f, g, hv, a, b, c, d, e, 0x550c7dc3, w[11]);
    sha256_round!(e, f, g, hv, a, b, c, d, 0x72be5d74, w[12]);
    sha256_round!(d, e, f, g, hv, a, b, c, 0x80deb1fe, w[13]);
    sha256_round!(c, d, e, f, g, hv, a, b, 0x9bdc06a7, w[14]);
    sha256_round!(b, c, d, e, f, g, hv, a, 0xc19bf174, w[15]);

    sha256_round!(a, b, c, d, e, f, g, hv, 0xe49b69c1, w[16]);
    sha256_round!(hv, a, b, c, d, e, f, g, 0xefbe4786, w[17]);
    sha256_round!(g, hv, a, b, c, d, e, f, 0x0fc19dc6, w[18]);
    sha256_round!(f, g, hv, a, b, c, d, e, 0x240ca1cc, w[19]);
    sha256_round!(e, f, g, hv, a, b, c, d, 0x2de92c6f, w[20]);
    sha256_round!(d, e, f, g, hv, a, b, c, 0x4a7484aa, w[21]);
    sha256_round!(c, d, e, f, g, hv, a, b, 0x5cb0a9dc, w[22]);
    sha256_round!(b, c, d, e, f, g, hv, a, 0x76f988da, w[23]);

    sha256_round!(a, b, c, d, e, f, g, hv, 0x983e5152, w[24]);
    sha256_round!(hv, a, b, c, d, e, f, g, 0xa831c66d, w[25]);
    sha256_round!(g, hv, a, b, c, d, e, f, 0xb00327c8, w[26]);
    sha256_round!(f, g, hv, a, b, c, d, e, 0xbf597fc7, w[27]);
    sha256_round!(e, f, g, hv, a, b, c, d, 0xc6e00bf3, w[28]);
    sha256_round!(d, e, f, g, hv, a, b, c, 0xd5a79147, w[29]);
    sha256_round!(c, d, e, f, g, hv, a, b, 0x06ca6351, w[30]);
    sha256_round!(b, c, d, e, f, g, hv, a, 0x14292967, w[31]);

    sha256_round!(a, b, c, d, e, f, g, hv, 0x27b70a85, w[32]);
    sha256_round!(hv, a, b, c, d, e, f, g, 0x2e1b2138, w[33]);
    sha256_round!(g, hv, a, b, c, d, e, f, 0x4d2c6dfc, w[34]);
    sha256_round!(f, g, hv, a, b, c, d, e, 0x53380d13, w[35]);
    sha256_round!(e, f, g, hv, a, b, c, d, 0x650a7354, w[36]);
    sha256_round!(d, e, f, g, hv, a, b, c, 0x766a0abb, w[37]);
    sha256_round!(c, d, e, f, g, hv, a, b, 0x81c2c92e, w[38]);
    sha256_round!(b, c, d, e, f, g, hv, a, 0x92722c85, w[39]);

    sha256_round!(a, b, c, d, e, f, g, hv, 0xa2bfe8a1, w[40]);
    sha256_round!(hv, a, b, c, d, e, f, g, 0xa81a664b, w[41]);
    sha256_round!(g, hv, a, b, c, d, e, f, 0xc24b8b70, w[42]);
    sha256_round!(f, g, hv, a, b, c, d, e, 0xc76c51a3, w[43]);
    sha256_round!(e, f, g, hv, a, b, c, d, 0xd192e819, w[44]);
    sha256_round!(d, e, f, g, hv, a, b, c, 0xd6990624, w[45]);
    sha256_round!(c, d, e, f, g, hv, a, b, 0xf40e3585, w[46]);
    sha256_round!(b, c, d, e, f, g, hv, a, 0x106aa070, w[47]);

    sha256_round!(a, b, c, d, e, f, g, hv, 0x19a4c116, w[48]);
    sha256_round!(hv, a, b, c, d, e, f, g, 0x1e376c08, w[49]);
    sha256_round!(g, hv, a, b, c, d, e, f, 0x2748774c, w[50]);
    sha256_round!(f, g, hv, a, b, c, d, e, 0x34b0bcb5, w[51]);
    sha256_round!(e, f, g, hv, a, b, c, d, 0x391c0cb3, w[52]);
    sha256_round!(d, e, f, g, hv, a, b, c, 0x4ed8aa4a, w[53]);
    sha256_round!(c, d, e, f, g, hv, a, b, 0x5b9cca4f, w[54]);
    sha256_round!(b, c, d, e, f, g, hv, a, 0x682e6ff3, w[55]);

    sha256_round!(a, b, c, d, e, f, g, hv, 0x748f82ee, w[56]);
    sha256_round!(hv, a, b, c, d, e, f, g, 0x78a5636f, w[57]);
    sha256_round!(g, hv, a, b, c, d, e, f, 0x84c87814, w[58]);
    sha256_round!(f, g, hv, a, b, c, d, e, 0x8cc70208, w[59]);
    sha256_round!(e, f, g, hv, a, b, c, d, 0x90befffa, w[60]);
    sha256_round!(d, e, f, g, hv, a, b, c, 0xa4506ceb, w[61]);
    sha256_round!(c, d, e, f, g, hv, a, b, 0xbef9a3f7, w[62]);
    sha256_round!(b, c, d, e, f, g, hv, a, 0xc67178f2, w[63]);

    // After 64 rounds (8 * 8), the variables have rotated back to original positions:
    // a=a, b=b, c=c, d=d, e=e, f=f, g=g, hv=hv
    h[0] = h[0].wrapping_add(a);
    h[1] = h[1].wrapping_add(b);
    h[2] = h[2].wrapping_add(c);
    h[3] = h[3].wrapping_add(d);
    h[4] = h[4].wrapping_add(e);
    h[5] = h[5].wrapping_add(f);
    h[6] = h[6].wrapping_add(g);
    h[7] = h[7].wrapping_add(hv);
}

/// SHA256State holds the intermediate SHA-256 hash state.
#[derive(Clone)]
pub struct Sha256State {
    pub h: [u32; 8],
    pub len: u64, // total bytes processed into this state
}

impl Sha256State {
    /// Create initial SHA-256 state (IV).
    pub fn new() -> Self {
        Sha256State {
            h: INIT_H,
            len: 0,
        }
    }

    /// Feed complete 64-byte blocks into the SHA-256 state.
    /// Only pass data whose length is a multiple of 64.
    pub fn process_blocks(&mut self, mut data: &[u8]) {
        while data.len() >= 64 {
            sha256_block(&mut self.h, &data[..64]);
            self.len += 64;
            data = &data[64..];
        }
    }
}

/// Compute midstate from prefix data.
/// Returns (h[0..8], processed_byte_count, remaining_tail_bytes).
pub fn compute_midstate(prefix: &[u8]) -> (Sha256State, Vec<u8>) {
    let mut state = Sha256State::new();
    let full_blocks = (prefix.len() / 64) * 64;
    if full_blocks > 0 {
        state.process_blocks(&prefix[..full_blocks]);
    }
    let tail = prefix[full_blocks..].to_vec();
    (state, tail)
}

/// Internal: compute SHA-256 from midstate, return the raw u32 state.
/// This avoids serialization overhead -- callers can check difficulty on u32 words directly.
#[inline(always)]
fn mine_hash_raw(mid_h: [u32; 8], remaining: &[u8], midstate_len: u64) -> [u32; 8] {
    let mut h = mid_h;
    let mut rem = remaining;
    let total_len = midstate_len + rem.len() as u64;

    // Process any complete 64-byte blocks in remaining
    while rem.len() >= 64 {
        sha256_block(&mut h, &rem[..64]);
        rem = &rem[64..];
    }

    // Build final padded block(s) on stack
    let mut buf = [0u8; 128];
    let rlen = rem.len();
    buf[..rlen].copy_from_slice(rem);
    buf[rlen] = 0x80;

    let pad_len = if rlen >= 56 { 128 } else { 64 };

    let bit_len = total_len * 8;
    buf[pad_len - 8] = (bit_len >> 56) as u8;
    buf[pad_len - 7] = (bit_len >> 48) as u8;
    buf[pad_len - 6] = (bit_len >> 40) as u8;
    buf[pad_len - 5] = (bit_len >> 32) as u8;
    buf[pad_len - 4] = (bit_len >> 24) as u8;
    buf[pad_len - 3] = (bit_len >> 16) as u8;
    buf[pad_len - 2] = (bit_len >> 8) as u8;
    buf[pad_len - 1] = bit_len as u8;

    sha256_block(&mut h, &buf[..64]);
    if pad_len == 128 {
        sha256_block(&mut h, &buf[64..128]);
    }

    h
}

/// Serialize u32 hash state to big-endian bytes.
#[inline(always)]
pub fn hash_to_bytes(h: &[u32; 8]) -> [u8; 32] {
    let mut hash = [0u8; 32];
    hash[0]  = (h[0] >> 24) as u8; hash[1]  = (h[0] >> 16) as u8;
    hash[2]  = (h[0] >> 8)  as u8; hash[3]  = h[0] as u8;
    hash[4]  = (h[1] >> 24) as u8; hash[5]  = (h[1] >> 16) as u8;
    hash[6]  = (h[1] >> 8)  as u8; hash[7]  = h[1] as u8;
    hash[8]  = (h[2] >> 24) as u8; hash[9]  = (h[2] >> 16) as u8;
    hash[10] = (h[2] >> 8)  as u8; hash[11] = h[2] as u8;
    hash[12] = (h[3] >> 24) as u8; hash[13] = (h[3] >> 16) as u8;
    hash[14] = (h[3] >> 8)  as u8; hash[15] = h[3] as u8;
    hash[16] = (h[4] >> 24) as u8; hash[17] = (h[4] >> 16) as u8;
    hash[18] = (h[4] >> 8)  as u8; hash[19] = h[4] as u8;
    hash[20] = (h[5] >> 24) as u8; hash[21] = (h[5] >> 16) as u8;
    hash[22] = (h[5] >> 8)  as u8; hash[23] = h[5] as u8;
    hash[24] = (h[6] >> 24) as u8; hash[25] = (h[6] >> 16) as u8;
    hash[26] = (h[6] >> 8)  as u8; hash[27] = h[6] as u8;
    hash[28] = (h[7] >> 24) as u8; hash[29] = (h[7] >> 16) as u8;
    hash[30] = (h[7] >> 8)  as u8; hash[31] = h[7] as u8;
    hash
}

/// Check if hash state (u32 words, big-endian semantics) meets difficulty.
/// Avoids serializing to bytes for the vast majority of failing hashes.
/// Each u32 word represents 4 bytes of the hash in big-endian order.
#[inline(always)]
pub fn meets_difficulty_u32(h: &[u32; 8], bits: u32) -> bool {
    if bits == 0 { return true; }
    // Check full 32-bit words (each covers 32 bits of leading zeros)
    let full_words = (bits / 32) as usize;
    let mut i = 0;
    while i < full_words {
        if h[i] != 0 { return false; }
        i += 1;
    }
    let rem_bits = bits % 32;
    if rem_bits > 0 && full_words < 8 {
        // Check remaining bits in the next word (big-endian: high bits first)
        let mask = 0xFFFF_FFFFu32 << (32 - rem_bits);
        if h[full_words] & mask != 0 { return false; }
    }
    true
}

/// Compute SHA-256 from a midstate and remaining data.
/// This is the hot-path function called for every nonce attempt.
///
/// remaining = prefix_tail + nonce_str + suffix (variable length)
/// midstate_len = number of bytes already processed into midstate
#[inline(always)]
pub fn mine_hash(mid_h: [u32; 8], remaining: &[u8], midstate_len: u64) -> [u8; 32] {
    let h = mine_hash_raw(mid_h, remaining, midstate_len);
    hash_to_bytes(&h)
}

/// Mining-optimized: compute hash and check difficulty without serialization.
/// Returns Some([u8;32]) only if the hash meets the required difficulty.
/// For the ~99.99% of hashes that fail, no byte serialization is done.
#[inline(always)]
pub fn mine_hash_check(mid_h: [u32; 8], remaining: &[u8], midstate_len: u64, diff_bits: u32) -> Option<[u8; 32]> {
    let h = mine_hash_raw(mid_h, remaining, midstate_len);
    if meets_difficulty_u32(&h, diff_bits) {
        Some(hash_to_bytes(&h))
    } else {
        None
    }
}

/// Full SHA-256 hash of arbitrary data (not midstate-optimized).
pub fn sha256(data: &[u8]) -> [u8; 32] {
    let mut state = Sha256State::new();
    let full_blocks = (data.len() / 64) * 64;
    if full_blocks > 0 {
        state.process_blocks(&data[..full_blocks]);
    }
    mine_hash(state.h, &data[full_blocks..], state.len)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sha256_empty() {
        let hash = sha256(b"");
        let hex = crate::utils::hash_to_hex(&hash);
        assert_eq!(hex, "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    }

    #[test]
    fn test_sha256_abc() {
        let hash = sha256(b"abc");
        let hex = crate::utils::hash_to_hex(&hash);
        assert_eq!(hex, "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    }

    #[test]
    fn test_midstate_equivalence() {
        // Verify that midstate-based hash matches full hash
        let data = b"1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef_extra_nonce_data_here";
        let full_hash = sha256(data);

        let (state, tail) = compute_midstate(data);
        let midstate_hash = mine_hash(state.h, &tail, state.len);

        assert_eq!(full_hash, midstate_hash);
    }
}

#[cfg(test)]
mod genesis_test {
    use super::*;
    use crate::utils::{hash_to_hex, write_i64, write_i32};

    #[test]
    fn test_genesis_block_hash() {
        // Genesis block from dilithiumcoin:
        // Index: 0, Timestamp: 1738368000, Transactions: [] (pre-merkle fork, uses JSON)
        // PreviousHash: "0", Nonce: 5892535, Difficulty: 6
        // Expected hash: "0000002835112676fbe3d7588fa08557751aa4045cc8575f16037247350815ae"
        
        // Block hash = SHA256(Index + Timestamp + txData + PreviousHash + Nonce + Difficulty)
        // For genesis (index=0, before MerkleRootForkHeight=6000): txData = JSON([])
        let mut buf = [0u8; 2048];
        let mut pos = 0;
        
        // Index: "0"
        let n = write_i64(&mut buf[pos..], 0);
        pos += n;
        // Timestamp: "1738368000"
        let n = write_i64(&mut buf[pos..], 1738368000);
        pos += n;
        // txData: "[]" (empty transaction array, JSON-serialized)
        buf[pos] = b'[';
        buf[pos+1] = b']';
        pos += 2;
        // PreviousHash: "0"
        buf[pos] = b'0';
        pos += 1;
        // Nonce: "5892535"
        let n = write_i64(&mut buf[pos..], 5892535);
        pos += n;
        // Difficulty: "6"
        let n = write_i32(&mut buf[pos..], 6);
        pos += n;
        
        let hash = sha256(&buf[..pos]);
        let hex = hash_to_hex(&hash);
        assert_eq!(hex, "0000002835112676fbe3d7588fa08557751aa4045cc8575f16037247350815ae",
            "Genesis block hash does not match! Data was: {:?}", 
            std::str::from_utf8(&buf[..pos]).unwrap());
    }
}

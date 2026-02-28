pub mod sha256;
pub mod mining;
pub mod merkle;
pub mod utils;

use wasm_bindgen::prelude::*;
use js_sys::{Array, Object, Reflect, Uint8Array};

/// Compute SHA-256 midstate for a prefix byte array.
/// Returns a JS object: { h: [u32 x 8], len: number, tail: Uint8Array }
#[wasm_bindgen]
pub fn compute_midstate(prefix: &[u8]) -> JsValue {
    let (state, tail) = sha256::compute_midstate(prefix);

    let obj = Object::new();
    let h_arr = Array::new_with_length(8);
    for i in 0..8 {
        h_arr.set(i as u32, JsValue::from(state.h[i]));
    }
    Reflect::set(&obj, &"h".into(), &h_arr).unwrap();
    Reflect::set(&obj, &"len".into(), &JsValue::from(state.len as f64)).unwrap();

    let tail_u8 = Uint8Array::new_with_length(tail.len() as u32);
    tail_u8.copy_from(&tail);
    Reflect::set(&obj, &"tail".into(), &tail_u8).unwrap();

    obj.into()
}

/// Mine a batch of nonces. Returns null if no solution found,
/// or { nonce: number, hash: string } on success.
///
/// Parameters match the Go worker's Mine() function.
#[wasm_bindgen]
pub fn mine_batch(
    h0: u32, h1: u32, h2: u32, h3: u32,
    h4: u32, h5: u32, h6: u32, h7: u32,
    prefix_tail: &[u8],
    suffix: &[u8],
    start_nonce: f64,  // JS numbers are f64
    stride: f64,
    batch_size: u32,
    diff_bits: u32,
    midstate_len: f64,
) -> JsValue {
    let h = [h0, h1, h2, h3, h4, h5, h6, h7];
    let start = start_nonce as i64;
    let s = stride as i64;
    let ml = midstate_len as u64;

    match mining::mine_batch(h, prefix_tail, suffix, start, s, batch_size, diff_bits, ml) {
        Some(result) => {
            let obj = Object::new();
            Reflect::set(&obj, &"nonce".into(), &JsValue::from(result.nonce as f64)).unwrap();
            Reflect::set(&obj, &"hash".into(), &JsValue::from_str(&result.hash_hex)).unwrap();
            obj.into()
        }
        None => JsValue::NULL,
    }
}

/// Compute the Merkle root of transaction JSON strings.
/// Input: newline-separated JSON strings (one per transaction).
/// Returns: lowercase hex string of the Merkle root.
#[wasm_bindgen]
pub fn compute_merkle_root(txs_newline_separated: &str) -> String {
    if txs_newline_separated.is_empty() {
        let h = sha256::sha256(b"");
        return utils::hash_to_hex(&h);
    }
    let txs: Vec<String> = txs_newline_separated
        .split('\n')
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string())
        .collect();
    merkle::compute_merkle_root(&txs)
}

/// Check if a hex hash meets the required difficulty (leading zero bits).
#[wasm_bindgen]
pub fn check_difficulty(hash_hex: &str, diff_bits: u32) -> bool {
    if hash_hex.len() != 64 {
        return false;
    }
    let mut hash = [0u8; 32];
    for i in 0..32 {
        let hi = hex_digit(hash_hex.as_bytes()[i * 2]);
        let lo = hex_digit(hash_hex.as_bytes()[i * 2 + 1]);
        if hi == 0xFF || lo == 0xFF {
            return false;
        }
        hash[i] = (hi << 4) | lo;
    }
    utils::meets_difficulty_bytes(&hash, diff_bits)
}

fn hex_digit(c: u8) -> u8 {
    match c {
        b'0'..=b'9' => c - b'0',
        b'a'..=b'f' => c - b'a' + 10,
        b'A'..=b'F' => c - b'A' + 10,
        _ => 0xFF,
    }
}

/// Compute the full block hash from components.
/// Matches Go's CalculateHash():
///   SHA-256(index_str + timestamp_str + merkle_root + previous_hash + nonce_str + difficulty_str)
#[wasm_bindgen]
pub fn hash_block(
    index: f64,
    timestamp: f64,
    merkle_root: &str,
    previous_hash: &str,
    nonce: f64,
    difficulty: i32,
) -> String {
    let mut buf = [0u8; 2048];
    let mut pos = 0;

    let n = utils::write_i64(&mut buf[pos..], index as i64);
    pos += n;
    let n = utils::write_i64(&mut buf[pos..], timestamp as i64);
    pos += n;

    let mr = merkle_root.as_bytes();
    buf[pos..pos + mr.len()].copy_from_slice(mr);
    pos += mr.len();

    let ph = previous_hash.as_bytes();
    buf[pos..pos + ph.len()].copy_from_slice(ph);
    pos += ph.len();

    let n = utils::write_i64(&mut buf[pos..], nonce as i64);
    pos += n;
    let n = utils::write_i32(&mut buf[pos..], difficulty);
    pos += n;

    let hash = sha256::sha256(&buf[..pos]);
    utils::hash_to_hex(&hash)
}

/// Full SHA-256 hash of arbitrary bytes, returned as hex string.
/// Useful for hashing transaction JSON for Merkle leaves.
#[wasm_bindgen]
pub fn sha256_hex(data: &[u8]) -> String {
    let hash = sha256::sha256(data);
    utils::hash_to_hex(&hash)
}

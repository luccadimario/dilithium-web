/// Merkle root computation — Bitcoin-style binary Merkle tree.
/// Ported from dilithiumcoin/blockchain.go:121-148
///
/// - Leaf = SHA-256(JSON(tx))
/// - Odd leaves: duplicate last
/// - Pair adjacent and SHA-256(left + right) up the tree
/// - Empty list: SHA-256("")

use crate::sha256::sha256;
use crate::utils::hash_to_hex;

/// Compute the Merkle root of transaction JSON strings.
/// Each string must be the exact JSON representation of a transaction
/// (matching Go's json.Marshal output with field order and omitempty).
///
/// Returns the Merkle root as a lowercase hex string.
pub fn compute_merkle_root(tx_json_strings: &[String]) -> String {
    if tx_json_strings.is_empty() {
        let h = sha256(b"");
        return hash_to_hex(&h);
    }

    // Hash each transaction JSON to get leaf nodes
    let mut hashes: Vec<[u8; 32]> = tx_json_strings
        .iter()
        .map(|json| sha256(json.as_bytes()))
        .collect();

    // Build tree upward
    while hashes.len() > 1 {
        // Duplicate last if odd
        if hashes.len() % 2 != 0 {
            let last = *hashes.last().unwrap();
            hashes.push(last);
        }

        let mut next = Vec::with_capacity(hashes.len() / 2);
        for i in (0..hashes.len()).step_by(2) {
            // Combine left + right (64 bytes) and hash
            let mut combined = [0u8; 64];
            combined[..32].copy_from_slice(&hashes[i]);
            combined[32..64].copy_from_slice(&hashes[i + 1]);
            next.push(sha256(&combined));
        }
        hashes = next;
    }

    hash_to_hex(&hashes[0])
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_empty_merkle_root() {
        let root = compute_merkle_root(&[]);
        // SHA-256 of empty string
        assert_eq!(root, "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    }

    #[test]
    fn test_single_tx_merkle_root() {
        // Single transaction: root = SHA-256(JSON)
        let tx_json = r#"{"from":"SYSTEM","to":"addr","amount":5000000000,"timestamp":1738368000,"signature":"coinbase-1-1234"}"#;
        let root = compute_merkle_root(&[tx_json.to_string()]);
        let expected = hash_to_hex(&sha256(tx_json.as_bytes()));
        assert_eq!(root, expected);
    }

    #[test]
    fn test_two_tx_merkle_root() {
        let tx1 = r#"{"from":"A","to":"B","amount":100,"timestamp":1,"signature":"sig1"}"#;
        let tx2 = r#"{"from":"C","to":"D","amount":200,"timestamp":2,"signature":"sig2"}"#;

        let root = compute_merkle_root(&[tx1.to_string(), tx2.to_string()]);

        // Manual: SHA-256(SHA-256(tx1) + SHA-256(tx2))
        let h1 = sha256(tx1.as_bytes());
        let h2 = sha256(tx2.as_bytes());
        let mut combined = [0u8; 64];
        combined[..32].copy_from_slice(&h1);
        combined[32..].copy_from_slice(&h2);
        let expected = hash_to_hex(&sha256(&combined));

        assert_eq!(root, expected);
    }
}

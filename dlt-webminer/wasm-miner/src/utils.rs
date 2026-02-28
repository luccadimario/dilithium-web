/// Utility functions ported from Go miner.

const HEX_CHARS: &[u8; 16] = b"0123456789abcdef";

/// Convert a raw 32-byte hash to a lowercase hex string.
pub fn hash_to_hex(hash: &[u8; 32]) -> String {
    let mut buf = [0u8; 64];
    for (i, &b) in hash.iter().enumerate() {
        buf[i * 2] = HEX_CHARS[(b >> 4) as usize];
        buf[i * 2 + 1] = HEX_CHARS[(b & 0x0f) as usize];
    }
    // Safety: all chars are ASCII hex digits
    unsafe { String::from_utf8_unchecked(buf.to_vec()) }
}

/// Write an i64 as decimal ASCII into buf, returns bytes written.
/// Zero allocations -- critical for the mining hot loop.
/// Matches Go's writeInt64 exactly.
#[inline(always)]
pub fn write_i64(buf: &mut [u8], n: i64) -> usize {
    if n == 0 {
        buf[0] = b'0';
        return 1;
    }

    let neg = n < 0;
    let mut un = if neg { (-(n as i128)) as u64 } else { n as u64 };

    // Extract digits in reverse
    let mut digits = [0u8; 20];
    let mut pos = 0;
    while un > 0 {
        digits[pos] = b'0' + (un % 10) as u8;
        un /= 10;
        pos += 1;
    }

    let mut offset = 0;
    if neg {
        buf[0] = b'-';
        offset = 1;
    }
    for i in 0..pos {
        buf[offset + i] = digits[pos - 1 - i];
    }
    offset + pos
}

/// Write an i32 as decimal ASCII into buf, returns bytes written.
/// Used for Difficulty field (Go's strconv.Itoa).
pub fn write_i32(buf: &mut [u8], n: i32) -> usize {
    write_i64(buf, n as i64)
}

/// Check if a raw SHA-256 hash has the required number of leading zero bits.
/// Operates on raw bytes -- matches Go's meetsDifficultyBytes exactly.
#[inline(always)]
pub fn meets_difficulty_bytes(hash: &[u8; 32], bits: u32) -> bool {
    if bits == 0 {
        return true;
    }
    let full_bytes = (bits / 8) as usize;
    for i in 0..full_bytes {
        if hash[i] != 0 {
            return false;
        }
    }
    let rem = bits % 8;
    if rem > 0 {
        let mask = 0xFFu8 << (8 - rem);
        if hash[full_bytes] & mask != 0 {
            return false;
        }
    }
    true
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_write_i64() {
        let mut buf = [0u8; 20];
        let n = write_i64(&mut buf, 0);
        assert_eq!(&buf[..n], b"0");

        let n = write_i64(&mut buf, 12345);
        assert_eq!(&buf[..n], b"12345");

        let n = write_i64(&mut buf, -42);
        assert_eq!(&buf[..n], b"-42");

        let n = write_i64(&mut buf, 5892535);
        assert_eq!(&buf[..n], b"5892535");

        let n = write_i64(&mut buf, 1738368000);
        assert_eq!(&buf[..n], b"1738368000");
    }

    #[test]
    fn test_meets_difficulty() {
        // All zeros hash meets any difficulty
        let zeros = [0u8; 32];
        assert!(meets_difficulty_bytes(&zeros, 256));

        // Hash starting with 0x00 0x00 0x00 meets 24 bits
        let mut hash = [0xFFu8; 32];
        hash[0] = 0;
        hash[1] = 0;
        hash[2] = 0;
        assert!(meets_difficulty_bytes(&hash, 24));
        assert!(!meets_difficulty_bytes(&hash, 25));

        // Hash starting with 0x00 0x0F meets 12 bits but not 13
        let mut hash2 = [0xFFu8; 32];
        hash2[0] = 0;
        hash2[1] = 0x0F;
        assert!(meets_difficulty_bytes(&hash2, 12));
        assert!(!meets_difficulty_bytes(&hash2, 13));
    }

    #[test]
    fn test_hash_to_hex() {
        let hash = [0u8; 32];
        assert_eq!(hash_to_hex(&hash), "0000000000000000000000000000000000000000000000000000000000000000");

        let mut hash2 = [0u8; 32];
        hash2[0] = 0xab;
        hash2[31] = 0xcd;
        let hex = hash_to_hex(&hash2);
        assert!(hex.starts_with("ab"));
        assert!(hex.ends_with("cd"));
    }
}

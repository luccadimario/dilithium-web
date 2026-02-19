'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import StarfieldBackground from '@/components/StarfieldBackground';
import { useReveal } from '@/components/useReveal';

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto my-6">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} className="text-left text-xs font-mono text-space-500 uppercase tracking-widest py-3 px-4 border-b border-space-700">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-space-900/30' : ''}>
              {row.map((cell, j) => (
                <td key={j} className={`py-2 px-4 text-sm border-b border-space-800 ${j === 0 ? 'font-mono text-crystal-400' : 'text-space-600'}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Code({ children }: { children: string }) {
  return (
    <div className="bg-space-950 border border-space-700 rounded-lg px-4 py-3 font-mono text-sm text-crystal-400 overflow-x-auto my-4">
      {children}
    </div>
  );
}

export default function WhitepaperPage() {
  const hero = useReveal(0.1);

  return (
    <>
      <StarfieldBackground />
      <Navigation />

      <main className="relative z-10">
        {/* Hero */}
        <section className="flex items-center justify-center pt-28 pb-10">
          <div
            ref={hero.ref}
            className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center reveal ${hero.visible ? 'visible' : ''}`}
          >
            <div className="inline-block px-4 py-1.5 rounded-full border border-crystal-500/30 bg-crystal-500/5 text-crystal-400 text-xs font-mono tracking-widest uppercase mb-8">
              Technical Paper
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black tracking-wider mb-6">
              Dilithium: A Post-Quantum<br />
              <span className="text-gradient-crystal">Proof-of-Work Cryptocurrency</span>
            </h1>
            <p className="text-space-600 text-lg max-w-2xl mx-auto leading-relaxed">
              Version 1.0 &mdash; February 2026
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="pb-24">
          <div
            className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8"
          >
            <article className="whitepaper-content">

              {/* Abstract */}
              <section className="mb-16">
                <h2>Abstract</h2>
                <p>
                  We present Dilithium, a proof-of-work cryptocurrency that replaces the elliptic curve cryptography used by existing blockchains with CRYSTALS-Dilithium, a lattice-based digital signature scheme standardized by NIST for post-quantum security. Transactions are signed with Dilithium Mode3 at the 192-bit security level, providing resistance to both classical and quantum adversaries. Blocks are mined using SHA-256 with a bit-granularity difficulty target and a linearly weighted moving average (LWMA) difficulty adjustment algorithm. The network operates on a custom binary protocol with Bitcoin-style peer scoring, headers-first synchronization, and support for both solo and pool mining across CPU and GPU hardware. Total supply is capped at 25,000,000 DLT through a halving schedule that reduces block rewards every 250,000 blocks.
                </p>
              </section>

              {/* 1. Introduction */}
              <section className="mb-16">
                <h2>1. Introduction</h2>
                <p>
                  The security of Bitcoin and most existing cryptocurrencies depends on the computational hardness of the elliptic curve discrete logarithm problem (ECDLP). Shor&apos;s algorithm, running on a sufficiently large quantum computer, solves ECDLP in polynomial time, rendering ECDSA signatures forgeable. While large-scale fault-tolerant quantum computers do not yet exist, the timeline for their arrival is uncertain, and blockchain addresses holding funds today must remain secure for decades.
                </p>
                <p>
                  NIST completed its Post-Quantum Cryptography standardization process in 2024, selecting CRYSTALS-Dilithium (FIPS 204, ML-DSA) as the primary signature standard. Dilithium is a lattice-based scheme whose security relies on the hardness of the Module Learning With Errors (MLWE) problem, which is believed to resist both classical and quantum attacks.
                </p>
                <p>
                  This paper describes a blockchain built from the ground up with CRYSTALS-Dilithium as the sole signature algorithm. Every transaction, from the genesis block forward, is signed with a post-quantum key pair. No migration or hybrid scheme is necessary because no legacy cryptography is present.
                </p>
              </section>

              {/* 2. Cryptographic Primitives */}
              <section className="mb-16">
                <h2>2. Cryptographic Primitives</h2>

                <h3>2.1 Digital Signatures</h3>
                <p>
                  All transaction signatures use CRYSTALS-Dilithium Mode3, which targets NIST Security Level 3 (approximately 192-bit classical security). The key parameters are:
                </p>
                <Table
                  headers={['Parameter', 'Value']}
                  rows={[
                    ['Public key size', '1,952 bytes'],
                    ['Private key size', '4,000 bytes'],
                    ['Signature size', '3,293 bytes'],
                    ['Security level', 'NIST Level 3 (~192-bit)'],
                    ['Underlying problem', 'Module-LWE'],
                  ]}
                />
                <p>
                  The implementation uses Cloudflare&apos;s <span className="font-mono text-crystal-400">circl</span> library, which provides a constant-time, side-channel-resistant Dilithium implementation in Go.
                </p>

                <h3>2.2 Address Derivation</h3>
                <p>An address is derived from a public key by computing:</p>
                <Code>address = hex(SHA-256(public_key_bytes))[0:40]</Code>
                <p>
                  This produces a 40-character hexadecimal string (20 bytes), providing 160 bits of collision resistance against address impersonation.
                </p>

                <h3>2.3 Key Generation and Recovery</h3>
                <p>
                  Key pairs may be generated from cryptographic randomness or derived deterministically from a BIP39 mnemonic phrase. The deterministic derivation path is:
                </p>
                <ol>
                  <li>Generate 256 bits of entropy and encode as a 24-word BIP39 mnemonic.</li>
                  <li>Derive a 64-byte seed using PBKDF2-HMAC-SHA512 with 2,048 iterations and the passphrase <span className="font-mono text-crystal-400">&quot;mnemonic&quot;</span> (per BIP39).</li>
                  <li>Expand the seed into a deterministic byte stream using HKDF-SHA256 with the salt <span className="font-mono text-crystal-400">&quot;dilithium-v1-keypair&quot;</span>.</li>
                  <li>Pass the HKDF reader to the Dilithium Mode3 key generation function.</li>
                </ol>
                <p>
                  The same mnemonic always produces the same key pair. The mnemonic is displayed once at wallet creation and is never stored on disk.
                </p>

                <h3>2.4 Private Key Encryption</h3>
                <p>
                  Private keys stored on disk may be encrypted with a user-chosen passphrase using AES-256-GCM. The encryption key is derived by computing SHA-256(salt || passphrase) and iterating SHA-256 on the result 100,000 times. A random 16-byte salt and 12-byte nonce are prepended to the ciphertext.
                </p>
              </section>

              {/* 3. Transactions */}
              <section className="mb-16">
                <h2>3. Transactions</h2>

                <h3>3.1 Structure</h3>
                <Table
                  headers={['Field', 'Type', 'Description']}
                  rows={[
                    ['From', 'string', 'Sender address (40 hex chars), or "SYSTEM" for coinbase'],
                    ['To', 'string', 'Recipient address (40 hex characters)'],
                    ['Amount', 'int64', 'Transfer amount in base units'],
                    ['Fee', 'int64', 'Transaction fee in base units'],
                    ['Timestamp', 'int64', 'Unix timestamp (seconds)'],
                    ['Signature', 'string', 'Hex-encoded Dilithium Mode3 signature'],
                    ['PublicKey', 'string', 'Hex-encoded sender public key'],
                  ]}
                />
                <p>
                  The base monetary unit is defined such that 1 DLT = 100,000,000 base units, providing eight decimal places of precision.
                </p>

                <h3>3.2 Signing and Verification</h3>
                <p>The data signed for a transaction is the concatenation:</p>
                <Code>{'"dilithium-mainnet:" + From + To + Amount + Fee + Timestamp'}</Code>
                <p>
                  The chain identifier <span className="font-mono text-crystal-400">dilithium-mainnet</span> serves as domain separation to prevent cross-chain replay attacks. The signature is produced using the sender&apos;s Dilithium Mode3 private key and verified using the public key included in the transaction. The verifier also confirms that <span className="font-mono text-crystal-400">SHA-256(PublicKey)[0:40]</span> matches the <span className="font-mono text-crystal-400">From</span> address.
                </p>

                <h3>3.3 Coinbase Transactions</h3>
                <p>
                  Each block must contain exactly one coinbase transaction, which creates new currency. A coinbase transaction has <span className="font-mono text-crystal-400">From = &quot;SYSTEM&quot;</span>, no signature verification, and <span className="font-mono text-crystal-400">Amount = block_reward + total_fees</span>, where total_fees is the sum of fees from all other transactions in the block.
                </p>

                <h3>3.4 Fees</h3>
                <p>
                  All non-coinbase transactions must include a fee of at least 10,000 base units (0.0001 DLT). Miners collect the sum of all transaction fees in the block they mine, in addition to the block reward. The minimum fee prevents spam while remaining negligible for legitimate transfers.
                </p>

                <h3>3.5 Validation Rules</h3>
                <ol>
                  <li><span className="font-mono text-crystal-400">Amount &gt; 0</span></li>
                  <li><span className="font-mono text-crystal-400">Fee &gt;= 10,000</span> (non-coinbase only)</li>
                  <li>The Dilithium signature verifies against the included public key</li>
                  <li>The address derived from the public key matches <span className="font-mono text-crystal-400">From</span></li>
                  <li>The sender&apos;s confirmed balance is at least <span className="font-mono text-crystal-400">Amount + Fee</span></li>
                  <li>The serialized transaction is at most 100 KB</li>
                </ol>
              </section>

              {/* 4. Blocks */}
              <section className="mb-16">
                <h2>4. Blocks</h2>

                <h3>4.1 Structure</h3>
                <Table
                  headers={['Field', 'Type', 'Description']}
                  rows={[
                    ['Index', 'int64', 'Block height (genesis = 0)'],
                    ['Timestamp', 'int64', 'Unix timestamp (seconds)'],
                    ['Transactions', '[]*Transaction', 'Ordered list of transactions'],
                    ['PreviousHash', 'string', 'SHA-256 hash of the previous block'],
                    ['Hash', 'string', 'SHA-256 hash of this block'],
                    ['Nonce', 'int64', 'Proof-of-work nonce'],
                    ['Difficulty', 'int', 'Legacy difficulty (hex digits)'],
                    ['DifficultyBits', 'int', 'Bit-precise difficulty target'],
                  ]}
                />

                <h3>4.2 Block Hash</h3>
                <p>The block hash is computed as:</p>
                <Code>{'data = str(Index) + str(Timestamp) + JSON(Transactions) + PreviousHash + str(Nonce) + str(Difficulty)\nHash = hex(SHA-256(data))'}</Code>
                <p>
                  All numeric fields are rendered as decimal ASCII strings. The transaction array is serialized as JSON with fields omitted when zero-valued.
                </p>

                <h3>4.3 Validation Rules</h3>
                <ol>
                  <li><span className="font-mono text-crystal-400">Hash == SHA-256(block_data)</span> (hash integrity)</li>
                  <li><span className="font-mono text-crystal-400">PreviousHash == previous_block.Hash</span> (chain continuity)</li>
                  <li>The hash satisfies the difficulty target (see Section 5)</li>
                  <li>Timestamp is not more than 2 hours in the future</li>
                  <li>Timestamp is not before the previous block&apos;s timestamp</li>
                  <li>The difficulty matches the value computed by the DAA (see Section 6)</li>
                  <li>All transactions pass validation</li>
                  <li>Exactly one coinbase transaction is present</li>
                  <li>Serialized block size does not exceed 1 MB</li>
                  <li>Transaction count does not exceed 5,000</li>
                </ol>

                <h3>4.4 Genesis Block</h3>
                <Table
                  headers={['Field', 'Value']}
                  rows={[
                    ['Index', '0'],
                    ['Timestamp', '1738368000 (2025-02-01 00:00:00 UTC)'],
                    ['Transactions', '(empty)'],
                    ['PreviousHash', '"0"'],
                    ['Difficulty', '6'],
                    ['Nonce', '5,892,535'],
                    ['Hash', '0000002835...0815ae'],
                  ]}
                />
              </section>

              {/* 5. Proof-of-Work */}
              <section className="mb-16">
                <h2>5. Proof-of-Work</h2>

                <h3>5.1 Difficulty Target</h3>
                <p>
                  Dilithium uses a bit-granularity difficulty system. A block hash satisfies difficulty <em>d</em> if its first <em>d</em> bits are zero. This is verified by checking that the first <span className="font-mono text-crystal-400">floor(d / 8)</span> bytes are <span className="font-mono text-crystal-400">0x00</span>, then checking that the next byte, masked with <span className="font-mono text-crystal-400">{'0xFF << (8 - (d mod 8))'}</span>, is <span className="font-mono text-crystal-400">0x00</span>.
                </p>
                <p>
                  This provides 4x finer difficulty granularity than a hex-digit-based system and allows smoother adjustments. The difficulty ranges from a minimum of 16 bits to a maximum of 80 bits.
                </p>

                <h3>5.2 Proof-of-Work Function</h3>
                <p>
                  Mining consists of searching for a nonce such that <span className="font-mono text-crystal-400">SHA-256(block_data)</span> satisfies the difficulty target. The expected number of hash evaluations to find a valid block is 2<sup>d</sup>, where <em>d</em> is the difficulty in bits.
                </p>

                <h3>5.3 Fork Selection</h3>
                <p>
                  When the network encounters competing chains, the chain with the greatest cumulative proof-of-work is selected. Cumulative work is the sum of 2<sup>d<sub>i</sub></sup> for each block <em>i</em> in the chain. This ensures that difficulty reductions do not create incentives for chain splitting.
                </p>
              </section>

              {/* 6. Difficulty Adjustment */}
              <section className="mb-16">
                <h2>6. Difficulty Adjustment</h2>

                <h3>6.1 Target Block Time</h3>
                <p>The target block time is 60 seconds (1 minute).</p>

                <h3>6.2 Legacy Algorithm (Blocks 0&ndash;599)</h3>
                <p>
                  During the initial launch phase, difficulty adjusts every 50 blocks. The ratio of expected time (3,000 seconds) to actual time is computed and clamped to [0.25, 4.0]. The adjustment in bits is <span className="font-mono text-crystal-400">round(log2(ratio))</span>, capped at &plusmn;2 bits per adjustment.
                </p>

                <h3>6.3 LWMA Algorithm (Block 600+)</h3>
                <p>
                  Beginning at block 600, difficulty adjusts every block using a Linearly Weighted Moving Average (LWMA) over the previous 20 blocks. Recent blocks are weighted more heavily:
                </p>
                <Code>{'weight(i) = i + 1,  for i in [0, 19]\nweighted_avg = sum(adjusted_time[i] * weight(i)) / sum(weight(i))'}</Code>
                <p>
                  Solve times are normalized by the difficulty at which they were mined. If block <em>i</em> was mined at difficulty <em>b<sub>i</sub></em> and the current difficulty is <em>d</em>:
                </p>
                <Code>{'delta = d - b_i\nadjusted_time = solve_time * 2^delta     (if delta > 0)\nadjusted_time = solve_time / 2^|delta|   (if delta < 0)'}</Code>
                <p>This normalization prevents oscillation when difficulty changes rapidly. The adjustment rule is:</p>
                <Table
                  headers={['Condition', 'Adjustment']}
                  rows={[
                    ['weighted_avg < 42s (0.7 * target)', '+1 bit (harder)'],
                    ['weighted_avg > 78s (1.3 * target)', '-1 bit (easier)'],
                  ]}
                />
                <p>The maximum adjustment is &plusmn;1 bit per block.</p>
              </section>

              {/* 7. Supply and Economics */}
              <section className="mb-16">
                <h2>7. Supply and Economics</h2>

                <h3>7.1 Monetary Policy</h3>
                <p>
                  The total supply of DLT is capped at 25,000,000. Supply is created exclusively through coinbase transactions in mined blocks.
                </p>
                <Table
                  headers={['Blocks', 'Reward (DLT)']}
                  rows={[
                    ['0 - 249,999', '50'],
                    ['250,000 - 499,999', '25'],
                    ['500,000 - 749,999', '12.5'],
                    ['750,000 - 999,999', '6.25'],
                    ['...', 'halves every 250,000 blocks'],
                  ]}
                />
                <p>The reward at block height <em>h</em> is:</p>
                <Code>{'halvings = floor(h / 250,000)\nreward = 50 * 100,000,000 >> halvings   (in base units)'}</Code>
                <p>
                  After approximately 64 halvings, the reward reaches zero and miners are compensated entirely through transaction fees. The geometric series of rewards sums to:
                </p>
                <Code>{'250,000 * 50 * (1 + 1/2 + 1/4 + ...) = 250,000 * 50 * 2 = 25,000,000 DLT'}</Code>

                <h3>7.2 Halving Interval</h3>
                <p>
                  At 60-second block times, 250,000 blocks corresponds to approximately 174 days. The first halving is expected roughly 6 months after genesis.
                </p>
              </section>

              {/* 8. Network Protocol */}
              <section className="mb-16">
                <h2>8. Network Protocol</h2>

                <h3>8.1 Transport</h3>
                <p>
                  Nodes communicate over TCP using a custom binary protocol. Each message is prefixed with the magic bytes <span className="font-mono text-crystal-400">0x44494C54</span> (&quot;DILT&quot;) for stream identification.
                </p>

                <h3>8.2 Message Types</h3>
                <p>
                  <strong>Handshake:</strong> <span className="font-mono text-crystal-400">version</span>, <span className="font-mono text-crystal-400">verack</span>
                </p>
                <p>
                  <strong>Data exchange:</strong> <span className="font-mono text-crystal-400">inv</span>, <span className="font-mono text-crystal-400">getdata</span>, <span className="font-mono text-crystal-400">block</span>, <span className="font-mono text-crystal-400">tx</span>
                </p>
                <p>
                  <strong>Synchronization:</strong> <span className="font-mono text-crystal-400">getheaders</span>, <span className="font-mono text-crystal-400">headers</span>, <span className="font-mono text-crystal-400">getblocks</span>, <span className="font-mono text-crystal-400">blocks</span>
                </p>
                <p>
                  <strong>Peer discovery:</strong> <span className="font-mono text-crystal-400">addr</span>, <span className="font-mono text-crystal-400">getaddr</span>
                </p>
                <p>
                  <strong>Liveness:</strong> <span className="font-mono text-crystal-400">ping</span>, <span className="font-mono text-crystal-400">pong</span> (with random nonces, every 2 minutes)
                </p>

                <h3>8.3 Synchronization</h3>
                <p>
                  New nodes synchronize using a headers-first approach. The node requests up to 2,000 block headers per message, validates the proof-of-work chain, then downloads full blocks in batches of 500.
                </p>

                <h3>8.4 Peer Discovery and Management</h3>
                <p>
                  Nodes discover peers through hardcoded seed nodes, address gossip (broadcast every 10 minutes), and a persistent peer database. Address records have a 4-hour TTL and are pruned after 7 days of inactivity. Subnet diversity (/16 IPv4) is preferred when selecting outbound connections to resist eclipse attacks.
                </p>

                <h3>8.5 Connection Limits</h3>
                <Table
                  headers={['Parameter', 'Value']}
                  rows={[
                    ['Maximum outbound', '16'],
                    ['Maximum inbound', '64'],
                    ['Minimum outbound target', '8'],
                    ['Maximum address book', '2,000'],
                  ]}
                />

                <h3>8.6 Peer Scoring</h3>
                <p>
                  Nodes track misbehavior using a point-based scoring system inspired by Bitcoin Core:
                </p>
                <Table
                  headers={['Violation', 'Points']}
                  rows={[
                    ['Invalid block (bad PoW, hash, transactions)', '100'],
                    ['Invalid transaction relay', '10'],
                    ['Message decode failure', '1'],
                    ['Message spam (>1,000 msg/10s)', '100'],
                  ]}
                />
                <p>
                  A peer is banned for 24 hours when its cumulative score reaches 100 points.
                </p>
              </section>

              {/* 9. Mining */}
              <section className="mb-16">
                <h2>9. Mining</h2>

                <h3>9.1 Solo Mining</h3>
                <p>
                  Solo miners construct block templates from the mempool, create a coinbase transaction, and search for a valid nonce. Mining can be performed on CPU or GPU hardware.
                </p>

                <h3>9.2 GPU Mining</h3>
                <p>
                  GPU mining uses NVIDIA CUDA to parallelize SHA-256 hash evaluation. The implementation employs a midstate optimization: the SHA-256 internal state is computed on the CPU for the fixed block prefix (all fields except the nonce), and only the variable suffix containing the nonce is hashed on the GPU. This reduces per-nonce GPU work by 50&ndash;80%.
                </p>

                <h3>9.3 Pool Mining</h3>
                <p>
                  Pool mining is supported through a JSON-over-TCP protocol. The pool server distributes work templates to connected workers with a share difficulty set 8 bits below the block difficulty (256x easier). Workers submit shares that meet the share target; if a share also meets the full block difficulty, the pool submits it to the network. Rewards are distributed proportionally based on submitted shares.
                </p>

                <h3>9.4 Performance</h3>
                <Table
                  headers={['Hardware', 'Mode', 'Hashrate']}
                  rows={[
                    ['Intel i7 (8 threads)', 'CPU', '~80 MH/s'],
                    ['Apple M4 (10 threads)', 'CPU', '~180 MH/s'],
                    ['NVIDIA RTX 3080', 'GPU', '~1,400 MH/s'],
                    ['NVIDIA RTX 4090', 'GPU', '~5,000 MH/s'],
                  ]}
                />
              </section>

              {/* 10. Wallet Software */}
              <section className="mb-16">
                <h2>10. Wallet Software</h2>
                <p>
                  Dilithium provides both a command-line interface and a desktop GUI wallet. Both support wallet creation with 24-word BIP39 recovery phrases, wallet restoration from recovery phrases, optional passphrase encryption (AES-256-GCM), balance queries, transaction signing with configurable fees, and automatic node discovery across seed nodes.
                </p>
              </section>

              {/* 11. Conclusion */}
              <section className="mb-16">
                <h2>11. Conclusion</h2>
                <p>
                  Dilithium demonstrates that a fully post-quantum cryptocurrency can be built today using standardized cryptography. By using CRYSTALS-Dilithium Mode3 exclusively &mdash; with no legacy signature algorithms &mdash; the system avoids the complexity of hybrid schemes and migration paths. The SHA-256 proof-of-work mechanism provides a well-understood consensus layer, while the LWMA difficulty adjustment and bit-granularity targets enable responsive, smooth mining difficulty. The 25,000,000 DLT supply cap, halving schedule, and transaction fee system provide a deflationary monetary policy. The network protocol, with headers-first sync, peer scoring, and subnet-diverse peer selection, ensures robust decentralized operation.
                </p>
              </section>

              {/* References */}
              <section>
                <h2>References</h2>
                <ol className="text-sm">
                  <li>Ducas, L., Kiltz, E., Lepoint, T., Lyubashevsky, V., Schwabe, P., Seiler, G., Stehl&eacute;, D. (2024). CRYSTALS-Dilithium: A Lattice-Based Digital Signature Scheme. NIST FIPS 204 (ML-DSA).</li>
                  <li>Nakamoto, S. (2008). Bitcoin: A Peer-to-Peer Electronic Cash System.</li>
                  <li>Zahnentferner, J. (2018). Linearly Weighted Moving Average (LWMA) Difficulty Adjustment Algorithm.</li>
                  <li>NIST (2024). Post-Quantum Cryptography Standardization.</li>
                  <li>Bitcoin Core Developers (2024). Bitcoin P2P Network Protocol.</li>
                </ol>
              </section>

            </article>
          </div>
        </section>
      </main>

      <Footer />

      <style jsx>{`
        .whitepaper-content h2 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #e1e4ea;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid rgba(99, 102, 241, 0.2);
          letter-spacing: 0.05em;
        }
        .whitepaper-content h3 {
          font-size: 1.15rem;
          font-weight: 600;
          color: #c4c9d4;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
          letter-spacing: 0.03em;
        }
        .whitepaper-content p {
          color: #9ca3af;
          line-height: 1.8;
          margin-bottom: 1rem;
        }
        .whitepaper-content ol {
          color: #9ca3af;
          line-height: 1.8;
          margin-bottom: 1rem;
          padding-left: 1.5rem;
          list-style-type: decimal;
        }
        .whitepaper-content ol li {
          margin-bottom: 0.5rem;
        }
        .whitepaper-content em {
          color: #c4c9d4;
          font-style: italic;
        }
        .whitepaper-content strong {
          color: #e1e4ea;
        }
        .whitepaper-content sup {
          font-size: 0.7em;
          vertical-align: super;
        }
        .whitepaper-content sub {
          font-size: 0.7em;
          vertical-align: sub;
        }
      `}</style>
    </>
  );
}

// Work Manager — fetches chain state, builds mining templates, submits blocks.
// Solo mode: polls node API directly.
// Pool mode: receives work from PoolClient.

import { getBlockReward, buildCoinbaseTx, transactionToJSON, blockToJSON } from './tx-builder.js';

const MERKLE_ROOT_FORK_HEIGHT = 6000;

export class WorkManager {
    constructor(onWorkTemplate, onBlockAccepted, onStatus) {
        this.onWorkTemplate = onWorkTemplate;   // (template) => void
        this.onBlockAccepted = onBlockAccepted; // (block) => void
        this.onStatus = onStatus;               // (msg) => void

        this.nodeUrl = '';
        this.minerAddress = '';
        this.wasm = null;
        this.useProxy = false; // use /api/ proxy to avoid CORS

        // Current state
        this.currentHeight = -1;
        this.currentDifficulty = 0;
        this.currentDiffBits = 0;
        this.lastBlockHash = '';
        this.pendingTxs = [];
        this.currentBlock = null; // block being mined (for submission)

        this.pollInterval = null;
        this.polling = false;
    }

    /**
     * Initialize with WASM module reference.
     */
    init(wasm) {
        this.wasm = wasm;
    }

    /**
     * Start solo mining: poll node for new work.
     */
    startSolo(nodeUrl, minerAddress, useProxy = false) {
        this.nodeUrl = nodeUrl;
        this.minerAddress = minerAddress;
        this.useProxy = useProxy;
        this.polling = true;
        this._poll();
        this.pollInterval = setInterval(() => this._poll(), 3000);
    }

    /**
     * Build a fetch URL, routing through /api/ proxy if enabled.
     */
    _fetchUrl(path) {
        if (this.useProxy) {
            return `/api${path}?node=${encodeURIComponent(this.nodeUrl)}`;
        }
        return `${this.nodeUrl}${path}`;
    }

    /**
     * Stop polling.
     */
    stop() {
        this.polling = false;
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }

    /**
     * Poll node for current chain state.
     */
    async _poll() {
        if (!this.polling) return;

        try {
            // Fetch status
            const statusResp = await fetch(`${this._fetchUrl('/status')}`);
            const statusData = await statusResp.json();

            if (!statusData.success) {
                this.onStatus(`Node error: ${statusData.message}`);
                return;
            }

            const height = statusData.data.blockchain_height;
            const difficulty = statusData.data.difficulty;
            const diffBits = statusData.data.difficulty_bits || 0;
            const lastHash = statusData.data.last_block_hash;

            // Check if chain tip changed
            if (height === this.currentHeight && lastHash === this.lastBlockHash) {
                return; // No change, keep mining current work
            }

            this.currentHeight = height;
            this.currentDifficulty = difficulty;
            this.currentDiffBits = diffBits;
            this.lastBlockHash = lastHash;

            this.onStatus(`Chain height: ${height}, difficulty: ${diffBits} bits (${difficulty} hex)`);

            // Fetch mempool
            await this._fetchMempool();

            // Build new work template
            this._buildWorkTemplate();

        } catch (err) {
            this.onStatus(`Poll error: ${err.message}`);
        }
    }

    async _fetchMempool() {
        try {
            const resp = await fetch(`${this._fetchUrl('/mempool')}`);
            const data = await resp.json();
            if (data.success && data.data && data.data.transactions) {
                this.pendingTxs = data.data.transactions;
            } else {
                this.pendingTxs = [];
            }
        } catch (_) {
            this.pendingTxs = [];
        }
    }

    /**
     * Build a work template from current state.
     */
    _buildWorkTemplate() {
        const blockIndex = this.currentHeight; // next block index = current height
        const reward = getBlockReward(blockIndex);

        // Sum fees from pending transactions
        let totalFees = 0;
        for (const tx of this.pendingTxs) {
            totalFees += (tx.fee || 0);
        }

        // Build coinbase transaction
        const coinbaseTx = buildCoinbaseTx(this.minerAddress, blockIndex, reward, totalFees);

        // All transactions: coinbase first, then pending
        const allTxs = [coinbaseTx, ...this.pendingTxs];

        // Compute Merkle root via WASM
        const txJsonStrings = allTxs.map(tx => transactionToJSON(tx));
        const merkleRoot = this.wasm.compute_merkle_root(txJsonStrings.join('\n'));

        const now = Math.floor(Date.now() / 1000);

        // Build block template (for later submission)
        this.currentBlock = {
            Index: blockIndex,
            Timestamp: now,
            transactions: allTxs,
            MerkleRoot: merkleRoot,
            PreviousHash: this.lastBlockHash,
            Hash: '',
            Nonce: 0,
            Difficulty: this.currentDifficulty,
            DifficultyBits: this.currentDiffBits,
        };

        // Build prefix and suffix for mining
        // Block hash = SHA256(Index + Timestamp + txData + PreviousHash + Nonce + Difficulty)
        // prefix = everything before Nonce, suffix = everything after
        let txData;
        if (blockIndex >= MERKLE_ROOT_FORK_HEIGHT) {
            txData = merkleRoot;
        } else {
            txData = JSON.stringify(allTxs.map(tx => {
                const o = { from: tx.from, to: tx.to, amount: tx.amount };
                if (tx.fee && tx.fee !== 0) o.fee = tx.fee;
                if (tx.data && tx.data !== '') o.data = tx.data;
                o.timestamp = tx.timestamp;
                o.signature = tx.signature;
                if (tx.public_key && tx.public_key !== '') o.public_key = tx.public_key;
                return o;
            }));
        }

        const prefixStr = `${blockIndex}${now}${txData}${this.lastBlockHash}`;
        const suffixStr = `${this.currentDifficulty}`;

        const encoder = new TextEncoder();
        const prefixBytes = encoder.encode(prefixStr);
        const suffixBytes = encoder.encode(suffixStr);

        // Compute midstate via WASM
        const midstate = this.wasm.compute_midstate(prefixBytes);

        // Determine effective difficulty bits
        let diffBits = this.currentDiffBits;
        if (diffBits <= 0) {
            diffBits = this.currentDifficulty * 4;
        }

        const workTemplate = {
            h: Array.from(midstate.h),
            midstateLen: midstate.len,
            prefixTail: new Uint8Array(midstate.tail),
            suffix: suffixBytes,
            diffBits: diffBits,
        };

        this.onStatus(`Mining block #${blockIndex} | ${diffBits} bits | ${txJsonStrings.length} txs`);
        this.onWorkTemplate(workTemplate);
    }

    /**
     * Handle a solution found by the coordinator.
     */
    async onSolutionFound(nonce, hash) {
        if (!this.currentBlock) {
            this.onStatus('No block to submit (stale solution?)');
            return;
        }

        this.currentBlock.Nonce = nonce;
        this.currentBlock.Hash = hash;

        // Verify hash matches (sanity check)
        const expectedHash = this.wasm.hash_block(
            this.currentBlock.Index,
            this.currentBlock.Timestamp,
            this.currentBlock.MerkleRoot,
            this.currentBlock.PreviousHash,
            nonce,
            this.currentBlock.Difficulty
        );

        if (hash !== expectedHash) {
            this.onStatus(`HASH MISMATCH! computed=${hash} expected=${expectedHash}`);
            return;
        }

        // Submit block
        this.onStatus(`Submitting block #${this.currentBlock.Index}...`);

        try {
            const blockJSON = blockToJSON(this.currentBlock);
            const resp = await fetch(`${this._fetchUrl('/block/submit')}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: blockJSON,
            });
            const result = await resp.json();

            if (result.success) {
                this.onStatus(`BLOCK #${this.currentBlock.Index} ACCEPTED!`);
                this.onBlockAccepted(this.currentBlock);
            } else {
                this.onStatus(`Block rejected: ${result.message}`);
            }
        } catch (err) {
            this.onStatus(`Submit error: ${err.message}`);
        }
    }

    /**
     * Build work from pool stratum notify params.
     * Called by app.js when in pool mode.
     */
    buildPoolWork(params, shareBits, minerAddress) {
        const blockIndex = params.blockIndex;
        const reward = params.reward;

        let txs = [];
        if (params.txsJSON && params.txsJSON !== 'null' && params.txsJSON !== '') {
            try { txs = JSON.parse(params.txsJSON); } catch (_) {}
        }

        let totalFees = 0;
        for (const tx of txs) {
            totalFees += (tx.fee || 0);
        }

        const coinbaseAddr = params.poolAddress || minerAddress;
        const coinbaseTx = buildCoinbaseTx(coinbaseAddr, blockIndex, reward, totalFees);
        const allTxs = [coinbaseTx, ...txs];

        const txJsonStrings = allTxs.map(tx => transactionToJSON(tx));
        const merkleRoot = this.wasm.compute_merkle_root(txJsonStrings.join('\n'));

        const now = Math.floor(Date.now() / 1000);

        this.currentBlock = {
            Index: blockIndex,
            Timestamp: now,
            transactions: allTxs,
            MerkleRoot: merkleRoot,
            PreviousHash: params.prevHash,
            Hash: '',
            Nonce: 0,
            Difficulty: params.difficulty,
            DifficultyBits: params.difficultyBits,
        };

        let txData;
        if (blockIndex >= MERKLE_ROOT_FORK_HEIGHT) {
            txData = merkleRoot;
        } else {
            txData = JSON.stringify(allTxs.map(tx => {
                const o = { from: tx.from, to: tx.to, amount: tx.amount };
                if (tx.fee && tx.fee !== 0) o.fee = tx.fee;
                if (tx.data && tx.data !== '') o.data = tx.data;
                o.timestamp = tx.timestamp;
                o.signature = tx.signature;
                if (tx.public_key && tx.public_key !== '') o.public_key = tx.public_key;
                return o;
            }));
        }

        const prefixStr = `${blockIndex}${now}${txData}${params.prevHash}`;
        const suffixStr = `${params.difficulty}`;

        const encoder = new TextEncoder();
        const prefixBytes = encoder.encode(prefixStr);
        const suffixBytes = encoder.encode(suffixStr);

        const midstate = this.wasm.compute_midstate(prefixBytes);

        return {
            h: Array.from(midstate.h),
            midstateLen: midstate.len,
            prefixTail: new Uint8Array(midstate.tail),
            suffix: suffixBytes,
            diffBits: shareBits,
            jobId: params.jobId,
        };
    }
}

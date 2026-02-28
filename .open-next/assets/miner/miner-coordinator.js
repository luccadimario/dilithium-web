// Miner Coordinator — spawns and manages Web Workers for parallel mining.
// Distributes work with strided nonces, aggregates hashrate, handles solutions.

export class MinerCoordinator {
    constructor(onSolution, onHashrate, onStatus) {
        this.workers = [];
        this.threadCount = 0;
        this.onSolution = onSolution;   // (nonce, hash) => void
        this.onHashrate = onHashrate;   // (totalRate, perThread) => void
        this.onStatus = onStatus;       // (msg) => void
        this.workerHashrates = {};      // worker index → latest hashrate
        this.totalHashesMined = 0;
        this.mining = false;
        this.workersReady = 0;
        this._readyResolve = null;
    }

    /**
     * Initialize workers. Returns a promise that resolves when all workers
     * have loaded WASM and are ready to mine.
     */
    async init(threadCount) {
        this.threadCount = threadCount;
        this.workersReady = 0;

        // Terminate any existing workers
        this.terminate();

        return new Promise((resolve) => {
            this._readyResolve = resolve;

            for (let i = 0; i < threadCount; i++) {
                const worker = new Worker('miner-worker.js', { type: 'module' });
                this.workers.push(worker);
                this.workerHashrates[i] = 0;

                worker.onmessage = (e) => this._handleWorkerMessage(i, e.data);
                worker.onerror = (err) => {
                    this.onStatus(`Worker ${i} error: ${err.message}`);
                };

                // Initialize WASM in worker
                worker.postMessage({ type: 'init' });
            }
        });
    }

    _handleWorkerMessage(workerIndex, msg) {
        switch (msg.type) {
            case 'ready':
                this.workersReady++;
                if (this.workersReady === this.threadCount && this._readyResolve) {
                    this._readyResolve();
                    this._readyResolve = null;
                }
                break;

            case 'hashrate':
                this.workerHashrates[workerIndex] = msg.hashrate;
                this.totalHashesMined += msg.totalHashes;
                this._reportHashrate();
                break;

            case 'solution':
                this.mining = false;
                // Stop all workers
                for (const w of this.workers) {
                    w.postMessage({ type: 'stop' });
                }
                this.onSolution(msg.nonce, msg.hash);
                break;
        }
    }

    _reportHashrate() {
        let total = 0;
        const perThread = [];
        for (let i = 0; i < this.threadCount; i++) {
            const rate = this.workerHashrates[i] || 0;
            total += rate;
            perThread.push(rate);
        }
        this.onHashrate(total, perThread);
    }

    /**
     * Start mining with given work template.
     * Each worker gets a strided nonce range:
     *   Worker k starts at nonce k, increments by threadCount.
     */
    startMining(workTemplate) {
        this.mining = true;
        const { h, midstateLen, prefixTail, suffix, diffBits } = workTemplate;

        for (let i = 0; i < this.threadCount; i++) {
            this.workerHashrates[i] = 0;
            this.workers[i].postMessage({
                type: 'start_mining',
                params: {
                    h0: h[0], h1: h[1], h2: h[2], h3: h[3],
                    h4: h[4], h5: h[5], h6: h[6], h7: h[7],
                    prefixTail: prefixTail,
                    suffix: suffix,
                    startNonce: i,
                    stride: this.threadCount,
                    diffBits: diffBits,
                    midstateLen: midstateLen,
                },
            });
        }
    }

    /**
     * Update all workers with new work (e.g., chain tip changed).
     */
    updateWork(workTemplate) {
        if (!this.mining) return;
        const { h, midstateLen, prefixTail, suffix, diffBits } = workTemplate;

        for (let i = 0; i < this.threadCount; i++) {
            this.workerHashrates[i] = 0;
            this.workers[i].postMessage({
                type: 'new_work',
                params: {
                    h0: h[0], h1: h[1], h2: h[2], h3: h[3],
                    h4: h[4], h5: h[5], h6: h[6], h7: h[7],
                    prefixTail: prefixTail,
                    suffix: suffix,
                    startNonce: i,
                    stride: this.threadCount,
                    diffBits: diffBits,
                    midstateLen: midstateLen,
                },
            });
        }
    }

    /**
     * Stop all workers.
     */
    stopMining() {
        this.mining = false;
        for (const w of this.workers) {
            w.postMessage({ type: 'stop' });
        }
        // Reset hashrates
        for (let i = 0; i < this.threadCount; i++) {
            this.workerHashrates[i] = 0;
        }
        this._reportHashrate();
    }

    /**
     * Terminate all workers entirely.
     */
    terminate() {
        for (const w of this.workers) {
            w.terminate();
        }
        this.workers = [];
        this.workerHashrates = {};
        this.workersReady = 0;
    }

    get isMining() {
        return this.mining;
    }
}

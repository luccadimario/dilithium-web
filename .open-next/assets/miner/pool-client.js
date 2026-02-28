// Pool Client — WebSocket Stratum V1 client.
// Connects to a WebSocket proxy that bridges to a Stratum TCP pool.

export class PoolClient {
    constructor(onWork, onDifficulty, onStats, onStatus) {
        this.ws = null;
        this.nextId = 1;
        this.onWork = onWork;           // (params) => void
        this.onDifficulty = onDifficulty; // (bits) => void
        this.onStats = onStats;         // (workers, blocks, shares) => void
        this.onStatus = onStatus;       // (msg) => void
        this.address = '';
        this.connected = false;
        this.reconnecting = false;
        this.wsUrl = '';
    }

    /**
     * Connect to pool via WebSocket proxy.
     * @param {string} wsUrl - WebSocket URL (e.g., ws://localhost:3001)
     * @param {string} address - Miner wallet address
     */
    connect(wsUrl, address) {
        this.wsUrl = wsUrl;
        this.address = address;
        this._connect();
    }

    _connect() {
        if (this.ws) {
            try { this.ws.close(); } catch (_) {}
        }

        this.onStatus('Connecting to pool...');
        this.ws = new WebSocket(this.wsUrl);

        this.ws.onopen = () => {
            this.connected = true;
            this.reconnecting = false;
            this.onStatus('Connected to pool');

            // Stratum handshake: subscribe
            this._send({
                id: this.nextId++,
                method: 'mining.subscribe',
                params: ['dlt-webminer/1.0'],
            });

            // Stratum handshake: authorize
            this._send({
                id: this.nextId++,
                method: 'mining.authorize',
                params: [this.address, 'x'],
            });
        };

        this.ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                this._handleMessage(msg);
            } catch (err) {
                this.onStatus(`Invalid pool message: ${err.message}`);
            }
        };

        this.ws.onclose = () => {
            this.connected = false;
            if (!this.reconnecting) {
                this.onStatus('Disconnected from pool, reconnecting in 5s...');
                this.reconnecting = true;
                setTimeout(() => this._connect(), 5000);
            }
        };

        this.ws.onerror = (err) => {
            this.onStatus('Pool connection error');
        };
    }

    _handleMessage(msg) {
        const method = msg.method;

        if (method === 'mining.set_difficulty') {
            const bits = msg.params && msg.params[0];
            if (typeof bits === 'number') {
                this.onDifficulty(bits);
                this.onStatus(`Share difficulty: ${bits} bits`);
            }
            return;
        }

        if (method === 'mining.notify') {
            const p = msg.params;
            if (!p || p.length < 10) return;

            this.onWork({
                jobId: p[0],
                blockIndex: p[1],
                prevHash: p[2],
                difficulty: p[3],
                difficultyBits: p[4],
                reward: p[5],
                txsJSON: p[6],
                poolAddress: p[7],
                timestamp: p[8],
                cleanJobs: p[9],
            });
            return;
        }

        if (method === 'pool.stats') {
            const p = msg.params;
            if (p && p.length >= 3) {
                this.onStats(p[0], p[1], p[2]);
            }
            return;
        }

        // Submit response
        if (msg.error) {
            this.onStatus(`Share rejected: ${JSON.stringify(msg.error)}`);
        }
    }

    /**
     * Submit a mining solution to the pool.
     */
    submitWork(jobId, nonce, hash) {
        this._send({
            id: this.nextId++,
            method: 'mining.submit',
            params: [this.address, jobId, nonce, hash],
        });
    }

    _send(obj) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(obj));
        }
    }

    disconnect() {
        this.reconnecting = true; // prevent auto-reconnect
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.connected = false;
    }
}

// WebSocket ↔ Stratum TCP Bridge
// Bridges browser WebSocket connections to a Stratum mining pool's TCP socket.
// Each WebSocket connection gets its own TCP connection to the pool.

const { WebSocketServer } = require('ws');
const net = require('net');

const WS_PORT = parseInt(process.env.WS_PORT || '3001', 10);
const POOL_HOST = process.env.POOL_HOST || 'localhost';
const POOL_PORT = parseInt(process.env.POOL_PORT || '3333', 10);

const wss = new WebSocketServer({
    port: WS_PORT,
    // CORS is handled by the WebSocket protocol itself (Origin header check)
    verifyClient: (info) => {
        const origin = info.origin || info.req.headers.origin;
        const allowed = [
            'https://webminer.dilithiumcoin.com',
            'http://localhost:8080',
            'http://localhost:3000',
            'http://127.0.0.1:8080',
        ];
        if (!origin || allowed.includes(origin)) {
            return true;
        }
        console.log(`[REJECT] Origin: ${origin}`);
        return false;
    },
});

console.log(`[*] DLT Pool Proxy listening on ws://0.0.0.0:${WS_PORT}`);
console.log(`[*] Relaying to Stratum pool at ${POOL_HOST}:${POOL_PORT}`);

let connectionCount = 0;

wss.on('connection', (ws, req) => {
    const connId = ++connectionCount;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    console.log(`[${connId}] WebSocket connected from ${clientIp}`);

    // Open TCP connection to pool
    const tcp = new net.Socket();
    let tcpConnected = false;
    let buffer = '';

    tcp.connect(POOL_PORT, POOL_HOST, () => {
        tcpConnected = true;
        console.log(`[${connId}] TCP connected to pool`);
    });

    // TCP → WebSocket: relay newline-delimited JSON messages
    tcp.on('data', (data) => {
        buffer += data.toString();
        const lines = buffer.split('\n');
        // Keep incomplete last line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (line.trim()) {
                try {
                    // Validate it's valid JSON before forwarding
                    JSON.parse(line);
                    if (ws.readyState === 1) { // OPEN
                        ws.send(line);
                    }
                } catch (e) {
                    console.log(`[${connId}] Invalid JSON from pool: ${line.substring(0, 100)}`);
                }
            }
        }
    });

    tcp.on('error', (err) => {
        console.log(`[${connId}] TCP error: ${err.message}`);
        if (ws.readyState === 1) {
            ws.send(JSON.stringify({
                id: null,
                error: `Pool connection error: ${err.message}`,
                result: null,
            }));
        }
    });

    tcp.on('close', () => {
        tcpConnected = false;
        console.log(`[${connId}] TCP disconnected from pool`);
        if (ws.readyState === 1) {
            ws.close(1001, 'Pool disconnected');
        }
    });

    // WebSocket → TCP: relay JSON messages as newline-delimited
    ws.on('message', (data) => {
        const msg = data.toString();
        if (tcpConnected) {
            try {
                // Validate JSON
                JSON.parse(msg);
                tcp.write(msg + '\n');
            } catch (e) {
                console.log(`[${connId}] Invalid JSON from client: ${msg.substring(0, 100)}`);
            }
        }
    });

    ws.on('close', () => {
        console.log(`[${connId}] WebSocket disconnected`);
        tcp.destroy();
    });

    ws.on('error', (err) => {
        console.log(`[${connId}] WebSocket error: ${err.message}`);
        tcp.destroy();
    });
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n[*] Shutting down...');
    wss.close(() => {
        process.exit(0);
    });
});

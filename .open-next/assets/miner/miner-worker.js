// Web Worker: loads WASM module, mines batches, reports hashrate.
// Each worker runs in its own thread with its own WASM instance.

let wasm = null;
let mining = false;
let workParams = null;

// Use MessageChannel for yielding instead of setTimeout(fn, 0).
// setTimeout has a minimum 1-4ms delay imposed by browsers after nesting depth 5.
// MessageChannel.postMessage fires on the next microtask with ~0ms overhead.
const yieldChannel = new MessageChannel();
let yieldCallback = null;
yieldChannel.port1.onmessage = () => { if (yieldCallback) yieldCallback(); };
function yieldThen(fn) {
    yieldCallback = fn;
    yieldChannel.port2.postMessage(null);
}

// Batch size per iteration — tuned for ~50-100ms batches at higher hashrates.
// Larger batches amortize the JS<->WASM call overhead and setTimeout penalty.
const BATCH_SIZE = 2000000;

// Import WASM module
async function initWasm() {
    // Import the wasm-bindgen JS glue
    const module = await import('./dlt_webminer.js');
    await module.default();
    wasm = module;
    postMessage({ type: 'ready' });
}

// Start mining with given parameters
function startMining(params) {
    mining = true;
    workParams = params;

    const {
        h0, h1, h2, h3, h4, h5, h6, h7,
        prefixTail,    // Uint8Array
        suffix,        // Uint8Array
        startNonce,    // number (this worker's starting nonce)
        stride,        // number (total workers)
        diffBits,      // number
        midstateLen,   // number
    } = params;

    let nonce = startNonce;
    let totalHashes = 0;
    let lastReport = performance.now();

    function mineBatch() {
        if (!mining) return;

        const result = wasm.mine_batch(
            h0, h1, h2, h3, h4, h5, h6, h7,
            prefixTail,
            suffix,
            nonce,
            stride,
            BATCH_SIZE,
            diffBits,
            midstateLen
        );

        totalHashes += BATCH_SIZE;
        nonce += stride * BATCH_SIZE;

        // Report hashrate every ~500ms
        const now = performance.now();
        const elapsed = (now - lastReport) / 1000;
        if (elapsed >= 0.5) {
            const hashrate = totalHashes / elapsed;
            postMessage({
                type: 'hashrate',
                hashrate: hashrate,
                totalHashes: totalHashes,
            });
            totalHashes = 0;
            lastReport = now;
        }

        if (result !== null) {
            // Found a valid hash!
            mining = false;
            postMessage({
                type: 'solution',
                nonce: result.nonce,
                hash: result.hash,
            });
            return;
        }

        // Yield to allow message processing, then continue.
        // Uses MessageChannel instead of setTimeout to avoid the 4ms minimum delay.
        yieldThen(mineBatch);
    }

    mineBatch();
}

// Message handler
self.onmessage = async function(e) {
    const msg = e.data;

    switch (msg.type) {
        case 'init':
            await initWasm();
            break;

        case 'start_mining':
            startMining(msg.params);
            break;

        case 'stop':
            mining = false;
            break;

        case 'new_work':
            // Stop current mining and start with new params
            mining = false;
            // Small delay to let current batch finish
            setTimeout(() => startMining(msg.params), 10);
            break;
    }
};

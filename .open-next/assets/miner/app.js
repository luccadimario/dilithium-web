// Main application controller — ties together UI, coordinator, work manager,
// pool client, starfield, mining animation, and trek quotes.

import { MinerCoordinator } from './miner-coordinator.js';
import { WorkManager } from './work-manager.js';
import { PoolClient } from './pool-client.js';
import { formatDLT } from './tx-builder.js';
import { Starfield } from './starfield.js';
import { MiningAnimation } from './mining-animation.js';

// ============================================================================
// Trek Quotes (from dilithium-cpu-gpu-miner)
// ============================================================================
const TREK_QUOTES = [
    "Make it so.",
    "Engage!",
    "Warp speed, Mr. Sulu!",
    "Live long and prosper.",
    "Resistance is futile.",
    "To boldly go where no one has gone before.",
    "The needs of the many outweigh the needs of the few.",
    "I'm givin' her all she's got, Captain!",
    "Beam me up, Scotty.",
    "It's a good day to mine.",
    "Set phasers to mine.",
    "Second star to the right, and straight on 'til morning.",
    "There are four lights!",
    "Logic is the beginning of wisdom, not the end.",
    "Infinite diversity in infinite combinations.",
];

function randomQuote() {
    return TREK_QUOTES[Math.floor(Math.random() * TREK_QUOTES.length)];
}

// ============================================================================
// State
// ============================================================================
let wasm = null;
let coordinator = null;
let workManager = null;
let poolClient = null;
let starfield = null;
let miningAnim = null;

let mining = false;
let startTime = null;
let uptimeInterval = null;
let quoteInterval = null;
let blocksFound = 0;
let sharesSubmitted = 0;
let totalHashes = 0;
let earnings = 0;

let currentJobId = null;
let poolShareBits = 20;

// ============================================================================
// DOM
// ============================================================================
const $ = id => document.getElementById(id);
const $walletAddress = $('wallet-address');
const $miningMode = $('mining-mode');
const $threadCount = $('thread-count');
const $nodeUrl = $('node-url');
const $poolUrl = $('pool-url');
const $poolFields = $('pool-fields');
const $startBtn = $('start-btn');
const $hashrate = $('hashrate');
const $blocksFound = $('blocks-found');
const $shares = $('shares');
const $totalHashes = $('total-hashes');
const $uptime = $('uptime');
const $earnings = $('earnings');
const $threadHashrates = $('thread-hashrates');
const $statusDot = $('status-dot');
const $statusText = $('status-text');
const $logArea = $('log-area');
const $quoteBanner = $('quote-banner');

// ============================================================================
// Init
// ============================================================================
async function init() {
    // Start visual layers
    starfield = new Starfield($('starfield'));
    miningAnim = new MiningAnimation($('mining-canvas'));

    // Populate thread count
    const cpus = navigator.hardwareConcurrency || 4;
    const defaultThreads = Math.max(1, Math.floor(cpus / 2));
    for (let i = 1; i <= cpus; i++) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = `${i}${i === defaultThreads ? ' (rec)' : ''}`;
        if (i === defaultThreads) opt.selected = true;
        $threadCount.appendChild(opt);
    }

    loadSettings();

    $miningMode.addEventListener('change', () => {
        $poolFields.classList.toggle('visible', $miningMode.value === 'pool');
        saveSettings();
    });
    $poolFields.classList.toggle('visible', $miningMode.value === 'pool');

    [$walletAddress, $nodeUrl, $poolUrl, $threadCount].forEach(el => {
        el.addEventListener('change', saveSettings);
    });

    $startBtn.addEventListener('click', toggleMining);

    // Load WASM
    setStatus('loading', 'Loading warp core...');
    try {
        const module = await import('./dlt_webminer.js');
        await module.default();
        wasm = module;
        log('Warp core online');
        setStatus('idle', 'Ready — awaiting orders, Captain');
        $startBtn.textContent = 'Engage';
        $startBtn.disabled = false;
    } catch (err) {
        setStatus('error', `Warp core failure: ${err.message}`);
        log(`WASM load error: ${err.message}`, 'error');
    }
}

// ============================================================================
// Mining Control
// ============================================================================
async function toggleMining() {
    if (mining) {
        stopMining();
    } else {
        await startMining();
    }
}

async function startMining() {
    const address = $walletAddress.value.trim();
    if (!address) {
        setStatus('error', 'Wallet address required');
        return;
    }

    const threads = parseInt($threadCount.value);
    const mode = $miningMode.value;
    const nodeUrl = $nodeUrl.value.trim();

    if (!nodeUrl) {
        setStatus('error', 'Node URL required');
        return;
    }

    mining = true;
    startTime = Date.now();
    blocksFound = 0;
    sharesSubmitted = 0;
    totalHashes = 0;
    earnings = 0;
    updateStats();

    $startBtn.textContent = 'All Stop';
    $startBtn.classList.add('mining');
    disableInputs(true);
    miningAnim.setMining(true);

    // Show quote
    showQuote();
    quoteInterval = setInterval(showQuote, 15000);

    uptimeInterval = setInterval(updateUptime, 1000);

    // Log the Trek quote
    const quote = randomQuote();
    log(`>> "${quote}" <<`, 'quote');

    coordinator = new MinerCoordinator(
        onSolution,
        onHashrate,
        (msg) => log(msg)
    );

    setStatus('loading', `Initializing ${threads} warp thread${threads > 1 ? 's' : ''}...`);
    await coordinator.init(threads);
    log(`${threads} dilithium reactor(s) online`);

    workManager = new WorkManager(
        onWorkTemplate,
        onBlockAccepted,
        (msg) => {
            log(msg);
            if (msg.includes('ACCEPTED')) setStatus('mining', msg);
        }
    );
    workManager.init(wasm);

    if (mode === 'solo') {
        setStatus('mining', 'Engaging warp drive...');
        const useProxy = location.hostname !== 'localhost' && location.hostname !== '127.0.0.1';
        workManager.startSolo(nodeUrl, address, useProxy);
    } else {
        const poolUrl = $poolUrl.value.trim();
        if (!poolUrl) {
            setStatus('error', 'Pool WebSocket URL required');
            stopMining();
            return;
        }

        poolClient = new PoolClient(
            onPoolWork,
            onPoolDifficulty,
            onPoolStats,
            (msg) => log(msg)
        );

        setStatus('mining', 'Opening subspace channel to pool...');
        poolClient.connect(poolUrl, address);
    }
}

function stopMining() {
    mining = false;
    miningAnim.setMining(false);

    if (coordinator) { coordinator.stopMining(); coordinator.terminate(); coordinator = null; }
    if (workManager) { workManager.stop(); workManager = null; }
    if (poolClient) { poolClient.disconnect(); poolClient = null; }
    if (uptimeInterval) { clearInterval(uptimeInterval); uptimeInterval = null; }
    if (quoteInterval) { clearInterval(quoteInterval); quoteInterval = null; }

    $startBtn.textContent = 'Engage';
    $startBtn.classList.remove('mining');
    disableInputs(false);
    setStatus('idle', 'All stop — engines offline');
    log('Mining halted');
    hideQuote();
}

// ============================================================================
// Callbacks
// ============================================================================
function onWorkTemplate(template) {
    if (!coordinator || !mining) return;
    if (coordinator.isMining) {
        coordinator.updateWork(template);
    } else {
        coordinator.startMining(template);
        const quote = randomQuote();
        log(`>> "${quote}" <<`, 'quote');
    }
    setStatus('mining', 'Mining at warp speed...');
}

function onSolution(nonce, hash) {
    log(`Solution found! Nonce: ${nonce}, Hash: ${hash.substring(0, 16)}...`, 'success');

    if ($miningMode.value === 'pool' && poolClient) {
        poolClient.submitWork(currentJobId, nonce, hash);
        sharesSubmitted++;
        updateStats();
        log('Share transmitted to pool');
    } else {
        if (workManager) workManager.onSolutionFound(nonce, hash);
    }
}

function onBlockAccepted(block) {
    blocksFound++;
    if (block.transactions && block.transactions.length > 0) {
        earnings += block.transactions[0].amount;
    }
    updateStats();
    log(`>> "It's a good day to mine." <<`, 'quote');
}

function onHashrate(total, perThread) {
    if (coordinator) totalHashes = coordinator.totalHashesMined;
    miningAnim.setHashrate(total);

    if (total >= 1e6) {
        $hashrate.textContent = `${(total / 1e6).toFixed(2)} MH/s`;
    } else if (total >= 1e3) {
        $hashrate.textContent = `${(total / 1e3).toFixed(1)} KH/s`;
    } else {
        $hashrate.textContent = `${Math.round(total)} H/s`;
    }

    if (totalHashes >= 1e9) {
        $totalHashes.textContent = `${(totalHashes / 1e9).toFixed(2)}G`;
    } else if (totalHashes >= 1e6) {
        $totalHashes.textContent = `${(totalHashes / 1e6).toFixed(1)}M`;
    } else if (totalHashes >= 1e3) {
        $totalHashes.textContent = `${(totalHashes / 1e3).toFixed(0)}K`;
    } else {
        $totalHashes.textContent = totalHashes.toString();
    }

    $threadHashrates.innerHTML = '';
    for (let i = 0; i < perThread.length; i++) {
        const badge = document.createElement('span');
        badge.className = 'thread-badge';
        const r = perThread[i];
        if (r >= 1e6) badge.textContent = `T${i}: ${(r / 1e6).toFixed(1)}M`;
        else if (r >= 1e3) badge.textContent = `T${i}: ${(r / 1e3).toFixed(0)}K`;
        else badge.textContent = `T${i}: ${Math.round(r)}`;
        $threadHashrates.appendChild(badge);
    }
}

// Pool callbacks
function onPoolWork(params) {
    if (!workManager || !coordinator || !mining) return;
    currentJobId = params.jobId;
    workManager.init(wasm);
    const template = workManager.buildPoolWork(params, poolShareBits, $walletAddress.value.trim());
    if (coordinator.isMining) coordinator.updateWork(template);
    else coordinator.startMining(template);
    setStatus('mining', `Pool job ${params.jobId} — block #${params.blockIndex}`);
}

function onPoolDifficulty(bits) {
    poolShareBits = bits;
    log(`Share difficulty: ${bits} bits`);
}

function onPoolStats(workers, blocks, shares) {
    log(`Pool: ${workers} workers, ${blocks} blocks, ${shares} shares`);
}

// ============================================================================
// UI
// ============================================================================
function setStatus(state, text) {
    $statusDot.className = 'status-dot';
    if (state === 'mining' || state === 'loading') $statusDot.classList.add('mining');
    else if (state === 'connected') $statusDot.classList.add('connected');
    else if (state === 'error') $statusDot.classList.add('error');
    $statusText.textContent = text;
}

function log(msg, type = '') {
    const entry = document.createElement('div');
    entry.className = `log-entry${type ? ' ' + type : ''}`;
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    entry.innerHTML = `<span class="timestamp">[${time}]</span> ${msg}`;
    $logArea.appendChild(entry);
    $logArea.scrollTop = $logArea.scrollHeight;
    while ($logArea.children.length > 200) $logArea.removeChild($logArea.firstChild);
}

function showQuote() {
    $quoteBanner.textContent = `"${randomQuote()}"`;
    $quoteBanner.classList.add('visible');
}

function hideQuote() {
    $quoteBanner.classList.remove('visible');
}

function updateStats() {
    $blocksFound.textContent = blocksFound.toString();
    $shares.textContent = sharesSubmitted.toString();
    $earnings.textContent = formatDLT(earnings);
}

function updateUptime() {
    if (!startTime) return;
    const s = Math.floor((Date.now() - startTime) / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    $uptime.textContent = `${h}:${(m).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}

function disableInputs(d) {
    [$walletAddress, $miningMode, $threadCount, $nodeUrl, $poolUrl].forEach(el => el.disabled = d);
}

function saveSettings() {
    localStorage.setItem('dlt-webminer-settings', JSON.stringify({
        walletAddress: $walletAddress.value,
        miningMode: $miningMode.value,
        threadCount: $threadCount.value,
        nodeUrl: $nodeUrl.value,
        poolUrl: $poolUrl.value,
    }));
}

function loadSettings() {
    try {
        const s = JSON.parse(localStorage.getItem('dlt-webminer-settings'));
        if (!s) return;
        if (s.walletAddress) $walletAddress.value = s.walletAddress;
        if (s.miningMode) $miningMode.value = s.miningMode;
        if (s.threadCount) $threadCount.value = s.threadCount;
        if (s.nodeUrl) $nodeUrl.value = s.nodeUrl;
        if (s.poolUrl) $poolUrl.value = s.poolUrl;
    } catch (_) {}
}

// ============================================================================
// Boot
// ============================================================================
init();

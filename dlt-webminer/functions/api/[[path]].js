// Cloudflare Pages Function — proxies /api/* to the Dilithium node.
// This avoids CORS issues since the browser makes same-origin requests.

const ALLOWED_NODES = [
    'http://cluster0.local:8001',
    'https://node.dilithiumcoin.com',
];

export async function onRequest(context) {
    const { request, params } = context;
    const url = new URL(request.url);

    // Get target node from X-Node-URL header or query param
    let nodeUrl = request.headers.get('X-Node-URL') || url.searchParams.get('node');

    if (!nodeUrl) {
        return new Response(JSON.stringify({ success: false, message: 'Missing node URL. Set X-Node-URL header or ?node= param' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // Strip trailing slash
    nodeUrl = nodeUrl.replace(/\/+$/, '');

    // Build target URL: /api/status -> nodeUrl/status
    const path = '/' + (params.path || []).join('/');
    const targetUrl = nodeUrl + path;

    try {
        // Forward the request
        const fetchOpts = {
            method: request.method,
            headers: {
                'Content-Type': request.headers.get('Content-Type') || 'application/json',
                'Accept': 'application/json',
            },
        };

        if (request.method === 'POST' || request.method === 'PUT') {
            fetchOpts.body = await request.text();
        }

        const resp = await fetch(targetUrl, fetchOpts);
        const body = await resp.text();

        return new Response(body, {
            status: resp.status,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Node-URL',
            },
        });
    } catch (err) {
        return new Response(JSON.stringify({ success: false, message: `Proxy error: ${err.message}` }), {
            status: 502,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

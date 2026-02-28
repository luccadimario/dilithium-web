import { NextRequest, NextResponse } from "next/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Node-URL",
};

export async function OPTIONS() {
  return NextResponse.json(null, { status: 204, headers: CORS_HEADERS });
}

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const url = new URL(request.url);

  // Get target node from header or query param
  let nodeUrl =
    request.headers.get("X-Node-URL") || url.searchParams.get("node");

  if (!nodeUrl) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Missing node URL. Set X-Node-URL header or ?node= param",
      },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  // Strip trailing slashes
  nodeUrl = nodeUrl.replace(/\/+$/, "");

  // Build target URL: /api/miner-proxy/status → nodeUrl/status
  const targetPath = "/" + path.join("/");
  const targetUrl = nodeUrl + targetPath;

  try {
    const fetchOpts: RequestInit = {
      method: request.method,
      headers: {
        "Content-Type":
          request.headers.get("Content-Type") || "application/json",
        Accept: "application/json",
      },
    };

    if (request.method === "POST" || request.method === "PUT") {
      fetchOpts.body = await request.text();
    }

    const resp = await fetch(targetUrl, fetchOpts);
    const body = await resp.text();

    return new NextResponse(body, {
      status: resp.status,
      headers: {
        "Content-Type": "application/json",
        ...CORS_HEADERS,
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown proxy error";
    return NextResponse.json(
      { success: false, message: `Proxy error: ${message}` },
      { status: 502, headers: CORS_HEADERS }
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;

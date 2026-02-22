import { httpRouter } from "convex/server";
import {
  getAddress,
  getStatus,
  submitTransaction,
  getMempool,
  corsPreflightHandler,
} from "./node";

const http = httpRouter();

// Node proxy endpoints
http.route({
  path: "/api/address",
  method: "GET",
  handler: getAddress,
});

http.route({
  path: "/api/status",
  method: "GET",
  handler: getStatus,
});

http.route({
  path: "/api/transaction",
  method: "POST",
  handler: submitTransaction,
});

http.route({
  path: "/api/transaction",
  method: "OPTIONS",
  handler: corsPreflightHandler,
});

http.route({
  path: "/api/mempool",
  method: "GET",
  handler: getMempool,
});

export default http;

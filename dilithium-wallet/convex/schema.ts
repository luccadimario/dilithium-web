import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Cached address balances (public data, refreshed periodically)
  addressCache: defineTable({
    address: v.string(),
    balance: v.number(),
    txCount: v.number(),
    lastFetched: v.number(),
  }).index("by_address", ["address"]),

  // Rate limiting for transaction submissions
  rateLimits: defineTable({
    key: v.string(),
    count: v.number(),
    windowStart: v.number(),
  }).index("by_key", ["key"]),
});

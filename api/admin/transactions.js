/**
 * API: List All Transactions
 */

import { verifyAdminToken } from "./login.js";
import { readJsonFile } from "../_lib/github-store.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  if (!verifyAdminToken(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { content } = await readJsonFile("transactions/pending.json");
    let transactions = content || [];

    // Sort by newest first
    transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    if (limit) transactions = transactions.slice(0, limit);

    return res.status(200).json({ success: true, transactions });
  } catch (error) {
    console.error("[Admin Transactions] Error:", error);
    return res.status(500).json({ error: error.message });
  }
}

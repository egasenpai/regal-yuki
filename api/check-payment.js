/**
 * API: Check Payment Status
 * Cek dari GitHub store + Austin Pay (GET /deposit/check/:id)
 */

import { findTransaction } from "./_lib/github-store.js";

const AUSTIN_API_KEY = "apg_live_2a4243de5dc357129aad98cf1f97fead774cf0c58af91a2f";
const AUSTIN_BASE_URL = "https://austinstore.id";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { ref } = req.query;
  if (!ref) return res.status(400).json({ error: "Reference ID required" });

  const txn = await findTransaction(ref);
  if (!txn) return res.status(404).json({ error: "Transaction not found" });

  let austinStatus = null;
  if (txn.status === "pending" && txn.austinTxId) {
    try {
      const checkRes = await fetch(
        `${AUSTIN_BASE_URL}/api/v1/deposit/check/${txn.austinTxId}?apikey=${AUSTIN_API_KEY}`
      );
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        austinStatus = checkData.data?.status || checkData.status || null;
      }
    } catch (e) {
      console.log("[Check] Austin Pay check failed:", e.message);
    }
  }

  return res.status(200).json({
    success: true,
    status: txn.status,
    austinStatus,
    productName: txn.productName,
    price: txn.price,
    serverInfo: txn.serverInfo || null
  });
}

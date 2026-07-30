/**
 * API: Check Payment Status
 * Cek dari GitHub store + Austin Pay (GET /deposit/check/:id)
 */

import { findTransaction } from "./_lib/github-store.js";
import { austinFetchSigned } from "./_lib/austin-fetch.js";

const AUSTIN_API_KEY = "apg_live_7b2866c45bfe752cc6a51a5c719087e121bf26430377ce46";
const AUSTIN_API_SECRET = "aps_68b377e6d57c7096a31b110d7b0862d059eae4c4155dcb2f61bef3449c2d3ed2";
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
      const checkPath = `/api/v2/deposit/check/${txn.austinTxId}`;
      const checkRes = await austinFetchSigned(
        AUSTIN_BASE_URL,
        checkPath,
        { method: "GET" },
        AUSTIN_API_KEY,
        AUSTIN_API_SECRET
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
    buyerName: txn.buyerName,
    buyerWa: txn.buyerWa,
    panelUsername: txn.panelUsername,
    panelEmail: txn.panelEmail,
    serverInfo: txn.serverInfo || null
  });
}

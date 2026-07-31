/**
 * API: Check Payment Status
 * Cek dari GitHub store + Austin Pay (GET /deposit/check/:id)
 * FALLBACK: Kalau Austin sudah paid tapi webhook gak masuk, auto-create server
 */

import { findTransaction, readJsonFile, updateTransactionStatus } from "./_lib/github-store.js";
import { austinFetchSigned } from "./_lib/austin-fetch.js";
import { createServer } from "./_lib/pterodactyl.js";

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

  try {
    const txn = await findTransaction(ref);
    if (!txn) {
      console.log(`[Check] Transaction not found: ${ref}`);
      return res.status(404).json({ error: "Transaction not found" });
    }

    let austinStatus = null;
    let serverInfo = txn.serverInfo || null;
    let currentStatus = txn.status;

    // Cek ke Austin Pay kalau masih pending
    if ((txn.status === "pending" || txn.status === "processing") && txn.austinTxId) {
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
          console.log(`[Check] Austin status for ${ref}: ${austinStatus}`);

          // FALLBACK: Kalau Austin sudah paid tapi lokal masih pending/processing
          const paidStatuses = ['paid', 'completed', 'success', 'settlement', 'done'];
          if (austinStatus && paidStatuses.includes(austinStatus.toString().toLowerCase()) && txn.status !== "completed") {
            console.log(`[Check] Austin paid but local status=${txn.status}. Running fallback...`);

            const { content, sha } = await readJsonFile("transactions/pending.json");
            const freshTxn = content?.find(t => t.referenceId === ref || t.id === ref || t.austinTxId === ref);

            if (freshTxn && freshTxn.status !== "completed") {
              await updateTransactionStatus(ref, "processing", { austinStatus, paidAt: new Date().toISOString() });
              try {
                const newServerInfo = await createServer({
                  username: freshTxn.panelUsername,
                  email: freshTxn.panelEmail,
                  productName: freshTxn.productName
                });
                await updateTransactionStatus(ref, "completed", {
                  serverInfo: newServerInfo,
                  austinStatus,
                  austinAmount: freshTxn.price,
                  paidAt: new Date().toISOString()
                });
                serverInfo = newServerInfo;
                currentStatus = "completed";
                console.log(`[Check] Fallback success! Server: ${newServerInfo.serverId}`);
              } catch (ptErr) {
                console.error("[Check] Fallback create server failed:", ptErr.message);
                await updateTransactionStatus(ref, "failed", { error: ptErr.message, austinStatus });
                currentStatus = "failed";
              }
            } else if (freshTxn?.status === "completed") {
              currentStatus = "completed";
              serverInfo = freshTxn.serverInfo || null;
            }
          }
        } else {
          const errText = await checkRes.text();
          console.log(`[Check] Austin check failed ${checkRes.status}:`, errText.substring(0, 200));
        }
      } catch (e) {
        console.log("[Check] Austin Pay check error:", e.message);
      }
    }

    return res.status(200).json({
      success: true,
      status: currentStatus,
      austinStatus,
      productName: txn.productName,
      price: txn.price,
      buyerName: txn.buyerName,
      buyerWa: txn.buyerWa,
      panelUsername: txn.panelUsername,
      panelEmail: txn.panelEmail,
      serverInfo: serverInfo
    });

  } catch (error) {
    console.error("[Check] Fatal error:", error);
    return res.status(500).json({ error: "Internal server error", detail: error.message });
  }
}

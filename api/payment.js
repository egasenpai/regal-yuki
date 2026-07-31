/**
 * API: Create Deposit QRIS via Austin Pay
 */

import { appendTransaction } from "./_lib/github-store.js";
import { austinFetchSigned } from "./_lib/austin-fetch.js";

const AUSTIN_API_KEY = "apg_live_7b2866c45bfe752cc6a51a5c719087e121bf26430377ce46";
const AUSTIN_API_SECRET = "aps_68b377e6d57c7096a31b110d7b0862d059eae4c4155dcb2f61bef3449c2d3ed2";
const AUSTIN_BASE_URL = "https://austinstore.id";

const WEBHOOK_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}/api/callback`
  : "https://regal-yuki.vercel.app/api/callback";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { productName, price, buyerName, buyerWa, panelUsername, panelEmail } = req.body;

    if (!productName || !price || !buyerName || !buyerWa || !panelUsername || !panelEmail) {
      return res.status(400).json({
        error: "Data tidak lengkap. Wajib: productName, price, buyerName, buyerWa, panelUsername, panelEmail"
      });
    }

    const referenceId = `YS${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const txn = {
      id: referenceId,
      referenceId,
      productName,
      price: parseInt(price),
      buyerName,
      buyerWa,
      panelUsername,
      panelEmail,
      austinTxId: null,
      status: "pending",
      createdAt: new Date().toISOString()
    };

    // [FIX] Simpan dulu ke GitHub, kalau gagal jangan lanjut!
    try {
      await appendTransaction(txn);
      console.log("[Payment] Transaction saved:", referenceId);
    } catch (saveErr) {
      console.error("[Payment] Failed to save transaction:", saveErr.message);
      return res.status(500).json({ 
        error: "Gagal menyimpan transaksi. Cek REGAL_TOKEN di environment variable.",
        detail: saveErr.message 
      });
    }

    const path = "/api/v2/deposit/create";
    console.log("[Payment] Calling Austin Pay:", `${AUSTIN_BASE_URL}${path}`);

    const requestBody = {
      amount: parseInt(price),
      method: "qris",
      merchant_ref: referenceId,
      customer_name: buyerName,
      customer_email: panelEmail,
      customer_phone: buyerWa,
      callback_url: WEBHOOK_URL,
      return_url: `https://regal-yuki.vercel.app/?payment=success&ref=${referenceId}`,
      description: `Pembelian ${productName} - ${buyerName}`
    };
    
    const requestBodyStr = JSON.stringify(requestBody);
    const austinRes = await austinFetchSigned(
      AUSTIN_BASE_URL,
      path,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: requestBodyStr
      },
      AUSTIN_API_KEY,
      AUSTIN_API_SECRET
    );

    const responseText = await austinRes.text();
    console.log(`[Payment] Austin Pay response ${austinRes.status}:`, responseText.substring(0, 500));

    if (!austinRes.ok) {
      let errDetail = responseText;
      try {
        const errJson = JSON.parse(responseText);
        errDetail = errJson.message || errJson.error || JSON.stringify(errJson);
      } catch {}
      return res.status(500).json({
        error: "Gagal membuat pembayaran QRIS",
        detail: errDetail,
        status: austinRes.status
      });
    }

    let austinData;
    try {
      austinData = JSON.parse(responseText);
    } catch {
      return res.status(500).json({ error: "Response Austin Pay bukan JSON valid", raw: responseText });
    }

    if (austinData.success === false) {
      return res.status(500).json({
        error: "Austin Pay mengembalikan success=false",
        detail: austinData.message || austinData
      });
    }

    const d = austinData.deposit || austinData.data || austinData;
    const austinTxId = d.transaction_id || d.transactionId || d.id || d.reference || referenceId;
    const qrImage = d.qr_image || d.qrImage || d.qrUrl || d.qr_url || d.qrCode || d.qr_code || null;
    const expiredAt = d.expired_at || d.expiredAt || d.expiresAt || d.expires_at || null;

    // Update austinTxId
    try {
      const { readJsonFile, writeJsonFile } = await import("./_lib/github-store.js");
      const { content, sha } = await readJsonFile("transactions/pending.json");
      if (content) {
        const idx = content.findIndex(t => t.referenceId === referenceId);
        if (idx !== -1) {
          content[idx].austinTxId = austinTxId;
          await writeJsonFile("transactions/pending.json", content, sha, `Update ${referenceId} with Austin TX ID`);
        }
      }
    } catch (e) {
      console.error("[Payment] Failed to update austinTxId:", e.message);
    }

    return res.status(200).json({
      success: true,
      referenceId: referenceId,
      austinTxId: austinTxId,
      qrImage,
      amount: price,
      expiredAt: expiredAt || new Date(Date.now() + 10 * 60 * 1000).toISOString()
    });

  } catch (error) {
    console.error("[Payment API] Error:", error);
    return res.status(500).json({ error: error.message });
  }
}

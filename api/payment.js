/**
 * API: Create Deposit QRIS via Austin Pay
 * Endpoint: POST /api/v1/deposit/create?apikey=xxx
 * QRIS: expired 10 menit
 * Rate limit: 5 req/menit per IP
 */

import { appendTransaction } from "./_lib/github-store.js";
import { austinFetchSigned } from "./_lib/austin-fetch.js";
import { checkUsernameExists } from "./_lib/pterodactyl.js";

const AUSTIN_API_KEY = "apg_live_7b2866c45bfe752cc6a51a5c719087e121bf26430377ce46";
const AUSTIN_API_SECRET = "aps_68b377e6d57c7096a31b110d7b0862d059eae4c4155dcb2f61bef3449c2d3ed2";
const AUSTIN_BASE_URL = "https://austinstore.id";

const WEBHOOK_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}/api/callback`
  : "https://yukii-store.vercel.app/api/callback";

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

    // Cek duplikat username di panel
    const usernameCheck = await checkUsernameExists(panelUsername);
    if (usernameCheck.exists) {
      return res.status(409).json({
        error: "Username sudah terdaftar di panel. Silakan gunakan username lain.",
        field: "panelUsername",
        duplicate: true
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
    await appendTransaction(txn);
    console.log("[Payment] Transaction saved:", referenceId);

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
      return_url: `https://yukii-store.vercel.app/?payment=success&ref=${referenceId}`,
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
    console.log(`[Payment] Austin Pay response ${austinRes.status}:`, responseText.substring(0, 1000));

    if (!austinRes.ok) {
      let errDetail = responseText;
      try {
        const errJson = JSON.parse(responseText);
        errDetail = errJson.message || errJson.error || JSON.stringify(errJson);
      } catch {}
      return res.status(500).json({
        error: "Gagal membuat pembayaran QRIS",
        detail: errDetail,
        status: austinRes.status,
        hint: austinRes.status === 403
          ? "IP Vercel ditolak. Kalau HMAC-only mode belum diaktifkan, IP Vercel yang berubah-ubah gak akan pernah lolos whitelist — aktifkan toggle 'Wajibkan IP Whitelist' = OFF di dashboard AustinPay (Profil → API Secret), pastikan AUSTIN_API_SECRET sudah diset."
          : austinRes.status === 401
          ? "API key/signature ditolak. Cek AUSTIN_API_KEY & AUSTIN_API_SECRET di environment variable Vercel sudah sesuai dengan dashboard AustinPay."
          : "Lihat 'detail' di atas untuk alasan spesifiknya dari AustinPay."
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
    const qrString = d.qr_string || d.qrString || d.qrCode || d.qr_code || null;
    const expiredAt = d.expired_at || d.expiredAt || d.expiresAt || d.expires_at || null;

    const { readJsonFile, writeJsonFile } = await import("./_lib/github-store.js");
    const { content, sha } = await readJsonFile("transactions/pending.json");
    if (content) {
      const idx = content.findIndex(t => t.referenceId === referenceId);
      if (idx !== -1) {
        content[idx].austinTxId = austinTxId;
        await writeJsonFile("transactions/pending.json", content, sha, `Update ${referenceId} with Austin TX ID`);
      }
    }

    return res.status(200).json({
      success: true,
      referenceId: referenceId,
      austinTxId: austinTxId,
      qrImage,
      qrString,
      amount: price,
      expiredAt: expiredAt || new Date(Date.now() + 10 * 60 * 1000).toISOString()
    });

  } catch (error) {
    console.error("[Payment API] Error:", error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * API: Webhook Callback dari Austin Pay
 * Event: deposit.paid
 * Format exact dari docs Austin Pay
 */

import crypto from "crypto";
import { findTransaction, updateTransactionStatus } from "./_lib/github-store.js";
import { createServer } from "./_lib/pterodactyl.js";

const ADMIN_WA = "6288246387665";
const WEBHOOK_SECRET = process.env.AUSTINPAY_WEBHOOK_SECRET || "";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const signature = req.headers["x-austinpay-signature"] || req.headers["X-AustinPay-Signature"] || "";
    const eventHeader = req.headers["x-austinpay-event"] || req.headers["X-AustinPay-Event"] || "";

    console.log("[Webhook] Headers:", { "x-austinpay-event": eventHeader, "x-austinpay-signature": signature ? "present" : "missing" });

    const rawBody = JSON.stringify(req.body);

    if (WEBHOOK_SECRET && signature) {
      const expected = crypto
        .createHmac("sha256", WEBHOOK_SECRET)
        .update(rawBody)
        .digest("hex");

      try {
        const isValid = crypto.timingSafeEqual(
          Buffer.from(signature, "hex"),
          Buffer.from(expected, "hex")
        );
        if (!isValid) {
          console.error("[Webhook] Invalid signature!");
          return res.status(401).json({ error: "Invalid signature" });
        }
        console.log("[Webhook] Signature valid ✓");
      } catch (sigErr) {
        console.error("[Webhook] Signature comparison error:", sigErr.message);
        if (WEBHOOK_SECRET) return res.status(401).json({ error: "Signature verification failed" });
      }
    } else {
      console.log("[Webhook] Skipping signature verification (no secret or no signature)");
    }

    const body = req.body;
    console.log("[Webhook] Raw body:", JSON.stringify(body, null, 2));

    const event = body.event || eventHeader || "unknown";
    const d = body.data || {};

    const transactionId = d.transactionId || d.id || d.reference || body.transactionId;
    const status = d.status || body.status || "unknown";
    const amount = d.amount || body.amount || 0;
    const paidAt = d.paidAt || d.paid_at || body.paidAt;

    console.log(`[Webhook] Event=${event}, TX=${transactionId}, status=${status}, amount=${amount}`);

    if (event !== "deposit.paid") {
      console.log(`[Webhook] Event '${event}' bukan deposit.paid. Diabaikan.`);
      return res.status(200).json({ message: `Event '${event}' ignored` });
    }

    if (!transactionId) {
      return res.status(400).json({ error: "No transactionId found in webhook body", received: body });
    }

    const txn = await findTransaction(transactionId);
    if (!txn) {
      console.error(`[Webhook] Transaksi tidak ditemukan: ${transactionId}`);
      return res.status(404).json({ error: "Transaction not found", txId: transactionId });
    }

    if (txn.status === "completed") {
      return res.status(200).json({ message: "Already processed" });
    }

    await updateTransactionStatus(txn.referenceId, "processing", { paidAt, austinAmount: amount });

    let serverInfo;
    try {
      serverInfo = await createServer({
        username: txn.panelUsername,
        email: txn.panelEmail,
        productName: txn.productName
      });
      console.log("[Webhook] Server created:", serverInfo.serverId);
    } catch (ptErr) {
      console.error("[Pterodactyl] Create server failed:", ptErr.message);
      await updateTransactionStatus(txn.referenceId, "failed", { error: ptErr.message, paidAt });
      await notifyAdmin(txn, null, ptErr.message);
      return res.status(500).json({ error: "Server creation failed", detail: ptErr.message });
    }

    await updateTransactionStatus(txn.referenceId, "completed", { serverInfo, paidAt, austinAmount: amount });

    await notifyAdmin(txn, serverInfo);
    await notifyUser(txn, serverInfo);

    return res.status(200).json({ success: true, message: "Server created & notified" });

  } catch (error) {
    console.error("[Callback] Error:", error);
    return res.status(500).json({ error: error.message });
  }
}

async function notifyAdmin(txn, serverInfo, errorMsg = null) {
  const phone = ADMIN_WA;
  let text = "";

  if (errorMsg) {
    text = `🚨 *GAGAL CREATE SERVER* 🚨\n\n` +
           `Ref: ${txn.referenceId}\n` +
           `Austin TX: ${txn.austinTxId || '-'}\n` +
           `Produk: ${txn.productName}\n` +
           `User: ${txn.buyerName} (${txn.buyerWa})\n` +
           `Panel User: ${txn.panelUsername}\n` +
           `Error: ${errorMsg}\n\n` +
           `Mohon create manual ya!`;
  } else {
    text = `✅ *PEMBAYARAN SUKSES & SERVER DIBUAT* ✅\n\n` +
           `Ref: ${txn.referenceId}\n` +
           `Austin TX: ${txn.austinTxId || '-'}\n` +
           `Produk: ${txn.productName}\n` +
           `Harga: Rp ${txn.price.toLocaleString('id-ID')}\n\n` +
           `👤 *Pembeli:*\n` +
           `Nama: ${txn.buyerName}\n` +
           `WA: ${txn.buyerWa}\n` +
           `Username Panel: ${txn.panelUsername}\n` +
           `Email: ${txn.panelEmail}\n\n` +
           `🖥️ *Server Info:*\n` +
           `Server ID: ${serverInfo.serverId}\n` +
           `Panel URL: ${serverInfo.panelUrl}\n` +
           `Login: ${serverInfo.username}\n` +
           `Password: ${serverInfo.password}`;
  }

  const encoded = encodeURIComponent(text);
  try {
    await fetch(`https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encoded}&apikey=YOUR_CALLMEBOT_KEY`, { timeout: 5000 });
  } catch (e) {
    console.log("[Notify Admin] WA send failed:", e.message);
  }
}

async function notifyUser(txn, serverInfo) {
  const phone = txn.buyerWa.replace(/^0/, "62").replace(/\D/g, "");
  const text = `🎉 *Pembayaran Berhasil!* 🎉\n\n` +
               `Terima kasih ${txn.buyerName} telah membeli *${txn.productName}* di Yuki Store.\n\n` +
               `🖥️ *Detail Panel Anda:*\n` +
               `🔗 Panel: ${serverInfo.panelUrl}\n` +
               `👤 Username: ${serverInfo.username}\n` +
               `🔑 Password: ${serverInfo.password}\n\n` +
               `Silakan login dan ganti password Anda.\n` +
               `Jika ada kendala, hubungi admin Yuki Store.`;

  const encoded = encodeURIComponent(text);
  try {
    await fetch(`https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encoded}&apikey=YOUR_CALLMEBOT_KEY`, { timeout: 5000 });
  } catch (e) {
    console.log("[Notify User] WA send failed:", e.message);
  }
}

import { findTransaction, updateTransactionStatus } from "./_lib/github-store.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { ref } = req.body;
    if (!ref) return res.status(400).json({ error: "Reference ID required" });

    const txn = await findTransaction(ref);
    if (!txn) return res.status(404).json({ error: "Transaction not found" });

    if (txn.status === "completed") {
      return res.status(400).json({ error: "Transaction already completed" });
    }

    await updateTransactionStatus(ref, "cancelled", { cancelledAt: new Date().toISOString() });
    return res.status(200).json({ success: true, message: "Transaction cancelled" });
  } catch (error) {
    console.error("[Cancel] Error:", error);
    return res.status(500).json({ error: error.message });
  }
}

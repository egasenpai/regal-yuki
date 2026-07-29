/**
 * API: Public Config
 * Returns store config (safe fields only)
 */

import { readJsonFile } from "./_lib/github-store.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { content } = await readJsonFile("data/config.json");
    const config = content || {};
    return res.status(200).json({
      success: true,
      maintenanceMode: config.maintenanceMode || false,
      maintenanceMessage: config.maintenanceMessage || "Sedang maintenance, silakan kembali lagi nanti.",
      storeName: config.storeName || "Yuki Store"
    });
  } catch (error) {
    return res.status(200).json({
      success: true,
      maintenanceMode: false,
      maintenanceMessage: "",
      storeName: "Yuki Store"
    });
  }
}

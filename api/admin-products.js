/**
 * API: Public Products Endpoint
 * Frontend mengambil daftar produk yang aktif dari sini
 */

import { getProducts } from "./_lib/admin-store.js";
import { getAdminConfig } from "./_lib/admin-store.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const config = await getAdminConfig();
    const products = await getProducts();

    const activeProducts = config.storeOpen 
      ? products.filter(p => p.active !== false)
      : [];

    return res.status(200).json({
      success: true,
      storeOpen: config.storeOpen,
      products: activeProducts
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

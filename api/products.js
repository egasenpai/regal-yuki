/**
 * API: Public Products List
 * Returns all active products from GitHub storage
 */

import { readJsonFile } from "./_lib/github-store.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { content } = await readJsonFile("data/products.json");
    let products = content || [];
    products = products.filter(p => p.enabled !== false);
    return res.status(200).json({ success: true, products });
  } catch (error) {
    console.error("[Public Products] Error:", error);
    return res.status(200).json({
      success: true,
      products: [
        { id: 1, name: "Panel 1GB", price: 2000, specs: "VPS R18 C4 • Aktif 30 Hari", ram: "1GB" },
        { id: 2, name: "Panel 2GB", price: 3000, specs: "VPS R18 C4 • Aktif 30 Hari", ram: "2GB" },
        { id: 3, name: "Panel 3GB", price: 4000, specs: "VPS R18 C4 • Aktif 30 Hari", ram: "3GB" },
        { id: 4, name: "Panel 4GB", price: 5000, specs: "VPS R18 C4 • Aktif 30 Hari", ram: "4GB" },
        { id: 5, name: "Panel 5GB", price: 6000, specs: "VPS R18 C4 • Aktif 30 Hari", ram: "5GB" },
        { id: 6, name: "Panel 6GB", price: 7000, specs: "VPS R18 C4 • Aktif 30 Hari", ram: "6GB" },
        { id: 7, name: "Panel 7GB", price: 8000, specs: "VPS R18 C4 • Aktif 30 Hari", ram: "7GB" },
        { id: 8, name: "Panel 8GB", price: 9000, specs: "VPS R18 C4 • Aktif 30 Hari", ram: "8GB" },
        { id: 9, name: "Panel 9GB", price: 10000, specs: "VPS R18 C4 • Aktif 30 Hari", ram: "9GB" },
        { id: 10, name: "Panel 10GB", price: 11000, specs: "VPS R18 C4 • Aktif 30 Hari", ram: "10GB" },
        { id: 11, name: "Panel UNLIMITED", price: 25000, specs: "VPS R18 C4 • Aktif 30 Hari", ram: "UNLIMITED" }
      ]
    });
  }
}

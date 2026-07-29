/**
 * API: CRUD Products
 * Store products in GitHub JSON
 */

import { verifyAdminToken } from "./login.js";
import { readJsonFile, writeJsonFile } from "../_lib/github-store.js";

const PRODUCTS_PATH = "data/products.json";

async function getProducts() {
  const { content } = await readJsonFile(PRODUCTS_PATH);
  // Fallback to default products if not exists
  if (!content) {
    const defaults = [
      { id: 1, name: "Panel 1GB", price: 2000, specs: "VPS R18 C4 • Aktif 30 Hari", ram: "1GB", category: "panel", enabled: true },
      { id: 2, name: "Panel 2GB", price: 3000, specs: "VPS R18 C4 • Aktif 30 Hari", ram: "2GB", category: "panel", enabled: true },
      { id: 3, name: "Panel 3GB", price: 4000, specs: "VPS R18 C4 • Aktif 30 Hari", ram: "3GB", category: "panel", enabled: true },
      { id: 4, name: "Panel 4GB", price: 5000, specs: "VPS R18 C4 • Aktif 30 Hari", ram: "4GB", category: "panel", enabled: true },
      { id: 5, name: "Panel 5GB", price: 6000, specs: "VPS R18 C4 • Aktif 30 Hari", ram: "5GB", category: "panel", enabled: true },
      { id: 6, name: "Panel 6GB", price: 7000, specs: "VPS R18 C4 • Aktif 30 Hari", ram: "6GB", category: "panel", enabled: true },
      { id: 7, name: "Panel 7GB", price: 8000, specs: "VPS R18 C4 • Aktif 30 Hari", ram: "7GB", category: "panel", enabled: true },
      { id: 8, name: "Panel 8GB", price: 9000, specs: "VPS R18 C4 • Aktif 30 Hari", ram: "8GB", category: "panel", enabled: true },
      { id: 9, name: "Panel 9GB", price: 10000, specs: "VPS R18 C4 • Aktif 30 Hari", ram: "9GB", category: "panel", enabled: true },
      { id: 10, name: "Panel 10GB", price: 11000, specs: "VPS R18 C4 • Aktif 30 Hari", ram: "10GB", category: "panel", enabled: true },
      { id: 11, name: "Panel UNLIMITED", price: 25000, specs: "VPS R18 C4 • Aktif 30 Hari", ram: "UNLIMITED", category: "panel", enabled: true }
    ];
    await writeJsonFile(PRODUCTS_PATH, defaults, null, "Init default products");
    return defaults;
  }
  return content;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (!verifyAdminToken(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    if (req.method === "GET") {
      const products = await getProducts();
      return res.status(200).json({ success: true, products });
    }

    if (req.method === "POST") {
      const { id, name, price, specs, ram, category, enabled } = req.body;
      let products = await getProducts();

      if (id) {
        // Update existing
        const idx = products.findIndex(p => p.id === id);
        if (idx === -1) return res.status(404).json({ error: "Product not found" });
        products[idx] = { ...products[idx], name, price, specs, ram, category, enabled };
      } else {
        // Create new
        const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
        products.push({ id: newId, name, price, specs, ram, category: category || "panel", enabled: enabled !== false });
      }

      const { sha } = await readJsonFile(PRODUCTS_PATH);
      await writeJsonFile(PRODUCTS_PATH, products, sha, id ? `Update product ${id}` : "Add new product");
      return res.status(200).json({ success: true, products });
    }

    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: "ID required" });
      let products = await getProducts();
      products = products.filter(p => p.id !== parseInt(id));
      const { sha } = await readJsonFile(PRODUCTS_PATH);
      await writeJsonFile(PRODUCTS_PATH, products, sha, `Delete product ${id}`);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("[Admin Products] Error:", error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * API: Get/Update Config
 * Store config in GitHub JSON
 */

import { verifyAdminToken } from "./login.js";
import { readJsonFile, writeJsonFile } from "../_lib/github-store.js";

const CONFIG_PATH = "data/config.json";

export async function getConfig() {
  const { content } = await readJsonFile(CONFIG_PATH);
  if (!content) {
    const defaults = {
      maintenanceMode: false,
      maintenanceMessage: "Sedang maintenance, silakan kembali lagi nanti.",
      panelUrl: "https://regal-yuki.privateserverr.web.id",
      panelApiKey: "ptla_OPFxbMpuWJuGe0L4p6BnZr4IAUCdzT4lXWUM9m9YYOL",
      eggId: "15",
      nestId: "5",
      locationId: "1",
      storeName: "Yuki Store",
      adminWa: "6288246387665"
    };
    await writeJsonFile(CONFIG_PATH, defaults, null, "Init default config");
    return defaults;
  }
  return content;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (!verifyAdminToken(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    if (req.method === "GET") {
      const config = await getConfig();
      // Don't expose full API key in response
      const safeConfig = { ...config };
      if (safeConfig.panelApiKey) {
        safeConfig.panelApiKey = safeConfig.panelApiKey.substring(0, 8) + "..." + safeConfig.panelApiKey.slice(-4);
      }
      return res.status(200).json({ success: true, config: safeConfig });
    }

    if (req.method === "POST") {
      const current = await getConfig();
      const updates = req.body;
      const newConfig = { ...current, ...updates };
      const { sha } = await readJsonFile(CONFIG_PATH);
      await writeJsonFile(CONFIG_PATH, newConfig, sha, "Update config");
      return res.status(200).json({ success: true, config: newConfig });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("[Admin Config] Error:", error);
    return res.status(500).json({ error: error.message });
  }
}

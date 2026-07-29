/**
 * API: Check if username exists in Pterodactyl
 */

import { verifyAdminToken } from "./login.js";
import { getConfig } from "./config.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  if (!verifyAdminToken(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { username } = req.query;
  if (!username) return res.status(400).json({ error: "Username required" });

  try {
    const config = await getConfig();
    const panelUrl = config.panelUrl || "https://regal-yuki.privateserverr.web.id";
    const apiKey = config.panelApiKey || "ptla_OPFxbMpuWJuGe0L4p6BnZr4IAUCdzT4lXWUM9m9YYOL";

    // Check by username
    const res1 = await fetch(`${panelUrl}/api/application/users?filter[username]=${encodeURIComponent(username)}`, {
      headers: { "Authorization": `Bearer ${apiKey}`, "Accept": "application/json" }
    });

    if (res1.ok) {
      const data = await res1.json();
      if (data.data && data.data.length > 0) {
        return res.status(200).json({ exists: true, user: data.data[0].attributes });
      }
    }

    // Also check by email as fallback
    const res2 = await fetch(`${panelUrl}/api/application/users?filter[email]=${encodeURIComponent(username + "@yuki.store")}`, {
      headers: { "Authorization": `Bearer ${apiKey}`, "Accept": "application/json" }
    });

    if (res2.ok) {
      const data2 = await res2.json();
      if (data2.data && data2.data.length > 0) {
        return res.status(200).json({ exists: true, user: data2.data[0].attributes });
      }
    }

    return res.status(200).json({ exists: false });
  } catch (error) {
    console.error("[Check Username] Error:", error);
    return res.status(500).json({ error: error.message });
  }
}

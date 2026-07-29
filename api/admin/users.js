/**
 * API: List Users from Pterodactyl Panel
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

  try {
    const config = await getConfig();
    const panelUrl = config.panelUrl || "https://regal-yuki.privateserverr.web.id";
    const apiKey = config.panelApiKey || "ptla_OPFxbMpuWJuGe0L4p6BnZr4IAUCdzT4lXWUM9m9YYOL";

    const usersRes = await fetch(`${panelUrl}/api/application/users?per_page=100`, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Accept": "application/json"
      }
    });

    if (!usersRes.ok) {
      const err = await usersRes.text();
      return res.status(500).json({ error: "Failed to fetch users", detail: err });
    }

    const usersData = await usersRes.json();
    const users = (usersData.data || []).map(u => ({
      id: u.attributes.id,
      username: u.attributes.username,
      email: u.attributes.email,
      serverCount: u.attributes.relationships?.servers?.data?.length || 0
    }));

    return res.status(200).json({ success: true, users });
  } catch (error) {
    console.error("[Admin Users] Error:", error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * API: Check Pterodactyl Panel Status
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

    const start = Date.now();
    const statusRes = await fetch(`${panelUrl}/api/application/servers?per_page=1`, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Accept": "application/json"
      }
    });
    const responseTime = Date.now() - start;

    let specs = null;
    let online = false;

    if (statusRes.ok) {
      online = true;
      const data = await statusRes.json();
      const servers = data.meta?.pagination?.total || 0;

      // Try to get node info for specs
      try {
        const nodesRes = await fetch(`${panelUrl}/api/application/nodes`, {
          headers: { "Authorization": `Bearer ${apiKey}`, "Accept": "application/json" }
        });
        if (nodesRes.ok) {
          const nodesData = await nodesRes.json();
          const node = nodesData.data?.[0]?.attributes;
          if (node) {
            specs = {
              cpu: node.allocated_resources?.cpu ? `${node.allocated_resources.cpu}%` : "N/A",
              ram: node.allocated_resources?.memory ? `${Math.round(node.allocated_resources.memory / 1024)}GB` : "N/A",
              disk: node.allocated_resources?.disk ? `${Math.round(node.allocated_resources.disk / 1024)}GB` : "N/A",
              servers: servers
            };
          }
        }
      } catch (e) {
        console.log("[Server Status] Node fetch failed:", e.message);
      }

      if (!specs) {
        specs = { cpu: "N/A", ram: "N/A", disk: "N/A", servers };
      }
    }

    return res.status(200).json({
      success: true,
      online,
      panelUrl,
      responseTime,
      specs
    });
  } catch (error) {
    console.error("[Server Status] Error:", error);
    return res.status(200).json({
      success: true,
      online: false,
      panelUrl: config.panelUrl || "https://regal-yuki.privateserverr.web.id",
      responseTime: null,
      specs: null,
      error: error.message
    });
  }
}

/**
 * API: Admin Dashboard Endpoints
 * Semua operasi admin: login, config, produk, transaksi, user, status
 */

import { getAdminConfig, saveAdminConfig, getProducts, saveProducts, getAllTransactions, getCachedUsers, saveCachedUsers } from "./_lib/admin-store.js";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "yukistore123";

function verifyAdmin(req) {
  const password = req.headers["x-admin-password"] || req.body?.adminPassword || "";
  return password === ADMIN_PASSWORD;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Admin-Password");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { action } = req.query;

  try {
    switch (action) {
      case "login":
        return handleLogin(req, res);
      case "config":
        return handleConfig(req, res);
      case "products":
        return handleProducts(req, res);
      case "transactions":
        return handleTransactions(req, res);
      case "users":
        return handleUsers(req, res);
      case "check-username":
        return handleCheckUsername(req, res);
      case "server-status":
        return handleServerStatus(req, res);
      case "toggle-store":
        return handleToggleStore(req, res);
      case "stats":
        return handleStats(req, res);
      default:
        return res.status(400).json({ error: "Unknown action" });
    }
  } catch (error) {
    console.error("[Admin API] Error:", error);
    return res.status(500).json({ error: error.message });
  }
}

function handleLogin(req, res) {
  const { password } = req.body || {};
  if (password === ADMIN_PASSWORD) {
    return res.status(200).json({ success: true, token: "yuki-admin-auth" });
  }
  return res.status(401).json({ error: "Password salah" });
}

async function handleConfig(req, res) {
  if (!verifyAdmin(req)) return res.status(401).json({ error: "Unauthorized" });

  if (req.method === "GET") {
    const config = await getAdminConfig();
    const safeConfig = { ...config };
    if (safeConfig.apiKey && safeConfig.apiKey.length > 20) {
      safeConfig.apiKey = safeConfig.apiKey.substring(0, 12) + "••••" + safeConfig.apiKey.substring(safeConfig.apiKey.length - 4);
    }
    return res.status(200).json({ success: true, config: safeConfig });
  }

  if (req.method === "POST" || req.method === "PUT") {
    const current = await getAdminConfig();
    const updates = req.body;
    // Jangan overwrite apiKey jika dikirim masked
    if (updates.apiKey && updates.apiKey.includes("••••")) {
      delete updates.apiKey;
    }
    const newConfig = { ...current, ...updates, lastUpdated: new Date().toISOString() };
    await saveAdminConfig(newConfig);
    return res.status(200).json({ success: true, message: "Config updated" });
  }
}

async function handleProducts(req, res) {
  if (req.method === "GET") {
    const products = await getProducts();
    return res.status(200).json({ success: true, products });
  }

  if (!verifyAdmin(req)) return res.status(401).json({ error: "Unauthorized" });

  if (req.method === "POST") {
    const products = await getProducts();
    const newProduct = {
      id: Date.now(),
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    products.push(newProduct);
    await saveProducts(products);
    return res.status(200).json({ success: true, product: newProduct });
  }

  if (req.method === "PUT") {
    const { id, ...updates } = req.body;
    const products = await getProducts();
    const idx = products.findIndex(p => p.id == id);
    if (idx === -1) return res.status(404).json({ error: "Product not found" });
    products[idx] = { ...products[idx], ...updates, updatedAt: new Date().toISOString() };
    await saveProducts(products);
    return res.status(200).json({ success: true, product: products[idx] });
  }

  if (req.method === "DELETE") {
    const { id } = req.query;
    const products = await getProducts();
    const filtered = products.filter(p => p.id != id);
    await saveProducts(filtered);
    return res.status(200).json({ success: true, message: "Product deleted" });
  }
}

async function handleTransactions(req, res) {
  if (!verifyAdmin(req)) return res.status(401).json({ error: "Unauthorized" });

  const transactions = await getAllTransactions();
  const { status, search } = req.query;

  let filtered = transactions;
  if (status) filtered = filtered.filter(t => t.status === status);
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(t => 
      (t.buyerName && t.buyerName.toLowerCase().includes(q)) ||
      (t.panelUsername && t.panelUsername.toLowerCase().includes(q)) ||
      (t.referenceId && t.referenceId.toLowerCase().includes(q)) ||
      (t.productName && t.productName.toLowerCase().includes(q))
    );
  }

  // Sort by date desc
  filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return res.status(200).json({ success: true, transactions: filtered });
}

async function handleUsers(req, res) {
  if (!verifyAdmin(req)) return res.status(401).json({ error: "Unauthorized" });

  const config = await getAdminConfig();

  try {
    const resUsers = await fetch(`${config.panelUrl}/api/application/users?per_page=100`, {
      headers: {
        "Authorization": `Bearer ${config.apiKey}`,
        "Accept": "application/json",
        "Content-Type": "application/json"
      }
    });

    if (!resUsers.ok) throw new Error(`Pterodactyl error: ${resUsers.status}`);

    const data = await resUsers.json();
    const users = data.data.map(u => ({
      id: u.attributes.id,
      username: u.attributes.username,
      email: u.attributes.email,
      firstName: u.attributes.first_name,
      lastName: u.attributes.last_name,
      admin: u.attributes.root_admin,
      createdAt: u.attributes.created_at
    }));

    await saveCachedUsers(users);

    return res.status(200).json({ success: true, users, fromCache: false });
  } catch (error) {
    const cached = await getCachedUsers();
    return res.status(200).json({ success: true, users: cached, fromCache: true, error: error.message });
  }
}

async function handleCheckUsername(req, res) {
  const { username } = req.query;
  if (!username) return res.status(400).json({ error: "Username required" });

  const config = await getAdminConfig();

  try {
    const resUsers = await fetch(`${config.panelUrl}/api/application/users?filter[username]=${encodeURIComponent(username)}`, {
      headers: {
        "Authorization": `Bearer ${config.apiKey}`,
        "Accept": "application/json"
      }
    });

    if (!resUsers.ok) throw new Error("Pterodactyl error");

    const data = await resUsers.json();
    const exists = data.data && data.data.length > 0;

    return res.status(200).json({ success: true, exists, username });
  } catch (error) {
    const cached = await getCachedUsers();
    const exists = cached.some(u => u.username.toLowerCase() === username.toLowerCase());
    return res.status(200).json({ success: true, exists, username, fromCache: true });
  }
}

async function handleServerStatus(req, res) {
  if (!verifyAdmin(req)) return res.status(401).json({ error: "Unauthorized" });

  const config = await getAdminConfig();

  try {
    const startTime = Date.now();
    const healthRes = await fetch(`${config.panelUrl}/api/application/servers`, {
      headers: {
        "Authorization": `Bearer ${config.apiKey}`,
        "Accept": "application/json"
      }
    });
    const responseTime = Date.now() - startTime;

    let status = "offline";
    let servers = 0;
    let nodes = 0;
    let panelVersion = "unknown";

    if (healthRes.ok) {
      status = "online";
      const data = await healthRes.json();
      servers = data.data?.length || 0;
    }

    try {
      const nodesRes = await fetch(`${config.panelUrl}/api/application/nodes`, {
        headers: {
          "Authorization": `Bearer ${config.apiKey}`,
          "Accept": "application/json"
        }
      });
      if (nodesRes.ok) {
        const nodesData = await nodesRes.json();
        nodes = nodesData.data?.length || 0;
      }
    } catch (e) {}

    return res.status(200).json({
      success: true,
      status,
      responseTime,
      panelUrl: config.panelUrl,
      servers,
      nodes,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(200).json({
      success: true,
      status: "offline",
      error: error.message,
      panelUrl: config.panelUrl,
      timestamp: new Date().toISOString()
    });
  }
}

async function handleToggleStore(req, res) {
  if (!verifyAdmin(req)) return res.status(401).json({ error: "Unauthorized" });

  const config = await getAdminConfig();
  config.storeOpen = req.body?.storeOpen !== undefined ? req.body.storeOpen : !config.storeOpen;
  config.lastUpdated = new Date().toISOString();
  await saveAdminConfig(config);

  return res.status(200).json({ success: true, storeOpen: config.storeOpen });
}

async function handleStats(req, res) {
  if (!verifyAdmin(req)) return res.status(401).json({ error: "Unauthorized" });

  const products = await getProducts();
  const transactions = await getAllTransactions();
  const config = await getAdminConfig();

  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.active).length;
  const totalTransactions = transactions.length;
  const pendingCount = transactions.filter(t => t.status === "pending").length;
  const completedCount = transactions.filter(t => t.status === "completed").length;
  const failedCount = transactions.filter(t => t.status === "failed").length;
  const today = new Date().toISOString().split('T')[0];
  const todayTransactions = transactions.filter(t => t.createdAt && t.createdAt.startsWith(today)).length;

  return res.status(200).json({
    success: true,
    stats: {
      totalProducts,
      activeProducts,
      totalTransactions,
      pendingCount,
      completedCount,
      failedCount,
      todayTransactions,
      storeOpen: config.storeOpen
    }
  });
}

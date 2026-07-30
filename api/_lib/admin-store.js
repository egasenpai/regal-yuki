/**
 * Admin Storage Helper
 * Simpan konfigurasi admin, produk, dan data lainnya ke GitHub
 */

const TOKEN = process.env.REGAL_GITHUB_TOKEN;
const OWNER = "regalsenpaii";
const REPO = "Yukii-store";

async function readJsonFile(path) {
  try {
    const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`, {
      headers: {
        "Authorization": `token ${TOKEN}`,
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "YukiStore-Admin"
      }
    });
    if (res.status === 404) return { content: null, sha: null };
    if (!res.ok) throw new Error(`GitHub read error: ${res.status}`);
    const data = await res.json();
    const content = JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'));
    return { content, sha: data.sha };
  } catch (e) {
    console.error("[Admin Store] Read error:", e.message);
    return { content: null, sha: null };
  }
}

async function writeJsonFile(path, content, sha, message) {
  try {
    const body = {
      message: message || `Update ${path}`,
      content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'),
    };
    if (sha) body.sha = sha;

    const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`, {
      method: 'PUT',
      headers: {
        "Authorization": `token ${TOKEN}`,
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        "User-Agent": "YukiStore-Admin"
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`GitHub write error: ${res.status}`);
    return true;
  } catch (e) {
    console.error("[Admin Store] Write error:", e.message);
    return false;
  }
}

// Config
export async function getAdminConfig() {
  const { content } = await readJsonFile("admin/config.json");
  if (!content) {
    return {
      panelUrl: process.env.PTERODACTYL_PANEL_URL || "https://regal-yuki.privateserverr.web.id",
      apiKey: process.env.PTERODACTYL_API_KEY || "",
      eggId: process.env.PTERODACTYL_EGG_ID || "15",
      nestId: process.env.PTERODACTYL_NEST_ID || "5",
      locationId: process.env.PTERODACTYL_LOCATION_ID || "1",
      dockerImage: process.env.PTERODACTYL_DOCKER_IMAGE || "ghcr.io/parkervcp/yolks:nodejs_23",
      startupCmd: process.env.PTERODACTYL_STARTUP_CMD || `if [[ -d .git ]] && [[ {{AUTO_UPDATE}} == \"1\" ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then /usr/local/bin/npm install ${NODE_PACKAGES}; fi; if [[ ! -z ${UNNODE_PACKAGES} ]]; then /usr/local/bin/npm uninstall ${UNNODE_PACKAGES}; fi; if [ -f /home/container/package.json ]; then /usr/local/bin/npm install; fi;  if [[ ! -z ${CUSTOM_ENVIRONMENT_VARIABLES} ]]; then      vars=$(echo ${CUSTOM_ENVIRONMENT_VARIABLES} | tr \";\" \"\\n\");      for line in $vars;     do export $line;     done fi;  /usr/local/bin/${CMD_RUN};`,
      storeOpen: true,
      adminWa: "6288246387665",
      createdAt: new Date().toISOString()
    };
  }
  return content;
}

export async function saveAdminConfig(config) {
  const { sha } = await readJsonFile("admin/config.json");
  return await writeJsonFile("admin/config.json", config, sha, "Update admin config");
}

// Products
export async function getProducts() {
  const { content } = await readJsonFile("admin/products.json");
  if (!content) {
    return [
      { id: 1, name: "Panel 1GB", price: 2000, specs: "VPS R18 C4 • Aktif 30 Hari", ram: "1GB", active: true, category: "panel", stock: 999, createdAt: new Date().toISOString() },
      { id: 2, name: "Panel 2GB", price: 3000, specs: "VPS R18 C4 • Aktif 30 Hari", ram: "2GB", active: true, category: "panel", stock: 999, createdAt: new Date().toISOString() },
      { id: 3, name: "Panel 3GB", price: 4000, specs: "VPS R18 C4 • Aktif 30 Hari", ram: "3GB", active: true, category: "panel", stock: 999, createdAt: new Date().toISOString() },
      { id: 4, name: "Panel 4GB", price: 5000, specs: "VPS R18 C4 • Aktif 30 Hari", ram: "4GB", active: true, category: "panel", stock: 999, createdAt: new Date().toISOString() },
      { id: 5, name: "Panel 5GB", price: 6000, specs: "VPS R18 C4 • Aktif 30 Hari", ram: "5GB", active: true, category: "panel", stock: 999, createdAt: new Date().toISOString() },
      { id: 6, name: "Panel 6GB", price: 7000, specs: "VPS R18 C4 • Aktif 30 Hari", ram: "6GB", active: true, category: "panel", stock: 999, createdAt: new Date().toISOString() },
      { id: 7, name: "Panel 7GB", price: 8000, specs: "VPS R18 C4 • Aktif 30 Hari", ram: "7GB", active: true, category: "panel", stock: 999, createdAt: new Date().toISOString() },
      { id: 8, name: "Panel 8GB", price: 9000, specs: "VPS R18 C4 • Aktif 30 Hari", ram: "8GB", active: true, category: "panel", stock: 999, createdAt: new Date().toISOString() },
      { id: 9, name: "Panel 9GB", price: 10000, specs: "VPS R18 C4 • Aktif 30 Hari", ram: "9GB", active: true, category: "panel", stock: 999, createdAt: new Date().toISOString() },
      { id: 10, name: "Panel 10GB", price: 11000, specs: "VPS R18 C4 • Aktif 30 Hari", ram: "10GB", active: true, category: "panel", stock: 999, createdAt: new Date().toISOString() },
      { id: 11, name: "Panel UNLIMITED", price: 25000, specs: "VPS R18 C4 • Aktif 30 Hari", ram: "UNLIMITED", active: true, category: "panel", stock: 999, createdAt: new Date().toISOString() }
    ];
  }
  return content;
}

export async function saveProducts(products) {
  const { sha } = await readJsonFile("admin/products.json");
  return await writeJsonFile("admin/products.json", products, sha, "Update products");
}

// Transactions
export async function getAllTransactions() {
  const { content } = await readJsonFile("transactions/pending.json");
  return content || [];
}

// Users cache
export async function getCachedUsers() {
  const { content } = await readJsonFile("admin/users.json");
  return content || [];
}

export async function saveCachedUsers(users) {
  const { sha } = await readJsonFile("admin/users.json");
  return await writeJsonFile("admin/users.json", users, sha, "Update users cache");
}

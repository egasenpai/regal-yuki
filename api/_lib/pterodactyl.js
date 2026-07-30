/**
 * Pterodactyl API Helper
 * Auto-create server setelah pembayaran sukses
 * Supports dynamic config from admin panel
 */

import { getAdminConfig } from "./admin-store.js";

let cachedConfig = null;
let configCacheTime = 0;
const CONFIG_CACHE_TTL = 60000; // 1 menit

async function getConfig() {
  const now = Date.now();
  if (cachedConfig && (now - configCacheTime) < CONFIG_CACHE_TTL) {
    return cachedConfig;
  }

  try {
    const config = await getAdminConfig();
    cachedConfig = config;
    configCacheTime = now;
    return config;
  } catch (e) {
    console.error("[Pterodactyl] Failed to load config from store, using env fallback:", e.message);
    return {
      panelUrl: process.env.PTERODACTYL_PANEL_URL || "https://regal-yuki.privateserverr.web.id",
      apiKey: process.env.PTERODACTYL_API_KEY || "ptla_A5ZnFbARYgAK40UbGclqz5iCNLXuS8eEsI18fuqoX1O",
      eggId: process.env.PTERODACTYL_EGG_ID || "15",
      nestId: process.env.PTERODACTYL_NEST_ID || "5",
      locationId: process.env.PTERODACTYL_LOCATION_ID || "1",
      dockerImage: process.env.PTERODACTYL_DOCKER_IMAGE || "ghcr.io/parkervcp/yolks:nodejs_23",
      startupCmd: process.env.PTERODACTYL_STARTUP_CMD || `if [[ -d .git ]] && [[ {{AUTO_UPDATE}} == \"1\" ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then /usr/local/bin/npm install ${NODE_PACKAGES}; fi; if [[ ! -z ${UNNODE_PACKAGES} ]]; then /usr/local/bin/npm uninstall ${UNNODE_PACKAGES}; fi; if [ -f /home/container/package.json ]; then /usr/local/bin/npm install; fi;  if [[ ! -z ${CUSTOM_ENVIRONMENT_VARIABLES} ]]; then      vars=$(echo ${CUSTOM_ENVIRONMENT_VARIABLES} | tr \";\" \"\\n\");      for line in $vars;     do export $line;     done fi;  /usr/local/bin/${CMD_RUN};`
    };
  }
}

export async function createServer(panelData) {
  const config = await getConfig();
  const { username, email, productName } = panelData;

  let memory = 1024, swap = 512, disk = 2048, cpu = 100;

  if (productName.includes("UNLIMITED")) {
    memory = 0; swap = 0; disk = 0; cpu = 0;
  } else {
    const match = productName.match(/(\d+)GB/);
    const gb = match ? parseInt(match[1]) : 1;
    memory = gb * 1024;
    swap = gb * 512;
    disk = gb * 2048;
    cpu = gb * 100;
  }

  const password = generatePassword(16);

  const userPayload = {
    email: email,
    username: username,
    first_name: username,
    last_name: "User",
    password: password
  };

  console.log("[Pterodactyl] Creating user:", username);

  const userRes = await fetch(`${config.panelUrl}/api/application/users`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify(userPayload)
  });

  let userData;
  let userPassword = password;

  if (userRes.status === 422) {
    console.log("[Pterodactyl] User exists, fetching...");
    const listRes = await fetch(`${config.panelUrl}/api/application/users?filter[email]=${encodeURIComponent(email)}`, {
      headers: { "Authorization": `Bearer ${config.apiKey}`, "Accept": "application/json" }
    });
    const list = await listRes.json();
    if (!list.data || !list.data.length) throw new Error("User exists but cannot be found");
    userData = list.data[0];
    userPassword = "(sudah ada — reset manual jika lupa)";
  } else if (!userRes.ok) {
    const err = await userRes.text();
    throw new Error(`Pterodactyl user error ${userRes.status}: ${err}`);
  } else {
    userData = await userRes.json();
  }

  const userId = userData.attributes.id;

  const serverPayload = {
    name: `${username}-server`,
    user: userId,
    egg: parseInt(config.eggId),
    docker_image: config.dockerImage,
    startup: config.startupCmd,
    environment: {
      CMD_RUN: "npm start",
      AUTO_UPDATE: "0",
      NODE_PACKAGES: "",
      UNNODE_PACKAGES: "",
      CUSTOM_ENVIRONMENT_VARIABLES: "",
      GIT_ADDRESS: "",
      BRANCH: "",
      USERNAME: "",
      ACCESS_TOKEN: "",
      USER_UPLOAD: "0"
    },
    limits: {
      memory: memory,
      swap: swap,
      disk: disk,
      io: 500,
      cpu: cpu
    },
    feature_limits: {
      databases: 1,
      allocations: 1,
      backups: 1
    },
    allocation: {
      default: 1
    },
    deploy: {
      locations: [parseInt(config.locationId)],
      dedicated_ip: false,
      port_range: []
    },
    start_on_completion: false
  };

  console.log("[Pterodactyl] Creating server for user:", userId, "with image:", config.dockerImage);

  const serverRes = await fetch(`${config.panelUrl}/api/application/servers`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify(serverPayload)
  });

  if (!serverRes.ok) {
    const err = await serverRes.text();
    throw new Error(`Pterodactyl server error ${serverRes.status}: ${err}`);
  }

  const serverData = await serverRes.json();

  return {
    userId: userId,
    username: userData.attributes.username,
    email: userData.attributes.email,
    password: userPassword,
    serverId: serverData.attributes.id,
    serverName: serverData.attributes.name,
    panelUrl: config.panelUrl
  };
}

export async function checkUsernameExists(username) {
  const config = await getConfig();
  try {
    const res = await fetch(`${config.panelUrl}/api/application/users?filter[username]=${encodeURIComponent(username)}`, {
      headers: {
        "Authorization": `Bearer ${config.apiKey}`,
        "Accept": "application/json"
      }
    });
    if (!res.ok) return { exists: false, error: true };
    const data = await res.json();
    return { exists: data.data && data.data.length > 0 };
  } catch (e) {
    return { exists: false, error: true, message: e.message };
  }
}

function generatePassword(length) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let pass = "";
  for (let i = 0; i < length; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

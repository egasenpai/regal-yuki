/**
 * Pterodactyl API Helper
 * Auto-create server setelah pembayaran sukses
 * Egg: felixshopnodejs (Node.js 23)
 */

const PANEL_URL = "https://regal-yuki.privateserverr.web.id";
const API_KEY = "ptla_OPFxbMpuWJuGe0L4p6BnZr4IAUCdzT4lXWUM9m9YYOL";

const DEFAULT_EGG_ID = "15";
const DEFAULT_NEST_ID = "5";
const DEFAULT_LOC_ID = "1";

const DOCKER_IMAGE = "ghcr.io/parkervcp/yolks:nodejs_23";

const STARTUP_CMD = `if [[ -d .git ]] && [[ {{AUTO_UPDATE}} == \"1\" ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then /usr/local/bin/npm install ${NODE_PACKAGES}; fi; if [[ ! -z ${UNNODE_PACKAGES} ]]; then /usr/local/bin/npm uninstall ${UNNODE_PACKAGES}; fi; if [ -f /home/container/package.json ]; then /usr/local/bin/npm install; fi;  if [[ ! -z ${CUSTOM_ENVIRONMENT_VARIABLES} ]]; then      vars=$(echo ${CUSTOM_ENVIRONMENT_VARIABLES} | tr \";\" \"\\n\");      for line in $vars;     do export $line;     done fi;  /usr/local/bin/${CMD_RUN};`;

export async function createServer(panelData) {
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

  const userRes = await fetch(`${PANEL_URL}/api/application/users`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify(userPayload)
  });

  let userData;
  let userPassword = password;

  if (userRes.status === 422) {
    console.log("[Pterodactyl] User exists, fetching...");
    const listRes = await fetch(`${PANEL_URL}/api/application/users?filter[email]=${encodeURIComponent(email)}`, {
      headers: { "Authorization": `Bearer ${API_KEY}`, "Accept": "application/json" }
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
    egg: parseInt(DEFAULT_EGG_ID),
    docker_image: DOCKER_IMAGE,
    startup: STARTUP_CMD,
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
      locations: [parseInt(DEFAULT_LOC_ID)],
      dedicated_ip: false,
      port_range: []
    },
    start_on_completion: false
  };

  console.log("[Pterodactyl] Creating server for user:", userId, "with image:", DOCKER_IMAGE);

  const serverRes = await fetch(`${PANEL_URL}/api/application/servers`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
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
    panelUrl: PANEL_URL
  };
}

function generatePassword(length) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let pass = "";
  for (let i = 0; i < length; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

/**
 * GitHub JSON Storage Helper
 */

const TOKEN = process.env.REGAL_TOKEN;
const OWNER = "egasenpai";
const REPO = "yuki-regal";

export async function readJsonFile(path) {
  try {
    if (!TOKEN) {
      console.error("[GitHub Store] REGAL_TOKEN is missing!");
      return { content: null, sha: null };
    }
    
    const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`, {
      headers: {
        "Authorization": `token ${TOKEN}`,
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "YukiStore-Automation"
      }
    });
    
    if (res.status === 404) {
      console.log(`[GitHub Store] File ${path} not found (will create new)`);
      return { content: null, sha: null };
    }
    
    if (!res.ok) {
      const errText = await res.text();
      console.error(`[GitHub Store] Read error ${res.status}:`, errText.substring(0, 200));
      return { content: null, sha: null };
    }
    
    const data = await res.json();
    const content = JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'));
    return { content, sha: data.sha };
    
  } catch (e) {
    console.error("[GitHub Store] Read error:", e.message);
    return { content: null, sha: null };
  }
}

export async function writeJsonFile(path, content, sha, message) {
  try {
    if (!TOKEN) {
      console.error("[GitHub Store] REGAL_TOKEN is missing!");
      return false;
    }
    
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
        "User-Agent": "YukiStore-Automation"
      },
      body: JSON.stringify(body)
    });
    
    if (!res.ok) {
      const errText = await res.text();
      console.error(`[GitHub Store] Write error ${res.status}:`, errText.substring(0, 300));
      return false;
    }
    
    console.log(`[GitHub Store] Write success: ${path}`);
    return true;
    
  } catch (e) {
    console.error("[GitHub Store] Write error:", e.message);
    return false;
  }
}

export async function appendTransaction(txn) {
  const path = "transactions/pending.json";
  const { content, sha } = await readJsonFile(path);
  const list = content || [];
  list.push(txn);
  const success = await writeJsonFile(path, list, sha, `Add transaction ${txn.id}`);
  if (!success) throw new Error("Failed to save transaction to GitHub");
  return success;
}

export async function findTransaction(refId) {
  if (!refId) return null;
  const path = "transactions/pending.json";
  const { content } = await readJsonFile(path);
  if (!content || !Array.isArray(content)) {
    console.log(`[GitHub Store] No transactions found or invalid format`);
    return null;
  }
  const found = content.find(t => t.referenceId === refId || t.id === refId || t.austinTxId === refId);
  if (!found) {
    console.log(`[GitHub Store] Transaction ${refId} not found in ${content.length} records`);
  }
  return found || null;
}

export async function updateTransactionStatus(refId, status, extra = {}) {
  const path = "transactions/pending.json";
  const { content, sha } = await readJsonFile(path);
  if (!content || !Array.isArray(content)) return false;
  
  const idx = content.findIndex(t => t.referenceId === refId || t.id === refId || t.austinTxId === refId);
  if (idx === -1) {
    console.error(`[GitHub Store] Cannot update ${refId}: not found`);
    return false;
  }
  
  content[idx] = { ...content[idx], status, ...extra, updatedAt: new Date().toISOString() };
  return await writeJsonFile(path, content, sha, `Update ${refId} to ${status}`);
}

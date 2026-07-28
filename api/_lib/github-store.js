/**
 * GitHub JSON Storage Helper
 * Simpan data transaksi ke repo GitHub (tanpa database)
 */

const TOKEN = process.env.REGAL_GITHUB_TOKEN;
const OWNER = "regalsenpaii";
const REPO = "Yukii-store";

export async function readJsonFile(path) {
  try {
    const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`, {
      headers: {
        "Authorization": `token ${TOKEN}`,
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "YukiStore-Automation"
      }
    });
    if (res.status === 404) return { content: null, sha: null };
    if (!res.ok) throw new Error(`GitHub read error: ${res.status}`);
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
    if (!res.ok) throw new Error(`GitHub write error: ${res.status}`);
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
  return await writeJsonFile(path, list, sha, `Add transaction ${txn.id}`);
}

export async function findTransaction(refId) {
  const path = "transactions/pending.json";
  const { content } = await readJsonFile(path);
  if (!content) return null;
  return content.find(t => t.referenceId === refId || t.id === refId || t.austinTxId === refId);
}

export async function updateTransactionStatus(refId, status, extra = {}) {
  const path = "transactions/pending.json";
  const { content, sha } = await readJsonFile(path);
  if (!content) return false;
  const idx = content.findIndex(t => t.referenceId === refId || t.id === refId || t.austinTxId === refId);
  if (idx === -1) return false;
  content[idx] = { ...content[idx], status, ...extra, updatedAt: new Date().toISOString() };
  return await writeJsonFile(path, content, sha, `Update ${refId} to ${status}`);
}

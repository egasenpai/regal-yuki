/**
 * API: Check Payment Status
 * FIXED: Anti-crash, logging lengkap, fallback auto-create server
 */

// Lazy load biar kalau satu module error, yang lain tetap jalan
let githubStore, austinFetch, pterodactyl;

try {
  githubStore = await import("./_lib/github-store.js");
} catch (e) {
  console.error("[Check] Failed to import github-store:", e.message);
}

try {
  austinFetch = await import("./_lib/austin-fetch.js");
} catch (e) {
  console.error("[Check] Failed to import austin-fetch:", e.message);
}

try {
  pterodactyl = await import("./_lib/pterodactyl.js");
} catch (e) {
  console.error("[Check] Failed to import pterodactyl:", e.message);
}

const AUSTIN_API_KEY = "apg_live_7b2866c45bfe752cc6a51a5c719087e121bf26430377ce46";
const AUSTIN_API_SECRET = "aps_68b377e6d57c7096a31b110d7b0862d059eae4c4155dcb2f61bef3449c2d3ed2";
const AUSTIN_BASE_URL = "https://austinstore.id";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { ref } = req.query;
  if (!ref) return res.status(400).json({ error: "Reference ID required" });

  try {
    // Cek module availability
    if (!githubStore || !githubStore.findTransaction) {
      console.error("[Check] github-store module not available");
      return res.status(500).json({ error: "Internal error: storage module unavailable" });
    }

    console.log(`[Check] Looking up transaction: ${ref}`);
    const txn = await githubStore.findTransaction(ref);
    
    if (!txn) {
      console.log(`[Check] Transaction not found: ${ref}`);
      return res.status(404).json({ error: "Transaction not found" });
    }

    console.log(`[Check] Found txn: ${txn.referenceId}, status: ${txn.status}, austinTxId: ${txn.austinTxId || 'none'}`);

    let austinStatus = null;
    let serverInfo = txn.serverInfo || null;
    let currentStatus = txn.status;

    // Cek ke Austin Pay kalau masih pending/processing
    if ((txn.status === "pending" || txn.status === "processing") && txn.austinTxId && austinFetch && austinFetch.austinFetchSigned) {
      try {
        const checkPath = `/api/v2/deposit/check/${txn.austinTxId}`;
        console.log(`[Check] Calling Austin: ${AUSTIN_BASE_URL}${checkPath}`);
        
        const checkRes = await austinFetch.austinFetchSigned(
          AUSTIN_BASE_URL,
          checkPath,
          { method: "GET" },
          AUSTIN_API_KEY,
          AUSTIN_API_SECRET
        );

        console.log(`[Check] Austin response status: ${checkRes.status}`);

        if (checkRes.ok) {
          let checkData;
          try {
            checkData = await checkRes.json();
          } catch (jsonErr) {
            const text = await checkRes.text();
            console.error("[Check] Austin response not JSON:", text.substring(0, 200));
            throw new Error("Invalid Austin response");
          }
          
          austinStatus = checkData.data?.status || checkData.status || null;
          console.log(`[Check] Austin status: ${austinStatus}`);

          // FALLBACK: Kalau Austin sudah paid tapi lokal belum completed
          const paidStatuses = ['paid', 'completed', 'success', 'settlement', 'done'];
          if (austinStatus && paidStatuses.includes(austinStatus.toString().toLowerCase()) && txn.status !== "completed") {
            console.log(`[Check] Austin paid but local status=${txn.status}. Running fallback...`);

            if (!githubStore.readJsonFile || !githubStore.updateTransactionStatus) {
              console.error("[Check] GitHub store methods unavailable");
            } else {
              const { content, sha } = await githubStore.readJsonFile("transactions/pending.json");
              const freshTxn = content?.find(t => t.referenceId === ref || t.id === ref || t.austinTxId === ref);

              if (freshTxn && freshTxn.status !== "completed") {
                await githubStore.updateTransactionStatus(ref, "processing", { austinStatus, paidAt: new Date().toISOString() });
                
                // Create server kalau pterodactyl module tersedia
                if (pterodactyl && pterodactyl.createServer) {
                  try {
                    const newServerInfo = await pterodactyl.createServer({
                      username: freshTxn.panelUsername,
                      email: freshTxn.panelEmail,
                      productName: freshTxn.productName
                    });
                    await githubStore.updateTransactionStatus(ref, "completed", {
                      serverInfo: newServerInfo,
                      austinStatus,
                      austinAmount: freshTxn.price,
                      paidAt: new Date().toISOString()
                    });
                    serverInfo = newServerInfo;
                    currentStatus = "completed";
                    console.log(`[Check] Fallback success! Server: ${newServerInfo.serverId}`);
                  } catch (ptErr) {
                    console.error("[Check] Fallback create server failed:", ptErr.message);
                    await githubStore.updateTransactionStatus(ref, "failed", { error: ptErr.message, austinStatus });
                    currentStatus = "failed";
                  }
                } else {
                  console.error("[Check] Pterodactyl module unavailable, cannot create server");
                  await githubStore.updateTransactionStatus(ref, "failed", { error: "Pterodactyl module unavailable", austinStatus });
                  currentStatus = "failed";
                }
              } else if (freshTxn?.status === "completed") {
                currentStatus = "completed";
                serverInfo = freshTxn.serverInfo || null;
              }
            }
          }
        } else {
          const errText = await checkRes.text();
          console.log(`[Check] Austin check failed ${checkRes.status}:`, errText.substring(0, 200));
        }
      } catch (e) {
        console.error("[Check] Austin Pay check error:", e.message);
      }
    }

    return res.status(200).json({
      success: true,
      status: currentStatus,
      austinStatus,
      productName: txn.productName,
      price: txn.price,
      buyerName: txn.buyerName,
      buyerWa: txn.buyerWa,
      panelUsername: txn.panelUsername,
      panelEmail: txn.panelEmail,
      serverInfo: serverInfo
    });

  } catch (error) {
    console.error("[Check] Fatal error:", error);
    return res.status(500).json({ error: "Internal server error", detail: error.message });
  }
}

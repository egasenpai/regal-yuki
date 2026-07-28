export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Metode salah' });

    try {
        const { fileName, base64Content } = req.body;
        
        // Data akun dan repo yang dipakai sekarang
        const token = process.env.REGAL_GITHUB_TOKEN; // Pastikan ini di-set di Vercel
        const owner = "regalsenpaii";
        const repo = "Yukii-store";

        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${fileName}`, {
            method: 'PUT',
            headers: {
                "Authorization": `token ${token}`,
                "Accept": "application/vnd.github.v3+json",
                "Content-Type": "application/json",
                "User-Agent": "YukiStore-Upload-Proxy"
            },
            body: JSON.stringify({
                message: `Upload bukti: ${fileName}`,
                content: base64Content
            })
        });

        if (!response.ok) return res.status(500).json({ error: 'Gagal ke GitHub' });

        return res.status(200).json({ 
            success: true, 
            download_url: `https://yukii-store.vercel.app/${fileName}` 
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

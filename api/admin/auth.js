/**
 * API: Admin Authentication
 * Login sederhana dengan username & password dari env
 */

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { username, password } = req.body;

        const ADMIN_USER = process.env.ADMIN_USER || 'admin';
        const ADMIN_PASS = process.env.ADMIN_PASS || 'yukistore2024';

        if (username === ADMIN_USER && password === ADMIN_PASS) {
            // Generate simple token (in production use JWT)
            const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
            return res.status(200).json({
                success: true,
                token,
                user: username
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Username atau password salah'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}
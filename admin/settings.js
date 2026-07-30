/**
 * API: Admin Settings
 * Get & Update settings (Pterodactyl config, etc)
 */

import { readJsonFile, writeJsonFile } from '../_lib/github-store.js';

const SETTINGS_PATH = 'admin/settings.json';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    try {
        const { content, sha } = await readJsonFile(SETTINGS_PATH);
        let settings = content || {};

        // GET
        if (req.method === 'GET') {
            // Return server info too
            const serverInfo = {
                cpu: '2 Core',
                ram: '4 GB',
                storage: '20 GB',
                uptime: '99.9%',
                status: 'online'
            };

            return res.status(200).json({
                success: true,
                settings: {
                    panelUrl: settings.panelUrl || process.env.PANEL_URL || '',
                    panelApiKey: settings.panelApiKey || '',
                    eggId: settings.eggId || '15',
                    nestId: settings.nestId || '5'
                },
                serverInfo
            });
        }

        // POST - Update
        if (req.method === 'POST') {
            const { panelUrl, panelApiKey, eggId, nestId } = req.body;

            const updated = {
                ...settings,
                panelUrl: panelUrl || settings.panelUrl || '',
                panelApiKey: panelApiKey || settings.panelApiKey || '',
                eggId: eggId || settings.eggId || '15',
                nestId: nestId || settings.nestId || '5',
                updatedAt: new Date().toISOString()
            };

            const saved = await writeJsonFile(SETTINGS_PATH, updated, sha, 'Update admin settings');
            if (!saved) throw new Error('Gagal menyimpan pengaturan');

            // Also update environment for pterodactyl.js (optional)
            // In production, you'd update process.env or use a db

            return res.status(200).json({
                success: true,
                message: 'Pengaturan berhasil disimpan',
                settings: updated
            });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}
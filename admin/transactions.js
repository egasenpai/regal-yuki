/**
 * API: Admin Transactions List
 * GET all transactions with filtering
 */

import { readJsonFile } from '../_lib/github-store.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    try {
        const { content } = await readJsonFile('transactions/pending.json');
        const transactions = content || [];

        // Sort by newest first
        transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return res.status(200).json({
            success: true,
            transactions
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}
/**
 * API: Admin Users List
 * Get all unique users from transactions
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

        // Group by username/email
        const userMap = new Map();

        transactions.forEach(t => {
            const key = t.buyerName || t.panelUsername || t.username || t.email || t.panelEmail;
            if (!key) return;

            if (!userMap.has(key)) {
                userMap.set(key, {
                    id: key,
                    username: t.buyerName || t.panelUsername || t.username || key,
                    email: t.panelEmail || t.email || '-',
                    panelUsername: t.panelUsername || '-',
                    buyerName: t.buyerName || '-',
                    totalTransactions: 0,
                    totalSpent: 0,
                    joinedAt: t.createdAt || new Date().toISOString(),
                    transactions: []
                });
            }

            const user = userMap.get(key);
            user.totalTransactions++;
            user.totalSpent += (t.price || 0);
            user.transactions.push(t);
            if (new Date(t.createdAt) < new Date(user.joinedAt)) {
                user.joinedAt = t.createdAt;
            }
        });

        const users = Array.from(userMap.values());

        return res.status(200).json({
            success: true,
            users
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
              }

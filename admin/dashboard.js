/**
 * API: Admin Dashboard Data
 * Stats, chart data, recent transactions
 */

import { readJsonFile } from '../_lib/github-store.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    // Simple auth check
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    try {
        // Read transactions
        const { content: transactions } = await readJsonFile('transactions/pending.json');
        const list = transactions || [];

        // Stats
        const totalProducts = 14; // From panelProducts + others
        const totalUsers = getUniqueUsers(list);
        const pending = list.filter(t => t.status === 'pending' || t.status === 'processing').length;
        const success = list.filter(t => t.status === 'completed').length;

        // Recent transactions (last 10)
        const recent = [...list]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 10);

        // Chart data (7 days)
        const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
        const daily = days.map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            const dayStr = date.toISOString().split('T')[0];
            return list.filter(t => t.createdAt?.startsWith(dayStr)).length;
        });

        return res.status(200).json({
            success: true,
            stats: {
                totalProducts,
                totalUsers: totalUsers.length,
                pendingTransactions: pending,
                successTransactions: success
            },
            recentTransactions: recent,
            chartData: {
                days,
                dailyTransactions: daily,
                uptime: 99.9
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

function getUniqueUsers(transactions) {
    const users = new Set();
    transactions.forEach(t => {
        if (t.buyerName) users.add(t.buyerName);
        if (t.panelUsername) users.add(t.panelUsername);
        if (t.username) users.add(t.username);
    });
    return Array.from(users);
}
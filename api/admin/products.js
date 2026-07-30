/**
 * API: Admin Products CRUD
 * GET, POST, PUT, DELETE
 */

import { readJsonFile, writeJsonFile } from '../_lib/github-store.js';

const PRODUCTS_PATH = 'admin/products.json';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // Auth check
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    try {
        const { content, sha } = await readJsonFile(PRODUCTS_PATH);
        let products = content || [];

        // GET - List products
        if (req.method === 'GET') {
            return res.status(200).json({ success: true, products });
        }

        // POST - Create product
        if (req.method === 'POST') {
            const { name, price, category, stock, status, description, spec } = req.body;

            if (!name || !price) {
                return res.status(400).json({ success: false, message: 'Nama dan harga wajib diisi' });
            }

            const newProduct = {
                id: Date.now() + Math.random().toString(36).substring(2, 6),
                name,
                price: parseInt(price),
                category: category || 'other',
                stock: parseInt(stock) || 999,
                status: status || 'active',
                description: description || '',
                spec: spec || '',
                createdAt: new Date().toISOString()
            };

            products.push(newProduct);
            const saved = await writeJsonFile(PRODUCTS_PATH, products, sha, `Add product: ${name}`);
            if (!saved) throw new Error('Gagal menyimpan ke GitHub');

            return res.status(201).json({ success: true, product: newProduct });
        }

        // PUT - Update product
        if (req.method === 'PUT') {
            const id = req.url.split('/').pop();
            const { name, price, category, stock, status, description, spec } = req.body;

            const idx = products.findIndex(p => p.id === id || p.id == id);
            if (idx === -1) {
                return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
            }

            products[idx] = {
                ...products[idx],
                name: name || products[idx].name,
                price: price !== undefined ? parseInt(price) : products[idx].price,
                category: category || products[idx].category,
                stock: stock !== undefined ? parseInt(stock) : products[idx].stock,
                status: status || products[idx].status,
                description: description !== undefined ? description : products[idx].description,
                spec: spec !== undefined ? spec : products[idx].spec,
                updatedAt: new Date().toISOString()
            };

            const saved = await writeJsonFile(PRODUCTS_PATH, products, sha, `Update product: ${name || products[idx].name}`);
            if (!saved) throw new Error('Gagal menyimpan ke GitHub');

            return res.status(200).json({ success: true, product: products[idx] });
        }

        // DELETE - Remove product
        if (req.method === 'DELETE') {
            const id = req.url.split('/').pop();
            const idx = products.findIndex(p => p.id === id || p.id == id);
            if (idx === -1) {
                return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
            }

            const removed = products.splice(idx, 1);
            const saved = await writeJsonFile(PRODUCTS_PATH, products, sha, `Delete product: ${removed[0]?.name || id}`);
            if (!saved) throw new Error('Gagal menyimpan ke GitHub');

            return res.status(200).json({ success: true, message: 'Produk dihapus' });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}
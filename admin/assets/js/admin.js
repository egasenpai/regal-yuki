/**
 * ADMIN DASHBOARD - YUKI STORE
 * Full CRUD, Transaksi, Users, Settings
 */

// ========================================
// STATE
// ========================================
let products = [];
let transactions = [];
let users = [];
let editingProductId = null;
let currentPage = 'dashboard';

// ========================================
// DOM REFS
// ========================================
const $ = id => document.getElementById(id);

// ========================================
// INIT
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    // Check auth
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/admin/login.html';
        return;
    }

    // Set admin initial
    const user = localStorage.getItem('adminUser') || 'Admin';
    $('adminInitial').textContent = user.charAt(0).toUpperCase();

    // Init
    initNavigation();
    initSidebar();
    initClock();
    loadDashboard();
    loadProducts();
    loadTransactions();
    loadUsers();
    loadSettings();
    initProductModal();
    initLogout();

    // Auto refresh
    setInterval(refreshAll, 30000);
});

// ========================================
// NAVIGATION
// ========================================
function initNavigation() {
    document.querySelectorAll('.nav-item[data-page]').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.dataset.page;
            showPage(page);
        });
    });

    // Add product button
    $('addProductBtn')?.addEventListener('click', () => openProductModal());
}

function showPage(page) {
    currentPage = page;

    // Update nav
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const activeNav = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (activeNav) activeNav.classList.add('active');

    // Update content
    document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
    const target = $(`page-${page}`);
    if (target) target.classList.add('active');

    // Update title
    const titles = {
        dashboard: 'Dashboard',
        products: 'Manajemen Produk',
        transactions: 'Manajemen Transaksi',
        users: 'Manajemen User',
        settings: 'Pengaturan'
    };
    $('pageTitle').textContent = titles[page] || page;

    // Refresh data
    if (page === 'dashboard') loadDashboard();
    if (page === 'products') loadProducts();
    if (page === 'transactions') loadTransactions();
    if (page === 'users') loadUsers();

    // Close mobile sidebar
    closeSidebar();
}

// ========================================
// SIDEBAR
// ========================================
function initSidebar() {
    $('menuToggle')?.addEventListener('click', () => {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('mobileOverlay');
        sidebar.classList.toggle('open');
        overlay.classList.toggle('hidden');
    });

    document.getElementById('mobileOverlay')?.addEventListener('click', closeSidebar);
}

function closeSidebar() {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('mobileOverlay')?.classList.add('hidden');
}

// ========================================
// CLOCK
// ========================================
function initClock() {
    function updateClock() {
        const now = new Date();
        $('clockDisplay').textContent = now.toLocaleString('id-ID', {
            weekday: 'short', day: 'numeric', month: 'short',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    }
    updateClock();
    setInterval(updateClock, 1000);
}

// ========================================
// LOGOUT
// ========================================
function initLogout() {
    $('logoutBtn')?.addEventListener('click', () => {
        if (confirm('Yakin ingin logout?')) {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            window.location.href = '/admin/login.html';
        }
    });
}

// ========================================
// TOAST
// ========================================
function showToast(title, message, type = 'success') {
    const container = document.getElementById('toast');
    const icon = document.getElementById('toastIcon');
    const titleEl = document.getElementById('toastTitle');
    const msgEl = document.getElementById('toastMessage');

    titleEl.textContent = title;
    msgEl.textContent = message;

    if (type === 'error') {
        icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`;
        icon.style.background = 'rgba(239,68,68,0.15)';
    } else {
        icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34D399" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`;
        icon.style.background = 'rgba(16,185,129,0.15)';
    }

    container.classList.add('show');
    clearTimeout(window.toastTimeout);
    window.toastTimeout = setTimeout(() => container.classList.remove('show'), 4000);
}

// ========================================
// DASHBOARD
// ========================================
async function loadDashboard() {
    try {
        const res = await fetch('/api/admin/dashboard', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
        });
        const data = await res.json();

        if (data.success) {
            $('statProducts').textContent = data.stats?.totalProducts || 0;
            $('statUsers').textContent = data.stats?.totalUsers || 0;
            $('statPending').textContent = data.stats?.pendingTransactions || 0;
            $('statSuccess').textContent = data.stats?.successTransactions || 0;

            // Recent transactions
            const tbody = $('recentTransactions');
            if (data.recentTransactions?.length) {
                tbody.innerHTML = data.recentTransactions.map(t => `
                    <tr>
                        <td><span class="text-xs font-mono text-slate-400">${t.id?.slice(0, 8) || '-'}</span></td>
                        <td>${t.buyerName || t.username || '-'}</td>
                        <td>${t.productName || '-'}</td>
                        <td>Rp ${(t.price || 0).toLocaleString()}</td>
                        <td><span class="status-badge status-${t.status || 'pending'}">${t.status || 'pending'}</span></td>
                        <td class="text-xs text-slate-500">${t.createdAt ? new Date(t.createdAt).toLocaleString() : '-'}</td>
                    </tr>
                `).join('');
            } else {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center text-slate-400 py-6">Belum ada transaksi</td></tr>';
            }

            // Charts
            if (data.chartData) updateCharts(data.chartData);
        }
    } catch (e) {
        console.error('Dashboard error:', e);
    }
}

function updateCharts(chartData) {
    // Daily chart
    const ctx = document.getElementById('dailyChart')?.getContext('2d');
    if (ctx) {
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.days || ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
                datasets: [{
                    label: 'Transaksi',
                    data: chartData.dailyTransactions || [0,0,0,0,0,0,0],
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59,130,246,0.08)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 2,
                    pointRadius: 3,
                    pointBackgroundColor: '#3B82F6'
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#94A3B8' } },
                    x: { grid: { display: false }, ticks: { color: '#94A3B8' } }
                }
            }
        });
    }

    // Uptime chart
    const ctx2 = document.getElementById('uptimeChart')?.getContext('2d');
    if (ctx2) {
        new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: ['Online', 'Offline'],
                datasets: [{
                    data: [chartData.uptime || 95, 100 - (chartData.uptime || 95)],
                    backgroundColor: ['#34D399', '#EF4444'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#94A3B8', padding: 16 } }
                },
                cutout: '70%'
            }
        });
    }
}

// ========================================
// PRODUCTS CRUD
// ========================================
async function loadProducts() {
    try {
        const res = await fetch('/api/admin/products', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
        });
        const data = await res.json();

        if (data.success) {
            products = data.products || [];
            renderProducts(products);
            $('badgeProducts').textContent = products.length;
        }
    } catch (e) {
        console.error('Load products error:', e);
    }
}

function renderProducts(list) {
    const tbody = $('productsList');
    if (!list.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-slate-400 py-6">Belum ada produk</td></tr>';
        return;
    }

    tbody.innerHTML = list.map(p => `
        <tr>
            <td class="text-xs font-mono text-slate-500">${p.id || '-'}</td>
            <td class="font-medium">${p.name || '-'}</td>
            <td>Rp ${(p.price || 0).toLocaleString()}</td>
            <td><span class="text-xs text-slate-400">${p.category || 'other'}</span></td>
            <td>${p.stock !== undefined ? p.stock : '∞'}</td>
            <td><span class="status-badge ${p.status === 'active' ? 'status-completed' : p.status === 'inactive' ? 'status-pending' : 'status-failed'}">${p.status || 'active'}</span></td>
            <td>
                <button class="btn-secondary text-xs py-1 px-3" onclick="openProductModal(${p.id})">✏️</button>
                <button class="btn-secondary text-xs py-1 px-3 text-red-400" onclick="toggleProductStatus(${p.id})">${p.status === 'active' ? '⏸️' : '▶️'}</button>
            </td>
        </tr>
    `).join('');
}

function openProductModal(id = null) {
    const modal = document.getElementById('productModal');
    const form = document.getElementById('productForm');
    const title = document.getElementById('productModalTitle');
    const deleteBtn = document.getElementById('deleteProductBtn');

    form.reset();
    editingProductId = null;
    deleteBtn.classList.add('hidden');

    if (id) {
        const product = products.find(p => p.id === id);
        if (!product) return;

        editingProductId = id;
        title.textContent = 'Edit Produk';
        document.getElementById('editProductId').value = id;
        document.getElementById('productName').value = product.name || '';
        document.getElementById('productPrice').value = product.price || '';
        document.getElementById('productCategory').value = product.category || 'panel';
        document.getElementById('productStock').value = product.stock !== undefined ? product.stock : '';
        document.getElementById('productStatus').value = product.status || 'active';
        document.getElementById('productDesc').value = product.description || '';
        document.getElementById('productSpec').value = product.spec || '';
        deleteBtn.classList.remove('hidden');
    } else {
        title.textContent = 'Tambah Produk';
        document.getElementById('productStatus').value = 'active';
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
    document.body.style.overflow = '';
}

function initProductModal() {
    // Save
    document.getElementById('saveProductBtn').addEventListener('click', async () => {
        const id = document.getElementById('editProductId').value;
        const data = {
            name: document.getElementById('productName').value.trim(),
            price: parseInt(document.getElementById('productPrice').value) || 0,
            category: document.getElementById('productCategory').value,
            stock: parseInt(document.getElementById('productStock').value) || 0,
            status: document.getElementById('productStatus').value,
            description: document.getElementById('productDesc').value.trim(),
            spec: document.getElementById('productSpec').value.trim()
        };

        if (!data.name) { showToast('Error', 'Nama produk wajib diisi', 'error'); return; }
        if (!data.price) { showToast('Error', 'Harga wajib diisi', 'error'); return; }

        try {
            const method = id ? 'PUT' : 'POST';
            const url = id ? `/api/admin/products/${id}` : '/api/admin/products';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify(data)
            });
            const result = await res.json();

            if (result.success) {
                showToast('Sukses', id ? 'Produk berhasil diupdate' : 'Produk berhasil ditambahkan');
                closeProductModal();
                loadProducts();
                loadDashboard();
            } else {
                showToast('Error', result.message || 'Gagal menyimpan produk', 'error');
            }
        } catch (e) {
            showToast('Error', 'Terjadi kesalahan', 'error');
        }
    });

    // Delete
    document.getElementById('deleteProductBtn').addEventListener('click', deleteProduct);

    // Close on backdrop
    document.querySelector('#productModal .modal-backdrop').addEventListener('click', closeProductModal);
}

async function deleteProduct() {
    const id = document.getElementById('editProductId').value;
    if (!id) return;
    if (!confirm('Yakin hapus produk ini?')) return;

    try {
        const res = await fetch(`/api/admin/products/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
        });
        const result = await res.json();

        if (result.success) {
            showToast('Sukses', 'Produk berhasil dihapus');
            closeProductModal();
            loadProducts();
            loadDashboard();
        } else {
            showToast('Error', result.message || 'Gagal hapus produk', 'error');
        }
    } catch (e) {
        showToast('Error', 'Terjadi kesalahan', 'error');
    }
}

async function toggleProductStatus(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    const newStatus = product.status === 'active' ? 'inactive' : 'active';

    try {
        const res = await fetch(`/api/admin/products/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({ ...product, status: newStatus })
        });
        const result = await res.json();

        if (result.success) {
            showToast('Sukses', `Status produk diubah menjadi ${newStatus}`);
            loadProducts();
        } else {
            showToast('Error', result.message || 'Gagal update status', 'error');
        }
    } catch (e) {
        showToast('Error', 'Terjadi kesalahan', 'error');
    }
}

// ========================================
// TRANSACTIONS
// ========================================
async function loadTransactions() {
    try {
        const res = await fetch('/api/admin/transactions', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
        });
        const data = await res.json();

        if (data.success) {
            transactions = data.transactions || [];
            renderTransactions(transactions);
            updatePendingCount();
        }
    } catch (e) {
        console.error('Load transactions error:', e);
    }
}

function renderTransactions(list) {
    const tbody = $('transactionsList');
    const filter = $('filterStatus')?.value || 'all';
    const search = $('searchTransaction')?.value?.toLowerCase() || '';

    let filtered = list;
    if (filter !== 'all') filtered = filtered.filter(t => t.status === filter);
    if (search) filtered = filtered.filter(t =>
        (t.id || '').toLowerCase().includes(search) ||
        (t.buyerName || '').toLowerCase().includes(search) ||
        (t.username || '').toLowerCase().includes(search)
    );

    if (!filtered.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-slate-400 py-6">Tidak ada transaksi</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(t => `
        <tr>
            <td class="text-xs font-mono text-slate-500">${t.id?.slice(0, 10) || '-'}</td>
            <td>${t.buyerName || t.username || '-'}</td>
            <td>${t.productName || '-'}</td>
            <td>Rp ${(t.price || 0).toLocaleString()}</td>
            <td><span class="status-badge status-${t.status || 'pending'}">${t.status || 'pending'}</span></td>
            <td class="text-xs font-mono text-slate-500">${t.austinTxId?.slice(0, 12) || '-'}</td>
            <td class="text-xs text-slate-500">${t.createdAt ? new Date(t.createdAt).toLocaleString() : '-'}</td>
        </tr>
    `).join('');

    updatePendingCount();
}

function updatePendingCount() {
    const pending = transactions.filter(t => t.status === 'pending' || t.status === 'processing').length;
    $('badgePending').textContent = pending;
}

// Filter events
document.addEventListener('DOMContentLoaded', () => {
    $('filterStatus')?.addEventListener('change', () => renderTransactions(transactions));
    $('searchTransaction')?.addEventListener('input', () => renderTransactions(transactions));
});

// ========================================
// USERS
// ========================================
async function loadUsers() {
    try {
        const res = await fetch('/api/admin/users', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
        });
        const data = await res.json();

        if (data.success) {
            users = data.users || [];
            renderUsers(users);
            $('badgeUsers').textContent = users.length;
            $('statUsers').textContent = users.length;
        }
    } catch (e) {
        console.error('Load users error:', e);
    }
}

function renderUsers(list) {
    const tbody = $('usersList');
    const search = $('searchUser')?.value?.toLowerCase() || '';

    let filtered = list;
    if (search) filtered = filtered.filter(u =>
        (u.username || '').toLowerCase().includes(search) ||
        (u.email || '').toLowerCase().includes(search) ||
        (u.buyerName || '').toLowerCase().includes(search)
    );

    if (!filtered.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-slate-400 py-6">Tidak ada user</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(u => `
        <tr>
            <td class="text-xs font-mono text-slate-500">${u.id?.slice(0, 8) || '-'}</td>
            <td class="font-medium">${u.username || u.buyerName || '-'}</td>
            <td class="text-slate-400">${u.email || u.panelEmail || '-'}</td>
            <td class="text-center">${u.totalTransactions || 0}</td>
            <td>Rp ${(u.totalSpent || 0).toLocaleString()}</td>
            <td class="text-xs text-slate-500">${u.joinedAt ? new Date(u.joinedAt).toLocaleDateString() : '-'}</td>
        </tr>
    `).join('');
}

// Search user
document.addEventListener('DOMContentLoaded', () => {
    $('searchUser')?.addEventListener('input', () => renderUsers(users));

    // Check duplicate
    $('checkDuplicateBtn')?.addEventListener('click', checkDuplicateUsernames);
});

function checkDuplicateUsernames() {
    const resultDiv = document.getElementById('duplicateResult');
    const usernames = users.map(u => u.username || u.buyerName || '').filter(Boolean);

    const counts = {};
    usernames.forEach(name => { counts[name] = (counts[name] || 0) + 1; });

    const duplicates = Object.entries(counts).filter(([_, count]) => count > 1);

    if (!duplicates.length) {
        resultDiv.innerHTML = '✅ Tidak ada username duplikat. Semua username unik.';
        resultDiv.className = 'mb-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm';
    } else {
        resultDiv.innerHTML = `
            <strong>⚠️ Ditemukan ${duplicates.length} username duplikat:</strong><br>
            ${duplicates.map(([name, count]) => `• <strong>${name}</strong> — ${count} kali`).join('<br>')}
            <br><span class="text-xs text-amber-600">Saran: Ganti username yang sama untuk menghindari konflik.</span>
        `;
        resultDiv.className = 'mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm';
    }
    resultDiv.classList.remove('hidden');
}

// ========================================
// SETTINGS
// ========================================
async function loadSettings() {
    try {
        const res = await fetch('/api/admin/settings', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
        });
        const data = await res.json();

        if (data.success && data.settings) {
            $('panelUrl').value = data.settings.panelUrl || '';
            $('panelApiKey').value = data.settings.panelApiKey || '';
            $('panelEggId').value = data.settings.eggId || '15';
            $('panelNestId').value = data.settings.nestId || '5';
        }

        // Server info
        if (data.serverInfo) {
            $('cpuInfo').textContent = data.serverInfo.cpu || '-';
            $('ramInfo').textContent = data.serverInfo.ram || '-';
            $('storageInfo').textContent = data.serverInfo.storage || '-';
            $('uptimeInfo').textContent = data.serverInfo.uptime || '-';
        }
    } catch (e) {
        console.error('Load settings error:', e);
    }
}

// Settings form
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('settingsForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = {
            panelUrl: document.getElementById('panelUrl').value.trim(),
            panelApiKey: document.getElementById('panelApiKey').value.trim(),
            eggId: document.getElementById('panelEggId').value.trim() || '15',
            nestId: document.getElementById('panelNestId').value.trim() || '5'
        };

        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify(data)
            });
            const result = await res.json();

            if (result.success) {
                showToast('Sukses', 'Pengaturan berhasil disimpan');
            } else {
                showToast('Error', result.message || 'Gagal menyimpan', 'error');
            }
        } catch (e) {
            showToast('Error', 'Terjadi kesalahan', 'error');
        }
    });

    // Refresh server
    document.getElementById('refreshServerBtn')?.addEventListener('click', () => {
        showToast('Info', 'Memuat ulang status server...');
        loadSettings();
        setTimeout(() => showToast('Sukses', 'Status server diperbarui'), 1000);
    });
});

// ========================================
// REFRESH ALL
// ========================================
function refreshAll() {
    if (currentPage === 'dashboard') loadDashboard();
    if (currentPage === 'products') loadProducts();
    if (currentPage === 'transactions') loadTransactions();
    if (currentPage === 'users') loadUsers();
}

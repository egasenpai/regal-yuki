/* =========================================================================
   YUKI STORE ADMIN - Dashboard Logic
   ========================================================================= */

const ADMIN_API_BASE = '/api/admin';
let adminToken = localStorage.getItem('yuki_admin_token') || '';
let allTransactions = [];
let allProducts = [];
let allUsers = [];
let currentTxFilter = 'all';
let currentConfig = {};

// --- UTILITIES ---
function formatRupiah(price) {
    return 'Rp ' + price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function formatDate(iso) {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function showAdminToast(title, message, type = 'success') {
    const toast = document.getElementById('admin-toast');
    const toastTitle = document.getElementById('admin-toast-title');
    const toastMessage = document.getElementById('admin-toast-message');
    const toastIcon = document.getElementById('admin-toast-icon');
    if (!toast) return;
    toastTitle.textContent = title;
    toastMessage.textContent = message;
    if (type === 'error') {
        toastIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-400"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>';
        toastIcon.className = 'w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0';
    } else {
        toastIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-400"><polyline points="20 6 9 17 4 12"/></svg>';
        toastIcon.className = 'w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0';
    }
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);
}

async function apiGet(endpoint) {
    const res = await fetch(`${ADMIN_API_BASE}${endpoint}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    return res;
}

async function apiPost(endpoint, body) {
    const res = await fetch(`${ADMIN_API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify(body)
    });
    return res;
}

async function apiDelete(endpoint) {
    const res = await fetch(`${ADMIN_API_BASE}${endpoint}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    return res;
}

// --- AUTH ---
function initAuth() {
    const loginScreen = document.getElementById('login-screen');
    const dashboard = document.getElementById('admin-dashboard');
    const loginForm = document.getElementById('login-form');

    if (adminToken) {
        // Verify token
        apiGet('/verify').then(res => {
            if (res.ok) {
                loginScreen.classList.add('hidden');
                dashboard.classList.remove('hidden');
                initDashboard();
            } else {
                localStorage.removeItem('yuki_admin_token');
                adminToken = '';
            }
        }).catch(() => {
            localStorage.removeItem('yuki_admin_token');
            adminToken = '';
        });
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = document.getElementById('admin-password').value;
        try {
            const res = await fetch(`${ADMIN_API_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const data = await res.json();
            if (data.success && data.token) {
                adminToken = data.token;
                localStorage.setItem('yuki_admin_token', adminToken);
                loginScreen.classList.add('hidden');
                dashboard.classList.remove('hidden');
                initDashboard();
                showAdminToast('Berhasil', 'Selamat datang di Admin Panel');
            } else {
                showAdminToast('Gagal', 'Password salah!', 'error');
            }
        } catch (err) {
            showAdminToast('Error', 'Gagal terhubung ke server', 'error');
        }
    });
}

function logoutAdmin() {
    localStorage.removeItem('yuki_admin_token');
    adminToken = '';
    location.reload();
}

// --- NAVIGATION ---
function navigateToAdmin(page) {
    document.querySelectorAll('.section-page').forEach(s => s.classList.remove('active'));
    const target = document.getElementById('page-' + page);
    if (target) target.classList.add('active');
    document.querySelectorAll('#admin-sidebar .nav-item').forEach(nav => nav.classList.remove('active'));
    const activeNav = document.querySelector(`#admin-sidebar .nav-item[data-page="${page}"]`);
    if (activeNav) activeNav.classList.add('active');
    const sidebar = document.getElementById('admin-sidebar');
    const overlay = document.getElementById('admin-mobile-overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function initNavigation() {
    document.querySelectorAll('#admin-sidebar .nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const page = item.getAttribute('data-page');
            if (page) navigateToAdmin(page);
        });
    });
    const menuToggle = document.getElementById('admin-menu-toggle');
    const sidebar = document.getElementById('admin-sidebar');
    const overlay = document.getElementById('admin-mobile-overlay');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('hidden');
        });
    }
    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.add('hidden');
        });
    }
}

// --- DASHBOARD DATA ---
async function initDashboard() {
    initNavigation();
    loadDashboardStats();
    refreshServerStatus();
    loadRecentTransactions();
    loadProducts();
    loadTransactions();
    loadUsers();
    loadConfig();
}

async function loadDashboardStats() {
    try {
        const [productsRes, txRes, usersRes] = await Promise.all([
            apiGet('/products'),
            apiGet('/transactions'),
            apiGet('/users')
        ]);

        if (productsRes.ok) {
            const products = await productsRes.json();
            allProducts = products.products || [];
            document.getElementById('stat-products').textContent = allProducts.length;
        }
        if (txRes.ok) {
            const txs = await txRes.json();
            allTransactions = txs.transactions || [];
            const success = allTransactions.filter(t => t.status === 'completed').length;
            const pending = allTransactions.filter(t => t.status === 'pending').length;
            document.getElementById('stat-success').textContent = success;
            document.getElementById('stat-pending').textContent = pending;
            // Update badge
            const badge = document.getElementById('tx-badge');
            if (pending > 0) {
                badge.textContent = pending;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
        if (usersRes.ok) {
            const users = await usersRes.json();
            allUsers = users.users || [];
            document.getElementById('stat-users').textContent = allUsers.length;
        }
    } catch (e) {
        console.error('Dashboard stats error:', e);
    }
}

// --- SERVER STATUS ---
async function refreshServerStatus() {
    const content = document.getElementById('server-status-content');
    const specs = document.getElementById('server-specs');
    try {
        const res = await apiGet('/server-status');
        if (res.ok) {
            const data = await res.json();
            document.getElementById('ss-url').textContent = data.panelUrl || '-';
            const statusDot = document.getElementById('ss-status-dot');
            const statusText = document.getElementById('ss-status');
            if (data.online) {
                statusDot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-500';
                statusText.textContent = 'Online';
                statusText.className = 'text-sm font-semibold text-emerald-400';
            } else {
                statusDot.className = 'w-2.5 h-2.5 rounded-full bg-red-500';
                statusText.textContent = 'Offline';
                statusText.className = 'text-sm font-semibold text-red-400';
            }
            document.getElementById('ss-response').textContent = data.responseTime ? `${data.responseTime}ms` : '-';

            if (data.specs) {
                specs.classList.remove('hidden');
                document.getElementById('spec-cpu').textContent = data.specs.cpu || '-';
                document.getElementById('spec-ram').textContent = data.specs.ram || '-';
                document.getElementById('spec-disk').textContent = data.specs.disk || '-';
                document.getElementById('spec-servers').textContent = data.specs.servers || '-';
            }
        }
    } catch (e) {
        console.error('Server status error:', e);
    }
}

// --- TRANSACTIONS ---
async function loadTransactions() {
    try {
        const res = await apiGet('/transactions');
        if (res.ok) {
            const data = await res.json();
            allTransactions = data.transactions || [];
            renderTransactions();
        }
    } catch (e) {
        console.error('Load transactions error:', e);
    }
}

function renderTransactions() {
    const list = document.getElementById('transactions-list');
    let filtered = allTransactions;
    if (currentTxFilter !== 'all') {
        filtered = allTransactions.filter(t => t.status === currentTxFilter);
    }

    if (!filtered.length) {
        list.innerHTML = '<p class="text-sm text-slate-400 text-center py-8">Tidak ada transaksi</p>';
        return;
    }

    list.innerHTML = filtered.map(tx => {
        const statusClass = tx.status;
        const statusLabel = { pending: 'Pending', processing: 'Processing', completed: 'Berhasil', failed: 'Gagal' }[tx.status] || tx.status;
        return `
            <div class="tx-item">
                <div class="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-400"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-white truncate">${tx.productName || '-'}</p>
                    <p class="text-xs text-slate-400">${tx.buyerName || '-'} • ${tx.buyerWa || '-'}</p>
                    <p class="text-[10px] text-slate-500 mt-0.5">Ref: ${tx.referenceId || '-'} • ${formatDate(tx.createdAt)}</p>
                </div>
                <div class="text-right flex-shrink-0">
                    <p class="text-sm font-bold text-white">${formatRupiah(tx.price || 0)}</p>
                    <span class="tx-status ${statusClass}">${statusLabel}</span>
                </div>
            </div>
        `;
    }).join('');
}

function filterTx(status) {
    currentTxFilter = status;
    document.querySelectorAll('.tx-filter').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === status);
    });
    renderTransactions();
}

async function loadRecentTransactions() {
    try {
        const res = await apiGet('/transactions?limit=5');
        if (res.ok) {
            const data = await res.json();
            const txs = data.transactions || [];
            const list = document.getElementById('recent-transactions');
            if (!txs.length) {
                list.innerHTML = '<p class="text-sm text-slate-400 text-center py-8">Belum ada transaksi</p>';
                return;
            }
            list.innerHTML = txs.map(tx => {
                const statusClass = tx.status;
                const statusLabel = { pending: 'Pending', processing: 'Processing', completed: 'Berhasil', failed: 'Gagal' }[tx.status] || tx.status;
                return `
                    <div class="tx-item">
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-semibold text-white">${tx.productName || '-'}</p>
                            <p class="text-xs text-slate-400">${tx.buyerName || '-'} • ${formatDate(tx.createdAt)}</p>
                        </div>
                        <span class="tx-status ${statusClass}">${statusLabel}</span>
                    </div>
                `;
            }).join('');
        }
    } catch (e) {
        console.error('Recent tx error:', e);
    }
}

// --- PRODUCTS ---
async function loadProducts() {
    try {
        const res = await apiGet('/products');
        if (res.ok) {
            const data = await res.json();
            allProducts = data.products || [];
            renderProducts();
        }
    } catch (e) {
        console.error('Load products error:', e);
    }
}

function renderProducts() {
    const list = document.getElementById('products-list');
    if (!allProducts.length) {
        list.innerHTML = '<p class="text-sm text-slate-400 text-center py-8">Belum ada produk</p>';
        return;
    }
    list.innerHTML = allProducts.map(p => `
        <div class="product-item ${p.enabled === false ? 'disabled' : ''}">
            <div class="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-400"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                    <p class="text-sm font-semibold text-white">${p.name}</p>
                    ${p.enabled === false ? '<span class="text-[10px] bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">Nonaktif</span>' : ''}
                </div>
                <p class="text-xs text-slate-400">${p.specs || '-'} • RAM: ${p.ram || '-'}</p>
            </div>
            <div class="text-right flex-shrink-0 mr-4">
                <p class="text-sm font-bold text-white">${formatRupiah(p.price)}</p>
                <p class="text-[10px] text-slate-500">${p.category || 'panel'}</p>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
                <button onclick="editProduct(${p.id})" class="p-2 rounded-lg hover:bg-blue-500/10 text-blue-400 transition-colors" title="Edit">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button onclick="deleteProduct(${p.id})" class="p-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors" title="Hapus">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
            </div>
        </div>
    `).join('');
}

// --- PRODUCT MODAL ---
let editingProductId = null;

function openProductModal(product = null) {
    editingProductId = product ? product.id : null;
    document.getElementById('product-modal-title').textContent = product ? 'Edit Produk' : 'Tambah Produk';
    document.getElementById('product-id').value = product ? product.id : '';
    document.getElementById('product-name').value = product ? product.name : '';
    document.getElementById('product-price').value = product ? product.price : '';
    document.getElementById('product-specs').value = product ? product.specs : '';
    document.getElementById('product-ram').value = product ? product.ram : '';
    document.getElementById('product-category').value = product ? (product.category || 'panel') : 'panel';
    document.getElementById('product-enabled').checked = product ? (product.enabled !== false) : true;
    document.getElementById('product-modal').classList.add('active');
}

function closeProductModal() {
    document.getElementById('product-modal').classList.remove('active');
    editingProductId = null;
}

function editProduct(id) {
    const product = allProducts.find(p => p.id === id);
    if (product) openProductModal(product);
}

async function saveProduct() {
    const name = document.getElementById('product-name').value.trim();
    const price = parseInt(document.getElementById('product-price').value);
    const specs = document.getElementById('product-specs').value.trim();
    const ram = document.getElementById('product-ram').value.trim();
    const category = document.getElementById('product-category').value;
    const enabled = document.getElementById('product-enabled').checked;

    if (!name || !price) {
        showAdminToast('Error', 'Nama dan harga wajib diisi!', 'error');
        return;
    }

    const payload = { name, price, specs, ram, category, enabled };
    if (editingProductId) payload.id = editingProductId;

    try {
        const res = await apiPost('/products', payload);
        const data = await res.json();
        if (data.success) {
            showAdminToast('Berhasil', editingProductId ? 'Produk diperbarui' : 'Produk ditambahkan');
            closeProductModal();
            loadProducts();
            loadDashboardStats();
        } else {
            showAdminToast('Gagal', data.error || 'Gagal menyimpan produk', 'error');
        }
    } catch (e) {
        showAdminToast('Error', 'Gagal terhubung ke server', 'error');
    }
}

async function deleteProduct(id) {
    if (!confirm('Yakin ingin menghapus produk ini?')) return;
    try {
        const res = await apiDelete(`/products?id=${id}`);
        const data = await res.json();
        if (data.success) {
            showAdminToast('Berhasil', 'Produk dihapus');
            loadProducts();
            loadDashboardStats();
        } else {
            showAdminToast('Gagal', data.error || 'Gagal menghapus produk', 'error');
        }
    } catch (e) {
        showAdminToast('Error', 'Gagal terhubung ke server', 'error');
    }
}

// --- USERS ---
async function loadUsers() {
    try {
        const res = await apiGet('/users');
        if (res.ok) {
            const data = await res.json();
            allUsers = data.users || [];
            renderUsers(allUsers);
        }
    } catch (e) {
        console.error('Load users error:', e);
    }
}

function renderUsers(users) {
    const list = document.getElementById('users-list');
    if (!users.length) {
        list.innerHTML = '<p class="text-sm text-slate-400 text-center py-8">Tidak ada user</p>';
        return;
    }
    list.innerHTML = users.map(u => `
        <div class="user-item">
            <div class="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-violet-400"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-white">${u.username || '-'}</p>
                <p class="text-xs text-slate-400">${u.email || '-'}</p>
            </div>
            <div class="text-right flex-shrink-0">
                <p class="text-[10px] text-slate-500">ID: ${u.id || '-'}</p>
                <p class="text-[10px] text-slate-500">${u.serverCount || 0} servers</p>
            </div>
        </div>
    `).join('');
}

function searchUsers(query) {
    const q = query.toLowerCase();
    const filtered = allUsers.filter(u =>
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q))
    );
    renderUsers(filtered);
}

// --- CHECK USERNAME ---
async function checkUsername() {
    const username = document.getElementById('check-username-input').value.trim();
    const resultBox = document.getElementById('check-username-result');
    if (!username) {
        showAdminToast('Error', 'Masukkan username yang dicek', 'error');
        return;
    }

    resultBox.classList.remove('hidden');
    resultBox.innerHTML = '<div class="text-center py-8"><div class="loading-spinner-admin mx-auto mb-3"></div><p class="text-sm text-slate-400">Mengecek username...</p></div>';

    try {
        const res = await apiGet(`/check-username?username=${encodeURIComponent(username)}`);
        const data = await res.json();

        if (data.exists) {
            resultBox.innerHTML = `
                <div class="check-result-box taken">
                    <div class="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-400"><circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/></svg>
                    </div>
                    <h3 class="text-lg font-bold text-red-400 mb-1">Username Sudah Terpakai!</h3>
                    <p class="text-sm text-slate-300">"${username}" sudah terdaftar di panel.</p>
                    <p class="text-xs text-slate-500 mt-2">User harus ganti username lain.</p>
                </div>
            `;
        } else {
            resultBox.innerHTML = `
                <div class="check-result-box available">
                    <div class="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-400"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    </div>
                    <h3 class="text-lg font-bold text-emerald-400 mb-1">Username Tersedia!</h3>
                    <p class="text-sm text-slate-300">"${username}" bisa digunakan.</p>
                    <p class="text-xs text-slate-500 mt-2">Siap untuk didaftarkan ke panel.</p>
                </div>
            `;
        }
    } catch (e) {
        resultBox.innerHTML = '<p class="text-sm text-red-400 text-center py-4">Gagal mengecek username</p>';
    }
}

// --- CONFIG / SETTINGS ---
async function loadConfig() {
    try {
        const res = await apiGet('/config');
        if (res.ok) {
            const data = await res.json();
            currentConfig = data.config || {};
            // Fill form
            document.getElementById('maintenance-toggle').checked = currentConfig.maintenanceMode || false;
            document.getElementById('maintenance-message').value = currentConfig.maintenanceMessage || '';
            document.getElementById('config-panel-url').value = currentConfig.panelUrl || '';
            document.getElementById('config-panel-key').value = currentConfig.panelApiKey || '';
            document.getElementById('config-egg-id').value = currentConfig.eggId || '';
            document.getElementById('config-nest-id').value = currentConfig.nestId || '';
            document.getElementById('config-loc-id').value = currentConfig.locationId || '';
            document.getElementById('config-store-name').value = currentConfig.storeName || '';
            document.getElementById('config-admin-wa').value = currentConfig.adminWa || '';

            if (currentConfig.maintenanceMode) {
                document.getElementById('maintenance-message-box').classList.remove('hidden');
            }
        }
    } catch (e) {
        console.error('Load config error:', e);
    }
}

function toggleMaintenance() {
    const enabled = document.getElementById('maintenance-toggle').checked;
    const msgBox = document.getElementById('maintenance-message-box');
    if (enabled) msgBox.classList.remove('hidden');
    else msgBox.classList.add('hidden');
}

async function savePanelConfig() {
    const config = {
        panelUrl: document.getElementById('config-panel-url').value.trim(),
        panelApiKey: document.getElementById('config-panel-key').value.trim(),
        eggId: document.getElementById('config-egg-id').value.trim(),
        nestId: document.getElementById('config-nest-id').value.trim(),
        locationId: document.getElementById('config-loc-id').value.trim(),
        maintenanceMode: document.getElementById('maintenance-toggle').checked,
        maintenanceMessage: document.getElementById('maintenance-message').value.trim()
    };

    try {
        const res = await apiPost('/config', config);
        const data = await res.json();
        if (data.success) {
            showAdminToast('Berhasil', 'Konfigurasi panel disimpan');
            currentConfig = { ...currentConfig, ...config };
        } else {
            showAdminToast('Gagal', data.error || 'Gagal menyimpan', 'error');
        }
    } catch (e) {
        showAdminToast('Error', 'Gagal terhubung ke server', 'error');
    }
}

async function saveStoreConfig() {
    const config = {
        storeName: document.getElementById('config-store-name').value.trim(),
        adminWa: document.getElementById('config-admin-wa').value.trim()
    };

    try {
        const res = await apiPost('/config', config);
        const data = await res.json();
        if (data.success) {
            showAdminToast('Berhasil', 'Info toko disimpan');
        } else {
            showAdminToast('Gagal', data.error || 'Gagal menyimpan', 'error');
        }
    } catch (e) {
        showAdminToast('Error', 'Gagal terhubung ke server', 'error');
    }
}

// --- KEYBOARD ---
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeProductModal();
    }
});

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
});

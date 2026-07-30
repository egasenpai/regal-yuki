/* =========================================================================
   YUKI STORE ADMIN PANEL v1.0
   ========================================================================= */

const API_BASE = '/api/admin';
let adminPassword = localStorage.getItem('yukiAdminPass') || '';
let currentPage = 'admin-dashboard-page';
let allProducts = [];
let allTransactions = [];
let allUsers = [];
let currentTransactionTab = 'all';
let serverStatusInterval = null;

// --- UTILITIES ---
function formatRupiah(price) {
    return 'Rp ' + price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function formatDate(iso) {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function showToast(title, message, type = 'success') {
    const toast = document.getElementById('admin-toast');
    const toastTitle = document.getElementById('admin-toast-title');
    const toastMessage = document.getElementById('admin-toast-message');
    const toastIcon = document.getElementById('admin-toast-icon');
    if (!toast) return;
    toastTitle.textContent = title;
    toastMessage.textContent = message;
    if (type === 'error') {
        toastIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-500"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>';
        toastIcon.className = 'w-8 h-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0';
    } else {
        toastIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-emerald-500"><polyline points="20 6 9 17 4 12"/></svg>';
        toastIcon.className = 'w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0';
    }
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);
}

async function apiCall(action, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'X-Admin-Password': adminPassword
        }
    };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(`${API_BASE}?action=${action}`, options);
    return res.json();
}

// --- LOGIN ---
function initLogin() {
    const loginScreen = document.getElementById('login-screen');
    const dashboard = document.getElementById('admin-dashboard');

    if (adminPassword) {
        // Verify first
        apiCall('stats').then(data => {
            if (data.success) {
                loginScreen.classList.add('hidden');
                dashboard.classList.remove('hidden');
                initDashboard();
            } else {
                localStorage.removeItem('yukiAdminPass');
                adminPassword = '';
            }
        });
    }

    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const pass = document.getElementById('admin-password').value;
        const data = await apiCall('login', 'POST', { password: pass });
        if (data.success) {
            adminPassword = pass;
            localStorage.setItem('yukiAdminPass', pass);
            loginScreen.classList.add('hidden');
            dashboard.classList.remove('hidden');
            initDashboard();
            showToast('Sukses', 'Login berhasil!');
        } else {
            showToast('Gagal', data.error || 'Password salah', 'error');
        }
    });
}

function togglePassword() {
    const input = document.getElementById('admin-password');
    const icon = document.getElementById('eye-icon');
    if (input.type === 'password') {
        input.type = 'text';
        icon.setAttribute('data-lucide', 'eye-off');
    } else {
        input.type = 'password';
        icon.setAttribute('data-lucide', 'eye');
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function logout() {
    localStorage.removeItem('yukiAdminPass');
    adminPassword = '';
    location.reload();
}

// --- NAVIGATION ---
function initNavigation() {
    document.querySelectorAll('#admin-sidebar .nav-item[data-page]').forEach(item => {
        item.addEventListener('click', () => {
            const page = item.getAttribute('data-page');
            navigateTo(page);
        });
    });

    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('admin-sidebar');
    const overlay = document.getElementById('mobile-overlay');

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

function navigateTo(page) {
    currentPage = page;
    document.querySelectorAll('.section-page').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(page);
    if (target) target.classList.add('active');

    document.querySelectorAll('#admin-sidebar .nav-item').forEach(nav => nav.classList.remove('active'));
    const activeNav = document.querySelector(`#admin-sidebar .nav-item[data-page="${page}"]`);
    if (activeNav) activeNav.classList.add('active');

    const sidebar = document.getElementById('admin-sidebar');
    const overlay = document.getElementById('mobile-overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (page === 'admin-products-page') loadProducts();
    if (page === 'admin-transactions-page') loadTransactions();
    if (page === 'admin-users-page') loadUsers();
    if (page === 'admin-settings-page') loadSettings();

    setTimeout(() => { if (typeof lucide !== 'undefined') lucide.createIcons(); }, 100);
}

// --- DASHBOARD ---
async function initDashboard() {
    await loadStats();
    await loadServerStatus();
    await loadRecentTransactions();
    if (serverStatusInterval) clearInterval(serverStatusInterval);
    serverStatusInterval = setInterval(loadServerStatus, 30000);
}

function refreshDashboard() {
    loadStats();
    loadServerStatus();
    loadRecentTransactions();
    showToast('Refresh', 'Data dashboard diperbarui');
}

async function loadStats() {
    const data = await apiCall('stats');
    if (!data.success) return;

    const s = data.stats;
    document.getElementById('stat-total-products').textContent = s.totalProducts;
    document.getElementById('stat-active-products').textContent = s.activeProducts + ' aktif';
    document.getElementById('stat-pending').textContent = s.pendingCount;
    document.getElementById('stat-completed').textContent = s.completedCount;
    document.getElementById('stat-today').textContent = s.todayTransactions;

    // Badges
    const prodBadge = document.getElementById('product-count-badge');
    if (prodBadge) { prodBadge.textContent = s.totalProducts; prodBadge.classList.remove('hidden'); }
    const pendingBadge = document.getElementById('pending-count-badge');
    if (pendingBadge) { pendingBadge.textContent = s.pendingCount; pendingBadge.classList.remove('hidden'); }

    // Store status
    updateStoreToggleUI(s.storeOpen);
}

async function loadServerStatus() {
    const data = await apiCall('server-status');
    const badge = document.getElementById('server-status-badge');
    const urlEl = document.getElementById('server-url');
    const rtEl = document.getElementById('server-rt');
    const countEl = document.getElementById('server-count');
    const nodesEl = document.getElementById('server-nodes');

    if (!data.success) {
        badge.textContent = 'Error';
        badge.className = 'px-3 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-600';
        return;
    }

    if (data.status === 'online') {
        badge.textContent = 'ONLINE';
        badge.className = 'px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-600';
    } else {
        badge.textContent = 'OFFLINE';
        badge.className = 'px-3 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-600';
    }

    urlEl.textContent = data.panelUrl || '-';
    rtEl.textContent = data.responseTime ? data.responseTime + 'ms' : '-';
    countEl.textContent = data.servers ?? '-';
    nodesEl.textContent = data.nodes ?? '-';
}

async function loadRecentTransactions() {
    const data = await apiCall('transactions');
    const container = document.getElementById('recent-transactions');
    if (!data.success || !data.transactions.length) {
        container.innerHTML = '<div class="text-center py-4 text-xs text-slate-400">Belum ada transaksi</div>';
        return;
    }

    const recent = data.transactions.slice(0, 5);
    container.innerHTML = recent.map(t => {
        const statusColor = t.status === 'completed' ? 'text-emerald-600 bg-emerald-50' : 
                           t.status === 'pending' ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50';
        return `
            <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                <div class="min-w-0">
                    <p class="text-xs font-bold text-slate-700 truncate">${t.productName}</p>
                    <p class="text-[10px] text-slate-400">${t.buyerName} • ${formatRupiah(t.price)}</p>
                </div>
                <span class="text-[10px] font-bold px-2 py-1 rounded-full ${statusColor} flex-shrink-0">${t.status}</span>
            </div>
        `;
    }).join('');
}

// --- STORE TOGGLE ---
async function toggleStoreStatus() {
    const data = await apiCall('toggle-store', 'POST');
    if (data.success) {
        updateStoreToggleUI(data.storeOpen);
        showToast('Sukses', data.storeOpen ? 'Toko dibuka' : 'Toko ditutup');
    }
}

function updateStoreToggleUI(isOpen) {
    const btn = document.getElementById('store-toggle-btn');
    const text = document.getElementById('store-status-text');
    if (isOpen) {
        text.textContent = 'BUKA';
        text.className = 'text-[10px] font-bold text-emerald-600';
        btn.textContent = 'Tutup Toko';
        btn.className = 'w-full py-2 rounded-xl text-xs font-bold transition-all btn-emerald';
    } else {
        text.textContent = 'TUTUP';
        text.className = 'text-[10px] font-bold text-red-600';
        btn.textContent = 'Buka Toko';
        btn.className = 'w-full py-2 rounded-xl text-xs font-bold transition-all btn-red';
    }
}

// --- PRODUK ---
async function loadProducts() {
    const data = await apiCall('products');
    if (!data.success) return;
    allProducts = data.products || [];
    renderProducts();
}

function renderProducts() {
    const tbody = document.getElementById('products-table-body');
    const search = document.getElementById('product-search')?.value.toLowerCase() || '';
    const filter = document.getElementById('product-filter')?.value || 'all';

    let filtered = allProducts;
    if (search) filtered = filtered.filter(p => p.name.toLowerCase().includes(search));
    if (filter === 'active') filtered = filtered.filter(p => p.active);
    if (filter === 'inactive') filtered = filtered.filter(p => !p.active);

    if (!filtered.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="px-4 py-8 text-center text-sm text-slate-400">Tidak ada produk</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(p => {
        const statusBadge = p.active 
            ? '<span class="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600">AKTIF</span>'
            : '<span class="px-2 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-400">NONAKTIF</span>';
        return `
            <tr class="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td class="px-4 py-3 text-xs text-slate-500">#${p.id}</td>
                <td class="px-4 py-3 text-sm font-semibold text-slate-700">${p.name}</td>
                <td class="px-4 py-3 text-xs text-slate-500 capitalize">${p.category || 'panel'}</td>
                <td class="px-4 py-3 text-sm font-bold text-blue-600">${formatRupiah(p.price)}</td>
                <td class="px-4 py-3 text-xs text-slate-500">${p.ram || '-'}</td>
                <td class="px-4 py-3 text-xs text-slate-500">${p.stock ?? '∞'}</td>
                <td class="px-4 py-3">${statusBadge}</td>
                <td class="px-4 py-3 text-right">
                    <div class="flex items-center justify-end gap-2">
                        <button onclick="toggleProduct(${p.id})" class="p-1.5 rounded-lg hover:bg-slate-100" title="Toggle">
                            <i data-lucide="power" class="w-4 h-4 text-slate-400"></i>
                        </button>
                        <button onclick="editProduct(${p.id})" class="p-1.5 rounded-lg hover:bg-blue-50" title="Edit">
                            <i data-lucide="edit-2" class="w-4 h-4 text-blue-500"></i>
                        </button>
                        <button onclick="deleteProduct(${p.id})" class="p-1.5 rounded-lg hover:bg-red-50" title="Hapus">
                            <i data-lucide="trash-2" class="w-4 h-4 text-red-500"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    setTimeout(() => { if (typeof lucide !== 'undefined') lucide.createIcons(); }, 50);
}

function filterProducts() {
    renderProducts();
}

function openProductModal(product = null) {
    const modal = document.getElementById('product-modal');
    const title = document.getElementById('product-modal-title');

    document.getElementById('product-edit-id').value = product ? product.id : '';
    document.getElementById('prod-name').value = product ? product.name : '';
    document.getElementById('prod-price').value = product ? product.price : '';
    document.getElementById('prod-stock').value = product ? (product.stock ?? 999) : 999;
    document.getElementById('prod-ram').value = product ? product.ram : '';
    document.getElementById('prod-category').value = product ? (product.category || 'panel') : 'panel';
    document.getElementById('prod-specs').value = product ? product.specs : '';
    document.getElementById('prod-active').checked = product ? product.active !== false : true;

    title.textContent = product ? 'Edit Produk' : 'Tambah Produk';
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeProductModal() {
    document.getElementById('product-modal').classList.remove('active');
    document.body.style.overflow = '';
}

async function saveProduct() {
    const id = document.getElementById('product-edit-id').value;
    const payload = {
        name: document.getElementById('prod-name').value,
        price: parseInt(document.getElementById('prod-price').value) || 0,
        stock: parseInt(document.getElementById('prod-stock').value) || 0,
        ram: document.getElementById('prod-ram').value,
        category: document.getElementById('prod-category').value,
        specs: document.getElementById('prod-specs').value,
        active: document.getElementById('prod-active').checked
    };

    if (!payload.name || !payload.price) {
        showToast('Error', 'Nama dan harga wajib diisi', 'error');
        return;
    }

    if (id) {
        const data = await apiCall('products', 'PUT', { id: parseInt(id), ...payload });
        if (data.success) {
            showToast('Sukses', 'Produk diperbarui');
            closeProductModal();
            loadProducts();
        }
    } else {
        const data = await apiCall('products', 'POST', payload);
        if (data.success) {
            showToast('Sukses', 'Produk ditambahkan');
            closeProductModal();
            loadProducts();
        }
    }
}

function editProduct(id) {
    const product = allProducts.find(p => p.id == id);
    if (product) openProductModal(product);
}

async function toggleProduct(id) {
    const product = allProducts.find(p => p.id == id);
    if (!product) return;
    const data = await apiCall('products', 'PUT', { id, active: !product.active });
    if (data.success) {
        showToast('Sukses', product.active ? 'Produk dinonaktifkan' : 'Produk diaktifkan');
        loadProducts();
    }
}

async function deleteProduct(id) {
    if (!confirm('Yakin ingin menghapus produk ini?')) return;
    const data = await apiCall('products', 'DELETE', null, { id });
    // Note: DELETE with query params needs special handling
    const res = await fetch(`${API_BASE}?action=products&id=${id}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Password': adminPassword }
    });
    const result = await res.json();
    if (result.success) {
        showToast('Sukses', 'Produk dihapus');
        loadProducts();
    }
}

// --- TRANSAKSI ---
async function loadTransactions() {
    const status = currentTransactionTab === 'all' ? '' : currentTransactionTab;
    const data = await apiCall(`transactions${status ? '&status=' + status : ''}`);
    if (!data.success) return;
    allTransactions = data.transactions || [];
    renderTransactions();
}

function renderTransactions() {
    const tbody = document.getElementById('transactions-table-body');
    const search = document.getElementById('transaction-search')?.value.toLowerCase() || '';

    let filtered = allTransactions;
    if (search) {
        filtered = filtered.filter(t => 
            (t.buyerName && t.buyerName.toLowerCase().includes(search)) ||
            (t.panelUsername && t.panelUsername.toLowerCase().includes(search)) ||
            (t.referenceId && t.referenceId.toLowerCase().includes(search)) ||
            (t.productName && t.productName.toLowerCase().includes(search))
        );
    }

    if (!filtered.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="px-4 py-8 text-center text-sm text-slate-400">Tidak ada transaksi</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(t => {
        const statusBadge = t.status === 'completed' 
            ? '<span class="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600">SUKSES</span>'
            : t.status === 'pending'
            ? '<span class="px-2 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600">PENDING</span>'
            : '<span class="px-2 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-600">GAGAL</span>';
        return `
            <tr class="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td class="px-4 py-3 text-xs font-mono text-slate-500">${t.referenceId}</td>
                <td class="px-4 py-3 text-xs font-semibold text-slate-700">${t.productName}</td>
                <td class="px-4 py-3 text-xs text-slate-600">${t.buyerName}</td>
                <td class="px-4 py-3 text-xs text-slate-500">${t.buyerWa}</td>
                <td class="px-4 py-3 text-xs font-mono text-slate-600">${t.panelUsername}</td>
                <td class="px-4 py-3 text-xs font-bold text-blue-600">${formatRupiah(t.price)}</td>
                <td class="px-4 py-3">${statusBadge}</td>
                <td class="px-4 py-3 text-xs text-slate-400">${formatDate(t.createdAt)}</td>
            </tr>
        `;
    }).join('');
}

function setTransactionTab(tab) {
    currentTransactionTab = tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    loadTransactions();
}

function filterTransactions() {
    renderTransactions();
}

function refreshTransactions() {
    loadTransactions();
    showToast('Refresh', 'Data transaksi diperbarui');
}

// --- USER PANEL ---
async function loadUsers() {
    const data = await apiCall('users');
    if (!data.success) return;
    allUsers = data.users || [];
    renderUsers();
    if (data.fromCache) {
        showToast('Info', 'Menampilkan data cache. Klik Refresh untuk update terbaru.');
    }
}

function renderUsers() {
    const tbody = document.getElementById('users-table-body');
    const search = document.getElementById('user-search')?.value.toLowerCase() || '';

    let filtered = allUsers;
    if (search) {
        filtered = filtered.filter(u => 
            u.username.toLowerCase().includes(search) ||
            u.email.toLowerCase().includes(search)
        );
    }

    if (!filtered.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-8 text-center text-sm text-slate-400">Tidak ada user</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(u => `
        <tr class="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
            <td class="px-4 py-3 text-xs text-slate-500">${u.id}</td>
            <td class="px-4 py-3 text-sm font-semibold text-slate-700">${u.username}</td>
            <td class="px-4 py-3 text-xs text-slate-500">${u.email}</td>
            <td class="px-4 py-3 text-xs text-slate-600">${u.firstName} ${u.lastName}</td>
            <td class="px-4 py-3">${u.admin ? '<span class="px-2 py-1 rounded-full text-[10px] font-bold bg-violet-50 text-violet-600">ADMIN</span>' : '<span class="text-xs text-slate-400">-</span>'}</td>
            <td class="px-4 py-3 text-xs text-slate-400">${formatDate(u.createdAt)}</td>
        </tr>
    `).join('');
}

function filterUsers() {
    renderUsers();
}

function refreshUsers() {
    loadUsers();
    showToast('Refresh', 'Data user diperbarui dari panel');
}

async function checkDuplicateUsername() {
    const input = document.getElementById('check-username-input');
    const resultDiv = document.getElementById('check-username-result');
    const username = input.value.trim();

    if (!username) {
        showToast('Error', 'Masukkan username dulu', 'error');
        return;
    }

    resultDiv.classList.remove('hidden');
    resultDiv.innerHTML = '<div class="text-center py-2"><div class="loading-spinner w-5 h-5 border-2 mx-auto"></div><p class="text-[10px] text-slate-400 mt-1">Mengecek...</p></div>';

    const data = await apiCall('check-username&username=' + encodeURIComponent(username));

    if (data.exists) {
        resultDiv.innerHTML = `
            <div class="bg-red-50 rounded-xl p-3 border border-red-100 text-center">
                <i data-lucide="x-circle" class="w-6 h-6 text-red-500 mx-auto mb-1"></i>
                <p class="text-sm font-bold text-red-700">Username Sudah Ada!</p>
                <p class="text-[11px] text-red-600">Username "${username}" sudah terdaftar di panel. Suruh user ganti nama lain.</p>
            </div>
        `;
    } else {
        resultDiv.innerHTML = `
            <div class="bg-emerald-50 rounded-xl p-3 border border-emerald-100 text-center">
                <i data-lucide="check-circle" class="w-6 h-6 text-emerald-500 mx-auto mb-1"></i>
                <p class="text-sm font-bold text-emerald-700">Username Tersedia!</p>
                <p class="text-[11px] text-emerald-600">Username "${username}" bisa digunakan.</p>
            </div>
        `;
    }
    setTimeout(() => { if (typeof lucide !== 'undefined') lucide.createIcons(); }, 50);
}

// --- PENGATURAN ADP ---
async function loadSettings() {
    const data = await apiCall('config');
    if (!data.success) return;

    const c = data.config;
    document.getElementById('adp-panel-url').value = c.panelUrl || '';
    document.getElementById('adp-egg-id').value = c.eggId || '';
    document.getElementById('adp-nest-id').value = c.nestId || '';
    document.getElementById('adp-location-id').value = c.locationId || '';
    document.getElementById('adp-docker-image').value = c.dockerImage || '';

    // Status card
    document.getElementById('status-panel-url').textContent = c.panelUrl || '-';
    document.getElementById('status-egg-id').textContent = c.eggId || '-';
    document.getElementById('status-nest-id').textContent = c.nestId || '-';
    document.getElementById('status-location-id').textContent = c.locationId || '-';
    document.getElementById('status-docker-image').textContent = c.dockerImage || '-';
    document.getElementById('status-last-updated').textContent = c.lastUpdated ? formatDate(c.lastUpdated) : '-';
}

document.getElementById('adp-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        panelUrl: document.getElementById('adp-panel-url').value,
        eggId: document.getElementById('adp-egg-id').value,
        nestId: document.getElementById('adp-nest-id').value,
        locationId: document.getElementById('adp-location-id').value,
        dockerImage: document.getElementById('adp-docker-image').value
    };
    const apiKey = document.getElementById('adp-api-key').value;
    if (apiKey) payload.apiKey = apiKey;

    const data = await apiCall('config', 'PUT', payload);
    if (data.success) {
        showToast('Sukses', 'Konfigurasi panel diperbarui');
        loadSettings();
    } else {
        showToast('Gagal', data.error, 'error');
    }
});

async function testPanelConnection() {
    const resultDiv = document.getElementById('adp-test-result');
    resultDiv.classList.remove('hidden');
    resultDiv.innerHTML = '<div class="text-center py-2"><div class="loading-spinner w-5 h-5 border-2 mx-auto"></div><p class="text-[10px] text-slate-400 mt-1">Testing koneksi...</p></div>';

    const data = await apiCall('server-status');

    if (data.status === 'online') {
        resultDiv.innerHTML = `
            <div class="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                <div class="flex items-center gap-2 mb-1">
                    <i data-lucide="wifi" class="w-4 h-4 text-emerald-500"></i>
                    <span class="text-sm font-bold text-emerald-700">Koneksi Berhasil!</span>
                </div>
                <p class="text-[11px] text-emerald-600">Panel online. Response time: ${data.responseTime}ms. Servers: ${data.servers}. Nodes: ${data.nodes}.</p>
            </div>
        `;
    } else {
        resultDiv.innerHTML = `
            <div class="bg-red-50 rounded-xl p-4 border border-red-100">
                <div class="flex items-center gap-2 mb-1">
                    <i data-lucide="wifi-off" class="w-4 h-4 text-red-500"></i>
                    <span class="text-sm font-bold text-red-700">Koneksi Gagal!</span>
                </div>
                <p class="text-[11px] text-red-600">Panel tidak dapat dijangkau. Error: ${data.error || 'Unknown'}</p>
            </div>
        `;
    }
    setTimeout(() => { if (typeof lucide !== 'undefined') lucide.createIcons(); }, 50);
}

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    initLogin();
    initNavigation();
});

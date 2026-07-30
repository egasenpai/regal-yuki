
/* =========================================================================
   YUKI STORE v3.6 - FULL INTEGRATED SCRIPT (CLIENT-SIDE)
   Pinterest 2-Column Grid, Music Search, Visualizer, & GitHub CDN
   FIX: Ganti Catbox CDN → Regal GitHub CDN (egasenpai/yuki-regal)
   ========================================================================= */

// --- 1. CORE & API CONFIGURATION ---
const API_CONFIG = (() => {
    const base = atob('aHR0cHM6Ly9kb2NzLWFsaXAuY2x1dGNoLndlYi5pZA==');
    const key = atob('YWxpcGFpYXBpa2V5YmFydQ==');
    return { base, key };
})();

// --- 2. SVG LOGOS & ICONS ---
const SPOTIFY_LOGO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 168 168" width="18" height="18"><path fill="#1DB954" d="M84 0C37.8 0 0 37.8 0 84s37.8 84 84 84 84-37.8 84-84S130.2 0 84 0zm38.5 121.2c-1.5 2.5-4.7 3.2-7.1 1.7-19.5-11.9-44.1-14.6-73-8-2.8.6-5.6-1.1-6.2-3.9-.6-2.8 1.1-5.6 3.9-6.2 31.6-7.2 58.7-4.1 80.3 9.2 2.4 1.4 3.1 4.6 1.7 7.1zm10.3-22.9c-1.9 3-5.9 4-8.9 2.1-22.3-13.7-56.3-17.7-82.7-9.7-3.4 1-7-1-8-4.4s1-7 4.4-8c30.2-9.2 67.7-4.7 92.9 11.1 3.1 1.8 4.1 5.8 2.2 8.9zm.9-23.8c-26.8-15.9-71-17.4-96.5-9.6-4.1 1.2-8.4-1.1-9.6-5.2-1.2-4.1 1.1-8.4 5.2-9.6 29.3-8.9 78.1-7.2 108.7 11.1 3.7 2.2 4.9 6.9 2.7 10.6-2.2 3.6-6.9 4.9-10.5 2.7z"/></svg>`;
const PINTEREST_LOGO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18"><path fill="#E60023" d="M12 0C5.4 0 0 5.4 0 12c0 5.1 3.2 9.5 7.6 11.2-.1-1-.3-2.6.1-3.7.3-.8 1.7-5.4 1.7-5.4s-.4-.9-.4-2.1c0-2 1.2-3.5 2.6-3.5 1.2 0 1.8.9 1.8 2 0 1.2-.8 3-1.2 4.7-.3 1.4.7 2.5 2 2.5 2.4 0 4.2-2.5 4.2-6.1 0-3.2-2.3-5.4-5.5-5.4-3.8 0-6 2.8-6 5.7 0 1.1.4 2.3.9 3 .1.2.2.3.1.5l-.3 1.1c0 .2-.1.2-.3.1-1.2-.5-2-2.3-2-3.7 0-3 2.5-6.6 7.5-6.6 4 0 7.1 2.9 7.1 6.7 0 4.1-2.6 7.4-6.1 7.4-1.2 0-2.3-.6-2.7-1.3l-.7 2.8c-.3 1.1-1 2.5-1.5 3.3C9.5 23.8 10.7 24 12 24c6.6 0 12-5.4 12-12S18.6 0 12 0z"/></svg>`;

const IC_PLAY = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="0"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
const IC_PAUSE = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="0"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;
const IC_CLOSE = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
const IC_INFO = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="12"/><line x1="12" x2="12.01" y1="8" y2="8"/></svg>`;
const IC_CLOCK = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
const IC_MUSIC = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;
const IC_DISC = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>`;
const IC_EXTERNAL = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;

// --- 3. DATA PRODUCTS ---
let panelProducts = [];
let storeOpen = true;

async function fetchProducts() {
    try {
        const res = await fetch('/api/admin-products');
        const data = await res.json();
        if (data.success) {
            storeOpen = data.storeOpen;
            panelProducts = data.products || [];
            return true;
        }
    } catch (e) {
        console.log('Failed to fetch products, using fallback:', e.message);
    }
    // Fallback to hardcoded
    storeOpen = true;
    panelProducts = [
        { id: 1, name: 'Panel 1GB', price: 2000, specs: 'VPS R18 C4 • Aktif 30 Hari', ram: '1GB' },
        { id: 2, name: 'Panel 2GB', price: 3000, specs: 'VPS R18 C4 • Aktif 30 Hari', ram: '2GB' },
        { id: 3, name: 'Panel 3GB', price: 4000, specs: 'VPS R18 C4 • Aktif 30 Hari', ram: '3GB' },
        { id: 4, name: 'Panel 4GB', price: 5000, specs: 'VPS R18 C4 • Aktif 30 Hari', ram: '4GB' },
        { id: 5, name: 'Panel 5GB', price: 6000, specs: 'VPS R18 C4 • Aktif 30 Hari', ram: '5GB' },
        { id: 6, name: 'Panel 6GB', price: 7000, specs: 'VPS R18 C4 • Aktif 30 Hari', ram: '6GB' },
        { id: 7, name: 'Panel 7GB', price: 8000, specs: 'VPS R18 C4 • Aktif 30 Hari', ram: '7GB' },
        { id: 8, name: 'Panel 8GB', price: 9000, specs: 'VPS R18 C4 • Aktif 30 Hari', ram: '8GB' },
        { id: 9, name: 'Panel 9GB', price: 10000, specs: 'VPS R18 C4 • Aktif 30 Hari', ram: '9GB' },
        { id: 10, name: 'Panel 10GB', price: 11000, specs: 'VPS R18 C4 • Aktif 30 Hari', ram: '10GB' },
        { id: 11, name: 'Panel UNLIMITED', price: 25000, specs: 'VPS R18 C4 • Aktif 30 Hari', ram: 'UNLIMITED' },
    ];
    return false;
}
];

// --- 4. GLOBAL APP STATES ---
let currentModalProduct = { name: '', price: 0 };
let currentPanelProduct = { name: '', price: 0 };
let paymentCheckInterval = null;
let countdownInterval = null;
let isPlaying = false;
let currentPage = 'dashboard';
let currentAudioUrl = '';
let currentTrackData = null;
let lastKickTime = 0;
let kickEnergy = 0;
let kickDecay = 0.92;

let audioCtx = null;
let analyser = null;
let source = null;
let dataArray = null;
let vizFrameId = null;

// --- 5. UTILITIES ---
function formatRupiah(price) {
    return 'Rp ' + price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function formatDuration(ms) {
    if (!ms || ms <= 0) return '0:00';
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m + ':' + (sec < 10 ? '0' : '') + sec;
}

function initIcons() {
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// --- 6. CORE APP STYLES INJECTION ---
function injectStyles() {
    if (document.getElementById('yuki-styles')) return;
    const style = document.createElement('style');
    style.id = 'yuki-styles';
    style.textContent = `
        /* ===== Track List ===== */
        .track-list { display: flex; flex-direction: column; gap: 8px; }
        .track-row {
            display: flex; align-items: center; gap: 14px;
            padding: 12px 14px; border-radius: 14px;
            background: rgba(255,255,255,0.6);
            border: 1px solid rgba(226,232,240,0.6);
            transition: all 0.2s ease; cursor: pointer;
        }
        .track-row:hover {
            background: rgba(255,255,255,0.95);
            border-color: rgba(16,185,129,0.2);
            transform: translateX(4px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.04);
        }
        .track-thumb {
            width: 52px; height: 52px; border-radius: 10px;
            object-fit: cover; flex-shrink: 0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .track-info { flex: 1; min-width: 0; }
        .track-title {
            font-size: 0.875rem; font-weight: 700; color: #1e293b;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            line-height: 1.3;
        }
        .track-artist {
            font-size: 0.75rem; color: #64748b; margin-top: 2px;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .track-meta-row {
            display: flex; align-items: center; gap: 10px;
            margin-top: 4px;
        }
        .track-meta {
            font-size: 0.65rem; color: #94a3b8;
            display: flex; align-items: center; gap: 3px;
        }
        .track-actions {
            display: flex; align-items: center; gap: 8px;
            flex-shrink: 0;
        }
        .btn-play-sm {
            width: 36px; height: 36px; border-radius: 50%;
            background: linear-gradient(135deg, #10b981, #059669);
            color: white; border: none; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 4px 12px rgba(16,185,129,0.3);
            transition: all 0.15s cubic-bezier(0.34,1.56,0.64,1);
        }
        .btn-play-sm:hover { transform: scale(1.12); box-shadow: 0 6px 16px rgba(16,185,129,0.4); }
        .btn-play-sm:active { transform: scale(0.92); }
        .btn-info-sm {
            width: 32px; height: 32px; border-radius: 50%;
            background: rgba(241,245,249,0.8); color: #64748b;
            border: 1px solid rgba(226,232,240,0.8); cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: all 0.15s ease;
        }
        .btn-info-sm:hover { background: white; color: #1e293b; border-color: #cbd5e1; }

        /* ===== Track Detail Modal ===== */
        .td-overlay {
            position: fixed; inset: 0; z-index: 100;
            display: flex; align-items: center; justify-content: center;
            padding: 20px; opacity: 0; pointer-events: none;
            transition: opacity 0.25s ease;
        }
        .td-overlay.active { opacity: 1; pointer-events: all; }
        .td-backdrop {
            position: absolute; inset: 0;
            background: rgba(15,23,42,0.55); backdrop-filter: blur(10px);
        }
        .td-card {
            position: relative; background: white; border-radius: 20px;
            width: 100%; max-width: 400px; max-height: 90vh;
            overflow: hidden; box-shadow: 0 25px 60px -15px rgba(0,0,0,0.25);
            transform: scale(0.92) translateY(16px);
            transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
        }
        .td-overlay.active .td-card { transform: scale(1) translateY(0); }
        .td-cover-wrap {
            position: relative; width: 100%; aspect-ratio: 1;
            background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
        }
        .td-cover {
            width: 100%; height: 100%; object-fit: cover;
        }
        .td-cover-overlay {
            position: absolute; inset: 0;
            background: linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%);
        }
        .td-close {
            position: absolute; top: 12px; right: 12px; z-index: 10;
            width: 34px; height: 34px; border-radius: 50%;
            background: rgba(0,0,0,0.4); backdrop-filter: blur(8px);
            border: none; color: white; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: all 0.2s ease;
        }
        .td-close:hover { background: rgba(0,0,0,0.6); transform: rotate(90deg); }
        .td-body { padding: 24px; }
        .td-title {
            font-size: 1.15rem; font-weight: 800; color: #0f172a;
            line-height: 1.3; margin-bottom: 4px;
        }
        .td-artist {
            font-size: 0.9rem; color: #64748b; font-weight: 500;
            margin-bottom: 16px;
        }
        .td-details {
            display: grid; grid-template-columns: 1fr 1fr;
            gap: 10px; margin-bottom: 20px;
        }
        .td-detail-item {
            display: flex; align-items: center; gap: 8px;
            padding: 10px 12px; border-radius: 10px;
            background: #f8fafc; border: 1px solid #f1f5f9;
        }
        .td-detail-item svg { color: #94a3b8; flex-shrink: 0; }
        .td-detail-label {
            font-size: 0.6rem; color: #94a3b8; text-transform: uppercase;
            letter-spacing: 0.05em; font-weight: 600;
        }
        .td-detail-value {
            font-size: 0.8rem; color: #334155; font-weight: 600;
        }
        .td-playbar {
            display: flex; gap: 10px;
        }
        .td-btn-play {
            flex: 1; padding: 13px 20px; border-radius: 12px;
            background: linear-gradient(135deg, #10b981, #059669);
            color: white; font-weight: 700; font-size: 0.85rem;
            border: none; cursor: pointer;
            display: flex; align-items: center; justify-content: center; gap: 8px;
            box-shadow: 0 8px 20px -4px rgba(16,185,129,0.35);
            transition: all 0.2s ease;
        }
        .td-btn-play:hover {
            transform: translateY(-1px);
            box-shadow: 0 12px 24px -4px rgba(16,185,129,0.45);
        }
        .td-btn-play:active { transform: translateY(0) scale(0.98); }
        .td-btn-spotify {
            padding: 13px 16px; border-radius: 12px;
            background: #f1f5f9; color: #1e293b;
            font-weight: 600; font-size: 0.8rem;
            border: 1px solid #e2e8f0; cursor: pointer;
            display: flex; align-items: center; justify-content: center; gap: 6px;
            transition: all 0.2s ease; flex-shrink: 0;
        }
        .td-btn-spotify:hover { background: #e2e8f0; border-color: #cbd5e1; }

        /* ===== Visualizer ===== */
        .viz-wrap {
            display: flex; align-items: flex-end; justify-content: center;
            gap: 2px; height: 40px; width: 100%; padding: 0 16px;
            margin-top: 6px;
        }
        .viz-bar {
            width: 3px; border-radius: 99px; min-height: 2px;
            background: linear-gradient(to top, #10b981, #34d399);
            transition: height 0.04s ease-out, filter 0.08s ease, background 0.08s ease;
            box-shadow: 0 0 0 rgba(0,0,0,0);
        }
        .viz-bar.kick {
            background: linear-gradient(to top, #f59e0b, #ef4444) !important;
            filter: drop-shadow(0 0 4px rgba(245,158,11,0.8)) drop-shadow(0 0 8px rgba(239,68,68,0.4));
        }
        .viz-bar.snare {
            background: linear-gradient(to top, #3b82f6, #8b5cf6) !important;
            filter: drop-shadow(0 0 3px rgba(59,130,246,0.6));
        }

        /* ===== PINTEREST GRID - 2 COLUMNS ===== */
        .pin-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
        }
        @media (min-width: 640px) {
            .pin-grid {
                grid-template-columns: repeat(3, 1fr);
                gap: 12px;
            }
        }
        @media (min-width: 1024px) {
            .pin-grid {
                grid-template-columns: repeat(4, 1fr);
                gap: 14px;
            }
        }
        .pin-card {
            position: relative; border-radius: 14px; overflow: hidden;
            cursor: pointer;
            background: #f1f5f9;
            break-inside: avoid;
        }
        .pin-card img {
            width: 100%; height: auto; display: block;
            transition: transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94);
        }
        .pin-card:hover img { transform: scale(1.08); }
        .pin-card-overlay {
            position: absolute; inset: 0;
            background: linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%);
            opacity: 0; transition: opacity 0.25s ease;
            display: flex; align-items: flex-end; justify-content: center;
            padding: 14px;
        }
        .pin-card:hover .pin-card-overlay { opacity: 1; }
        .pin-btn {
            display: flex; align-items: center; gap: 6px;
            background: white; color: #0f172a;
            padding: 8px 14px; border-radius: 20px;
            font-size: 0.75rem; font-weight: 600;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transform: translateY(8px); opacity: 0;
            transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1);
        }
        .pin-card:hover .pin-btn { transform: translateY(0); opacity: 1; }

        /* ===== Player Pulse ===== */
        .player-pulse {
            animation: playerPulse 2.2s infinite;
        }
        @keyframes playerPulse {
            0% { box-shadow: 0 0 0 0 rgba(16,185,129,0.35); }
            60% { box-shadow: 0 0 0 14px rgba(16,185,129,0); }
            100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
        }
    `;
    document.head.appendChild(style);
}

// --- 7. NAVIGATION SYSTEM ---
function navigateTo(page) {
    currentPage = page;
    document.querySelectorAll('.section-page').forEach(s => s.classList.remove('active'));
    const target = document.getElementById('page-' + page);
    if (target) target.classList.add('active');
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    const activeNav = document.querySelector('.nav-item[data-page="' + page + '"]');
    if (activeNav) activeNav.classList.add('active');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobile-overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(initIcons, 100);
}

function initNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const page = item.getAttribute('data-page');
            if (page) navigateTo(page);
        });
    });
}

// --- 8. PRODUCT RENDERING & CARD ACTIONS ---
async function renderPanelProducts() {
    await fetchProducts();
    const grid = document.getElementById('panel-grid');
    if (!grid) return;

    if (!storeOpen) {
        grid.innerHTML = `
            <div class="col-span-full glass-card p-12 text-center">
                <div class="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-400"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                </div>
                <h3 class="font-bold text-slate-600 text-lg">Toko Sedang Tutup</h3>
                <p class="text-sm text-slate-400 mt-1">Silakan kembali lagi nanti ya kak! 🙏</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = panelProducts.map(product => {
        const isPopular = product.ram === 'UNLIMITED' || product.ram === '10GB';
        return `
            <div class="glass-card group p-5 relative">
                ${isPopular ? `<div class="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold shadow-md">POPULAR</div>` : ''}
                <div class="flex items-center gap-3 mb-3">
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-md shadow-blue-100">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>
                    </div>
                    <div>
                        <h3 class="font-bold text-slate-800 text-sm">${product.name}</h3>
                        <p class="text-[10px] text-slate-400">${product.specs}</p>
                    </div>
                </div>
                <div class="flex items-end justify-between mb-4">
                    <div><p class="text-[10px] text-slate-400 mb-0.5">Harga</p><p class="text-lg font-bold text-blue-600">${formatRupiah(product.price)}</p></div>
                    <div class="text-right"><p class="text-[10px] text-slate-400 mb-0.5">RAM</p><p class="text-sm font-semibold text-slate-600">${product.ram}</p></div>
                </div>
                <button onclick="openPanelModal('${product.name}', ${product.price})" class="btn-primary w-full text-xs">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                    Beli Sekarang
                </button>
            </div>
        `;
    }).join('');
    initIcons();
}

function openModal(productName, price) {
    currentModalProduct = { name: productName, price: price };
    const modal = document.getElementById('invoice-modal');
    const nameEl = document.getElementById('modal-product-name');
    const priceEl = document.getElementById('modal-product-price');
    if (nameEl) nameEl.textContent = productName;
    if (priceEl) priceEl.textContent = formatRupiah(price);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    const form = document.getElementById('invoice-form');
    if (form) form.reset();
    const fileLabel = document.getElementById('file-label');
    if (fileLabel) fileLabel.textContent = 'Klik untuk upload bukti transfer';
    const preview = document.getElementById('file-preview');
    if (preview) preview.classList.add('hidden');
    setTimeout(initIcons, 50);
}

function closeModal() {
    const modal = document.getElementById('invoice-modal');
    if (modal) modal.classList.remove('remove');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
}

function handleFileSelect(input) {
    const file = input.files[0];
    const label = document.getElementById('file-label');
    const preview = document.getElementById('file-preview');
    if (file) {
        if (label) label.textContent = file.name;
        const reader = new FileReader();
        reader.onload = (e) => {
            if (preview) {
                preview.src = e.target.result;
                preview.classList.remove('hidden');
            }
        };
        reader.readAsDataURL(file);
    } else {
        if (label) label.textContent = 'Klik untuk upload bukti transfer';
        if (preview) preview.classList.add('hidden');
    }
}

function initSidebar() {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
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

// --- 9. REGAL CDN GITHUB UPLOAD SYSTEM (SECURE PROXY VIA VERCEL API) ---
async function uploadToMyCDNYuki(file) {
    return new Promise((resolve) => {
        if (!file) return resolve(null);

        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const base64Content = reader.result.split(',')[1];
                
                // Membuat nama file unik
                const timestamp = Date.now();
                const randomStr = Math.random().toString(36).substring(2, 8);
                const fileExt = file.name.split('.').pop() || 'jpg';
                const fileName = `Yuki${timestamp}_${randomStr}.${fileExt}`;

                console.log('[Proxy API] Mengirim data ke repo yuki-chan...');

                // PENTING: Gunakan path relatif agar otomatis mengikuti domain tempat web berada
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        fileName: fileName,
                        base64Content: base64Content
                    })
                });

                if (!response.ok) throw new Error('Server error: ' + response.status);

                const resData = await response.json();
                console.log('[Proxy API] Upload Berhasil!');
                
                // Kembalikan URL yang sudah rapi
                resolve(resData.download_url);
            } catch (e) {
                console.error('[Proxy API] Gagal:', e.message);
                resolve(null);
            }
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
    });
}

function openPanelModal(productName, price) {
    currentPanelProduct = { name: productName, price };
    document.getElementById('panel-product-name').textContent = productName;
    document.getElementById('panel-product-price').textContent = formatRupiah(price);
    document.getElementById('panel-payment-modal').classList.add('active');
    document.body.style.overflow = 'hidden';
    document.getElementById('panel-payment-form').classList.remove('hidden');
    document.getElementById('panel-qris-display').classList.add('hidden');
    document.getElementById('auto-payment-form').reset();
    document.getElementById('ap-success').classList.add('hidden');
    if (paymentCheckInterval) clearInterval(paymentCheckInterval);
    if (countdownInterval) clearInterval(countdownInterval);
    initIcons();
}

function closePanelModal() {
    document.getElementById('panel-payment-modal').classList.remove('active');
    document.body.style.overflow = '';
    if (paymentCheckInterval) clearInterval(paymentCheckInterval);
    if (countdownInterval) clearInterval(countdownInterval);
}

function startCountdown(minutes) {
    let seconds = minutes * 60;
    const el = document.getElementById('ap-countdown');
    el.classList.remove('text-red-500');
    countdownInterval = setInterval(() => {
        seconds--;
        if (seconds <= 0) {
            clearInterval(countdownInterval);
            el.textContent = "Expired";
            el.classList.add('text-red-500');
            return;
        }
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        el.textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
    }, 1000);
}

function startPaymentPolling(referenceId) {
    const MAX_ATTEMPTS = 120;
    let attempts = 0;

    paymentCheckInterval = setInterval(async () => {
        attempts++;
        try {
            const res = await fetch(`/api/check-payment?ref=${referenceId}`);

            if (res.status === 404) {
                clearInterval(paymentCheckInterval);
                clearInterval(countdownInterval);
                showToast('Gagal', 'Transaksi tidak ditemukan. Silakan hubungi admin jika saldo sudah terpotong.', 'error');
                return;
            }

            const data = await res.json();
            if (data.status === 'completed') {
                clearInterval(paymentCheckInterval);
                clearInterval(countdownInterval);
                document.getElementById('ap-success').classList.remove('hidden');
                showToast('Sukses', 'Pembayaran berhasil! Server sedang dibuat.', 'success');
            } else if (data.status === 'failed') {
                clearInterval(paymentCheckInterval);
                showToast('Gagal', 'Terjadi kesalahan saat membuat server.', 'error');
            } else if (attempts >= MAX_ATTEMPTS) {
                clearInterval(paymentCheckInterval);
                showToast('Waktu Habis', 'Belum ada konfirmasi pembayaran. Kalau sudah bayar, hubungi admin dengan menyertakan reference ID.', 'error');
            }
        } catch (e) {
            console.error('Polling error:', e);
            if (attempts >= MAX_ATTEMPTS) {
                clearInterval(paymentCheckInterval);
                showToast('Gagal', 'Gagal memeriksa status pembayaran berkali-kali. Silakan refresh halaman.', 'error');
            }
        }
    }, 5000);
}

function initAutoPaymentForm() {
    const form = document.getElementById('auto-payment-form');
    if (!form) return;

    // Add username validation on blur
    const usernameInput = document.getElementById('ap-username');
    if (usernameInput) {
        usernameInput.addEventListener('blur', async () => {
            const username = usernameInput.value.trim();
            if (!username) return;

            usernameInput.classList.remove('border-red-300', 'border-emerald-300');

            try {
                const res = await fetch(`/api/admin?action=check-username&username=${encodeURIComponent(username)}`);
                const data = await res.json();
                if (data.exists) {
                    usernameInput.classList.add('border-red-300');
                    showToast('Peringatan', `Username "${username}" sudah terdaftar. Silakan ganti username lain.`, 'error');
                } else {
                    usernameInput.classList.add('border-emerald-300');
                }
            } catch (e) {}
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('ap-submit-btn');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '⏳ Memproses...';

        const username = document.getElementById('ap-username').value.trim();

        // Double check username before submitting
        try {
            const checkRes = await fetch(`/api/admin?action=check-username&username=${encodeURIComponent(username)}`);
            const checkData = await checkRes.json();
            if (checkData.exists) {
                btn.disabled = false;
                btn.innerHTML = originalText;
                showToast('Gagal', `Username "${username}" sudah terdaftar di panel. Silakan gunakan username lain.`, 'error');
                return;
            }
        } catch (e) {}

        const payload = {
            productName: currentPanelProduct.name,
            price: currentPanelProduct.price,
            buyerName: document.getElementById('ap-name').value.trim(),
            buyerWa: document.getElementById('ap-wa').value.trim(),
            panelUsername: username,
            panelEmail: document.getElementById('ap-email').value.trim()
        };

        try {
            const res = await fetch('/api/payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!data.success) {
                if (data.duplicate) {
                    throw new Error(data.error || 'Username sudah terdaftar');
                }
                throw new Error(data.detail || data.error || 'Gagal membuat pembayaran');
            }

            document.getElementById('panel-payment-form').classList.add('hidden');
            document.getElementById('panel-qris-display').classList.remove('hidden');
            document.getElementById('ap-qr-image').src = data.qrImage || '';
            startCountdown(10);
            startPaymentPolling(data.referenceId);
            showToast('QRIS Generated', 'Silakan scan QRIS untuk pembayaran', 'success');
        } catch (err) {
            showToast('Error', err.message, 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    });
}

// --- 10. INVOICE FORM HANDLING & WHATSAPP REDIRECT ---
function initInvoiceForm() {
    const form = document.getElementById('invoice-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const buyerName = document.getElementById('buyer-name').value.trim();
        const buyerWa = document.getElementById('buyer-wa').value.trim();
        const proofFile = document.getElementById('buyer-proof').files[0];

        if (!buyerName) { showToast('Error', 'Nama pembeli wajib diisi!', 'error'); return; }
        if (!buyerWa) { showToast('Error', 'Nomor WhatsApp wajib diisi!', 'error'); return; }
        if (!proofFile) { showToast('Error', 'Silakan upload bukti transfer!', 'error'); return; }

        if (proofFile.size > 5 * 1024 * 1024) {
            showToast('Error', 'Ukuran gambar terlalu besar! Maksimal 5MB.', 'error');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Kirim Bukti Pembayaran';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '⏳ Memproses...';
        }

        showToast('Proses', 'Sedang mengunggah bukti transfer ke repo...', 'success');

        let cdnLink = null;
        let uploadError = null;

        try {
            cdnLink = await uploadToMyCDNYuki(proofFile);
        } catch (cdnError) {
            console.error('[Form] Upload error:', cdnError);
            uploadError = cdnError.message;
        }

        let textMessage = '🛒 *ORDER BARU - YUKI STORE*\n\n' +
                          '📦 *Produk:* ' + currentModalProduct.name + '\n' +
                          '💰 *Harga:* ' + formatRupiah(currentModalProduct.price) + '\n' +
                          '👤 *Nama:* ' + buyerName + '\n' +
                          '📱 *WhatsApp:* ' + buyerWa + '\n\n';

        if (cdnLink) {
            textMessage += '🖼️ *BUKTI TRANSFER:*\n' + cdnLink + '\n\n' +
                           '✅ *Bukti telah berhasil dihost di Regal Store CDN.*';
        } else {
            textMessage += '⚠️ *BUKTI TRANSFER:*\n' +
                           '_(Upload otomatis gagal: ' + (uploadError || 'Network/Auth Token') + ')_\n' +
                           'Mohon lampirkan bukti transfer langsung di chat ini ya kak!';
        }

        textMessage += '\n\nMohon segera diproses ya kak! 🙏';

        const phone = '6288246387665';
        const encodedText = encodeURIComponent(textMessage);
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }

        closeModal();

        if (isMobile) {
            const deepLink = `whatsapp://send?phone=${phone}&text=${encodedText}`;
            window.location.href = deepLink;
            setTimeout(() => {
                if (document.hidden) return;
                window.location.href = `https://api.whatsapp.com/send?phone=${phone}&text=${encodedText}`;
            }, 2000);
        } else {
            window.open(`https://web.whatsapp.com/send?phone=${phone}&text=${encodedText}`, '_blank');
        }
    });
}

function showToast(title, message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastTitle = document.getElementById('toast-title');
    const toastMessage = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');
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

// --- 11. MUSIC SEARCH & TRACK PREVIEW DETAILS ---
function openTrackDetail(track) {
    currentTrackData = track;
    let modal = document.getElementById('track-detail');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'track-detail';
        modal.className = 'td-overlay';
        modal.innerHTML = `
            <div class="td-backdrop" onclick="closeTrackDetail()"></div>
            <div class="td-card">
                <button class="td-close" onclick="closeTrackDetail()">${IC_CLOSE}</button>
                <div class="td-cover-wrap">
                    <img id="td-cover" class="td-cover" src="" alt="Cover" onerror="this.style.display='none'">
                    <div class="td-cover-overlay"></div>
                </div>
                <div class="td-body">
                    <div id="td-title" class="td-title"></div>
                    <div id="td-artist" class="td-artist"></div>
                    <div class="td-details">
                        <div class="td-detail-item">
                            <div style="display:flex;flex-direction:column;gap:2px;">
                                <div class="td-detail-label">Durasi</div>
                                <div id="td-dur" class="td-detail-value" style="display:flex;align-items:center;gap:4px;">${IC_CLOCK}<span></span></div>
                            </div>
                        </div>
                        <div class="td-detail-item">
                            <div style="display:flex;flex-direction:column;gap:2px;">
                                <div class="td-detail-label">Album</div>
                                <div id="td-album" class="td-detail-value" style="display:flex;align-items:center;gap:4px;">${IC_DISC}<span></span></div>
                            </div>
                        </div>
                        <div class="td-detail-item">
                            <div style="display:flex;flex-direction:column;gap:2px;">
                                <div class="td-detail-label">Genre</div>
                                <div id="td-genre" class="td-detail-value" style="display:flex;align-items:center;gap:4px;">${IC_MUSIC}<span></span></div>
                            </div>
                        </div>
                        <div class="td-detail-item">
                            <div style="display:flex;flex-direction:column;gap:2px;">
                                <div class="td-detail-label">Sumber</div>
                                <div class="td-detail-value" style="display:flex;align-items:center;gap:4px;">${SPOTIFY_LOGO}<span>iTunes</span></div>
                            </div>
                        </div>
                    </div>
                    <div class="td-playbar">
                        <button id="td-btn-play" class="td-btn-play" onclick="toggleDetailPlay()">
                            <span id="td-icon">${IC_PLAY}</span>
                            <span id="td-text">Putar Preview</span>
                        </button>
                        <button class="td-btn-spotify" onclick="window.open('https://www.google.com/search?q=' + encodeURIComponent(currentTrackData.title + ' ' + currentTrackData.artist), '_blank')">
                            ${IC_EXTERNAL} Cari
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    document.getElementById('td-cover').src = track.image || '';
    document.getElementById('td-title').textContent = track.title || 'Unknown Title';
    document.getElementById('td-artist').textContent = track.artist || 'Unknown Artist';
    document.getElementById('td-dur').querySelector('span').textContent = track.duration || '0:00';
    document.getElementById('td-album').querySelector('span').textContent = track.album || '-';
    document.getElementById('td-genre').querySelector('span').textContent = track.genre || 'Music';

    updateDetailPlayState();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeTrackDetail() {
    const modal = document.getElementById('track-detail');
    if (modal) modal.classList.remove('active');
    if (!document.getElementById('invoice-modal')?.classList.contains('active')) {
        document.body.style.overflow = '';
    }
}

function updateDetailPlayState() {
    const isThis = currentTrackData && isPlaying && currentAudioUrl === currentTrackData.url;
    const icon = document.getElementById('td-icon');
    const text = document.getElementById('td-text');
    if (icon) icon.innerHTML = isThis ? IC_PAUSE : IC_PLAY;
    if (text) text.textContent = isThis ? 'Jeda' : 'Putar Preview';
}

function toggleDetailPlay() {
    if (!currentTrackData) return;
    if (!currentTrackData.url) {
        showToast('Info', 'Preview tidak tersedia', 'error'); return;
    }
    const isThis = isPlaying && currentAudioUrl === currentTrackData.url;
    if (isThis) {
        pauseAudio();
    } else {
        playSpotify(currentTrackData.url, currentTrackData.title, currentTrackData.artist, currentTrackData.image);
    }
    updateDetailPlayState();
}

function initSpotify() {
    const h = document.getElementById('spotify-header');
    if (h) h.innerHTML = `${SPOTIFY_LOGO} <span style="margin-left:8px;font-weight:700;color:#0f172a;font-size:1.1rem;">Music Search</span>`;

    const form = document.getElementById('spotify-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const q = document.getElementById('spotify-query').value.trim();
        if (!q) return;
        await searchSpotify(q);
    });
}

async function searchSpotify(query) {
    const loading = document.getElementById('spotify-loading');
    const results = document.getElementById('spotify-results');
    if (loading) loading.classList.remove('hidden');
    if (results) results.innerHTML = '';

    let tracks = [];
    let success = false;

    try {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 10000);
        const res = await fetch('https://itunes.apple.com/search?term=' + encodeURIComponent(query) + '&entity=song&limit=12', { signal: ctrl.signal });
        clearTimeout(tid);
        if (res.ok) {
            const data = await res.json();
            if (data?.results?.length) {
                tracks = data.results.map(item => ({
                    title: item.trackName || 'Unknown',
                    artist: item.artistName || 'Unknown',
                    album: item.collectionName || '-',
                    image: (item.artworkUrl100 || '').replace('100x100bb', '600x600bb'),
                    thumb: (item.artworkUrl100 || '').replace('100x100bb', '300x300bb'),
                    url: item.previewUrl || '',
                    duration: formatDuration(item.trackTimeMillis),
                    durationMs: item.trackTimeMillis || 0,
                    genre: item.primaryGenreName || 'Music'
                }));
                success = true;
            }
        }
    } catch (e) { console.log('iTunes fail', e.message); }

    if (!success) {
        try {
            const ctrl = new AbortController();
            const tid = setTimeout(() => ctrl.abort(), 10000);
            const res = await fetch('https://api.deezer.com/search?q=' + encodeURIComponent(query) + '&limit=12', { signal: ctrl.signal });
            clearTimeout(tid);
            if (res.ok) {
                const data = await res.json();
                if (data?.data?.length) {
                    tracks = data.data.map(item => ({
                        title: item.title || 'Unknown',
                        artist: item.artist?.name || 'Unknown',
                        album: item.album?.title || '-',
                        image: item.album?.cover_big || item.album?.cover_xl || item.album?.cover || '',
                        thumb: item.album?.cover_big || item.album?.cover || '',
                        url: item.preview || '',
                        duration: formatDuration((item.duration || 0) * 1000),
                        durationMs: (item.duration || 0) * 1000,
                        genre: 'Music'
                    }));
                    success = true;
                }
            }
        } catch (e) { console.log('Deezer fail', e.message); }
    }

    if (loading) loading.classList.add('hidden');

    if (!success || !tracks.length) {
        if (results) results.innerHTML = errorHTML('Tidak ada hasil. Coba kata kunci lain.');
        return;
    }

    if (results) {
        results.innerHTML = `<div class="track-list">` + tracks.map((track, i) => {
            const hasPreview = !!track.url;
            const tjson = encodeURIComponent(JSON.stringify(track));
            return `
                <div class="track-row" data-id="${track.url}" onclick="openTrackDetailFromString('${tjson}')">
                    <img class="track-thumb" src="${track.thumb || track.image || ''}" alt="" loading="lazy" onerror="this.src='https://via.placeholder.com/300x300/e2e8f0/94a3b8?text=Music'">
                    <div class="track-info">
                        <div class="track-title">${track.title}</div>
                        <div class="track-artist">${track.artist}</div>
                        <div class="track-meta-row">
                            <span class="track-meta">${IC_CLOCK} ${track.duration}</span>
                            <span class="track-meta">${IC_DISC} ${track.album}</span>
                            <span class="track-meta">${IC_MUSIC} ${track.genre}</span>
                        </div>
                    </div>
                    <div class="track-actions">
                        <button class="btn-play-sm" onclick="event.stopPropagation(); quickPlayString('${tjson}')" title="${hasPreview ? 'Putar' : 'No Preview'}">
                            ${hasPreview ? IC_PLAY : IC_INFO}
                        </button>
                        <button class="btn-info-sm" onclick="event.stopPropagation(); openTrackDetailFromString('${tjson}')" title="Detail">
                            ${IC_INFO}
                        </button>
                    </div>
                </div>
            `;
        }).join('') + `</div>`;
    }
}

function openTrackDetailFromString(enc) {
    try { openTrackDetail(JSON.parse(decodeURIComponent(enc))); }
    catch (e) { console.error(e); }
}

function quickPlayString(enc) {
    try {
        const t = JSON.parse(decodeURIComponent(enc));
        if (!t.url) { showToast('Info', 'Preview tidak tersedia', 'error'); return; }
        playSpotify(t.url, t.title, t.artist, t.thumb || t.image);
    } catch (e) { console.error(e); }
}

function errorHTML(msg) {
    return `<div class="text-center py-10"><div class="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-3"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-400"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg></div><p class="text-sm text-slate-400">${msg}</p></div>`;
}

// --- 12. PINTEREST COMPONENT HANDLER ---
function initPinterest() {
    const h = document.getElementById('pinterest-header');
    if (h) h.innerHTML = `${PINTEREST_LOGO} <span style="margin-left:8px;font-weight:700;color:#0f172a;font-size:1.1rem;">Pinterest Search</span>`;

    const form = document.getElementById('pinterest-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const q = document.getElementById('pin-query').value.trim();
        if (!q) return;
        await searchPinterest(q);
    });
}

async function searchPinterest(query) {
    const loading = document.getElementById('pin-loading');
    const results = document.getElementById('pin-results');
    if (loading) loading.classList.remove('hidden');
    if (results) results.innerHTML = '';

    let data = null, success = false;
    const apiUrl = API_CONFIG.base + '/search/pinterest?apikey=' + API_CONFIG.key + '&q=' + encodeURIComponent(query);

    try {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 10000);
        const res = await fetch('https://api.allorigins.win/get?url=' + encodeURIComponent(apiUrl), { signal: ctrl.signal });
        clearTimeout(tid);
        if (res.ok) {
            const raw = await res.json();
            if (raw?.contents) { data = JSON.parse(raw.contents); success = true; }
        }
    } catch (e) { console.log('AllOrigins fail'); }

    if (!success) {
        try {
            const ctrl = new AbortController();
            const tid = setTimeout(() => ctrl.abort(), 10000);
            const res = await fetch('https://corsproxy.io/?url=' + encodeURIComponent(apiUrl), { signal: ctrl.signal });
            clearTimeout(tid);
            if (res.ok) { data = await res.json(); success = true; }
        } catch (e) { console.log('Fallback fail'); }
    }

    if (loading) loading.classList.add('hidden');

    if (!success || !data?.result?.length) {
        if (results) results.innerHTML = errorHTML('Gagal memuat Pinterest. Coba lagi.');
        return;
    }

    const images = data.result.filter(v => typeof v === 'string' && v.startsWith('http')).slice(0, 12);
    if (!images.length) {
        if (results) results.innerHTML = `<div class="text-center py-10"><p class="text-sm text-slate-400">Tidak ada hasil untuk "${query}"</p></div>`;
        return;
    }

    if (results) {
        results.innerHTML = `<div class="pin-grid">` + images.map((img, i) => `
            <div class="pin-card" onclick="window.open('${img}', '_blank')">
                <img src="${img}" alt="Pinterest ${i+1}" loading="lazy" onerror="this.style.display='none'">
                <div class="pin-card-overlay">
                    <div class="pin-btn">
                        ${PINTEREST_LOGO}
                        <span>Buka Gambar</span>
                    </div>
                </div>
            </div>
        `).join('') + `</div>`;
    }
}

// --- 13. AUDIO FREQUENCY VISUALIZER (KICK & SNARE PULSE) ---
function initVisualizer() {
    const player = document.getElementById('audio-player');
    if (!player) return;
    let wrap = document.getElementById('viz-wrap');
    if (!wrap) {
        wrap = document.createElement('div');
        wrap.id = 'viz-wrap';
        wrap.className = 'viz-wrap';
        for (let i = 0; i < 32; i++) {
            const bar = document.createElement('div');
            bar.className = 'viz-bar';
            bar.style.height = '2px';
            wrap.appendChild(bar);
        }
        const closeBtn = document.getElementById('player-close');
        if (closeBtn && closeBtn.parentNode) {
            closeBtn.parentNode.insertBefore(wrap, closeBtn);
        } else {
            player.appendChild(wrap);
        }
    }
}

function setupAudioContext(audio) {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (!analyser) {
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.78;
        analyser.minDecibels = -85;
        analyser.maxDecibels = -25;
    }
    if (!source) {
        source = audioCtx.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
    }
    dataArray = new Uint8Array(analyser.frequencyBinCount);
}

function startVisualizer() {
    if (vizFrameId) cancelAnimationFrame(vizFrameId);
    const bars = document.querySelectorAll('.viz-bar');
    if (!bars.length || !analyser) return;

    function render() {
        if (!isPlaying) {
            bars.forEach(b => { b.style.height = '2px'; b.className = 'viz-bar'; });
            return;
        }
        analyser.getByteFrequencyData(dataArray);

        const binCount = dataArray.length;
        const bassBins = dataArray.slice(0, Math.floor(binCount * 0.08));
        const lowMidBins = dataArray.slice(Math.floor(binCount * 0.08), Math.floor(binCount * 0.18));
        const midBins = dataArray.slice(Math.floor(binCount * 0.18), Math.floor(binCount * 0.40));
        const highBins = dataArray.slice(Math.floor(binCount * 0.40), Math.floor(binCount * 0.70));

        const bassAvg = bassBins.reduce((a, b) => a + b, 0) / bassBins.length / 255;
        const lowMidAvg = lowMidBins.reduce((a, b) => a + b, 0) / lowMidBins.length / 255;

        kickEnergy = Math.max(bassAvg, kickEnergy * kickDecay);
        const kickIntensity = kickEnergy;

        bars.forEach((bar, i) => {
            let value, isKick = false, isSnare = false;
            const ratio = i / 32;

            if (ratio < 0.20) {
                const idx = Math.floor(ratio / 0.20 * bassBins.length);
                value = bassBins[Math.min(idx, bassBins.length - 1)] || 0;
                if (kickIntensity > 0.55 && ratio < 0.10) isKick = true;
            } else if (ratio < 0.40) {
                const idx = Math.floor((ratio - 0.20) / 0.20 * lowMidBins.length);
                value = lowMidBins[Math.min(idx, lowMidBins.length - 1)] || 0;
                if (lowMidAvg > 0.50) isSnare = true;
            } else if (ratio < 0.65) {
                const idx = Math.floor((ratio - 0.40) / 0.25 * midBins.length);
                value = midBins[Math.min(idx, midBins.length - 1)] || 0;
            } else {
                const idx = Math.floor((ratio - 0.65) / 0.35 * highBins.length);
                value = highBins[Math.min(idx, highBins.length - 1)] || 0;
            }

            const percent = (value || 0) / 255;
            let baseHeight = 2;
            if (ratio < 0.20) baseHeight = 2 + percent * 42;
            else if (ratio < 0.40) baseHeight = 2 + percent * 34;
            else if (ratio < 0.65) baseHeight = 2 + percent * 26;
            else baseHeight = 2 + percent * 18;

            bar.style.height = baseHeight + 'px';

            bar.className = 'viz-bar';
            if (isKick) bar.classList.add('kick');
            else if (isSnare) bar.classList.add('snare');
        });

        vizFrameId = requestAnimationFrame(render);
    }
    render();
}

function stopVisualizer() {
    if (vizFrameId) cancelAnimationFrame(vizFrameId);
    kickEnergy = 0;
    document.querySelectorAll('.viz-bar').forEach(b => {
        b.style.height = '2px';
        b.className = 'viz-bar';
    });
}

function pauseAudio() {
    const audio = document.getElementById('audio-element');
    if (audio) audio.pause();
    isPlaying = false;
    stopVisualizer();
    const player = document.getElementById('audio-player');
    if (player) player.classList.add('paused');
    const btn = document.getElementById('player-play');
    if (btn) {
        btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>';
        btn.classList.remove('player-pulse');
    }
    updateDetailPlayState();
    document.querySelectorAll('.track-row .btn-play-sm').forEach(btn => btn.innerHTML = IC_PLAY);
}

function playSpotify(url, title, artist, cover) {
    const player = document.getElementById('audio-player');
    const audio = document.getElementById('audio-element');
    const playBtn = document.getElementById('player-play');
    const titleEl = document.getElementById('player-title');
    const artistEl = document.getElementById('player-artist');
    const coverEl = document.getElementById('player-cover');

    currentAudioUrl = url || '';

    if (titleEl) titleEl.textContent = title || 'Unknown';
    if (artistEl) artistEl.textContent = artist || 'Unknown';
    if (coverEl) { coverEl.src = cover || ''; coverEl.classList.remove('hidden'); }

    if (audio) {
        audio.crossOrigin = 'anonymous';
        if (audio.src !== url) audio.src = url || '';
    }

    initVisualizer();

    if (audio && url) {
        audio.play().then(() => {
            isPlaying = true;
            if (player) player.classList.remove('paused');
            if (playBtn) {
                playBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
                playBtn.classList.add('player-pulse');
            }

            document.querySelectorAll('.track-row').forEach(row => {
                const btn = row.querySelector('.btn-play-sm');
                if (row.getAttribute('data-id') === url) {
                    if (btn) btn.innerHTML = IC_PAUSE;
                } else {
                    if (btn) btn.innerHTML = IC_PLAY;
                }
            });

            try {
                setupAudioContext(audio);
                startVisualizer();
            } catch (e) { console.log('Visualizer error', e); }
        }).catch(() => {
            showToast('Info', 'Preview tidak tersedia', 'error');
        });
    }

    if (player) player.classList.add('show');

    if (playBtn) {
        playBtn.onclick = () => {
            if (!audio) return;
            if (isPlaying) {
                audio.pause();
                isPlaying = false;
                player.classList.add('paused');
                playBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>';
                playBtn.classList.remove('player-pulse');
                stopVisualizer();
                document.querySelectorAll('.track-row .btn-play-sm').forEach(btn => btn.innerHTML = IC_PLAY);
            } else {
                audio.play();
                isPlaying = true;
                player.classList.remove('paused');
                playBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
                playBtn.classList.add('player-pulse');

                document.querySelectorAll('.track-row').forEach(row => {
                    const btn = row.querySelector('.btn-play-sm');
                    if (row.getAttribute('data-id') === url) {
                        if (btn) btn.innerHTML = IC_PAUSE;
                    }
                });

                try {
                    if (audioCtx?.state === 'suspended') audioCtx.resume();
                    startVisualizer();
                } catch (e) {}
            }
            updateDetailPlayState();
        };
    }

    if (audio) audio.onended = () => {
        closePlayer();
        updateDetailPlayState();
    };
    updateDetailPlayState();
    initIcons();
}

function closePlayer() {
    const player = document.getElementById('audio-player');
    const audio = document.getElementById('audio-element');
    if (audio) { audio.pause(); audio.src = ''; }
    isPlaying = false;
    currentAudioUrl = '';
    stopVisualizer();
    if (player) { player.classList.remove('show'); player.classList.add('paused'); }
    const btn = document.getElementById('player-play');
    if (btn) btn.classList.remove('player-pulse');
    updateDetailPlayState();
    document.querySelectorAll('.track-row .btn-play-sm').forEach(btn => btn.innerHTML = IC_PLAY);
}

// --- 14. KEYBOARD & CORE EVENT LISTENERS ---
function initKeyboard() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { closeModal(); closePlayer(); closeTrackDetail(); }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    injectStyles();
    initIcons();
    initSidebar();
    initNavigation();
    initInvoiceForm();
    initAutoPaymentForm();
    initSpotify();
    initPinterest();
    initKeyboard();
    renderPanelProducts();
    navigateTo('dashboard');
});

window.addEventListener('load', () => {
    initIcons();
});

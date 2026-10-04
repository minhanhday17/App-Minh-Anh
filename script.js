(function () {
  'use strict';

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const SESSION_KEY = 'minhanh_session_v1';
  const LOG_KEY     = 'minhanh_keylog_v1';
  const LOG_MAX     = 50;

  let currentSessionKey = '';
  let sessionExpiresAt  = 0;
  let countdownInterval = null;

  const toastEl = $('#toast');
  let toastTimer = null;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1600);
  }

  function haptic() {
    if (navigator.vibrate) navigator.vibrate(15);
  }

  function flash(el) {
    if (!el) return;
    el.classList.remove('v4-flash');
    void el.offsetWidth;
    el.classList.add('v4-flash');
  }

  function attachRipple(el) {
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.style.overflow = 'hidden';
    el.addEventListener('pointerdown', (e) => {
      const rect = el.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top  = (e.clientY - rect.top  - size / 2) + 'px';
      ripple.style.pointerEvents = 'none';
      el.appendChild(ripple);
      setTimeout(() => ripple.remove(), 700);
    });
  }

  function attachPointerGlow(el) {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', ((e.clientX - r.left) / r.width  * 100) + '%');
      el.style.setProperty('--my', ((e.clientY - r.top ) / r.height * 100) + '%');
    });
  }

  function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    const count = 40;
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.width = (Math.random() * 4 + 1) + 'px';
      particle.style.height = particle.style.width;
      particle.style.animationDuration = (Math.random() * 20 + 10) + 's';
      particle.style.animationDelay = (Math.random() * 15) + 's';
      particle.style.opacity = Math.random() * 0.4 + 0.1;
      container.appendChild(particle);
    }
  }

  function loadSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s || !s.key) return null;

      if (!s.perm) {
        if (!s.expiresAt) return null;
        if (Date.now() >= s.expiresAt) {
          localStorage.removeItem(SESSION_KEY);
          return null;
        }
      }
      return s;
    } catch (e) {
      return null;
    }
  }

  function clearSession() {
    try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
  }

  function getKeyLog() {
    try {
      const raw = localStorage.getItem(LOG_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function saveKeyLog(log) {
    try { localStorage.setItem(LOG_KEY, JSON.stringify(log.slice(0, LOG_MAX))); } catch (e) {}
  }

  function addLogEntry(key, typeLabel, isPermanent) {
    const log = getKeyLog();
    const entry = {
      key: String(key || '').trim().toUpperCase(),
      type: typeLabel,
      perm: !!isPermanent,
      loginAt: Date.now(),
      lastSeen: Date.now()
    };
    const idx = log.findIndex(item => item.key === entry.key);
    if (idx >= 0) {
      log[idx].lastSeen = Date.now();
      log[idx].type = typeLabel;
      log[idx].perm = !!isPermanent;
      const [item] = log.splice(idx, 1);
      log.unshift(item);
    } else {
      log.unshift(entry);
    }
    saveKeyLog(log);
  }

  function updateLogLastSeen(key) {
    const log = getKeyLog();
    const k = String(key || '').trim().toUpperCase();
    const idx = log.findIndex(item => item.key === k);
    if (idx >= 0) {
      log[idx].lastSeen = Date.now();
      saveKeyLog(log);
    }
  }

  function fmtTime(ts) {
    const d = new Date(ts);
    const pad = n => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth()+1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function renderKeyLog(currentKey) {
    const list     = $('#logList');
    const empty    = $('#logEmpty');
    const clearBtn = $('#clearLogBtn');
    if (!list) return;

    const log = getKeyLog();
    list.innerHTML = '';

    if (log.length === 0) {
      if (empty) empty.style.display = 'block';
      if (clearBtn) clearBtn.disabled = true;
      return;
    }
    if (empty) empty.style.display = 'none';
    if (clearBtn) clearBtn.disabled = false;

    const now = Date.now();
    const ck = String(currentKey || '').trim().toUpperCase();
    log.forEach(item => {
      const isCurrent = ck && ck === item.key;
      let badgeClass = '';
      let badgeText  = item.type;

      if (item.perm) {
        badgeClass = 'perm';
      } else if (isCurrent && sessionExpiresAt && sessionExpiresAt !== Infinity && sessionExpiresAt <= now) {
        badgeClass = 'expired';
        badgeText  = 'HẾT HẠN';
      }

      const div = document.createElement('div');
      div.className = 'log-item' + (isCurrent ? ' active' : '');
      div.innerHTML = `
        <div class="log-item-top">
          <span class="log-key">${item.key}</span>
          <span class="log-badge ${badgeClass}">${badgeText}</span>
        </div>
        <div class="log-item-bottom">
          <span>ĐĂNG NHẬP: ${fmtTime(item.loginAt)}</span>
          <span>DÙNG GẦN NHẤT: ${fmtTime(item.lastSeen)}</span>
        </div>
      `;
      list.appendChild(div);
    });
  }

  function startCountdown() {
    stopCountdown();
    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);
  }

  function stopCountdown() {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
  }

  function updateCountdown() {
    const box  = $('#countdownBox');
    const text = $('#countdownText');
    if (!box || !text) return;

    if (!sessionExpiresAt || sessionExpiresAt === Infinity) {
      box.classList.remove('warning', 'danger');
      text.textContent = '∞ VĨNH VIỄN';
      return;
    }

    const now = Date.now();
    const remaining = sessionExpiresAt - now;

    if (remaining <= 0) {
      text.textContent = '00:00:00';
      box.classList.remove('warning');
      box.classList.add('danger');
      handleExpired();
      return;
    }

    const totalSec = Math.floor(remaining / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const pad = n => String(n).padStart(2, '0');

    if (h >= 24) {
      const d  = Math.floor(h / 24);
      const rh = h % 24;
      text.textContent = `${d}N ${pad(rh)}:${pad(m)}:${pad(s)}`;
    } else {
      text.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
    }

    box.classList.remove('warning', 'danger');
    if (remaining <= 5 * 60 * 1000) {
      box.classList.add('danger');
    } else if (remaining <= 60 * 60 * 1000) {
      box.classList.add('warning');
    }
  }

  let expiredHandled = false;
  function handleExpired() {
    if (expiredHandled) return;
    expiredHandled = true;
    stopCountdown();
    toast('⛔ Key đã hết hạn, tự động đăng xuất');
    setTimeout(() => {
      clearSession();
      window.location.href = 'login.html';
    }, 1500);
  }

  function updateUserInfo(session) {
    const keyLabel    = $('#userKeyLabel');
    const expireLabel = $('#userExpireLabel');
    if (keyLabel) {
      const k = session.key;
      const masked = k.length > 12 ? k.slice(0, 12) + '****' : k;
      keyLabel.textContent = 'KEY: ' + masked;
    }
    if (expireLabel) {
      if (session.perm) {
        expireLabel.textContent = 'HẠN: VĨNH VIỄN';
      } else {
        const d = new Date(session.expiresAt);
        const pad = n => String(n).padStart(2, '0');
        expireLabel.textContent = `HẠN: ${pad(d.getDate())}/${pad(d.getMonth()+1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
      }
    }
  }

  function applySession(session) {
    currentSessionKey = session.key;
    sessionExpiresAt  = session.perm ? Infinity : session.expiresAt;
    expiredHandled    = false;

    updateUserInfo(session);
    addLogEntry(session.key, session.label, session.perm);
    startCountdown();

    setTimeout(() => toast('👋 Chào mừng đến MINH ANH UI'), 500);
  }

  function handleLogout() {
    clearSession();
    stopCountdown();
    currentSessionKey = '';
    sessionExpiresAt  = 0;
    toast('👋 Đã đăng xuất');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 600);
  }

  function checkAnyToggleOn() {
    //thêm tên ở trong hàm gọi toogle này
    const toggleIds = ['aimlock', 'keotam', 'fixlo', 'giamrung', 'fixgiat', 'dpi'];
    for (let id of toggleIds) {
      const toggle = document.getElementById(id);
      if (toggle && toggle.checked) return true;
    }
    return false;
  }

  function getEnabledBase64() {
    //ở đây cũng thêm tên để toogle được gọi và chạy dữ liệu base 64 vào app ff
    const toggleIds = ['aimlock', 'keotam', 'fixlo', 'giamrung', 'fixgiat', 'dpi'];
    const allBase64 = [];

    for (let id of toggleIds) {
      const toggle = document.getElementById(id);
      if (toggle && toggle.checked) {
        let base64Data = toggle.getAttribute('data-base64');

        if (base64Data) {
          const parts = base64Data.split(/[,|]/);
          parts.forEach(item => {
            const trimmed = item.trim();
            if (trimmed) allBase64.push(trimmed);
          });
        }
      }
    }

    return allBase64;
  }

  function decodeBase64(base64String) {
    try { return atob(base64String); } catch (e) { return base64String; }
  }

  function showToastError(message) {
    const toastErr = document.getElementById('toastError');
    const msg = document.getElementById('errorMessage');
    if (!toastErr || !msg) return;
    msg.textContent = message || 'Vui lòng chọn ít nhất một chức năng!';
    toastErr.classList.add('active');
  }

  function closeToastError() {
    const t = document.getElementById('toastError');
    if (t) t.classList.remove('active');
  }

  function showGameSelect() {
    if (!checkAnyToggleOn()) {
      showToastError('⚠️ Vui lòng chọn ít nhất một chức năng!');
      return;
    }
    const gs = document.getElementById('gameSelect');
    if (gs) gs.classList.add('active');
  }

  function closeGameSelect() {
    const gs = document.getElementById('gameSelect');
    if (gs) gs.classList.remove('active');
  }

  let selectedGame = '';
  let loadingTimeout = null;

  function selectGame(game) {
    selectedGame = game;
    closeGameSelect();
    startLoading();
  }

  function startLoading() {
    const overlay = document.getElementById('loadingOverlay');
    const success = document.getElementById('loadingSuccess');
    const text    = document.getElementById('loadingText');
    const spinner = document.getElementById('loadingSpinner');
    if (!overlay) return;

    overlay.classList.add('active');
    success.classList.remove('active');
    text.style.display = 'block';
    spinner.style.display = 'block';

    if (loadingTimeout) clearTimeout(loadingTimeout);

    const base64Array = getEnabledBase64();
    const decodedArray = base64Array.map(b64 => decodeBase64(b64));

    const payload = encodeURIComponent(JSON.stringify({
      count: base64Array.length,
      enabled: decodedArray,
      base64: base64Array,
      session: currentSessionKey
    }));

    loadingTimeout = setTimeout(() => {
      spinner.style.display = 'none';
      text.style.display = 'none';
      success.classList.add('active');

      loadingTimeout = setTimeout(() => {
        if (selectedGame === 'freefire') {
          window.location.href = `freefire://payload?data=${payload}`;
        } else if (selectedGame === 'freefiremax') {
          window.location.href = `freefiremax://payload?data=${payload}`;
        }
        overlay.classList.remove('active');
      }, 3000);
    }, 5000);
  }

  function initMainApp() {
    const modules = $$('.module');

    modules.forEach((mod, i) => {
      const toggle = $('input[data-toggle]', mod);
      const name   = $('.mod-name', mod)?.textContent || 'Module';

      mod.style.animationDelay = (i * 60) + 'ms';

      const tapLayer = $('.tap-layer', mod);
      tapLayer?.addEventListener('click', () => {
        toggle.checked = !toggle.checked;
        syncModule(mod, toggle, name);
      });

      toggle.addEventListener('change', () => {
        syncModule(mod, toggle, name);
      });

      toggle.addEventListener('click', (e) => e.stopPropagation());

      attachPointerGlow(mod);
    });

    function syncModule(mod, toggle, name) {
      const isOn = toggle.checked;
      mod.classList.toggle('on', isOn);
      toggle.closest('.switch')?.classList.toggle('checked', isOn);
      flash(mod);
      haptic();
      toast((isOn ? '✅ Bật: ' : '⛔ Tắt: ') + name);
      updateApplyState();
    }

    const applyBtn = $('#applyBtn');

    function updateApplyState() {
      if (!applyBtn) return;
      const anyOn = checkAnyToggleOn();
      applyBtn.classList.toggle('has-active', anyOn);
      applyBtn.textContent = anyOn
        ? 'ÁP DỤNG PHIÊN BẢN · ĐANG BẬT'
        : 'ÁP DỤNG PHIÊN BẢN';
    }

    const navs = $$('.nav');
    const panels = {
      home: null,
      monitor: $('#panel-monitor'),
      settings: $('#panel-settings')
    };
    const mainBlocks = $$('.welcome, .section-title, .modules');

    navs.forEach(nav => {
      nav.addEventListener('click', () => {
        navs.forEach(n => n.classList.remove('active'));
        nav.classList.add('active');
        haptic();

        const target = nav.dataset.panel;

        Object.values(panels).forEach(p => p?.classList.remove('show'));
        mainBlocks.forEach(b => b.style.display = '');

        if (target === 'home') {
          toast('🧩 Chức năng');
        } else {
          mainBlocks.forEach(b => b.style.display = 'none');
          panels[target]?.classList.add('show');
          toast(target === 'monitor' ? '📊 Giám sát' : '⚙️ Thiết lập');
          if (target === 'settings') {
            renderKeyLog(currentSessionKey);
          }
        }
      });
    });

    const mCpu = $('#mCpu'), mRam = $('#mRam'), mFps = $('#mFps'), mPing = $('#mPing');
    function updateMonitor() {
      if (mCpu)  mCpu.textContent  = (20 + Math.random() * 40).toFixed(0) + '%';
      if (mRam)  mRam.textContent  = (1.2 + Math.random() * 2).toFixed(2) + ' GB';
      if (mFps)  mFps.textContent  = (55 + Math.random() * 5).toFixed(0) + ' FPS';
      if (mPing) mPing.textContent = (18 + Math.random() * 30).toFixed(0) + ' ms';
    }
    updateMonitor();
    setInterval(updateMonitor, 1500);

    applyBtn?.addEventListener('click', showGameSelect);

    const clearLogBtn = $('#clearLogBtn');
    clearLogBtn?.addEventListener('click', () => {
      if (!confirm('Bạn chắc chắn muốn xóa toàn bộ lịch sử key?')) return;
      localStorage.removeItem(LOG_KEY);
      renderKeyLog(currentSessionKey);
      toast('🗑️ Đã xóa lịch sử key');
      haptic();
    });

    setInterval(() => {
      if (currentSessionKey) updateLogLastSeen(currentSessionKey);
    }, 60 * 1000);

    const logoutBtn = $('#logoutBtn');
    logoutBtn?.addEventListener('click', handleLogout);

    const zaloBtn = $('#zaloBtn');
    zaloBtn?.addEventListener('click', () => {
      window.location.href = 'https://zalo.me/84877446154';
    });

    $$('.apply-btn, .package-option, .nav, .key, .game-select-cancel, .logout-btn, .log-clear-btn').forEach(attachRipple);

    updateApplyState();
  }

  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'Enter') {
      showGameSelect();
    }
    if (e.key === 'Escape') {
      closeGameSelect();
      closeToastError();
    }
  });

  const toastErrEl = document.getElementById('toastError');
  toastErrEl?.addEventListener('click', function(e) {
    if (e.target === this) closeToastError();
  });

  const gameSelectEl = document.getElementById('gameSelect');
  gameSelectEl?.addEventListener('click', function(e) {
    if (e.target === this) closeGameSelect();
  });

  window.selectGame = selectGame;
  window.closeGameSelect = closeGameSelect;
  window.showGameSelect = showGameSelect;
  window.closeToastError = closeToastError;

  function boot() {
    // Kiểm tra session — nếu không có thì đá về login
    const session = loadSession();
    if (!session) {
      window.location.href = 'login.html';
      return;
    }

    createParticles();
    initMainApp();
    applySession(session);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
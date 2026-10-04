(function () {
  'use strict';

  const $  = (sel, root = document) => root.querySelector(sel);

  //key ngày
  const DAY_KEYS = [
    'MINHANH-1DAY-A1B2',
    'MINHANH-1DAY-C3D4',
    'MINHANH-1DAY-E5F6'
  ];





  //key tuần
  const WEEK_KEYS = [
    'MINHANH-1WEEK-G7H8',
    'MINHANH-1WEEK-I9J0'
  ];






  //key tháng
  const MONTH_KEYS = [
    'MINHANH-1MONTH-K1L2',
    'MINHANH-1MONTH-M3N4',
    'MINHANH-1MONTH-O5P6'
  ];






  //key vv
  const PERM_KEYS = [
    'MINHANH-PERM-Q7R8',
    'MINHANH-PERM-S9T0',
    'MINHANH-PERM-ADMIN'
  ];













  const DURATION = {
    day:   24 * 60 * 60 * 1000,
    week:  7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
    perm:  Infinity
  };

  const SESSION_KEY = 'minhanh_session_v1';

  function normalizeKey(k) {
    return String(k || '').trim().toUpperCase();
  }

  function findKeyType(inputKey) {
    const key = normalizeKey(inputKey);
    if (!key) return null;
    if (DAY_KEYS.map(normalizeKey).includes(key))   return { type: 'day',   label: '1 NGÀY',   perm: false };
    if (WEEK_KEYS.map(normalizeKey).includes(key))  return { type: 'week',  label: '1 TUẦN',   perm: false };
    if (MONTH_KEYS.map(normalizeKey).includes(key)) return { type: 'month', label: '1 THÁNG',  perm: false };
    if (PERM_KEYS.map(normalizeKey).includes(key))  return { type: 'perm',  label: 'VĨNH VIỄN', perm: true };
    return null;
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

  function saveSession(key, type, label, isPerm) {
    const now = Date.now();
    const session = {
      key: normalizeKey(key),
      type: type,
      label: label,
      perm: !!isPerm,
      activatedAt: now,
      expiresAt: isPerm ? null : (now + DURATION[type])
    };
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch (e) {}
    return session;
  }

  function handleLogin() {
    const input  = $('#loginKey');
    const errEl  = $('#loginError');
    const btn    = $('#loginBtn');
    if (!input) return;

    const raw = input.value;
    const key = normalizeKey(raw);

    if (!key) {
      input.classList.add('error');
      if (errEl) { errEl.textContent = '⚠️ Vui lòng nhập key'; errEl.classList.add('show'); }
      setTimeout(() => input.classList.remove('error'), 500);
      return;
    }

    const found = findKeyType(key);
    if (!found) {
      input.classList.add('error');
      if (errEl) { errEl.textContent = '❌ Key không hợp lệ hoặc đã hết hạn'; errEl.classList.add('show'); }
      setTimeout(() => input.classList.remove('error'), 500);
      if (navigator.vibrate) navigator.vibrate(15);
      return;
    }

    const existing = loadSession();
    if (existing && existing.key === key) {
      const stillValid = existing.perm || Date.now() < existing.expiresAt;
      if (!stillValid) {
        if (errEl) { errEl.textContent = '⛔ Key đã hết hạn, không thể dùng lại'; errEl.classList.add('show'); }
        input.classList.add('error');
        setTimeout(() => input.classList.remove('error'), 500);
        return;
      }
      window.location.href = 'index.html';
      return;
    }

    if (btn) btn.disabled = true;
    if (errEl) errEl.classList.remove('show');

    saveSession(key, found.type, found.label, found.perm);
    setTimeout(() => {
      if (btn) btn.disabled = false;
      window.location.href = 'index.html';
    }, 500);
  }

  function initLogin() {
    const input   = $('#loginKey');
    const clearBt = $('#loginClear');
    const btn     = $('#loginBtn');

    input?.addEventListener('input', () => {
      if (clearBt) clearBt.classList.toggle('show', input.value.length > 0);
      const errEl = $('#loginError');
      if (errEl) errEl.classList.remove('show');
    });

    clearBt?.addEventListener('click', () => {
      if (input) {
        input.value = '';
        input.focus();
      }
      clearBt.classList.remove('show');
      if (navigator.vibrate) navigator.vibrate(15);
    });

    btn?.addEventListener('click', handleLogin);

    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleLogin();
    });
  }

  function initZaloFloat() {
    const zaloFloat   = $('#zaloFloat');
    const zaloTooltip = $('#zaloTooltip');
    if (!zaloFloat) return;

    let hideTimer = null;

    // Bấm vào icon → mở Zalo
    zaloFloat.addEventListener('click', () => {
      if (navigator.vibrate) navigator.vibrate(15);
      window.location.href = 'https://zalo.me/84877446154';
    });

    // Tự động hiện tooltip 1 lần khi vào trang
    setTimeout(() => {
      zaloFloat.classList.add('show-tooltip');
      hideTimer = setTimeout(() => {
        zaloFloat.classList.remove('show-tooltip');
      }, 4000);
    }, 1200);

    // Hover (PC) → hiện tooltip
    zaloFloat.addEventListener('mouseenter', () => {
      clearTimeout(hideTimer);
      zaloFloat.classList.add('show-tooltip');
    });
    zaloFloat.addEventListener('mouseleave', () => {
      zaloFloat.classList.remove('show-tooltip');
    });
  }

  function boot() {
    // Nếu đã có session hợp lệ → vào thẳng index
    const session = loadSession();
    if (session) {
      window.location.href = 'index.html';
      return;
    }
    initLogin();
    initZaloFloat();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
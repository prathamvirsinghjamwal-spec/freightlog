/* Freight Log PWA - app logic */
(function () {
  'use strict';

  const STORAGE_KEY = 'freight-entries-v1';
  const $ = (id) => document.getElementById(id);

  let entries = [];
  let editingId = null;
  let statsMonth = (() => { const d = new Date(); d.setDate(1); return d; })();
  let currentTab = 'entries';

  // ---------- Storage ----------
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      entries = raw ? JSON.parse(raw) : [];
    } catch (e) {
      entries = [];
    }
  }
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (e) {
      toast('Storage error');
    }
  }

  // ---------- Helpers ----------
  const monthKey = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  const monthName = (d) => d.toLocaleString(undefined, { month: 'long', year: 'numeric' });
  const fmtMoney = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
  const todayIso = () => new Date().toISOString().slice(0, 10);
  const uid = () => 'e_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
    );
  }

  function formatShortDate(iso) {
    try {
      const d = new Date(iso + 'T00:00:00');
      return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
    } catch (e) {
      return iso;
    }
  }

  function toast(msg) {
    const el = $('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('show'), 1800);
  }

  // ---------- Switch widget ----------
  function setSwitch(el, on) {
    el.classList.toggle('on', on);
    el.setAttribute('aria-checked', on ? 'true' : 'false');
    el.dataset.on = on ? '1' : '0';
  }
  function getSwitch(el) {
    return el.dataset.on === '1';
  }

  // ---------- Tabs ----------
  function setTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab').forEach((t) => {
      t.classList.toggle('active', t.dataset.tab === tab);
    });
    $('page-entries').classList.toggle('hidden', tab !== 'entries');
    $('page-stats').classList.toggle('hidden', tab !== 'stats');
    $('fab-add').style.display = tab === 'entries' ? 'inline-flex' : 'none';
    if (tab === 'stats') renderStats();
  }

  // ---------- Modal ----------
  function openModal(id) {
    editingId = id;
    $('modal-title').textContent = id ? 'Edit Entry' : 'Add Entry';
    $('delete-btn').style.display = id ? 'inline-flex' : 'none';

    if (id) {
      const e = entries.find((x) => x.id === id);
      if (!e) return;
      $('f-date').value = e.date;
      $('f-transporter').value = e.transporter;
      $('f-receiver').value = e.receiver;
      $('f-nags').value = e.nags || '';
      $('f-pheras').value = e.pheras || '';
      $('f-amount').value = e.amount || '';
      setSwitch($('paid-switch'), !!e.paid);
    } else {
      $('f-date').value = todayIso();
      $('f-transporter').value = '';
      $('f-receiver').value = '';
      $('f-nags').value = '';
      $('f-pheras').value = '';
      $('f-amount').value = '';
      setSwitch($('paid-switch'), false);
    }

    $('modal-backdrop').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    $('modal-backdrop').classList.remove('open');
    document.body.style.overflow = '';
    editingId = null;
  }

  function saveEntry() {
    const transporter = $('f-transporter').value.trim();
    const receiver = $('f-receiver').value.trim();
    if (!transporter || !receiver) {
      toast('Enter transporter and receiver');
      return;
    }
    const data = {
      id: editingId || uid(),
      date: $('f-date').value || todayIso(),
      transporter,
      receiver,
      nags: parseInt($('f-nags').value, 10) || 0,
      pheras: parseInt($('f-pheras').value, 10) || 0,
      amount: parseFloat($('f-amount').value) || 0,
      paid: getSwitch($('paid-switch')),
    };
    if (editingId) {
      entries = entries.map((e) => (e.id === editingId ? data : e));
      toast('Entry updated');
    } else {
      entries.push(data);
      toast('Entry saved');
    }
    save();
    closeModal();
    render();
  }

  function deleteEntry() {
    if (!editingId) return;
    if (!confirm('Delete this entry? This action cannot be undone.')) return;
    entries = entries.filter((e) => e.id !== editingId);
    save();
    closeModal();
    render();
    toast('Entry deleted');
  }

  function togglePaid(id) {
    const e = entries.find((x) => x.id === id);
    if (!e) return;
    e.paid = !e.paid;
    save();
    render();
  }

  // ---------- Render entries ----------
  function getFiltered() {
    const q = $('search-input').value.trim().toLowerCase();
    const f = $('filter-select').value;
    return entries
      .filter((e) => {
        if (q && !e.transporter.toLowerCase().includes(q) && !e.receiver.toLowerCase().includes(q)) return false;
        if (f === 'paid' && !e.paid) return false;
        if (f === 'unpaid' && e.paid) return false;
        return true;
      })
      .sort((a, b) => (b.date.localeCompare(a.date) || b.id.localeCompare(a.id)));
  }

  function render() {
    const list = $('entries-list');
    const filtered = getFiltered();
    list.innerHTML = '';
    $('empty-state').style.display = entries.length === 0 ? 'block' : 'none';
    $('header-sub').textContent = entries.length + ' total entries';

    const frag = document.createDocumentFragment();
    filtered.forEach((e) => {
      const card = document.createElement('div');
      card.className = 'entry-card';
      card.innerHTML = `
        <div class="entry-top" data-edit-id="${e.id}">
          <div class="entry-info">
            <p class="entry-transporter">${escapeHtml(e.transporter)}</p>
            <p class="entry-receiver">→ ${escapeHtml(e.receiver)}</p>
          </div>
          <p class="entry-amount">${fmtMoney(e.amount)}</p>
        </div>
        <div class="entry-divider"></div>
        <div class="entry-meta">
          <span class="entry-meta-item">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5C3.89 3 3 3.9 3 5v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/></svg>
            ${formatShortDate(e.date)}
          </span>
          <span class="entry-meta-item">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.12-.36.18-.57.18s-.41-.06-.57-.18l-7.9-4.44A1.01 1.01 0 0 1 3 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.16-.12.36-.18.57-.18s.41.06.57.18l7.9 4.44c.32.17.53.5.53.88v9z"/></svg>
            ${e.nags}
          </span>
          <span class="entry-meta-item">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
            ${e.pheras}
          </span>
          <div class="entry-paid-section">
            <span class="entry-paid-label ${e.paid ? 'paid' : 'unpaid'}">${e.paid ? 'Paid' : 'Unpaid'}</span>
            <div class="switch ${e.paid ? 'on' : ''}" data-toggle-id="${e.id}" role="switch" aria-checked="${e.paid}" tabindex="0">
              <div class="switch-track"></div>
              <div class="switch-thumb"></div>
            </div>
          </div>
        </div>
      `;
      frag.appendChild(card);
    });
    list.appendChild(frag);
  }

  // ---------- Render stats ----------
  function renderStats() {
    $('current-month').textContent = monthName(statsMonth);
    const key = monthKey(statsMonth);
    const monthEntries = entries.filter((e) => e.date.startsWith(key));

    const totalPheras = monthEntries.reduce((s, e) => s + e.pheras, 0);
    const totalNags = monthEntries.reduce((s, e) => s + e.nags, 0);
    const paidCount = monthEntries.filter((e) => e.paid).length;

    $('stat-trips').textContent = monthEntries.length.toLocaleString('en-IN');
    $('stat-pheras').textContent = totalPheras.toLocaleString('en-IN');
    $('stat-nags').textContent = totalNags.toLocaleString('en-IN');
    $('stat-paid').textContent = paidCount + ' / ' + monthEntries.length;

    renderDailyChart(monthEntries);
    renderTopTransporters(monthEntries);
  }

  function renderDailyChart(monthEntries) {
    const barsEl = $('chart-bars');
    const axisEl = $('chart-axis');
    const emptyEl = $('chart-empty');

    if (monthEntries.length === 0) {
      barsEl.innerHTML = '';
      axisEl.innerHTML = '';
      emptyEl.style.display = 'block';
      return;
    }
    emptyEl.style.display = 'none';

    // Days in current stats month
    const year = statsMonth.getFullYear();
    const month = statsMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daily = new Array(daysInMonth + 1).fill(0); // 1-indexed

    monthEntries.forEach((e) => {
      const d = parseInt(e.date.slice(-2), 10);
      if (d >= 1 && d <= daysInMonth) daily[d] = (daily[d] || 0) + 1;
    });

    const max = Math.max.apply(null, daily) || 1;
    barsEl.innerHTML = '';
    for (let d = 1; d <= daysInMonth; d++) {
      const bar = document.createElement('div');
      bar.className = 'chart-bar';
      const h = daily[d] === 0 ? 2 : Math.max(8, Math.round((daily[d] / max) * 100));
      bar.style.height = h + '%';
      bar.style.opacity = daily[d] === 0 ? '0.15' : '0.85';
      bar.title = 'Day ' + d + ': ' + daily[d] + ' trips';
      barsEl.appendChild(bar);
    }
    axisEl.innerHTML = '<span>1</span><span>' + Math.ceil(daysInMonth / 2) + '</span><span>' + daysInMonth + '</span>';
  }

  function renderTopTransporters(monthEntries) {
    const container = $('top-transporters');
    const emptyEl = $('top-empty');
    const map = {};
    monthEntries.forEach((e) => {
      map[e.transporter] = (map[e.transporter] || 0) + 1;
    });
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
    container.innerHTML = '';
    if (sorted.length === 0) {
      emptyEl.style.display = 'block';
      return;
    }
    emptyEl.style.display = 'none';
    const maxVal = sorted[0][1];
    sorted.forEach(([name, val]) => {
      const item = document.createElement('div');
      item.className = 'top-item';
      item.innerHTML = `
        <div class="top-item-row">
          <span>${escapeHtml(name)}</span>
          <span>${val} trip${val === 1 ? '' : 's'}</span>
        </div>
        <div class="top-item-bar">
          <div class="top-item-bar-fill" style="width:${Math.round((val / maxVal) * 100)}%"></div>
        </div>
      `;
      container.appendChild(item);
    });
  }

  // ---------- Event wiring ----------
  function bind() {
    document.querySelectorAll('.tab').forEach((t) => {
      t.addEventListener('click', () => setTab(t.dataset.tab));
    });

    $('fab-add').addEventListener('click', () => openModal(null));
    $('modal-close').addEventListener('click', closeModal);
    $('save-btn').addEventListener('click', saveEntry);
    $('delete-btn').addEventListener('click', deleteEntry);

    // Tap outside modal to close
    $('modal-backdrop').addEventListener('click', (ev) => {
      if (ev.target.id === 'modal-backdrop') closeModal();
    });

    // Modal switch
    const paidSwitch = $('paid-switch');
    paidSwitch.addEventListener('click', () => setSwitch(paidSwitch, !getSwitch(paidSwitch)));
    paidSwitch.addEventListener('keydown', (ev) => {
      if (ev.key === ' ' || ev.key === 'Enter') {
        ev.preventDefault();
        setSwitch(paidSwitch, !getSwitch(paidSwitch));
      }
    });

    // Card-level: edit on top click, toggle on switch click
    $('entries-list').addEventListener('click', (ev) => {
      const toggle = ev.target.closest('[data-toggle-id]');
      if (toggle) {
        ev.stopPropagation();
        togglePaid(toggle.dataset.toggleId);
        return;
      }
      const editEl = ev.target.closest('[data-edit-id]');
      if (editEl) openModal(editEl.dataset.editId);
    });

    $('search-input').addEventListener('input', render);
    $('filter-select').addEventListener('change', render);

    $('prev-month').addEventListener('click', () => {
      statsMonth.setMonth(statsMonth.getMonth() - 1);
      renderStats();
    });
    $('next-month').addEventListener('click', () => {
      statsMonth.setMonth(statsMonth.getMonth() + 1);
      renderStats();
    });

    // Escape closes modal
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' && $('modal-backdrop').classList.contains('open')) closeModal();
    });
  }

  // ---------- PWA install ----------
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (!localStorage.getItem('install-dismissed')) {
      $('install-banner').classList.add('show');
    }
  });
  $('install-btn').addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    $('install-banner').classList.remove('show');
  });
  $('install-dismiss').addEventListener('click', () => {
    localStorage.setItem('install-dismissed', '1');
    $('install-banner').classList.remove('show');
  });
  window.addEventListener('appinstalled', () => {
    $('install-banner').classList.remove('show');
    toast('App installed');
  });

  // ---------- Service worker ----------
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => { /* ignore */ });
    });
  }

  // ---------- Boot ----------
  load();
  bind();
  setTab('entries');
  render();
})();

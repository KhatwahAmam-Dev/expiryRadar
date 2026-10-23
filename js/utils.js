import { BUFFER_HARI, DEFAULT_RH } from './config.js';

export function toast(msg, ms = 2200) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), ms);
}

export function showModal({ title, body, actions }) {
  const root = document.getElementById('modalRoot');
  root.innerHTML = '';
  const bg = document.createElement('div');
  bg.className = 'modal-bg';
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `<h3>${title}</h3><div class="modal-body">${body || ''}</div>`;
  const act = document.createElement('div');
  act.className = 'actions';
  actions.forEach((a) => {
    const b = document.createElement('button');
    b.className = 'btn ' + (a.class || 'btn-gray');
    b.textContent = a.label;
    b.style.flex = '1';
    b.onclick = () => { a.onClick && a.onClick(); closeModal(); };
    act.appendChild(b);
  });
  modal.appendChild(act);
  bg.appendChild(modal);
  root.appendChild(bg);
  setTimeout(() => {
    const first = modal.querySelector('input,select,textarea');
    if (first) first.focus();
  }, 50);
  return modal;
}

export function closeModal() {
  document.getElementById('modalRoot').innerHTML = '';
}

export function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function escapeJs(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

export function sanitize(s) {
  return String(s).replace(/[^a-z0-9_-]/gi, '_');
}

export function formatTanggal(iso) {
  if (!iso) return '-';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function parseRH(returH) {
  if (returH === null || returH === undefined) return DEFAULT_RH;
  const m = String(returH).match(/(\d+)/);
  if (!m) return DEFAULT_RH;
  const n = parseInt(m[1], 10);
  return n > 0 ? n : DEFAULT_RH;
}

export function hitungTanggalTarik(expDateStr, rhNum) {
  if (!expDateStr) return null;
  if (!rhNum) rhNum = DEFAULT_RH;
  const total = rhNum + BUFFER_HARI;
  const d = new Date(expDateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return null;
  d.setDate(d.getDate() - total);
  return d.toISOString().slice(0, 10);
}

export function cekStatusTarik(tglTarik) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const t = new Date(tglTarik + 'T00:00:00');
  const diff = Math.round((t - today) / 86400000);
  if (diff < 0) return { label: `LEWAT ${Math.abs(diff)} hari · SEGERA RETUR`, cls: 'badge-danger', color: '#991b1b' };
  if (diff <= 30) return { label: `Retur dalam ${diff} hari`, cls: 'badge-warn', color: '#9a3412' };
  return { label: `Aman (${diff} hari lagi)`, cls: 'badge-ok', color: '#166534' };
}

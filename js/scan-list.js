import { cekStatusTarik, formatTanggal, escapeHtml, toast, showModal } from './utils.js';
import { idbPut, idbDelete } from './db.js';

export function renderScanList(state) {
  const list = document.getElementById('scanList');
  const empty = document.getElementById('emptyScan');
  const count = document.getElementById('countScan');

  count.textContent = state.scanResults.length + ' item';

  if (!state.scanResults.length) {
    empty.classList.remove('hidden');
    list.innerHTML = '';
    return;
  }
  empty.classList.add('hidden');

  list.innerHTML = state.scanResults.map(r => {
    const status = r.tarikDate ? cekStatusTarik(r.tarikDate) : { label: 'Tanpa R_H', cls: 'badge-warn' };
    return `
      <div class="scan-item">
        <div class="row1">
          <div class="title">${escapeHtml(r.descp)}</div>
          <div class="qty">x${r.qty}</div>
        </div>
        <div class="sub">Barcode: <b>${escapeHtml(r.barcode)}</b> · PLU: <b>${escapeHtml(r.plu)}</b></div>
        <div class="sub">Rak: <b>${escapeHtml(r.rak)}</b> · Shelving: <b>${escapeHtml(r.shelving)}</b></div>
        <div class="sub">Exp: <b>${formatTanggal(r.expDate)}</b> · Tarik: <b>${r.tarikDate ? formatTanggal(r.tarikDate) : '-'}</b></div>
        <div class="sub">R_H: <b>${escapeHtml(r.retur_h || '-')}</b></div>
        <span class="badge ${status.cls}">${status.label}</span>
        <div class="actions">
          <button class="btn btn-gray" data-edit="${r.id}">Edit</button>
          <button class="btn btn-red" data-del="${r.id}">Hapus</button>
        </div>
      </div>
    `;
  }).join('');

  list.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => editRecord(btn.dataset.edit, state));
  });
  list.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', () => deleteRecord(btn.dataset.del, state));
  });
}

function deleteRecord(id, state) {
  if (!confirm('Hapus data ini?')) return;
  state.scanResults = state.scanResults.filter(r => r.id !== id);
  idbDelete('scans', id).catch(() => {});
  renderScanList(state);
}

function editRecord(id, state) {
  const r = state.scanResults.find(x => x.id === id);
  if (!r) return;

  showModal({
    title: 'Edit Data',
    body: `
      <div style="margin-bottom:8px;">
        <label style="font-size:12px;font-weight:600;color:#475569;">Qty</label>
        <input id="editQty" type="number" min="1" value="${r.qty}" style="width:100%;padding:11px;border:1px solid #e2e8f0;border-radius:10px;font-size:15px;" />
      </div>
      <div>
        <label style="font-size:12px;font-weight:600;color:#475569;">Tanggal Expired</label>
        <input id="editExp" type="date" value="${r.expDate}" style="width:100%;padding:11px;border:1px solid #e2e8f0;border-radius:10px;font-size:15px;" />
      </div>
    `,
    actions: [
      { label: 'Batal', class: 'btn-gray' },
      {
        label: 'Simpan', class: 'btn-green', onClick: async () => {
          const q = parseInt(document.getElementById('editQty').value, 10);
          const e = document.getElementById('editExp').value;
          if (!q || q < 1) return toast('Qty minimal 1.');
          if (!e) return toast('Exp date wajib diisi.');
          r.qty = q;
          r.expDate = e;
          r.tarikDate = (await import('./utils.js')).hitungTanggalTarik(e, r.rh_num) || '';
          await idbPut('scans', r.id, r);
          renderScanList(state);
          toast('Data diperbarui.');
        }
      }
    ]
  });
}

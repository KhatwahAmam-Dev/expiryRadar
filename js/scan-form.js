import { parseRH, hitungTanggalTarik, cekStatusTarik, formatTanggal, escapeHtml, escapeJs, toast } from './utils.js';
import { idbPut } from './db.js';
import { renderScanList } from './scan-list.js';

export function handleBarcode(barcodeRaw, state) {
  const barcode = String(barcodeRaw).trim();
  const product = state.masterData.find(p => String(p.barcode).trim() === barcode);
  if (!product) {
    document.getElementById('productResult').innerHTML = `
      <div class="result-card danger">
        <div class="prod-name">Produk tidak ditemukan</div>
        <div class="meta">Barcode: <b>${escapeHtml(barcode)}</b></div>
        <div class="meta" style="color:#991b1b;margin-top:6px;">Pastikan data master ter-update, atau upload file JSON terbaru.</div>
      </div>`;
    toast('Barcode tidak ada di master data.');
    return;
  }
  openInputForm(product, state);
}

function openInputForm(product, state) {
  const rhNum = parseRH(product.retur_h);
  const rhLabel = product.retur_h || '-';

  const duplicate = state.scanResults.find(r =>
    String(r.barcode) === String(product.barcode) &&
    String(r.plu) === String(product.plu) &&
    r.rak === state.currentRak &&
    String(r.shelving) === String(state.currentShelving)
  );

  const wrap = document.getElementById('productResult');
  wrap.innerHTML = `
    <div class="result-card" id="formCard">
      <div class="prod-name">${escapeHtml(product.descp)}</div>
      <div class="meta">PLU: <b>${escapeHtml(product.plu)}</b> · Barcode: <b>${escapeHtml(product.barcode)}</b></div>
      <div class="meta">Lokasi: <b>${escapeHtml(product.lokasi || '-')}</b> · R_H: <b>${escapeHtml(rhLabel)}</b> (dipakai: ${rhNum} hari)</div>
      <svg id="svgBarcode"></svg>

      ${duplicate ? `<span class="warn-badge">⚠ Produk ini sudah discan di rak ${escapeHtml(state.currentRak)} shelving ${escapeHtml(state.currentShelving)}. Akan dicatat sebagai baris baru (indikasi rak tidak konsisten).</span>` : ''}

      <div class="field">
        <label>Qty</label>
        <input id="inpQty" type="number" min="1" value="1" inputmode="numeric" />
      </div>
      <div class="field">
        <label>Tanggal Expired (dari kemasan)</label>
        <input id="inpExp" type="date" />
      </div>
      <div class="field" style="margin-bottom:6px;">
        <label>Perkiraan Tanggal Tarik (otomatis)</label>
        <div id="lblTarik" style="padding:11px 13px;background:#f1f5f9;border-radius:10px;font-weight:600;color:#0f172a;">— isi tanggal expired dulu —</div>
      </div>
      <div class="row-2" style="margin-top:14px;">
        <button class="btn btn-gray" id="btnCancelInput">Batal</button>
        <button class="btn btn-green" id="btnSaveInput">Simpan</button>
      </div>
    </div>
  `;

  try {
    JsBarcode('#svgBarcode', String(product.barcode), {
      format: 'CODE128', width: 2, height: 55, displayValue: true, fontSize: 14, margin: 4
    });
  } catch (e) { /* ignore */ }

  const inpExp = document.getElementById('inpExp');
  const lblTarik = document.getElementById('lblTarik');
  const updateTarik = () => {
    if (!inpExp.value) { lblTarik.textContent = '— isi tanggal expired dulu —'; lblTarik.style.color = '#0f172a'; return; }
    const tgl = hitungTanggalTarik(inpExp.value, rhNum);
    if (!tgl) { lblTarik.textContent = 'Tidak dihitung'; return; }
    const s = cekStatusTarik(tgl);
    lblTarik.textContent = `${formatTanggal(tgl)} (${s.label})`;
    lblTarik.style.color = s.color;
  };
  inpExp.addEventListener('change', updateTarik);

  document.getElementById('btnCancelInput').addEventListener('click', () => {
    document.getElementById('productResult').innerHTML = '';
  });

  document.getElementById('btnSaveInput').addEventListener('click', () => {
    const qty = parseInt(document.getElementById('inpQty').value, 10);
    const expDate = document.getElementById('inpExp').value;
    if (!qty || qty < 1) return toast('Qty minimal 1.');
    if (!expDate) return toast('Tanggal expired wajib diisi.');

    const tarikDate = hitungTanggalTarik(expDate, rhNum) || '';
    const record = {
      id: 's_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      barcode: String(product.barcode),
      plu: String(product.plu),
      descp: product.descp,
      lokasi: product.lokasi || '',
      retur_h: product.retur_h || '',
      rh_num: rhNum,
      expDate,
      tarikDate,
      qty,
      rak: state.currentRak,
      shelving: String(state.currentShelving),
      user: state.currentUser,
      createdAt: new Date().toISOString()
    };

    state.scanResults.unshift(record);
    idbPut('scans', record.id, record).catch(() => {});
    renderScanList(state);
    document.getElementById('productResult').innerHTML = '';
    toast('Tersimpan: ' + product.descp.slice(0, 32) + (product.descp.length > 32 ? '…' : ''));
  });

  setTimeout(() => {
    document.getElementById('formCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('inpQty').focus();
  }, 120);
}

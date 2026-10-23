import { initAuth } from './auth.js';
import { loadMasterData, initUpload } from './master.js';
import { initScanner } from './scanner.js';
import { renderScanList } from './scan-list.js';
import { openExport } from './export.js';
import { showModal, toast } from './utils.js';
import { idbGetAll } from './db.js';

// State global aplikasi
const state = {
  masterData: [],
  scanResults: [],
  currentUser: '',
  currentRak: '',
  currentShelving: ''
};

window.__appState = state; // expose untuk debug

function showApp() {
  document.getElementById('viewLogin').classList.add('hidden');
  document.getElementById('viewApp').classList.remove('hidden');
}

async function afterLogin() {
  // restore rak/shelving
  const r = localStorage.getItem('exp_rak');
  const s = localStorage.getItem('exp_shelving');
  if (r && s) {
    state.currentRak = r;
    state.currentShelving = s;
    document.getElementById('lblRak').textContent = r;
    document.getElementById('lblShelving').textContent = s;
    document.getElementById('setupCard').classList.add('hidden');
    document.getElementById('scanArea').classList.remove('hidden');
  }

  await loadMasterData(state);

  state.scanResults = (await idbGetAll('scans')) || [];
  renderScanList(state);
}

function initSetupRak() {
  document.getElementById('btnSetRak').addEventListener('click', () => {
    const rak = document.getElementById('inpRak').value.trim();
    const shv = document.getElementById('inpShelving').value.trim();
    if (!rak) return toast('Nama rak wajib diisi.');
    if (!shv || isNaN(parseInt(shv))) return toast('No. shelving wajib diisi angka.');

    state.currentRak = rak;
    state.currentShelving = shv;
    localStorage.setItem('exp_rak', rak);
    localStorage.setItem('exp_shelving', shv);
    document.getElementById('lblRak').textContent = rak;
    document.getElementById('lblShelving').textContent = shv;
    document.getElementById('setupCard').classList.add('hidden');
    document.getElementById('scanArea').classList.remove('hidden');
    toast('Rak & shelving disimpan.');
  });
}

function initPindah() {
  document.getElementById('btnPindahShv').addEventListener('click', () => {
    showModal({
      title: 'Pindah Shelving',
      body: `<p>Masukkan no. shelving berikutnya (rak tetap: <b>${state.currentRak}</b>).</p>
             <input id="modalShv" type="number" min="1" placeholder="No shelving" style="width:100%;padding:11px 13px;border:1px solid #e2e8f0;border-radius:10px;font-size:15px;" />`,
      actions: [
        { label: 'Batal', class: 'btn-gray' },
        {
          label: 'Pindah', class: 'btn-orange', onClick: () => {
            const v = document.getElementById('modalShv').value.trim();
            if (!v) return toast('Isi no shelving.');
            state.currentShelving = v;
            localStorage.setItem('exp_shelving', v);
            document.getElementById('lblShelving').textContent = v;
            toast('Pindah ke shelving ' + v);
          }
        }
      ]
    });
  });

  document.getElementById('btnPindahRak').addEventListener('click', () => {
    showModal({
      title: 'Pindah Rak',
      body: `<p>Masukkan nama rak baru.</p>
             <input id="modalRak" type="text" placeholder="Nama rak" style="width:100%;padding:11px 13px;border:1px solid #e2e8f0;border-radius:10px;font-size:15px;margin-bottom:8px;" />
             <input id="modalShv2" type="number" min="1" placeholder="No shelving awal" style="width:100%;padding:11px 13px;border:1px solid #e2e8f0;border-radius:10px;font-size:15px;" />`,
      actions: [
        { label: 'Batal', class: 'btn-gray' },
        {
          label: 'Pindah', class: 'btn-orange', onClick: () => {
            const r = document.getElementById('modalRak').value.trim();
            const s = document.getElementById('modalShv2').value.trim();
            if (!r || !s) return toast('Isi rak & shelving.');
            state.currentRak = r;
            state.currentShelving = s;
            localStorage.setItem('exp_rak', r);
            localStorage.setItem('exp_shelving', s);
            document.getElementById('lblRak').textContent = r;
            document.getElementById('lblShelving').textContent = s;
            toast('Pindah ke rak ' + r + ' shelving ' + s);
          }
        }
      ]
    });
  });
}

// Boot
window.addEventListener('load', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  }

  initAuth();
  initUpload(state);
  initScanner();
  initSetupRak();
  initPindah();

  // handle barcode → pakai state dari window
  // (dipanggil oleh scanner.js via import)

  document.getElementById('btnExport').addEventListener('click', () => openExport(state));

  // restore login
  const savedUser = localStorage.getItem('exp_user');
  if (savedUser) {
    state.currentUser = savedUser;
    document.getElementById('lblUser').textContent = savedUser;
    showApp();
    afterLogin();
  }

  // event login sukses
  window.addEventListener('logged-in', (e) => {
    state.currentUser = e.detail.user;
    afterLogin();
  });
});

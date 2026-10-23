import { JSON_URL } from './config.js';
import { idbPut, idbGet } from './db.js';
import { toast } from './utils.js';

export async function loadMasterData(state) {
  const status = document.getElementById('masterStatus');
  status.textContent = 'Memuat data master...';

  // 1) cache dulu
  const cached = await idbGet('master', 'all');
  if (cached && cached.length) {
    state.masterData = cached;
    status.textContent = `OK · ${cached.length.toLocaleString('id-ID')} item (cache lokal)`;
  }

  // 2) coba network
  try {
    const res = await fetch(JSON_URL, { cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (Array.isArray(data)) {
      state.masterData = data;
      await idbPut('master', 'all', data);
      status.textContent = `OK · ${data.length.toLocaleString('id-ID')} item (online)`;
    }
  } catch (e) {
    if (state.masterData.length) {
      status.textContent = `Offline · pakai cache (${state.masterData.length.toLocaleString('id-ID')} item)`;
    } else {
      status.textContent = 'Offline · belum ada data. Upload file JSON dulu.';
    }
  }
}

export function initUpload(state) {
  const area = document.getElementById('uploadArea');
  const file = document.getElementById('fileJson');

  area.addEventListener('click', () => file.click());

  file.addEventListener('change', async (ev) => {
    const f = ev.target.files[0];
    if (!f) return;
    try {
      const text = await f.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error('JSON bukan array');
      state.masterData = data;
      await idbPut('master', 'all', data);
      document.getElementById('masterStatus').textContent =
        `OK · ${data.length.toLocaleString('id-ID')} item (upload lokal)`;
      toast('Data master berhasil dimuat.');
    } catch (err) {
      toast('File JSON tidak valid.');
    }
    ev.target.value = '';
  });
}

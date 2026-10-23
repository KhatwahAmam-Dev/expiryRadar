import { handleBarcode } from './scan-form.js';
import { toast } from './utils.js';

let html5Qr = null;
let active = false;

export function startScanner() {
  if (active) return;
  const readerEl = document.getElementById('reader');
  if (!html5Qr) html5Qr = new Html5Qrcode('reader', { verbose: false });

  html5Qr.start(
    { facingMode: 'environment' },
    { fps: 12, qrbox: { width: 260, height: 160 }, aspectRatio: 1.5 },
    (decoded) => {
      if (!active) return;
      handleBarcode(decoded);
    },
    () => {}
  ).then(() => {
    active = true;
    readerEl.classList.remove('hidden');
  }).catch((err) => {
    toast('Tidak bisa akses kamera. Gunakan input manual.');
    console.error(err);
  });
}

export function stopScanner() {
  if (!html5Qr || !active) return;
  html5Qr.stop().then(() => { active = false; }).catch(() => {});
}

export function initScanner() {
  document.getElementById('btnStartScan').addEventListener('click', startScanner);
  document.getElementById('btnStopScan').addEventListener('click', stopScanner);

  const manual = document.getElementById('inpManualBarcode');
  const trigger = () => {
    const v = manual.value.trim();
    if (!v) return toast('Isi barcode.');
    handleBarcode(v);
    manual.value = '';
  };
  document.getElementById('btnManualSearch').addEventListener('click', trigger);
  manual.addEventListener('keydown', (e) => { if (e.key === 'Enter') trigger(); });

  // auto-start ketika scanArea tampil
  const obs = new MutationObserver(() => {
    if (!document.getElementById('scanArea').classList.contains('hidden') && !active) {
      setTimeout(startScanner, 300);
    }
  });
  obs.observe(document.getElementById('scanArea'), { attributes: true, attributeFilter: ['class'] });
}

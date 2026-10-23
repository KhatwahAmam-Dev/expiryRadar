import { LOGIN_CRED } from './config.js';
import { toast } from './utils.js';

export function doLogin() {
  const u = document.getElementById('inpUser').value.trim();
  const p = document.getElementById('inpPass').value;
  if (!u) return toast('Nama crew wajib diisi.');
  if (p !== LOGIN_CRED.pass) return toast('Password salah.');

  localStorage.setItem('exp_user', u);
  document.getElementById('lblUser').textContent = u;
  document.getElementById('viewLogin').classList.add('hidden');
  document.getElementById('viewApp').classList.remove('hidden');

  // trigger event agar app.js bisa lanjut
  window.dispatchEvent(new CustomEvent('logged-in', { detail: { user: u } }));
}

export function doLogout() {
  if (!confirm('Keluar dari sesi ini? Data scan tetap tersimpan di perangkat.')) return;
  localStorage.removeItem('exp_user');
  location.reload();
}

export function initAuth() {
  document.getElementById('btnLogin').addEventListener('click', doLogin);
  document.getElementById('inpPass').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doLogin();
  });
  document.getElementById('btnLogout').addEventListener('click', doLogout);
}

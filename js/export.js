import { cekStatusTarik, formatTanggal, sanitize, showModal, toast } from './utils.js';

export function openExport(state) {
  if (!state.scanResults.length) return toast('Belum ada data untuk diexport.');
  showModal({
    title: 'Export Data',
    body: `<p>Pilih format export (${state.scanResults.length} item dari semua rak).</p>`,
    actions: [
      { label: 'Excel', class: 'btn-green', onClick: () => exportExcel(state) },
      { label: 'PDF',   class: 'btn-red',   onClick: () => exportPDF(state) }
    ]
  });
}

function exportExcel(state) {
  const rows = state.scanResults.map((r, i) => ({
    No: i + 1,
    Barcode: r.barcode,
    PLU: r.plu,
    Deskripsi: r.descp,
    Rak: r.rak,
    Shelving: r.shelving,
    Qty: r.qty,
    'Retur Hari': r.retur_h || '-',
    'RH Aktif': r.rh_num,
    'Exp Date': r.expDate,
    'Tgl Tarik': r.tarikDate || '-',
    Status: r.tarikDate ? cekStatusTarik(r.tarikDate).label : 'Tanpa R_H',
    Crew: r.user,
    'Waktu Scan': r.createdAt
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'ExpiryCheck');
  XLSX.writeFile(wb, `expiry_${sanitize(state.currentRak || 'all')}_${Date.now()}.xlsx`);
  toast('Excel terunduh.');
}

async function exportPDF(state) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageW = 210, margin = 12;
  let y = 14;

  const groupBy = {};
  state.scanResults.forEach(r => {
    const key = `${r.rak}__${r.shelving}`;
    if (!groupBy[key]) groupBy[key] = { rak: r.rak, shelving: r.shelving, items: [] };
    groupBy[key].items.push(r);
  });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('LAPORAN CEK EXPIRED & RETUR', pageW / 2, y, { align: 'center' });
  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Toko AM024 · Crew: ${state.currentUser} · Dicetak: ${new Date().toLocaleString('id-ID')}`,
    pageW / 2, y, { align: 'center' }
  );
  y += 8;

  for (const key of Object.keys(groupBy)) {
    const grp = groupBy[key];
    if (y > 250) { doc.addPage(); y = 14; }

    doc.setFillColor(37, 99, 235);
    doc.setTextColor(255, 255, 255);
    doc.roundedRect(margin, y, pageW - margin * 2, 7, 1.5, 1.5, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Rak: ${grp.rak}  ·  Shelving: ${grp.shelving}`, margin + 3, y + 5);
    y += 10;

    doc.setTextColor(15, 23, 42);
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, pageW - margin * 2, 6, 'F');
    doc.setFontSize(8);
    doc.text('No', margin + 2, y + 4);
    doc.text('Barcode Visual', margin + 10, y + 4);
    doc.text('PLU', margin + 52, y + 4);
    doc.text('Deskripsi', margin + 74, y + 4);
    doc.text('Qty', margin + 140, y + 4);
    doc.text('Exp', margin + 152, y + 4);
    doc.text('Tarik', margin + 172, y + 4);
    y += 6;

    let idx = 1;
    for (const r of grp.items) {
      if (y > 265) { doc.addPage(); y = 14; }

      try {
        const canvas = document.createElement('canvas');
        JsBarcode(canvas, r.barcode, {
          format: 'CODE128', width: 1.2, height: 28,
          displayValue: true, fontSize: 9, margin: 1
        });
        doc.addImage(canvas.toDataURL('image/png'), 'PNG', margin + 8, y + 1, 40, 12);
      } catch (e) {}

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(String(idx), margin + 2, y + 6);
      doc.text(r.plu, margin + 52, y + 6);
      const descLines = doc.splitTextToSize(r.descp, 62);
      doc.text(descLines, margin + 74, y + 4);
      doc.text(String(r.qty), margin + 140, y + 6);
      doc.text(formatTanggal(r.expDate), margin + 152, y + 6);
      doc.text(r.tarikDate ? formatTanggal(r.tarikDate) : '-', margin + 172, y + 6);

      const lineH = Math.max(13, descLines.length * 4 + 4);
      y += lineH;
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y, pageW - margin, y);
      idx++;
    }

    y += 4;
    if (y > 240) { doc.addPage(); y = 14; }
    doc.setFontSize(9);
    doc.text(`Rak: ${grp.rak}  ·  Shelving: ${grp.shelving}`, margin, y);
    y += 4;
    doc.text('Crew:', margin, y + 4);
    doc.text(state.currentUser, margin + 16, y + 4);
    doc.text('TTD:', margin + 70, y + 4);
    doc.line(margin + 82, y + 5, margin + 130, y + 5);
    y += 14;
  }

  doc.save(`laporan_expiry_${sanitize(state.currentUser)}_${Date.now()}.pdf`);
  toast('PDF terunduh.');
}

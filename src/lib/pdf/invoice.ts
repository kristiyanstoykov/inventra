// lib/pdf/invoice.ts
import PDFDocument from 'pdfkit';
import path from 'node:path';
import fs from 'node:fs';
import { loadImageForPdf } from './img';

// path to font with Cyrillic support (still kept in case of legacy data)
const FONT_REGULAR = path.join(process.cwd(), 'assets/fonts/DejaVuSans.ttf');
const FONT_BOLD = path.join(process.cwd(), 'assets/fonts/DejaVuSans-Bold.ttf');

type OrderItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  productId: number;
};

type Order = {
  id: number;
  warehouseId: number;
  clientId: number;
  paymentTypeId: number;
  paymentType: string;
  status: string;
  createdAt: Date | string;
  clientFirstName: string;
  clientLastName: string;
  clientNames: string;
  clientCompany?: string | null;
  orderTotal: string;
  items: OrderItem[] | string;
};

type CompanyOptions = {
  companyName: string;
  uic: string;
  vatNumber?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
  representative?: string | null;
  notes?: string | null;
  logo: string; // URL to /media/...
};

export const L = {
  invoice: 'INVOICE',
  no: 'No:',
  date: 'Date:',

  supplier: 'Supplier',
  customer: 'Customer',
  uic: 'UIC/BULSTAT',
  vatNo: 'VAT No.',
  address: 'Address',
  rep: 'Representative',
  phone: 'Tel.',
  email: 'Email',

  thNo: 'No',
  thDesc: 'Description',
  thQty: 'Qty',
  thUnit: 'Unit Price',
  thAmount: 'Amount',

  subtotalExVat: 'Subtotal (excl. VAT):',
  vat20: 'VAT 20%:',
  totalInclVat: 'Total (incl. VAT):',
  total: 'Total:',
  notVatRegistered: 'The supplier is not VAT registered.',

  paymentMethod: 'Payment Method:',
  notes: 'Notes:',
  sigSupplier: 'Signature (Supplier)',
  sigCustomer: 'Signature (Customer)',
};

function ensureFontFile(p: string) {
  if (!fs.existsSync(p)) {
    throw new Error(`Missing font file at ${p}. Add DejaVuSans.ttf (+ Bold) under assets/fonts/.`);
  }
}

function money(n: number) {
  return n.toFixed(2);
}

export async function buildInvoicePdf(order: Order, company: CompanyOptions, invoiceNo: string) {
  if (!company.logo) throw new Error('Missing company logo. Add a logo in settings.');
  if (!company.companyName || !company.uic)
    throw new Error('Missing required supplier data (name/UIC).');

  ensureFontFile(FONT_REGULAR);
  ensureFontFile(FONT_BOLD);

  const doc = new PDFDocument({ size: 'A4', margin: 36 });
  const chunks: Buffer[] = [];
  doc.on('data', (c) => chunks.push(c));

  doc.registerFont('R', FONT_REGULAR);
  doc.registerFont('B', FONT_BOLD);
  doc.font('R');

  // page metrics
  const leftX = doc.page.margins.left;
  const rightX = doc.page.width - doc.page.margins.right;
  const contentW = rightX - leftX;
  const headerTop = 36;

  // header (logo + title / number / date)
  try {
    const logoBuf = await loadImageForPdf(company.logo);
    doc.image(logoBuf, leftX, headerTop, { fit: [120, 60] });
  } catch {}

  doc.font('B').fontSize(18).text(L.invoice, leftX, headerTop, { width: contentW, align: 'right' });
  doc.font('R').fontSize(10);
  const issuedAt = new Date(order.createdAt);
  doc.text(`${L.no} ${invoiceNo}`, leftX, headerTop + 22, { width: contentW, align: 'right' });
  doc.text(`${L.date} ${issuedAt.toLocaleDateString('en-GB')}`, leftX, headerTop + 36, {
    width: contentW,
    align: 'right',
  });

  const afterLogoY = headerTop + 60 + 12;

  // supplier / customer columns
  const gap = 24;
  const colW = (contentW - gap) / 2;
  const supX = leftX;
  const cusX = leftX + colW + gap;

  const supplierLines = [
    company.companyName,
    `${L.uic}: ${company.uic}`,
    company.vatNumber ? `${L.vatNo}: ${company.vatNumber}` : '',
    company.address ? `${L.address}: ${company.address}` : '',
    [company.postalCode, company.city, company.country].filter(Boolean).join(' '),
    company.representative ? `${L.rep}: ${company.representative}` : '',
    company.phone ? `${L.phone}: ${company.phone}` : '',
    company.email ? `${L.email}: ${company.email}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const buyerName =
    order.clientCompany && order.clientCompany.trim() !== ''
      ? order.clientCompany
      : order.clientNames ||
        `${order.clientFirstName ?? ''} ${order.clientLastName ?? ''}`.trim() ||
        '—';

  doc.font('B').fontSize(12).text(L.supplier, supX, afterLogoY, { width: colW });
  doc.font('R').fontSize(10);
  const supplierH = doc.heightOfString(supplierLines, { width: colW });
  doc.text(supplierLines, supX, afterLogoY + 16, { width: colW });

  doc.font('B').fontSize(12).text(L.customer, cusX, afterLogoY, { width: colW });
  doc.font('R').fontSize(10);
  const buyerH = doc.heightOfString(buyerName, { width: colW });
  doc.text(buyerName, cusX, afterLogoY + 16, { width: colW });

  let y = Math.max(afterLogoY + 16 + supplierH, afterLogoY + 16 + buyerH) + 18;

  // table columns (bounded)
  const colGap = 8;
  const idxW = 24,
    qtyW = 40,
    unitW = 70,
    amtW = 90;
  const descW = contentW - (idxW + qtyW + unitW + amtW + colGap * 4);

  const col = {
    idx: leftX,
    desc: leftX + idxW + colGap,
    qty: leftX + idxW + colGap + descW + colGap,
    unit: leftX + idxW + colGap + descW + colGap + qtyW + colGap,
    amt: leftX + idxW + colGap + descW + colGap + qtyW + colGap + unitW + colGap,
  };

  // table header
  doc.font('B').fontSize(10);
  doc.text(L.thNo, col.idx, y, { width: idxW });
  doc.text(L.thDesc, col.desc, y, { width: descW });
  doc.text(L.thQty, col.qty, y, { width: qtyW, align: 'right' });
  doc.text(L.thUnit, col.unit, y, { width: unitW, align: 'right' });
  doc.text(L.thAmount, col.amt, y, { width: amtW, align: 'right' });
  doc
    .moveTo(leftX, y + 14)
    .lineTo(rightX, y + 14)
    .stroke();
  y += 22;

  // rows with wrapping + dynamic height
  const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
  doc.font('R').fontSize(10);
  let totalGross = 0;

  function renderTableHeader() {
    doc.font('B').fontSize(10);
    doc.text(L.thNo, col.idx, y, { width: idxW });
    doc.text(L.thDesc, col.desc, y, { width: descW });
    doc.text(L.thQty, col.qty, y, { width: qtyW, align: 'right' });
    doc.text(L.thUnit, col.unit, y, { width: unitW, align: 'right' });
    doc.text(L.thAmount, col.amt, y, { width: amtW, align: 'right' });
    doc
      .moveTo(leftX, y + 14)
      .lineTo(rightX, y + 14)
      .stroke();
    y += 22;
    doc.font('R').fontSize(10);
  }

  const bottomLimit = doc.page.height - doc.page.margins.bottom - 160;

  items.forEach((it: any, i: number) => {
    const q = Number(it.quantity) || 0;
    const unit = Number(it.price) || 0;
    const line = q * unit;
    totalGross += line;

    const descH = doc.heightOfString(String(it.name), { width: descW });
    const rowH = Math.max(16, descH);

    if (y + rowH > bottomLimit) {
      doc.addPage();
      y = doc.page.margins.top;
      renderTableHeader();
    }

    doc.text(String(i + 1), col.idx, y, { width: idxW });
    doc.text(String(it.name), col.desc, y, { width: descW });
    doc.text(String(q), col.qty, y, { width: qtyW, align: 'right' });
    doc.text(money(unit), col.unit, y, { width: unitW, align: 'right' });
    doc.text(money(line), col.amt, y, { width: amtW, align: 'right' });

    y += rowH;
  });

  doc
    .moveTo(leftX, y + 4)
    .lineTo(rightX, y + 4)
    .stroke();
  y += 12;

  // totals
  const isVat = !!(company.vatNumber && company.vatNumber.trim());
  const labelW = 180,
    valueW = 90;
  const sumBoxW = labelW + 10 + valueW;
  const sumX = rightX - sumBoxW;

  if (isVat) {
    const net = totalGross / 1.2;
    const vat = totalGross - net;
    doc.text(L.subtotalExVat, sumX, y, { width: labelW, align: 'right' });
    doc.text(money(net), sumX + labelW + 10, y, { width: valueW, align: 'right' });
    y += 16;
    doc.text(L.vat20, sumX, y, { width: labelW, align: 'right' });
    doc.text(money(vat), sumX + labelW + 10, y, { width: valueW, align: 'right' });
    y += 16;
    doc.font('B');
    doc.text(L.totalInclVat, sumX, y, { width: labelW, align: 'right' });
    doc.text(money(totalGross), sumX + labelW + 10, y, { width: valueW, align: 'right' });
    doc.font('R');
  } else {
    doc.text(L.notVatRegistered, sumX - 40, y, { width: sumBoxW + 40, align: 'right' });
    y += 18;
    doc.font('B');
    doc.text(L.total, sumX, y, { width: labelW, align: 'right' });
    doc.text(money(totalGross), sumX + labelW + 10, y, { width: valueW, align: 'right' });
    doc.font('R');
  }
  y += 26;

  // payment + notes
  const paymentMap = { cash: 'Cash', card: 'Card', bank: 'Bank transfer' } as const;
  doc.text(
    `${L.paymentMethod} ${
      paymentMap[order.paymentType as keyof typeof paymentMap] ?? order.paymentType ?? '—'
    }`,
    leftX,
    y,
    { width: contentW }
  );
  y += 16;
  if (company.notes) {
    doc.font('B').text(L.notes, leftX, y, { width: 60 });
    doc.font('R').text(company.notes, leftX + 60, y, { width: contentW - 60 });
    y += 20;
  }

  // signatures
  const sigY = doc.page.height - doc.page.margins.bottom - 60;
  doc
    .moveTo(leftX, sigY)
    .lineTo(leftX + 264, sigY)
    .stroke();
  doc.text(L.sigSupplier, leftX, sigY + 4, { width: 264 });

  doc
    .moveTo(rightX - 264, sigY)
    .lineTo(rightX, sigY)
    .stroke();
  doc.text(L.sigCustomer, rightX - 264, sigY + 4, { width: 264 });

  doc.end();
  await new Promise<void>((r) => doc.on('end', () => r()));
  return Buffer.concat(chunks);
}

export const runtime = 'nodejs';

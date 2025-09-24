import PDFDocument from 'pdfkit';
import path from 'node:path';
import fs from 'node:fs';
import { loadImageForPdf } from './img';
import { logger } from '../logger';
import { AppError } from '../appError';
import { formatDate } from 'date-fns';
import { empty } from '../empty';

const FONT_REGULAR = path.join(process.cwd(), 'assets/fonts/DejaVuSans.ttf');
const FONT_BOLD = path.join(process.cwd(), 'assets/fonts/DejaVuSans-Bold.ttf');

// ---------- Types (unchanged) ----------
type OrderItem = {
  id: number;
  name: string;
  sn: string | null | undefined;
  price: number;
  quantity: number;
  productId: number;
};

type Order = {
  id: number;
  warehouseId: number;
  clientId: number;
  paymentTypeId: number | null;
  paymentType: string | null;
  status: string;
  createdAt: Date | string | null;
  clientFirstName: string | null;
  clientLastName: string | null;
  clientNames: string | null;
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

type UserType = {
  roleId?: number | undefined;
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isCompany: boolean;
  companyName: string | null;
  bulstat: string | null;
  vatNumber: string | null;
  phone: string | null;
  address: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
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
  subtotalExVat: 'Данъчна основа (20.00 %):',
  vat20: 'VAT 20%:',
  totalInclVat: 'Total (incl. VAT):',
  total: 'Сума за плащане:',
  notVatRegistered: 'The supplier is not VAT registered.',
  paymentMethod: 'Payment Method:',
  notes: 'Notes:',
  sigSupplier: 'Signature (Supplier)',
  sigCustomer: 'Signature (Customer)',
  legalText:
    'Съгласно чл.6, ал 1 от Закона за счетоводството, чл.114 от ЗДДС и чл.78 от ППЗДДС печатът и подписът не са задължителни реквизити на фактурата',
};

export const EUR_RATE = 1.95583; // fixed BGN/EUR rate

// ---------- Utils ----------
function ensureFontFile(p: string) {
  if (!fs.existsSync(p)) {
    throw new Error(`Missing font file at ${p}. Add DejaVuSans.ttf (+ Bold) under assets/fonts/.`);
  }
}
function money(n: number) {
  return n.toFixed(2);
}

function moneyBGN(n: number) {
  return n.toFixed(2) + ' BGN';
}

function generateHr(doc: InstanceType<typeof PDFDocument>, y: number) {
  doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, y).lineTo(560, y).stroke();
}

function bgnToEur(n: number) {
  const result = n / EUR_RATE;
  return roundTo(result, 2);
}

function roundTo(num: number, decimals = 2) {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}

// Centralized layout numbers
const layout = {
  page: { marginLeft: 36, marginRight: 36, marginTop: 36, marginBottom: 36 },
  columns: {
    table: {
      x: 50,
      // widths for № | Продукт | Ед. цена | Количество | Сума
      wNo: 24,
      wDesc: 250, // smaller to leave room for numeric columns
      wUnit: 70,
      wQty: 65,
      wAmount: 70,
      rowGap: 6,
      headerGap: 8,
    },
  },
  y: {
    headerLogoY: 45,
    headerRightY: 50,
    customerSupplierTop: 170,
    tableTop: 300,
    footerTopMin: 600,
  },
  sign: {
    blockHeight: 70, // height of a signature block
    leftX: 50,
    rightX: 330,
    width: 220,
  },
};

// Measure helper: exactly how tall will a text block be
function height(
  doc: InstanceType<typeof PDFDocument>,
  text: string,
  opts: PDFKit.Mixins.TextOptions
) {
  return doc.heightOfString(text ?? '—', opts);
}

// Page-break helper
function ensureRoom(
  doc: InstanceType<typeof PDFDocument>,
  nextBlockHeight: number,
  reserveBottom = 120 // leave space for total and footer
) {
  const pageHeight = doc.page.height;
  const bottomLimit = pageHeight - doc.page.margins.bottom - reserveBottom;
  if (doc.y + nextBlockHeight > bottomLimit) {
    doc.addPage();
  }
}

// ---------- Public API ----------
export async function buildInvoicePdfStream(
  order: Order,
  company: CompanyOptions,
  client: UserType,
  invoiceNo: string,
  fileName: string,
  subdir: string = 'invoices',
  invoiceCopy: boolean = false,
  createdAt: Date | null
): Promise<{ url: string; fsPath: string } | AppError> {
  try {
    if (!company.logo) throw new Error('Missing company logo. Add a logo in settings.');
    if (!company.companyName || !company.uic)
      throw new Error('Missing required supplier data (name/UIC).');

    ensureFontFile(FONT_REGULAR);
    ensureFontFile(FONT_BOLD);

    const date = createdAt
      ? formatDate(createdAt, 'dd.MM.yyyy')
      : formatDate(new Date(), 'dd.MM.yyyy');
    const uploadRoot = path.join(process.cwd(), 'uploads');
    const dir = path.join(uploadRoot, subdir);
    const invFileName = invoiceCopy ? `${fileName}-copy.pdf` : `${fileName}.pdf`;
    const fsPath = path.join(dir, invFileName);
    const url = `/media/${subdir}/${invFileName}`;
    await fs.promises.mkdir(dir, { recursive: true });

    const doc = new PDFDocument({ size: 'A4', margin: 36 });
    const stream = fs.createWriteStream(fsPath, { mode: 0o644 });
    doc.pipe(stream);

    doc.registerFont('R', FONT_REGULAR);
    doc.registerFont('B', FONT_BOLD);
    doc.font('R');

    await generateInvoiceHeader(doc, company, invoiceNo, invoiceCopy, date);
    const afterHeaderY = generateSupplierCustomerInfo(doc, company, order, client);

    const tableStartY = Math.max(layout.y.tableTop, afterHeaderY + 16);
    doc.y = tableStartY;

    generateInvoiceTable(doc, order);
    generateInvoiceFooter(doc, company, order, client);

    doc.end();

    await new Promise<void>((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    return { url, fsPath };
  } catch (error) {
    logger.logError(error, 'CREATE_INVOICE');
    const message = error instanceof Error ? error.message : 'Failed to create invoice';
    return new AppError(message, 'CREATE_FAILED');
  }
}

// ---------- Sections ----------
async function generateInvoiceHeader(
  doc: InstanceType<typeof PDFDocument>,
  company: CompanyOptions,
  invoiceNo: string,
  invoiceCopy: boolean = false,
  date: string
) {
  // Logo
  try {
    const logoBuf = await loadImageForPdf(company.logo);
    doc.image(logoBuf, 50, layout.y.headerLogoY, { width: 60 });
  } catch {
    // ignore
  }

  // Left-pad invoice number to 10 total digits (e.g., 1 -> 0000000001)
  invoiceNo = String(invoiceNo).padStart(10, '0');
  const originalText = invoiceCopy ? 'Копие' : 'ОРИГИНАЛ';
  // Right title
  doc
    .fillColor('#444444')
    .fontSize(8)
    .text(originalText, 100, layout.y.headerRightY, { align: 'center' })
    .fontSize(20)
    .fillColor('#f98015')
    .font('B')
    .text(company.companyName, { align: 'center' })
    .fillColor('#444444')
    .fontSize(20)
    .font('B')
    .text('Фактура', 200, layout.y.headerRightY, { align: 'right' })
    .fontSize(12)
    .font('R')
    .text(`№ ${invoiceNo}`, 200, layout.y.headerRightY + 30, { align: 'right' })
    .fontSize(8)
    .font('B')
    .text(`Дата на издаване: ${date}`, 200, layout.y.headerRightY + 50, { align: 'right' });

  doc.moveDown();
}

function generateSupplierCustomerInfo(
  doc: InstanceType<typeof PDFDocument>,
  company: CompanyOptions,
  order: Order,
  client: UserType
): number {
  const labelOpts: PDFKit.Mixins.TextOptions = { width: 115 };
  const valueOpts: PDFKit.Mixins.TextOptions = { width: 150 };

  const top = layout.y.customerSupplierTop;
  generateHr(doc, top - 5);

  // Заглавия
  doc
    .fontSize(10)
    .font('B')
    .fillColor('#f98015')
    .text('Получател:', 50, top)
    .text('Доставчик:', 300, top);
  doc.fontSize(8).font('R').fillColor('#444444');

  // Ляво — клиент
  let yL = top + 18;
  const leftLabelX = 50;
  const leftValueX = 150;

  if (client.isCompany) {
    // Company Name
    doc.text('Име на фирмата:', leftLabelX, yL, labelOpts);
    const v1 = client.companyName || '—';
    const h1 = height(doc, v1, { ...valueOpts });
    doc.font('B').text(v1, leftValueX, yL, { ...valueOpts });
    doc.font('R');
    yL += Math.max(h1, 12) + 2;

    // UIC
    doc.text('ЕИК:', leftLabelX, yL, labelOpts);
    const v2 = client.bulstat || '—';
    const h2 = height(doc, v2, valueOpts);
    doc.font('B').text(v2, leftValueX, yL, valueOpts);
    doc.font('R');
    yL += Math.max(h2, 12) + 2;

    // Address
    doc.text('Адрес:', leftLabelX, yL, labelOpts);
    const v3 = client.address || '—';
    const h3 = height(doc, v3, valueOpts);
    doc.font('B').text(v3, leftValueX, yL, valueOpts);
    doc.font('R');
    yL += Math.max(h3, 12) + 2;
  } else {
    // Name
    doc.text('Име:', leftLabelX, yL, labelOpts);
    const v1 = `${client.firstName || '—'} ${client.lastName || '—'}`.trim();
    const h1 = height(doc, v1, valueOpts);
    doc.font('B').text(v1, leftValueX, yL, valueOpts);
    doc.font('R');
    yL += Math.max(h1, 12) + 2;

    // Email
    doc.text('Имейл:', leftLabelX, yL, labelOpts);
    const v2 = client.email || '—';
    const h2 = height(doc, v2, valueOpts);
    doc.font('B').text(v2, leftValueX, yL, valueOpts);
    doc.font('R');
    yL += Math.max(h2, 12) + 2;

    // Phone
    doc.text('Тел.:', leftLabelX, yL, labelOpts);
    const v3 = client.phone || '—';
    const h3 = height(doc, v3, valueOpts);
    doc.font('B').text(v3, leftValueX, yL, valueOpts);
    doc.font('R');
    yL += Math.max(h3, 12) + 2;
  }

  // Дясно — доставчик
  let yR = top + 18;
  const rightLabelX = 300;
  const rightValueX = 400;

  const writeField = (label: string, value: string | null | undefined) => {
    doc.font('R').text(label, rightLabelX, yR, labelOpts);
    const v = value?.trim() || '—';
    const h = height(doc, v, valueOpts);
    doc.font('B').text(v, rightValueX, yR, valueOpts).font('R');
    yR += Math.max(h, 12) + 2;
  };

  writeField('Име на фирмата:', company.companyName);
  writeField('ЕИК:', company.uic);
  if (company.vatNumber?.trim()) writeField('ДДС №:', company.vatNumber);
  writeField('Адрес:', company.address);
  writeField('МОЛ:', company.representative);

  const after = Math.max(yL, yR);
  generateHr(doc, after + 4);
  return after;
}

function generateInvoiceTable(doc: InstanceType<typeof PDFDocument>, order: Order): number {
  // Header
  doc.font('B').fontSize(9);
  const headerY = doc.y + 10;
  generateTableRow(doc, headerY, {
    headingRow: true,
    rowNum: '№',
    desc: 'Продукт',
    unit: 'Ед. цена',
    qty: 'Количество',
    amount: 'Сума',
  });
  generateHr(doc, headerY + 16);
  doc.font('R').fontSize(8);

  // Rows
  const items: OrderItem[] =
    typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
  let y = headerY + 20;
  let totalGross = 0;

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const q = Number(it.quantity) || 0;
    const unit = Number(it.price) || 0;
    const line = q * unit;
    totalGross += line;

    // compose description (SN + name)
    const desc =
      it.sn && String(it.sn).trim() !== ''
        ? `${String(it.sn).trim()} - ${it.name}`
        : String(it.name);

    // Measure row height as max of all cells (desc can wrap)
    const rowHeights = measureRowHeights(doc, {
      rowNum: String(i + 1),
      desc,
      unit: money(unit),
      qty: String(q),
      amount: money(line),
    });
    const rowHeight = Math.max(...rowHeights);

    // page break if needed (keep room for totals)
    const needed = rowHeight + layout.columns.table.rowGap;
    ensureRoom(doc, needed, 160);

    // Draw row
    generateTableRow(doc, y, {
      rowNum: String(i + 1),
      desc,
      unit: money(unit),
      qty: String(q),
      amount: money(line),
    });

    // Row underline
    generateHr(doc, y + rowHeight);
    y += rowHeight + layout.columns.table.rowGap;
    doc.y = y; // keep doc.y in sync
  }

  const paymentTypeMap: Record<string, string> = {
    cash: 'в брой',
    card: 'карта',
  };
  let paymentTypeString = order.paymentType
    ? paymentTypeMap[order.paymentType] || order.paymentType
    : '—';
  if (paymentTypeString && paymentTypeString !== '—') {
    paymentTypeString = paymentTypeString.charAt(0).toUpperCase() + paymentTypeString.slice(1);
  }
  // Overwrite so existing totals row uses the transformed value
  order.paymentType = paymentTypeString;

  // Totals
  const subtotalY = y + 6;
  doc.fontSize(8).font('R');
  const totalExVat = roundTo(totalGross / 1.2, 2);
  const vat = roundTo(totalGross - totalExVat, 2);

  drawTotalsWithEur(doc, subtotalY, [
    ['Начин на плащане:', paymentTypeString, ''],
    [L.subtotalExVat, moneyBGN(totalExVat), ''],
    ['Начислен ДДС (20.00 %):', moneyBGN(vat), ''],
    [L.total, moneyBGN(totalGross), bgnToEur(roundTo(totalGross, 2)).toString()],
  ]);

  doc.font('R').fontSize(8);
  return totalGross;
}

function measureRowHeights(
  doc: InstanceType<typeof PDFDocument>,
  cells: { rowNum: string; desc: string; unit: string; qty: string; amount: string }
): number[] {
  const col = layout.columns.table;
  const optsBase = { align: 'left' as const };
  const hNo = height(doc, cells.rowNum, { width: col.wNo, ...optsBase });
  const hDesc = height(doc, cells.desc, { width: col.wDesc, ...optsBase });
  const hUnit = height(doc, cells.unit, { width: col.wUnit, align: 'right' as const });
  const hQty = height(doc, cells.qty, { width: col.wQty, align: 'right' as const });
  const hAmount = height(doc, cells.amount, { width: col.wAmount, align: 'right' as const });
  return [hNo, hDesc, hUnit, hQty, hAmount].map((h) => Math.max(h, 12));
}

function generateTableRow(
  doc: InstanceType<typeof PDFDocument>,
  y: number,
  data: {
    headingRow?: boolean;
    rowNum: string;
    desc: string;
    unit: string;
    qty: string;
    amount: string;
  }
) {
  const col = layout.columns.table;
  const x = col.x;

  const optsL: PDFKit.Mixins.TextOptions = { align: 'left' };
  const optsR: PDFKit.Mixins.TextOptions = { align: 'right' };

  if (data.headingRow) doc.font('B');
  else doc.font('R');
  doc.fontSize(data.headingRow ? 9 : 8);

  let cx = x;
  doc.text(data.rowNum, cx, y, { width: col.wNo, ...optsL });
  cx += col.wNo + 6;
  doc.text(data.desc, cx, y, { width: col.wDesc, ...optsL });
  cx += col.wDesc + 6;
  doc.text(data.unit, cx, y, { width: col.wUnit, ...optsR });
  cx += col.wUnit + 6;
  doc.text(data.qty, cx, y, { width: col.wQty, ...optsR });
  cx += col.wQty + 6;
  doc.text(data.amount, cx, y, { width: col.wAmount, ...optsR });
}

function drawTotals(
  doc: InstanceType<typeof PDFDocument>,
  y: number,
  rows: Array<[label: string, value: string]>
) {
  const rightEdge = 560; // from generateHr
  const labelWidth = 160;
  const valueWidth = 80;
  const gap = 8;

  let cy = y;
  rows.forEach(([label, value], idx) => {
    const isTotal = idx === rows.length - 1;
    doc.font(isTotal ? 'B' : 'R');
    doc.fillColor(isTotal ? '#f98015' : '#444444');
    const labelX = rightEdge - (labelWidth + valueWidth + gap);
    const valueX = rightEdge - valueWidth;

    const lh = Math.max(
      height(doc, label, { width: labelWidth, align: 'right' }),
      height(doc, value, { width: valueWidth, align: 'right' }),
      12
    );

    ensureRoom(doc, lh + 6, 80);
    doc.text(label, labelX, cy, { width: labelWidth, align: 'right' });
    doc.text(value, valueX, cy, { width: valueWidth, align: 'right' });
    cy += lh + 1;
  });
  doc.font('R');
  doc.fillColor('#444444');
}

function drawTotalsWithEur(
  doc: InstanceType<typeof PDFDocument>,
  y: number,
  rows: Array<[label: string, value: string, valueEur: string]>
) {
  const rightEdge = 560; // from generateHr
  const labelWidth = 200;
  const valueWidth = 140;
  const gap = 8;

  let cy = y;
  rows.forEach(([label, value, valueEur], idx) => {
    const isTotal = idx === rows.length - 1;
    doc.font(isTotal ? 'B' : 'R');
    doc.fillColor(isTotal ? '#f98015' : '#444444');
    const labelX = rightEdge - (labelWidth + valueWidth + gap);
    const valueX = rightEdge - valueWidth;

    const valueText = empty( valueEur ) ? value : `${value} / (${valueEur} EUR)`;

    const lh = Math.max(
      height(doc, label, { width: labelWidth, align: 'right' }),
      height(doc, valueText, { width: valueWidth, align: 'right' }),
      12
    );

    ensureRoom(doc, lh + 6, 80);
    doc.text(label, labelX, cy, { width: labelWidth, align: 'right' });
    doc.text(valueText, valueX, cy, { width: valueWidth, align: 'right' });
    cy += lh + 1;
  });
  doc.font('R');
  doc.fillColor('#444444');
}

// helper for 'signature' block
function drawSignatureBlock(
  doc: InstanceType<typeof PDFDocument>,
  x: number,
  y: number,
  width: number,
  heading: string,
  nameBold: string
) {
  const labelWidth = 48; // width reserved for 'Signature:'
  const lineX = x + labelWidth + 6;
  const lineY = y + 32;
  const lineWidth = width - (labelWidth + 16);

  doc.fontSize(8).font('R').text(heading, x, y, { width });
  doc
    .font('B')
    .fontSize(10)
    .text(nameBold || '—', x, y + 14, { width });

  // 'Signature:' + line
  doc
    .font('R')
    .fontSize(8)
    .text('Подпис:', x, y + 28, { width: labelWidth });
  doc
    .strokeColor('#000000')
    .lineWidth(1)
    .moveTo(lineX, lineY + 5)
    .lineTo(lineX + lineWidth, lineY + 5)
    .stroke();
}

function generateInvoiceFooter(
  doc: InstanceType<typeof PDFDocument>,
  company: CompanyOptions,
  order: Order,
  client: UserType
) {
  // // how much space we need until page end: payment/note + two signatures + legal text
  // // TODO: change to order notes
  // const reserve =
  //   18 /* payment */ +
  //   (company.notes ? 28 : 0) +
  //   layout.sign.blockHeight +
  //   16 /* gap */ +
  //   40; /* legal */

  // ensureRoom(doc, reserve, 0);

  // // start of footer
  const startY = Math.max(doc.y, layout.y.footerTopMin);
  // // Notes (if any) – show the actual text
  let y = doc.y + 6;

  // if (company.notes) {
  //   doc.fontSize(10).text('Бележка:', 50, y, { width: 500, align: 'left' });
  //   y = doc.y + 2;
  //   doc.fontSize(9).text(company.notes, 50, y, { width: 500, align: 'left' });
  //   y = doc.y + 10;
  // }

  // Signatures – two blocks side by side
  const leftName = client.isCompany
    ? client.companyName || `${client.firstName || ''} ${client.lastName || ''}`.trim()
    : `${client.firstName || ''} ${client.lastName || ''}`.trim();
  const rightName = company.representative || company.companyName || '—';

  const signY = Math.max(y, startY + 36);
  drawSignatureBlock(doc, layout.sign.leftX, signY, layout.sign.width, 'Получател:', leftName);
  drawSignatureBlock(doc, layout.sign.rightX, signY, layout.sign.width, 'Съставил:', rightName);

  // Legal text at the very bottom
  const legalY = signY + layout.sign.blockHeight + 6;
  ensureRoom(doc, 40, 0);
  doc.fontSize(8).text(L.legalText, 50, legalY, { align: 'center', width: 500 });

  // set current cursor for potential additional elements
  doc.y = doc.y + 4;
}

export const runtime = 'nodejs';

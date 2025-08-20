// lib/pdf/invoice.ts
import PDFDocument from 'pdfkit';
import path from 'node:path';
import fs from 'node:fs';
import { loadImageForPdf } from './img';

// path to font with Cyrillic support (still kept in case of legacy data)
const FONT_REGULAR = path.join(process.cwd(), 'assets/fonts/DejaVuSans.ttf');
const FONT_BOLD = path.join(process.cwd(), 'assets/fonts/DejaVuSans-Bold.ttf');
const NEW_LINE_ADDRESS_THRESHOLD_LENGTH = 20;
const NEW_LINE_PRODUCT_THRESHOLD_LENGTH = 55;

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
  const issuedAt = new Date(order.createdAt || new Date());
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

  items.forEach((it: OrderItem, i: number) => {
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

// NEW: Streaming approach - saves directly to file and returns URL
export async function buildInvoicePdfStream(
  order: Order,
  company: CompanyOptions,
  client: UserType,
  invoiceNo: string,
  subdir: string = 'invoices'
): Promise<{ url: string; fsPath: string }> {
  if (!company.logo) throw new Error('Missing company logo. Add a logo in settings.');
  if (!company.companyName || !company.uic)
    throw new Error('Missing required supplier data (name/UIC).');

  ensureFontFile(FONT_REGULAR);
  ensureFontFile(FONT_BOLD);

  // Setup file paths (same logic as saveBufferAsLocalFile)
  const uploadRoot = path.join(process.cwd(), 'uploads');
  const dir = path.join(uploadRoot, subdir);
  const filename = `${invoiceNo}.pdf`;
  const fsPath = path.join(dir, filename);
  const url = `/media/${subdir}/${filename}`;

  // Ensure directory exists
  await fs.promises.mkdir(dir, { recursive: true });

  const doc = new PDFDocument({ size: 'A4', margin: 36 });

  // Stream directly to file
  const stream = fs.createWriteStream(fsPath, { mode: 0o644 });
  doc.pipe(stream);

  doc.registerFont('R', FONT_REGULAR);
  doc.registerFont('B', FONT_BOLD);
  doc.font('R');

  // Generate header with company logo and invoice info
  await generateInvoiceHeader(doc, company, invoiceNo);

  // Generate supplier and customer information
  generateSupplierCustomerInfo(doc, company, order, client);

  // Generate invoice table
  generateInvoiceTable(doc, order);

  // Generate footer
  generateInvoiceFooter(doc, company, order);

  // End the document
  doc.end();

  // Wait for the stream to finish
  await new Promise<void>((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  return { url, fsPath };
}

async function generateInvoiceHeader(
  doc: InstanceType<typeof PDFDocument>,
  company: CompanyOptions,
  invoiceNo: string
) {
  // Header design similar to createPdf.ts
  try {
    const logoBuf = await loadImageForPdf(company.logo);
    doc.image(logoBuf, 50, 45, { width: 50 });
  } catch {
    // Logo loading failed, continue without logo
  }

  doc
    .fillColor('#444444')
    .fontSize(8)
    .text('ОРИГИНАЛ', { align: 'center' })
    .fontSize(20)
    .font('B')
    .text('Фактура', 200, 50, { align: 'right' })
    .fontSize(12)
    .font('R')
    .text(invoiceNo, 200, 80, { align: 'right' })
    .moveDown();
}

function generateSupplierCustomerInfo(
  doc: InstanceType<typeof PDFDocument>,
  company: CompanyOptions,
  order: Order,
  client: UserType
) {
  const customerInformationTop = 200;
  doc.fontSize(10).font('B').text(`Получател:`, 50, 170).font('R');

  generateHr(doc, 185);

  // Left side - Customer details
  if (client.isCompany) {
    const addressY = customerInformationTop + 30;
    const rawAddress = client.address || '—';

    doc
      .fontSize(8)
      .text(`Име на фирмата:`, 50, customerInformationTop)
      .font('B')
      .text(client.companyName || '—', 150, customerInformationTop, { width: 115 })
      .font('R')
      .text(`ЕИК:`, 50, customerInformationTop + 15)
      .font('B')
      .text(client.bulstat ? client.bulstat : '—', 150, customerInformationTop + 15, { width: 115 })
      .font('R')
      .text(`Адрес:`, 50, addressY)
      .font('B')
      .text(rawAddress, 150, addressY, { width: 115 });
  } else {
    doc
      .fontSize(8)
      .text(`Име:`, 50, customerInformationTop)
      .font('B')
      .text(`${client.firstName || '—'} ${client.lastName || '—'}`, 150, customerInformationTop, {
        width: 115,
      })
      .font('R')
      .text(`Имейл:`, 50, customerInformationTop + 15)
      .font('B')
      .text(client.email, 150, customerInformationTop + 15, { width: 115 })
      .font('R')
      .text(`Тел.:`, 50, customerInformationTop + 30)
      .font('B')
      .text(client.phone || '—', 150, customerInformationTop + 30, { width: 115 })
      .font('R');
  }

  // Right side - Supplier information
  const addressExtra = (company.address?.length ?? 0) > NEW_LINE_ADDRESS_THRESHOLD_LENGTH ? 8.5 : 0;
  let y = customerInformationTop;

  // Section heading
  doc.fontSize(10).font('B').text(`Доставчик:`, 300, 170);

  // Company name
  doc.fontSize(8).font('R').text(`Име на фирмата:`, 300, y);
  doc.font('B').text(company.companyName || '—', 400, y, { width: 115 });
  y += 15;

  // UIC
  doc.font('R').text(`ЕИК:`, 300, y);
  doc.font('B').text(company.uic ? company.uic : '—', 400, y, { width: 115 });
  y += 15;

  // Conditional VAT number
  if (company.vatNumber && company.vatNumber.trim() !== '') {
    doc.font('R').text(`ДДС №:`, 300, y);
    doc.font('B').text(company.vatNumber.trim(), 400, y, { width: 115 });
    y += 15;
  }

  // Address
  doc.font('R').text(`Адрес:`, 300, y);
  doc.font('B').text(company.address || '—', 400, y, { width: 115 });
  y += 15 + addressExtra;

  // Representative
  doc.font('R').text(`МОЛ:`, 300, y);
  doc.font('B').text(company.representative || '—', 400, y, { width: 115 });
  y += 15;

  generateHr(doc, y);
}

function generateInvoiceTable(doc: InstanceType<typeof PDFDocument>, order: Order): number {
  let i;
  const invoiceTableTop = 300;

  doc.font('B');
  generateTableRow(doc, invoiceTableTop, '№', 'Продукт', 'Цена', 'Количество', 'Сума', true);
  generateHr(doc, invoiceTableTop + 20);
  doc.font('R');

  // Table rows
  const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
  let totalGross = 0;

  console.log('items', items);

  for (i = 0; i < items.length; i++) {
    const item = items[i];
    const q = Number(item.quantity) || 0;
    const unit = Number(item.price) || 0;
    const line = q * unit;
    totalGross += line;

    const position = invoiceTableTop + (i + 1) * 30;

    const desc =
      item.sn && String(item.sn).trim() !== ''
        ? `${String(item.sn).trim()} - ${item.name}`
        : String(item.name);

    // Check if we need a new page
    if (position > doc.page.height - doc.page.margins.bottom - 200) {
      doc.addPage();
      const newTop = doc.page.margins.top;

      // Re-render table header on new page
      doc.font('B');
      generateTableRow(doc, invoiceTableTop, '№', 'Продукт', 'Цена', 'Количество', 'Сума', true);
      generateHr(doc, newTop + 20);
      doc.font('R');

      // Adjust position for new page
      const newPosition = newTop + (i + 1) * 30;

      generateTableRow(doc, newPosition, String(i + 1), desc, money(unit), String(q), money(line));
      generateHr(doc, newPosition + 20);
    } else {
      generateTableRow(
        doc,
        position,
        String(i + 1),
        String(desc),
        money(unit),
        String(q),
        money(line)
      );
      generateHr(doc, position + 20);
    }
  }

  const subtotalPosition = invoiceTableTop + (i + 1) * 30;
  generateTableRow(doc, subtotalPosition, '', '', L.subtotalExVat, '', money(totalGross));

  const duePosition = subtotalPosition + 25;
  doc.font('B');
  generateTableRow(doc, duePosition, '', '', L.total, '', money(totalGross));
  doc.font('R');

  return totalGross;
}

// Table row function similar to createPdf.ts
function generateTableRow(
  doc: InstanceType<typeof PDFDocument>,
  y: number,
  rowNum: string,
  item: string,
  unitCost: string,
  quantity: string,
  lineTotal: string,
  headingRow: boolean = false
) {
  const itemExtra = item.length > NEW_LINE_PRODUCT_THRESHOLD_LENGTH ? 5 : 0;

  doc.fontSize(headingRow ? 10 : 8);
  doc.text(rowNum, 50, y);
  doc.text(item, 80, y - itemExtra, { width: 275 });
  doc.text(unitCost, 280, y, { width: 90, align: 'right' });
  doc.text(quantity, 370, y, { width: 90, align: 'right' });
  doc.text(lineTotal, 400, y, { align: 'right' });
}

function generateInvoiceFooter(
  doc: InstanceType<typeof PDFDocument>,
  company: CompanyOptions,
  order: Order
) {
  // Simple footer similar to createPdf.ts
  const paymentMap = { cash: 'Cash', card: 'Card', bank: 'Bank transfer' } as const;
  const paymentText = `${L.paymentMethod} ${
    paymentMap[order.paymentType as keyof typeof paymentMap] ?? order.paymentType ?? '—'
  }`;

  // Payment method info
  doc.fontSize(10).text(paymentText, 50, 680, {
    align: 'left',
    width: 500,
  });

  // Add company notes if available
  if (company.notes) {
    doc.text(company.notes, 50, 700, {
      align: 'left',
      width: 500,
    });
  }

  // Legal disclaimer text at the bottom
  const legalText =
    'According to Art. 6, para 1 of the Accountancy Act, Art. 114 of the VAT Act and Art. 78 of the VAT Act, the seal and signature are not mandatory requisites of the invoice.';
  doc.fontSize(8).text(legalText, 50, 750, {
    align: 'center',
    width: 500,
  });
}

// Helper function for horizontal lines (similar to createPdf.ts)
function generateHr(doc: InstanceType<typeof PDFDocument>, y: number) {
  doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, y).lineTo(560, y).stroke();
}

export const runtime = 'nodejs';

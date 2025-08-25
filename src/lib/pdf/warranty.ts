// warranty.ts
import PDFDocument from 'pdfkit';
import path from 'node:path';
import fs from 'node:fs';
import { OrderPaymentTypeEnum } from '@/lib/schema/order-payment-type';
import { format as formatDate, addMonths } from 'date-fns';
import { loadImageForPdf } from './img';
import { AppError } from '../appError';
import { logger } from '../logger';
import { InferSelectModel } from 'drizzle-orm';
import { OrderTable } from '@/db/drizzle/schema';

const FONT_REGULAR = path.join(process.cwd(), 'assets/fonts/DejaVuSans.ttf');
const FONT_BOLD = path.join(process.cwd(), 'assets/fonts/DejaVuSans-Bold.ttf');

type Order = Omit<InferSelectModel<typeof OrderTable>, 'paymentType' | 'updatedAt'> & {
  paymentType: (typeof OrderPaymentTypeEnum.options)[number] | null;
  invoiceId: number | null;
  items?: OrderItem[] | string; // JSON string
};

type OrderItem = {
  id: number;
  name: string;
  sn: string | null | undefined;
  price: number;
  quantity: number;
  productId: number;
  warranty?: number | null; // in months
};

type CompanyOptions = {
  logo?: string; // optional
  notes?: string | null; // we use ONLY this from options
};

function ensureFontFile(p: string) {
  if (!fs.existsSync(p)) throw new Error(`Missing font file at ${p}`);
}
function generateHr(doc: InstanceType<typeof PDFDocument>, y: number) {
  doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, y).lineTo(560, y).stroke();
}
function height(
  doc: InstanceType<typeof PDFDocument>,
  text: string,
  opts: PDFKit.Mixins.TextOptions
) {
  return doc.heightOfString(text ?? '—', opts);
}
function ensureRoom(
  doc: InstanceType<typeof PDFDocument>,
  nextBlockHeight: number,
  reserveBottom = 100
) {
  const pageHeight = doc.page.height;
  const bottomLimit = pageHeight - doc.page.margins.bottom - reserveBottom;
  if (doc.y + nextBlockHeight > bottomLimit) doc.addPage();
}

const REPAIR_ROW_H = 48;
const REPAIR_ROWS_COUNT = 3;
const layout = {
  y: {
    headerTop: 40,
    tableTop: 130,
    footerTopMin: 620,
  },
  table: {
    x: 50,
    rowGap: 6,
    headerGap: 8,
  },
  // columns for the warranty table
  colsWarranty: {
    wNo: 24,
    wDesc: 190,
    wSN: 70,
    wQty: 40,
    wMonths: 80,
    wExpire: 70,
  },
  // columns for the repair log
  colsRepairs: {
    wDate: 50,
    wAction: 200,
    wParts: 100,
    wBy: 80,
    wSign: 60,
  },
};

// ---------- Public API ----------
export async function buildWarrantyPdfStream(
  order: Order,
  company: CompanyOptions,
  fileName: string,
  subdir = 'warranties'
): Promise<{ url: string; fsPath: string } | AppError> {
  try {
    ensureFontFile(FONT_REGULAR);
    ensureFontFile(FONT_BOLD);

    const created = order.createdAt ?? new Date();

    const uploadRoot = path.join(process.cwd(), 'uploads');
    const dir = path.join(uploadRoot, subdir);
    await fs.promises.mkdir(dir, { recursive: true });
    const fsPath = path.join(dir, `${fileName}.pdf`);
    const url = `/media/${subdir}/${fileName}.pdf`;
    const createdStr = formatDate(created, 'dd.MM.yyyy');

    const doc = new PDFDocument({ size: 'A4', margin: 36, bufferPages: true });
    const stream = fs.createWriteStream(fsPath, { mode: 0o644 });
    doc.pipe(stream);

    doc.registerFont('R', FONT_REGULAR);
    doc.registerFont('B', FONT_BOLD);
    doc.font('R');

    await generateWarrantyHeader(doc, company, order.id, createdStr);
    doc.y = Math.max(doc.y + 12, layout.y.tableTop);

    generateWarrantyItemsTable(doc, order, created);
    doc.moveDown(1.2);
    generateRepairsLogTable(doc, REPAIR_ROWS_COUNT);

    if (company.notes?.trim()) {
      doc.moveDown(1);
      generateWarrantyNotes(doc, company.notes.trim());
    }

    //Global Edits to All Pages (Header/Footer, etc)
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);

      //Footer: Add page number
      const oldBottomMargin = doc.page.margins.bottom;
      doc.page.margins.bottom = 0; //Dumb: Have to remove bottom margin in order to write into it
      doc
        .font('R')
        .fontSize(8)
        .fillColor('#666')
        .text(
          `${i + 1} / ${pages.count}`,
          0,
          doc.page.height - oldBottomMargin / 2 - 16, // Centered vertically in bottom margin
          { align: 'center' }
        );
      doc.page.margins.bottom = oldBottomMargin; // ReProtect bottom margin
    }

    doc.end();
    await new Promise<void>((res, rej) => {
      stream.on('finish', res);
      stream.on('error', rej);
    });

    return { url, fsPath };
  } catch (error) {
    logger.logError(error, 'CREATE_WARRANTY');
    const message = error instanceof Error ? error.message : 'Failed to create warranty card';
    return new AppError(message, 'CREATE_FAILED');
  }
}

// ---------- Sections ----------
async function generateWarrantyHeader(
  doc: InstanceType<typeof PDFDocument>,
  company: CompanyOptions,
  orderId: number,
  createdStr: string
) {
  // logo (optional)
  if (company.logo) {
    try {
      const logoBuf = await loadImageForPdf(company.logo);
      doc.image(logoBuf, 50, layout.y.headerTop, { width: 120 });
    } catch {
      /* ignore */
    }
  }

  const rightX = 200;
  doc
    .fillColor('#444')
    .fontSize(20)
    .font('B')
    .text('Гаранционна карта', rightX, layout.y.headerTop, { align: 'right' })
    .font('R')
    .fontSize(10)
    .text(`№ по поръчка: ${String(orderId).padStart(6, '0')}`, rightX, layout.y.headerTop + 28, {
      align: 'right',
    })
    .text(`Дата на покупка: ${createdStr}`, rightX, layout.y.headerTop + 44, { align: 'right' });

  generateHr(doc, layout.y.headerTop + 70);
}

function generateWarrantyItemsTable(
  doc: InstanceType<typeof PDFDocument>,
  order: Order,
  purchaseDate: Date
) {
  const items: OrderItem[] =
    typeof order.items === 'string' ? JSON.parse(order.items) : order.items || [];

  const col = layout.colsWarranty;
  const x = layout.table.x;

  // Header row
  doc.font('B').fontSize(9);
  const headerY = doc.y + 8;
  writeCell(doc, '№', x, headerY, col.wNo, 'left');
  writeCell(doc, 'Продукт', x + col.wNo + 6, headerY, col.wDesc, 'left');
  writeCell(doc, 'Сериен №', x + col.wNo + 6 + col.wDesc + 6, headerY, col.wSN, 'left');
  writeCell(doc, 'Кол.', x + col.wNo + 6 + col.wDesc + 6 + col.wSN + 6, headerY, col.wQty, 'right');
  writeCell(
    doc,
    'Гаранция (м.)',
    x + col.wNo + 6 + col.wDesc + 6 + col.wSN + 6 + col.wQty + 6,
    headerY,
    col.wMonths,
    'right'
  );
  writeCell(
    doc,
    'Валидна до',
    x + col.wNo + 6 + col.wDesc + 6 + col.wSN + 6 + col.wQty + 6 + col.wMonths + 6,
    headerY,
    col.wExpire,
    'right'
  );
  generateHr(doc, headerY + 16);
  doc.font('R').fontSize(8);

  let y = headerY + 20;
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const qty = Number(it.quantity) || 0;
    const months = Number(it.warranty || 0) || 0;

    const expire = months > 0 ? formatDate(addMonths(purchaseDate, months), 'dd.MM.yyyy') : '—';
    const desc = String(it.name ?? '');
    const sn = (it.sn && String(it.sn).trim()) || '—';

    // measure heights (to avoid cutting text)
    const rowHeights = [
      height(doc, String(i + 1), { width: col.wNo, align: 'left' }),
      height(doc, desc, { width: col.wDesc, align: 'left' }),
      height(doc, sn, { width: col.wSN, align: 'left' }),
      height(doc, String(qty), { width: col.wQty, align: 'right' }),
      height(doc, String(months || 0), { width: col.wMonths, align: 'right' }),
      height(doc, expire, { width: col.wExpire, align: 'right' }),
    ].map((h) => Math.max(h, 12));
    const rowH = Math.max(...rowHeights);

    ensureRoom(doc, rowH + layout.table.rowGap, 160);

    let cx = x;
    writeCell(doc, String(i + 1), cx, y, col.wNo, 'left');
    cx += col.wNo + 6;
    writeCell(doc, desc, cx, y, col.wDesc, 'left');
    cx += col.wDesc + 6;
    writeCell(doc, sn, cx, y, col.wSN, 'left');
    cx += col.wSN + 6;
    writeCell(doc, String(qty), cx, y, col.wQty, 'right');
    cx += col.wQty + 6;
    writeCell(doc, String(months || 0), cx, y, col.wMonths, 'right');
    cx += col.wMonths + 6;
    writeCell(doc, expire, cx, y, col.wExpire, 'right');

    generateHr(doc, y + rowH);
    y += rowH + layout.table.rowGap;
    doc.y = y;
  }
}

function generateRepairsLogTable(
  doc: InstanceType<typeof PDFDocument>,
  rows: number = REPAIR_ROWS_COUNT
) {
  doc.moveDown(0.5);
  doc.font('B').fontSize(10).fillColor('#444').text('Дневник на ремонтите', 50, doc.y);
  doc.moveDown(0.3);

  const x = layout.table.x;
  const c = layout.colsRepairs;

  // Header
  doc.font('B').fontSize(9);
  const headerY = doc.y + 6;
  writeCell(doc, 'Дата', x, headerY, c.wDate, 'left');
  writeCell(doc, 'Описание на ремонта / диагностика', x + c.wDate + 6, headerY, c.wAction, 'left');
  writeCell(doc, 'SN', x + c.wDate + 6 + c.wAction + 6, headerY, c.wParts, 'left');
  writeCell(
    doc,
    'Извършил',
    x + c.wDate + 6 + c.wAction + 6 + c.wParts + 6,
    headerY,
    c.wBy,
    'left'
  );
  writeCell(
    doc,
    'Подпис',
    x + c.wDate + 6 + c.wAction + 6 + c.wParts + 6 + c.wBy + 6,
    headerY,
    c.wSign,
    'left'
  );
  generateHr(doc, headerY + 16);
  doc.font('R').fontSize(8);

  // Empty rows
  let y = headerY + 22;
  for (let i = 0; i < rows; i++) {
    ensureRoom(doc, REPAIR_ROW_H + 6, 120);
    drawEmptyRow(doc, x, y, c, REPAIR_ROW_H);
    generateHr(doc, y + REPAIR_ROW_H);
    y += REPAIR_ROW_H + 6;
    doc.y = y;
  }
}

function generateWarrantyNotes(doc: InstanceType<typeof PDFDocument>, notes: string) {
  ensureRoom(doc, 120, 0);
  const startY = Math.max(doc.y + 6, layout.y.footerTopMin - 140);
  const normalizedText = normalizeText(notes);
  doc.font('B').fontSize(10).fillColor('#444').text('Гаранционни условия:', 50, startY);
  doc
    .font('R')
    .fontSize(9)
    .fillColor('#444')
    .text(normalizedText, 50, doc.y + 4, {
      width: 500,
      align: 'justify',
    });
}

// ---------- helpers ----------
function writeCell(
  doc: InstanceType<typeof PDFDocument>,
  text: string,
  x: number,
  y: number,
  w: number,
  align: 'left' | 'right' = 'left'
) {
  doc.text(text ?? '—', x, y, { width: w, align });
}

function drawEmptyRow(
  doc: InstanceType<typeof PDFDocument>,
  x: number,
  y: number,
  c = layout.colsRepairs,
  h: number = 48
) {
  const boxes = [{ w: c.wDate }, { w: c.wAction }, { w: c.wParts }, { w: c.wBy }, { w: c.wSign }];
  let cx = x;
  for (const b of boxes) {
    doc
      .rect(cx, y - 2, b.w, h)
      .strokeColor('#cccccc')
      .lineWidth(0.5)
      .stroke();
    cx += b.w + 6;
  }
}

function normalizeText(s: string) {
  return s
    .replace(/\r\n?/g, '\n') // CRLF/CR -> LF
    .replace(/\u00A0/g, ' ') // NBSP -> space
    .replace(/\u2028|\u2029/g, '\n') // line/para sep -> LF
    .replace(/[ \t]+\n/g, '\n') // remove trailing spaces
    .replace(/\n{3,}/g, '\n\n') // no more than 1 empty line
    .trim();
}

export const runtime = 'nodejs';

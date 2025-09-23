import { readFile } from 'node:fs/promises';
import { lookup as mimeLookup } from 'mime-types';
import sharp from 'sharp';
import { resolveMediaUrlToFsPath } from '@/lib/storage/local';

export async function loadImageForPdf(src: string): Promise<Buffer> {
  // resolve to Buffer
  let buf: Buffer;
  const fsPath = resolveMediaUrlToFsPath(src);
  if (fsPath) buf = await readFile(fsPath);
  else if (/^https?:\/\//i.test(src)) {
    const r = await fetch(src);
    buf = Buffer.from(await r.arrayBuffer());
  } else {
    buf = await readFile(src);
  }

  // ensure png/jpeg for pdfkit
  const mime = mimeLookup(src) || '';
  if (mime === 'image/png' || mime === 'image/jpeg') return buf;

  // convert anything else (svg, webp, etc.) to PNG
  return sharp(buf).png().toBuffer();
}

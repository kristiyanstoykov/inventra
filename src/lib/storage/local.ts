import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const PUBLIC_PREFIX = '/media';
const UPLOAD_ROOT = path.join(process.cwd(), 'uploads');

function extFrom(file: File) {
  const map: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
  };
  const byType = map[file.type];
  if (byType) return byType;
  const m = file.name?.match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toLowerCase() : 'bin';
}

export async function saveLocalFile(file: File, subdir = 'img') {
  const bytes = await file.arrayBuffer();
  const buf = Buffer.from(bytes);
  const ext = extFrom(file);
  const filename = `${Date.now()}-${randomUUID()}.${ext}`;

  const dir = path.join(UPLOAD_ROOT, subdir);
  await mkdir(dir, { recursive: true });

  const fsPath = path.join(dir, filename);
  await writeFile(fsPath, buf, { mode: 0o644 });

  // URL to store in DB
  const url = `${PUBLIC_PREFIX}/${subdir}/${filename}`;
  return { url, fsPath };
}

export async function saveBufferAsLocalFile(buf: Buffer, subdir: string, filename?: string) {
  const dir = path.join(UPLOAD_ROOT, subdir);
  await mkdir(dir, { recursive: true });

  const name = filename ?? `${Date.now()}-${randomUUID()}.pdf`;
  const fsPath = path.join(dir, name);
  await writeFile(fsPath, buf, { mode: 0o644 });

  const url = `${PUBLIC_PREFIX}/${subdir}/${name}`;
  return { url, fsPath };
}

export function resolveMediaUrlToFsPath(mediaUrl: string) {
  if (!mediaUrl.startsWith('/media/')) return null;
  const rel = mediaUrl.replace(/^\/media\//, '');
  return path.join(UPLOAD_ROOT, rel);
}

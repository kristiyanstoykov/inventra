import { readFile, stat } from 'node:fs/promises';
import path, { basename } from 'node:path';
import { NextRequest } from 'next/server';
import { lookup as mimeLookup } from 'mime-types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { slug: string[] } }) {
  const _params = await params;
  const rel = _params.slug.join('/');
  if (rel.includes('..')) return new Response('Bad path', { status: 400 });

  const filePath = path.join(process.cwd(), 'uploads', rel);
  try {
    const data = await readFile(filePath);
    const s = await stat(filePath);
    const ct = mimeLookup(filePath) || 'application/octet-stream';

    const headers: Record<string, string> = {
      'Content-Type': String(ct),
      'Content-Length': String(s.size),
      'Cache-Control': 'public, max-age=31536000, immutable',
    };

    // ?download=1 → attachment
    if (req.nextUrl.searchParams.get('download')) {
      headers['Content-Disposition'] = `attachment; filename="${basename(filePath)}"`;
    }

    return new Response(new Uint8Array(data), { headers });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}

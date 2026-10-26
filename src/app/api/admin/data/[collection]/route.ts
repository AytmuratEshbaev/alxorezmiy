import { NextResponse } from 'next/server';
import { requireAdmin, readJson, jsonError, NO_STORE } from '@/lib/http';
import { listDocuments, createDocument, CrudError } from '@/lib/db/admin-crud';

type Ctx = { params: Promise<{ collection: string }> };

export async function GET(req: Request, { params }: Ctx) {
  const auth = await requireAdmin(req);
  if ('response' in auth) return auth.response;
  const { collection } = await params;
  const url = new URL(req.url);

  const where: Record<string, string> = {};
  for (const w of url.searchParams.getAll('where')) {
    const i = w.indexOf(':');
    if (i > 0) where[w.slice(0, i)] = w.slice(i + 1);
  }
  try {
    const items = await listDocuments(collection, {
      orderBy: url.searchParams.get('orderBy'),
      direction: url.searchParams.get('direction'),
      where,
      limit: Number(url.searchParams.get('limit')) || undefined
    });
    return NextResponse.json({ items }, { headers: NO_STORE });
  } catch (err) {
    if (err instanceof CrudError) return jsonError(err.message, err.status);
    console.error('[admin/data GET]', err);
    return jsonError('Server error', 500);
  }
}

export async function POST(req: Request, { params }: Ctx) {
  const auth = await requireAdmin(req);
  if ('response' in auth) return auth.response;
  const { collection } = await params;
  const body = await readJson<Record<string, unknown>>(req);
  if (!body) return jsonError('Invalid JSON', 400);
  try {
    const res = await createDocument(collection, body);
    return NextResponse.json(res, { status: 201 });
  } catch (err) {
    if (err instanceof CrudError) return jsonError(err.message, err.status);
    console.error('[admin/data POST]', err);
    return jsonError('Server error', 500);
  }
}

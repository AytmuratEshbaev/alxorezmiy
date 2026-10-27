import { NextResponse } from 'next/server';
import { requireAdmin, readJson, jsonError, NO_STORE } from '@/lib/http';
import {
  listDocuments,
  createDocument,
  updateManyDocuments,
  CrudError,
} from '@/lib/db/admin-crud';

type Ctx = { params: Promise<{ collection: string }> };

function handleError(tag: string, err: unknown) {
  if (err instanceof CrudError) return jsonError(err.message, err.status);
  console.error(`[admin/data ${tag}]`, err);
  return jsonError('Server error', 500);
}

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
    const result = await listDocuments(collection, {
      orderBy: url.searchParams.get('orderBy'),
      direction: url.searchParams.get('direction'),
      where,
      limit: Number(url.searchParams.get('limit')) || undefined,
      before: url.searchParams.get('before'),
    });
    return NextResponse.json(result, { headers: NO_STORE });
  } catch (err) {
    return handleError('GET', err);
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
    return handleError('POST', err);
  }
}

/** Ommaviy yangilash: { ids: string[], data: {...} } */
export async function PATCH(req: Request, { params }: Ctx) {
  const auth = await requireAdmin(req);
  if ('response' in auth) return auth.response;
  const { collection } = await params;
  const body = await readJson<{ ids?: unknown; data?: unknown }>(req);
  if (!body || !body.data || typeof body.data !== 'object') return jsonError('Invalid JSON', 400);
  try {
    const updated = await updateManyDocuments(
      collection,
      body.ids,
      body.data as Record<string, unknown>
    );
    return NextResponse.json({ ok: true, updated });
  } catch (err) {
    return handleError('PATCH', err);
  }
}

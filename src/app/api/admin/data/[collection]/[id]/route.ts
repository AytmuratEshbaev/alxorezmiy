import { NextResponse } from 'next/server';
import { requireAdmin, readJson, jsonError } from '@/lib/http';
import { updateDocument, deleteDocument, CrudError } from '@/lib/db/admin-crud';

type Ctx = { params: Promise<{ collection: string; id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const auth = await requireAdmin(req);
  if ('response' in auth) return auth.response;
  const { collection, id } = await params;
  const body = await readJson<Record<string, unknown>>(req);
  if (!body) return jsonError('Invalid JSON', 400);
  try {
    await updateDocument(collection, id, body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof CrudError) return jsonError(err.message, err.status);
    console.error('[admin/data PATCH]', err);
    return jsonError('Server error', 500);
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  const auth = await requireAdmin(req);
  if ('response' in auth) return auth.response;
  const { collection, id } = await params;
  try {
    await deleteDocument(collection, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof CrudError) return jsonError(err.message, err.status);
    console.error('[admin/data DELETE]', err);
    return jsonError('Server error', 500);
  }
}

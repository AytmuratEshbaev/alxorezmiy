import 'server-only';
import { adminDb } from './admin';
import type { News, Teacher, OlympiadResult, FaqItem, GalleryItem, Settings } from '@/types';

function serializeTimestamp(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return String(value);
}

function normalize<T extends { id: string }>(doc: FirebaseFirestore.QueryDocumentSnapshot): T {
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
    createdAt: serializeTimestamp(data.createdAt),
    updatedAt: serializeTimestamp(data.updatedAt)
  } as unknown as T;
}

export async function getNewsList(limit = 50): Promise<News[]> {
  const snap = await adminDb
    .collection('news')
    .where('status', '==', 'published')
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  return snap.docs.map((d) => normalize<News>(d));
}

export async function getNewsById(id: string): Promise<News | null> {
  const doc = await adminDb.collection('news').doc(id).get();
  if (!doc.exists) return null;
  return normalize<News>(doc as FirebaseFirestore.QueryDocumentSnapshot);
}

export async function getNewsIds(): Promise<string[]> {
  const snap = await adminDb
    .collection('news')
    .where('status', '==', 'published')
    .select()
    .get();
  return snap.docs.map((d) => d.id);
}

export async function getTeachers(): Promise<Teacher[]> {
  const snap = await adminDb.collection('teachers').orderBy('order', 'asc').get();
  return snap.docs.map((d) => normalize<Teacher>(d));
}

export async function getOlympiad(): Promise<OlympiadResult[]> {
  const snap = await adminDb.collection('olympiad').get();
  const items = snap.docs.map((d) => normalize<OlympiadResult>(d));
  return items.sort((a, b) => (b.year || 0) - (a.year || 0) || (a.place || 99) - (b.place || 99));
}

export async function getFaq(): Promise<FaqItem[]> {
  const snap = await adminDb.collection('faq').orderBy('order', 'asc').get();
  return snap.docs.map((d) => normalize<FaqItem>(d));
}

export async function getGallery(): Promise<GalleryItem[]> {
  const snap = await adminDb.collection('gallery').get();
  return snap.docs.map((d) => normalize<GalleryItem>(d));
}

export async function getSettings(): Promise<Settings | null> {
  const doc = await adminDb.collection('settings').doc('main').get();
  if (!doc.exists) return null;
  return doc.data() as Settings;
}

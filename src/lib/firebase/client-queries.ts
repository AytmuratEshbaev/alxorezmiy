'use client';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  limit,
  getDocs,
  getDoc,
  serverTimestamp,
  type QueryConstraint,
  type WhereFilterOp
} from 'firebase/firestore';
import { db } from './client';

export interface QueryOptions {
  orderBy?: string;
  direction?: 'asc' | 'desc';
  where?: [string, WhereFilterOp, unknown];
  limit?: number;
}

function buildConstraints(options: QueryOptions = {}): QueryConstraint[] {
  const c: QueryConstraint[] = [];
  if (options.orderBy) c.push(orderBy(options.orderBy, options.direction || 'desc'));
  if (options.where) c.push(where(options.where[0], options.where[1], options.where[2]));
  if (options.limit) c.push(limit(options.limit));
  return c;
}

export function subscribeCollection<T>(
  name: string,
  callback: (items: T[]) => void,
  options: QueryOptions = {}
) {
  const q = query(collection(db, name), ...buildConstraints(options));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T)),
    (err) => console.error(`[${name}] subscribe error:`, err)
  );
}

export async function getDocuments<T>(name: string, options: QueryOptions = {}): Promise<T[]> {
  const q = query(collection(db, name), ...buildConstraints(options));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
}

export async function getDocument<T>(name: string, id: string): Promise<T | null> {
  const snap = await getDoc(doc(db, name, id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : null;
}

export async function addDocument<T extends object>(name: string, data: T) {
  return addDoc(collection(db, name), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function updateDocument<T extends object>(name: string, id: string, data: T) {
  return updateDoc(doc(db, name, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteDocument(name: string, id: string) {
  return deleteDoc(doc(db, name, id));
}

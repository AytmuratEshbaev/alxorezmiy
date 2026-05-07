// ============================================
// FIRESTORE HELPERS — Umumiy CRUD wrapperlar
// ============================================
// Foydalanish:
//   import { addDocument, subscribeCollection } from './firestore-helpers.js';

import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, where, limit,
  getDocs, getDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// firebase-config.js modulini kutadi
function getDb() {
  return new Promise((resolve) => {
    if (window.firebase?.db) return resolve(window.firebase.db);
    const interval = setInterval(() => {
      if (window.firebase?.db) {
        clearInterval(interval);
        resolve(window.firebase.db);
      }
    }, 30);
  });
}

/**
 * Real-time obuna — kolleksiya o'zgarganda callback chaqiriladi
 * @returns {Function} unsubscribe — chaqirilganda obunani to'xtatadi
 */
export async function subscribeCollection(collectionName, callback, options = {}) {
  const db = await getDb();
  let q = collection(db, collectionName);
  const constraints = [];
  if (options.orderBy) {
    constraints.push(orderBy(options.orderBy, options.direction || 'desc'));
  }
  if (options.where) {
    constraints.push(where(...options.where));
  }
  if (options.limit) {
    constraints.push(limit(options.limit));
  }
  if (constraints.length) q = query(q, ...constraints);

  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(items);
  }, (err) => {
    console.error(`[${collectionName}] subscribe error:`, err);
  });
}

export async function getDocuments(collectionName, options = {}) {
  const db = await getDb();
  let q = collection(db, collectionName);
  const constraints = [];
  if (options.orderBy) constraints.push(orderBy(options.orderBy, options.direction || 'desc'));
  if (options.where) constraints.push(where(...options.where));
  if (options.limit) constraints.push(limit(options.limit));
  if (constraints.length) q = query(q, ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getDocument(collectionName, id) {
  const db = await getDb();
  const snap = await getDoc(doc(db, collectionName, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function addDocument(collectionName, data) {
  const db = await getDb();
  return addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function updateDocument(collectionName, id, data) {
  const db = await getDb();
  return updateDoc(doc(db, collectionName, id), {
    ...data,
    updatedAt: serverTimestamp()
  });
}

export async function deleteDocument(collectionName, id) {
  const db = await getDb();
  return deleteDoc(doc(db, collectionName, id));
}

/**
 * Firestore Timestamp -> 'YYYY-MM-DD' format
 */
export function formatDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toISOString().split('T')[0];
}

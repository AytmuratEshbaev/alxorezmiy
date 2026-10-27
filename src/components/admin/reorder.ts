'use client';
import { updateEach } from '@/lib/admin-api';
import { toastError } from '@/components/admin/errors';

interface Orderable {
  id: string;
  order?: number;
}

/**
 * `index`dagi elementni `delta` qadamga siljitadi va butun ro'yxatni 0..n-1 qilib qayta
 * raqamlaydi. Faqat `order`i o'zgarganlar jim (silent) yangilanadi, ro'yxat bir marta yangilanadi.
 */
export async function moveItem<T extends Orderable>(
  collection: string,
  list: T[],
  index: number,
  delta: -1 | 1,
  mutate: (updater: (items: T[]) => T[]) => void,
  reload: () => void
): Promise<void> {
  const target = index + delta;
  if (target < 0 || target >= list.length) return;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  const renumbered = next.map((item, i) => ({ ...item, order: i }));
  const updates = renumbered
    .filter((item, i) => (next[i].order ?? 0) !== i)
    .map((item) => ({ id: item.id, data: { order: item.order } }));
  mutate(() => renumbered);
  try {
    await updateEach(collection, updates);
  } catch (err) {
    toastError(err, 'Tartibni saqlashda xato: ');
    reload();
  }
}

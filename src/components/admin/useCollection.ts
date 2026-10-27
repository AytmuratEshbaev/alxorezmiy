'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getPage, onCollectionChange, type QueryOptions } from '@/lib/admin-api';

export interface UseCollectionOptions<T> {
  orderBy?: string;
  direction?: 'asc' | 'desc';
  where?: QueryOptions['where'];
  /**
   * Sahifa hajmi. `paginate` yoqilganda "Ko'proq yuklash" `createdAt` bo'yicha `before`
   * kursori bilan ishlaydi (faqat createdAt desc tartib uchun).
   */
  pageSize?: number;
  paginate?: boolean;
  /** Klient tomonida qo'shimcha tartiblash (masalan, order → name_uz). */
  sort?: (a: T, b: T) => number;
}

export interface UseCollectionResult<T> {
  items: T[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  reload: () => void;
  loadMore: () => void;
  /** Optimistik yangilash uchun (server javobidan oldin ro'yxatni o'zgartirish). */
  mutate: (updater: (items: T[]) => T[]) => void;
}

const MAX_LIMIT = 1000;

/**
 * Admin ro'yxatlari uchun umumiy hook: yuklanish/xato holati, qayta urinish, sahifalash,
 * yozish amallaridan keyin va oyna qayta ko'ringanda avtomatik yangilanish.
 */
export function useCollection<T extends { id: string; createdAt?: string }>(
  name: string,
  options: UseCollectionOptions<T> = {}
): UseCollectionResult<T> {
  const { orderBy, direction, pageSize = MAX_LIMIT, paginate = false } = options;
  const whereKey = JSON.stringify(options.where ?? {});
  const sortRef = useRef(options.sort);
  sortRef.current = options.sort;

  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const seq = useRef(0);
  const countRef = useRef(0);
  const itemsRef = useRef<T[]>([]);
  itemsRef.current = items;

  const applySort = useCallback((list: T[]) => {
    const s = sortRef.current;
    return s ? [...list].sort(s) : list;
  }, []);

  const load = useCallback(
    (showSpinner: boolean) => {
      const mine = ++seq.current;
      if (showSpinner) setLoading(true);
      // Qayta yuklashda allaqachon ochilgan sahifalarni ham qamrab olamiz.
      const limit = Math.min(MAX_LIMIT, Math.max(pageSize, countRef.current));
      getPage<T>(name, {
        orderBy,
        direction,
        where: JSON.parse(whereKey) as QueryOptions['where'],
        limit,
      })
        .then((page) => {
          if (mine !== seq.current) return;
          countRef.current = page.items.length;
          setItems(applySort(page.items));
          setHasMore(paginate && page.hasMore);
          setError(null);
        })
        .catch((err: Error) => {
          if (mine !== seq.current) return;
          console.error(`[${name}] load error:`, err);
          setError(err.message || 'Yuklashda xatolik');
        })
        .finally(() => {
          if (mine === seq.current) setLoading(false);
        });
    },
    [name, orderBy, direction, whereKey, pageSize, paginate, applySort]
  );

  const reload = useCallback(() => load(true), [load]);

  useEffect(() => {
    countRef.current = 0;
    load(true);
    const off = onCollectionChange(name, () => load(false));
    const onVisible = () => {
      if (document.visibilityState === 'visible') load(false);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps -- so'rov hisoblagichi, DOM ref emas: eskirgan javoblarni bekor qilish uchun ataylab oshiriladi
      seq.current++;
      off();
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [name, load]);

  const loadMore = useCallback(() => {
    const list = itemsRef.current;
    const last = list[list.length - 1];
    if (!paginate || !last?.createdAt) return;
    const mine = ++seq.current;
    setLoadingMore(true);
    getPage<T>(name, {
      orderBy,
      direction,
      where: JSON.parse(whereKey) as QueryOptions['where'],
      limit: Math.min(pageSize, MAX_LIMIT),
      before: last.createdAt,
    })
      .then((page) => {
        if (mine !== seq.current) return;
        setItems((prev) => {
          const seen = new Set(prev.map((i) => i.id));
          const merged = [...prev, ...page.items.filter((i) => !seen.has(i.id))];
          countRef.current = merged.length;
          return applySort(merged);
        });
        setHasMore(page.hasMore);
      })
      .catch((err: Error) => {
        if (mine !== seq.current) return;
        setError(err.message || 'Yuklashda xatolik');
      })
      .finally(() => setLoadingMore(false));
  }, [name, orderBy, direction, whereKey, pageSize, paginate, applySort]);

  const mutate = useCallback((updater: (items: T[]) => T[]) => {
    setItems((prev) => updater(prev));
  }, []);

  return { items, loading, loadingMore, error, hasMore, reload, loadMore, mutate };
}

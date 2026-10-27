'use client';
import type { ReactNode } from 'react';

interface ListStatusProps {
  loading: boolean;
  error: string | null;
  /** Yuklangan yozuvlar soni. */
  total: number;
  /** Filtrdan keyin ko'rinadiganlar soni. */
  shown: number;
  emptyText: ReactNode;
  noMatchText?: ReactNode;
  onRetry: () => void;
  /** Jadval ichida bo'lsa — ustunlar soni (natija <tr><td> ichida chiqadi). */
  colSpan?: number;
}

/** Ro'yxat holati: yuklanmoqda / xato + "Qayta urinish" / bo'sh / topilmadi. */
export function ListStatus({
  loading,
  error,
  total,
  shown,
  emptyText,
  noMatchText = 'Topilmadi',
  onRetry,
  colSpan,
}: ListStatusProps) {
  let content: ReactNode = null;
  if (total === 0 && loading) {
    content = (
      <div className="list-state" role="status">
        Yuklanmoqda...
      </div>
    );
  } else if (total === 0 && error) {
    content = (
      <div className="list-state list-state-error" role="alert">
        <p>Ma&apos;lumotlarni yuklab bo&apos;lmadi: {error}</p>
        <button type="button" className="btn btn-outline btn-sm" onClick={onRetry}>
          Qayta urinish
        </button>
      </div>
    );
  } else if (shown === 0) {
    content = <div className="list-state">{total === 0 ? emptyText : noMatchText}</div>;
  }
  if (!content) return null;
  if (colSpan) {
    return (
      <tr>
        <td colSpan={colSpan} className="list-state-cell">
          {content}
        </td>
      </tr>
    );
  }
  return content;
}

/** Ro'yxat bor, lekin yangilash/keyingi sahifa xato bergan holat. */
export function ListErrorBanner({
  error,
  hasItems,
  onRetry,
}: {
  error: string | null;
  hasItems: boolean;
  onRetry: () => void;
}) {
  if (!error || !hasItems) return null;
  return (
    <div className="alert alert-error" role="alert">
      <span>Yangilashda xatolik: {error}</span>
      <button type="button" className="btn btn-outline btn-sm" onClick={onRetry}>
        Qayta urinish
      </button>
    </div>
  );
}

export function LoadMoreButton({
  hasMore,
  loadingMore,
  onLoadMore,
}: {
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
}) {
  if (!hasMore) return null;
  return (
    <div className="load-more">
      <button type="button" className="btn btn-outline" onClick={onLoadMore} disabled={loadingMore}>
        {loadingMore ? 'Yuklanmoqda...' : "Ko'proq yuklash"}
      </button>
    </div>
  );
}

import { Link } from '@/i18n/routing';
import { getLocalizedField, formatDate } from '@/lib/utils';
import { transformImage } from '@/lib/imagekit';
import type { News, Locale } from '@/types';

export default function NewsCard({ item, locale }: { item: News; locale: Locale }) {
  const title = getLocalizedField(item, 'title', locale);
  const content = getLocalizedField(item, 'content', locale);
  return (
    <Link
      href={`/news/${item.id}` as never}
      className="card card-hover news-card"
      style={{ textDecoration: 'none', color: 'inherit', display: 'block', padding: 0, overflow: 'hidden' }}
    >
      {item.image && (
        <div className="card-img">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={transformImage(item.image, { width: 600 })} alt={title} loading="lazy" />
        </div>
      )}
      <div className="news-card-body" style={{ padding: 'var(--space-lg)' }}>
        <div className="card-meta">
          <span className="card-category">{item.category}</span>
          <span className="card-date">{formatDate(item.createdAt)}</span>
        </div>
        <h3>{title}</h3>
        <p>{content.substring(0, 120)}{content.length > 120 ? '…' : ''}</p>
      </div>
    </Link>
  );
}

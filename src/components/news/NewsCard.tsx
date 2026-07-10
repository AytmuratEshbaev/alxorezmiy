import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { getLocalizedField, formatDate, formatDateISO } from '@/lib/utils';
import { transformImage } from '@/lib/imagekit';
import type { News, Locale } from '@/types';

export default function NewsCard({
  item,
  locale,
  className = '',
}: {
  item: News;
  locale: Locale;
  className?: string;
}) {
  const t = useTranslations('news_page.category');
  const tCommon = useTranslations('common');
  const title = getLocalizedField(item, 'title', locale);
  const content = getLocalizedField(item, 'content', locale);
  const categoryLabel =
    item.category === 'events' || item.category === 'announcements'
      ? t(item.category)
      : item.category;
  return (
    <Link
      href={`/news/${item.id}` as never}
      className={`card card-hover news-card${className ? ` ${className}` : ''}`}
    >
      {item.image && (
        <div className="card-img">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={transformImage(item.image, { width: 600 })} alt={title} loading="lazy" />
        </div>
      )}
      <div className="news-card-body">
        <div className="card-meta">
          <span className="card-category">{categoryLabel}</span>
          <time className="card-date" dateTime={formatDateISO(item.createdAt)}>
            {formatDate(item.createdAt, locale)}
          </time>
        </div>
        <h3>{title}</h3>
        <p>
          {content.substring(0, 120)}
          {content.length > 120 ? '…' : ''}
        </p>
        <span className="read-more">{tCommon('read_more')}</span>
      </div>
    </Link>
  );
}

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { fallbackLang, formatDate, formatDateISO, getLocalizedField, newsDate } from '@/lib/utils';
import type { News, Locale } from '@/types';

/** Server va client (NewsLoadMore) tomonida ishlatiladi — xabarlar: news_page.category, common. */
export default function NewsCard({
  item,
  locale,
  className = '',
  priority = false,
}: {
  item: News;
  locale: Locale;
  className?: string;
  priority?: boolean;
}) {
  const t = useTranslations('news_page.category');
  const tCommon = useTranslations('common');
  const title = getLocalizedField(item, 'title', locale);
  // Ro'yxat so'rovlari content_* ni ~400 belgigacha qisqartirib beradi — excerpt uchun yetarli.
  const content = getLocalizedField(item, 'content', locale);
  const date = newsDate(item);
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
          <Image
            src={item.image}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
          />
        </div>
      )}
      <div className="news-card-body">
        <div className="card-meta">
          <span className="card-category">{categoryLabel}</span>
          {date && (
            <time className="card-date" dateTime={formatDateISO(date)}>
              {formatDate(date, locale)}
            </time>
          )}
        </div>
        <h3 lang={fallbackLang(item, 'title', locale)}>{title}</h3>
        <p lang={fallbackLang(item, 'content', locale)}>
          {content.length > 120 ? `${content.substring(0, 120).trimEnd()}…` : content}
        </p>
        <span className="read-more" aria-hidden="true">
          {tCommon('read_more')}
        </span>
      </div>
    </Link>
  );
}

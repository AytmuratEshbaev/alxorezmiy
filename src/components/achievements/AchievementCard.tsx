import { useTranslations } from 'next-intl';
import type { OlympiadResult } from '@/types';

const LEVEL_KEY: Record<string, string> = {
  xalqaro: 'level_international',
  respublika: 'level_republic',
  shahar: 'level_city',
  tuman: 'level_district'
};

export default function AchievementCard({ item }: { item: OlympiadResult }) {
  const t = useTranslations('achievements');
  const tCommon = useTranslations('common');
  const levelLabel = LEVEL_KEY[item.level] ? t(LEVEL_KEY[item.level] as never) : item.level;
  const place = Number(item.place);
  const placeBg =
    place === 1 ? 'rgba(245,158,11,.12)' :
    place === 2 ? 'rgba(148,163,184,.15)' :
    place === 3 ? 'rgba(180,121,87,.15)' :
    'var(--navy-soft)';
  const placeFg =
    place === 1 ? 'var(--amber-text)' :
    place === 2 ? 'var(--ink-2)' :
    place === 3 ? '#8B5A2B' :
    'var(--navy)';
  const placeBorder =
    place === 1 ? 'rgba(245,158,11,.35)' :
    place === 2 ? 'rgba(148,163,184,.4)' :
    place === 3 ? 'rgba(180,121,87,.4)' :
    'var(--navy-line)';

  return (
    <div
      className="card card-hover"
      style={{
        padding: 'var(--s-6)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--s-2)',
        borderTop: `3px solid ${placeBorder}`
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--s-1)',
            padding: '4px var(--s-3)',
            borderRadius: 'var(--r-pill)',
            background: placeBg,
            color: placeFg,
            fontWeight: 700,
            fontSize: '.9375rem'
          }}
          aria-label={`${item.place} ${tCommon('place')}`}
        >
          {item.place} {tCommon('place')}
        </span>
        <span
          className="card-category"
          style={{
            fontSize: '0.75rem',
            padding: '4px 10px',
            borderRadius: 'var(--r-pill)',
            background: 'var(--navy-soft)',
            color: 'var(--navy)'
          }}
        >
          {levelLabel}
        </span>
      </div>
      <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{item.student}</h3>
      <p style={{ margin: 0, color: 'var(--primary)', fontWeight: 600 }}>{item.subject}</p>
      {item.olympiad_name && (
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>
          {item.olympiad_name} · {item.year}
        </p>
      )}
    </div>
  );
}

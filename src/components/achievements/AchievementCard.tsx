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
  const isGold = Number(item.place) === 1;

  return (
    <div className="card" style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span
          className={`place-medal${isGold ? ' is-gold' : ''}`}
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: isGold ? 'var(--amber, #f59e0b)' : 'var(--primary)'
          }}
        >
          {item.place} {tCommon('place')}
        </span>
        <span
          className="card-category"
          style={{
            fontSize: '0.75rem',
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--primary-light, rgba(0,0,0,0.05))'
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

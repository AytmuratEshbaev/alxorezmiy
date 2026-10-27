import { useTranslations } from 'next-intl';
import Icon, { type IconName } from '@/components/ui/Icon';
import type { OlympiadResult } from '@/types';

const LEVEL_KEY: Record<string, string> = {
  xalqaro: 'level_international',
  respublika: 'level_republic',
  shahar: 'level_city',
  tuman: 'level_district',
};

const LEVEL_ICON: Record<string, IconName> = {
  xalqaro: 'globe',
  respublika: 'landmark',
  shahar: 'building',
  tuman: 'home-group',
};

export default function AchievementCard({ item }: { item: OlympiadResult }) {
  const t = useTranslations('achievements');
  const tCommon = useTranslations('common');
  const levelLabel = LEVEL_KEY[item.level] ? t(LEVEL_KEY[item.level] as never) : item.level;
  const levelIcon = LEVEL_ICON[item.level];
  const place = Number(item.place);
  const placeAttr = place === 1 || place === 2 || place === 3 ? place : undefined;
  const placeLabel = Number.isFinite(place) && place > 0 ? tCommon('place_ordinal', { place }) : '';
  // Olimpiada nomi bo'lmasa ham yil ko'rsatiladi.
  const meta = [item.olympiad_name, item.year ? String(item.year) : ''].filter(Boolean).join(' · ');

  return (
    <div className="card card-hover achievement-card" data-place={placeAttr}>
      <div className="achievement-card-head">
        {placeLabel && <span className="achievement-card-badge">{placeLabel}</span>}
        <span className="achievement-card-level">
          {levelIcon && <Icon name={levelIcon} size={14} />}
          {levelLabel}
        </span>
      </div>
      <h3 className="achievement-card-student">{item.student}</h3>
      <p className="achievement-card-subject">{item.subject}</p>
      {meta && <p className="achievement-card-meta">{meta}</p>}
    </div>
  );
}

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { fallbackLang, getLocalizedField } from '@/lib/utils';
import type { Teacher, Locale } from '@/types';

const ACHIEVEMENT_TYPES = ['olympiad', 'certificate', 'competition', 'diploma', 'other'] as const;

export default function TeacherCard({ item, locale }: { item: Teacher; locale: Locale }) {
  const t = useTranslations('teachers_page');
  const name = getLocalizedField(item, 'name', locale);
  const subject = getLocalizedField(item, 'subject', locale);
  const experience = Number(item.experience);
  const achievements = (item.achievements ?? []).filter((a) => a && a.title);

  return (
    // Qidiruvdan `/teachers#teacher-<id>` havolasi shu kartaga olib keladi.
    <article id={`teacher-${item.id}`} className="card card-hover teacher-card">
      {item.photo && (
        <div className="card-img teacher-card-photo">
          <Image
            src={item.photo}
            alt={name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
            style={{ objectFit: 'cover' }}
          />
        </div>
      )}
      <div className="teacher-card-body">
        <h3 lang={fallbackLang(item, 'name', locale)}>{name}</h3>
        {subject && (
          <p className="teacher-card-subject" lang={fallbackLang(item, 'subject', locale)}>
            {subject}
          </p>
        )}
        {item.category && <p className="teacher-card-meta">{item.category}</p>}
        {Number.isFinite(experience) && experience > 0 && (
          <p className="teacher-card-meta">{t('experience_years', { count: experience })}</p>
        )}
        {achievements.length > 0 && (
          <div className="teacher-achievements">
            <h4 className="teacher-achievements-title">{t('achievements_label')}</h4>
            <ul>
              {achievements.map((a, i) => {
                const type = (ACHIEVEMENT_TYPES as readonly string[]).includes(a.type)
                  ? a.type
                  : 'other';
                return (
                  <li key={`${type}-${i}`}>
                    <span className="teacher-achievement-type">
                      {t(`achievement_types.${type}` as never)}
                    </span>
                    <span className="teacher-achievement-title">{a.title}</span>
                    {a.year ? <span className="teacher-achievement-year">{a.year}</span> : null}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </article>
  );
}

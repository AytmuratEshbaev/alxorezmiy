import { getLocalizedField } from '@/lib/utils';
import { transformImage } from '@/lib/imagekit';
import { useTranslations } from 'next-intl';
import type { Teacher, Locale } from '@/types';

export default function TeacherCard({ item, locale }: { item: Teacher; locale: Locale }) {
  const t = useTranslations('teachers_page');
  const name = getLocalizedField(item, 'name', locale);
  return (
    <div className="card card-hover teacher-card" style={{ padding: 0, overflow: 'hidden' }}>
      {item.photo && (
        <div className="card-img" style={{ aspectRatio: '3 / 4' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={transformImage(item.photo, { width: 500 })}
            alt={name}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      )}
      <div style={{ padding: 'var(--s-6)' }}>
        <h3 style={{ marginBottom: 'var(--s-1)' }}>{name}</h3>
        <p style={{ color: 'var(--primary)', fontWeight: 600, marginBottom: 'var(--s-2)' }}>
          {item.subject}
        </p>
        {item.category && (
          <p style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)', marginBottom: 'var(--s-1)' }}>
            {item.category}
          </p>
        )}
        {item.experience > 0 && (
          <p style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)', margin: 0 }}>
            {item.experience} {t('experience')}
          </p>
        )}
      </div>
    </div>
  );
}

import { useTranslations } from 'next-intl';
import EmptyState from '@/components/ui/EmptyState';
import type { CertificateItem } from '@/types';

const TYPE_ORDER = ['ielts', 'sat', 'cefr', 'milliy'] as const;

const KNOWN_SUBJECTS = new Set([
  'english',
  'math',
  'uzbek',
  'history',
  'biology',
  'chemistry',
  'russian',
  'karakalpak',
  'physics',
]);

export default function CertificatesSection({ items }: { items: CertificateItem[] }) {
  const t = useTranslations('certificates');

  if (items.length === 0) {
    return (
      <EmptyState
        icon="trophy"
        title={t('empty_title')}
        text={t('empty_text')}
      />
    );
  }

  const grouped = new Map<string, CertificateItem[]>();
  for (const item of items) {
    const key = item.type || 'milliy';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(item);
  }

  const stats = TYPE_ORDER.filter((type) => (grouped.get(type)?.length ?? 0) > 0).map((type) => ({
    key: type,
    label: t(`types.${type}` as never),
    count: grouped.get(type)!.length,
  }));

  const groupKeys = [
    ...TYPE_ORDER.filter((type) => (grouped.get(type)?.length ?? 0) > 0),
    ...Array.from(grouped.keys()).filter(
      (k) => !TYPE_ORDER.includes(k as (typeof TYPE_ORDER)[number])
    ),
  ];

  return (
    <div className="cert-section">
      {stats.length > 0 && (
        <div className="cert-stats">
          {stats.map(({ key, label, count }) => (
            <div key={key} className="cert-stat-chip">
              <span className="cert-stat-count">{count}</span>
              <span className="cert-stat-label">{label}</span>
            </div>
          ))}
        </div>
      )}

      {groupKeys.map((groupKey) => {
        const groupItems = grouped.get(groupKey) || [];
        const isKnown = TYPE_ORDER.includes(groupKey as (typeof TYPE_ORDER)[number]);
        const typeLabel = isKnown ? t(`types.${groupKey}` as never) : groupKey;

        return (
          <div key={groupKey} className="cert-group">
            <h3 className="cert-group-title">
              {typeLabel} <span className="cert-group-count">({groupItems.length})</span>
            </h3>
            <ul className="cert-list">
              {groupItems.map((item) => {
                const subjectLabel =
                  item.subject && KNOWN_SUBJECTS.has(item.subject)
                    ? t(`subjects.${item.subject}` as never)
                    : item.subject;

                return (
                  <li key={item.id} className="cert-row">
                    <div className="cert-student-info">
                      <strong className="cert-student">{item.student}</strong>
                      {subjectLabel ? (
                        <span className="cert-subject">{subjectLabel}</span>
                      ) : null}
                    </div>
                    <div className="cert-meta">
                      {item.score ? (
                        <span className="cert-badge">{item.score}</span>
                      ) : null}
                      {item.year ? (
                        <span className="cert-year">{item.year}</span>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

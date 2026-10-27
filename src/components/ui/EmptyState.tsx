import Icon, { type IconName } from './Icon';

/**
 * "Hozircha ma'lumot yo'q" bloki. Server va client komponentlarda ishlaydi.
 * `compact` — grid/karusel ichida (sarlavha <p>), aks holda sahifa darajasida (<h2>).
 */
export default function EmptyState({
  icon,
  title,
  text,
  compact = false,
}: {
  icon: IconName;
  title: string;
  text?: string;
  compact?: boolean;
}) {
  return (
    <div role="status" className={`empty-state${compact ? ' empty-state-compact' : ''}`}>
      <Icon name={icon} size={compact ? 44 : 48} className="empty-state-icon" />
      {compact ? (
        <p className="empty-state-title">{title}</p>
      ) : (
        <h2 className="empty-state-title">{title}</h2>
      )}
      {text && <p className="empty-state-text">{text}</p>}
    </div>
  );
}

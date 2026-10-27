/** Admin panelda ishlatiladigan kategoriya/daraja/holat yorliqlari — bitta joyda. */

export interface Option {
  value: string;
  label: string;
}

const toMap = (opts: Option[]): Record<string, string> =>
  Object.fromEntries(opts.map((o) => [o.value, o.label]));

export const NEWS_CATEGORIES: Option[] = [
  { value: 'announcements', label: "📢 E'lon" },
  { value: 'events', label: '🎉 Tadbir' },
];
export const NEWS_CATEGORY_LABELS = toMap(NEWS_CATEGORIES);

export const NEWS_STATUSES: Option[] = [
  { value: 'published', label: 'Nashr etilgan' },
  { value: 'draft', label: 'Qoralama' },
];
export const NEWS_STATUS_LABELS = toMap(NEWS_STATUSES);

export const FAQ_CATEGORIES: Option[] = [
  { value: 'admission', label: '📝 Qabul' },
  { value: 'education', label: "📚 Ta'lim" },
  { value: 'general', label: '💬 Umumiy' },
];
export const FAQ_CATEGORY_LABELS = toMap(FAQ_CATEGORIES);

export const GALLERY_CATEGORIES: Option[] = [
  { value: 'building', label: '🏛 Bino' },
  { value: 'lessons', label: '📚 Darslar' },
  { value: 'sports', label: '⚽ Sport' },
  { value: 'events', label: '🎉 Tadbirlar' },
];
export const GALLERY_CATEGORY_LABELS = toMap(GALLERY_CATEGORIES);

export const OLYMPIAD_LEVELS: Option[] = [
  { value: 'xalqaro', label: '🌍 Xalqaro' },
  { value: 'respublika', label: '🏛️ Respublika' },
  { value: 'shahar', label: '🏙️ Shahar' },
  { value: 'tuman', label: '🏘️ Tuman' },
];
export const OLYMPIAD_LEVEL_LABELS = toMap(OLYMPIAD_LEVELS);

export const APPLICATION_STATUSES: Option[] = [
  { value: 'new', label: 'Yangi' },
  { value: 'contacted', label: "Bog'lanildi" },
  { value: 'accepted', label: 'Qabul qilindi' },
  { value: 'rejected', label: 'Rad etildi' },
];
export const APPLICATION_STATUS_LABELS = toMap(APPLICATION_STATUSES);

export const ACHIEVEMENT_TYPES: Option[] = [
  { value: 'olympiad', label: '🏆 Olimpiada' },
  { value: 'certificate', label: '📜 Sertifikat' },
  { value: 'competition', label: '🥇 Musobaqa' },
  { value: 'diploma', label: '🎓 Diplom' },
  { value: 'other', label: '⭐ Boshqa' },
];

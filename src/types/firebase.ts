export type Locale = 'uz' | 'ru' | 'kk' | 'en';

export interface LocalizedFields {
  [key: `${string}_${Locale}`]: string | undefined;
}

export interface News extends LocalizedFields {
  id: string;
  title_uz: string;
  title_ru?: string;
  title_kk?: string;
  title_en?: string;
  content_uz: string;
  content_ru?: string;
  content_kk?: string;
  content_en?: string;
  image?: string;
  category: 'events' | 'announcements' | string;
  status: 'published' | 'draft';
  createdAt: string | { toDate: () => Date };
  updatedAt?: string | { toDate: () => Date };
}

export interface Teacher extends LocalizedFields {
  id: string;
  name_uz: string;
  name_ru?: string;
  name_kk?: string;
  name_en?: string;
  subject: string;
  category: string;
  experience: number;
  photo?: string;
  order: number;
}

export interface OlympiadResult {
  id: string;
  student: string;
  subject: string;
  level: 'xalqaro' | 'respublika' | 'shahar' | 'tuman' | string;
  place: number;
  olympiad_name?: string;
  year: number;
}

export interface FaqItem extends LocalizedFields {
  id: string;
  question_uz: string;
  question_ru?: string;
  question_kk?: string;
  question_en?: string;
  answer_uz: string;
  answer_ru?: string;
  answer_kk?: string;
  answer_en?: string;
  category: string;
  order: number;
}

export interface GalleryItem extends LocalizedFields {
  id: string;
  url: string;
  caption_uz: string;
  caption_ru?: string;
  caption_kk?: string;
  caption_en?: string;
  category: string;
}

export interface Settings extends LocalizedFields {
  address?: string;
  phone?: string;
  email?: string;
  hours?: string;
  telegram?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
  students_count?: number;
  teachers_count?: number;
  experience_years?: number;
  olympiad_winners?: number;
  fullName_uz?: string;
  fullName_ru?: string;
  fullName_kk?: string;
  fullName_en?: string;
  shortName_uz?: string;
  shortName_ru?: string;
  shortName_kk?: string;
  shortName_en?: string;
}

export interface Message {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read?: boolean;
  createdAt: string | { toDate: () => Date };
}

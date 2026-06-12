import axios from 'axios';
import { useAdminAuthStore } from '../../../stores/auth.store';

export const API = import.meta.env.VITE_API_URL ?? 'https://api.jothisham.com/api/v1';
export const hdr = () => ({ Authorization: `Bearer ${useAdminAuthStore.getState().accessToken}` });

export type Lang = 'en' | 'ta' | 'hi' | 'te' | 'ml' | 'kn';
export const LANGS: Lang[] = ['en', 'ta', 'hi', 'te', 'ml', 'kn'];
export type LangMap = Partial<Record<Lang, string>>;

export const LANG_LABELS: Record<Lang, { short: string; native: string; english: string }> = {
  en: { short: 'EN', native: 'English',   english: 'English'   },
  ta: { short: 'TA', native: 'தமிழ்',     english: 'Tamil'     },
  hi: { short: 'HI', native: 'हिंदी',     english: 'Hindi'     },
  te: { short: 'TE', native: 'తెలుగు',    english: 'Telugu'    },
  ml: { short: 'ML', native: 'മലയാളം',   english: 'Malayalam' },
  kn: { short: 'KN', native: 'ಕನ್ನಡ',    english: 'Kannada'   },
};

export const EMPTY_LANG_MAP: LangMap = {};

export const CMS_SECTION = 'books';

export interface CmsSection {
  _id: string;
  type: string;
  name: LangMap;
  description?: LangMap;
  icon?: string;
  isActive: boolean;
  enabledLanguages: Lang[];
  sortOrder: number;
}

export interface CmsCategory {
  _id: string;
  sectionType: string;
  slug: string;
  name: LangMap;
  description?: LangMap;
  cardImageUrl?: string;
  sortOrder: number;
  isActive: boolean;
  isFeatured: boolean;
}

export interface CmsSubCategory {
  _id: string;
  categoryId: string;
  sectionType: string;
  slug: string;
  name: LangMap;
  description?: LangMap;
  cardImageUrl?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface CmsContentBody {
  json: unknown;
  html: string;
}

export interface CmsContentSummary {
  _id: string;
  slug: string;
  title: string;
  language: Lang;
  categoryId: string;
  categorySlug: string;
  subCategoryId?: string | null;
  subCategorySlug?: string | null;
  coverImageUrl?: string;
  excerpt?: string;
  isPublished: boolean;
  viewCount: number;
  updatedAt: string;
}

export interface CmsContent extends CmsContentSummary {
  sectionType: string;
  body: CmsContentBody;
  author?: string;
  tags: string[];
  publishedAt?: string | null;
}

export async function uploadCmsImage(file: File): Promise<string> {
  const body = new FormData();
  body.append('file', file);
  const res = await axios.post(`${API}/admin/cms/upload`, body, { headers: hdr() });
  return res.data.data.url as string;
}

import type { PlanetId, PlanLimits, Language } from './types';

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    horoscopesPerMonth: 3,
    aiTokensPerMonth: 5_000,
    pdfsPerMonth: 0,
    advancedCharts: false,
    marriageMatching: false,
    appointmentBooking: false,
    grahaVisualization: 'basic',
  },
  pro: {
    horoscopesPerMonth: 30,
    aiTokensPerMonth: 50_000,
    pdfsPerMonth: 10,
    advancedCharts: true,
    marriageMatching: true,
    appointmentBooking: true,
    grahaVisualization: 'full',
  },
  premium: {
    horoscopesPerMonth: 999_999,
    aiTokensPerMonth: 500_000,
    pdfsPerMonth: 999_999,
    advancedCharts: true,
    marriageMatching: true,
    appointmentBooking: true,
    grahaVisualization: 'full',
    prioritySupport: true,
    whiteLabel: true,
  },
} as const;

export const PLANETS: Record<PlanetId, { name: string; symbol: string; color: string }> = {
  SU: { name: 'Sun',     symbol: '☉', color: '#F59E0B' },
  MO: { name: 'Moon',    symbol: '☽', color: '#CBD5E1' },
  MA: { name: 'Mars',    symbol: '♂', color: '#EF4444' },
  ME: { name: 'Mercury', symbol: '☿', color: '#10B981' },
  JU: { name: 'Jupiter', symbol: '♃', color: '#F59E0B' },
  VE: { name: 'Venus',   symbol: '♀', color: '#EC4899' },
  SA: { name: 'Saturn',  symbol: '♄', color: '#8B5CF6' },
  RA: { name: 'Rahu',    symbol: 'ℛ', color: '#6366F1' },
  KE: { name: 'Ketu',    symbol: 'Ƙ', color: '#94A3B8' },
};

export const PLANET_IDS: PlanetId[] = ['SU', 'MO', 'MA', 'ME', 'JU', 'VE', 'SA', 'RA', 'KE'];

export const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
] as const;

export const SUPPORTED_LANGUAGES: Record<Language, { name: string; nativeName: string; rtl: boolean }> = {
  en: { name: 'English',   nativeName: 'English',  rtl: false },
  ta: { name: 'Tamil',     nativeName: 'தமிழ்',     rtl: false },
  hi: { name: 'Hindi',     nativeName: 'हिन्दी',     rtl: false },
  te: { name: 'Telugu',    nativeName: 'తెలుగు',    rtl: false },
  ml: { name: 'Malayalam', nativeName: 'മലയാളം',   rtl: false },
  kn: { name: 'Kannada',   nativeName: 'ಕನ್ನಡ',     rtl: false },
};

export const USER_ROLES = {
  ADMIN: 'admin',
  ASTROLOGER: 'astrologer',
  CUSTOMER: 'customer',
} as const;

export const AI_CATEGORIES = ['general', 'marriage', 'career', 'health', 'finance'] as const;
export type AiCategory = typeof AI_CATEGORIES[number];

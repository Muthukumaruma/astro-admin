// ─── Roles & Plans ───────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'astrologer' | 'customer';
export type SubscriptionPlan = 'free' | 'pro' | 'premium';
export type UserStatus = 'active' | 'suspended' | 'pending_verification';
export type Language = 'en' | 'ta' | 'hi' | 'te' | 'ml' | 'kn';
export type Theme = 'dark' | 'light';

export type AdminRole = 'super_admin' | 'content_admin' | 'support_admin' | 'finance_admin';

// ─── Planets ─────────────────────────────────────────────────────────────────

export type PlanetId = 'SU' | 'MO' | 'MA' | 'ME' | 'JU' | 'VE' | 'SA' | 'RA' | 'KE';

export interface PlanetPosition {
  id: PlanetId;
  name: string;
  sign: string;
  signNumber: number;
  house: number;
  degree: number;
  retrograde: boolean;
  nakshatra: string;
  nakshatraPada: number;
  isExalted: boolean;
  isDebilitated: boolean;
  isOwnSign: boolean;
}

export interface HousePosition {
  number: number;
  sign: string;
  signNumber: number;
  degree: number;
  lord: PlanetId;
}

export interface DashaPeriod {
  planet: PlanetId;
  planetName: string;
  startDate: string;
  endDate: string;
}

export interface Yoga {
  name: string;
  type: 'raj' | 'dhana' | 'marriage' | 'career' | 'spiritual' | 'negative';
  planets: PlanetId[];
  houses: number[];
  description: string;
  strength: 'strong' | 'moderate' | 'weak';
}

export interface Dosha {
  name: string;
  present: boolean;
  severity: 'low' | 'medium' | 'high';
  cause: string;
  remedy: string;
}

export interface BirthData {
  name: string;
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth: string;
  latitude: number;
  longitude: number;
  timezone: string;
  gender: 'male' | 'female' | 'other';
  language?: Language;
}

export interface CalculatedChart {
  ascendant: { sign: string; signNumber: number; degree: number };
  planets: PlanetPosition[];
  houses: HousePosition[];
  dashas: { current: DashaPeriod; sequence: DashaPeriod[] };
  yogas: Yoga[];
  doshas: Dosha[];
  shadbala: ShadbalaEntry[];
}

export interface ShadbalaEntry {
  planetId: PlanetId;
  totalStrength: number;
  sthanaStrength: number;
  digStrength: number;
  kalaStrength: number;
  naisargikStrength: number;
  drikStrength: number;
  requisiteStrength: number;
  ratio: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  code: string;
  statusCode: number;
  upgrade?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface JwtPayload {
  sub: string;
  role: UserRole;
  plan: SubscriptionPlan;
  iat: number;
  exp: number;
}

export interface AuthTokens {
  accessToken: string;
  expiresIn: number;
}

export interface PlanLimits {
  horoscopesPerMonth: number;
  aiTokensPerMonth: number;
  pdfsPerMonth: number;
  advancedCharts: boolean;
  marriageMatching: boolean;
  appointmentBooking: boolean;
  grahaVisualization: 'basic' | 'full';
  prioritySupport?: boolean;
  whiteLabel?: boolean;
}

export interface UsageStats {
  horoscopesGenerated: number;
  aiTokensUsed: number;
  pdfsExported: number;
  resetAt: string;
}

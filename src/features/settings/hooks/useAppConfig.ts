import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useAdminAuthStore } from '../../../stores/auth.store';

const API = import.meta.env.VITE_API_URL ?? 'https://api.jothisham.com/api/v1';
const hdr = () => ({ Authorization: `Bearer ${useAdminAuthStore.getState().accessToken}` });

export interface AppConfig {
  allowScreenshots:         boolean;
  screenshotBlockedScreens: string[];
  maintenanceMode:          boolean;
  jothishamAiEnabled:       boolean;
  referralEnabled:          boolean;
  referralRewardThreshold:  number;
  referralRewardDays:       number;
  referralRewardPlan:       string;
  guestAccessGates:         Record<string, boolean>;
  minAppVersion:            { android: string; ios: string };
  updateUrl:                { android: string; ios: string };
  aiMarketingEnabled:          boolean;
  aiMarketingPrompt:           string;
  aiMarketingTimeUTC:          string;
  aiMarketingAudience:         string;
  aiMarketingTargetScreen:     string;
  aiMarketingLastGeneratedDate?: string;
}

export function useAppConfig() {
  return useQuery<AppConfig>({
    queryKey: ['app-config'],
    queryFn: () => axios.get(`${API}/app-config`, { headers: hdr() }).then(r => r.data.data),
  });
}

// Each settings page only saves its own slice — the backend PUT already
// only updates fields present in the body, leaving everything else untouched.
export function useSaveAppConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<AppConfig>) => axios.put(`${API}/app-config`, patch, { headers: hdr() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['app-config'] }); alert('✅ Saved'); },
  });
}

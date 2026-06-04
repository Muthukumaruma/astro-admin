import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Camera, Shield, Wrench, Save } from 'lucide-react';
import { useAdminAuthStore } from '../../../stores/auth.store';

const API = import.meta.env.VITE_API_URL ?? 'https://api.jothisham.com/api/v1';
const hdr = () => ({ Authorization: `Bearer ${useAdminAuthStore.getState().accessToken}` });

const APP_SCREENS = [
  { key: 'Dashboard',       label: 'Home / Dashboard',    group: 'Main' },
  { key: 'DailyHoroscope',  label: 'Daily Horoscope',     group: 'Main' },
  { key: 'BalanHub',        label: 'Balan Hub',           group: 'Main' },
  { key: 'HoroscopeList',   label: 'Jathagam List',       group: 'Jathagam' },
  { key: 'HoroscopeDetail', label: 'Jathagam Detail',     group: 'Jathagam' },
  { key: 'CreateHoroscope', label: 'Create Jathagam',     group: 'Jathagam' },
  { key: 'KocharamCompare', label: 'Kocharam Compare',    group: 'Jathagam' },
  { key: 'Panchangam',      label: 'Panchangam',          group: 'Panchangam' },
  { key: 'MarriageMatching',label: 'Marriage Matching',   group: 'Matching' },
  { key: 'RasiBalan',       label: 'Rasi Balan',          group: 'Balan' },
  { key: 'VeeduBalan',      label: 'Veedu Balan',         group: 'Balan' },
  { key: 'NallaNeram',      label: 'Nalla Neram / Horai', group: 'Tools' },
  { key: 'Remedies',        label: 'Remedies',            group: 'Tools' },
  { key: 'Settings',        label: 'Settings',            group: 'Account' },
];

const GROUPS = [...new Set(APP_SCREENS.map(s => s.group))];

interface AppConfig {
  allowScreenshots:         boolean;
  screenshotBlockedScreens: string[];
  maintenanceMode:          boolean;
}

export default function AdminSettingsPage() {
  const qc = useQueryClient();
  const { data: cfg, isLoading } = useQuery<AppConfig>({
    queryKey: ['app-config'],
    queryFn:  () => axios.get(`${API}/app-config`, { headers: hdr() }).then(r => r.data.data),
  });

  const [allowScreenshots,         setAllowScreenshots]         = useState<boolean | null>(null);
  const [screenshotBlockedScreens, setScreenshotBlockedScreens] = useState<string[] | null>(null);
  const [maintenanceMode,          setMaintenanceMode]          = useState<boolean | null>(null);

  const currentAllow   = allowScreenshots         ?? cfg?.allowScreenshots         ?? true;
  const currentBlocked = screenshotBlockedScreens ?? cfg?.screenshotBlockedScreens ?? [];
  const currentMaint   = maintenanceMode          ?? cfg?.maintenanceMode          ?? false;

  const saveMutation = useMutation({
    mutationFn: () => axios.put(`${API}/app-config`, {
      allowScreenshots:         currentAllow,
      screenshotBlockedScreens: currentBlocked,
      maintenanceMode:          currentMaint,
    }, { headers: hdr() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['app-config'] }); alert('✅ Saved'); },
  });

  function toggleScreen(key: string) {
    const cur = screenshotBlockedScreens ?? cfg?.screenshotBlockedScreens ?? [];
    setScreenshotBlockedScreens(cur.includes(key) ? cur.filter(k => k !== key) : [...cur, key]);
  }

  if (isLoading) return <div className="p-8 text-white/40">Loading…</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Platform Settings</h1>
          <p className="text-white/40 text-sm mt-1">App-wide security and feature controls</p>
        </div>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saveMutation.isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {/* Screenshot Protection */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 flex items-center justify-center">
            <Camera className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-white font-semibold">Screenshot Protection</h2>
            <p className="text-white/40 text-xs">Block screenshots on specific screens</p>
          </div>
        </div>

        {/* Global toggle */}
        <label className="flex items-center justify-between p-4 bg-white/5 rounded-xl cursor-pointer">
          <div>
            <p className="text-white text-sm font-medium">Allow screenshots globally</p>
            <p className="text-white/30 text-xs mt-0.5">
              {currentAllow ? 'On — per-screen blocks below still apply' : 'Off — ALL screens block screenshots'}
            </p>
          </div>
          <div onClick={() => setAllowScreenshots(!currentAllow)}
            className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative flex-shrink-0 ${currentAllow ? 'bg-green-500' : 'bg-red-500'}`}>
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${currentAllow ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
        </label>

        {/* Per-screen */}
        <div className="space-y-4">
          <p className="text-white/40 text-xs font-semibold uppercase tracking-wider">Block per screen</p>
          {GROUPS.map(group => (
            <div key={group}>
              <p className="text-white/25 text-xs mb-2 px-1">{group}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {APP_SCREENS.filter(s => s.group === group).map(screen => {
                  const blocked = currentBlocked.includes(screen.key);
                  return (
                    <label key={screen.key}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer border transition-colors ${
                        blocked ? 'border-red-500/40 bg-red-500/10' : 'border-white/5 bg-white/3 hover:bg-white/5'
                      }`}>
                      <div className="flex items-center gap-2">
                        <Shield className={`w-3.5 h-3.5 flex-shrink-0 ${blocked ? 'text-red-400' : 'text-white/20'}`} />
                        <span className={`text-sm ${blocked ? 'text-white' : 'text-white/60'}`}>{screen.label}</span>
                      </div>
                      <div onClick={() => toggleScreen(screen.key)}
                        className={`w-9 h-5 rounded-full transition-colors cursor-pointer relative flex-shrink-0 ${blocked ? 'bg-red-500' : 'bg-white/10'}`}>
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${blocked ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Maintenance Mode */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-orange-500/15 flex items-center justify-center">
            <Wrench className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h2 className="text-white font-semibold">Maintenance Mode</h2>
            <p className="text-white/40 text-xs">Show maintenance screen to all users</p>
          </div>
        </div>
        <label className="flex items-center justify-between p-4 bg-white/5 rounded-xl cursor-pointer">
          <div>
            <p className="text-white text-sm font-medium">Enable maintenance mode</p>
            <p className="text-white/30 text-xs mt-0.5">Users see maintenance message instead of the app</p>
          </div>
          <div onClick={() => setMaintenanceMode(!currentMaint)}
            className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative flex-shrink-0 ${currentMaint ? 'bg-orange-500' : 'bg-white/10'}`}>
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${currentMaint ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
        </label>
      </div>
    </motion.div>
  );
}

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Camera, Shield, Wrench, Save, Sparkles, Gift, LogIn, ArrowUpCircle } from 'lucide-react';
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

// Guest-gated features — true = guests must log in to use this, false = open to guests without login
const GUEST_GATES = [
  { key: 'createHoroscope',          label: 'Create Jathagam' },
  { key: 'marriageMatchingBasic',    label: 'Marriage Matching (Basic)' },
  { key: 'marriageMatchingAdvanced', label: 'Marriage Matching (Advanced)' },
  { key: 'balanHub',                 label: 'Balan Hub' },
  { key: 'rasiBalan',                label: 'Rasi Balan' },
  { key: 'veeduBalan',               label: 'Veedu Balan' },
  { key: 'dailyHoroscope',           label: 'Daily Horoscope' },
  { key: 'horai',                    label: 'Nalla Neram / Horai' },
  { key: 'remedies',                 label: 'Remedies' },
  { key: 'appointments',             label: 'Appointments' },
];

interface AppConfig {
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
  const [jothishamAiEnabled,       setJothishamAiEnabled]       = useState<boolean | null>(null);
  const [referralEnabled,          setReferralEnabled]          = useState<boolean | null>(null);
  const [referralRewardThreshold,  setReferralRewardThreshold]  = useState<number | null>(null);
  const [referralRewardDays,       setReferralRewardDays]       = useState<number | null>(null);
  const [referralRewardPlan,       setReferralRewardPlan]       = useState<string | null>(null);
  const [guestAccessGates,         setGuestAccessGates]         = useState<Record<string, boolean> | null>(null);
  const [minAppVersion,            setMinAppVersion]            = useState<{ android: string; ios: string } | null>(null);
  const [updateUrl,                setUpdateUrl]                = useState<{ android: string; ios: string } | null>(null);

  const currentAllow       = allowScreenshots         ?? cfg?.allowScreenshots         ?? true;
  const currentBlocked     = screenshotBlockedScreens ?? cfg?.screenshotBlockedScreens ?? [];
  const currentMaint       = maintenanceMode          ?? cfg?.maintenanceMode          ?? false;
  const currentJothisham   = jothishamAiEnabled       ?? cfg?.jothishamAiEnabled       ?? false;
  const currentReferral    = referralEnabled          ?? cfg?.referralEnabled          ?? false;
  const currentThreshold   = referralRewardThreshold  ?? cfg?.referralRewardThreshold  ?? 5;
  const currentRewardDays  = referralRewardDays       ?? cfg?.referralRewardDays       ?? 30;
  const currentRewardPlan  = referralRewardPlan       ?? cfg?.referralRewardPlan       ?? 'pro';
  const currentGates       = guestAccessGates         ?? cfg?.guestAccessGates         ?? {};
  const currentMinVersion  = minAppVersion            ?? cfg?.minAppVersion            ?? { android: '0.0.0', ios: '0.0.0' };
  const currentUpdateUrl   = updateUrl                ?? cfg?.updateUrl                ?? { android: '', ios: '' };

  const saveMutation = useMutation({
    mutationFn: () => axios.put(`${API}/app-config`, {
      allowScreenshots:         currentAllow,
      screenshotBlockedScreens: currentBlocked,
      maintenanceMode:          currentMaint,
      jothishamAiEnabled:       currentJothisham,
      referralEnabled:          currentReferral,
      referralRewardThreshold:  currentThreshold,
      referralRewardDays:       currentRewardDays,
      referralRewardPlan:       currentRewardPlan,
      guestAccessGates:         currentGates,
      minAppVersion:            currentMinVersion,
      updateUrl:                currentUpdateUrl,
    }, { headers: hdr() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['app-config'] }); alert('✅ Saved'); },
  });

  function toggleScreen(key: string) {
    const cur = screenshotBlockedScreens ?? cfg?.screenshotBlockedScreens ?? [];
    setScreenshotBlockedScreens(cur.includes(key) ? cur.filter(k => k !== key) : [...cur, key]);
  }

  function toggleGuestGate(key: string) {
    const cur = guestAccessGates ?? cfg?.guestAccessGates ?? {};
    setGuestAccessGates({ ...cur, [key]: !(cur[key] ?? true) });
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

      {/* Force Update */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-500/15 flex items-center justify-center">
            <ArrowUpCircle className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h2 className="text-white font-semibold">Force Update</h2>
            <p className="text-white/40 text-xs">
              Block app versions below this number with an "update required" screen. Leave at 0.0.0 to disable.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider">
              Android — min version
            </label>
            <input
              type="text"
              value={currentMinVersion.android}
              onChange={e => setMinAppVersion({ ...currentMinVersion, android: e.target.value })}
              placeholder="0.0.0"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-rose-500/50"
            />
            <input
              type="text"
              value={currentUpdateUrl.android}
              onChange={e => setUpdateUrl({ ...currentUpdateUrl, android: e.target.value })}
              placeholder="Play Store URL"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/70 text-xs focus:outline-none focus:border-rose-500/50"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider">
              iOS — min version
            </label>
            <input
              type="text"
              value={currentMinVersion.ios}
              onChange={e => setMinAppVersion({ ...currentMinVersion, ios: e.target.value })}
              placeholder="0.0.0"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-rose-500/50"
            />
            <input
              type="text"
              value={currentUpdateUrl.ios}
              onChange={e => setUpdateUrl({ ...currentUpdateUrl, ios: e.target.value })}
              placeholder="App Store URL"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/70 text-xs focus:outline-none focus:border-rose-500/50"
            />
          </div>
        </div>
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5">
          <p className="text-rose-300 text-sm">
            Current rule: Android below <strong className="font-mono">{currentMinVersion.android}</strong>, iOS below{' '}
            <strong className="font-mono">{currentMinVersion.ios}</strong> will be blocked and prompted to update.
          </p>
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

      {/* Jothisham AI (Gemini + RAG engine) */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-white font-semibold">Jothisham AI</h2>
            <p className="text-white/40 text-xs">Gemini + RAG-powered Vedic astrology prediction engine</p>
          </div>
        </div>
        <label className="flex items-center justify-between p-4 bg-white/5 rounded-xl cursor-pointer">
          <div>
            <p className="text-white text-sm font-medium">Enable Jothisham AI</p>
            <p className="text-white/30 text-xs mt-0.5">
              {currentJothisham
                ? 'On — AI chat & predictions are powered by Gemini + the astrology knowledge base (Vector DB / RAG)'
                : 'Off — AI chat falls back to the classic engine'}
            </p>
          </div>
          <div onClick={() => setJothishamAiEnabled(!currentJothisham)}
            className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative flex-shrink-0 ${currentJothisham ? 'bg-indigo-500' : 'bg-white/10'}`}>
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${currentJothisham ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
        </label>
        <p className="text-white/25 text-xs mt-3 px-1">
          Manage the astrology knowledge base (RAG corpus) used by Jothisham AI in <span className="text-white/40">Jothisham Knowledge</span>.
        </p>
      </div>

      {/* Guest Access */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-500/15 flex items-center justify-center">
            <LogIn className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h2 className="text-white font-semibold">Guest Access</h2>
            <p className="text-white/40 text-xs">
              Guests can browse every page without an account. Toggle which actions still require login —
              off means guests can use that feature without signing in.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {GUEST_GATES.map(g => {
            const requiresLogin = currentGates[g.key] ?? true;
            return (
              <label key={g.key}
                className="flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer border border-white/5 bg-white/3 hover:bg-white/5 transition-colors">
                <div>
                  <p className="text-sm text-white/80">{g.label}</p>
                  <p className="text-white/25 text-xs">{requiresLogin ? 'Login required' : 'Open to guests'}</p>
                </div>
                <div onClick={() => toggleGuestGate(g.key)}
                  className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative flex-shrink-0 ${requiresLogin ? 'bg-sky-500' : 'bg-white/10'}`}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${requiresLogin ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Referral Program */}
      <div className="glass-card p-5 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center">
            <Gift className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-white font-semibold">Referral Program</h2>
            <p className="text-white/40 text-xs">
              Users share their code — when referred friends verify their account, the referrer earns free subscription days
            </p>
          </div>
        </div>

        {/* Enable toggle */}
        <label className="flex items-center justify-between p-4 bg-white/5 rounded-xl cursor-pointer">
          <div>
            <p className="text-white text-sm font-medium">Enable referral program</p>
            <p className="text-white/30 text-xs mt-0.5">
              {currentReferral ? 'On — users can share referral codes and earn rewards' : 'Off — referral feature hidden from users'}
            </p>
          </div>
          <div onClick={() => setReferralEnabled(!currentReferral)}
            className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative flex-shrink-0 ${currentReferral ? 'bg-emerald-500' : 'bg-white/10'}`}>
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${currentReferral ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
        </label>

        {/* Reward config */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider">
              Referrals needed per reward
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={currentThreshold}
              onChange={e => setReferralRewardThreshold(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500/50"
            />
            <p className="text-white/25 text-xs">Every N verified referrals = 1 reward</p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider">
              Reward days
            </label>
            <input
              type="number"
              min={1}
              max={365}
              value={currentRewardDays}
              onChange={e => setReferralRewardDays(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500/50"
            />
            <p className="text-white/25 text-xs">Free subscription days granted</p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider">
              Reward plan
            </label>
            <select
              value={currentRewardPlan}
              onChange={e => setReferralRewardPlan(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500/50"
            >
              <option value="pro">Pro</option>
              <option value="premium">Premium</option>
              <option value="basic">Basic</option>
            </select>
            <p className="text-white/25 text-xs">Plan tier to grant as reward</p>
          </div>
        </div>

        {/* Summary */}
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
          <p className="text-emerald-300 text-sm">
            Current rule: Every <strong>{currentThreshold}</strong> verified referrals → <strong>{currentRewardDays} days</strong> of <strong className="capitalize">{currentRewardPlan}</strong> plan for free
          </p>
        </div>
      </div>
    </motion.div>
  );
}

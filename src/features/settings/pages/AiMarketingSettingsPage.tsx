import { useState } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, Save } from 'lucide-react';
import { useAppConfig, useSaveAppConfig } from '../hooks/useAppConfig';

const AUDIENCE_OPTIONS = [
  { value: 'all',          label: 'All Users' },
  { value: 'plan_free',    label: 'Free Plan' },
  { value: 'plan_pro',     label: 'Pro Plan' },
  { value: 'plan_premium', label: 'Premium Plan' },
];

// The Northflank job only runs at these 3 fixed UTC times (cron: 30 3,8,13 * * *
// on astro-push-job's schedule prior to the 03:30 slot being introduced — keep
// this in sync with that cron expression). A custom time here would silently
// never fire since the job isn't running continuously, so slots are locked to
// exactly these 3 options — admins can only toggle each on/off, not retime it.
const FIXED_SLOTS = [
  { label: 'Morning',   utc: '03:30' },
  { label: 'Afternoon', utc: '08:30' },
  { label: 'Evening',   utc: '13:30' },
];

// Converts a stored UTC 'HH:mm' to the admin's browser-local time, using the
// real local UTC offset — not a hardcoded timezone. Display-only now that
// slots are fixed.
function shiftMinutes(hhmm: string, deltaMinutes: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  const total = (((h ?? 0) * 60 + (m ?? 0) + deltaMinutes) % 1440 + 1440) % 1440;
  const hh = String(Math.floor(total / 60)).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}
const LOCAL_OFFSET_MIN = -new Date().getTimezoneOffset();
const utcToLocal = (utcHHmm: string) => shiftMinutes(utcHHmm, LOCAL_OFFSET_MIN);

function to12h(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const period = (h ?? 0) >= 12 ? 'PM' : 'AM';
  const h12 = (h ?? 0) % 12 === 0 ? 12 : (h ?? 0) % 12;
  return `${h12}:${String(m ?? 0).padStart(2, '0')} ${period}`;
}

export default function AiMarketingSettingsPage() {
  const { data: cfg, isLoading } = useAppConfig();
  const saveMutation = useSaveAppConfig();

  const [enabled,       setEnabled]       = useState<boolean | null>(null);
  const [prompt,        setPrompt]        = useState<string | null>(null);
  const [enabledSlots,  setEnabledSlots]  = useState<string[] | null>(null);
  const [audience,      setAudience]      = useState<string | null>(null);
  const [targetScreen,  setTargetScreen]  = useState<string | null>(null);

  const currentEnabled = enabled ?? cfg?.aiMarketingEnabled ?? false;
  const currentPrompt  = prompt  ?? cfg?.aiMarketingPrompt  ?? '';
  const currentTimesUTC = enabledSlots ?? (cfg?.aiMarketingTimesUTC?.length ? cfg.aiMarketingTimesUTC : FIXED_SLOTS.map(s => s.utc));
  const currentAudience = audience     ?? cfg?.aiMarketingAudience     ?? 'all';
  const currentScreen   = targetScreen ?? cfg?.aiMarketingTargetScreen ?? '';

  function toggleSlot(utc: string) {
    const next = currentTimesUTC.includes(utc)
      ? currentTimesUTC.filter(t => t !== utc)
      : [...currentTimesUTC, utc];
    setEnabledSlots(next);
  }

  if (isLoading) return <div className="p-8 text-white/40">Loading…</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Marketing</h1>
          <p className="text-white/40 text-sm mt-1">
            AI generates and sends a fresh push notification up to 3 times a day, in all 6 languages
          </p>
        </div>
        <button
          onClick={() => saveMutation.mutate({
            aiMarketingEnabled: currentEnabled,
            aiMarketingPrompt: currentPrompt,
            aiMarketingTimesUTC: currentTimesUTC,
            aiMarketingAudience: currentAudience,
            aiMarketingTargetScreen: currentScreen,
          })}
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saveMutation.isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      <div className="glass-card p-5 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-pink-500/15 flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <h2 className="text-white font-semibold">AI-Generated Notifications</h2>
            <p className="text-white/40 text-xs">
              Runs automatically at each time slot below — no manual approval step, nothing to review
            </p>
          </div>
        </div>

        <label className="flex items-center justify-between p-4 bg-white/5 rounded-xl cursor-pointer">
          <div>
            <p className="text-white text-sm font-medium">Enable AI marketing messages</p>
            <p className="text-white/30 text-xs mt-0.5">
              {currentEnabled ? 'On — new messages generate and send automatically at each slot below' : 'Off — no AI messages will be sent'}
            </p>
          </div>
          <div onClick={() => setEnabled(!currentEnabled)}
            className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative flex-shrink-0 ${currentEnabled ? 'bg-pink-500' : 'bg-white/10'}`}>
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${currentEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
        </label>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider">
            Theme / Prompt for AI
          </label>
          <textarea
            rows={3}
            value={currentPrompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="e.g. Remind users to check today's panchangam and nalla neram before starting important work"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm resize-none focus:outline-none focus:border-pink-500/50"
          />
          <p className="text-white/25 text-xs">
            AI writes a fresh, different message each time from this theme — translated into all 6 languages automatically.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
            Daily Send Times
            <span className="text-white/30 normal-case ml-1">
              ({Intl.DateTimeFormat().resolvedOptions().timeZone})
            </span>
          </label>
          <p className="text-white/25 text-xs mb-3">
            Fixed to when the push job actually runs — toggle a slot on/off, times can't be changed here.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {FIXED_SLOTS.map(slot => {
              const isOn = currentTimesUTC.includes(slot.utc);
              return (
                <label key={slot.utc} className="flex items-center justify-between p-4 bg-white/5 rounded-xl cursor-pointer border border-white/10">
                  <div>
                    <p className="text-white text-sm font-medium">{slot.label}</p>
                    <p className="text-white/40 text-xs">{to12h(utcToLocal(slot.utc))}</p>
                    <p className="text-white/25 text-xs">= {slot.utc} UTC</p>
                  </div>
                  <div onClick={() => toggleSlot(slot.utc)}
                    className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative flex-shrink-0 ${isOn ? 'bg-pink-500' : 'bg-white/10'}`}>
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isOn ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider">
            Target Audience
          </label>
          <select
            value={currentAudience}
            onChange={e => setAudience(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-pink-500/50"
          >
            {AUDIENCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider">
            Open Screen on Tap <span className="text-white/30 normal-case">(optional)</span>
          </label>
          <select
            value={currentScreen}
            onChange={e => setTargetScreen(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-pink-500/50"
          >
            <option value="">Default (Home Screen)</option>
            <option value="DailyHoroscope">📅 Daily Horoscope</option>
            <option value="BalanHub">📊 Balan Hub</option>
            <option value="Charts">🪐 Jathagam (Chart List)</option>
            <option value="Panchangam">📆 Panchangam</option>
            <option value="Porutham">💑 Marriage Matching</option>
            <option value="Subscription">💎 Subscription / Plans</option>
          </select>
        </div>

        <div className="p-4 rounded-xl border border-pink-500/20 bg-pink-500/5">
          <p className="text-pink-300 text-sm">
            {currentEnabled
              ? (currentTimesUTC.length
                  ? `Sends at ${FIXED_SLOTS.filter(s => currentTimesUTC.includes(s.utc)).map(s => `${s.label} (${to12h(utcToLocal(s.utc))})`).join(', ')} to ${AUDIENCE_OPTIONS.find(o => o.value === currentAudience)?.label ?? 'All Users'} — check the Push Notifications page to see each generated message in the history.`
                  : 'No time slots enabled — turn on at least one above to actually send anything.')
              : 'Currently disabled — no messages will be generated or sent.'}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

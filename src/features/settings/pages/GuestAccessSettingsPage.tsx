import { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Save } from 'lucide-react';
import { useAppConfig, useSaveAppConfig } from '../hooks/useAppConfig';

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

export default function GuestAccessSettingsPage() {
  const { data: cfg, isLoading } = useAppConfig();
  const saveMutation = useSaveAppConfig();

  const [guestAccessGates, setGuestAccessGates] = useState<Record<string, boolean> | null>(null);
  const currentGates = guestAccessGates ?? cfg?.guestAccessGates ?? {};

  function toggleGuestGate(key: string) {
    const cur = guestAccessGates ?? cfg?.guestAccessGates ?? {};
    setGuestAccessGates({ ...cur, [key]: !(cur[key] ?? true) });
  }

  if (isLoading) return <div className="p-8 text-white/40">Loading…</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Guest Access</h1>
          <p className="text-white/40 text-sm mt-1">
            Guests can browse every page without an account — toggle which actions still require login
          </p>
        </div>
        <button
          onClick={() => saveMutation.mutate({ guestAccessGates: currentGates })}
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saveMutation.isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-500/15 flex items-center justify-center">
            <LogIn className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h2 className="text-white font-semibold">Guest Access</h2>
            <p className="text-white/40 text-xs">
              Off means guests can use that feature without signing in
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
    </motion.div>
  );
}

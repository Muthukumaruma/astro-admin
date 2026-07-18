import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpCircle, Save } from 'lucide-react';
import { useAppConfig, useSaveAppConfig } from '../hooks/useAppConfig';

export default function ForceUpdateSettingsPage() {
  const { data: cfg, isLoading } = useAppConfig();
  const saveMutation = useSaveAppConfig();

  const [minAppVersion, setMinAppVersion] = useState<{ android: string; ios: string } | null>(null);
  const [updateUrl,     setUpdateUrl]     = useState<{ android: string; ios: string } | null>(null);

  const currentMinVersion = minAppVersion ?? cfg?.minAppVersion ?? { android: '0.0.0', ios: '0.0.0' };
  const currentUpdateUrl  = updateUrl     ?? cfg?.updateUrl     ?? { android: '', ios: '' };

  if (isLoading) return <div className="p-8 text-white/40">Loading…</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Force Update</h1>
          <p className="text-white/40 text-sm mt-1">
            Block app versions below this number with an "update required" screen
          </p>
        </div>
        <button
          onClick={() => saveMutation.mutate({ minAppVersion: currentMinVersion, updateUrl: currentUpdateUrl })}
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saveMutation.isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-500/15 flex items-center justify-center">
            <ArrowUpCircle className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h2 className="text-white font-semibold">Minimum Versions</h2>
            <p className="text-white/40 text-xs">Leave at 0.0.0 to disable forcing updates for that platform</p>
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
    </motion.div>
  );
}

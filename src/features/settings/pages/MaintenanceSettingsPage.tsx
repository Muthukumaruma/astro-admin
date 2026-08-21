import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wrench, Save, DatabaseZap, CalendarClock, Loader2 } from 'lucide-react';
import { useAppConfig, useSaveAppConfig } from '../hooks/useAppConfig';
import { useClearSankrantiCache, useFlushRedisCache } from '../hooks/useSystemCache';

export default function MaintenanceSettingsPage() {
  const { data: cfg, isLoading } = useAppConfig();
  const saveMutation = useSaveAppConfig();
  const clearSankrantiCache = useClearSankrantiCache();
  const flushRedisCache = useFlushRedisCache();

  const [maintenanceMode, setMaintenanceMode] = useState<boolean | null>(null);
  const currentMaint = maintenanceMode ?? cfg?.maintenanceMode ?? false;

  function handleClearSankranti() {
    clearSankrantiCache.mutate(undefined, {
      onSuccess: (data) => alert(`✅ Cleared ${data.clearedKeys.length} sankranti cache keys for ${data.year}`),
      onError: () => alert('❌ Failed to clear sankranti cache'),
    });
  }

  function handleFlushRedis() {
    if (!confirm('Clear ALL Redis cache and locks? Safe (everything recomputes on next request), but affects every user immediately.')) return;
    flushRedisCache.mutate(undefined, {
      onSuccess: () => alert('✅ Redis cache cleared'),
      onError: () => alert('❌ Failed to clear Redis cache'),
    });
  }

  if (isLoading) return <div className="p-8 text-white/40">Loading…</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Maintenance Mode</h1>
          <p className="text-white/40 text-sm mt-1">Show maintenance screen to all users</p>
        </div>
        <button
          onClick={() => saveMutation.mutate({ maintenanceMode: currentMaint })}
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saveMutation.isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

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

      <div className="glass-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-sky-500/15 flex items-center justify-center">
            <DatabaseZap className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h2 className="text-white font-semibold">Cache</h2>
            <p className="text-white/40 text-xs">Force a fix to take effect immediately instead of waiting out a cache's TTL</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
          <div className="flex items-center gap-3">
            <CalendarClock className="w-4 h-4 text-white/40 flex-shrink-0" />
            <div>
              <p className="text-white text-sm font-medium">Tamil solar month (sankranti) dates</p>
              <p className="text-white/30 text-xs mt-0.5">Cached ~40 days — clear after fixing the Tamil calendar calculation</p>
            </div>
          </div>
          <button
            onClick={handleClearSankranti}
            disabled={clearSankrantiCache.isPending}
            className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 flex-shrink-0"
          >
            {clearSankrantiCache.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            Clear
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl mt-3">
          <div className="flex items-center gap-3">
            <DatabaseZap className="w-4 h-4 text-white/40 flex-shrink-0" />
            <div>
              <p className="text-white text-sm font-medium">All Redis cache</p>
              <p className="text-white/30 text-xs mt-0.5">Clears every cache and lock — safe, but affects every user immediately</p>
            </div>
          </div>
          <button
            onClick={handleFlushRedis}
            disabled={flushRedisCache.isPending}
            className="flex items-center gap-2 px-3.5 py-2 bg-red-500/15 hover:bg-red-500/25 text-red-300 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 flex-shrink-0"
          >
            {flushRedisCache.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            Flush All
          </button>
        </div>
      </div>
    </motion.div>
  );
}

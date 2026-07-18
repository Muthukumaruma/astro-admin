import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wrench, Save } from 'lucide-react';
import { useAppConfig, useSaveAppConfig } from '../hooks/useAppConfig';

export default function MaintenanceSettingsPage() {
  const { data: cfg, isLoading } = useAppConfig();
  const saveMutation = useSaveAppConfig();

  const [maintenanceMode, setMaintenanceMode] = useState<boolean | null>(null);
  const currentMaint = maintenanceMode ?? cfg?.maintenanceMode ?? false;

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
    </motion.div>
  );
}

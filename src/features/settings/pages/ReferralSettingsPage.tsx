import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Save } from 'lucide-react';
import { useAppConfig, useSaveAppConfig } from '../hooks/useAppConfig';

export default function ReferralSettingsPage() {
  const { data: cfg, isLoading } = useAppConfig();
  const saveMutation = useSaveAppConfig();

  const [referralEnabled,         setReferralEnabled]         = useState<boolean | null>(null);
  const [referralRewardThreshold, setReferralRewardThreshold] = useState<number | null>(null);
  const [referralRewardDays,      setReferralRewardDays]      = useState<number | null>(null);
  const [referralRewardPlan,      setReferralRewardPlan]      = useState<string | null>(null);

  const currentReferral   = referralEnabled         ?? cfg?.referralEnabled         ?? false;
  const currentThreshold  = referralRewardThreshold ?? cfg?.referralRewardThreshold ?? 5;
  const currentRewardDays = referralRewardDays      ?? cfg?.referralRewardDays      ?? 30;
  const currentRewardPlan = referralRewardPlan      ?? cfg?.referralRewardPlan      ?? 'pro';

  if (isLoading) return <div className="p-8 text-white/40">Loading…</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Referral Program</h1>
          <p className="text-white/40 text-sm mt-1">
            Users share their code — verified referrals earn the referrer free subscription days
          </p>
        </div>
        <button
          onClick={() => saveMutation.mutate({
            referralEnabled: currentReferral,
            referralRewardThreshold: currentThreshold,
            referralRewardDays: currentRewardDays,
            referralRewardPlan: currentRewardPlan,
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

        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
          <p className="text-emerald-300 text-sm">
            Current rule: Every <strong>{currentThreshold}</strong> verified referrals → <strong>{currentRewardDays} days</strong> of <strong className="capitalize">{currentRewardPlan}</strong> plan for free
          </p>
        </div>
      </div>
    </motion.div>
  );
}

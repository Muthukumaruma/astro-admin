import { motion } from 'framer-motion';
import { Users, Star, CreditCard, Sparkles, TrendingUp, Activity } from 'lucide-react';

const KPI_CARDS = [
  { label: 'Total Users',       value: '—', icon: Users,      color: 'text-blue-400',    bg: 'bg-blue-400/10',    border: 'border-blue-400/20' },
  { label: 'Astrologers',       value: '—', icon: Star,       color: 'text-gold-400',   bg: 'bg-gold-400/10',   border: 'border-gold-400/20' },
  { label: 'Active Subs',       value: '—', icon: CreditCard, color: 'text-nebula-400', bg: 'bg-nebula-400/10', border: 'border-nebula-400/20' },
  { label: 'AI Tokens Today',   value: '—', icon: Sparkles,   color: 'text-emerald-400',bg: 'bg-emerald-400/10',border: 'border-emerald-400/20' },
  { label: 'Revenue (Month)',   value: '—', icon: TrendingUp, color: 'text-gold-400',   bg: 'bg-gold-400/10',   border: 'border-gold-400/20' },
  { label: 'API Health',        value: 'OK',icon: Activity,   color: 'text-emerald-400',bg: 'bg-emerald-400/10',border: 'border-emerald-400/20' },
];

export default function AdminDashboardPage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-white">Platform Overview</h1>
        <p className="text-white/40 text-sm mt-1">Live platform metrics and health</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {KPI_CARDS.map((card) => (
          <div key={card.label} className={`stat-card border ${card.border}`}>
            <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <p className="font-display font-bold text-2xl text-white">{card.value}</p>
            <p className="text-white/50 text-xs">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="glass-card p-6">
        <h3 className="font-display font-semibold text-white mb-4">Revenue Chart</h3>
        <div className="h-48 flex items-center justify-center text-white/20 text-sm">
          Revenue analytics — connect to /admin/revenue endpoint
        </div>
      </div>
    </motion.div>
  );
}

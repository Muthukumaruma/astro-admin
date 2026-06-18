import { useQuery } from '@tanstack/react-query';
import { Users, Star, CreditCard, TrendingUp, UserPlus, UserCheck, Bell, Megaphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAdminAuthStore } from '../../../stores/auth.store';

const API = import.meta.env.VITE_API_URL ?? 'https://api.jothisham.com/api/v1';
const authHeaders = () => ({ Authorization: `Bearer ${useAdminAuthStore.getState().accessToken}` });

interface Stats {
  totalUsers: number;
  newUsersThisMonth: number;
  astrologers: number;
  activePaidSubs: number;
  freeUsers: number;
  estimatedMonthlyRevenue: number;
  dailySignups: { _id: string; count: number }[];
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className={`bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5 flex flex-col gap-3`}>
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-white/50 text-xs mt-0.5">{label}</p>
        {sub && <p className="text-white/25 text-[10px] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery<Stats>({
    queryKey: ['admin-stats'],
    queryFn: () => axios.get(`${API}/admin/stats`, { headers: authHeaders() }).then(r => r.data.data),
    refetchInterval: 60_000,
  });

  const fmt = (n?: number) => n === undefined ? '—' : n.toLocaleString('en-IN');
  const fmtRs = (n?: number) => n === undefined ? '—' : `₹${n.toLocaleString('en-IN')}`;

  // Build simple bar chart from dailySignups
  const signups = data?.dailySignups ?? [];
  const maxCount = Math.max(1, ...signups.map(s => s.count));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white">Platform Overview</h1>
        <p className="text-white/40 text-sm mt-1">Live metrics</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 h-28 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          <StatCard icon={Users}     label="Total Users"         value={fmt(data?.totalUsers)}                 color="bg-blue-500/30" />
          <StatCard icon={UserPlus}  label="New This Month"      value={fmt(data?.newUsersThisMonth)}          color="bg-indigo-500/30" />
          <StatCard icon={Star}      label="Astrologers"         value={fmt(data?.astrologers)}                color="bg-amber-500/30" />
          <StatCard icon={CreditCard}label="Paid Subscribers"    value={fmt(data?.activePaidSubs)}             color="bg-green-500/30" />
          <StatCard icon={UserCheck} label="Free Users"          value={fmt(data?.freeUsers)}                  color="bg-slate-500/30" />
          <StatCard icon={TrendingUp}label="Est. Monthly Revenue" value={fmtRs(data?.estimatedMonthlyRevenue)} color="bg-emerald-500/30" />
        </div>
      )}

      {/* Daily signups chart */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6">
        <h3 className="text-white font-semibold mb-4 text-sm">New Users — Last 7 Days</h3>
        {signups.length === 0 ? (
          <p className="text-white/20 text-sm text-center py-8">No signups data yet</p>
        ) : (
          <div className="flex items-end gap-2 h-32">
            {signups.map(s => (
              <div key={s._id} className="flex-1 flex flex-col items-center gap-1">
                <p className="text-[10px] text-white/40">{s.count}</p>
                <div
                  className="w-full bg-indigo-500/60 rounded-t-sm min-h-[4px] transition-all"
                  style={{ height: `${Math.max(4, (s.count / maxCount) * 100)}%` }}
                />
                <p className="text-[9px] text-white/30 truncate w-full text-center">
                  {s._id.slice(5)} {/* MM-DD */}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Engagement quick-actions */}
      <div>
        <h3 className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-3">Engagement</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link to="/notifications"
            className="group bg-white/5 border border-white/10 hover:border-red-500/30 hover:bg-red-500/5 rounded-2xl p-5 flex items-center gap-4 transition-all">
            <div className="w-11 h-11 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-red-500/30 transition-colors">
              <Bell className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Push Notifications</p>
              <p className="text-white/40 text-xs mt-0.5">Schedule & send multilingual broadcasts</p>
            </div>
          </Link>
          <Link to="/promos"
            className="group bg-white/5 border border-white/10 hover:border-indigo-500/30 hover:bg-indigo-500/5 rounded-2xl p-5 flex items-center gap-4 transition-all">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-500/30 transition-colors">
              <Megaphone className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Promo Modals</p>
              <p className="text-white/40 text-xs mt-0.5">Manage in-app promotional banners</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

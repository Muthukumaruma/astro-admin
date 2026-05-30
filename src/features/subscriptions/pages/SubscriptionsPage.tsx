import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAdminAuthStore } from '../../../stores/auth.store';

const API = import.meta.env.VITE_API_URL ?? 'https://api.jothisham.com/api/v1';
function authHeaders() {
  return { Authorization: `Bearer ${useAdminAuthStore.getState().accessToken}` };
}

interface SubRow {
  _id: string;
  userId: { _id: string; name: string; email: string } | string;
  planSlug: string;
  status: string;
  provider: string;
  currentPeriodEnd: string;
  providerSubscriptionId?: string;
  usage: Record<string, number>;
}

const STATUS_COLOR: Record<string, string> = {
  active: 'text-green-400', cancelled: 'text-yellow-400',
  expired: 'text-red-400', past_due: 'text-orange-400',
};

export default function SubscriptionsPage() {
  const qc = useQueryClient();
  const [page, setPage]     = useState(1);
  const [selected, setSelected] = useState<SubRow | null>(null);
  const [override, setOverride]  = useState('');

  const { data, isLoading } = useQuery<{ data: SubRow[]; total: number; totalPages: number }>({
    queryKey: ['admin-subs', page],
    queryFn: () =>
      axios.get(`${API}/subscriptions/admin?page=${page}&limit=20`, { headers: authHeaders() })
        .then(r => r.data.data),
  });

  const overrideMutation = useMutation({
    mutationFn: ({ userId, planSlug }: { userId: string; planSlug: string }) =>
      axios.patch(`${API}/subscriptions/admin/${userId}/override`, { planSlug }, { headers: authHeaders() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-subs'] }); setSelected(null); },
  });

  const rows = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  function userName(sub: SubRow) {
    if (sub.userId && typeof sub.userId === 'object') return sub.userId.name ?? '—';
    return String(sub.userId ?? '—');
  }
  function userEmail(sub: SubRow) {
    if (sub.userId && typeof sub.userId === 'object') return sub.userId.email ?? '';
    return '';
  }
  function userId(sub: SubRow) {
    if (sub.userId && typeof sub.userId === 'object') return sub.userId._id;
    return String(sub.userId ?? '');
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Subscriptions</h1>
        <p className="text-white/40 text-sm mt-1">
          {data?.total ?? 0} total subscribers
        </p>
      </div>

      {isLoading ? (
        <p className="text-white/40">Loading…</p>
      ) : (
        <>
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {['User', 'Plan', 'Status', 'Provider', 'Period End', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-white/40 text-xs font-semibold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map(sub => (
                  <tr key={sub._id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{userName(sub)}</p>
                      <p className="text-white/40 text-xs">{userEmail(sub)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-indigo-400 font-mono uppercase text-xs font-bold">{sub.planSlug}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold ${STATUS_COLOR[sub.status] ?? 'text-white/50'}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/50 text-xs">{sub.provider}</td>
                    <td className="px-4 py-3 text-white/50 text-xs">
                      {sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { setSelected(sub); setOverride(sub.planSlug); }}
                        className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                        Override Plan
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm transition-colors ${
                    p === page ? 'bg-indigo-600 text-white' : 'bg-white/10 text-white/50 hover:bg-white/20'
                  }`}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Override modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-bold text-white">Override Plan</h2>
            <p className="text-sm text-white/50">{userName(selected)} — {userEmail(selected)}</p>
            <div>
              <label className="text-xs text-white/50 block mb-1">New Plan Slug</label>
              <input value={override} onChange={e => setOverride(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                placeholder="free / pro / premium" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setSelected(null)}
                className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm transition-colors">
                Cancel
              </button>
              <button
                onClick={() => overrideMutation.mutate({ userId: userId(selected), planSlug: override })}
                disabled={overrideMutation.isPending || !override}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors">
                {overrideMutation.isPending ? 'Applying…' : 'Apply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

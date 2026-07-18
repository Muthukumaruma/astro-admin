import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { Search } from 'lucide-react';
import { useAdminAuthStore } from '../../../stores/auth.store';

const API = import.meta.env.VITE_API_URL ?? 'https://api.jothisham.com/api/v1';
function authHeaders() {
  return { Authorization: `Bearer ${useAdminAuthStore.getState().accessToken}` };
}

interface SubUser {
  _id: string; name: string; email: string;
  lastPlatform?: 'web' | 'android' | 'ios';
  lastAppVersion?: string;
  lastDeviceModel?: string;
  lastActiveAt?: string;
}

interface SubRow {
  _id: string;
  userId: SubUser | string;
  planSlug: string;
  status: string;
  provider: string;
  billingInterval?: 'monthly' | 'yearly';
  currentPeriodEnd: string;
  providerSubscriptionId?: string;
  usage: Record<string, number>;
}

const STATUS_COLOR: Record<string, string> = {
  active: 'text-green-400', cancelled: 'text-yellow-400',
  expired: 'text-red-400', past_due: 'text-orange-400',
};

const PLATFORM_LABEL: Record<string, string> = { web: 'Web', android: 'Android', ios: 'iOS' };

const EMPTY_FILTERS = { planSlug: '', status: '', provider: '', platform: '', billingInterval: '' };

export default function SubscriptionsPage() {
  const qc = useQueryClient();
  const [page, setPage]     = useState(1);
  const [selected, setSelected] = useState<SubRow | null>(null);
  const [override, setOverride]  = useState('');

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery<{ data: SubRow[]; total: number; totalPages: number }>({
    queryKey: ['admin-subs', page, filters, search],
    queryFn: () =>
      axios.get(`${API}/subscriptions/admin`, {
        params: {
          page, limit: 20,
          planSlug:        filters.planSlug        || undefined,
          status:          filters.status          || undefined,
          provider:        filters.provider         || undefined,
          platform:        filters.platform         || undefined,
          billingInterval: filters.billingInterval  || undefined,
          search:          search || undefined,
        },
        headers: authHeaders(),
      }).then(r => r.data.data),
  });

  const overrideMutation = useMutation({
    mutationFn: ({ userId, planSlug }: { userId: string; planSlug: string }) =>
      axios.patch(`${API}/subscriptions/admin/${userId}/override`, { planSlug }, { headers: authHeaders() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-subs'] }); setSelected(null); },
    onError: (err: any) => {
      const msg = err?.response?.data?.error ?? err?.message ?? 'Failed to override plan';
      toast.error(msg);
    },
  });

  const rows = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  function userObj(sub: SubRow): SubUser | null {
    return sub.userId && typeof sub.userId === 'object' ? sub.userId : null;
  }
  function userName(sub: SubRow) {
    return userObj(sub)?.name ?? (typeof sub.userId === 'string' ? sub.userId : '—');
  }
  function userEmail(sub: SubRow) {
    return userObj(sub)?.email ?? '';
  }
  function userId(sub: SubRow) {
    return userObj(sub)?._id ?? String(sub.userId ?? '');
  }

  function updateFilter(key: keyof typeof EMPTY_FILTERS, value: string) {
    setFilters(f => ({ ...f, [key]: value }));
    setPage(1);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    setSearchInput('');
    setSearch('');
    setPage(1);
  }

  const hasActiveFilters = Object.values(filters).some(Boolean) || !!search;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Subscriptions</h1>
        <p className="text-white/40 text-sm mt-1">
          {data?.total ?? 0} total subscribers
        </p>
      </div>

      {/* Advanced filters */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-wrap items-center gap-3">
        <select
          value={filters.planSlug}
          onChange={e => updateFilter('planSlug', e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80"
        >
          <option value="">All plans</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="premium">Premium</option>
        </select>

        <select
          value={filters.status}
          onChange={e => updateFilter('status', e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="cancelled">Cancelled</option>
          <option value="expired">Expired</option>
          <option value="past_due">Past due</option>
        </select>

        <select
          value={filters.provider}
          onChange={e => updateFilter('provider', e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80"
        >
          <option value="">All providers</option>
          <option value="razorpay">Razorpay</option>
          <option value="free">Free</option>
          <option value="referral">Referral</option>
        </select>

        <select
          value={filters.platform}
          onChange={e => updateFilter('platform', e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80"
        >
          <option value="">All platforms</option>
          <option value="web">Web</option>
          <option value="android">Android</option>
          <option value="ios">iOS</option>
        </select>

        <select
          value={filters.billingInterval}
          onChange={e => updateFilter('billingInterval', e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80"
        >
          <option value="">Monthly & yearly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>

        <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search name or email…"
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-white/20"
            />
          </div>
          <button type="submit" className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors">
            Search
          </button>
        </form>

        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-xs text-white/40 hover:text-white/70 transition-colors">
            Clear filters
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="text-white/40">Loading…</p>
      ) : (
        <>
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {['User', 'Plan', 'Billing', 'Status', 'Provider', 'Device', 'Period End', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-white/40 text-xs font-semibold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map(sub => {
                  const u = userObj(sub);
                  return (
                    <tr key={sub._id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-white font-medium">{userName(sub)}</p>
                        <p className="text-white/40 text-xs">{userEmail(sub)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-indigo-400 font-mono uppercase text-xs font-bold">{sub.planSlug}</span>
                      </td>
                      <td className="px-4 py-3">
                        {sub.planSlug !== 'free' && sub.billingInterval ? (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            sub.billingInterval === 'yearly' ? 'bg-amber-500/15 text-amber-300' : 'bg-white/10 text-white/50'
                          }`}>
                            {sub.billingInterval === 'yearly' ? 'Yearly' : 'Monthly'}
                          </span>
                        ) : (
                          <span className="text-white/20 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold ${STATUS_COLOR[sub.status] ?? 'text-white/50'}`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/50 text-xs">{sub.provider}</td>
                      <td className="px-4 py-3 text-xs">
                        {u?.lastPlatform ? (
                          <div>
                            <p className="text-white/70">
                              {PLATFORM_LABEL[u.lastPlatform]}
                              {u.lastAppVersion ? ` · v${u.lastAppVersion}` : ''}
                            </p>
                            {u.lastDeviceModel && <p className="text-white/30">{u.lastDeviceModel}</p>}
                          </div>
                        ) : (
                          <span className="text-white/20">—</span>
                        )}
                      </td>
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
                  );
                })}
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

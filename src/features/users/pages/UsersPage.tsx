import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, UserX, UserCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { useAdminAuthStore } from '../../../stores/auth.store';

const API = import.meta.env.VITE_API_URL ?? 'https://api.jothisham.com/api/v1';
const authHeaders = () => ({ Authorization: `Bearer ${useAdminAuthStore.getState().accessToken}` });

interface User {
  _id: string; name: string; email: string;
  status: 'active' | 'suspended' | 'pending_verification';
  isEmailVerified: boolean; userType: string; createdAt: string;
  subscription: { planSlug: string; status: string; provider: string };
  lastPlatform?: 'web' | 'android' | 'ios';
  lastAppVersion?: string;
  lastDeviceModel?: string;
  lastActiveAt?: string;
  referralCode?: string;
  referredBy?: string;
  referralCount?: number;
}

const PLATFORM_LABEL: Record<string, string> = { web: 'Web', android: 'Android', ios: 'iOS' };

function DeviceInfo({ u }: { u: User }) {
  if (!u.lastPlatform) return <span className="text-white/20 text-xs">—</span>;
  return (
    <div className="text-xs">
      <p className="text-white/70">
        {PLATFORM_LABEL[u.lastPlatform]}
        {u.lastAppVersion ? ` · v${u.lastAppVersion}` : ''}
      </p>
      {u.lastDeviceModel && <p className="text-white/30">{u.lastDeviceModel}</p>}
      {u.lastActiveAt && (
        <p className="text-white/20">Active {new Date(u.lastActiveAt).toLocaleDateString('en-IN')}</p>
      )}
    </div>
  );
}

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-white/10 text-white/50',
  pro: 'bg-indigo-500/20 text-indigo-300',
  premium: 'bg-amber-500/20 text-amber-300',
  enterprise: 'bg-purple-500/20 text-purple-300',
};

export default function UsersPage() {
  const qc = useQueryClient();
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState('');
  const [q, setQ]           = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, q],
    queryFn: () => axios.get(`${API}/admin/users`, {
      params: { page, limit: 20, search: q || undefined },
      headers: authHeaders(),
    }).then(r => r.data.data),
    keepPreviousData: true,
  });

  const block = useMutation({
    mutationFn: (id: string) => axios.patch(`${API}/admin/users/${id}/block`, {}, { headers: authHeaders() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const users: User[]  = data?.data ?? [];
  const total: number  = data?.total ?? 0;
  const totalPages     = data?.totalPages ?? 1;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setQ(search);
    setPage(1);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Users</h1>
          <p className="text-white/40 text-xs mt-0.5">{total.toLocaleString()} total</p>
        </div>
        <form onSubmit={handleSearch} className="sm:ml-auto flex gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name or email…"
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/20"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm transition-colors">
            Search
          </button>
        </form>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-white/30">Loading…</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-white/20">No users found</div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-white/30 text-xs uppercase tracking-wider">
                    <th className="text-left px-4 py-3 font-medium">User</th>
                    <th className="text-left px-4 py-3 font-medium">Plan</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium">Device</th>
                    <th className="text-left px-4 py-3 font-medium">Joined</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map(u => (
                    <tr key={u._id} className="hover:bg-white/3 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-white font-medium">{u.name}</p>
                          <p className="text-white/40 text-xs">{u.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLAN_COLORS[u.subscription.planSlug] ?? 'bg-white/10 text-white/50'}`}>
                          {u.subscription.planSlug}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          u.status === 'active' ? 'bg-green-500/15 text-green-400' :
                          u.status === 'suspended' ? 'bg-red-500/15 text-red-400' :
                          'bg-amber-500/15 text-amber-400'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <DeviceInfo u={u} />
                      </td>
                      <td className="px-4 py-3 text-white/40 text-xs">
                        {new Date(u.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => block.mutate(u._id)}
                          disabled={block.isPending}
                          className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                            u.status === 'active'
                              ? 'text-red-400 hover:bg-red-500/10'
                              : 'text-green-400 hover:bg-green-500/10'
                          }`}
                        >
                          {u.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-white/5">
              {users.map(u => (
                <div key={u._id} className="p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-500/20 flex items-center justify-center text-sm font-bold text-indigo-300 flex-shrink-0">
                    {u.name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{u.name}</p>
                    <p className="text-white/40 text-xs truncate">{u.email}</p>
                    <div className="flex gap-1.5 mt-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${PLAN_COLORS[u.subscription.planSlug] ?? 'bg-white/10 text-white/50'}`}>
                        {u.subscription.planSlug}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        u.status === 'active' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
                      }`}>
                        {u.status}
                      </span>
                      {u.lastPlatform && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/50">
                          {PLATFORM_LABEL[u.lastPlatform]}{u.lastAppVersion ? ` v${u.lastAppVersion}` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => block.mutate(u._id)}
                    className={`text-xs p-2 rounded-lg transition-colors flex-shrink-0 ${
                      u.status === 'active' ? 'text-red-400 hover:bg-red-500/10' : 'text-green-400 hover:bg-green-500/10'
                    }`}
                  >
                    {u.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-white/30 text-xs">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 disabled:opacity-30 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 disabled:opacity-30 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

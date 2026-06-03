import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { useAdminAuthStore } from '../../../stores/auth.store';

const API = import.meta.env.VITE_API_URL ?? 'https://api.jothisham.com/api/v1';
const authHeaders = () => ({ Authorization: `Bearer ${useAdminAuthStore.getState().accessToken}` });

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-white/10 text-white/40',
  pro: 'bg-indigo-500/20 text-indigo-300',
  premium: 'bg-amber-500/20 text-amber-300',
  enterprise: 'bg-purple-500/20 text-purple-300',
};

export default function AIUsagePage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-ai-usage', page],
    queryFn: () => axios.get(`${API}/admin/ai-usage`, {
      params: { page, limit: 20 },
      headers: authHeaders(),
    }).then(r => r.data.data),
    keepPreviousData: true,
  });

  const users = data?.topUsers ?? [];
  const maxTokens = Math.max(1, ...users.map((u: any) => u.tokensUsed));
  const totalPages = Math.ceil((data?.usersWithAI ?? 0) / 20);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white">AI Usage</h1>
        <p className="text-white/40 text-xs mt-0.5">Token consumption across all users</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-2xl font-bold text-white">
            {isLoading ? '—' : (data?.totalTokens ?? 0).toLocaleString('en-IN')}
          </p>
          <p className="text-white/40 text-xs mt-1">Total Tokens Used</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {isLoading ? '—' : (data?.usersWithAI ?? 0).toLocaleString()}
          </p>
          <p className="text-white/40 text-xs mt-1">Users with AI Usage</p>
        </div>
      </div>

      {/* Top users table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5">
          <p className="text-white text-sm font-semibold">Top Users by Token Usage</p>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-white/30">Loading…</div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center">
            <Sparkles className="w-8 h-8 mx-auto mb-2 text-white/10" />
            <p className="text-white/20 text-sm">No AI usage recorded yet</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {users.map((u: any, i: number) => (
              <div key={u.userId} className="px-4 py-3 flex items-center gap-3">
                <span className="text-white/20 text-xs w-5 text-right flex-shrink-0">#{(page - 1) * 20 + i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white text-sm font-medium truncate">{u.userName ?? 'Unknown'}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${PLAN_COLORS[u.planSlug] ?? 'bg-white/10 text-white/40'}`}>
                      {u.planSlug}
                    </span>
                  </div>
                  <p className="text-white/30 text-xs truncate">{u.userEmail}</p>
                  {/* Usage bar */}
                  <div className="mt-1.5 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500/60 rounded-full transition-all"
                      style={{ width: `${(u.tokensUsed / maxTokens) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-white text-sm font-mono">{u.tokensUsed.toLocaleString()}</p>
                  <p className="text-white/30 text-[10px]">tokens</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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

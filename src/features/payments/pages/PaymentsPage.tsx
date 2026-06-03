import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CreditCard, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import axios from 'axios';
import { useAdminAuthStore } from '../../../stores/auth.store';

const API = import.meta.env.VITE_API_URL ?? 'https://api.jothisham.com/api/v1';
const authHeaders = () => ({ Authorization: `Bearer ${useAdminAuthStore.getState().accessToken}` });

const STATUS_STYLES: Record<string, string> = {
  active:   'bg-green-500/15 text-green-400',
  cancelled:'bg-red-500/15 text-red-400',
  past_due: 'bg-amber-500/15 text-amber-400',
  expired:  'bg-white/10 text-white/30',
};

const PLAN_COLORS: Record<string, string> = {
  pro:        'bg-indigo-500/20 text-indigo-300',
  premium:    'bg-amber-500/20 text-amber-300',
  enterprise: 'bg-purple-500/20 text-purple-300',
};

export default function PaymentsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-payments', page],
    queryFn: () => axios.get(`${API}/admin/payments`, {
      params: { page, limit: 20 },
      headers: authHeaders(),
    }).then(r => r.data.data),
    keepPreviousData: true,
  });

  const payments = data?.data ?? [];
  const total     = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white">Payments</h1>
        <p className="text-white/40 text-xs mt-0.5">{total} paid subscriptions</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-white/30">Loading…</div>
        ) : payments.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-2 text-white/20">
            <CreditCard className="w-10 h-10" />
            <p className="text-sm">No paid subscriptions yet</p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-white/30 text-xs uppercase tracking-wider">
                    <th className="text-left px-4 py-3 font-medium">User</th>
                    <th className="text-left px-4 py-3 font-medium">Plan</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium">Period</th>
                    <th className="text-left px-4 py-3 font-medium">Razorpay ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {payments.map((p: any) => (
                    <tr key={p._id} className="hover:bg-white/3">
                      <td className="px-4 py-3">
                        <p className="text-white font-medium">{(p.userId as any)?.name ?? '—'}</p>
                        <p className="text-white/40 text-xs">{(p.userId as any)?.email ?? p.userId}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLAN_COLORS[p.planSlug] ?? 'bg-white/10 text-white/40'}`}>
                          {p.planSlug}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[p.status] ?? 'bg-white/10 text-white/30'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/40 text-xs">
                        {new Date(p.currentPeriodStart).toLocaleDateString('en-IN')} →{' '}
                        {new Date(p.currentPeriodEnd).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-4 py-3">
                        {p.providerSubscriptionId ? (
                          <a
                            href={`https://dashboard.razorpay.com/app/subscriptions/${p.providerSubscriptionId}`}
                            target="_blank" rel="noopener noreferrer"
                            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                          >
                            {p.providerSubscriptionId.slice(-12)}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : <span className="text-white/20 text-xs">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden divide-y divide-white/5">
              {payments.map((p: any) => (
                <div key={p._id} className="p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-white text-sm font-medium">{(p.userId as any)?.name ?? '—'}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_STYLES[p.status] ?? 'bg-white/10 text-white/30'}`}>
                      {p.status}
                    </span>
                  </div>
                  <p className="text-white/40 text-xs">{(p.userId as any)?.email}</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${PLAN_COLORS[p.planSlug] ?? 'bg-white/10 text-white/40'}`}>
                      {p.planSlug}
                    </span>
                    <span className="text-white/25 text-[10px]">
                      {new Date(p.currentPeriodEnd).toLocaleDateString('en-IN')} ends
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
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

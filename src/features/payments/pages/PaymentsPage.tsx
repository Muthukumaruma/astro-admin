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
  const [tab, setTab] = useState<'subscriptions' | 'single'>('subscriptions');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-payments', page],
    queryFn: () => axios.get(`${API}/admin/payments`, {
      params: { page, limit: 20 },
      headers: authHeaders(),
    }).then(r => r.data.data),
    keepPreviousData: true,
    enabled: tab === 'subscriptions',
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

      <div className="flex gap-2">
        <button
          onClick={() => { setTab('subscriptions'); setPage(1); }}
          className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${tab === 'subscriptions' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/5 text-white/40 hover:text-white/60'}`}
        >
          Subscriptions
        </button>
        <button
          onClick={() => { setTab('single'); setPage(1); }}
          className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${tab === 'single' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/5 text-white/40 hover:text-white/60'}`}
        >
          Single Purchases
        </button>
      </div>

      {tab === 'single' ? (
        <SinglePurchasesTable page={page} setPage={setPage} />
      ) : (
      <>
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
      </>
      )}
    </div>
  );
}

const FEATURE_LABELS: Record<string, string> = {
  jathagamCount: 'Jathagam',
  basicPoruthamCount: 'Porutham',
};

function featureLabel(feature: string): string {
  if (feature === 'legacy:unknown') return 'Unknown product (legacy)';
  if (FEATURE_LABELS[feature]) return FEATURE_LABELS[feature];
  const [group, id] = feature.split(':');
  const groupLabels: Record<string, string> = {
    prasanna: 'Prasanna', numerology: 'Numerology', kaiRekhai: 'Kai Rekhai',
  };
  return id ? `${groupLabels[group ?? ''] ?? group} — ${id}` : feature;
}

function SinglePurchasesTable({ page, setPage }: { page: number; setPage: (fn: (p: number) => number) => void }) {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-single-purchases', page, search],
    queryFn: () => axios.get(`${API}/admin/single-purchases`, {
      params: { page, limit: 20, search: search || undefined },
      headers: authHeaders(),
    }).then(r => r.data.data),
    keepPreviousData: true,
  });

  const purchases  = data?.data ?? [];
  const total       = data?.total ?? 0;
  const totalPages  = data?.totalPages ?? 1;

  return (
    <div className="space-y-4">
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by name or email…"
        className="w-full md:w-72 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-400/50"
      />
      <p className="text-white/40 text-xs">{total} single-item purchase(s)</p>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-white/30">Loading…</div>
        ) : purchases.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-2 text-white/20">
            <CreditCard className="w-10 h-10" />
            <p className="text-sm">No single-item purchases yet</p>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-white/30 text-xs uppercase tracking-wider">
                    <th className="text-left px-4 py-3 font-medium">User</th>
                    <th className="text-left px-4 py-3 font-medium">Product</th>
                    <th className="text-left px-4 py-3 font-medium">Amount</th>
                    <th className="text-left px-4 py-3 font-medium">Date</th>
                    <th className="text-left px-4 py-3 font-medium">Payment ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {purchases.map((p: any) => (
                    <tr key={p._id} className="hover:bg-white/3">
                      <td className="px-4 py-3">
                        <p className="text-white font-medium">{(p.userId as any)?.name ?? '—'}</p>
                        <p className="text-white/40 text-xs">{(p.userId as any)?.email ?? p.userId}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 font-medium">
                          {featureLabel(p.feature)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/70 text-xs">
                        {p.currency} {p.amount}
                      </td>
                      <td className="px-4 py-3 text-white/40 text-xs">
                        {new Date(p.createdAt).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3">
                        {p.razorpayPaymentId ? (
                          <a
                            href={`https://dashboard.razorpay.com/app/payments/${p.razorpayPaymentId}`}
                            target="_blank" rel="noopener noreferrer"
                            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                          >
                            {p.razorpayPaymentId.slice(-12)}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : <span className="text-white/20 text-xs">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-white/5">
              {purchases.map((p: any) => (
                <div key={p._id} className="p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-white text-sm font-medium">{(p.userId as any)?.name ?? '—'}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300">
                      {featureLabel(p.feature)}
                    </span>
                  </div>
                  <p className="text-white/40 text-xs">{(p.userId as any)?.email}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-white/70 text-xs">{p.currency} {p.amount}</span>
                    <span className="text-white/25 text-[10px]">
                      {new Date(p.createdAt).toLocaleDateString('en-IN')}
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

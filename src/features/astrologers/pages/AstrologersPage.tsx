import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Star, ChevronLeft, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';
import { useAdminAuthStore } from '../../../stores/auth.store';

const API = import.meta.env.VITE_API_URL ?? 'https://api.jothisham.com/api/v1';
const authHeaders = () => ({ Authorization: `Bearer ${useAdminAuthStore.getState().accessToken}` });

interface Astrologer {
  _id: string; name: string; email: string;
  status: string; isEmailVerified: boolean; createdAt: string;
}

export default function AstrologersPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-astrologers', page],
    queryFn: () => axios.get(`${API}/admin/astrologers`, {
      params: { page, limit: 20 },
      headers: authHeaders(),
    }).then(r => r.data.data),
    keepPreviousData: true,
  });

  const astrologers: Astrologer[] = data?.data ?? [];
  const total     = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Astrologers</h1>
          <p className="text-white/40 text-xs mt-0.5">{total} registered</p>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-white/30">Loading…</div>
        ) : astrologers.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-white/20">
            <Star className="w-10 h-10" />
            <p className="text-sm">No astrologers registered yet</p>
            <p className="text-xs text-white/15">Users who select "Astrologer" during onboarding appear here</p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-white/30 text-xs uppercase tracking-wider">
                    <th className="text-left px-4 py-3 font-medium">Name</th>
                    <th className="text-left px-4 py-3 font-medium">Email</th>
                    <th className="text-left px-4 py-3 font-medium">Verified</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {astrologers.map(a => (
                    <tr key={a._id} className="hover:bg-white/3">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-sm font-bold text-amber-300 flex-shrink-0">
                            {a.name?.[0]?.toUpperCase() ?? '?'}
                          </div>
                          <span className="text-white font-medium">{a.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white/50">{a.email}</td>
                      <td className="px-4 py-3">
                        {a.isEmailVerified
                          ? <CheckCircle className="w-4 h-4 text-green-400" />
                          : <XCircle className="w-4 h-4 text-red-400/60" />}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          a.status === 'active' ? 'bg-green-500/15 text-green-400' :
                          a.status === 'suspended' ? 'bg-red-500/15 text-red-400' :
                          'bg-amber-500/15 text-amber-400'
                        }`}>{a.status}</span>
                      </td>
                      <td className="px-4 py-3 text-white/40 text-xs">
                        {new Date(a.createdAt).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden divide-y divide-white/5">
              {astrologers.map(a => (
                <div key={a._id} className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center font-bold text-amber-300 flex-shrink-0">
                    {a.name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{a.name}</p>
                    <p className="text-white/40 text-xs truncate">{a.email}</p>
                    <div className="flex gap-1.5 mt-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        a.status === 'active' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
                      }`}>{a.status}</span>
                      {a.isEmailVerified && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400">Verified</span>}
                    </div>
                  </div>
                  <p className="text-white/30 text-[10px] flex-shrink-0">{new Date(a.createdAt).toLocaleDateString('en-IN')}</p>
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

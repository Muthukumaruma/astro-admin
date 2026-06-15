import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useAdminAuthStore } from '../../../stores/auth.store';
import { ADMIN_ROLES, ADMIN_ROLE_LABELS } from '../../../shared/admin-roles';
import type { AdminRole } from '../../../shared/types';

const API = import.meta.env.VITE_API_URL ?? 'https://api.jothisham.com/api/v1';
const authHeaders = () => ({ Authorization: `Bearer ${useAdminAuthStore.getState().accessToken}` });

interface AdminAccount {
  _id: string; name: string; email: string;
  adminRole?: AdminRole; status: string; createdAt: string;
}

export default function AdminsPage() {
  const qc = useQueryClient();
  const currentUserId = useAdminAuthStore(s => s.user?.id);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AdminRole>('content_admin');
  const [error, setError] = useState('');

  const { data: admins = [], isLoading } = useQuery<AdminAccount[]>({
    queryKey: ['admin-accounts'],
    queryFn: () => axios.get(`${API}/admin/admins`, { headers: authHeaders() }).then(r => r.data.data ?? []),
  });

  const promote = useMutation({
    mutationFn: () => axios.post(`${API}/admin/admins`, { email: email.trim(), adminRole: role }, { headers: authHeaders() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-accounts'] }); setEmail(''); setError(''); },
    onError: (err: any) => setError(err?.response?.data?.error ?? 'Failed to add admin'),
  });

  const changeRole = useMutation({
    mutationFn: ({ id, adminRole }: { id: string; adminRole: AdminRole }) =>
      axios.patch(`${API}/admin/admins/${id}`, { adminRole }, { headers: authHeaders() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-accounts'] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => axios.delete(`${API}/admin/admins/${id}`, { headers: authHeaders() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-accounts'] }),
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white">Admin Accounts</h1>
        <p className="text-white/40 text-xs mt-0.5">Manage who has admin access and what they can do.</p>
      </div>

      {/* Promote form */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
        <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Grant admin access</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="user@example.com"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/20"
          />
          <select
            value={role}
            onChange={e => setRole(e.target.value as AdminRole)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-white/20"
          >
            {ADMIN_ROLES.map(r => <option key={r} value={r} className="bg-gray-900">{ADMIN_ROLE_LABELS[r]}</option>)}
          </select>
          <button
            onClick={() => promote.mutate()}
            disabled={!email.trim() || promote.isPending}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <UserPlus className="w-4 h-4" /> {promote.isPending ? 'Adding…' : 'Add'}
          </button>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>

      {/* Admin list */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-white/30">Loading…</div>
        ) : admins.length === 0 ? (
          <div className="p-12 text-center text-white/20">No admins found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-white/30 text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3 font-medium">Admin</th>
                  <th className="text-left px-4 py-3 font-medium">Role</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map(a => (
                  <tr key={a._id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{a.name}</p>
                      <p className="text-white/30 text-xs">{a.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={a.adminRole ?? 'super_admin'}
                        onChange={e => changeRole.mutate({ id: a._id, adminRole: e.target.value as AdminRole })}
                        disabled={a._id === currentUserId}
                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white disabled:opacity-40 focus:outline-none focus:border-white/20"
                      >
                        {ADMIN_ROLES.map(r => <option key={r} value={r} className="bg-gray-900">{ADMIN_ROLE_LABELS[r]}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => remove.mutate(a._id)}
                        disabled={a._id === currentUserId}
                        title={a._id === currentUserId ? "You can't remove your own admin access" : 'Remove admin access'}
                        className="p-2 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

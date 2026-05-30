import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAdminAuthStore } from '../../../stores/auth.store';

const API = import.meta.env.VITE_API_URL ?? 'https://api.jothisham.com/api/v1';
function authHeaders() {
  const token = useAdminAuthStore.getState().accessToken;
  return { Authorization: `Bearer ${token}` };
}

interface PlanLimits {
  jathagamCount: number; basicPoruthamCount: number; advancedPoruthamCount: number;
  muhurtamSearchCount: number; rasiBalanSearchCount: number; reminderCount: number;
  pdfDownloadCount: number; advancedMatching: boolean; aiTokensCount: number;
}
interface Plan {
  _id: string; slug: string; name: string; description: string;
  price: number; currency: string; isFree: boolean; isActive: boolean;
  sortOrder: number; limits: PlanLimits;
}

const DEFAULT_LIMITS: PlanLimits = {
  jathagamCount: 3, basicPoruthamCount: 5, advancedPoruthamCount: 0,
  muhurtamSearchCount: 5, rasiBalanSearchCount: 5, reminderCount: 3,
  pdfDownloadCount: 0, advancedMatching: false, aiTokensCount: 5000,
};
const EMPTY: Omit<Plan, '_id'> = {
  slug: '', name: '', description: '', price: 0, currency: 'INR',
  isFree: false, isActive: true, sortOrder: 0, limits: { ...DEFAULT_LIMITS },
};

const LIMIT_FIELDS: { key: keyof PlanLimits; label: string; bool?: boolean }[] = [
  { key: 'jathagamCount',         label: 'Jathagam (-1 = unlimited)' },
  { key: 'basicPoruthamCount',    label: 'Basic Porutham (-1 = unlimited)' },
  { key: 'advancedPoruthamCount', label: 'Advanced Porutham (-1 = unlimited)' },
  { key: 'muhurtamSearchCount',   label: 'Muhurtam Search (-1 = unlimited)' },
  { key: 'rasiBalanSearchCount',  label: 'Rasi Balan (-1 = unlimited)' },
  { key: 'reminderCount',         label: 'Reminders (-1 = unlimited)' },
  { key: 'pdfDownloadCount',      label: 'PDF Downloads (0 = blocked)' },
  { key: 'advancedMatching',      label: 'Advanced Matching', bool: true },
  { key: 'aiTokensCount',         label: 'AI Tokens (-1 = unlimited)' },
];

function limitDisplay(v: number | boolean) {
  if (v === true)  return { label: '✓', cls: 'text-green-400' };
  if (v === false) return { label: '✗', cls: 'text-red-400' };
  if (v === -1)    return { label: '∞', cls: 'text-green-400' };
  if (v === 0)     return { label: '✗', cls: 'text-red-400' };
  return { label: String(v), cls: 'text-white' };
}

export default function PlansPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState<Omit<Plan, '_id'>>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const { data: plans = [], isLoading } = useQuery<Plan[]>({
    queryKey: ['admin-plans'],
    queryFn: () => axios.get(`${API}/plans`, { headers: authHeaders() }).then(r => r.data.data ?? []),
  });

  const save = useMutation({
    mutationFn: (data: Partial<Plan> & { _id?: string }) =>
      data._id
        ? axios.put(`${API}/plans/${data._id}`, data, { headers: authHeaders() })
        : axios.post(`${API}/plans`, data, { headers: authHeaders() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-plans'] }); closeForm(); },
  });

  const deactivate = useMutation({
    mutationFn: (id: string) => axios.delete(`${API}/plans/${id}`, { headers: authHeaders() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-plans'] }),
  });

  function openCreate() { setEditId(null); setForm({ ...EMPTY, limits: { ...DEFAULT_LIMITS } }); setOpen(true); }
  function openEdit(p: Plan) { setEditId(p._id); setForm({ ...p }); setOpen(true); }
  function closeForm() { setOpen(false); setEditId(null); }

  function setLimitField(key: keyof PlanLimits, val: string | boolean) {
    setForm(f => ({ ...f, limits: { ...f.limits, [key]: typeof val === 'boolean' ? val : Number(val) } }));
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Subscription Plans</h1>
          <p className="text-white/40 text-sm mt-1">Configure feature limits — changes apply immediately to all users on each plan</p>
        </div>
        <button onClick={openCreate}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
          + New Plan
        </button>
      </div>

      {/* Plan cards */}
      {isLoading ? (
        <p className="text-white/40">Loading…</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-3">
          {plans.map(plan => (
            <div key={plan._id}
              className={`bg-white/5 border rounded-2xl p-5 space-y-4 ${plan.isActive ? 'border-white/10' : 'border-red-500/20 opacity-50'}`}>
              {/* Plan header */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest">{plan.slug}</span>
                  <h3 className="text-lg font-bold text-white leading-tight">{plan.name}</h3>
                  <p className="text-xs text-white/40 mt-0.5">{plan.description}</p>
                </div>
                <div className="text-right">
                  {plan.isFree
                    ? <span className="text-green-400 font-bold text-sm">Free</span>
                    : <span className="text-white font-bold">₹{plan.price}<span className="text-white/30 text-xs">/mo</span></span>
                  }
                </div>
              </div>

              {/* Limits grid */}
              <div className="space-y-1.5 border-t border-white/10 pt-3">
                {LIMIT_FIELDS.map(({ key, label }) => {
                  const v = plan.limits[key];
                  const { label: vl, cls } = limitDisplay(v as number | boolean);
                  return (
                    <div key={key} className="flex justify-between items-center text-xs">
                      <span className="text-white/50">{label.split(' (')[0]}</span>
                      <span className={`font-mono font-bold ${cls}`}>{vl}</span>
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button onClick={() => openEdit(plan)}
                  className="flex-1 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs transition-colors">
                  Edit Limits
                </button>
                {!plan.isFree && plan.isActive && (
                  <button onClick={() => deactivate.mutate(plan._id)}
                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/25 text-red-400 rounded-lg text-xs transition-colors">
                    Deactivate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      {open && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={closeForm}>
          <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-gray-900 border-b border-white/10 px-6 py-4">
              <h2 className="text-base font-bold text-white">{editId ? 'Edit Plan' : 'New Plan'}</h2>
            </div>
            <div className="p-6 space-y-4">
              {/* Basic info */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Slug', key: 'slug', placeholder: 'pro', disabled: !!editId },
                  { label: 'Name', key: 'name', placeholder: 'Pro' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs text-white/50 block mb-1">{f.label}</label>
                    <input
                      value={(form as any)[f.key]}
                      disabled={f.disabled}
                      onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white disabled:opacity-40"
                      placeholder={f.placeholder}
                    />
                  </div>
                ))}
              </div>
              <div>
                <label className="text-xs text-white/50 block mb-1">Description</label>
                <input value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full bg-gray-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  placeholder="For regular users…" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/50 block mb-1">Price (₹/month)</label>
                  <input type="number" value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: +e.target.value }))}
                    className="w-full bg-gray-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-white/60 select-none">
                    <input type="checkbox" checked={form.isFree}
                      onChange={e => setForm(f => ({ ...f, isFree: e.target.checked }))}
                      className="accent-indigo-500 w-4 h-4" />
                    Free plan
                  </label>
                </div>
              </div>

              {/* Feature limits */}
              <div className="border-t border-white/10 pt-4 space-y-2.5">
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Feature Limits</p>
                {LIMIT_FIELDS.map(({ key, label, bool }) => (
                  <div key={key} className="flex items-center justify-between gap-4">
                    <label className="text-sm text-white/70 flex-1">{label}</label>
                    {bool ? (
                      <input type="checkbox"
                        checked={form.limits[key] as boolean}
                        onChange={e => setLimitField(key, e.target.checked)}
                        className="accent-indigo-500 w-4 h-4 flex-shrink-0" />
                    ) : (
                      <input type="number"
                        value={form.limits[key] as number}
                        onChange={e => setLimitField(key, e.target.value)}
                        className="w-20 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm text-white text-right flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>

              {/* Save / Cancel */}
              <div className="flex gap-3 pt-2">
                <button onClick={closeForm}
                  className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm transition-colors">
                  Cancel
                </button>
                <button onClick={() => save.mutate(editId ? { ...form, _id: editId } : form)}
                  disabled={save.isPending || !form.slug || !form.name}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors">
                  {save.isPending ? 'Saving…' : 'Save Plan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

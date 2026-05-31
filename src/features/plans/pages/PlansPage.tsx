import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import axios from 'axios';
import { useAdminAuthStore } from '../../../stores/auth.store';

const API = import.meta.env.VITE_API_URL ?? 'https://api.jothisham.com/api/v1';
function authHeaders() {
  const token = useAdminAuthStore.getState().accessToken;
  return { Authorization: `Bearer ${token}` };
}

interface PlanLimits {
  // Jathagam
  accessJathagam: boolean; accessJathagamCreate: boolean;
  accessJathagamDetail: boolean; accessKocharamCompare: boolean;
  // Porutham
  accessPorutham: boolean; accessAdvancedMatching: boolean;
  // Panchangam
  accessPanchangam: boolean; accessPanchangamCalendar: boolean;
  accessMuhurtam: boolean; accessGocharaChart: boolean;
  // Home
  accessNallaNeram: boolean; accessRasiBalan: boolean; accessVeeduBalan: boolean;
  // Other
  accessPdfDownload: boolean; accessReminders: boolean; accessAiFeatures: boolean;
  // Counts
  jathagamCount: number; basicPoruthamCount: number; advancedPoruthamCount: number;
  muhurtamSearchCount: number; rasiBalanSearchCount: number;
  reminderCount: number; pdfDownloadCount: number; aiTokensCount: number;
  advancedMatching: boolean;
}

interface Plan {
  _id: string; slug: string; name: string; description: string;
  price: number; currency: string; isFree: boolean; isActive: boolean;
  sortOrder: number; limits: PlanLimits;
}

// ─── Field definitions ────────────────────────────────────────────────────────

type FieldDef = { key: keyof PlanLimits; label: string; bool: boolean; hint?: string };
type Section  = { title: string; icon: string; fields: FieldDef[] };

const ACCESS_SECTIONS: Section[] = [
  {
    title: 'Jathagam (Horoscope)',
    icon: '🌟',
    fields: [
      { key: 'accessJathagam',       label: 'List screen',           bool: true },
      { key: 'accessJathagamCreate', label: 'Create new chart',      bool: true },
      { key: 'accessJathagamDetail', label: 'View full detail',      bool: true },
      { key: 'accessKocharamCompare',label: 'Kocharam compare',      bool: true },
    ],
  },
  {
    title: 'Porutham (Matching)',
    icon: '💑',
    fields: [
      { key: 'accessPorutham',        label: 'Basic porutham tab',   bool: true },
      { key: 'accessAdvancedMatching',label: 'Advanced matching',    bool: true },
    ],
  },
  {
    title: 'Panchangam',
    icon: '📅',
    fields: [
      { key: 'accessPanchangam',        label: 'Main screen',        bool: true },
      { key: 'accessPanchangamCalendar',label: 'Calendar screen',    bool: true },
      { key: 'accessMuhurtam',          label: 'Muhurtam',           bool: true },
      { key: 'accessGocharaChart',      label: 'Gochara chart',      bool: true },
    ],
  },
  {
    title: 'Home Features',
    icon: '🏠',
    fields: [
      { key: 'accessNallaNeram', label: 'Nalla Neram / Horai', bool: true },
      { key: 'accessRasiBalan',  label: 'Rasi Balan',          bool: true },
      { key: 'accessVeeduBalan', label: 'Veedu Balan',         bool: true },
    ],
  },
  {
    title: 'Other Features',
    icon: '⚙️',
    fields: [
      { key: 'accessPdfDownload', label: 'PDF Export',    bool: true },
      { key: 'accessReminders',   label: 'Reminders',     bool: true },
      { key: 'accessAiFeatures',  label: 'AI Features',   bool: true },
    ],
  },
];

// Flat list for "Enable All / Disable All" and card display
const PAGE_ACCESS_FIELDS: FieldDef[] = ACCESS_SECTIONS.flatMap(s => s.fields);

const COUNT_FIELDS: FieldDef[] = [
  { key: 'jathagamCount',         label: 'Jathagam Charts',    bool: false, hint: '-1 = ∞' },
  { key: 'basicPoruthamCount',    label: 'Basic Porutham',     bool: false, hint: '-1 = ∞' },
  { key: 'advancedPoruthamCount', label: 'Advanced Matching',  bool: false, hint: '-1 = ∞' },
  { key: 'muhurtamSearchCount',   label: 'Muhurtam Searches',  bool: false, hint: '-1 = ∞' },
  { key: 'rasiBalanSearchCount',  label: 'Rasi Balan Searches',bool: false, hint: '-1 = ∞' },
  { key: 'reminderCount',         label: 'Reminders',          bool: false, hint: '-1 = ∞' },
  { key: 'pdfDownloadCount',      label: 'PDF Downloads',      bool: false, hint: '0 = blocked' },
  { key: 'aiTokensCount',         label: 'AI Tokens',          bool: false, hint: '-1 = ∞, 0 = off' },
];

const ALL_FIELDS = [...PAGE_ACCESS_FIELDS, ...COUNT_FIELDS];

const DEFAULT_LIMITS: PlanLimits = {
  // Jathagam
  accessJathagam: true, accessJathagamCreate: false, accessJathagamDetail: true, accessKocharamCompare: false,
  // Porutham
  accessPorutham: false, accessAdvancedMatching: false,
  // Panchangam
  accessPanchangam: true, accessPanchangamCalendar: true, accessMuhurtam: false, accessGocharaChart: false,
  // Home
  accessNallaNeram: true, accessRasiBalan: false, accessVeeduBalan: false,
  // Other
  accessPdfDownload: false, accessReminders: false, accessAiFeatures: false,
  // Counts
  jathagamCount: 0, basicPoruthamCount: 0, advancedPoruthamCount: 0,
  muhurtamSearchCount: 0, rasiBalanSearchCount: 0,
  reminderCount: 0, pdfDownloadCount: 0, aiTokensCount: 0,
  advancedMatching: false,
};

const EMPTY: Omit<Plan, '_id'> = {
  slug: '', name: '', description: '', price: 0, currency: 'INR',
  isFree: false, isActive: true, sortOrder: 0, limits: { ...DEFAULT_LIMITS },
};

// ─── Display helpers ──────────────────────────────────────────────────────────

function BoolChip({ v }: { v: boolean }) {
  return v
    ? <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">ON</span>
    : <span className="text-xs font-bold text-white/20 bg-white/5 px-2 py-0.5 rounded-full">OFF</span>;
}

function CountChip({ v }: { v: number }) {
  if (v === -1) return <span className="text-xs font-mono font-bold text-green-400">∞</span>;
  if (v === 0)  return <span className="text-xs font-mono font-bold text-red-400/70">0</span>;
  return <span className="text-xs font-mono font-bold text-white">{v}</span>;
}

// ─── Main page ────────────────────────────────────────────────────────────────

type ApplyMode = 'new_only' | 'all';

export default function PlansPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState<Omit<Plan, '_id'>>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [applyMode, setApplyMode] = useState<ApplyMode>('new_only');
  const [orderedPlans, setOrderedPlans] = useState<Plan[]>([]);

  const { data: plans = [], isLoading } = useQuery<Plan[]>({
    queryKey: ['admin-plans'],
    queryFn: () => axios.get(`${API}/plans`, { headers: authHeaders() })
      .then(r => (r.data.data ?? []).sort((a: Plan, b: Plan) => a.sortOrder - b.sortOrder)),
  });

  // Sync ordered list whenever the query data refreshes
  useEffect(() => {
    if (plans.length) setOrderedPlans(plans);
  }, [plans]);

  const displayPlans = orderedPlans.length ? orderedPlans : plans;

  const reorderMutation = useMutation({
    mutationFn: async (items: Plan[]) => {
      await Promise.all(
        items.map(({ _id, ...rest }, i) =>
          axios.put(`${API}/plans/${_id}`, { ...rest, sortOrder: i }, { headers: authHeaders() })
        )
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-plans'] }),
  });

  function onDragEnd(result: DropResult) {
    if (!result.destination) return;
    const src = result.source.index;
    const dst = result.destination.index;
    if (src === dst) return;
    const reordered = [...displayPlans];
    const [moved] = reordered.splice(src, 1);
    reordered.splice(dst, 0, moved);
    const withOrder = reordered.map((p, i) => ({ ...p, sortOrder: i }));
    setOrderedPlans(withOrder);
    reorderMutation.mutate(withOrder);
  }

  const save = useMutation({
    mutationFn: (data: Partial<Plan> & { _id?: string }) => {
      const { _id, ...body } = data;
      return _id
        ? axios.put(`${API}/plans/${_id}`, { ...body, applyMode }, { headers: authHeaders() })
        : axios.post(`${API}/plans`, body, { headers: authHeaders() });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-plans'] }); closeForm(); },
  });

  const deactivate = useMutation({
    mutationFn: (id: string) => axios.delete(`${API}/plans/${id}`, { headers: authHeaders() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-plans'] }),
  });

  function openCreate() { setEditId(null); setForm({ ...EMPTY, limits: { ...DEFAULT_LIMITS } }); setApplyMode('new_only'); setOpen(true); }
  function openEdit(p: Plan) { setEditId(p._id); setForm({ ...p, limits: { ...DEFAULT_LIMITS, ...p.limits } }); setApplyMode('new_only'); setOpen(true); }
  function closeForm() { setOpen(false); setEditId(null); }

  function setLimitField(key: keyof PlanLimits, val: string | boolean) {
    setForm(f => ({ ...f, limits: { ...f.limits, [key]: typeof val === 'boolean' ? val : Number(val) } }));
  }

  // Toggle all page access fields at once
  function setAllPageAccess(v: boolean) {
    const patch: Partial<PlanLimits> = {};
    PAGE_ACCESS_FIELDS.forEach(f => { (patch as any)[f.key] = v; });
    setForm(f => ({ ...f, limits: { ...f.limits, ...patch } }));
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Subscription Plans</h1>
          <p className="text-white/40 text-sm mt-1">
            All page access + feature limits are live — admin changes apply instantly to every user on that plan.
            No code changes needed.
          </p>
        </div>
        <button onClick={openCreate}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
          + New Plan
        </button>
      </div>

      {reorderMutation.isPending && <p className="text-white/40 text-sm">Saving order…</p>}

      {/* Plan cards */}
      {isLoading ? (
        <p className="text-white/40">Loading…</p>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="plans" direction="horizontal">
            {(provided) => (
              <div className="grid gap-5 md:grid-cols-3" ref={provided.innerRef} {...provided.droppableProps}>
                {displayPlans.map((plan, index) => (
                  <Draggable key={plan._id} draggableId={plan._id} index={index}>
                    {(drag, snapshot) => (
                      <div ref={drag.innerRef} {...drag.draggableProps}
                        style={{ ...drag.draggableProps.style, opacity: snapshot.isDragging ? 0.85 : 1 }}>
                        <div className={`relative bg-white/5 border rounded-2xl p-5 space-y-4 ${
                          plan.slug === 'pro' ? 'border-indigo-500/50 ring-1 ring-indigo-500/20' :
                          plan.isActive ? 'border-white/10' : 'border-red-500/20 opacity-50'
                        }`}>
                          {plan.slug === 'pro' && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                              <span className="bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">
                                ⭐ Most Popular
                              </span>
                            </div>
                          )}

                          {/* Plan header */}
                          <div className="flex items-start justify-between mt-2">
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

                          {/* Screen Access — grouped */}
                          <div className="border-t border-white/10 pt-3 space-y-2.5">
                            {ACCESS_SECTIONS.map(section => (
                              <div key={section.title}>
                                <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-1.5">
                                  {section.icon} {section.title}
                                </p>
                                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                                  {section.fields.map(({ key, label }) => (
                                    <div key={key} className="flex items-center justify-between">
                                      <span className="text-[11px] text-white/45 truncate pr-1">{label}</span>
                                      <BoolChip v={!!plan.limits[key]} />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Counts */}
                          <div className="border-t border-white/10 pt-3 space-y-1.5">
                            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">Usage Counts / month</p>
                            {COUNT_FIELDS.map(({ key, label }) => (
                              <div key={key} className="flex justify-between items-center text-xs">
                                <span className="text-white/50">{label}</span>
                                <CountChip v={plan.limits[key] as number} />
                              </div>
                            ))}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 pt-1 items-center">
                            <div {...drag.dragHandleProps}
                              className="px-2 py-1.5 text-white/20 hover:text-white/60 cursor-grab active:cursor-grabbing transition-colors text-lg select-none"
                              title="Drag to reorder">⠿</div>
                            <button onClick={() => openEdit(plan)}
                              className="flex-1 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 rounded-lg text-xs font-semibold transition-colors">
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
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* ── Edit / Create modal ── */}
      {open && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-2xl flex flex-col max-h-[92vh]">

            {/* Fixed header — never scrolls */}
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-white/10 rounded-t-2xl">
              <h2 className="text-base font-bold text-white">{editId ? 'Edit Plan' : 'New Plan'}</h2>
              <button onClick={closeForm} className="text-white/40 hover:text-white text-xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors">✕</button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 p-6 space-y-5">
              {/* Basic info */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Slug', key: 'slug', placeholder: 'pro', disabled: !!editId },
                  { label: 'Name', key: 'name', placeholder: 'Pro' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs text-white/50 block mb-1">{f.label}</label>
                    <input value={(form as any)[f.key]} disabled={f.disabled}
                      onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white disabled:opacity-40"
                      placeholder={f.placeholder} />
                  </div>
                ))}
              </div>

              <div>
                <label className="text-xs text-white/50 block mb-1">Description</label>
                <input value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  placeholder="For regular users…" />
              </div>

              <div className="grid grid-cols-3 gap-3 items-end">
                <div>
                  <label className="text-xs text-white/50 block mb-1">Price (₹/month)</label>
                  <input type="number" value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: +e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="text-xs text-white/50 block mb-1">Sort Order</label>
                  <input type="number" value={form.sortOrder}
                    onChange={e => setForm(f => ({ ...f, sortOrder: +e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-white/60 select-none pb-2">
                  <input type="checkbox" checked={form.isFree}
                    onChange={e => setForm(f => ({ ...f, isFree: e.target.checked }))}
                    className="accent-indigo-500 w-4 h-4" />
                  Free plan
                </label>
              </div>

              {/* ── Screen Access (grouped by section) ── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Screen Access</p>
                  <div className="flex gap-2">
                    <button onClick={() => setAllPageAccess(true)}
                      className="text-[11px] text-green-400 bg-green-400/10 px-2 py-0.5 rounded hover:bg-green-400/20 transition-colors">
                      Enable All
                    </button>
                    <button onClick={() => setAllPageAccess(false)}
                      className="text-[11px] text-red-400 bg-red-400/10 px-2 py-0.5 rounded hover:bg-red-400/20 transition-colors">
                      Disable All
                    </button>
                  </div>
                </div>

                {ACCESS_SECTIONS.map(section => (
                  <div key={section.title} className="border border-white/10 rounded-xl overflow-hidden">
                    {/* Section header */}
                    <div className="flex items-center justify-between px-3 py-2 bg-white/[0.06]">
                      <span className="text-xs font-semibold text-white/80">{section.icon} {section.title}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); section.fields.forEach(f => setLimitField(f.key, true)); }}
                          className="text-[11px] font-medium text-green-400 bg-green-400/10 hover:bg-green-400/20 px-2 py-0.5 rounded transition-colors">
                          All on
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); section.fields.forEach(f => setLimitField(f.key, false)); }}
                          className="text-[11px] font-medium text-red-400 bg-red-400/10 hover:bg-red-400/20 px-2 py-0.5 rounded transition-colors">
                          All off
                        </button>
                      </div>
                    </div>
                    {/* Section fields */}
                    <div className="divide-y divide-white/[0.06]">
                      {section.fields.map(({ key, label }) => {
                        const on = !!form.limits[key];
                        return (
                          <div
                            key={key}
                            className="flex items-center justify-between px-3 py-3 cursor-pointer hover:bg-white/5 select-none group"
                            onClick={() => setLimitField(key, !on)}
                          >
                            <span className="text-sm text-white/70 group-hover:text-white transition-colors">{label}</span>
                            <div className={`w-10 h-[22px] rounded-full transition-all duration-200 flex-shrink-0 relative border ${on ? 'bg-indigo-500 border-indigo-400' : 'bg-white/15 border-white/20'}`}>
                              <div className={`absolute top-[3px] w-4 h-4 rounded-full shadow-sm transition-transform duration-200 ${on ? 'translate-x-5 bg-white' : 'translate-x-[3px] bg-white/80'}`} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Usage Counts ── */}
              <div className="border border-white/10 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                  Usage Counts per Month
                  <span className="ml-2 text-white/30 font-normal normal-case tracking-normal">-1 = unlimited · 0 = blocked</span>
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                  {COUNT_FIELDS.map(({ key, label, hint }) => (
                    <div key={key} className="flex items-center justify-between gap-2">
                      <label className="text-sm text-white/70 flex-1">
                        {label}
                        {hint && <span className="text-[10px] text-white/25 ml-1">({hint})</span>}
                      </label>
                      <input type="number"
                        value={form.limits[key] as number}
                        onChange={e => setLimitField(key, e.target.value)}
                        className="w-20 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm text-white text-right flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Apply Mode (only shown when editing existing plan) ── */}
              {editId && (
                <div className="border border-white/10 rounded-xl p-4 space-y-2.5">
                  <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Who gets these changes?</p>
                  <div className="space-y-2">
                    {([
                      {
                        value: 'new_only',
                        label: 'New subscribers only',
                        desc: 'Existing paid subscribers keep their current limits until their next billing cycle.',
                        icon: '🔒',
                        color: 'border-indigo-500/50 bg-indigo-500/5',
                      },
                      {
                        value: 'all',
                        label: 'Apply to everyone now',
                        desc: 'All active subscribers on this plan get the new limits immediately.',
                        icon: '⚡',
                        color: 'border-amber-500/50 bg-amber-500/5',
                      },
                    ] as { value: ApplyMode; label: string; desc: string; icon: string; color: string }[]).map(opt => (
                      <div
                        key={opt.value}
                        onClick={() => setApplyMode(opt.value)}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          applyMode === opt.value ? opt.color : 'border-white/5 hover:border-white/15'
                        }`}
                      >
                        <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                          applyMode === opt.value ? 'border-indigo-400' : 'border-white/20'
                        }`}>
                          {applyMode === opt.value && <div className="w-2 h-2 rounded-full bg-indigo-400" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{opt.icon} {opt.label}</p>
                          <p className="text-xs text-white/40 mt-0.5">{opt.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Save / Cancel */}
              <div className="flex gap-3 pt-2">
                <button onClick={closeForm}
                  className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm transition-colors">
                  Cancel
                </button>
                <button onClick={() => save.mutate(editId ? { ...form, _id: editId } : form)}
                  disabled={save.isPending || !form.slug || !form.name}
                  className={`flex-1 py-2.5 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors ${
                    applyMode === 'all'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}>
                  {save.isPending ? 'Saving…' : applyMode === 'all' ? '⚡ Save & Apply Now' : '🔒 Save Plan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

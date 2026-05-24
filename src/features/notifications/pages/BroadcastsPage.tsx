import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Plus, Send, Clock, CheckCircle, XCircle, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import axios from 'axios';
import { useAdminAuthStore } from '../../../stores/auth.store';

// ─── API ──────────────────────────────────────────────────────────────────────

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1';

function authHeaders() {
  const token = useAdminAuthStore.getState().accessToken;
  return { Authorization: `Bearer ${token}` };
}

type BroadcastStatus   = 'draft' | 'scheduled' | 'processing' | 'sent' | 'failed' | 'cancelled';
type BroadcastAudience = 'all' | 'plan_free' | 'plan_pro' | 'plan_premium';

interface Broadcast {
  _id:          string;
  titleLocales: Record<string, string>;
  bodyLocales:  Record<string, string>;
  audience:     BroadcastAudience;
  scheduledAt:  string;
  status:       BroadcastStatus;
  sentCount:    number;
  failedCount:  number;
  createdAt:    string;
}

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'ml', label: 'മലയാളം' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
];

const AUDIENCE_LABELS: Record<BroadcastAudience, string> = {
  all:           'All Users',
  plan_free:     'Free Plan',
  plan_pro:      'Pro Plan',
  plan_premium:  'Premium Plan',
};

const STATUS_CONFIG: Record<BroadcastStatus, { color: string; icon: React.ReactNode; label: string }> = {
  draft:      { color: 'text-white/40 bg-white/5',     icon: <Clock className="w-3 h-3" />,        label: 'Draft' },
  scheduled:  { color: 'text-blue-400 bg-blue-500/10', icon: <Clock className="w-3 h-3" />,        label: 'Scheduled' },
  processing: { color: 'text-yellow-400 bg-yellow-500/10', icon: <Send className="w-3 h-3" />,     label: 'Sending…' },
  sent:       { color: 'text-green-400 bg-green-500/10',   icon: <CheckCircle className="w-3 h-3" />, label: 'Sent' },
  failed:     { color: 'text-red-400 bg-red-500/10',       icon: <XCircle className="w-3 h-3" />,    label: 'Failed' },
  cancelled:  { color: 'text-white/30 bg-white/5',         icon: <XCircle className="w-3 h-3" />,    label: 'Cancelled' },
};

// ─── Compose form ─────────────────────────────────────────────────────────────

function toLocalDatetimeValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function ComposeModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [activeLang, setActiveLang] = useState('en');
  const [titles, setTitles] = useState<Record<string, string>>({ en: '' });
  const [bodies, setBodies]  = useState<Record<string, string>>({ en: '' });
  const [audience, setAudience] = useState<BroadcastAudience>('all');
  const [scheduledAt, setScheduledAt] = useState(() => {
    const d = new Date(); d.setMinutes(d.getMinutes() + 30);
    return toLocalDatetimeValue(d);
  });
  const [saveAsDraft, setSaveAsDraft] = useState(false);

  const createMutation = useMutation({
    mutationFn: (body: unknown) =>
      axios.post(`${API}/admin/broadcasts`, body, { headers: authHeaders() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['broadcasts'] }); onClose(); },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titles['en']?.trim() || !bodies['en']?.trim()) {
      alert('English title and body are required');
      return;
    }
    createMutation.mutate({
      titleLocales: titles,
      bodyLocales:  bodies,
      audience,
      scheduledAt:  new Date(scheduledAt).toISOString(),
      status:       saveAsDraft ? 'draft' : 'scheduled',
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-cosmic-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-white font-semibold text-lg flex items-center gap-2">
            <Bell className="w-5 h-5 text-red-400" /> Compose Broadcast
          </h2>
          <button onClick={onClose} className="text-white/40 hover:text-white">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Language tabs */}
          <div>
            <label className="block text-white/50 text-xs font-medium mb-2">Message (per language)</label>
            <div className="flex gap-1 flex-wrap mb-3">
              {LANGS.map(l => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setActiveLang(l.code)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    activeLang === l.code
                      ? 'bg-red-600 text-white'
                      : 'bg-white/5 text-white/50 hover:text-white'
                  }`}
                >
                  {l.label}
                  {titles[l.code] ? ' ✓' : ''}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder={`Title (${activeLang})${activeLang === 'en' ? ' *' : ''}`}
              value={titles[activeLang] ?? ''}
              onChange={e => setTitles(p => ({ ...p, [activeLang]: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 text-sm mb-2 focus:outline-none focus:border-red-500/50"
            />
            <textarea
              rows={3}
              placeholder={`Body (${activeLang})${activeLang === 'en' ? ' *' : ''}`}
              value={bodies[activeLang] ?? ''}
              onChange={e => setBodies(p => ({ ...p, [activeLang]: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 text-sm resize-none focus:outline-none focus:border-red-500/50"
            />
          </div>

          {/* Audience */}
          <div>
            <label className="block text-white/50 text-xs font-medium mb-2">Target Audience</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(AUDIENCE_LABELS) as [BroadcastAudience, string][]).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAudience(val)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                    audience === val
                      ? 'border-red-500/50 bg-red-600/20 text-white'
                      : 'border-white/10 bg-white/5 text-white/50 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Schedule */}
          <div>
            <label className="block text-white/50 text-xs font-medium mb-2">Schedule Date & Time</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={e => setScheduledAt(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/50"
            />
          </div>

          {/* Draft toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={saveAsDraft}
              onChange={e => setSaveAsDraft(e.target.checked)}
              className="w-4 h-4 accent-red-500"
            />
            <span className="text-white/50 text-sm">Save as draft (don't schedule yet)</span>
          </label>

          {createMutation.isError && (
            <p className="text-red-400 text-sm">Failed to create broadcast. Try again.</p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white text-sm transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {createMutation.isPending ? 'Creating…' : saveAsDraft ? 'Save Draft' : 'Schedule'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Broadcast row ────────────────────────────────────────────────────────────

function BroadcastRow({ item }: { item: Broadcast }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);

  const cancelMutation = useMutation({
    mutationFn: () => axios.delete(`${API}/admin/broadcasts/${item._id}`, { headers: authHeaders() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['broadcasts'] }),
  });

  const cfg = STATUS_CONFIG[item.status];
  const canCancel = item.status === 'scheduled' || item.status === 'draft';

  return (
    <div className="border border-white/5 rounded-xl overflow-hidden">
      <div
        className="flex items-center gap-4 px-4 py-3 bg-white/3 hover:bg-white/5 cursor-pointer"
        onClick={() => setExpanded(p => !p)}
      >
        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
          {cfg.icon} {cfg.label}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{item.titleLocales['en'] ?? '—'}</p>
          <p className="text-white/30 text-xs">{item.bodyLocales['en']?.slice(0, 80) ?? ''}</p>
        </div>
        <div className="text-right flex-shrink-0 hidden sm:block">
          <p className="text-white/50 text-xs">{AUDIENCE_LABELS[item.audience]}</p>
          <p className="text-white/30 text-xs">{format(new Date(item.scheduledAt), 'dd MMM yyyy HH:mm')}</p>
        </div>
        {item.status === 'sent' && (
          <div className="text-right flex-shrink-0">
            <p className="text-green-400 text-xs font-semibold">{item.sentCount} sent</p>
            {item.failedCount > 0 && <p className="text-red-400 text-xs">{item.failedCount} failed</p>}
          </div>
        )}
        {canCancel && (
          <button
            onClick={e => { e.stopPropagation(); if (confirm('Cancel this broadcast?')) cancelMutation.mutate(); }}
            className="text-white/20 hover:text-red-400 transition-colors flex-shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        {expanded ? <ChevronUp className="w-4 h-4 text-white/30 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-white/30 flex-shrink-0" />}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/5 px-4 py-3 bg-black/20"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {LANGS.map(l => (
                (item.titleLocales[l.code] || item.bodyLocales[l.code]) ? (
                  <div key={l.code} className="bg-white/5 rounded-lg p-3">
                    <p className="text-white/30 text-[10px] font-semibold uppercase mb-1">{l.label}</p>
                    <p className="text-white text-xs font-medium">{item.titleLocales[l.code]}</p>
                    <p className="text-white/50 text-xs mt-0.5">{item.bodyLocales[l.code]}</p>
                  </div>
                ) : null
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BroadcastsPage() {
  const [showCompose, setShowCompose] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['broadcasts'],
    queryFn: async () => {
      const res = await axios.get(`${API}/admin/broadcasts`, { headers: authHeaders() });
      return res.data.data as Broadcast[];
    },
    refetchInterval: 30_000,
  });

  const broadcasts = data ?? [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-red-400" /> Push Notifications
          </h1>
          <p className="text-white/40 text-sm mt-0.5">Schedule multilingual broadcasts to all or filtered users</p>
        </div>
        <button
          onClick={() => setShowCompose(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> New Broadcast
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['scheduled', 'sent', 'failed', 'draft'] as BroadcastStatus[]).map(s => {
          const count = broadcasts.filter(b => b.status === s).length;
          const cfg = STATUS_CONFIG[s];
          return (
            <div key={s} className="glass-card px-4 py-3 flex items-center gap-3">
              <span className={`p-2 rounded-lg ${cfg.color}`}>{cfg.icon}</span>
              <div>
                <p className="text-white font-bold text-lg">{count}</p>
                <p className="text-white/40 text-xs">{cfg.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="glass-card p-12 text-center text-white/30 text-sm">Loading…</div>
        ) : broadcasts.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Bell className="w-10 h-10 mx-auto mb-3 text-white/10" />
            <p className="text-white/30 text-sm">No broadcasts yet. Create your first one.</p>
          </div>
        ) : (
          broadcasts.map(b => <BroadcastRow key={b._id} item={b} />)
        )}
      </div>

      {/* Compose modal */}
      <AnimatePresence>
        {showCompose && <ComposeModal onClose={() => setShowCompose(false)} />}
      </AnimatePresence>
    </motion.div>
  );
}

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAdminAuthStore } from '../../../stores/auth.store';
import ImageUpload from '../../../components/ImageUpload';

const API = import.meta.env.VITE_API_URL ?? 'https://api.jothisham.com/api/v1';
const hdr = () => ({ Authorization: `Bearer ${useAdminAuthStore.getState().accessToken}` });

type Lang      = 'en' | 'ta' | 'hi' | 'te' | 'ml' | 'kn';
type Audience  = 'all' | 'free' | 'paid' | 'new_users';
type Frequency = 'once' | 'daily' | 'session' | 'always';
type CtaAction = 'navigate' | 'external_url' | 'upgrade';

interface PromoContent { title: string; subtitle: string; body: string; ctaLabel: string; secondaryCtaLabel: string; }
interface PromoStats { impressions: number; ctaClicks: number; dismissals: number; }
interface Promo {
  _id: string;
  content: Partial<Record<Lang, PromoContent>>;
  imageUrl: string; backgroundColor: string; accentColor: string;
  ctaAction: CtaAction; ctaTarget: string;
  targetAudience: Audience; displayFrequency: Frequency;
  priority: number; delaySeconds: number; isActive: boolean;
  startsAt?: string; endsAt?: string;
  stats?: PromoStats;
}

const LANG_LABELS: Record<Lang, { short: string; native: string; english: string }> = {
  en: { short: 'EN', native: 'English',   english: 'English'   },
  ta: { short: 'TA', native: 'தமிழ்',     english: 'Tamil'     },
  hi: { short: 'HI', native: 'हिंदी',     english: 'Hindi'     },
  te: { short: 'TE', native: 'తెలుగు',    english: 'Telugu'    },
  ml: { short: 'ML', native: 'മലയാളം',   english: 'Malayalam' },
  kn: { short: 'KN', native: 'ಕನ್ನಡ',    english: 'Kannada'   },
};
const LANGS = Object.keys(LANG_LABELS) as Lang[];

const EMPTY_CONTENT: PromoContent = { title: '', subtitle: '', body: '', ctaLabel: 'Learn More', secondaryCtaLabel: 'Maybe Later' };
const EMPTY: Omit<Promo, '_id'> = {
  content: { en: { ...EMPTY_CONTENT } },
  imageUrl: '', backgroundColor: '#0f0d2a', accentColor: '#6366f1',
  ctaAction: 'navigate', ctaTarget: '',
  targetAudience: 'all', displayFrequency: 'once', priority: 0, delaySeconds: 0, isActive: true,
};

const SCREENS = [
  'Home','Charts','Porutham','Panchangam','Settings','Subscription',
  'RasiBalan','VeeduBalan','NallaNeram','DailyHoroscope','BalanHub','WidgetGuide',
];

// Pre-filled widget promotion template (all 6 languages)
const WIDGET_TEMPLATE: Omit<Promo, '_id'> = {
  content: {
    en: {
      title: '📱 Add Jothisham to Your Home Screen!',
      subtitle: 'New Feature',
      body: 'See Nalla Neram, your Nakshatra, Rasi and daily Balan scores without opening the app. Available in 2 sizes.',
      ctaLabel: 'How to Add Widget',
      secondaryCtaLabel: 'Later',
    },
    ta: {
      title: '📱 ஜோதிஷம் வீட்டுத்திரையில் சேர்க்கவும்!',
      subtitle: 'புதிய அம்சம்',
      body: 'App திறக்காமலேயே நல்ல நேரம், நட்சத்திரம், ராசி மற்றும் தினசரி பலன்களை பார்க்கவும். 2 அளவுகளில் கிடைக்கும்.',
      ctaLabel: 'விட்ஜெட் சேர்ப்பது எப்படி',
      secondaryCtaLabel: 'பின்னர்',
    },
    hi: {
      title: '📱 होम स्क्रीन पर जोतिषम जोड़ें!',
      subtitle: 'नई सुविधा',
      body: 'App खोले बिना नल्ला नेरम, नक्षत्र, राशि और दैनिक बलम स्कोर देखें। 2 आकारों में उपलब्ध।',
      ctaLabel: 'विजेट कैसे जोड़ें',
      secondaryCtaLabel: 'बाद में',
    },
    te: {
      title: '📱 హోమ్ స్క్రీన్‌కు జోతిషం జోడించండి!',
      subtitle: 'కొత్త అంశం',
      body: 'App తెరవకుండానే నల్ల నేరం, నక్షత్రం, రాశి మరియు రోజువారీ బలం స్కోర్‌లు చూడండి.',
      ctaLabel: 'విడ్జెట్ ఎలా జోడించాలి',
      secondaryCtaLabel: 'తర్వాత',
    },
    ml: {
      title: '📱 ഹോം സ്ക്രീനിൽ ജ്യോതിഷം ചേർക്കൂ!',
      subtitle: 'പുതിയ ഫീച്ചർ',
      body: 'App തുറക്കാതെ നല്ല നേരം, നക്ഷത്രം, രാശി, ദൈനദിന ബലം സ്കോർ കാണൂ. 2 വലുപ്പങ്ങളിൽ.',
      ctaLabel: 'വിജറ്റ് ചേർക്കുന്നത് എങ്ങനെ',
      secondaryCtaLabel: 'പിന്നീട്',
    },
    kn: {
      title: '📱 ಹೋಮ್ ಸ್ಕ್ರೀನ್‌ಗೆ ಜ್ಯೋತಿಷಂ ಸೇರಿಸಿ!',
      subtitle: 'ಹೊಸ ವೈಶಿಷ್ಟ್ಯ',
      body: 'App ತೆರೆಯದೆ ನಲ್ಲ ನೇರಂ, ನಕ್ಷತ್ರ, ರಾಶಿ ಮತ್ತು ದೈನಂದಿನ ಬಲಂ ಸ್ಕೋರ್‌ಗಳನ್ನು ನೋಡಿ.',
      ctaLabel: 'ವಿಜೆಟ್ ಹೇಗೆ ಸೇರಿಸುವುದು',
      secondaryCtaLabel: 'ನಂತರ',
    },
  },
  imageUrl: '',
  backgroundColor: '#0f0d2a',
  accentColor: '#F59E0B',
  ctaAction: 'navigate',
  ctaTarget: 'WidgetGuide',
  targetAudience: 'all',
  displayFrequency: 'once',
  priority: 10,
  delaySeconds: 0,
  isActive: true,
};

const AUDIENCE_LABELS: Record<Audience, string> = {
  all: 'All Users', free: 'Free Users Only',
  paid: 'Paid Users Only', new_users: 'New Users (last 7 days)',
};
const FREQ_LABELS: Record<Frequency, string> = {
  once: 'Once ever', daily: 'Once per day', session: 'Once per session', always: 'Always',
};

export default function PromosPage() {
  const qc = useQueryClient();
  const [form, setForm]     = useState<Omit<Promo, '_id'>>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen]     = useState(false);
  const [activeLang, setActiveLang] = useState<Lang>('en');

  const { data: promos = [], isLoading } = useQuery<Promo[]>({
    queryKey: ['admin-promos'],
    queryFn: () => axios.get(`${API}/promos`, { headers: hdr() }).then(r => r.data.data ?? []),
  });

  const save = useMutation({
    mutationFn: (d: Partial<Promo> & { _id?: string }) =>
      d._id ? axios.put(`${API}/promos/${d._id}`, d, { headers: hdr() })
            : axios.post(`${API}/promos`, d, { headers: hdr() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-promos'] }); close(); },
  });

  const remove = useMutation({
    mutationFn: (id: string) => axios.delete(`${API}/promos/${id}`, { headers: hdr() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-promos'] }),
  });

  const toggle = useMutation({
    mutationFn: (id: string) => axios.patch(`${API}/promos/${id}/toggle`, {}, { headers: hdr() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-promos'] }),
  });

  // datetime-local input requires 'YYYY-MM-DDTHH:MM' — strip timezone/seconds from ISO string
  function toLocalInput(iso?: string): string {
    if (!iso) return '';
    try { return new Date(iso).toISOString().slice(0, 16); } catch { return ''; }
  }

  function openCreate() { setEditId(null); setForm({ ...EMPTY, content: { en: { ...EMPTY_CONTENT } } }); setActiveLang('en'); setOpen(true); }
  function openEdit(p: Promo) {
    setEditId(p._id);
    setForm({
      ...p,
      content:  p.content ?? { en: { ...EMPTY_CONTENT } },
      startsAt: toLocalInput(p.startsAt),
      endsAt:   toLocalInput(p.endsAt),
    });
    setActiveLang('en');
    setOpen(true);
  }
  function close() { setOpen(false); setEditId(null); }
  function set(k: string, v: any) { setForm(f => ({ ...f, [k]: v })); }
  function setContent(lang: Lang, field: keyof PromoContent, val: string) {
    setForm(f => ({
      ...f,
      content: {
        ...f.content,
        [lang]: { ...(f.content[lang] ?? EMPTY_CONTENT), [field]: val },
      },
    }));
  }
  const cur = form.content[activeLang] ?? EMPTY_CONTENT;
  const enContent = form.content['en'] ?? EMPTY_CONTENT; // preview always uses EN fallback

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Promo Modals</h1>
          <p className="text-white/40 text-sm mt-1">Animated ads shown to users based on audience targeting</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditId(null);
              setForm({ ...WIDGET_TEMPLATE });
              setActiveLang('en');
              setOpen(true);
            }}
            className="px-4 py-2 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 rounded-lg text-sm font-medium transition-colors">
            📱 Widget Promo
          </button>
          <button onClick={openCreate}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
            + New Promo
          </button>
        </div>
      </div>

      {isLoading ? <p className="text-white/40">Loading…</p> : (
        <div className="space-y-3">
          {promos.map(p => (
            <div key={p._id}
              className={`bg-white/5 border rounded-xl p-4 flex items-center gap-4 ${p.isActive ? 'border-white/10' : 'border-white/5 opacity-50'}`}>
              {/* Colour swatch */}
              <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-lg border border-white/10"
                style={{ backgroundColor: p.backgroundColor }}>
                <span style={{ color: p.accentColor }}>✦</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate">{p.content?.['en']?.title || p.content?.en?.title || '—'}</p>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded">
                    {AUDIENCE_LABELS[p.targetAudience]}
                  </span>
                  <span className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded">
                    {FREQ_LABELS[p.displayFrequency]}
                  </span>
                  <span className="text-xs text-white/40">Priority: {p.priority}</span>
                </div>

                {/* Impression stats */}
                {p.stats && (
                  <div className="flex gap-4 mt-2 pt-2 border-t border-white/5">
                    <div className="text-center">
                      <p className="text-white font-bold text-sm">{(p.stats?.impressions ?? 0).toLocaleString()}</p>
                      <p className="text-white/30 text-[10px]">👁 Impressions</p>
                    </div>
                    <div className="text-center">
                      <p className="text-green-400 font-bold text-sm">{(p.stats?.ctaClicks ?? 0).toLocaleString()}</p>
                      <p className="text-white/30 text-[10px]">👆 Clicks</p>
                    </div>
                    <div className="text-center">
                      <p className="text-white/50 font-bold text-sm">{(p.stats?.dismissals ?? 0).toLocaleString()}</p>
                      <p className="text-white/30 text-[10px]">✕ Dismissed</p>
                    </div>
                    <div className="text-center">
                      <p className="text-indigo-400 font-bold text-sm">
                        {(p.stats?.impressions ?? 0) > 0
                          ? `${(((p.stats?.ctaClicks ?? 0) / (p.stats?.impressions ?? 1)) * 100).toFixed(1)}%`
                          : '—'}
                      </p>
                      <p className="text-white/30 text-[10px]">📊 CTR</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => toggle.mutate(p._id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    p.isActive ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                               : 'bg-white/10 text-white/50 hover:bg-white/20'}`}>
                  {p.isActive ? 'Active' : 'Inactive'}
                </button>
                <button onClick={() => openEdit(p)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs transition-colors">
                  Edit
                </button>
                <button onClick={() => remove.mutate(p._id)}
                  className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/25 text-red-400 rounded-lg text-xs transition-colors">
                  Delete
                </button>
              </div>
            </div>
          ))}
          {!promos.length && (
            <div className="text-center py-16 text-white/20">No promos yet — create one to get started</div>
          )}
        </div>
      )}

      {/* Form Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[92vh] flex flex-col sm:flex-row gap-0 overflow-y-auto sm:overflow-hidden">

            {/* Form */}
            <div className="flex-1 sm:overflow-y-auto p-4 sm:p-6 space-y-4">
              <h2 className="text-base font-bold text-white sm:sticky sm:top-0 bg-gray-900 pb-2">
                {editId ? 'Edit Promo' : 'New Promo'}
              </h2>

              {/* Localised Content */}
              <section className="space-y-3">
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Content</p>

                {/* Language tabs */}
                <div className="flex gap-1 flex-wrap">
                  {LANGS.map(l => {
                    const filled = !!(form.content[l]?.title);
                    return (
                      <button key={l} onClick={() => setActiveLang(l)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors relative ${
                          activeLang === l ? 'bg-indigo-600 text-white' : 'bg-white/5 text-white/50 hover:bg-white/10'
                        }`}>
                        <span className="font-bold">{LANG_LABELS[l].native}</span>
                        <span className="text-[9px] opacity-60 ml-1">{LANG_LABELS[l].english}</span>
                        {filled && activeLang !== l && (
                          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-green-400" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {activeLang !== 'en' && (
                  <p className="text-xs text-white/30 italic">Empty fields fall back to English automatically.</p>
                )}

                <input value={cur.title} onChange={e => setContent(activeLang, 'title', e.target.value)}
                  className={`w-full bg-gray-900 border rounded-lg px-3 py-2 text-sm text-white ${
                    activeLang === 'en' && !cur.title.trim() ? 'border-red-500/60' : 'border-white/10'
                  }`}
                  placeholder={activeLang === 'en' ? 'Title * (required)' : `Title (${activeLang}) — leave blank to use EN`} />
                {activeLang === 'en' && !cur.title.trim() && (
                  <p className="text-red-400 text-xs -mt-1">English title is required to save</p>
                )}
                <input value={cur.subtitle} onChange={e => setContent(activeLang, 'subtitle', e.target.value)}
                  className="w-full bg-gray-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  placeholder="Subtitle (shown above title)" />
                <textarea value={cur.body} onChange={e => setContent(activeLang, 'body', e.target.value)} rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white resize-none"
                  placeholder="Body text (optional)" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input value={cur.ctaLabel} onChange={e => setContent(activeLang, 'ctaLabel', e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                    placeholder="CTA button text" />
                  <input value={cur.secondaryCtaLabel} onChange={e => setContent(activeLang, 'secondaryCtaLabel', e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                    placeholder="Dismiss button text" />
                </div>
                <ImageUpload
                  label="Image (shared across all languages)"
                  value={form.imageUrl}
                  onChange={url => set('imageUrl', url)}
                  aspectClassName="aspect-[16/9]"
                />
              </section>

              {/* Design */}
              <section className="space-y-3">
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Design</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Background', key: 'backgroundColor' },
                    { label: 'Accent colour', key: 'accentColor' },
                  ].map(f => (
                    <div key={f.key} className="flex items-center gap-2">
                      <input type="color" value={(form as any)[f.key]} onChange={e => set(f.key, e.target.value)}
                        className="w-9 h-9 rounded-lg cursor-pointer border-0 bg-transparent" />
                      <span className="text-xs text-white/50">{f.label}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* CTA */}
              <section className="space-y-3">
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">CTA Action</p>
                <select value={form.ctaAction} onChange={e => set('ctaAction', e.target.value)}
                  className="w-full bg-gray-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
                  <option value="navigate">Navigate to screen</option>
                  <option value="external_url">Open external URL</option>
                  <option value="upgrade">Open subscription screen</option>
                </select>
                {form.ctaAction === 'navigate' ? (
                  <select value={form.ctaTarget} onChange={e => set('ctaTarget', e.target.value)}
                    className="w-full bg-gray-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
                    <option value="">Select screen…</option>
                    {SCREENS.map(s => <option key={s} value={s} className="bg-gray-900 text-white">{s}</option>)}
                  </select>
                ) : form.ctaAction === 'external_url' ? (
                  <input value={form.ctaTarget} onChange={e => set('ctaTarget', e.target.value)}
                    className="w-full bg-gray-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                    placeholder="https://…" />
                ) : null}
              </section>

              {/* Targeting */}
              <section className="space-y-3">
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Targeting</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-white/50 block mb-1">Show to</label>
                    <select value={form.targetAudience} onChange={e => set('targetAudience', e.target.value)}
                      className="w-full bg-gray-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
                      {Object.entries(AUDIENCE_LABELS).map(([v, l]) =>
                        <option key={v} value={v} className="bg-gray-900 text-white">{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-white/50 block mb-1">Frequency</label>
                    <select value={form.displayFrequency} onChange={e => set('displayFrequency', e.target.value)}
                      className="w-full bg-gray-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
                      {Object.entries(FREQ_LABELS).map(([v, l]) =>
                        <option key={v} value={v} className="bg-gray-900 text-white">{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-white/50 block mb-1">Priority (higher = first)</label>
                    <input type="number" value={form.priority} onChange={e => set('priority', +e.target.value)}
                      className="w-full bg-gray-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 block mb-1">Delay (seconds before showing)</label>
                    <input type="number" min={0} value={form.delaySeconds} onChange={e => set('delaySeconds', Math.max(0, +e.target.value))}
                      className="w-full bg-gray-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 block mb-1">Active</label>
                    <label className="flex items-center gap-2 cursor-pointer mt-2.5 text-sm text-white/60 select-none">
                      <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)}
                        className="accent-indigo-500 w-4 h-4" />
                      Enabled
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-white/50 block mb-1">Start date (optional)</label>
                    <input type="datetime-local" value={form.startsAt ?? ''} onChange={e => set('startsAt', e.target.value || undefined)}
                      className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white [color-scheme:dark]" />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 block mb-1">End date (optional)</label>
                    <input type="datetime-local" value={form.endsAt ?? ''} onChange={e => set('endsAt', e.target.value || undefined)}
                      className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white [color-scheme:dark]" />
                  </div>
                </div>
              </section>

              {/* Save */}
              <div className="flex gap-3 pt-2 sm:sticky sm:bottom-0 bg-gray-900 pb-1">
                <button onClick={close}
                  className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm transition-colors">
                  Cancel
                </button>
                <button onClick={() => save.mutate(editId ? { ...form, _id: editId } : form)}
                  disabled={save.isPending || !form.content?.en?.title?.trim()}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors">
                  {save.isPending ? 'Saving…' : 'Save Promo'}
                </button>
              </div>
            </div>

            {/* Live preview */}
            <div className="w-full sm:w-64 flex-shrink-0 border-t sm:border-t-0 sm:border-l border-white/10 p-4 flex flex-col items-center justify-center bg-black/30">
              <p className="text-xs text-white/30 mb-4 uppercase tracking-wider">Preview</p>
              <div className="w-full rounded-xl overflow-hidden border border-white/10 shadow-2xl"
                style={{ backgroundColor: form.backgroundColor }}>
                <div className="h-1 w-full" style={{ backgroundColor: form.accentColor }} />
                {form.imageUrl && (
                  <img src={form.imageUrl} alt="" className="w-full aspect-[16/9] object-cover" />
                )}
                <div className="p-4">
                  {enContent.subtitle && (
                    <p className="text-xs font-semibold uppercase tracking-wide mb-1"
                      style={{ color: form.accentColor }}>{enContent.subtitle}</p>
                  )}
                  <p className="text-white font-bold text-sm leading-snug">{enContent.title || 'Title'}</p>
                  {enContent.body && <p className="text-white/50 text-xs mt-1 leading-relaxed">{enContent.body}</p>}
                </div>
                <div className="px-4 pb-4 space-y-2">
                  <div className="py-2.5 rounded-xl text-center text-xs font-bold text-white"
                    style={{ backgroundColor: form.accentColor }}>
                    {enContent.ctaLabel || 'CTA'}
                  </div>
                  {enContent.secondaryCtaLabel && (
                    <p className="text-center text-xs text-white/30">{enContent.secondaryCtaLabel}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

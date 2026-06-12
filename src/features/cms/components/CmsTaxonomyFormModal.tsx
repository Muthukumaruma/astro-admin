import { useState } from 'react';
import { LANGS, LANG_LABELS, type Lang, type LangMap } from '../api/cms.api';
import CmsImageUpload from './CmsImageUpload';

export interface CmsTaxonomyFormValue {
  slug: string;
  name: LangMap;
  description: LangMap;
  cardImageUrl: string;
  isActive: boolean;
  isFeatured?: boolean;
}

interface CmsTaxonomyFormModalProps {
  title: string;
  initial: CmsTaxonomyFormValue;
  saving: boolean;
  onSave: (value: CmsTaxonomyFormValue) => void;
  onClose: () => void;
}

export default function CmsTaxonomyFormModal({ title, initial, saving, onSave, onClose }: CmsTaxonomyFormModalProps) {
  const [form, setForm] = useState<CmsTaxonomyFormValue>(initial);
  const [activeLang, setActiveLang] = useState<Lang>('en');

  function set<K extends keyof CmsTaxonomyFormValue>(key: K, value: CmsTaxonomyFormValue[K]) {
    setForm(f => ({ ...f, [key]: value }));
  }
  function setLangField(field: 'name' | 'description', lang: Lang, value: string) {
    setForm(f => ({ ...f, [field]: { ...f[field], [lang]: value } }));
  }

  const canSave = !!form.name.en?.trim();

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-6 space-y-4">
        <h2 className="text-base font-bold text-white sticky top-0 bg-gray-900 pb-2">{title}</h2>

        <CmsImageUpload label="Card image" value={form.cardImageUrl} onChange={url => set('cardImageUrl', url)} />

        {/* Language tabs */}
        <div className="space-y-3">
          <div className="flex gap-1 flex-wrap">
            {LANGS.map(l => {
              const filled = !!form.name[l];
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

          <input
            value={form.name[activeLang] ?? ''}
            onChange={e => setLangField('name', activeLang, e.target.value)}
            className={`w-full bg-gray-900 border rounded-lg px-3 py-2 text-sm text-white ${
              activeLang === 'en' && !form.name.en?.trim() ? 'border-red-500/60' : 'border-white/10'
            }`}
            placeholder={activeLang === 'en' ? 'Name * (required)' : `Name (${activeLang})`}
          />
          {activeLang === 'en' && !form.name.en?.trim() && (
            <p className="text-red-400 text-xs -mt-1">English name is required to save</p>
          )}
          <textarea
            value={form.description[activeLang] ?? ''}
            onChange={e => setLangField('description', activeLang, e.target.value)}
            rows={2}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white resize-none"
            placeholder={`Description (${activeLang}, optional)`}
          />
        </div>

        <div>
          <label className="text-xs text-white/50 block mb-1">Slug (URL-friendly, auto-generated if blank)</label>
          <input
            value={form.slug}
            onChange={e => set('slug', e.target.value)}
            className="w-full bg-gray-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
            placeholder="e.g. tamil-literature"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer text-sm text-white/60 select-none">
          <input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} className="accent-indigo-500 w-4 h-4" />
          Active (visible to users)
        </label>

        {form.isFeatured !== undefined && (
          <label className="flex items-center gap-2 cursor-pointer text-sm text-white/60 select-none">
            <input type="checkbox" checked={!!form.isFeatured} onChange={e => set('isFeatured', e.target.checked)} className="accent-indigo-500 w-4 h-4" />
            ⭐ Featured (show in homepage carousel)
          </label>
        )}

        <div className="flex gap-3 pt-2 sticky bottom-0 bg-gray-900 pb-1">
          <button onClick={onClose} className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm transition-colors">
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={saving || !canSave}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

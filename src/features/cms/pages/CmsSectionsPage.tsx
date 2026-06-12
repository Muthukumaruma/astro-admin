import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Settings } from 'lucide-react';
import { API, hdr, CMS_SECTION, LANGS, LANG_LABELS, type CmsSection, type Lang, type LangMap } from '../api/cms.api';

export default function CmsSectionsPage() {
  const qc = useQueryClient();

  const { data: sections, isLoading } = useQuery<CmsSection[]>({
    queryKey: ['cms-sections'],
    queryFn: () => axios.get(`${API}/admin/cms/sections`, { headers: hdr() }).then(r => r.data.data ?? []),
  });

  const section = sections?.find(s => s.type === CMS_SECTION);

  const [name, setName] = useState<LangMap>({});
  const [description, setDescription] = useState<LangMap>({});
  const [icon, setIcon] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [enabledLanguages, setEnabledLanguages] = useState<Lang[]>([...LANGS]);
  const [activeLang, setActiveLang] = useState<Lang>('en');

  useEffect(() => {
    if (!section) return;
    setName(section.name ?? {});
    setDescription(section.description ?? {});
    setIcon(section.icon ?? '');
    setIsActive(section.isActive);
    setEnabledLanguages(section.enabledLanguages ?? [...LANGS]);
  }, [section]);

  const save = useMutation({
    mutationFn: () => axios.put(`${API}/admin/cms/sections/${section!._id}`, {
      name, description, icon, isActive, enabledLanguages,
    }, { headers: hdr() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cms-sections'] }),
  });

  function toggleLang(l: Lang) {
    setEnabledLanguages(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l]);
  }

  if (isLoading) return <div className="p-6 text-white/40">Loading…</div>;
  if (!section) return <div className="p-6 text-white/40">Books section not found.</div>;

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Settings className="w-6 h-6" /> Books — Settings</h1>
        <p className="text-white/40 text-sm mt-1">Configure the Books section's name, description, and availability.</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
        <div className="flex gap-1 flex-wrap">
          {LANGS.map(l => {
            const filled = !!name[l];
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
          value={name[activeLang] ?? ''}
          onChange={e => setName(n => ({ ...n, [activeLang]: e.target.value }))}
          className="w-full bg-gray-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
          placeholder={activeLang === 'en' ? 'Name * (required)' : `Name (${activeLang})`}
        />
        <textarea
          value={description[activeLang] ?? ''}
          onChange={e => setDescription(d => ({ ...d, [activeLang]: e.target.value }))}
          rows={2}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white resize-none"
          placeholder={`Description (${activeLang}, optional)`}
        />

        <div>
          <label className="text-xs text-white/50 block mb-1">Icon (emoji or icon name)</label>
          <input
            value={icon}
            onChange={e => setIcon(e.target.value)}
            className="w-full bg-gray-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
            placeholder="e.g. 📚"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer text-sm text-white/60 select-none bg-white/5 border border-white/10 rounded-lg px-3 py-2.5">
          <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="accent-indigo-500 w-4 h-4" />
          <span>
            <span className="block font-medium text-white/80">Show Blogs (Web &amp; Mobile)</span>
            <span className="block text-xs text-white/40">When off, the Blogs button, all blog pages, and the homepage featured carousel are hidden everywhere.</span>
          </span>
        </label>

        <div>
          <label className="text-xs text-white/50 block mb-2">Enabled languages — Blogs is hidden from users whose app language is not checked</label>
          <div className="flex gap-2 flex-wrap">
            {LANGS.map(l => (
              <label key={l} className={`flex items-center gap-1.5 cursor-pointer text-xs px-2.5 py-1.5 rounded-lg select-none transition-colors ${
                enabledLanguages.includes(l) ? 'bg-indigo-600/20 text-white border border-indigo-500/40' : 'bg-white/5 text-white/40 border border-white/10'
              }`}>
                <input type="checkbox" checked={enabledLanguages.includes(l)} onChange={() => toggleLang(l)} className="accent-indigo-500 w-3.5 h-3.5" />
                <span className="font-bold">{LANG_LABELS[l].native}</span>
                <span className="opacity-60">{LANG_LABELS[l].english}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending || !name.en?.trim()}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            {save.isPending ? 'Saving…' : 'Save'}
          </button>
          {save.isSuccess && <span className="ml-3 text-green-400 text-sm">Saved</span>}
        </div>
      </div>
    </div>
  );
}

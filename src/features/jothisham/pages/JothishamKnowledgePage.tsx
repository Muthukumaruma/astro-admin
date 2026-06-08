import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { BookOpen, Plus, Pencil, Trash2, Search, UploadCloud, CheckCheck, X } from 'lucide-react';
import { useAdminAuthStore } from '../../../stores/auth.store';

const API = import.meta.env.VITE_API_URL ?? 'https://api.jothisham.com/api/v1';
const hdr = () => ({ Authorization: `Bearer ${useAdminAuthStore.getState().accessToken}` });

interface KnowledgeEntry {
  _id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  source: string;
  language: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const CATEGORIES = [
  'yogam', 'dosham', 'graha', 'dasa', 'bhava', 'nakshatra', 'rasi',
  'remedy', 'panchangam', 'general',
];

const LANGUAGES: { code: string; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'ta', label: 'Tamil' },
  { code: 'hi', label: 'Hindi' },
  { code: 'te', label: 'Telugu' },
  { code: 'ml', label: 'Malayalam' },
  { code: 'kn', label: 'Kannada' },
];

const EMPTY: Omit<KnowledgeEntry, '_id'> = {
  title: '', content: '', category: 'general', tags: [], source: '', language: 'en', isActive: true,
};

interface IngestionJob {
  _id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileName: string;
  category: string;
  language: string;
  source: string;
  totalBatches: number;
  processedBatches: number;
  totalChunks: number;
  processedChunks: number;
  skippedDuplicates: number;
  skippedLowQuality: number;
  error?: string;
}

const EMPTY_INGEST = { category: 'general', language: 'en', source: '' };

export default function JothishamKnowledgePage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<KnowledgeEntry, '_id'>>(EMPTY);
  const [tagsInput, setTagsInput] = useState('');
  const [saveError, setSaveError] = useState('');

  // ─── Document ingestion (upload → OCR/extract → chunk → stage for review) ───
  const [ingestOpen, setIngestOpen] = useState(false);
  const [ingestForm, setIngestForm] = useState(EMPTY_INGEST);
  const [ingestFile, setIngestFile] = useState<File | null>(null);
  const [ingestError, setIngestError] = useState('');
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  const { data: entries = [], isLoading } = useQuery<KnowledgeEntry[]>({
    queryKey: ['jothisham-knowledge', categoryFilter, languageFilter, search],
    queryFn: () => axios.get(`${API}/jothisham/knowledge`, {
      headers: hdr(),
      params: {
        ...(categoryFilter ? { category: categoryFilter } : {}),
        ...(languageFilter ? { language: languageFilter } : {}),
        ...(search ? { q: search } : {}),
      },
    }).then(r => r.data.data ?? []),
  });

  const save = useMutation({
    mutationFn: async (data: Omit<KnowledgeEntry, '_id'> & { _id?: string }) => {
      setSaveError('');
      const { _id, ...body } = data;
      if (_id) {
        await axios.put(`${API}/jothisham/knowledge/${_id}`, body, { headers: hdr() });
      } else {
        await axios.post(`${API}/jothisham/knowledge`, body, { headers: hdr() });
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['jothisham-knowledge'] }); closeForm(); },
    onError: (err: any) => setSaveError(err?.response?.data?.error ?? err?.message ?? 'Unknown error'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => axios.delete(`${API}/jothisham/knowledge/${id}`, { headers: hdr() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jothisham-knowledge'] }),
  });

  const ingest = useMutation({
    mutationFn: async () => {
      setIngestError('');
      if (!ingestFile) throw new Error('Choose a file to upload');
      const body = new FormData();
      body.append('file', ingestFile);
      body.append('category', ingestForm.category);
      body.append('language', ingestForm.language);
      body.append('source', ingestForm.source);
      const res = await axios.post(`${API}/jothisham/knowledge/ingest`, body, {
        headers: { ...hdr(), 'Content-Type': 'multipart/form-data' },
      });
      return res.data.data as { jobId: string };
    },
    onSuccess: ({ jobId }) => {
      setActiveJobId(jobId);
      setIngestOpen(false);
      setIngestFile(null);
      setIngestForm(EMPTY_INGEST);
    },
    onError: (err: any) => setIngestError(err?.response?.data?.error ?? err?.message ?? 'Upload failed'),
  });

  const { data: activeJob } = useQuery<IngestionJob | null>({
    queryKey: ['jothisham-ingestion-job', activeJobId],
    queryFn: () => axios.get(`${API}/jothisham/knowledge/ingest/${activeJobId}`, { headers: hdr() })
      .then(r => r.data.data ?? null),
    enabled: !!activeJobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'completed' || status === 'failed' ? false : 2000;
    },
  });

  const { data: reviewChunks = [] } = useQuery<KnowledgeEntry[]>({
    queryKey: ['jothisham-knowledge-review', activeJobId],
    queryFn: () => axios.get(`${API}/jothisham/knowledge`, {
      headers: hdr(),
      params: { ingestionJobId: activeJobId },
    }).then(r => r.data.data ?? []),
    enabled: !!activeJobId && activeJob?.status === 'completed',
  });

  const publishAll = useMutation({
    mutationFn: (ids: string[]) => axios.post(`${API}/jothisham/knowledge/bulk-activate`, { ids }, { headers: hdr() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jothisham-knowledge'] });
      qc.invalidateQueries({ queryKey: ['jothisham-knowledge-review'] });
    },
  });

  function openIngest() {
    setIngestForm(EMPTY_INGEST);
    setIngestFile(null);
    setIngestError('');
    setIngestOpen(true);
  }

  function openCreate() {
    setEditId(null);
    setForm({ ...EMPTY });
    setTagsInput('');
    setSaveError('');
    setOpen(true);
  }

  function openEdit(entry: KnowledgeEntry) {
    setEditId(entry._id);
    setForm({
      title: entry.title, content: entry.content, category: entry.category,
      tags: entry.tags ?? [], source: entry.source ?? '', language: entry.language ?? 'en',
      isActive: entry.isActive,
    });
    setTagsInput((entry.tags ?? []).join(', '));
    setSaveError('');
    setOpen(true);
  }

  function closeForm() { setOpen(false); setEditId(null); }

  function submit() {
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    save.mutate(editId ? { ...form, tags, _id: editId } : { ...form, tags });
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            Jothisham Knowledge
          </h1>
          <p className="text-white/40 text-xs md:text-sm mt-1 hidden sm:block">
            Astrology book corpus (RAG) used by Jothisham AI to ground its predictions
          </p>
        </div>
        <div className="flex-shrink-0 flex items-center gap-2">
          <button onClick={openIngest}
            className="flex items-center gap-1.5 px-3 py-2 md:px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors">
            <UploadCloud className="w-4 h-4" /> Ingest Document
          </button>
          <button onClick={openCreate}
            className="flex items-center gap-1.5 px-3 py-2 md:px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> New Entry
          </button>
        </div>
      </div>

      {/* Ingestion job progress / review banner */}
      {activeJob && (
        <div className="glass-card p-4 border border-indigo-500/30 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">
                Ingesting "{activeJob.fileName}"
              </p>
              <p className="text-white/40 text-xs mt-0.5">
                {activeJob.status === 'pending' && 'Queued…'}
                {activeJob.status === 'processing' && activeJob.totalChunks > 0 &&
                  `Chunking & embedding… ${activeJob.processedChunks}/${activeJob.totalChunks} chunks processed`}
                {activeJob.status === 'processing' && activeJob.totalChunks === 0 && activeJob.totalBatches > 1 &&
                  `Extracting text… ${activeJob.processedBatches}/${activeJob.totalBatches} page-batches processed`}
                {activeJob.status === 'processing' && activeJob.totalChunks === 0 && activeJob.totalBatches <= 1 &&
                  'Extracting & analyzing document…'}
                {activeJob.status === 'completed' && `Done — ${activeJob.totalChunks} chunks staged for review (${activeJob.skippedDuplicates} duplicates, ${activeJob.skippedLowQuality} low-quality skipped)`}
                {activeJob.status === 'failed' && `Failed — ${activeJob.error ?? 'unknown error'}`}
              </p>
            </div>
            <button onClick={() => setActiveJobId(null)}
              className="text-white/30 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors" title="Dismiss">
              <X className="w-4 h-4" />
            </button>
          </div>

          {(activeJob.status === 'pending' || activeJob.status === 'processing') && (
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 transition-all"
                style={{
                  width: activeJob.totalChunks
                    ? `${Math.min(100, (activeJob.processedChunks / activeJob.totalChunks) * 100)}%`
                    : activeJob.totalBatches > 1
                      ? `${Math.min(100, (activeJob.processedBatches / activeJob.totalBatches) * 100)}%`
                      : '8%',
                }} />
            </div>
          )}

          {activeJob.status === 'completed' && reviewChunks.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-amber-400 text-xs font-semibold uppercase tracking-wide">Pending Review — {reviewChunks.length} chunks</p>
                <button onClick={() => publishAll.mutate(reviewChunks.map(c => c._id))}
                  disabled={publishAll.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition-colors">
                  <CheckCheck className="w-3.5 h-3.5" /> {publishAll.isPending ? 'Publishing…' : 'Publish All'}
                </button>
              </div>
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {reviewChunks.map(entry => (
                  <div key={entry._id} className="glass-card p-3 border border-amber-500/20">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">PENDING REVIEW</span>
                        <h4 className="text-white text-sm font-semibold mt-1.5 truncate">{entry.title}</h4>
                        <p className="text-white/40 text-xs mt-1 line-clamp-2">{entry.content}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => openEdit(entry)}
                          className="p-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 rounded-lg transition-colors" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => { if (confirm(`Delete "${entry.title}"?`)) remove.mutate(entry._id); }}
                          className="p-2 bg-red-500/10 hover:bg-red-500/25 text-red-400 rounded-lg transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeJob.status === 'completed' && reviewChunks.length === 0 && (
            <p className="text-white/30 text-xs">No chunks were staged from this document — it may not have contained usable astrology content.</p>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search title or content…"
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/25" />
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
          <option className="bg-gray-900 text-white" value="">All categories</option>
          {CATEGORIES.map(c => <option key={c} className="bg-gray-900 text-white" value={c}>{c}</option>)}
        </select>
        <select value={languageFilter} onChange={e => setLanguageFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
          <option className="bg-gray-900 text-white" value="">All languages</option>
          {LANGUAGES.map(l => <option key={l.code} className="bg-gray-900 text-white" value={l.code}>{l.label}</option>)}
        </select>
      </div>

      {/* List */}
      {isLoading ? (
        <p className="text-white/40">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="text-white/30 text-sm">No knowledge entries yet. Add astrology book content to ground Jothisham AI's predictions.</p>
      ) : (
        <div className="space-y-3">
          {entries.map(entry => (
            <div key={entry._id} className={`glass-card p-4 border ${entry.isActive ? 'border-white/10' : 'border-red-500/20 opacity-50'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded-full">
                      {entry.category}
                    </span>
                    <span className="text-[10px] font-semibold text-white/40 bg-white/5 px-2 py-0.5 rounded-full uppercase">
                      {entry.language || 'en'}
                    </span>
                    {!entry.isActive && (
                      <span className="text-[10px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">INACTIVE</span>
                    )}
                    {entry.source && <span className="text-[10px] text-white/30">{entry.source}</span>}
                  </div>
                  <h3 className="text-white font-semibold mt-1.5 truncate">{entry.title}</h3>
                  <p className="text-white/40 text-xs mt-1 line-clamp-2">{entry.content}</p>
                  {entry.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {entry.tags.map(tag => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/30 border border-white/5">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => openEdit(entry)}
                    className="p-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 rounded-lg transition-colors" title="Edit">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => { if (confirm(`Delete "${entry.title}"?`)) remove.mutate(entry._id); }}
                    className="p-2 bg-red-500/10 hover:bg-red-500/25 text-red-400 rounded-lg transition-colors" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      {open && (
        <div className="fixed inset-0 bg-black/75 flex items-end md:items-center justify-center z-50 md:p-4">
          <div className="bg-gray-900 border border-white/10 rounded-t-2xl md:rounded-2xl w-full md:max-w-2xl flex flex-col h-[95vh] md:max-h-[92vh]">
            <div className="flex-shrink-0 flex items-center justify-between px-4 md:px-6 py-4 border-b border-white/10 rounded-t-2xl">
              <h2 className="text-base font-bold text-white">{editId ? 'Edit Knowledge Entry' : 'New Knowledge Entry'}</h2>
              <button onClick={closeForm} className="text-white/40 hover:text-white text-xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors">✕</button>
            </div>

            <div className="overflow-y-auto flex-1 px-4 md:px-6 py-4 space-y-4">
              <div>
                <label className="text-xs text-white/50 block mb-1">Title</label>
                <input value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  placeholder="e.g. Gajakesari Yogam — Effects & Remedies" />
              </div>

              <div>
                <label className="text-xs text-white/50 block mb-1">Content</label>
                <textarea value={form.content} rows={8}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white resize-y"
                  placeholder="Paste astrology book / rule text here. This is what Jothisham AI retrieves and grounds its predictions on." />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/50 block mb-1">Category</label>
                  <select value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
                    {CATEGORIES.map(c => <option key={c} className="bg-gray-900 text-white" value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/50 block mb-1">Language</label>
                  <select value={form.language}
                    onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
                    {LANGUAGES.map(l => <option key={l.code} className="bg-gray-900 text-white" value={l.code}>{l.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-white/50 block mb-1">Source <span className="text-white/25">(optional)</span></label>
                <input value={form.source}
                  onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  placeholder="e.g. Brihat Parashara Hora Shastra" />
              </div>

              <div>
                <label className="text-xs text-white/50 block mb-1">Tags <span className="text-white/25">(comma-separated)</span></label>
                <input value={tagsInput}
                  onChange={e => setTagsInput(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  placeholder="e.g. jupiter, moon, kendra, raja yogam" />
              </div>

              <label className="flex items-center justify-between p-3 bg-white/5 rounded-xl cursor-pointer">
                <div>
                  <p className="text-white text-sm font-medium">Active</p>
                  <p className="text-white/30 text-xs mt-0.5">Inactive entries are excluded from RAG retrieval</p>
                </div>
                <div onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                  className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative flex-shrink-0 ${form.isActive ? 'bg-indigo-500' : 'bg-white/10'}`}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
              </label>

              {saveError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
                  ⚠️ Save failed: {saveError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={closeForm}
                  className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm transition-colors">
                  Cancel
                </button>
                <button onClick={submit}
                  disabled={save.isPending || !form.title.trim() || !form.content.trim()}
                  className="flex-1 py-2.5 disabled:opacity-40 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors">
                  {save.isPending ? 'Saving…' : editId ? 'Save Changes' : 'Create Entry'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ingest document modal */}
      {ingestOpen && (
        <div className="fixed inset-0 bg-black/75 flex items-end md:items-center justify-center z-50 md:p-4">
          <div className="bg-gray-900 border border-white/10 rounded-t-2xl md:rounded-2xl w-full md:max-w-lg flex flex-col max-h-[92vh]">
            <div className="flex-shrink-0 flex items-center justify-between px-4 md:px-6 py-4 border-b border-white/10 rounded-t-2xl">
              <h2 className="text-base font-bold text-white">Ingest Document</h2>
              <button onClick={() => setIngestOpen(false)} className="text-white/40 hover:text-white text-xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors">✕</button>
            </div>

            <div className="overflow-y-auto flex-1 px-4 md:px-6 py-4 space-y-4">
              <p className="text-white/40 text-xs">
                Upload a scanned astrology book/document (PDF or image). Gemini will transcribe it,
                keep only astrology-relevant content, split it into chunks, and stage them here for
                your review — nothing becomes live in chat until you publish it.
              </p>

              <div>
                <label className="text-xs text-white/50 block mb-1">File <span className="text-white/25">(PDF, PNG, JPEG or WebP — max 20MB)</span></label>
                <input type="file" accept="application/pdf,image/png,image/jpeg,image/webp"
                  onChange={e => setIngestFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-white/70 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white file:text-sm file:font-medium file:cursor-pointer bg-white/5 border border-white/10 rounded-lg px-3 py-2 cursor-pointer" />
                {ingestFile && <p className="text-white/30 text-xs mt-1">{ingestFile.name} ({Math.round(ingestFile.size / 1024)} KB)</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/50 block mb-1">Category</label>
                  <select value={ingestForm.category}
                    onChange={e => setIngestForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
                    {CATEGORIES.map(c => <option key={c} className="bg-gray-900 text-white" value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/50 block mb-1">Language</label>
                  <select value={ingestForm.language}
                    onChange={e => setIngestForm(f => ({ ...f, language: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
                    {LANGUAGES.map(l => <option key={l.code} className="bg-gray-900 text-white" value={l.code}>{l.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-white/50 block mb-1">Source <span className="text-white/25">(optional — applied to all resulting chunks)</span></label>
                <input value={ingestForm.source}
                  onChange={e => setIngestForm(f => ({ ...f, source: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  placeholder="e.g. Brihat Parashara Hora Shastra" />
              </div>

              {ingestError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
                  ⚠️ {ingestError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setIngestOpen(false)}
                  className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm transition-colors">
                  Cancel
                </button>
                <button onClick={() => ingest.mutate()}
                  disabled={ingest.isPending || !ingestFile}
                  className="flex-1 py-2.5 disabled:opacity-40 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors">
                  {ingest.isPending ? 'Uploading…' : 'Start Ingestion'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

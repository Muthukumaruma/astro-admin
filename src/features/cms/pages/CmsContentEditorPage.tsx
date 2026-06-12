import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import type { JSONContent } from '@tiptap/react';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { API, hdr, CMS_SECTION, LANGS, LANG_LABELS, type Lang, type CmsCategory, type CmsSubCategory, type CmsContent } from '../api/cms.api';
import CmsImageUpload from '../components/CmsImageUpload';
import TiptapEditor from '../components/TiptapEditor';

export default function CmsContentEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');
  const [language, setLanguage] = useState<Lang>('en');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [author, setAuthor] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [body, setBody] = useState<JSONContent | null>(null);
  const [loaded, setLoaded] = useState(!isEdit);

  const { data: categories = [] } = useQuery<CmsCategory[]>({
    queryKey: ['cms-categories'],
    queryFn: () => axios.get(`${API}/admin/cms/sections/${CMS_SECTION}/categories`, { headers: hdr() }).then(r => r.data.data ?? []),
  });

  const { data: subCategories = [] } = useQuery<CmsSubCategory[]>({
    queryKey: ['cms-subcategories', categoryId],
    queryFn: () => axios.get(`${API}/admin/cms/categories/${categoryId}/subcategories`, { headers: hdr() }).then(r => r.data.data ?? []),
    enabled: !!categoryId,
  });

  const { data: existing } = useQuery<CmsContent>({
    queryKey: ['cms-content-item', id],
    queryFn: () => axios.get(`${API}/admin/cms/content/${id}`, { headers: hdr() }).then(r => r.data.data),
    enabled: isEdit,
  });

  useEffect(() => {
    if (!existing || loaded) return;
    setTitle(existing.title);
    setSlug(existing.slug);
    setCategoryId(existing.categoryId);
    setSubCategoryId(existing.subCategoryId ?? '');
    setLanguage(existing.language);
    setCoverImageUrl(existing.coverImageUrl ?? '');
    setExcerpt(existing.excerpt ?? '');
    setAuthor(existing.author ?? '');
    setTagsInput((existing.tags ?? []).join(', '));
    setIsPublished(existing.isPublished);
    setBody((existing.body?.json as JSONContent) ?? null);
    setLoaded(true);
  }, [existing, loaded]);

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        sectionType: CMS_SECTION,
        title,
        slug: slug || undefined,
        categoryId,
        subCategoryId: subCategoryId || null,
        language,
        coverImageUrl,
        excerpt,
        author,
        tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
        isPublished,
        body: { json: body ?? { type: 'doc', content: [] } },
      };
      return isEdit
        ? axios.put(`${API}/admin/cms/content/${id}`, payload, { headers: hdr() })
        : axios.post(`${API}/admin/cms/content`, payload, { headers: hdr() });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cms-content'] });
      navigate('/cms/books/content');
    },
  });

  const canSave = title.trim() && categoryId && !save.isPending;

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <Link to="/cms/books/content" className="text-white/40 hover:text-white text-sm inline-flex items-center gap-1.5 mb-2">
          <ArrowLeft className="w-4 h-4" /> Back to Content
        </Link>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BookOpen className="w-6 h-6" /> {isEdit ? 'Edit Book' : 'New Book'}
        </h1>
      </div>

      {isEdit && !loaded ? <p className="text-white/40">Loading…</p> : (
        <div className="space-y-5">
          <div>
            <label className="text-xs text-white/50 block mb-1">Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              className="w-full bg-gray-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
              placeholder="Book title" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/50 block mb-1">Category *</label>
              <select value={categoryId} onChange={e => { setCategoryId(e.target.value); setSubCategoryId(''); }}
                className="w-full bg-gray-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
                <option value="">Select category…</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name?.en}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1">Sub-category</label>
              <select value={subCategoryId} onChange={e => setSubCategoryId(e.target.value)} disabled={!categoryId || !subCategories.length}
                className="w-full bg-gray-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white disabled:opacity-40">
                <option value="">None</option>
                {subCategories.map(s => <option key={s._id} value={s._id}>{s.name?.en}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/50 block mb-1">Slug (auto-generated if blank)</label>
              <input value={slug} onChange={e => setSlug(e.target.value)}
                className="w-full bg-gray-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                placeholder="e.g. how-to-read-a-horoscope" />
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1">Content Language</label>
              <select value={language} onChange={e => setLanguage(e.target.value as Lang)}
                className="w-full bg-gray-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
                {LANGS.map(l => <option key={l} value={l}>{LANG_LABELS[l].native} — {LANG_LABELS[l].english}</option>)}
              </select>
            </div>
          </div>

          <CmsImageUpload label="Cover image" value={coverImageUrl} onChange={setCoverImageUrl} />

          <div>
            <label className="text-xs text-white/50 block mb-1">Excerpt</label>
            <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white resize-none"
              placeholder="Short summary shown in listing cards" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/50 block mb-1">Author</label>
              <input value={author} onChange={e => setAuthor(e.target.value)}
                className="w-full bg-gray-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                placeholder="Author name" />
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1">Tags (comma-separated)</label>
              <input value={tagsInput} onChange={e => setTagsInput(e.target.value)}
                className="w-full bg-gray-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                placeholder="astrology, beginner" />
            </div>
          </div>

          <div>
            <label className="text-xs text-white/50 block mb-1.5">Content</label>
            <TiptapEditor content={body} onChange={setBody} language={language} />
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-sm text-white/60 select-none">
            <input type="checkbox" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} className="accent-indigo-500 w-4 h-4" />
            Published (visible to users)
          </label>

          <div className="flex gap-3 pt-2">
            <Link to="/cms/books/content" className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm text-center transition-colors">
              Cancel
            </Link>
            <button onClick={() => save.mutate()} disabled={!canSave}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors">
              {save.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

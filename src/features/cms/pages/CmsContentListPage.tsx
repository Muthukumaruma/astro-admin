import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { BookOpen, Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { API, hdr, CMS_SECTION, LANG_LABELS, type CmsCategory, type CmsSubCategory, type CmsContentSummary } from '../api/cms.api';

interface PaginatedResponse<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export default function CmsContentListPage() {
  const qc = useQueryClient();
  const [categoryId, setCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');
  const [published, setPublished] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: categories = [] } = useQuery<CmsCategory[]>({
    queryKey: ['cms-categories'],
    queryFn: () => axios.get(`${API}/admin/cms/sections/${CMS_SECTION}/categories`, { headers: hdr() }).then(r => r.data.data ?? []),
  });

  const { data: subCategories = [] } = useQuery<CmsSubCategory[]>({
    queryKey: ['cms-subcategories', categoryId],
    queryFn: () => axios.get(`${API}/admin/cms/categories/${categoryId}/subcategories`, { headers: hdr() }).then(r => r.data.data ?? []),
    enabled: !!categoryId,
  });

  const { data, isLoading } = useQuery<PaginatedResponse<CmsContentSummary>>({
    queryKey: ['cms-content', categoryId, subCategoryId, published, search, page],
    queryFn: () => axios.get(`${API}/admin/cms/content`, {
      headers: hdr(),
      params: {
        sectionType: CMS_SECTION,
        categoryId: categoryId || undefined,
        subCategoryId: subCategoryId || undefined,
        isPublished: published || undefined,
        search: search || undefined,
        page,
        limit: 20,
      },
    }).then(r => r.data),
  });

  const togglePublish = useMutation({
    mutationFn: (id: string) => axios.patch(`${API}/admin/cms/content/${id}/publish`, {}, { headers: hdr() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cms-content'] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => axios.delete(`${API}/admin/cms/content/${id}`, { headers: hdr() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cms-content'] }),
  });

  const items = data?.data ?? [];
  const pagination = data?.pagination;

  function categoryName(id: string) {
    return categories.find(c => c._id === id)?.name?.en ?? '—';
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><BookOpen className="w-6 h-6" /> Books — Content</h1>
          <p className="text-white/40 text-sm mt-1">Manage book articles and their publish status.</p>
        </div>
        <Link to="/cms/books/content/new" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> New Book
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={categoryId} onChange={e => { setCategoryId(e.target.value); setSubCategoryId(''); setPage(1); }}
          className="bg-gray-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
          <option value="">All categories</option>
          {categories.map(c => <option key={c._id} value={c._id}>{c.name?.en}</option>)}
        </select>

        <select value={subCategoryId} onChange={e => { setSubCategoryId(e.target.value); setPage(1); }} disabled={!categoryId}
          className="bg-gray-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white disabled:opacity-40">
          <option value="">All sub-categories</option>
          {subCategories.map(s => <option key={s._id} value={s._id}>{s.name?.en}</option>)}
        </select>

        <select value={published} onChange={e => { setPublished(e.target.value); setPage(1); }}
          className="bg-gray-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
          <option value="">All statuses</option>
          <option value="true">Published</option>
          <option value="false">Draft</option>
        </select>

        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search title…"
          className="bg-gray-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white flex-1 min-w-[180px]" />
      </div>

      {isLoading ? <p className="text-white/40">Loading…</p> : (
        <div className="flex flex-col gap-3">
          {items.map(item => (
            <div key={item._id} className={`bg-white/5 border rounded-xl p-4 flex items-center gap-4 ${item.isPublished ? 'border-white/10' : 'border-white/5 opacity-70'}`}>
              <div className="w-14 h-14 rounded-lg bg-white/10 flex-shrink-0 overflow-hidden flex items-center justify-center">
                {item.coverImageUrl ? <img src={item.coverImageUrl} alt="" className="w-full h-full object-cover" /> : <BookOpen className="w-6 h-6 text-white/20" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white font-semibold truncate">{item.title}</p>
                  <span className="px-1.5 py-0.5 rounded bg-white/10 text-white/50 text-[10px] font-bold uppercase">{LANG_LABELS[item.language]?.short ?? item.language}</span>
                </div>
                <p className="text-white/30 text-xs truncate">
                  {categoryName(item.categoryId)}{item.subCategorySlug ? ` / ${item.subCategorySlug}` : ''} · /books/article/{item.slug}
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-white/30 text-xs flex-shrink-0">
                <Eye className="w-3.5 h-3.5" /> {item.viewCount}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => togglePublish.mutate(item._id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    item.isPublished ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-white/10 text-white/50 hover:bg-white/20'}`}>
                  {item.isPublished ? 'Published' : 'Draft'}
                </button>
                <Link to={`/cms/books/content/${item._id}/edit`}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs transition-colors flex items-center gap-1.5">
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </Link>
                <button onClick={() => { if (confirm('Delete this book?')) remove.mutate(item._id); }}
                  className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/25 text-red-400 rounded-lg text-xs transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          {!items.length && (
            <div className="text-center py-16 text-white/20">No books yet — create one to get started</div>
          )}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white rounded-lg text-xs transition-colors">Prev</button>
          <span className="text-white/40 text-xs">Page {pagination.page} of {pagination.totalPages}</span>
          <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white rounded-lg text-xs transition-colors">Next</button>
        </div>
      )}
    </div>
  );
}

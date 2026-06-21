import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import axios from 'axios';
import { ArrowUpDown, BookOpen } from 'lucide-react';
import { API, hdr, CMS_SECTION, type CmsCategory, type CmsSubCategory, type CmsContentSummary } from '../api/cms.api';

interface PaginatedResponse<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export default function CmsContentPriorityPage() {
  const qc = useQueryClient();
  const [categoryId, setCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');
  const [orderedItems, setOrderedItems] = useState<CmsContentSummary[] | null>(null);

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
    queryKey: ['cms-content-priority', categoryId, subCategoryId],
    queryFn: () => axios.get(`${API}/admin/cms/content`, {
      headers: hdr(),
      params: {
        sectionType: CMS_SECTION,
        categoryId,
        subCategoryId: subCategoryId || undefined,
        sort: 'priority',
        limit: 200,
      },
    }).then(r => r.data),
    enabled: !!categoryId,
  });

  const reorder = useMutation({
    mutationFn: (ids: string[]) => axios.patch(`${API}/admin/cms/content/reorder`, { ids }, { headers: hdr() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cms-content-priority'] }),
  });

  const items = data?.data ?? [];
  const displayItems = orderedItems ?? items;

  function onDragEnd(result: DropResult) {
    if (!result.destination) return;
    const src = result.source.index;
    const dst = result.destination.index;
    if (src === dst) return;
    const reordered = [...displayItems];
    const [moved] = reordered.splice(src, 1);
    if (!moved) return;
    reordered.splice(dst, 0, moved);
    setOrderedItems(reordered);
    reorder.mutate(reordered.map(c => c._id));
  }

  function categoryName(id: string) {
    return categories.find(c => c._id === id)?.name?.en ?? '—';
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><ArrowUpDown className="w-6 h-6" /> Books — Priority</h1>
        <p className="text-white/40 text-sm mt-1">Pick a category (and optionally a sub-category), then drag to set display order.</p>
      </div>

      {/* Scope selectors */}
      <div className="flex flex-wrap gap-3">
        <select value={categoryId} onChange={e => { setCategoryId(e.target.value); setSubCategoryId(''); setOrderedItems(null); }}
          className="bg-gray-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white">
          <option value="">Select a category…</option>
          {categories.map(c => <option key={c._id} value={c._id}>{c.name?.en}</option>)}
        </select>

        <select value={subCategoryId} onChange={e => { setSubCategoryId(e.target.value); setOrderedItems(null); }} disabled={!categoryId}
          className="bg-gray-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white disabled:opacity-40">
          <option value="">All sub-categories</option>
          {subCategories.map(s => <option key={s._id} value={s._id}>{s.name?.en}</option>)}
        </select>
      </div>

      {!categoryId && (
        <div className="text-center py-16 text-white/20">Select a category to view and reorder its books</div>
      )}

      {categoryId && (
        <>
          {reorder.isPending && <p className="text-white/40 text-sm">Saving order…</p>}

          {isLoading ? <p className="text-white/40">Loading…</p> : (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="cms-content-priority" direction="vertical">
                {provided => (
                  <div className="flex flex-col gap-3" ref={provided.innerRef} {...provided.droppableProps}>
                    {displayItems.map((item, index) => (
                      <Draggable key={item._id} draggableId={item._id} index={index}>
                        {drag => (
                          <div ref={drag.innerRef} {...drag.draggableProps}
                            className={`bg-white/5 border rounded-xl p-4 flex items-center gap-4 ${item.isPublished ? 'border-white/10' : 'border-white/5 opacity-60'}`}>
                            <div {...drag.dragHandleProps} className="px-1 text-white/20 hover:text-white/60 cursor-grab active:cursor-grabbing text-lg select-none" title="Drag to reorder">⠿</div>

                            <span className="w-6 text-center text-white/30 text-xs font-bold flex-shrink-0">{index + 1}</span>

                            <div className="w-12 h-12 rounded-lg bg-white/10 flex-shrink-0 overflow-hidden flex items-center justify-center">
                              {item.coverImageUrl ? <img src={item.coverImageUrl} alt="" className="w-full h-full object-cover" /> : <BookOpen className="w-5 h-5 text-white/20" />}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-white font-semibold truncate">{item.title}</p>
                              <p className="text-white/30 text-xs truncate">
                                {categoryName(item.categoryId)}{item.subCategorySlug ? ` / ${item.subCategorySlug}` : ''}
                              </p>
                            </div>

                            <span className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex-shrink-0 ${
                              item.isPublished ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'}`}>
                              {item.isPublished ? 'Published' : 'Draft'}
                            </span>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {!displayItems.length && (
                      <div className="text-center py-16 text-white/20">No books in this category yet</div>
                    )}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </>
      )}
    </div>
  );
}

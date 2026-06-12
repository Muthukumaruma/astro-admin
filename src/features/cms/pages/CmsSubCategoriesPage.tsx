import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import axios from 'axios';
import { ArrowLeft, Layers } from 'lucide-react';
import { API, hdr, type CmsCategory, type CmsSubCategory } from '../api/cms.api';
import CmsTaxonomyFormModal, { type CmsTaxonomyFormValue } from '../components/CmsTaxonomyFormModal';

const EMPTY: CmsTaxonomyFormValue = { slug: '', name: {}, description: {}, cardImageUrl: '', isActive: true };

export default function CmsSubCategoriesPage() {
  const { categoryId = '' } = useParams<{ categoryId: string }>();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [orderedSubCategories, setOrderedSubCategories] = useState<CmsSubCategory[] | null>(null);

  const { data: category } = useQuery<CmsCategory>({
    queryKey: ['cms-category', categoryId],
    queryFn: () => axios.get(`${API}/admin/cms/categories/${categoryId}`, { headers: hdr() }).then(r => r.data.data),
  });

  const { data: subCategories = [], isLoading } = useQuery<CmsSubCategory[]>({
    queryKey: ['cms-subcategories', categoryId],
    queryFn: () => axios.get(`${API}/admin/cms/categories/${categoryId}/subcategories`, { headers: hdr() }).then(r => r.data.data ?? []),
  });

  const save = useMutation({
    mutationFn: (d: CmsTaxonomyFormValue & { _id?: string }) =>
      d._id
        ? axios.put(`${API}/admin/cms/subcategories/${d._id}`, d, { headers: hdr() })
        : axios.post(`${API}/admin/cms/categories/${categoryId}/subcategories`, d, { headers: hdr() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms-subcategories', categoryId] }); close(); },
  });

  const remove = useMutation({
    mutationFn: (id: string) => axios.delete(`${API}/admin/cms/subcategories/${id}`, { headers: hdr() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cms-subcategories', categoryId] }),
    onError: () => alert('Cannot delete — this sub-category still has books. Move or delete them first.'),
  });

  const toggleActive = useMutation({
    mutationFn: (s: CmsSubCategory) => axios.put(`${API}/admin/cms/subcategories/${s._id}`, { isActive: !s.isActive }, { headers: hdr() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cms-subcategories', categoryId] }),
  });

  const reorder = useMutation({
    mutationFn: (ids: string[]) => axios.patch(`${API}/admin/cms/subcategories/reorder`, { ids }, { headers: hdr() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cms-subcategories', categoryId] }),
  });

  const displaySubCategories = orderedSubCategories ?? subCategories;

  function onDragEnd(result: DropResult) {
    if (!result.destination) return;
    const src = result.source.index;
    const dst = result.destination.index;
    if (src === dst) return;
    const reordered = [...displaySubCategories];
    const [moved] = reordered.splice(src, 1);
    if (!moved) return;
    reordered.splice(dst, 0, moved);
    setOrderedSubCategories(reordered);
    reorder.mutate(reordered.map(s => s._id));
  }

  function openCreate() { setEditId(null); setOpen(true); }
  function openEdit(s: CmsSubCategory) { setEditId(s._id); setOpen(true); }
  function close() { setOpen(false); setEditId(null); }

  const editing = subCategories.find(s => s._id === editId);
  const initial: CmsTaxonomyFormValue = editing
    ? { slug: editing.slug, name: editing.name ?? {}, description: editing.description ?? {}, cardImageUrl: editing.cardImageUrl ?? '', isActive: editing.isActive }
    : EMPTY;

  return (
    <div className="p-6 space-y-6">
      <div>
        <Link to="/cms/books/categories" className="text-white/40 hover:text-white text-sm inline-flex items-center gap-1.5 mb-2">
          <ArrowLeft className="w-4 h-4" /> Back to Categories
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Layers className="w-6 h-6" /> {category?.name?.en || 'Category'} — Sub-categories</h1>
            <p className="text-white/40 text-sm mt-1">Optional — if empty, books in this category are shown without a sub-category filter.</p>
          </div>
          <button onClick={openCreate} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
            + New Sub-category
          </button>
        </div>
      </div>

      {reorder.isPending && <p className="text-white/40 text-sm">Saving order…</p>}

      {isLoading ? <p className="text-white/40">Loading…</p> : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="cms-subcategories" direction="vertical">
            {provided => (
              <div className="flex flex-col gap-3" ref={provided.innerRef} {...provided.droppableProps}>
                {displaySubCategories.map((s, index) => (
                  <Draggable key={s._id} draggableId={s._id} index={index}>
                    {drag => (
                      <div ref={drag.innerRef} {...drag.draggableProps}
                        className={`bg-white/5 border rounded-xl p-4 flex items-center gap-4 ${s.isActive ? 'border-white/10' : 'border-white/5 opacity-50'}`}>
                        <div {...drag.dragHandleProps} className="px-1 text-white/20 hover:text-white/60 cursor-grab active:cursor-grabbing text-lg select-none" title="Drag to reorder">⠿</div>

                        <div className="w-12 h-12 rounded-lg bg-white/10 flex-shrink-0 overflow-hidden flex items-center justify-center">
                          {s.cardImageUrl ? <img src={s.cardImageUrl} alt="" className="w-full h-full object-cover" /> : <Layers className="w-5 h-5 text-white/20" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold truncate">{s.name?.en || '—'}</p>
                          <p className="text-white/30 text-xs truncate">/books/{category?.slug}/{s.slug}</p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={() => toggleActive.mutate(s)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                              s.isActive ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-white/10 text-white/50 hover:bg-white/20'}`}>
                            {s.isActive ? 'Active' : 'Inactive'}
                          </button>
                          <button onClick={() => openEdit(s)} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs transition-colors">
                            Edit
                          </button>
                          <button onClick={() => { if (confirm('Delete this sub-category?')) remove.mutate(s._id); }}
                            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/25 text-red-400 rounded-lg text-xs transition-colors">
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
                {!displaySubCategories.length && (
                  <div className="text-center py-16 text-white/20">No sub-categories — books in this category will list directly</div>
                )}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {open && (
        <CmsTaxonomyFormModal
          title={editId ? 'Edit Sub-category' : 'New Sub-category'}
          initial={initial}
          saving={save.isPending}
          onClose={close}
          onSave={value => save.mutate(editId ? { ...value, _id: editId } : value)}
        />
      )}
    </div>
  );
}

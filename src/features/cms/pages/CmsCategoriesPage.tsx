import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { BookOpen, Layers } from 'lucide-react';
import { API, hdr, CMS_SECTION, type CmsCategory } from '../api/cms.api';
import CmsTaxonomyFormModal, { type CmsTaxonomyFormValue } from '../components/CmsTaxonomyFormModal';

const EMPTY: CmsTaxonomyFormValue = { slug: '', name: {}, description: {}, cardImageUrl: '', isActive: true, isFeatured: false };

export default function CmsCategoriesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [orderedCategories, setOrderedCategories] = useState<CmsCategory[] | null>(null);

  const { data: categories = [], isLoading } = useQuery<CmsCategory[]>({
    queryKey: ['cms-categories'],
    queryFn: () => axios.get(`${API}/admin/cms/sections/${CMS_SECTION}/categories`, { headers: hdr() }).then(r => r.data.data ?? []),
  });

  const save = useMutation({
    mutationFn: (d: CmsTaxonomyFormValue & { _id?: string }) =>
      d._id
        ? axios.put(`${API}/admin/cms/categories/${d._id}`, d, { headers: hdr() })
        : axios.post(`${API}/admin/cms/sections/${CMS_SECTION}/categories`, d, { headers: hdr() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms-categories'] }); close(); },
  });

  const remove = useMutation({
    mutationFn: (id: string) => axios.delete(`${API}/admin/cms/categories/${id}`, { headers: hdr() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cms-categories'] }),
    onError: () => alert('Cannot delete — this category still has books. Move or delete them first.'),
  });

  const toggleActive = useMutation({
    mutationFn: (c: CmsCategory) => axios.put(`${API}/admin/cms/categories/${c._id}`, { isActive: !c.isActive }, { headers: hdr() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cms-categories'] }),
  });

  const reorder = useMutation({
    mutationFn: (ids: string[]) => axios.patch(`${API}/admin/cms/categories/reorder`, { ids }, { headers: hdr() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cms-categories'] }),
  });

  const displayCategories = orderedCategories ?? categories;

  function onDragEnd(result: DropResult) {
    if (!result.destination) return;
    const src = result.source.index;
    const dst = result.destination.index;
    if (src === dst) return;
    const reordered = [...displayCategories];
    const [moved] = reordered.splice(src, 1);
    if (!moved) return;
    reordered.splice(dst, 0, moved);
    setOrderedCategories(reordered);
    reorder.mutate(reordered.map(c => c._id));
  }

  function openCreate() { setEditId(null); setOpen(true); }
  function openEdit(c: CmsCategory) { setEditId(c._id); setOpen(true); }
  function close() { setOpen(false); setEditId(null); }

  const editing = categories.find(c => c._id === editId);
  const initial: CmsTaxonomyFormValue = editing
    ? { slug: editing.slug, name: editing.name ?? {}, description: editing.description ?? {}, cardImageUrl: editing.cardImageUrl ?? '', isActive: editing.isActive, isFeatured: editing.isFeatured }
    : EMPTY;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><BookOpen className="w-6 h-6" /> Books — Categories</h1>
          <p className="text-white/40 text-sm mt-1">Drag to reorder. Categories appear as cards in the Books section.</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
          + New Category
        </button>
      </div>

      {reorder.isPending && <p className="text-white/40 text-sm">Saving order…</p>}

      {isLoading ? <p className="text-white/40">Loading…</p> : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="cms-categories" direction="vertical">
            {provided => (
              <div className="flex flex-col gap-3" ref={provided.innerRef} {...provided.droppableProps}>
                {displayCategories.map((c, index) => (
                  <Draggable key={c._id} draggableId={c._id} index={index}>
                    {drag => (
                      <div ref={drag.innerRef} {...drag.draggableProps}
                        className={`bg-white/5 border rounded-xl p-4 flex items-center gap-4 ${c.isActive ? 'border-white/10' : 'border-white/5 opacity-50'}`}>
                        <div {...drag.dragHandleProps} className="px-1 text-white/20 hover:text-white/60 cursor-grab active:cursor-grabbing text-lg select-none" title="Drag to reorder">⠿</div>

                        <div className="w-14 h-14 rounded-lg bg-white/10 flex-shrink-0 overflow-hidden flex items-center justify-center">
                          {c.cardImageUrl ? <img src={c.cardImageUrl} alt="" className="w-full h-full object-cover" /> : <BookOpen className="w-6 h-6 text-white/20" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold truncate flex items-center gap-1.5">
                            {c.name?.en || '—'}
                            {c.isFeatured && <span title="Featured on homepage carousel">⭐</span>}
                          </p>
                          <p className="text-white/30 text-xs truncate">/books/{c.slug}</p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={() => toggleActive.mutate(c)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                              c.isActive ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-white/10 text-white/50 hover:bg-white/20'}`}>
                            {c.isActive ? 'Active' : 'Inactive'}
                          </button>
                          <Link to={`/cms/books/categories/${c._id}/subcategories`}
                            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs transition-colors flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5" /> Sub-categories
                          </Link>
                          <button onClick={() => openEdit(c)} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs transition-colors">
                            Edit
                          </button>
                          <button onClick={() => { if (confirm('Delete this category?')) remove.mutate(c._id); }}
                            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/25 text-red-400 rounded-lg text-xs transition-colors">
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
                {!displayCategories.length && (
                  <div className="text-center py-16 text-white/20">No categories yet — create one to get started</div>
                )}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {open && (
        <CmsTaxonomyFormModal
          title={editId ? 'Edit Category' : 'New Category'}
          initial={initial}
          saving={save.isPending}
          onClose={close}
          onSave={value => save.mutate(editId ? { ...value, _id: editId } : value)}
        />
      )}
    </div>
  );
}

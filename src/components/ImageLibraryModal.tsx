import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, X, Check } from 'lucide-react';
import { listAdminImages, type AdminImage } from '../services/upload.api';

interface ImageLibraryModalProps {
  onSelect: (url: string) => void;
  onClose: () => void;
}

export default function ImageLibraryModal({ onSelect, onClose }: ImageLibraryModalProps) {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [images, setImages] = useState<AdminImage[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-images', cursor],
    queryFn: () => listAdminImages(cursor),
  });

  useEffect(() => {
    if (!data) return;
    setImages(prev => (cursor ? [...prev, ...data.images] : data.images));
    setNextCursor(data.nextCursor);
  }, [data, cursor]);

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between sticky top-0 bg-gray-900 pb-2">
          <h2 className="text-base font-bold text-white">Choose an image</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-white/40">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : images.length === 0 ? (
          <p className="text-white/40 text-sm text-center py-16">No previously uploaded images yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map(img => (
              <button
                key={img.key}
                onClick={() => onSelect(img.url)}
                className="group relative aspect-video rounded-xl overflow-hidden border border-white/10 hover:border-indigo-500 transition-colors"
              >
                <img src={img.url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <Check className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            ))}
          </div>
        )}

        {nextCursor && (
          <div className="flex justify-center pt-2">
            <button
              onClick={() => setCursor(nextCursor)}
              disabled={isFetching}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white rounded-lg text-sm transition-colors"
            >
              {isFetching ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

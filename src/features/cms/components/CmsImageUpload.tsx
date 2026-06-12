import { useRef, useState } from 'react';
import { Image as ImageIcon, Loader2, X } from 'lucide-react';
import { uploadCmsImage } from '../api/cms.api';

interface CmsImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  aspectClassName?: string;
}

export default function CmsImageUpload({ value, onChange, label, aspectClassName = 'aspect-video' }: CmsImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(file: File) {
    setError('');
    setUploading(true);
    try {
      const url = await uploadCmsImage(file);
      onChange(url);
    } catch {
      setError('Upload failed — try a smaller image (max 5MB)');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-1.5">
      {label && <p className="text-xs text-white/50">{label}</p>}
      <div
        onClick={() => inputRef.current?.click()}
        className={`${aspectClassName} w-full rounded-xl border border-dashed border-white/15 bg-white/5 hover:bg-white/10
          cursor-pointer overflow-hidden relative flex items-center justify-center transition-colors`}
      >
        {value ? (
          <img src={value} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-white/30">
            <ImageIcon className="w-6 h-6" />
            <span className="text-xs">Click to upload image</span>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          </div>
        )}

        {value && !uploading && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onChange(''); }}
            className="absolute top-2 right-2 p-1 rounded-lg bg-black/60 text-white/70 hover:text-white hover:bg-black/80 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />

      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}

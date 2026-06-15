import { useRef, useState } from 'react';
import axios from 'axios';
import { Image as ImageIcon, Loader2, X, FolderOpen } from 'lucide-react';
import { uploadAdminImage } from '../services/upload.api';
import ImageLibraryModal from './ImageLibraryModal';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  aspectClassName?: string;
}

export default function ImageUpload({ value, onChange, label, aspectClassName = 'aspect-video' }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [libraryOpen, setLibraryOpen] = useState(false);

  async function handleFile(file: File) {
    setError('');
    setUploading(true);
    try {
      const url = await uploadAdminImage(file);
      onChange(url);
    } catch (err) {
      const serverMessage = axios.isAxiosError(err) ? (err.response?.data as { error?: string } | undefined)?.error : undefined;
      setError(serverMessage ?? 'Upload failed — try a smaller image (max 20MB)');
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

      <button
        type="button"
        onClick={() => setLibraryOpen(true)}
        className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors"
      >
        <FolderOpen className="w-3.5 h-3.5" /> Choose existing image
      </button>

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

      {libraryOpen && (
        <ImageLibraryModal
          onSelect={url => { onChange(url); setLibraryOpen(false); }}
          onClose={() => setLibraryOpen(false)}
        />
      )}

      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}

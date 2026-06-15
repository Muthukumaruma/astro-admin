import axios from 'axios';
import { useAdminAuthStore } from '../stores/auth.store';

const API = import.meta.env.VITE_API_URL ?? 'https://api.jothisham.com/api/v1';
const hdr = () => ({ Authorization: `Bearer ${useAdminAuthStore.getState().accessToken}` });

// Generic admin image upload (optimized + stored on R2) — used by any admin
// form that needs an image (CMS cards/covers, promo banners, etc.)
export async function uploadAdminImage(file: File): Promise<string> {
  const body = new FormData();
  body.append('file', file);
  const res = await axios.post(`${API}/admin/cms/upload`, body, { headers: hdr() });
  return res.data.data.url as string;
}

export interface AdminImage { key: string; url: string; size: number; updatedAt: string }

// Browse previously uploaded images so admins can reuse one instead of uploading again.
export async function listAdminImages(cursor?: string): Promise<{ images: AdminImage[]; nextCursor: string | null }> {
  const res = await axios.get(`${API}/admin/cms/images`, { headers: hdr(), params: cursor ? { cursor } : undefined });
  return res.data.data as { images: AdminImage[]; nextCursor: string | null };
}

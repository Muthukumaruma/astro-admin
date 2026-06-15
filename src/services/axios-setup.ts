import axios from 'axios';
import { useAdminAuthStore } from '../stores/auth.store';

// Global response interceptor — if any admin API call comes back 401 (expired/invalid
// session), log out so App.tsx's isAuthenticated check redirects to /login.
axios.interceptors.response.use(
  res => res,
  err => {
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      useAdminAuthStore.getState().logout();
    }
    return Promise.reject(err);
  },
);

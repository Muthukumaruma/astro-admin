import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useAdminAuthStore } from '../../../stores/auth.store';

const API = import.meta.env.VITE_API_URL ?? 'https://api.jothisham.com/api/v1';
const hdr = () => ({ Authorization: `Bearer ${useAdminAuthStore.getState().accessToken}` });

// Clears the cached Tamil solar-month start dates (sankranti). These are
// cached for ~40 days for performance (see getSolarMonthStartDate in
// astro-BE's panchangam.controller.ts) — after fixing that calculation, the
// old (wrong) cached value would otherwise keep being served until the cache
// naturally expired. This lets a fix take effect immediately instead.
export function useClearSankrantiCache() {
  return useMutation({
    mutationFn: (year?: string) =>
      axios
        .post(`${API}/panchangam/admin/clear-sankranti-cache`, null, {
          headers: hdr(),
          params: year ? { year } : undefined,
        })
        .then(r => r.data.data as { year: string; clearedKeys: string[] }),
  });
}

// General-purpose escape hatch: clears every cache/lock key in Redis (see
// astro-BE's redis.ts flushAll for why this is safe to do at any time —
// nothing stored there is a system of record, only caches and short-lived
// locks that recompute/reacquire on the next request).
export function useFlushRedisCache() {
  return useMutation({
    mutationFn: () =>
      axios.post(`${API}/app-config/admin/flush-redis-cache`, null, { headers: hdr() }).then(r => r.data.data),
  });
}

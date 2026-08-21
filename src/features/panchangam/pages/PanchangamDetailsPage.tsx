import { useState } from 'react';
import { motion } from 'framer-motion';
import { Moon, Search, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useAdminAuthStore } from '../../../stores/auth.store';

const API = import.meta.env.VITE_API_URL ?? 'https://api.jothisham.com/api/v1';
const hdr = () => ({ Authorization: `Bearer ${useAdminAuthStore.getState().accessToken}` });

// Named preset locations — astrologers consulting this page don't want to
// look up lat/lng by hand for common cities every time.
const PRESET_LOCATIONS = [
  { label: 'Chennai',    lat: 13.0827, lng: 80.2707,  tz: 'Asia/Kolkata' },
  { label: 'Delhi',      lat: 28.6139, lng: 77.2090,  tz: 'Asia/Kolkata' },
  { label: 'Mumbai',     lat: 19.0760, lng: 72.8777,  tz: 'Asia/Kolkata' },
  { label: 'Bengaluru',  lat: 12.9716, lng: 77.5946,  tz: 'Asia/Kolkata' },
  { label: 'Coimbatore', lat: 11.0168, lng: 76.9558,  tz: 'Asia/Kolkata' },
];

// Matches astro-BE's DailyPanchangam + festivals/personalized/specialDays —
// kept loose (fields read defensively below) since this is a read-only
// admin diagnostic view, not something that needs to break the build if the
// backend adds/renames a field.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FullPanchangam = any;

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card p-5">
      <h2 className="text-white font-semibold mb-3">{title}</h2>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex items-start justify-between gap-4 py-1 border-b border-white/5 last:border-0">
      <span className="text-white/40 text-xs shrink-0">{label}</span>
      <span className="text-white text-sm text-right font-mono">{value}</span>
    </div>
  );
}

export default function PanchangamDetailsPage() {
  const [date, setDate] = useState(todayStr());
  const [lat, setLat] = useState(String(PRESET_LOCATIONS[0]!.lat));
  const [lng, setLng] = useState(String(PRESET_LOCATIONS[0]!.lng));
  const [tz, setTz] = useState(PRESET_LOCATIONS[0]!.tz);
  const [horoscopeId, setHoroscopeId] = useState('');
  const [data, setData] = useState<FullPanchangam | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function applyPreset(p: typeof PRESET_LOCATIONS[number]) {
    setLat(String(p.lat));
    setLng(String(p.lng));
    setTz(p.tz);
  }

  async function fetchFull() {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API}/panchangam/admin/full`, {
        headers: hdr(),
        params: { date, lat, lng, tz, ...(horoscopeId ? { horoscopeId } : {}) },
      });
      setData(res.data.data);
    } catch (e) {
      setError(axios.isAxiosError(e) ? (e.response?.data?.error ?? e.message) : 'Failed to load');
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Moon className="w-6 h-6 text-indigo-400" /> Panchangam Details
        </h1>
        <p className="text-white/40 text-sm mt-1">Every computed panchangam value for any date and location — not just what the app shows.</p>
      </div>

      {/* Query form */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex flex-wrap gap-2">
          {PRESET_LOCATIONS.map(p => (
            <button
              key={p.label}
              onClick={() => applyPreset(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                Number(lat) === p.lat && Number(lng) === p.lng ? 'bg-indigo-600 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-white/40 text-xs mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500/50"
            />
          </div>
          <div>
            <label className="block text-white/40 text-xs mb-1">Latitude</label>
            <input
              value={lat}
              onChange={e => setLat(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-indigo-500/50"
            />
          </div>
          <div>
            <label className="block text-white/40 text-xs mb-1">Longitude</label>
            <input
              value={lng}
              onChange={e => setLng(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-indigo-500/50"
            />
          </div>
          <div>
            <label className="block text-white/40 text-xs mb-1">Timezone</label>
            <input
              value={tz}
              onChange={e => setTz(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-indigo-500/50"
            />
          </div>
          <div>
            <label className="block text-white/40 text-xs mb-1">Horoscope ID (optional)</label>
            <input
              value={horoscopeId}
              onChange={e => setHoroscopeId(e.target.value)}
              placeholder="For personalized fields"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-indigo-500/50"
            />
          </div>
        </div>

        <button
          onClick={fetchFull}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {loading ? 'Loading…' : 'Get Full Details'}
        </button>

        {error && <p className="text-red-400 text-sm">{error}</p>}
      </div>

      {/* Results */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Section title="Overview">
            <Row label="Date" value={data.date} />
            <Row label="Weekday" value={`${data.weekday} (${data.weekdayTa})`} />
            <Row label="Ayanam" value={data.ayanam ? `${data.ayanam.name} (${data.ayanam.nameTa})` : undefined} />
            <Row label="Sun longitude" value={data.sunLon != null ? `${Number(data.sunLon).toFixed(4)}°` : undefined} />
            <Row label="Moon longitude" value={data.moonLon != null ? `${Number(data.moonLon).toFixed(4)}°` : undefined} />
            <Row label="Festivals" value={Array.isArray(data.festivals) && data.festivals.length ? data.festivals.map((f: any) => f.name ?? f).join(', ') : undefined} />
            <Row label="Special days" value={Array.isArray(data.specialDays) && data.specialDays.length ? data.specialDays.join(', ') : undefined} />
          </Section>

          <Section title="Timing">
            <Row label="Sunrise" value={data.timing?.sunrise} />
            <Row label="Sunset" value={data.timing?.sunset} />
            <Row label="Moonrise" value={data.timing?.moonrise} />
          </Section>

          <Section title="Tithi">
            <Row label="Number" value={data.tithi?.number} />
            <Row label="Name" value={data.tithi?.name ? `${data.tithi.name} (${data.tithi.nameTa})` : undefined} />
            <Row label="Paksha" value={data.tithi?.paksha ? `${data.tithi.paksha} (${data.tithi.pakshaTa})` : undefined} />
            <Row label="From" value={data.tithi?.from} />
            <Row label="To" value={data.tithi?.to} />
            <Row label="Ends at (deg)" value={data.tithi?.endsAtDeg != null ? Number(data.tithi.endsAtDeg).toFixed(4) : undefined} />
            <Row label="At sunset" value={data.tithi?.atSunset != null ? Number(data.tithi.atSunset).toFixed(4) : undefined} />
            <Row label="Next" value={data.tithi?.next ? `${data.tithi.next.name} (${data.tithi.next.paksha})` : undefined} />
          </Section>

          <Section title="Nakshatra">
            <Row label="Index" value={data.nakshatra?.index} />
            <Row label="Name" value={data.nakshatra?.name ? `${data.nakshatra.name} (${data.nakshatra.nameTa})` : undefined} />
            <Row label="Pada" value={data.nakshatra?.pada} />
            <Row label="Lord" value={data.nakshatra?.lord} />
            <Row label="From" value={data.nakshatra?.from} />
            <Row label="To" value={data.nakshatra?.to} />
            <Row label="Ends at (deg)" value={data.nakshatra?.endsAtDeg != null ? Number(data.nakshatra.endsAtDeg).toFixed(4) : undefined} />
            <Row label="Next" value={data.nakshatra?.next?.name} />
          </Section>

          <Section title="Yoga">
            <Row label="Index" value={data.yoga?.index} />
            <Row label="Name" value={data.yoga?.name ? `${data.yoga.name} (${data.yoga.nameTa})` : undefined} />
            <Row label="From" value={data.yoga?.from} />
            <Row label="To" value={data.yoga?.to} />
            <Row label="Next" value={data.yoga?.next?.name} />
          </Section>

          <Section title="Karana">
            <Row label="Name" value={data.karana?.name ? `${data.karana.name} (${data.karana.nameTa})` : undefined} />
            <Row label="From" value={data.karana?.from} />
            <Row label="To" value={data.karana?.to} />
            <Row label="Next" value={data.karana?.next?.name} />
          </Section>

          <Section title="Inauspicious Times">
            <Row label="Rahu Kalam" value={data.inauspicious ? `${data.inauspicious.rahuKalam.start} – ${data.inauspicious.rahuKalam.end}` : undefined} />
            <Row label="Yamagandam" value={data.inauspicious ? `${data.inauspicious.yamagandam.start} – ${data.inauspicious.yamagandam.end}` : undefined} />
            <Row label="Kuligai" value={data.inauspicious ? `${data.inauspicious.kuligai.start} – ${data.inauspicious.kuligai.end}` : undefined} />
            <Row
              label="Durmuhurtham"
              value={
                Array.isArray(data.inauspicious?.durmuhurtham) && data.inauspicious.durmuhurtham.length
                  ? data.inauspicious.durmuhurtham.map((d: any) => `${d.start}–${d.end}`).join(', ')
                  : undefined
              }
            />
          </Section>

          <Section title="Auspicious Times">
            <Row
              label="Nalla Neram"
              value={
                Array.isArray(data.auspicious?.nallaNeram) && data.auspicious.nallaNeram.length
                  ? data.auspicious.nallaNeram.map((n: any) => `${n.start}–${n.end}`).join(', ')
                  : undefined
              }
            />
            <Row label="Abhijit Muhurtam" value={data.auspicious?.abhijitMuhurtam ? `${data.auspicious.abhijitMuhurtam.start} – ${data.auspicious.abhijitMuhurtam.end}` : undefined} />
          </Section>

          {data.personalized && (
            <Section title="Personalized (from Horoscope ID)">
              <Row label="Chandrashtamam" value={data.personalized.chandrashtamam ? `Yes (${data.personalized.chandrashtamamNakshatra})` : 'No'} />
              <Row label="Tarabalam" value={data.personalized.tarabalam ? `${data.personalized.tarabalam.name} — ${data.personalized.tarabalam.quality}` : undefined} />
              <Row label="Mahadasha" value={data.personalized.currentDasha?.mahadasha} />
              <Row label="Bhukti" value={data.personalized.currentDasha?.bhukti} />
              <Row label="Bhukti ends" value={data.personalized.currentDasha?.bhuktiEnds} />
            </Section>
          )}
        </div>
      )}
    </motion.div>
  );
}

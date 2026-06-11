import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Navigation, Star, X, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import MobileShell from '@/components/MobileShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { reverseGeocode, searchAddresses } from '@/lib/uploads';

const SAVED_KEY = 'resqly_saved_locations';

export default function LocationPicker() {
  const navigate = useNavigate();
  const { me, refresh } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [saved, setSaved] = useState([]);
  const [detecting, setDetecting] = useState(false);
  const [current, setCurrent] = useState(null);
  const debounce = useRef(null);

  useEffect(() => {
    try { setSaved(JSON.parse(localStorage.getItem(SAVED_KEY) || '[]')); } catch { setSaved([]); }
    if (me?.location || me?.city) {
      setCurrent({ short: me.location || me.city, label: me.location || me.city });
    }
  }, [me]);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    if (!query || query.length < 2) { setResults([]); return; }
    setSearching(true);
    debounce.current = setTimeout(async () => {
      const r = await searchAddresses(query);
      setResults(r);
      setSearching(false);
    }, 400);
    return () => debounce.current && clearTimeout(debounce.current);
  }, [query]);

  const detectGPS = () => {
    if (!('geolocation' in navigator)) { toast.error('Geolocation not supported'); return; }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        const geo = await reverseGeocode(lat, lng);
        setDetecting(false);
        if (geo) {
          await pickLocation({ ...geo, lat, lng });
        } else {
          toast.error('Could not resolve address');
        }
      },
      (err) => { setDetecting(false); toast.error(err.message || 'Location denied'); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const pickLocation = async (loc) => {
    // Save to user profile
    try {
      await api.patch('/users/me', { location: loc.short || loc.label, city: loc.city || me?.city || 'Bangalore' });
      await refresh();
      // Add to saved
      const next = [{ ...loc, ts: Date.now() }, ...saved.filter((s) => s.label !== loc.label)].slice(0, 6);
      setSaved(next);
      localStorage.setItem(SAVED_KEY, JSON.stringify(next));
      toast.success('Location updated');
      navigate(-1);
    } catch (e) {
      toast.error('Could not save location');
    }
  };

  const removeSaved = (label) => {
    const next = saved.filter((s) => s.label !== label);
    setSaved(next);
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
  };

  return (
    <MobileShell title="Select Location">
      <div className="px-4 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <Input data-testid="loc-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search for area, street name..." className="pl-9 h-11 rounded-xl" />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]); }} className="absolute right-3 top-3 text-slate-400"><X className="w-4 h-4" /></button>
          )}
        </div>

        <Button data-testid="loc-detect" onClick={detectGPS} disabled={detecting} variant="outline" className="w-full mt-3 justify-start h-12 rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50">
          {detecting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Navigation className="w-4 h-4 mr-2" />}
          <span className="flex-1 text-left font-semibold">{detecting ? 'Detecting...' : 'Use my current location'}</span>
          <ChevronRight className="w-4 h-4" />
        </Button>

        {current && (
          <div className="mt-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Current</div>
            <div className="resqly-card p-3 flex items-start gap-3">
              <MapPin className="w-4 h-4 text-blue-700 mt-0.5" />
              <div className="flex-1">
                <div className="font-medium text-slate-900">{current.short || current.label}</div>
                <div className="text-xs text-slate-500 truncate">{current.label}</div>
              </div>
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{searching ? 'Searching...' : 'Search Results'}</div>
            <div className="space-y-2">
              {results.map((r, i) => (
                <button data-testid={`loc-result-${i}`} key={r.label + i} onClick={() => pickLocation(r)} className="resqly-card p-3 w-full text-left flex items-start gap-3 hover:bg-slate-50">
                  <MapPin className="w-4 h-4 text-slate-500 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">{r.short}</div>
                    <div className="text-xs text-slate-500 truncate">{r.label}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {saved.length > 0 && (
          <div className="mt-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Saved</div>
            <div className="space-y-2">
              {saved.map((s, i) => (
                <div key={s.label} className="resqly-card p-3 flex items-start gap-3">
                  <Star className="w-4 h-4 text-amber-500 mt-0.5" />
                  <button data-testid={`loc-saved-${i}`} onClick={() => pickLocation(s)} className="flex-1 text-left">
                    <div className="font-medium text-slate-900">{s.short || s.label}</div>
                    <div className="text-xs text-slate-500 truncate">{s.label}</div>
                  </button>
                  <button onClick={() => removeSaved(s.label)} className="text-slate-400"><X className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MobileShell>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Upload, Plus, Trash2, CheckCircle2, Clock3, ShieldCheck, Loader2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { uploadFile } from '@/lib/uploads';
import { useAuth } from '@/lib/auth';
import MobileShell from '@/components/MobileShell';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function ConsumerMarketplace({ serviceType }) {
  const { me, refresh } = useAuth();
  const navigate = useNavigate();
  const isPharmacy = serviceType === 'pharmacy';
  const [medicines, setMedicines] = useState(['']);
  const [description, setDescription] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [coords, setCoords] = useState(me?.latitude != null ? { latitude: me.latitude, longitude: me.longitude } : null);
  const [address, setAddress] = useState(me?.location || me?.city || '');
  const [requestId, setRequestId] = useState('');
  const [status, setStatus] = useState('compose');
  const [best, setBest] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [candidateCount, setCandidateCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [order, setOrder] = useState(null);
  const [startedAt, setStartedAt] = useState(0);

  useEffect(() => {
    if (me?.latitude != null && me?.longitude != null) setCoords({ latitude: me.latitude, longitude: me.longitude });
    if (me?.location || me?.city) setAddress(me.location || me.city);
  }, [me]);

  const getLocation = useCallback(async () => {
    if (coords) return coords;
    if (!navigator.geolocation) throw new Error('Location is not available on this device');
    setLocationLoading(true);
    try {
      const position = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }));
      const next = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      setCoords(next);
      await api.patch('/users/me', { latitude: next.latitude, longitude: next.longitude });
      await refresh();
      return next;
    } finally {
      setLocationLoading(false);
    }
  }, [coords, refresh]);

  const cleanMedicines = useMemo(() => medicines.map((x) => x.trim()).filter(Boolean), [medicines]);

  const attach = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadFile(isPharmacy ? 'prescriptions' : 'lab-reports', file);
      setFileUrl(url);
      setFileName(file.name);
      toast.success('Attachment uploaded');
    } catch (err) {
      toast.error(err.response?.data?.detail || err.message || 'Upload failed');
    }
  };

  const submit = async () => {
    setLoading(true);
    try {
      const location = await getLocation();
      if (isPharmacy && !cleanMedicines.length && !fileUrl) throw new Error('Add at least one medicine or upload your prescription');
      if (!isPharmacy && !description.trim() && !fileUrl) throw new Error('Type what you need or upload a prescription/report');
      const response = await api.post('/marketplace/requests', {
        service_type: serviceType,
        description: description.trim(),
        requested_items: cleanMedicines,
        attachment_url: fileUrl,
        latitude: location.latitude,
        longitude: location.longitude,
        address,
      });
      setRequestId(response.data.request.id);
      setCandidateCount(response.data.request.candidate_count || 0);
      setStatus('broadcasting');
      setStartedAt(Date.now());
      toast.success('Request broadcast to verified providers');
    } catch (e) {
      toast.error(e.response?.data?.detail || e.message || 'Could not create request');
    } finally {
      setLoading(false);
    }
  };

  const loadQuotes = useCallback(async () => {
    if (!requestId) return;
    try {
      const response = await api.get('/marketplace/requests/' + requestId);
      setStatus(response.data.request.status);
      setQuotes(response.data.quotations || []);
      setBest(response.data.best_quotation || null);
    } catch (e) {
      if (e.response?.status === 404) setStatus('missing');
    }
  }, [requestId]);

  useEffect(() => {
    if (!requestId || !startedAt) return undefined;
    loadQuotes();
    const timer = setInterval(() => {
      if (Date.now() - startedAt > 15 * 60 * 1000) return;
      loadQuotes();
    }, 3000);
    return () => clearInterval(timer);
  }, [requestId, startedAt, loadQuotes]);

  const cancel = async () => {
    try {
      await api.post('/marketplace/requests/' + requestId + '/cancel', { reason: 'Cancelled by customer' });
      setStatus('cancelled');
      toast.success('Request cancelled');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Could not cancel');
    }
  };

  const accept = async () => {
    if (!best) return;
    setAccepting(true);
    try {
      const response = await api.post('/marketplace/quotations/accept', { quotation_id: best.id });
      setOrder(response.data.order);
      setBest(response.data.quotation);
      setStatus('order_placed');
      toast.success('Best quotation accepted');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'The offers changed. Refreshing.');
      await loadQuotes();
    } finally {
      setAccepting(false);
    }
  };

  const reset = () => {
    setStatus('compose');
    setRequestId('');
    setBest(null);
    setQuotes([]);
    setOrder(null);
    setCandidateCount(0);
    setStartedAt(0);
  };

  if (order) return (
    <MobileShell title="Order Confirmed">
      <div className="px-5 py-6"><div className="resqly-card p-6 text-center">
        <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 mt-3">Best quotation accepted</h2>
        <p className="text-sm text-slate-600 mt-1">Your {isPharmacy ? 'pharmacy order' : 'lab request'} has been placed.</p>
        <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-left">
          <InfoRow label="Provider" value={best?.provider_name} />
          <InfoRow label="Amount" value={best ? '₹' + best.total_price : '—'} />
          <InfoRow label="ETA" value={best?.eta_minutes ? best.eta_minutes + ' min' : 'Calculating'} />
          {best?.available_slots ? <InfoRow label="Slot" value={best.available_slots} /> : null}
        </div>
        <Button onClick={() => navigate('/consumer/home')} className="w-full mt-4 bg-blue-700 hover:bg-blue-800">Back to Home</Button>
      </div></div>
    </MobileShell>
  );

  return (
    <MobileShell title={isPharmacy ? 'Pharmacy' : 'Lab Tests'}>
      <div className="px-5 py-5 pb-28">
        {status === 'compose' ? (
          <>
            <div className="resqly-card p-5"><div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><ShieldCheck className="w-5 h-5 text-blue-700" /></div>
              <div><h2 className="font-bold text-slate-900">{isPharmacy ? 'Find the best pharmacy quotation' : 'Find the best lab quotation'}</h2><p className="text-xs text-slate-500 mt-1">{isPharmacy ? 'Upload your prescription or type the medicines. Only complete offers compete on price and ETA.' : 'Upload your prescription/report or type what you need. Labs compete on price and ETA.'}</p></div>
            </div></div>
            {isPharmacy ? (
              <div className="resqly-card p-5 mt-4">
                <div className="flex items-center justify-between"><h3 className="font-semibold text-slate-900">Medicines</h3><button onClick={() => setMedicines((x) => [...x, ''])} className="text-blue-700 text-sm font-semibold inline-flex items-center"><Plus className="w-4 h-4 mr-1" /> Add</button></div>
                <div className="text-xs text-slate-500 mt-1">Optional when you upload a prescription.</div>
                <div className="space-y-2 mt-3">{medicines.map((m, i) => <div key={i} className="flex gap-2"><input value={m} onChange={(e) => setMedicines((x) => x.map((v, idx) => idx === i ? e.target.value : v))} className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm" placeholder="e.g. Azithromycin 500mg" /><button onClick={() => setMedicines((x) => x.length === 1 ? [''] : x.filter((_, idx) => idx !== i))} className="p-2 text-slate-400"><Trash2 className="w-4 h-4" /></button></div>)}</div>
              </div>
            ) : (
              <div className="resqly-card p-5 mt-4"><label className="text-xs font-semibold text-slate-500">What do you need?</label><Textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="For example: CBC, thyroid profile, HbA1c…" className="mt-2" /></div>
            )}
            <div className="resqly-card p-5 mt-4"><label className="w-full border-2 border-dashed border-slate-300 rounded-2xl p-5 flex items-center gap-3 cursor-pointer hover:bg-slate-50"><Upload className="w-5 h-5 text-blue-700" /><div className="flex-1"><div className="font-semibold text-slate-900">{fileName || (isPharmacy ? 'Upload prescription' : 'Upload prescription/report')}</div><div className="text-xs text-slate-500">Camera photo or PDF. Securely shared with providers for this request.</div></div><input data-testid="marketplace-upload" type="file" accept="image/*,application/pdf" onChange={attach} className="hidden" /></label></div>
            <div className="resqly-card p-5 mt-4"><div className="flex items-start gap-3"><MapPin className="w-5 h-5 text-blue-700 mt-0.5" /><div><div className="font-semibold text-slate-900">Location</div><div className="text-xs text-slate-500 mt-0.5">{coords ? 'Location ready. Resqly calculates provider ETA.' : 'Required for provider ETA.'}</div></div></div><Button variant="outline" onClick={getLocation} disabled={locationLoading} className="w-full mt-3">{locationLoading ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Getting location</> : <><MapPin className="w-4 h-4 mr-1" /> {coords ? 'Refresh location' : 'Use my current location'}</>}</Button></div>
            <Button data-testid="marketplace-submit" onClick={submit} disabled={loading} className="w-full mt-5 bg-blue-700 hover:bg-blue-800">{loading ? 'Broadcasting…' : 'Get Best Quotation'}</Button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="resqly-card p-5"><div className="flex items-start gap-3"><Clock3 className="w-5 h-5 text-blue-700 mt-0.5" /><div className="flex-1"><h2 className="font-semibold text-slate-900">{status === 'cancelled' ? 'Request cancelled' : status === 'expired' ? 'Quote window expired' : 'Comparing verified providers'}</h2><p className="text-xs text-slate-500 mt-1">{status === 'broadcasting' ? 'Broadcast to ' + candidateCount + ' live provider(s). Waiting for quotations…' : quotes.length + ' eligible quotation(s) received.'}</p></div>{status === 'broadcasting' ? <Loader2 className="w-5 h-5 text-blue-700 animate-spin" /> : null}</div>{status !== 'cancelled' && status !== 'expired' ? <Button variant="outline" onClick={cancel} className="w-full mt-4 text-rose-700">Cancel request</Button> : null}</div>
            {best ? <div className="resqly-card p-5 border-2 border-emerald-200 bg-emerald-50/40"><div className="text-[11px] uppercase tracking-wider font-bold text-emerald-700">Best quotation</div><div className="flex justify-between gap-3 mt-2"><div><div className="font-bold text-slate-900">{best.provider_name}</div><div className="text-xs text-slate-500 mt-0.5">{isPharmacy && best.requested_count ? best.covered_count + '/' + best.requested_count + ' medicines covered' : 'Eligible verified offer'}</div></div><div className="text-right"><div className="text-xl font-bold text-slate-900">₹{best.total_price}</div><div className="text-xs text-blue-700">{best.eta_minutes ? best.eta_minutes + ' min ETA' : 'ETA unavailable'}</div></div></div>{best.available_slots ? <div className="text-xs text-slate-600 mt-2">Earliest slot: {best.available_slots}</div> : null}<Button data-testid="marketplace-accept" onClick={accept} disabled={accepting} className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700">{accepting ? 'Securing offer…' : 'Accept Best Quotation'}</Button></div> : null}
            {quotes.length > 1 ? <details className="resqly-card p-5"><summary className="font-semibold text-slate-900 cursor-pointer">See all quotations</summary><div className="space-y-2 mt-3">{quotes.map((q) => <div key={q.id} className="border border-slate-200 rounded-xl p-3"><div className="flex justify-between"><span className="font-medium">{q.provider_name}</span><span className="font-semibold">₹{q.total_price}</span></div><div className="text-xs text-slate-500 mt-1">{q.eta_minutes ? q.eta_minutes + ' min ETA' : 'ETA unavailable'}</div></div>)}</div></details> : null}
            {status === 'broadcasting' && quotes.length === 0 && candidateCount === 0 ? <div className="resqly-card p-5 bg-amber-50 border-amber-100"><XCircle className="w-5 h-5 text-amber-700" /><div className="font-semibold text-slate-900 mt-2">No providers are live right now</div><div className="text-xs text-slate-600 mt-1">Your request is saved and will become available when a verified provider comes online.</div></div> : null}
            <Button variant="outline" onClick={reset} className="w-full">Start another request</Button>
          </div>
        )}
      </div>
    </MobileShell>
  );
}

function InfoRow({ label, value }) {
  return <div className="flex justify-between gap-4 py-1.5 text-sm"><span className="text-slate-500">{label}</span><span className="font-medium text-slate-900 text-right">{value || '—'}</span></div>;
}

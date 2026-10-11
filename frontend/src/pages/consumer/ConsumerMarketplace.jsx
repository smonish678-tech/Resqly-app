import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, Upload, Plus, Trash2, CheckCircle2, Clock3, ShieldCheck, Loader2, XCircle, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
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
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [quoteError, setQuoteError] = useState('');

  useEffect(() => {
    if (me?.latitude != null && me?.longitude != null) setCoords({ latitude: me.latitude, longitude: me.longitude });
    if (me?.location || me?.city) setAddress(me.location || me.city);
  }, [me]);

  const restoreRequest = useCallback(async () => {
    const selectedRequestId = searchParams.get('request_id');
    try {
      if (selectedRequestId) {
        const selected = await api.get('/marketplace/requests/' + encodeURIComponent(selectedRequestId));
        if (selected.data.request.service_type !== serviceType) {
          setQuoteError('This request belongs to a different service. Open it from the matching service in My Requests.');
          return;
        }
        setRequestId(selected.data.request.id);
        setCandidateCount(selected.data.request.candidate_count || 0);
        setStatus(selected.data.request.status || 'broadcasting');
        setQuotes(selected.data.quotations || []);
        setBest(selected.data.best_quotation || null);
        setOrder(selected.data.order || null);
        setStartedAt(Date.now());
        return;
      }
      const response = await api.get('/marketplace/requests/mine/active?service_type=' + encodeURIComponent(serviceType));
      const req = response.data.request;
      if (!req || req.service_type !== serviceType) return;
      setRequestId(req.id);
      setCandidateCount(req.candidate_count || 0);
      setStatus(req.status || 'broadcasting');
      setOrder(response.data.order || null);
      const detail = await api.get('/marketplace/requests/' + req.id);
      setStatus(detail.data.request.status);
      setQuotes(detail.data.quotations || []);
      setBest(detail.data.best_quotation || null);
      setStartedAt(Date.now());
    } catch (e) {
      if (selectedRequestId && e.response?.status === 404) {
        setRequestId(selectedRequestId);
        setStatus('missing');
        setQuoteError('This request could not be found. Return to My Requests and refresh the list.');
      } else if (e.response?.status !== 404) {
        setQuoteError(e.response?.data?.detail || 'We could not restore your request. Try again.');
      }
    }
  }, [serviceType, searchParams]);

  useEffect(() => { restoreRequest(); }, [restoreRequest]);

  const getLocation = useCallback(async (force = false) => {
    if (coords && !force) return coords;
    if (!navigator.geolocation) throw new Error('Location is not available on this device');
    setLocationLoading(true);
    try {
      const position = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }));
      const next = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      setCoords(next);
      await api.patch('/users/me', { latitude: next.latitude, longitude: next.longitude });
      await refresh();
      return next;
    } finally { setLocationLoading(false); }
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
    } catch (err) { toast.error(err.response?.data?.detail || err.message || 'Upload failed'); }
  };

  const submit = async () => {
    setLoading(true);
    try {
      const location = await getLocation();
      if (isPharmacy && !cleanMedicines.length && !fileUrl) throw new Error('Add at least one medicine or upload your prescription');
      if (!isPharmacy && !description.trim() && !fileUrl) throw new Error('Type what you need or upload a prescription/report');
      const response = await api.post('/marketplace/requests', {
        service_type: serviceType, description: description.trim(), requested_items: cleanMedicines,
        attachment_url: fileUrl, latitude: location.latitude, longitude: location.longitude, address,
      });
      setRequestId(response.data.request.id);
      setCandidateCount(response.data.request.candidate_count || 0);
      setStatus('broadcasting');
      setStartedAt(Date.now());
      setQuoteError('');
      toast.success('Request saved. You can come back to it anytime.');
    } catch (e) { toast.error(e.response?.data?.detail || e.message || 'Could not create request'); }
    finally { setLoading(false); }
  };

  const loadQuotes = useCallback(async () => {
    if (!requestId) return;
    try {
      const response = await api.get('/marketplace/requests/' + requestId);
      setStatus(response.data.request.status);
      setQuotes(response.data.quotations || []);
      setBest(response.data.best_quotation || null);
      setQuoteError('');
    } catch (e) {
      setQuoteError(e.response?.data?.detail || 'Could not refresh offers. Your request is saved; try again.');
      if (e.response?.status === 404) setStatus('missing');
    }
  }, [requestId]);

  useEffect(() => {
    if (!requestId || !startedAt || ['cancelled', 'expired', 'order_placed', 'missing'].includes(status)) return undefined;
    loadQuotes();
    const timer = setInterval(() => {
      if (Date.now() - startedAt > 15 * 60 * 1000) { clearInterval(timer); setStatus('expired'); return; }
      loadQuotes();
    }, 5000);
    return () => clearInterval(timer);
  }, [requestId, startedAt, status, loadQuotes]);

  const cancel = async () => {
    try {
      await api.post('/marketplace/requests/' + requestId + '/cancel', { reason: 'Cancelled by customer' });
      setStatus('cancelled');
      toast.success('Request cancelled');
    } catch (e) { toast.error(e.response?.data?.detail || 'Could not cancel'); }
  };

  const accept = async () => {
    if (!best) return;
    setAccepting(true);
    try {
      const response = await api.post('/marketplace/quotations/accept', { quotation_id: best.id });
      setOrder(response.data.order);
      setBest(response.data.quotation);
      setStatus('order_placed');
      toast.success('Offer accepted');
    } catch (e) { toast.error(e.response?.data?.detail || 'The offers changed. Refreshing.'); await loadQuotes(); }
    finally { setAccepting(false); }
  };

  const reset = () => {
    setStatus('compose'); setRequestId(''); setBest(null); setQuotes([]); setOrder(null);
    setCandidateCount(0); setStartedAt(0); setQuoteError('');
    setMedicines(['']); setDescription(''); setFileUrl(''); setFileName('');
    setSearchParams({}, { replace: true });
  };

  if (order || status === 'order_placed') return (
    <MobileShell title="Order confirmed">
      <div className="px-5 py-6 pb-10"><div className="resqly-card p-6 text-center">
        <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
        <h2 className="text-xl font-bold text-slate-950 mt-3">Your offer is accepted</h2>
        <p className="text-sm text-slate-600 mt-1">Your {isPharmacy ? 'pharmacy order' : 'lab request'} has been placed. You can find it in My Requests.</p>
        <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-left">
          <InfoRow label="Provider" value={best?.provider_name || order?.provider_name} />
          <InfoRow label="Amount" value={best ? '₹' + best.total_price : order?.amount != null ? '₹' + order.amount : '—'} />
          <InfoRow label="ETA" value={best?.eta_minutes ? best.eta_minutes + ' min' : order?.eta_minutes ? order.eta_minutes + ' min' : '—'} />
          {best?.available_slots ? <InfoRow label="Slot" value={best.available_slots} /> : null}
        </div>
        <Button onClick={() => navigate('/consumer/requests')} className="w-full mt-4 bg-blue-700 hover:bg-blue-800 min-h-[48px]">View My Requests</Button>
        <Button onClick={reset} variant="outline" className="w-full mt-2 min-h-[48px]">Start another request</Button>
        <Button onClick={() => navigate('/consumer/home')} variant="ghost" className="w-full mt-1 min-h-[44px]">Back to Home</Button>
      </div></div>
    </MobileShell>
  );

  return (
    <MobileShell title={isPharmacy ? 'Pharmacy' : 'Lab tests'}>
      <div className="px-5 py-5 pb-28">
        <button onClick={() => navigate('/consumer/home')} className="text-sm text-blue-700 font-semibold mb-4 inline-flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> All services</button>
        {status === 'compose' ? (
          <>
            <div className="resqly-card p-5"><div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><ShieldCheck className="w-5 h-5 text-blue-700" /></div>
              <div><h2 className="font-bold text-slate-950">{isPharmacy ? 'Find the right medicine offer' : 'Compare lab test offers'}</h2><p className="text-sm text-slate-600 mt-1">{isPharmacy ? 'List what you need or upload a prescription. Compare eligible offers before deciding.' : 'Tell us what tests you need or upload your request. Compare eligible offers before deciding.'}</p></div>
            </div></div>
            {isPharmacy ? (
              <div className="resqly-card p-5 mt-4">
                <div className="flex items-center justify-between"><h3 className="font-semibold text-slate-950">Medicines</h3><button onClick={() => setMedicines((x) => [...x, ''])} className="text-blue-700 text-sm font-semibold inline-flex items-center"><Plus className="w-4 h-4 mr-1" /> Add medicine</button></div>
                <p className="text-xs text-slate-500 mt-1">You can skip the list if you upload a prescription.</p>
                <div className="space-y-2 mt-3">{medicines.map((m, i) => <div key={i} className="flex gap-2"><input aria-label={`Medicine ${i+1}`} value={m} onChange={(e) => setMedicines((x) => x.map((v, idx) => idx === i ? e.target.value : v))} className="flex-1 border border-slate-200 rounded-xl px-3 py-3 text-base" placeholder="Medicine name" /><button aria-label="Remove medicine" onClick={() => setMedicines((x) => x.length === 1 ? [''] : x.filter((_, idx) => idx !== i))} className="p-3 text-slate-500"><Trash2 className="w-4 h-4" /></button></div>)}</div>
              </div>
            ) : (
              <div className="resqly-card p-5 mt-4"><label htmlFor="lab-description" className="text-sm font-semibold text-slate-700">What tests do you need?</label><Textarea id="lab-description" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="For example: CBC, thyroid profile, HbA1c…" className="mt-2" /></div>
            )}
            <div className="resqly-card p-5 mt-4"><label className="w-full border-2 border-dashed border-slate-300 rounded-2xl p-5 flex items-center gap-3 cursor-pointer hover:bg-slate-50"><Upload className="w-5 h-5 text-blue-700" /><div className="flex-1"><div className="font-semibold text-slate-950">{fileName || (isPharmacy ? 'Upload prescription' : 'Upload request or report')}</div><div className="text-sm text-slate-500 mt-1">Photo or PDF · shared for this request.</div></div><input data-testid="marketplace-upload" type="file" accept="image/*,application/pdf" onChange={attach} className="hidden" /></label></div>
            <div className="resqly-card p-5 mt-4"><div className="flex items-start gap-3"><MapPin className="w-5 h-5 text-blue-700 mt-0.5" /><div><div className="font-semibold text-slate-950">Where should the service happen?</div><div className="text-sm text-slate-500 mt-1">{coords ? 'Location ready for provider ETA.' : 'Current location is needed to calculate provider ETA.'}</div></div></div><Button variant="outline" onClick={() => getLocation(true)} disabled={locationLoading} className="w-full mt-3 min-h-[48px]">{locationLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Getting location</> : <><MapPin className="w-4 h-4 mr-2" /> {coords ? 'Refresh location' : 'Use current location'}</>}</Button></div>
            <Button data-testid="marketplace-submit" onClick={submit} disabled={loading} className="w-full mt-5 bg-blue-700 hover:bg-blue-800 min-h-[50px]">{loading ? 'Sending request…' : 'Find offers'}</Button>
            <p className="text-xs text-slate-500 text-center mt-3">You will review prices before accepting any offer.</p>
          </>
        ) : (
          <div className="space-y-4">
            {quoteError && <div role="alert" className="resqly-card p-4 bg-amber-50 border-amber-200"><AlertCircle className="w-5 h-5 text-amber-700 inline mr-2" /><span className="text-sm text-amber-950">{quoteError}</span><Button variant="outline" onClick={loadQuotes} className="w-full mt-3 min-h-[44px]"><RefreshCw className="w-4 h-4 mr-2" /> Try again</Button></div>}
            <div className="resqly-card p-5"><div className="flex items-start gap-3"><Clock3 className="w-5 h-5 text-blue-700 mt-0.5" /><div className="flex-1"><h2 className="font-semibold text-slate-950">{status === 'cancelled' ? 'Request cancelled' : status === 'expired' ? 'Offer window ended' : status === 'missing' ? 'Request not found' : quotes.length ? 'Your offers are ready' : 'Finding available providers'}</h2><p className="text-sm text-slate-600 mt-1">{status === 'broadcasting' ? candidateCount ? `Shared with ${candidateCount} available provider(s). Waiting for offers…` : 'Your request is saved, but no matching providers are available right now.' : quotes.length + ' eligible offer(s) received.'}</p></div>{status === 'broadcasting' ? <Loader2 className="w-5 h-5 text-blue-700" /> : null}</div>{['cancelled','expired','missing','order_placed'].includes(status) ? null : <Button variant="outline" onClick={cancel} className="w-full mt-4 text-rose-700 min-h-[44px]">Cancel request</Button>}</div>
            {best ? <div className="resqly-card p-5 border-2 border-emerald-200 bg-emerald-50/40"><div className="text-[11px] uppercase tracking-wider font-bold text-emerald-700">Best eligible offer</div><div className="flex justify-between gap-3 mt-2"><div><div className="font-bold text-slate-950">{best.provider_name}</div><div className="text-xs text-slate-600 mt-1">{isPharmacy && best.requested_count ? best.covered_count + '/' + best.requested_count + ' medicines covered' : 'Verified eligible offer'}</div></div><div className="text-right"><div className="text-2xl font-bold text-slate-950">₹{best.total_price}</div><div className="text-sm text-blue-700">{best.eta_minutes ? best.eta_minutes + ' min ETA' : 'ETA unavailable'}</div></div></div>{best.available_slots ? <div className="text-sm text-slate-600 mt-2">Earliest slot: {best.available_slots}</div> : null}<Button data-testid="marketplace-accept" onClick={accept} disabled={accepting} className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 min-h-[48px]">{accepting ? 'Accepting offer…' : 'Accept this offer'}</Button></div> : null}
            {quotes.length > 1 ? <details className="resqly-card p-5"><summary className="font-semibold text-slate-950 cursor-pointer">Compare all offers ({quotes.length})</summary><div className="space-y-2 mt-3">{quotes.map((q) => <div key={q.id} className="border border-slate-200 rounded-xl p-3"><div className="flex justify-between"><span className="font-medium">{q.provider_name}</span><span className="font-semibold">₹{q.total_price}</span></div><div className="text-xs text-slate-500 mt-1">{q.eta_minutes ? q.eta_minutes + ' min ETA' : 'ETA unavailable'}</div></div>)}</div></details> : null}
            {status === 'broadcasting' && quotes.length === 0 && candidateCount === 0 && <div className="resqly-card p-5 bg-amber-50 border-amber-100"><XCircle className="w-5 h-5 text-amber-700" /><div className="font-semibold text-slate-950 mt-2">No matching providers are live</div><div className="text-sm text-slate-600 mt-1">Your request is saved. You can return to My Requests later.</div></div>}
            <Button variant="outline" onClick={() => navigate('/consumer/requests')} className="w-full min-h-[48px]">Open My Requests</Button>
            {['cancelled', 'expired', 'missing'].includes(status) && <Button variant="ghost" onClick={reset} className="w-full min-h-[44px]">Start another request</Button>}
          </div>
        )}
      </div>
    </MobileShell>
  );
}

function InfoRow({ label, value }) {
  return <div className="flex justify-between gap-4 py-1.5 text-sm"><span className="text-slate-500">{label}</span><span className="font-medium text-slate-950 text-right">{value || '—'}</span></div>;
}

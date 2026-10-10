import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Video, House, Globe2, Languages, ShieldCheck, Clock3, MapPin, Stethoscope, Search, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import MobileShell from '@/components/MobileShell';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { LANGUAGE_OPTIONS } from '@/lib/constants';
import { useAuth } from '@/lib/auth';

const loadRazorpay = () => new Promise((resolve, reject) => {
  if (window.Razorpay) return resolve(true);
  const existing = document.querySelector('script[data-resqly-razorpay="1"]');
  if (existing) {
    existing.addEventListener('load', () => resolve(true), { once: true });
    existing.addEventListener('error', () => reject(new Error('Secure checkout could not load. Please check your connection.')), { once: true });
    return;
  }
  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.async = true;
  script.dataset.resqlyRazorpay = '1';
  script.onload = () => resolve(true);
  script.onerror = () => reject(new Error('Secure checkout could not load. Please check your connection.'));
  document.head.appendChild(script);
});

const MODES = [
  { key: 'online', title: 'Online consultation', description: 'Talk to a verified doctor by video, from anywhere.', icon: Video },
  { key: 'home_visit', title: 'Doctor home visit', description: 'A nearby doctor visits your home.', icon: House },
];

export default function DoctorConsultation() {
  const { me } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('online');
  const [problem, setProblem] = useState('');
  const [languages, setLanguages] = useState([]);
  const [coords, setCoords] = useState(me?.latitude != null && me?.longitude != null ? { latitude: me.latitude, longitude: me.longitude } : null);
  const [address, setAddress] = useState(me?.location || me?.city || '');
  const [config, setConfig] = useState(null);
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [now, setNow] = useState(Date.now());
  const androidCallSupported = Capacitor.getPlatform() === 'android';
  const canCheckout = mode === 'online' ? Boolean(config?.online_available && androidCallSupported) : Boolean(config?.home_visit_available);
  const unavailableMessage = mode === 'online' && !androidCallSupported
    ? 'Online video consultations currently require the Resqly Android app. Home visits can still be booked here.'
    : mode === 'online' ? config?.online_message : config?.message;

  useEffect(() => {
    api.get('/doctor-consultations/config').then(({ data }) => setConfig(data)).catch(() => setConfig({ available: false, home_visit_available: false, online_available: false, message: 'Secure home-visit checkout is not configured yet. Please try again shortly.', online_message: 'Online video consultation is disabled until secure Agora calling is connected and tested.' }));
  }, []);

  useEffect(() => {
    if (!request?.id) return undefined;
    const poll = async () => {
      try {
        const { data } = await api.get('/doctor-consultations/' + request.id);
        setRequest(data.consultation);
      } catch (e) {
        if (e.response?.status === 404) toast.error('This consultation could not be found.');
      }
    };
    poll();
    const timer = setInterval(poll, 3000);
    return () => clearInterval(timer);
  }, [request?.id]);

  useEffect(() => {
    if (!request?.join_deadline || request.status !== 'accepted') return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [request?.join_deadline, request?.status]);

  const getLocation = async () => {
    if (coords) return coords;
    if (!navigator.geolocation) throw new Error('Location is not available on this device.');
    setLocationLoading(true);
    try {
      const pos = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }));
      const next = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setCoords(next);
      return next;
    } finally { setLocationLoading(false); }
  };

  const toggleLanguage = (language) => setLanguages((current) => current.includes(language) ? current.filter((x) => x !== language) : [...current, language]);

  const submit = async () => {
    if (problem.trim().length < 8) return toast.error('Tell the doctor a little more about the problem (at least 8 characters).');
    if (!languages.length) return toast.error('Choose at least one language you are comfortable speaking.');
    if (!canCheckout) return toast.error(unavailableMessage || 'This consultation option is not available yet.');
    setLoading(true);
    try {
      let location = null;
      if (mode === 'home_visit') location = await getLocation();
      await loadRazorpay();
      const { data } = await api.post('/doctor-consultations/payment-order', {
        consultation_type: mode,
        problem: problem.trim(),
        languages,
        latitude: location?.latitude ?? null,
        longitude: location?.longitude ?? null,
        address: address || '',
      });
      if (!data.checkout_key || !window.Razorpay) {
        throw new Error('Secure payment is not configured on this app yet. No request has been broadcast and no payment was taken.');
      }
      const checkout = new window.Razorpay({
        key: data.checkout_key,
        amount: data.amount,
        currency: data.currency || 'INR',
        name: 'Resqly',
        description: mode === 'online' ? 'Online doctor consultation' : 'Doctor home visit',
        order_id: data.razorpay_order_id,
        prefill: { name: me?.name || '', email: me?.email || '', contact: me?.phone || '' },
        theme: { color: '#1E40AF' },
        handler: async (payment) => {
          try {
            const verified = await api.post('/doctor-consultations/payment-verify', {
              consultation_id: data.consultation_id,
              razorpay_order_id: payment.razorpay_order_id,
              razorpay_payment_id: payment.razorpay_payment_id,
              razorpay_signature: payment.razorpay_signature,
            });
            setRequest(verified.data.consultation);
            toast.success('Payment verified. Finding an available doctor.');
          } catch (e) {
            toast.error(e.response?.data?.detail || 'Payment verification failed. Please contact support before trying again.');
          }
        },
        modal: { ondismiss: () => toast.message('Checkout closed. Your request was not broadcast.') },
      });
      checkout.on('payment.failed', (event) => toast.error(event.error?.description || 'Payment failed. You have not been matched with a doctor.'));
      checkout.open();
    } catch (e) {
      toast.error(e.response?.data?.detail || e.message || 'Could not start consultation');
    } finally { setLoading(false); }
  };

  const cancel = async () => {
    try {
      const { data } = await api.post('/doctor-consultations/' + request.id + '/cancel');
      setRequest(data.consultation);
      toast.success('Consultation cancelled');
    } catch (e) { toast.error(e.response?.data?.detail || 'Could not cancel this consultation'); }
  };

  const minutesLeft = request?.join_deadline ? Math.max(0, Math.ceil((new Date(request.join_deadline).getTime() - now) / 1000)) : 0;

  if (request) return (
    <MobileShell title="Doctor consultation">
      <div className="px-5 py-5 pb-10">
        <div className="resqly-card p-5 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
            {request.status === 'accepted' ? <Video className="w-7 h-7 text-blue-700" /> : request.status === 'completed' ? <CheckCircle2 className="w-7 h-7 text-emerald-600" /> : <Search className="w-7 h-7 text-blue-700" />}
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-3">{request.status === 'broadcasting' ? 'Finding your doctor' : request.status === 'accepted' ? (request.consultation_type === 'home_visit' ? 'Doctor accepted your home visit' : 'Your doctor is ready') : request.status === 'completed' ? 'Consultation completed' : request.status === 'refunded_no_doctor' ? 'No doctor available — refund started' : request.status === 'refunded_no_show' ? 'Join window expired — refund started' : request.status === 'refund_pending' ? 'Refund needs support follow-up' : request.status === 'cancelled' ? 'Consultation cancelled' : request.status.replaceAll('_', ' ')}</h2>
          <p className="text-sm text-slate-500 mt-1">{request.status === 'broadcasting' ? 'Your paid request is being shown to eligible doctors who are available and speak your selected languages.' : request.status === 'accepted' ? (request.consultation_type === 'home_visit' ? 'Your doctor has accepted and received your location. Keep your phone available for visit coordination.' : 'Both you and your doctor must join before the timer ends.') : request.status === 'completed' ? 'Your prescription will be available in the Prescriptions tab.' : request.status === 'refunded_no_doctor' ? 'No eligible doctor was available. Resqly has requested a refund to the original payment method.' : request.status === 'refunded_no_show' ? 'The five-minute join window expired. A refund has been requested to your original payment method.' : request.status === 'refund_pending' ? 'The automatic refund did not complete. Please contact Resqly support and quote this consultation.' : request.status === 'cancelled' ? (request.refund_status === 'refunded' ? 'Your cancellation was processed and a refund was requested to the original payment method.' : 'Your consultation was cancelled.') : 'You can return to the doctor service when you are ready.'}</p>
          {request.status === 'accepted' && request.consultation_type === 'online' && <div className="my-5 rounded-2xl bg-blue-50 p-4"><div className="text-xs text-blue-700 font-semibold">TIME TO JOIN</div><div className="text-4xl font-bold text-blue-900 tabular-nums mt-1">{String(Math.floor(minutesLeft / 60)).padStart(2, '0')}:{String(minutesLeft % 60).padStart(2, '0')}</div><p className="text-xs text-blue-800 mt-1">5-minute join window</p></div>}
          {request.doctor_name && <div className="mt-4 text-left rounded-xl bg-slate-50 p-3"><div className="text-xs text-slate-500">Doctor</div><div className="font-semibold text-slate-900">{request.doctor_name}</div></div>}
          {request.status === 'accepted' && request.consultation_type === 'online' && minutesLeft > 0 && <Button onClick={() => navigate('/consumer/doctor-call/' + request.id)} className="w-full mt-4 bg-blue-700 hover:bg-blue-800"><Video className="w-4 h-4 mr-2" /> Get into video call</Button>}
          {(['broadcasting', 'payment_verified'].includes(request.status) || (request.consultation_type === 'home_visit' && request.status === 'accepted')) && <Button variant="outline" onClick={cancel} className="w-full mt-4">Cancel request</Button>}
          <Button variant="ghost" onClick={() => navigate('/consumer/prescriptions')} className="w-full mt-2">Open Prescriptions</Button>
          <Button variant="ghost" onClick={() => { setRequest(null); setProblem(''); setLanguages([]); }} className="w-full">Back to doctor options</Button>
        </div>
      </div>
    </MobileShell>
  );

  return (
    <MobileShell title="Doctors">
      <div className="px-5 py-5 pb-10 space-y-4">
        <div className="rounded-3xl bg-gradient-to-br from-blue-900 to-blue-600 p-5 text-white overflow-hidden relative">
          <div className="absolute -right-5 -top-8 w-32 h-32 rounded-full bg-white/10" />
          <div className="flex items-center gap-2 text-blue-100 text-xs font-semibold"><ShieldCheck className="w-4 h-4" /> VERIFIED DOCTOR CARE</div>
          <h1 className="text-2xl font-bold mt-2">Care that meets you where you are.</h1>
          <p className="text-sm text-blue-100 mt-2">Choose a video consultation from anywhere, or ask a nearby doctor to visit your home.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {MODES.map(({ key, title, description, icon: Icon }) => <button key={key} onClick={() => setMode(key)} className={`text-left p-4 rounded-2xl border transition ${mode === key ? 'border-blue-700 bg-blue-50 ring-1 ring-blue-100' : 'border-slate-200 bg-white'}`}><Icon className={`w-6 h-6 ${mode === key ? 'text-blue-700' : 'text-slate-500'}`} /><div className="font-semibold text-sm text-slate-900 mt-3">{title}</div><div className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</div></button>)}
        </div>
        <div className="resqly-card p-5">
          <div className="flex items-center gap-2"><Stethoscope className="w-5 h-5 text-blue-700" /><h2 className="font-bold text-slate-900">Tell us what you need</h2></div>
          <label className="block text-xs font-semibold text-slate-600 mt-4 mb-1">What is troubling you?</label>
          <Textarea value={problem} onChange={(e) => setProblem(e.target.value)} rows={4} maxLength={2000} placeholder="Describe your symptoms or concern. If this is an emergency, call your local emergency number." />
          <div className="text-[11px] text-slate-400 text-right mt-1">{problem.length}/2000</div>
          <div className="flex items-center gap-2 mt-4"><Languages className="w-4 h-4 text-blue-700" /><label className="text-xs font-semibold text-slate-600">Languages you are comfortable speaking</label></div>
          <p className="text-xs text-slate-500 mt-1">We only match doctors who selected at least one of these languages in their verified profile.</p>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {LANGUAGE_OPTIONS.map((language) => <label key={language} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${languages.includes(language) ? 'border-blue-700 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-700'}`}><input type="checkbox" checked={languages.includes(language)} onChange={() => toggleLanguage(language)} />{language}</label>)}
          </div>
          {mode === 'online' ? <div className="mt-4 rounded-xl bg-slate-50 p-3 flex gap-2"><Globe2 className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" /><p className="text-xs text-slate-600">Online matching can include eligible doctors anywhere; distance does not limit the search.</p></div> : <div className="mt-4 rounded-xl bg-slate-50 p-3"><div className="flex items-center gap-2 text-sm font-semibold text-slate-800"><MapPin className="w-4 h-4 text-blue-700" />Home visit location</div><p className="text-xs text-slate-500 mt-1">{address || 'We will ask for your current location before checkout.'}</p><button onClick={async () => { try { const pos = await getLocation(); setAddress(`${pos.latitude.toFixed(5)}, ${pos.longitude.toFixed(5)}`); } catch (e) { toast.error(e.message || 'Location permission needed'); } }} disabled={locationLoading} className="text-xs text-blue-700 font-semibold mt-2">{locationLoading ? 'Getting location…' : 'Use my current location'}</button></div>}
          {!canCheckout && <div className="mt-4 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3"><AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" /><p className="text-xs text-amber-900">{unavailableMessage || 'Checking service availability…'}</p></div>}
          {canCheckout && <div className="mt-4 rounded-xl border border-slate-200 p-3"><div className="flex items-center justify-between"><span className="text-sm text-slate-600">{mode === 'online' ? 'Online consultation' : 'Doctor home visit'}</span><span className="font-bold text-slate-900">₹{mode === 'online' ? config.online_price : config.home_visit_price}</span></div><p className="text-[11px] text-slate-500 mt-1">Final price is shown before payment. Your request is broadcast only after payment verification.</p></div>}
          <Button onClick={submit} disabled={loading || !canCheckout} className="w-full mt-4 bg-blue-700 hover:bg-blue-800">{loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Preparing secure checkout…</> : canCheckout ? 'Continue to secure payment' : 'Not available yet'}</Button>
          <p className="text-[10px] text-slate-400 text-center mt-3">This service does not replace emergency care. Doctors must be verified before they receive requests.</p>
        </div>
      </div>
    </MobileShell>
  );
}

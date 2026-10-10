import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Video, House, Languages, Clock3, MapPin, RefreshCw, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import MobileShell from '@/components/MobileShell';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';

export default function DoctorRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState('');
  const load = async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const { data } = await api.get('/providers/me/doctor-consultations');
      setRequests(data.requests || []);
    } catch (e) {
      if (!quiet) toast.error(e.response?.data?.detail || 'Could not load doctor requests');
    } finally { setLoading(false); }
  };
  useEffect(() => {
    load();
    const timer = setInterval(() => load(true), 4000);
    return () => clearInterval(timer);
  }, []);
  const accept = async (id) => {
    setAccepting(id);
    try {
      const { data } = await api.post('/providers/me/doctor-consultations/' + id + '/accept');
      toast.success('Request accepted. Join within 5 minutes.');
      window.location.assign('/provider/doctor-call/' + data.consultation.id);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'This request was accepted by another doctor or is no longer available.');
      await load(true);
    } finally { setAccepting(''); }
  };
  return (
    <div className="resqly-shell"><div className="resqly-frame flex flex-col min-h-screen">
      <MobileShell title="Doctor requests" header>
        <div className="px-5 py-5 pb-8">
          <div className="resqly-card p-4 bg-blue-50/70 border-blue-100"><div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-blue-700"/><b className="text-slate-900">Live doctor requests</b></div><p className="text-xs text-slate-600 mt-1">Requests match your approved profile languages. Online consultations can come from anywhere; home visits are limited to 25 km.</p></div>
          <div className="flex items-center justify-between mt-5 mb-3"><h2 className="font-semibold text-slate-900">{requests.length} available</h2><button onClick={() => load()} className="text-blue-700 text-xs font-semibold inline-flex items-center gap-1"><RefreshCw className="w-3 h-3"/> Refresh</button></div>
          {loading ? <div className="p-8 text-center text-slate-500">Loading requests…</div> : !requests.length ? <div className="resqly-card p-8 text-center"><Video className="w-9 h-9 text-slate-300 mx-auto"/><h3 className="font-semibold text-slate-800 mt-2">No matching requests right now</h3><p className="text-xs text-slate-500 mt-1">Stay Available. New requests will appear automatically.</p></div> : <div className="space-y-3">{requests.map((r) => <div className="resqly-card p-4" key={r.id}><div className="flex items-start justify-between gap-2"><div><span className="text-[10px] uppercase tracking-wider font-bold text-blue-700">{r.consultation_type === 'online' ? 'Online consultation' : 'Home visit'}</span><h3 className="font-semibold text-slate-900 mt-1">{r.customer_name || 'Patient'}</h3></div><span className="font-bold text-slate-900">₹{r.amount}</span></div><p className="text-sm text-slate-700 mt-3 whitespace-pre-wrap">{r.problem}</p><div className="flex flex-wrap gap-1 mt-3">{(r.languages || []).map((l) => <span key={l} className="text-[10px] bg-slate-100 text-slate-700 rounded-full px-2 py-1">{l}</span>)}</div>{r.consultation_type === 'home_visit' && <div className="flex items-center gap-1 text-xs text-slate-500 mt-3"><MapPin className="w-3 h-3"/>{r.distance_km ?? '—'} km away · {r.address}</div>}<div className="flex items-center gap-1 text-xs text-slate-500 mt-3"><Clock3 className="w-3 h-3"/>Paid request · first eligible doctor to accept gets the booking</div><Button disabled={!!accepting} onClick={() => accept(r.id)} className="w-full mt-4 bg-blue-700 hover:bg-blue-800">{accepting === r.id ? 'Accepting…' : 'Accept request'}</Button></div>)}</div>}
        </div>
      </MobileShell><BottomNav variant="provider"/>
    </div></div>
  );
}

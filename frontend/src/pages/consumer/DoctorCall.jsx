import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Video, FileText, ShieldCheck, AlertTriangle, Plus, Trash2, House } from 'lucide-react';
import { toast } from 'sonner';
import api, { API_BASE } from '@/lib/api';
import { startNativeAgoraCall, isNativeAgoraCallSupported } from '@/lib/agoraCall';
import MobileShell from '@/components/MobileShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function DoctorCall({ role }) {
  const { consultationId } = useParams();
  const navigate = useNavigate();
  const [consultation, setConsultation] = useState(null);
  const [title, setTitle] = useState('Consultation prescription');
  const [notes, setNotes] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [medications, setMedications] = useState([{ name: '', dosage: '', frequency: '', duration: '' }]);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [startingCall, setStartingCall] = useState(false);
  const [callError, setCallError] = useState('');

  const loadConsultation = useCallback(async () => {
    try {
      const { data } = await api.get('/doctor-consultations/' + consultationId);
      setConsultation(data.consultation);
      setCallError('');
    } catch (e) {
      setCallError(e.response?.data?.detail || 'Could not load consultation');
    }
  }, [consultationId]);

  useEffect(() => {
    loadConsultation();
    const poll = setInterval(loadConsultation, 2500);
    const onVisible = () => { if (document.visibilityState === 'visible') loadConsultation(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(poll);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [loadConsultation]);

  const savePrescription = async () => {
    if (!medications.some((m) => m.name.trim()) && !notes.trim()) return toast.error('Add a medicine or write care instructions before saving.');
    setSaving(true);
    try {
      await api.post('/doctor-consultations/' + consultationId + '/prescription', { consultation_id: consultationId, title, notes, follow_up: followUp, medications: medications.filter((m) => m.name.trim()) });
      toast.success('Prescription saved to the patient’s RX screen.');
    } catch (e) { toast.error(e.response?.data?.detail || 'Could not save prescription'); }
    finally { setSaving(false); }
  };

  const startVisit = async () => {
    try {
      const { data } = await api.post('/providers/me/doctor-consultations/' + consultationId + '/start-visit');
      setConsultation(data.consultation);
      toast.success('Home visit started. You can now record the prescription.');
    } catch (e) { toast.error(e.response?.data?.detail || 'Could not start this home visit'); }
  };

  const startVideoCall = async () => {
    if (!isNativeAgoraCallSupported()) {
      toast.error('Secure video calling is currently available in the Resqly Android app only.');
      return;
    }
    setStartingCall(true);
    try {
      const { data } = await api.get('/doctor-consultations/' + consultationId + '/rtc-token');
      await startNativeAgoraCall({
        appId: data.app_id,
        token: data.token,
        channel: data.channel,
        uid: data.uid,
        consultationId,
        apiBase: API_BASE,
        authToken: localStorage.getItem('resqly_token') || '',
        participantRole: data.participant_role,
        joinDeadline: data.join_deadline || '',
        consultationStatus: data.consultation_status || consultation.status,
      });
      toast.success('Secure video room opened.');
      await loadConsultation();
    } catch (e) {
      const message = e.response?.data?.detail || e.message || 'Could not start the video call';
      toast.error(message);
      setCallError(message);
    } finally {
      setStartingCall(false);
    }
  };

  const complete = async () => {
    setCompleting(true);
    try {
      const { data } = await api.post('/doctor-consultations/' + consultationId + '/complete');
      setConsultation(data.consultation);
      toast.success('Consultation marked complete');
      navigate(role === 'provider' ? '/provider/doctor-requests' : '/consumer/prescriptions');
    } catch (e) { toast.error(e.response?.data?.detail || 'Could not finish consultation'); }
    finally { setCompleting(false); }
  };

  if (!consultation) return <MobileShell title="Consultation"><div className="p-8 text-center text-slate-500">Loading consultation…</div></MobileShell>;

  return (
    <MobileShell title={role === 'provider' ? 'Doctor consultation' : 'Video consultation'}>
      <div className="px-5 py-5 pb-10 space-y-4">
        <div className="resqly-card p-4">
          <div className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-blue-700"/><div><div className="font-semibold text-slate-900">{consultation.doctor_name || 'Assigned doctor'}</div><div className="text-xs text-slate-500 capitalize">{consultation.consultation_type?.replace('_', ' ')} · {consultation.status?.replace('_', ' ')}</div></div></div>
          <div className="mt-3 rounded-xl bg-slate-50 p-3"><div className="text-xs font-semibold text-slate-500">PATIENT CONCERN</div><p className="text-sm text-slate-800 mt-1 whitespace-pre-wrap">{consultation.problem}</p></div>
        </div>
        {consultation.consultation_type === 'online' ? (
          <div className="rounded-3xl bg-slate-950 p-5 text-white">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center"><Video className="w-6 h-6 text-white"/></div>
            <h2 className="text-lg font-bold mt-3">{consultation.status === 'in_call' ? 'Consultation room ready' : 'Join the video consultation'}</h2>
            <p className="text-sm text-slate-300 mt-2">{consultation.status === 'in_call' ? 'Both participants have joined. You can rejoin if you left the call.' : 'Tap below to open the native secure call room. Allow camera and microphone access when Android asks.'}</p>
            {consultation.status === 'accepted' && consultation.join_deadline && <p className="text-xs text-amber-200 mt-3">Please join before the 5-minute window ends.</p>}
            {consultation.status === 'in_call' && <div className="mt-3 rounded-xl bg-emerald-900/70 p-3 text-xs text-emerald-100">Both patient and doctor have connected to the same secure Agora room.</div>}
            {!isNativeAgoraCallSupported() && <div className="mt-3 rounded-xl bg-amber-900/60 p-3 text-xs text-amber-100">Video calls currently require the Resqly Android app. Open this consultation in the app to join.</div>}
            <Button onClick={startVideoCall} disabled={startingCall || !isNativeAgoraCallSupported() || !['accepted', 'in_call'].includes(consultation.status)} className="w-full mt-4 bg-blue-500 hover:bg-blue-600">
              {startingCall ? 'Preparing secure room…' : consultation.status === 'in_call' ? 'Rejoin video call' : 'Get into video call'}
            </Button>
            {callError && <p className="text-xs text-rose-200 mt-3">{callError}</p>}
          </div>
        ) : (
          <div className="resqly-card p-5">
            <div className="flex items-center gap-2"><House className="w-5 h-5 text-blue-700"/><h2 className="font-bold text-slate-900">Doctor home visit</h2></div>
            <p className="text-sm text-slate-600 mt-2">This is an in-person visit, not a video call.</p>
            <div className="rounded-xl bg-slate-50 p-3 mt-3"><div className="text-xs text-slate-500">Visit address</div><div className="text-sm font-medium text-slate-900 mt-1">{consultation.address || 'Location shared with the doctor'}</div></div>
            {role === 'provider' && consultation.status === 'accepted' && <Button onClick={startVisit} className="w-full mt-4 bg-blue-700 hover:bg-blue-800">Start home visit</Button>}
            {role === 'provider' && consultation.status === 'in_progress' && <p className="text-xs text-emerald-700 mt-3">Visit in progress. Add the prescription below and mark the visit complete when finished.</p>}
          </div>
        )}
        {role === 'provider' && ((consultation.consultation_type === 'home_visit' && ['in_progress', 'completed'].includes(consultation.status)) || (consultation.consultation_type === 'online' && ['in_call', 'completed'].includes(consultation.status))) && (
          <div className="resqly-card p-5 space-y-3">
            <div className="flex items-center gap-2"><FileText className="w-5 h-5 text-blue-700"/><h2 className="font-bold text-slate-900">Write prescription</h2></div>
            <p className="text-xs text-slate-500">Saved prescriptions appear in the patient’s Prescriptions (RX) tab.</p>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Prescription title"/>
            {medications.map((m, i) => <div key={i} className="rounded-xl border border-slate-200 p-3 space-y-2"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-600">Medicine {i + 1}</span><button onClick={() => setMedications((all) => all.length === 1 ? [{ name: '', dosage: '', frequency: '', duration: '' }] : all.filter((_, idx) => idx !== i))} className="text-slate-400"><Trash2 className="w-4 h-4"/></button></div><Input value={m.name} onChange={(e) => setMedications((all) => all.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} placeholder="Medicine name"/><div className="grid grid-cols-2 gap-2"><Input value={m.dosage} onChange={(e) => setMedications((all) => all.map((x, idx) => idx === i ? { ...x, dosage: e.target.value } : x))} placeholder="Dose"/><Input value={m.frequency} onChange={(e) => setMedications((all) => all.map((x, idx) => idx === i ? { ...x, frequency: e.target.value } : x))} placeholder="How often"/><Input value={m.duration} onChange={(e) => setMedications((all) => all.map((x, idx) => idx === i ? { ...x, duration: e.target.value } : x))} placeholder="Duration"/></div></div>)}
            <button onClick={() => setMedications((all) => [...all, { name: '', dosage: '', frequency: '', duration: '' }])} className="text-sm text-blue-700 font-semibold inline-flex items-center gap-1"><Plus className="w-4 h-4"/> Add medicine</button>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Diagnosis and care instructions"/>
            <Input value={followUp} onChange={(e) => setFollowUp(e.target.value)} placeholder="Follow-up (optional)"/>
            <Button onClick={savePrescription} disabled={saving} className="w-full bg-blue-700 hover:bg-blue-800">{saving ? 'Saving…' : 'Save prescription to patient RX'}</Button>
          </div>
        )}
        {consultation.consultation_type === 'online' && consultation.status !== 'in_call' && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 flex gap-2"><AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5"/><p className="text-xs text-amber-900">Prescriptions stay locked until both participants have joined the live call. Never rely on an unconnected room for medical care.</p></div>}
        {role === 'provider' && <Button variant="outline" onClick={complete} disabled={completing || (consultation.consultation_type === 'home_visit' ? consultation.status !== 'in_progress' : consultation.status !== 'in_call') || role !== 'provider'} className="w-full">{completing ? 'Finishing…' : consultation.consultation_type === 'home_visit' ? 'Mark home visit complete' : consultation.status === 'in_call' ? 'Mark consultation complete' : 'Complete after the video call'}</Button>}
      </div>
    </MobileShell>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Video, VideoOff, Mic, MicOff, PhoneOff, FileText, ShieldCheck, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
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

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const { data } = await api.get('/doctor-consultations/' + consultationId);
        if (active) setConsultation(data.consultation);
      } catch (e) {
        if (active) toast.error(e.response?.data?.detail || 'Could not load consultation');
      }
    };
    load();
    return () => { active = false; };
  }, [consultationId]);

  const savePrescription = async () => {
    if (!medications.some((m) => m.name.trim()) && !notes.trim()) return toast.error('Add a medicine or write care instructions before saving.');
    setSaving(true);
    try {
      await api.post('/doctor-consultations/' + consultationId + '/prescription', { consultation_id: consultationId, title, notes, follow_up: followUp, medications: medications.filter((m) => m.name.trim()) });
      toast.success('Prescription saved to the patient’s RX screen.');
    } catch (e) { toast.error(e.response?.data?.detail || 'Could not save prescription'); }
    finally { setSaving(false); }
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
        <div className="rounded-3xl bg-slate-950 p-4 text-white">
          <div className="aspect-[4/3] rounded-2xl border border-white/15 bg-slate-900 flex flex-col items-center justify-center text-center p-5">
            <VideoOff className="w-10 h-10 text-slate-400"/>
            <h2 className="font-semibold mt-3">Video calling is not connected yet</h2>
            <p className="text-xs text-slate-400 mt-2 max-w-xs">This screen will not pretend a call is live. The Agora native SDK, secure call-token service, and device-to-device verification still need to be connected before patient care can happen here.</p>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="rounded-xl bg-white/10 p-3 text-center"><Mic className="w-5 h-5 mx-auto"/><span className="block text-[10px] mt-1">Microphone</span></div>
            <div className="rounded-xl bg-white/10 p-3 text-center"><Video className="w-5 h-5 mx-auto"/><span className="block text-[10px] mt-1">Camera</span></div>
            <button onClick={() => navigate(role === 'provider' ? '/provider/doctor-requests' : '/consumer/prescriptions')} className="rounded-xl bg-rose-600 p-3 text-center"><PhoneOff className="w-5 h-5 mx-auto"/><span className="block text-[10px] mt-1">Leave</span></button>
          </div>
        </div>
        {role === 'provider' && (
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
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 flex gap-2"><AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5"/><p className="text-xs text-amber-900">Do not use this screen for clinical care until video calling is enabled and tested. Prescription saving is available only to the assigned, verified doctor.</p></div>
        <Button variant="outline" onClick={complete} disabled={completing || !['accepted', 'in_call'].includes(consultation.status)} className="w-full">{completing ? 'Finishing…' : 'Mark consultation complete'}</Button>
      </div>
    </MobileShell>
  );
}

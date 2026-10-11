import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Ambulance, MapPin, ShieldAlert, Phone, CheckCircle2, AlertTriangle, Navigation } from 'lucide-react';
import api from '@/lib/api';
import { reverseGeocode } from '@/lib/uploads';
import { useAuth } from '@/lib/auth';
import MobileShell from '@/components/MobileShell';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

export default function ConsumerEmergencyRequest() {
  const navigate = useNavigate();
  const { me } = useAuth();
  const [step, setStep] = useState('intro');
  const [coords, setCoords] = useState(null);
  const [address, setAddress] = useState(me?.location || '');
  const [notes, setNotes] = useState('');
  const [permissionError, setPermissionError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [requestId, setRequestId] = useState('');
  const [candidateCount, setCandidateCount] = useState(0);

  const requestLocation = () => {
    setStep('locating');
    setPermissionError('');
    if (!('geolocation' in navigator)) {
      setPermissionError('Location is not available in this browser. You can enter your address manually.');
      setStep('confirm');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        setCoords({ lat, lng });
        try {
          const geo = await reverseGeocode(lat, lng);
          if (geo && (geo.label || geo.short)) setAddress((prev) => prev || geo.short || geo.label);
        } catch {}
        setStep('confirm');
      },
      (err) => {
        setPermissionError(err.message || 'Location permission was not granted. You can enter your address manually.');
        setStep('confirm');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const { data } = await api.post('/emergency/request', {
        latitude: coords?.lat, longitude: coords?.lng, address, notes, type: 'ambulance',
      });
      setRequestId(data.request.id);
      setCandidateCount(data.request.candidate_provider_count || 0);
      setStep('sent');
      toast.success('Request saved');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Could not save request');
    } finally { setSubmitting(false); }
  };

  return (
    <MobileShell title="Emergency help">
      <div className="px-5 py-5 pb-8">
        <div className="resqly-card p-4 bg-rose-50 border-rose-100 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-700 flex-shrink-0" />
          <div className="text-sm text-rose-950">
            <p className="font-bold">Need an ambulance now?</p>
            <p className="mt-1">Call 108 for immediate ambulance assistance. Resqly does not dispatch ambulances yet.</p>
            <a href="tel:108" className="inline-flex items-center justify-center gap-2 mt-3 rounded-xl bg-rose-700 text-white font-bold px-4 py-3 min-h-[48px]"><Phone className="w-4 h-4" /> Call 108 now</a>
          </div>
        </div>

        {step === 'intro' && (
          <section className="mt-5">
            <div className="resqly-card p-5">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center"><Ambulance className="w-6 h-6 text-rose-700" /></div>
              <h2 className="text-xl font-bold text-slate-950 mt-3">Save an emergency request</h2>
              <p className="text-sm text-slate-600 mt-2">This stores your location and notes for Resqly. It does not contact an ambulance or emergency service.</p>
              <Button data-testid="emr-start" onClick={requestLocation} variant="outline" className="w-full mt-5 min-h-[48px]"><MapPin className="w-4 h-4 mr-2" /> Add location and continue</Button>
            </div>
          </section>
        )}

        {step === 'locating' && (
          <div className="resqly-card p-8 mt-4 text-center" role="status" aria-live="polite">
            <Navigation className="w-10 h-10 text-blue-700 mx-auto" />
            <h3 className="font-semibold mt-3">Getting your location</h3>
            <p className="text-sm text-slate-500 mt-1">This should only take a moment.</p>
          </div>
        )}

        {step === 'confirm' && (
          <div className="resqly-card p-5 mt-4">
            <h3 className="font-semibold text-slate-950">Confirm your details</h3>
            {coords ? <div className="mt-2 flex items-start gap-2 text-sm"><ShieldAlert className="w-4 h-4 text-emerald-600 mt-0.5" /><div><div className="text-emerald-700 font-semibold">Location captured</div><div className="text-slate-500 text-xs">{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</div></div></div> : <p className="mt-2 text-sm text-amber-800">Location is not available. {permissionError}</p>}
            <label className="text-sm font-semibold text-slate-700 block mt-4" htmlFor="emergency-address">Address or landmark</label>
            <Input id="emergency-address" data-testid="emr-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Area, street and nearby landmark" />
            <label className="text-sm font-semibold text-slate-700 block mt-3" htmlFor="emergency-notes">Notes (optional)</label>
            <Textarea id="emergency-notes" data-testid="emr-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything Resqly should know?" rows={3} />
            <Button data-testid="emr-submit" onClick={submit} disabled={submitting} className="w-full mt-5 bg-blue-700 hover:bg-blue-800 min-h-[48px]">{submitting ? 'Saving request…' : 'Save request details'}</Button>
          </div>
        )}

        {step === 'sent' && (
          <div className="resqly-card p-5 mt-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            <h3 className="font-bold text-lg mt-3">Details saved</h3>
            <p className="text-sm text-slate-600 mt-1">Your emergency details are saved in Resqly. No ambulance has been contacted or dispatched.</p>
            <p className="text-xs text-slate-500 mt-2">Reference: {requestId.slice(0, 8)} · {candidateCount} ambulance providers listed in the network.</p>
            <a href="tel:108" className="inline-flex items-center justify-center gap-2 mt-4 rounded-xl bg-rose-700 text-white font-bold px-4 py-3 min-h-[48px]"><Phone className="w-4 h-4" /> Call 108</a>
            <Button onClick={() => navigate('/consumer/home')} variant="outline" className="w-full mt-3 min-h-[48px]">Back to Home</Button>
          </div>
        )}
      </div>
    </MobileShell>
  );
}

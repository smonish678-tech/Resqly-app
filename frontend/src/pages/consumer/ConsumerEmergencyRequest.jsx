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
  const [step, setStep] = useState('intro'); // intro | locating | confirm | sent
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
      setPermissionError('Geolocation not supported in this browser.');
      setStep('confirm');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        // Reverse geocode to auto-fill address
        try {
          const geo = await reverseGeocode(lat, lng);
          if (geo && (geo.label || geo.short)) {
            setAddress((prev) => prev || geo.short || geo.label);
          }
        } catch {}
        setStep('confirm');
      },
      (err) => {
        setPermissionError(err.message || 'Location permission denied. You can still proceed manually.');
        setStep('confirm');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const { data } = await api.post('/emergency/request', {
        latitude: coords?.lat,
        longitude: coords?.lng,
        address,
        notes,
        type: 'ambulance',
      });
      setRequestId(data.request.id);
      setCandidateCount(data.request.candidate_provider_count || 0);
      setStep('sent');
      toast.success('Emergency request logged');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Could not log request');
    } finally { setSubmitting(false); }
  };

  return (
    <MobileShell title="Emergency Ambulance">
      <div className="px-5 py-5">
        {/* Notice */}
        <div className="resqly-card p-4 bg-amber-50 border-amber-100 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0" />
          <div className="text-xs text-amber-900">
            Resqly is in pre-launch. Real-time dispatch will activate once provider verification and emergency routing are fully live. <b>If this is a real emergency, please dial 108.</b>
          </div>
        </div>

        {step === 'intro' && (
          <div className="mt-4">
            <div className="emergency-fab rounded-3xl p-5 text-white">
              <Ambulance className="w-10 h-10" />
              <h2 className="text-2xl font-bold mt-3">Request an Ambulance</h2>
              <p className="text-sm text-white/90 mt-1">We will capture your live location and notify the nearest verified ambulance provider.</p>
            </div>
            <div className="resqly-card p-5 mt-4 space-y-2 text-sm text-slate-700">
              <Step n={1} label="Allow location permission" />
              <Step n={2} label="Capture live GPS location" />
              <Step n={3} label="Identify nearest available ambulance providers" />
              <Step n={4} label="Create emergency request" />
              <Step n={5} label="Dispatch notification to nearest provider" />
            </div>
            <Button data-testid="emr-start" onClick={requestLocation} className="w-full mt-5 bg-rose-600 hover:bg-rose-700">
              <MapPin className="w-4 h-4 mr-1" /> Share Location & Continue
            </Button>
            <a href="tel:108" className="mt-3 block text-center text-sm text-slate-600 underline"><Phone className="inline w-4 h-4 mr-1" /> Call 108 directly</a>
          </div>
        )}

        {step === 'locating' && (
          <div className="resqly-card p-8 mt-4 text-center">
            <Navigation className="w-10 h-10 text-blue-700 mx-auto animate-pulse" />
            <h3 className="font-semibold mt-3">Capturing your location…</h3>
            <p className="text-sm text-slate-500 mt-1">Allow location permission to proceed.</p>
          </div>
        )}

        {step === 'confirm' && (
          <div className="mt-4">
            <div className="resqly-card p-5">
              <h3 className="font-semibold text-slate-900">Confirm details</h3>
              {coords ? (
                <div className="mt-2 flex items-start gap-2 text-sm">
                  <ShieldAlert className="w-4 h-4 text-emerald-600 mt-0.5" />
                  <div>
                    <div className="text-emerald-700 font-medium">Live location captured</div>
                    <div className="text-slate-500 text-xs">{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</div>
                  </div>
                </div>
              ) : (
                <div className="mt-2 text-sm text-amber-700">Location not available. {permissionError}</div>
              )}
              <label className="text-xs font-medium text-slate-500 block mt-4">Address / Landmark</label>
              <Input data-testid="emr-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. HSR Layout, Sector 6, Bangalore" />
              <label className="text-xs font-medium text-slate-500 block mt-3">Notes (symptoms, situation)</label>
              <Textarea data-testid="emr-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Brief description" rows={3} />
              <Button data-testid="emr-submit" onClick={submit} disabled={submitting} className="w-full mt-4 bg-rose-600 hover:bg-rose-700">
                {submitting ? 'Logging request...' : 'Request Emergency Ambulance'}
              </Button>
            </div>
          </div>
        )}

        {step === 'sent' && (
          <div className="resqly-card p-6 mt-4 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h3 className="font-bold text-lg mt-3">Request logged</h3>
            <p className="text-sm text-slate-600 mt-1">
              We have logged your emergency request. We currently have <b>{candidateCount}</b> verified ambulance provider(s) in our network.
            </p>
            <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-2 mt-3">
              Live dispatch is not yet active. Please call 108 for immediate assistance.
            </div>
            <div className="text-xs text-slate-400 mt-2">Reference: {requestId.slice(0, 8)}</div>
            <Button onClick={() => navigate('/consumer/home')} variant="outline" className="mt-4 w-full">Back to Home</Button>
          </div>
        )}
      </div>
    </MobileShell>
  );
}

function Step({ n, label }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">{n}</div>
      <span>{label}</span>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import MobileShell from '@/components/MobileShell';
import BottomNav from '@/components/BottomNav';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CITIES } from '@/lib/constants';
import { Heart } from 'lucide-react';

export default function ConsumerWaitlist() {
  const { me } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Bangalore');
  const [loc, setLoc] = useState('');
  const [joined, setJoined] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (me) {
      setName(me.name || '');
      setPhone(me.phone || '');
      setCity(me.city || 'Bangalore');
      setLoc(me.location || '');
    }
  }, [me]);

  const submit = async () => {
    if (!name || !phone || !city) { toast.error('Please fill all fields'); return; }
    setSubmitting(true);
    try {
      await api.post('/waitlist', { name, phone, city, location: loc, service_interest: 'priority_access' });
      setJoined(true);
      toast.success('You are on the priority list');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Could not join');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="resqly-shell">
      <div className="resqly-frame flex flex-col min-h-screen">
        <MobileShell title="Priority Access" header>
          <div className="px-5 py-5">
            <div className="resqly-card p-5 bg-blue-50/50 border-blue-100">
              <Heart className="w-6 h-6 text-blue-700" />
              <h2 className="text-lg font-semibold text-slate-900 mt-2">Get priority access</h2>
              <p className="text-sm text-slate-600 mt-1">Be the first to know when verified Resqly providers go live in your area.</p>
            </div>

            {joined ? (
              <div className="resqly-card p-6 mt-4 text-center">
                <div className="text-4xl">✓</div>
                <h3 className="font-semibold text-slate-900 mt-2">You're on the priority list</h3>
                <p className="text-sm text-slate-500 mt-1">We'll notify you as soon as we launch.</p>
              </div>
            ) : (
              <div className="resqly-card p-5 mt-4 space-y-3">
                <Field label="Full Name"><Input data-testid="waitlist-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" /></Field>
                <Field label="Phone"><Input data-testid="waitlist-phone" inputMode="numeric" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} placeholder="10-digit mobile" /></Field>
                <Field label="City">
                  <select data-testid="waitlist-city" value={city} onChange={(e) => setCity(e.target.value)} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white">
                    {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Locality (optional)"><Input data-testid="waitlist-location" value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="e.g. HSR Layout" /></Field>
                <Button data-testid="waitlist-submit" onClick={submit} disabled={submitting} className="w-full bg-blue-700 hover:bg-blue-800">
                  {submitting ? 'Submitting...' : 'Join Priority List'}
                </Button>
              </div>
            )}
          </div>
        </MobileShell>
        <BottomNav variant="consumer" />
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-500">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

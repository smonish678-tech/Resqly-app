import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { ShieldCheck } from 'lucide-react';
import api from '@/lib/api';
import MobileShell from '@/components/MobileShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';
import { CITIES, CONSUMER_SERVICES, SERVICE_LABELS } from '@/lib/constants';

export default function ConsumerServiceDetail() {
  const { serviceKey } = useParams();
  const { me } = useAuth();
  const [joined, setJoined] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Bangalore');

  useEffect(() => {
    if (me) {
      setName(me.name || '');
      setPhone(me.phone || '');
      setCity(me.city || 'Bangalore');
    }
  }, [me]);

  const service = CONSUMER_SERVICES.find((s) => s.key === serviceKey)
    || { key: serviceKey, label: SERVICE_LABELS[serviceKey] || serviceKey, icon: 'Activity', bg: '#E0F2FE', fg: '#0284C7' };
  const Icon = Icons[service.icon] || Icons.Activity;

  const join = async () => {
    if (!name || !phone || !city) { toast.error('Please fill all fields'); return; }
    setSubmitting(true);
    try {
      await api.post('/waitlist', { name, phone, city, service_interest: serviceKey });
      setJoined(true);
      toast.success('Added to waitlist');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Could not join waitlist');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MobileShell title={service.label}>
      <div className="px-5 py-5">
        <div className="resqly-card p-5 flex items-center gap-4">
          <div className="icon-tile" style={{ background: service.bg }}>
            <Icon size={28} color={service.fg} strokeWidth={2.2} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{service.label}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Pre-launch service</p>
          </div>
        </div>

        <div className="resqly-card p-5 mt-4 bg-blue-50/50 border-blue-100">
          <div className="flex gap-2 items-start">
            <ShieldCheck className="w-5 h-5 text-blue-700 mt-0.5" />
            <p className="text-sm text-slate-700">
              We are onboarding verified providers in your area. Join the waitlist and we will notify you the moment <b>{service.label}</b> goes live in your city.
            </p>
          </div>
        </div>

        {joined ? (
          <div className="resqly-card p-5 mt-4 text-center">
            <div className="text-3xl">✓</div>
            <h3 className="font-semibold text-slate-900 mt-2">You're on the list!</h3>
            <p className="text-sm text-slate-500 mt-1">We'll notify you as soon as we go live in {city}.</p>
          </div>
        ) : (
          <div className="resqly-card p-5 mt-4 space-y-3">
            <h4 className="font-semibold text-slate-900">Join Waitlist</h4>
            <Input data-testid="service-name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input data-testid="service-phone" placeholder="Phone number" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} />
            <select data-testid="service-city" value={city} onChange={(e) => setCity(e.target.value)} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white">
              {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <Button data-testid="service-join-waitlist" onClick={join} disabled={submitting} className="w-full bg-blue-700 hover:bg-blue-800">
              {submitting ? 'Joining...' : 'Join Waitlist'}
            </Button>
          </div>
        )}
      </div>
    </MobileShell>
  );
}

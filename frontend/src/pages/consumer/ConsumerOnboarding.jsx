import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import MobileShell from '@/components/MobileShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CITIES, BLOOD_GROUPS } from '@/lib/constants';

export default function ConsumerOnboarding() {
  const navigate = useNavigate();
  const { me, refresh } = useAuth();
  const [name, setName] = useState('');
  const [city, setCity] = useState('Bangalore');
  const [bloodGroup, setBloodGroup] = useState('');
  const [hospital, setHospital] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (me) {
      setName(me.name || '');
      setCity(me.city || 'Bangalore');
      setBloodGroup(me.blood_group || '');
      setHospital(me.preferred_hospital || '');
    }
  }, [me]);

  const save = async () => {
    if (!name || !city) {
      toast.error('Please add your name and city');
      return;
    }
    setLoading(true);
    try {
      await api.patch('/users/me', { name, city, blood_group: bloodGroup, preferred_hospital: hospital });
      await refresh();
      toast.success('Profile saved');
      navigate('/consumer/home', { replace: true });
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Could not save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileShell title="Set up profile" hideBack>
      <div className="px-5 py-6">
        <h2 className="text-xl font-semibold text-slate-900">Tell us about you</h2>
        <p className="text-sm text-slate-500 mt-1">This helps us personalize emergency care.</p>

        <div className="resqly-card p-4 mt-5 space-y-4">
          <Field label="Full Name">
            <Input data-testid="onb-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </Field>
          <Field label="City">
            <select data-testid="onb-city" value={city} onChange={(e) => setCity(e.target.value)} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white">
              {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Blood Group">
            <div className="flex flex-wrap gap-2">
              {BLOOD_GROUPS.map((bg) => (
                <button
                  data-testid={`onb-blood-${bg}`}
                  key={bg}
                  type="button"
                  onClick={() => setBloodGroup(bg)}
                  className={`px-3 py-1.5 rounded-full border text-sm ${bloodGroup === bg ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-slate-700 border-slate-200'}`}
                >{bg}</button>
              ))}
            </div>
          </Field>
          <Field label="Preferred Hospital (optional)">
            <Input data-testid="onb-hospital" value={hospital} onChange={(e) => setHospital(e.target.value)} placeholder="e.g. Manipal Hospitals" />
          </Field>
        </div>

        <Button data-testid="onb-save" onClick={save} disabled={loading} className="w-full mt-6 bg-blue-700 hover:bg-blue-800">
          {loading ? 'Saving...' : 'Continue to Home'}
        </Button>
      </div>
    </MobileShell>
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

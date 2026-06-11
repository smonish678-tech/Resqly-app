import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { LogOut, FileText, ShieldAlert, MapPin, Phone, Mail, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import MobileShell from '@/components/MobileShell';
import BottomNav from '@/components/BottomNav';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CITIES } from '@/lib/constants';

export default function ConsumerProfile() {
  const { me, refresh, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Bangalore');
  const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (me) {
      setName(me.name || '');
      setEmail(me.email || '');
      setCity(me.city || 'Bangalore');
      setLocation(me.location || '');
    }
  }, [me]);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch('/users/me', { name, email, city, location });
      await refresh();
      toast.success('Profile updated');
    } catch (e) {
      toast.error('Could not save');
    } finally { setSaving(false); }
  };

  const doLogout = () => { logout(); navigate('/', { replace: true }); };

  return (
    <div className="resqly-shell">
      <div className="resqly-frame flex flex-col min-h-screen">
        <MobileShell title="My Profile" header>
          <div className="px-5 py-5">
            <div className="resqly-card p-5 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xl">
                {(me?.name || me?.phone || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-slate-900">{me?.name || 'Set your name'}</div>
                <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" /> +91 {me?.phone}</div>
                {me?.email && <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Mail className="w-3 h-3" /> {me.email}</div>}
              </div>
            </div>

            <div className="resqly-card p-5 mt-4 space-y-3">
              <Field label="Full Name"><Input data-testid="profile-name" value={name} onChange={(e) => setName(e.target.value)} /></Field>
              <Field label="Email (optional)"><Input data-testid="profile-email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
              <Field label="City">
                <select data-testid="profile-city" value={city} onChange={(e) => setCity(e.target.value)} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white">
                  {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Locality"><Input data-testid="profile-location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. HSR Layout" /></Field>
              <Button data-testid="profile-save" onClick={save} disabled={saving} className="w-full bg-blue-700 hover:bg-blue-800">{saving ? 'Saving...' : 'Save Changes'}</Button>
            </div>

            <div className="resqly-card p-3 mt-4 divide-y">
              <ProfileLink to="/consumer/emergency" icon={<ShieldAlert className="w-4 h-4 text-rose-600" />} label="Emergency Profile" />
              <ProfileLink to="/privacy" icon={<FileText className="w-4 h-4 text-slate-500" />} label="Privacy Policy" />
              <ProfileLink to="/terms" icon={<FileText className="w-4 h-4 text-slate-500" />} label="Terms & Conditions" />
              <ProfileLink to="/support" icon={<FileText className="w-4 h-4 text-slate-500" />} label="Support" />
              <ProfileLink to="/contact" icon={<FileText className="w-4 h-4 text-slate-500" />} label="Contact Us" />
              <ProfileLink to="/permissions" icon={<MapPin className="w-4 h-4 text-slate-500" />} label="App Permissions" />
              <ProfileLink to="/delete-account" icon={<Trash2 className="w-4 h-4 text-rose-600" />} label="Delete Account / Data" />
            </div>

            <Button data-testid="profile-logout" onClick={doLogout} variant="outline" className="w-full mt-4">
              <LogOut className="w-4 h-4 mr-1" /> Logout
            </Button>
          </div>
        </MobileShell>
        <BottomNav variant="consumer" />
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return <div><label className="text-xs font-medium text-slate-500">{label}</label><div className="mt-1">{children}</div></div>;
}

function ProfileLink({ to, icon, label }) {
  return (
    <Link to={to} className="flex items-center gap-3 px-3 py-3 hover:bg-slate-50">
      {icon}
      <span className="text-sm text-slate-800 font-medium">{label}</span>
      <span className="ml-auto text-slate-400">›</span>
    </Link>
  );
}

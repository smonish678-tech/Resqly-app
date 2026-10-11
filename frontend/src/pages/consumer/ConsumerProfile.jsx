import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, UserRound, ShieldCheck, MapPin, Bell, FileText, CircleHelp, LogOut, ChevronRight } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import BottomNav from '@/components/BottomNav';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BLOOD_GROUPS } from '@/lib/constants';

export default function ConsumerProfile() {
  const navigate = useNavigate();
  const { me, refresh, logout } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Bangalore');
  const [location, setLocation] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [allergies, setAllergies] = useState('');
  const [conditions, setConditions] = useState('');
  const [medicalOpen, setMedicalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!me) return;
    setName(me.name || '');
    setEmail(me.email || '');
    setCity(me.city || 'Bangalore');
    setLocation(me.location || '');
    setBloodGroup(me.blood_group || '');
    setAllergies((me.allergies || []).join(', '));
    setConditions((me.medical_conditions || []).join(', '));
  }, [me]);

  const save = async () => {
    if (!name.trim()) return toast.error('Please add your name.');
    setSaving(true);
    try {
      await api.patch('/users/me', {
        name: name.trim(),
        email: email.trim(),
        city: city.trim() || 'Bangalore',
        location: location.trim(),
        blood_group: bloodGroup || null,
        allergies: allergies.split(',').map((s) => s.trim()).filter(Boolean),
        medical_conditions: conditions.split(',').map((s) => s.trim()).filter(Boolean),
      });
      await refresh();
      toast.success('Profile updated');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Could not save your profile. Please try again.');
    } finally { setSaving(false); }
  };

  return (
    <div className="resqly-shell"><div className="resqly-frame flex flex-col min-h-screen">
      <main className="flex-1 px-5 pt-5 pb-8">
        <button onClick={() => navigate('/consumer/home')} className="inline-flex items-center gap-1 text-sm text-blue-700 font-semibold min-h-[44px]"><ArrowLeft className="w-4 h-4" /> Back to home</button>
        <div className="mt-3 flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center"><UserRound className="w-7 h-7 text-blue-700" /></div>
          <div><h1 className="text-2xl font-bold text-slate-950">Your profile</h1><p className="text-sm text-slate-500 mt-0.5">Only the details you need. Nothing to fill in just for completion.</p></div>
        </div>

        <section className="resqly-card p-5 mt-5 space-y-4">
          <div><label htmlFor="profile-name" className="block text-sm font-semibold text-slate-700 mb-1">Full name</label><Input id="profile-name" data-testid="prof-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" /></div>
          <div><label htmlFor="profile-phone" className="block text-sm font-semibold text-slate-700 mb-1">Phone number</label><Input id="profile-phone" value={me?.phone ? '+91 ' + me.phone : 'Not available'} readOnly className="bg-slate-50 text-slate-600" /><p className="text-xs text-slate-500 mt-1">Used for your account and sign-in.</p></div>
          <div><label htmlFor="profile-email" className="block text-sm font-semibold text-slate-700 mb-1">Email <span className="font-normal text-slate-500">(optional)</span></label><Input id="profile-email" data-testid="prof-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" /></div>
          <div><label htmlFor="profile-city" className="block text-sm font-semibold text-slate-700 mb-1">City</label><Input id="profile-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Your city" autoComplete="address-level2" /></div>
          <div><label htmlFor="profile-location" className="block text-sm font-semibold text-slate-700 mb-1">Default area or address <span className="font-normal text-slate-500">(optional)</span></label><Input id="profile-location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Area and landmark" autoComplete="street-address" /></div>
          <Button data-testid="prof-save" onClick={save} disabled={saving} className="w-full min-h-[48px] bg-blue-700 hover:bg-blue-800">{saving ? 'Saving…' : 'Save profile'}</Button>
        </section>

        <section className="resqly-card mt-4 overflow-hidden">
          <button onClick={() => setMedicalOpen((open) => !open)} aria-expanded={medicalOpen} className="w-full p-4 flex items-center gap-3 text-left min-h-[64px]">
            <span className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><ShieldCheck className="w-5 h-5 text-emerald-700" /></span>
            <span className="flex-1"><span className="block font-semibold text-slate-950">Medical details</span><span className="block text-sm text-slate-500 mt-0.5">Optional. Add only what may help in your care.</span></span>
            <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform duration-150 ${medicalOpen ? 'rotate-90' : ''}`} />
          </button>
          {medicalOpen && <div className="px-4 pb-4 space-y-4 border-t border-slate-100 pt-4">
            <div><label className="block text-sm font-semibold text-slate-700 mb-2">Blood group <span className="font-normal text-slate-500">(optional)</span></label><div className="flex flex-wrap gap-2">{BLOOD_GROUPS.map((group) => <button type="button" key={group} data-testid={`prof-blood-${group}`} onClick={() => setBloodGroup((v) => v === group ? '' : group)} aria-pressed={bloodGroup === group} className={`rounded-full border px-3 py-2 text-sm font-semibold min-h-[40px] ${bloodGroup === group ? 'border-blue-700 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-700'}`}>{group}</button>)}</div></div>
            <div><label htmlFor="profile-allergies" className="block text-sm font-semibold text-slate-700 mb-1">Allergies <span className="font-normal text-slate-500">(optional)</span></label><Input id="profile-allergies" value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="e.g. penicillin, peanuts" /><p className="text-xs text-slate-500 mt-1">Separate multiple entries with commas.</p></div>
            <div><label htmlFor="profile-conditions" className="block text-sm font-semibold text-slate-700 mb-1">Medical conditions <span className="font-normal text-slate-500">(optional)</span></label><Input id="profile-conditions" value={conditions} onChange={(e) => setConditions(e.target.value)} placeholder="Anything a clinician should know" /></div>
            <Button variant="outline" onClick={save} disabled={saving} className="w-full min-h-[44px]">{saving ? 'Saving…' : 'Save medical details'}</Button>
          </div>}
        </section>

        <section className="resqly-card mt-4 divide-y divide-slate-100">
          <ProfileLink icon={<MapPin className="w-5 h-5 text-blue-700" />} title="Manage family members" description="Profiles for people you care for" onClick={() => navigate('/consumer/family')} />
          <ProfileLink icon={<FileText className="w-5 h-5 text-blue-700" />} title="Prescriptions" description="View uploaded prescriptions and doctor notes" onClick={() => navigate('/consumer/prescriptions')} />
          <ProfileLink icon={<Bell className="w-5 h-5 text-blue-700" />} title="Notifications" description="Updates from Resqly" onClick={() => navigate('/consumer/notifications')} />
          <ProfileLink icon={<CircleHelp className="w-5 h-5 text-blue-700" />} title="Help and support" description="Get help or contact Resqly" onClick={() => navigate('/support')} />
        </section>

        <section className="resqly-card mt-4 p-4">
          <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Account</div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 text-sm"><button onClick={() => navigate('/privacy')} className="text-blue-700 underline">Privacy policy</button><button onClick={() => navigate('/terms')} className="text-blue-700 underline">Terms</button><button onClick={() => navigate('/delete-account')} className="text-blue-700 underline">Delete account / data</button></div>
          <Button variant="outline" onClick={() => { logout(); navigate('/'); }} className="w-full mt-4 min-h-[48px]"><LogOut className="w-4 h-4 mr-2" /> Log out</Button>
        </section>
      </main>
      <BottomNav variant="consumer" />
    </div></div>
  );
}

function ProfileLink({ icon, title, description, onClick }) {
  return <button onClick={onClick} className="w-full p-4 flex items-center gap-3 text-left min-h-[72px]"><span className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">{icon}</span><span className="flex-1"><span className="block font-semibold text-slate-950">{title}</span><span className="block text-sm text-slate-500 mt-0.5">{description}</span></span><ChevronRight className="w-5 h-5 text-slate-400" /></button>;
}

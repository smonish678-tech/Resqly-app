import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { ChevronLeft, Camera, Plus, Trash2, ChevronRight, LogOut } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import BottomNav from '@/components/BottomNav';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  CITIES, BLOOD_GROUPS, GENDERS, MARITAL,
  SMOKING_OPTIONS, ALCOHOL_OPTIONS, ACTIVITY_OPTIONS, FOOD_OPTIONS,
} from '@/lib/constants';

const TABS = ['Personal', 'Medical', 'Lifestyle'];

export default function ConsumerProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { me, refresh, logout } = useAuth();
  const [tab, setTab] = useState('Personal');
  const [form, setForm] = useState({});
  const [contacts, setContacts] = useState([]);
  const [saving, setSaving] = useState(false);
  const photoRef = useRef(null);

  useEffect(() => {
    if (me) {
      setForm({
        name: me.name || '',
        email: me.email || '',
        gender: me.gender || '',
        dob: me.dob || '',
        blood_group: me.blood_group || '',
        marital_status: me.marital_status || '',
        height_cm: me.height_cm || '',
        weight_kg: me.weight_kg || '',
        city: me.city || 'Bangalore',
        location: me.location || '',
        preferred_hospital: me.preferred_hospital || '',
        profile_photo: me.profile_photo || '',
        // medical
        allergies: (me.allergies || []).join(', '),
        current_medications: (me.current_medications || []).join(', '),
        past_medications: (me.past_medications || []).join(', '),
        chronic_diseases: (me.chronic_diseases || []).join(', '),
        medical_conditions: (me.medical_conditions || []).join(', '),
        injuries: (me.injuries || []).join(', '),
        surgeries: (me.surgeries || []).join(', '),
        // lifestyle
        smoking_habits: me.smoking_habits || '',
        alcohol_consumption: me.alcohol_consumption || '',
        activity_level: me.activity_level || '',
        food_preference: me.food_preference || '',
        occupation: me.occupation || '',
      });
      setContacts(me.emergency_contacts || []);
    }
  }, [me]);

  const onPhoto = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Max 2MB'); return; }
    const r = new FileReader();
    r.onload = () => setForm((f) => ({ ...f, profile_photo: r.result }));
    r.readAsDataURL(file);
  };

  const save = async () => {
    setSaving(true);
    try {
      const csv = (s) => (s || '').split(',').map((x) => x.trim()).filter(Boolean);
      const payload = {
        ...form,
        height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
        allergies: csv(form.allergies),
        current_medications: csv(form.current_medications),
        past_medications: csv(form.past_medications),
        chronic_diseases: csv(form.chronic_diseases),
        medical_conditions: csv(form.medical_conditions),
        injuries: csv(form.injuries),
        surgeries: csv(form.surgeries),
        emergency_contacts: contacts.filter((c) => c.name && c.phone),
      };
      await api.patch('/users/me', payload);
      await refresh();
      toast.success('Profile saved');
    } catch (e) {
      toast.error('Could not save');
    } finally { setSaving(false); }
  };

  const completion = me?.profile_completion || 0;

  return (
    <div className="resqly-shell">
      <div className="resqly-frame flex flex-col min-h-screen">
        {/* Practo-style top header */}
        <div className="gradient-blue text-white">
          <div className="px-4 pt-4 pb-3 flex items-center gap-3">
            <button onClick={() => navigate('/consumer/home')} className="p-1"><ChevronLeft className="w-6 h-6" /></button>
            <div className="font-bold text-lg">{form.name || me?.phone || 'Profile'}</div>
          </div>
          <div className="seg-tabs grid-cols-3">
            {TABS.map((t) => (
              <button data-testid={`profile-tab-${t.toLowerCase()}`} key={t} className={`seg-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
            ))}
          </div>
        </div>

        <div className="flex-1 pb-32">
          {tab === 'Personal' && (
            <div>
              <Row label="Name" right={
                <div className="flex items-center gap-3">
                  <Input data-testid="prof-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="text-right border-0 shadow-none p-0 h-auto" placeholder="add name" />
                  <button onClick={() => photoRef.current?.click()} className="w-12 h-12 rounded-full bg-blue-50 text-blue-700 text-[10px] font-semibold flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {form.profile_photo ? <img src={form.profile_photo} alt="avatar" className="w-full h-full object-cover" /> : <span>add<br/>photo</span>}
                  </button>
                  <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={onPhoto} />
                </div>
              } />
              <Row label="Contact Number" value={`+91 ${me?.phone || ''}`} readonly />
              <Row label="Email Id" right={<Input data-testid="prof-email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="text-right border-0 shadow-none p-0 h-auto" placeholder="Add email" />} />
              <SelectRow label="Gender" value={form.gender} onChange={(v) => setForm({ ...form, gender: v })} options={GENDERS} placeholder="Add gender" testid="prof-gender" />
              <Row label="Date of Birth" right={<Input data-testid="prof-dob" type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} className="text-right border-0 shadow-none p-0 h-auto" />} />
              <SelectRow label="Blood Group" value={form.blood_group} onChange={(v) => setForm({ ...form, blood_group: v })} options={BLOOD_GROUPS} placeholder="add blood group" testid="prof-blood" />
              <SelectRow label="Marital Status" value={form.marital_status} onChange={(v) => setForm({ ...form, marital_status: v })} options={MARITAL} placeholder="add marital status" testid="prof-marital" />
              <Row label="Height (cm)" right={<Input data-testid="prof-height" type="number" value={form.height_cm} onChange={(e) => setForm({ ...form, height_cm: e.target.value })} className="text-right border-0 shadow-none p-0 h-auto" placeholder="add height" />} />
              <Row label="Weight (kg)" right={<Input data-testid="prof-weight" type="number" value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} className="text-right border-0 shadow-none p-0 h-auto" placeholder="add weight" />} />
              <SelectRow label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} options={CITIES} testid="prof-city" />
              <Row label="Location" right={<Input data-testid="prof-location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="text-right border-0 shadow-none p-0 h-auto" placeholder="add details" />} />
              <Row label="Preferred Hospital" right={<Input data-testid="prof-hospital" value={form.preferred_hospital} onChange={(e) => setForm({ ...form, preferred_hospital: e.target.value })} className="text-right border-0 shadow-none p-0 h-auto" placeholder="add hospital" />} />
              {/* Emergency Contacts */}
              <div className="bg-slate-50 px-4 py-3 mt-2 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Emergency Contacts</span>
                <button data-testid="prof-add-contact" onClick={() => setContacts([...contacts, { name: '', phone: '', relation: '' }])} className="text-blue-700 text-xs font-semibold inline-flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
              </div>
              {contacts.length === 0 && (
                <div className="px-4 py-3 text-sm text-slate-500">No emergency contacts added.</div>
              )}
              {contacts.map((c, i) => (
                <div key={i} className="px-4 py-3 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Contact #{i + 1}</span>
                    <button onClick={() => setContacts(contacts.filter((_, idx) => idx !== i))} className="text-rose-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Input data-testid={`prof-c-name-${i}`} placeholder="Name" value={c.name} onChange={(e) => { const arr = [...contacts]; arr[i] = { ...arr[i], name: e.target.value }; setContacts(arr); }} />
                    <Input data-testid={`prof-c-phone-${i}`} placeholder="Phone" inputMode="numeric" value={c.phone} onChange={(e) => { const arr = [...contacts]; arr[i] = { ...arr[i], phone: e.target.value.replace(/\D/g, '') }; setContacts(arr); }} />
                  </div>
                  <Input data-testid={`prof-c-rel-${i}`} placeholder="Relation" value={c.relation} onChange={(e) => { const arr = [...contacts]; arr[i] = { ...arr[i], relation: e.target.value }; setContacts(arr); }} className="mt-2" />
                </div>
              ))}
              {/* Quick navigation */}
              <div className="px-4 py-2 mt-3 text-xs font-bold uppercase tracking-wider text-slate-500">Quick Links</div>
              <NavRow label="Family Members" onClick={() => navigate('/consumer/family')} testid="prof-link-family" />
              <NavRow label="My Prescriptions" onClick={() => navigate('/consumer/prescriptions')} testid="prof-link-prescriptions" />
              <NavRow label="Lab Tests & Reports" onClick={() => navigate('/consumer/lab-tests')} testid="prof-link-labtests" />
              <NavRow label="Notifications" onClick={() => navigate('/consumer/notifications')} />
              <div className="px-4 py-2 mt-2 text-xs font-bold uppercase tracking-wider text-slate-500">Legal</div>
              <NavRow label="Privacy Policy" onClick={() => navigate('/privacy')} />
              <NavRow label="Terms & Conditions" onClick={() => navigate('/terms')} />
              <NavRow label="Support" onClick={() => navigate('/support')} />
              <NavRow label="Contact Us" onClick={() => navigate('/contact')} />
              <NavRow label="App Permissions" onClick={() => navigate('/permissions')} />
              <NavRow label="Delete Account / Data" onClick={() => navigate('/delete-account')} danger />
              <div className="px-4 py-4">
                <Button data-testid="prof-logout" onClick={() => { logout(); navigate('/'); }} variant="outline" className="w-full"><LogOut className="w-4 h-4 mr-1" /> Logout</Button>
              </div>
            </div>
          )}

          {tab === 'Medical' && (
            <div>
              <CsvRow testid="prof-allergies" label="Allergies" value={form.allergies} onChange={(v) => setForm({ ...form, allergies: v })} placeholder="add allergies" />
              <CsvRow testid="prof-current-meds" label="Current Medications" value={form.current_medications} onChange={(v) => setForm({ ...form, current_medications: v })} placeholder="add medications" />
              <CsvRow testid="prof-past-meds" label="Past Medications" value={form.past_medications} onChange={(v) => setForm({ ...form, past_medications: v })} placeholder="add medications" />
              <CsvRow testid="prof-chronic" label="Chronic Diseases" value={form.chronic_diseases} onChange={(v) => setForm({ ...form, chronic_diseases: v })} placeholder="add disease" />
              <CsvRow testid="prof-medcond" label="Medical Conditions" value={form.medical_conditions} onChange={(v) => setForm({ ...form, medical_conditions: v })} placeholder="add condition" />
              <CsvRow testid="prof-injuries" label="Injuries" value={form.injuries} onChange={(v) => setForm({ ...form, injuries: v })} placeholder="add incident" />
              <CsvRow testid="prof-surgeries" label="Surgeries" value={form.surgeries} onChange={(v) => setForm({ ...form, surgeries: v })} placeholder="add surgeries" />
              <div className="px-4 py-3 text-xs text-slate-500">Separate multiple entries with commas.</div>
            </div>
          )}

          {tab === 'Lifestyle' && (
            <div>
              <SelectRow label="Smoking Habits" value={form.smoking_habits} onChange={(v) => setForm({ ...form, smoking_habits: v })} options={SMOKING_OPTIONS} placeholder="add details" testid="prof-smoking" />
              <SelectRow label="Alcohol Consumption" value={form.alcohol_consumption} onChange={(v) => setForm({ ...form, alcohol_consumption: v })} options={ALCOHOL_OPTIONS} placeholder="add details" testid="prof-alcohol" />
              <SelectRow label="Activity Level" value={form.activity_level} onChange={(v) => setForm({ ...form, activity_level: v })} options={ACTIVITY_OPTIONS} placeholder="add details" testid="prof-activity" />
              <SelectRow label="Food Preference" value={form.food_preference} onChange={(v) => setForm({ ...form, food_preference: v })} options={FOOD_OPTIONS} placeholder="add lifestyle" testid="prof-food" />
              <Row label="Occupation" right={<Input data-testid="prof-occupation" value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} className="text-right border-0 shadow-none p-0 h-auto" placeholder="add occupation" />} />
            </div>
          )}
        </div>

        {/* Sticky Save bar (Practo-style) */}
        <div className="sticky bottom-0 left-0 right-0 z-20 px-4 pb-24 pt-2 bg-gradient-to-t from-white via-white/95 to-transparent">
          <button data-testid="prof-save" onClick={save} disabled={saving} className="w-full bg-sky-500 hover:bg-sky-600 text-white py-3 rounded-xl font-semibold shadow-lg">
            <div className="text-base leading-tight">{saving ? 'Saving...' : 'Complete profile'}</div>
            <div className="text-xs opacity-90 leading-tight">{completion}% completed</div>
          </button>
        </div>
        <BottomNav variant="consumer" />
      </div>
    </div>
  );
}

function Row({ label, value, right, readonly }) {
  return (
    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
      <span className="text-slate-500 text-sm">{label}</span>
      {right ? <div className="flex-1 max-w-[60%]">{right}</div> : <span className={`text-sm ${readonly ? 'text-slate-700 font-medium' : 'text-slate-900'}`}>{value || '—'}</span>}
    </div>
  );
}

function SelectRow({ label, value, onChange, options, placeholder, testid }) {
  return (
    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
      <span className="text-slate-500 text-sm">{label}</span>
      <select data-testid={testid} value={value} onChange={(e) => onChange(e.target.value)} className="text-right bg-transparent text-sm flex-1 max-w-[60%] outline-none">
        <option value="">{placeholder || 'Select'}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function CsvRow({ label, value, onChange, placeholder, testid }) {
  return (
    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
      <span className="text-slate-500 text-sm flex-shrink-0">{label}</span>
      <input data-testid={testid} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="text-right text-sm bg-transparent flex-1 outline-none placeholder:text-slate-400" />
    </div>
  );
}

function NavRow({ label, onClick, danger, testid }) {
  return (
    <button data-testid={testid} onClick={onClick} className="w-full px-4 py-3 border-b border-slate-100 flex items-center justify-between">
      <span className={`text-sm ${danger ? 'text-rose-600' : 'text-slate-800'} font-medium`}>{label}</span>
      <ChevronRight className="w-4 h-4 text-slate-400" />
    </button>
  );
}

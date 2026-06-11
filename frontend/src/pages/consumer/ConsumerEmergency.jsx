import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, HeartPulse } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import MobileShell from '@/components/MobileShell';
import BottomNav from '@/components/BottomNav';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BLOOD_GROUPS } from '@/lib/constants';

export default function ConsumerEmergency() {
  const { me, refresh } = useAuth();
  const [bloodGroup, setBloodGroup] = useState('');
  const [allergies, setAllergies] = useState('');
  const [conditions, setConditions] = useState('');
  const [hospital, setHospital] = useState('');
  const [contacts, setContacts] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (me) {
      setBloodGroup(me.blood_group || '');
      setAllergies((me.allergies || []).join(', '));
      setConditions((me.medical_conditions || []).join(', '));
      setHospital(me.preferred_hospital || '');
      setContacts(me.emergency_contacts || []);
    }
  }, [me]);

  const addContact = () => setContacts([...contacts, { name: '', phone: '', relation: '' }]);
  const updateContact = (i, k, v) => {
    const arr = [...contacts]; arr[i] = { ...arr[i], [k]: v }; setContacts(arr);
  };
  const removeContact = (i) => setContacts(contacts.filter((_, idx) => idx !== i));

  const save = async () => {
    setSaving(true);
    try {
      await api.patch('/users/me', {
        blood_group: bloodGroup,
        allergies: allergies.split(',').map((s) => s.trim()).filter(Boolean),
        medical_conditions: conditions.split(',').map((s) => s.trim()).filter(Boolean),
        preferred_hospital: hospital,
        emergency_contacts: contacts.filter((c) => c.name && c.phone),
      });
      await refresh();
      toast.success('Emergency profile updated');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Could not save');
    } finally { setSaving(false); }
  };

  return (
    <div className="resqly-shell">
      <div className="resqly-frame flex flex-col min-h-screen">
        <MobileShell title="Emergency Profile" header>
          <div className="px-5 py-5 pb-32">
            <div className="resqly-card p-5 bg-rose-50/40 border-rose-100">
              <HeartPulse className="w-6 h-6 text-rose-600" />
              <h2 className="text-lg font-semibold text-slate-900 mt-2">Critical medical info</h2>
              <p className="text-sm text-slate-600 mt-1">Help first responders give you the right care, faster.</p>
            </div>

            <div className="resqly-card p-5 mt-4 space-y-4">
              <Field label="Blood Group">
                <div className="flex flex-wrap gap-2">
                  {BLOOD_GROUPS.map((bg) => (
                    <button data-testid={`em-blood-${bg}`} key={bg} type="button" onClick={() => setBloodGroup(bg)}
                      className={`px-3 py-1.5 rounded-full border text-sm ${bloodGroup === bg ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-slate-700 border-slate-200'}`}>{bg}</button>
                  ))}
                </div>
              </Field>
              <Field label="Allergies (comma separated)">
                <Textarea data-testid="em-allergies" value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="e.g. Penicillin, Peanuts" />
              </Field>
              <Field label="Medical Conditions (comma separated)">
                <Textarea data-testid="em-conditions" value={conditions} onChange={(e) => setConditions(e.target.value)} placeholder="e.g. Hypertension, Diabetes" />
              </Field>
              <Field label="Preferred Hospital">
                <Input data-testid="em-hospital" value={hospital} onChange={(e) => setHospital(e.target.value)} placeholder="Hospital name" />
              </Field>
            </div>

            <div className="resqly-card p-5 mt-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-slate-900">Emergency Contacts</h4>
                <button data-testid="em-add-contact" onClick={addContact} className="text-blue-700 text-sm font-medium inline-flex items-center gap-1"><Plus className="w-4 h-4" /> Add</button>
              </div>
              <div className="mt-3 space-y-3">
                {contacts.length === 0 && <p className="text-xs text-slate-500">No contacts yet. Add at least one.</p>}
                {contacts.map((c, i) => (
                  <div key={i} className="border border-slate-200 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Contact #{i + 1}</span>
                      <button onClick={() => removeContact(i)} className="text-rose-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <Input data-testid={`em-contact-name-${i}`} placeholder="Name" value={c.name} onChange={(e) => updateContact(i, 'name', e.target.value)} />
                    <Input data-testid={`em-contact-phone-${i}`} placeholder="Phone" inputMode="numeric" value={c.phone} onChange={(e) => updateContact(i, 'phone', e.target.value.replace(/\D/g, ''))} />
                    <Input data-testid={`em-contact-relation-${i}`} placeholder="Relation (e.g. Spouse)" value={c.relation} onChange={(e) => updateContact(i, 'relation', e.target.value)} />
                  </div>
                ))}
              </div>
            </div>

            <Button data-testid="em-save" onClick={save} disabled={saving} className="w-full mt-5 bg-blue-700 hover:bg-blue-800">
              {saving ? 'Saving...' : 'Save Emergency Profile'}
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

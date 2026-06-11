import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Users, Trash2, Pencil, X } from 'lucide-react';
import api from '@/lib/api';
import MobileShell from '@/components/MobileShell';
import BottomNav from '@/components/BottomNav';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RELATIONS, BLOOD_GROUPS, GENDERS } from '@/lib/constants';

export default function ConsumerFamily() {
  const [members, setMembers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', relation: 'Spouse', phone: '', dob: '', gender: '', blood_group: '', medical_notes: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await api.get('/users/me/family');
    setMembers(data.members);
  };
  useEffect(() => { load().catch(() => {}); }, []);

  const startAdd = () => {
    setEditing(null);
    setForm({ name: '', relation: 'Spouse', phone: '', dob: '', gender: '', blood_group: '', medical_notes: '' });
    setOpen(true);
  };
  const startEdit = (m) => {
    setEditing(m);
    setForm({
      name: m.name || '', relation: m.relation || 'Spouse',
      phone: m.phone || '', dob: m.dob || '', gender: m.gender || '',
      blood_group: m.blood_group || '', medical_notes: m.medical_notes || '',
    });
    setOpen(true);
  };
  const save = async () => {
    if (!form.name || !form.relation) { toast.error('Name and relation required'); return; }
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/users/me/family/${editing.id}`, form);
        toast.success('Member updated');
      } else {
        await api.post('/users/me/family', form);
        toast.success('Member added');
      }
      setOpen(false);
      await load();
    } catch (e) { toast.error('Could not save'); } finally { setSaving(false); }
  };
  const remove = async (id) => {
    if (!window.confirm('Remove this family member?')) return;
    try { await api.delete(`/users/me/family/${id}`); toast.success('Removed'); await load(); }
    catch (e) { toast.error('Could not remove'); }
  };

  return (
    <div className="resqly-shell">
      <div className="resqly-frame flex flex-col min-h-screen">
        <MobileShell title="Family" header action={<button data-testid="family-add-btn" onClick={startAdd} className="text-blue-700 text-sm font-semibold inline-flex items-center gap-1"><Plus className="w-4 h-4" /> Add</button>}>
          <div className="px-5 py-5 pb-32">
            <div className="resqly-card p-5 bg-blue-50/50 border-blue-100 flex gap-3 items-start">
              <Users className="w-5 h-5 text-blue-700" />
              <div>
                <div className="font-semibold text-slate-900">Manage family members</div>
                <div className="text-xs text-slate-600 mt-0.5">Track health info for your loved ones — spouse, children, parents and dependents.</div>
              </div>
            </div>

            {members.length === 0 ? (
              <div className="resqly-card p-8 text-center mt-4">
                <Users className="w-8 h-8 text-slate-300 mx-auto" />
                <h3 className="font-semibold text-slate-700 mt-2">No family members yet</h3>
                <p className="text-sm text-slate-500 mt-1 mb-3">Add your first family member to get started.</p>
                <Button data-testid="family-empty-add" onClick={startAdd} className="bg-blue-700 hover:bg-blue-800"><Plus className="w-4 h-4 mr-1" /> Add Member</Button>
              </div>
            ) : (
              <div className="space-y-3 mt-4">
                {members.map((m) => (
                  <div key={m.id} className="resqly-card p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center">{m.name.charAt(0).toUpperCase()}</div>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900">{m.name}</div>
                        <div className="text-xs text-slate-500">{m.relation} {m.gender ? `• ${m.gender}` : ''} {m.blood_group ? `• ${m.blood_group}` : ''}</div>
                      </div>
                      <button data-testid={`family-edit-${m.id}`} onClick={() => startEdit(m)} className="p-2 text-slate-600"><Pencil className="w-4 h-4" /></button>
                      <button data-testid={`family-remove-${m.id}`} onClick={() => remove(m.id)} className="p-2 text-rose-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    {m.medical_notes && (
                      <div className="text-xs text-slate-600 mt-2 bg-slate-50 rounded p-2">{m.medical_notes}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </MobileShell>

        {/* Add/Edit Sheet */}
        {open && (
          <div className="fixed inset-0 z-40 bg-black/40 flex items-end justify-center" onClick={() => setOpen(false)}>
            <div className="bg-white rounded-t-3xl w-full max-w-[480px] p-5 max-h-[88vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-900">{editing ? 'Edit Member' : 'Add Family Member'}</h3>
                <button onClick={() => setOpen(false)} className="text-slate-500"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <Field label="Name *"><Input data-testid="family-form-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
                <Field label="Relation *">
                  <select data-testid="family-form-relation" value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white">
                    {RELATIONS.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </Field>
                <Field label="Phone"><Input data-testid="family-form-phone" inputMode="numeric" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })} /></Field>
                <Field label="Date of Birth"><Input type="date" data-testid="family-form-dob" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Gender">
                    <select data-testid="family-form-gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white">
                      <option value="">Select</option>
                      {GENDERS.map((g) => <option key={g}>{g}</option>)}
                    </select>
                  </Field>
                  <Field label="Blood Group">
                    <select data-testid="family-form-blood" value={form.blood_group} onChange={(e) => setForm({ ...form, blood_group: e.target.value })} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white">
                      <option value="">Select</option>
                      {BLOOD_GROUPS.map((b) => <option key={b}>{b}</option>)}
                    </select>
                  </Field>
                </div>
                <Field label="Medical Notes"><Textarea data-testid="family-form-notes" rows={3} value={form.medical_notes} onChange={(e) => setForm({ ...form, medical_notes: e.target.value })} placeholder="Allergies, conditions, medications, etc." /></Field>
              </div>
              <Button data-testid="family-form-save" onClick={save} disabled={saving} className="w-full mt-4 bg-blue-700 hover:bg-blue-800">{saving ? 'Saving...' : (editing ? 'Update Member' : 'Add Member')}</Button>
            </div>
          </div>
        )}
        <BottomNav variant="consumer" />
      </div>
    </div>
  );
}

function Field({ label, children }) { return <div><label className="text-xs font-medium text-slate-500">{label}</label><div className="mt-1">{children}</div></div>; }

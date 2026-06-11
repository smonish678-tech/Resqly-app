import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { Plus, FileText, Trash2, Upload, X, Image as ImageIcon } from 'lucide-react';
import api from '@/lib/api';
import { uploadFile } from '@/lib/uploads';
import MobileShell from '@/components/MobileShell';
import BottomNav from '@/components/BottomNav';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function ConsumerPrescriptions() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ doctor_name: '', title: '', date: '', notes: '', image_url: '' });
  const [saving, setSaving] = useState(false);
  const [viewing, setViewing] = useState(null);
  const fileRef = useRef(null);

  const load = async () => {
    const { data } = await api.get('/users/me/prescriptions');
    setItems(data.prescriptions);
  };
  useEffect(() => { load().catch(() => {}); }, []);

  const onFile = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 6 * 1024 * 1024) { toast.error('Max 6MB'); return; }
    try {
      const url = await uploadFile('prescriptions', file);
      setForm((f) => ({ ...f, image_url: url }));
      toast.success('File uploaded');
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    }
  };

  const save = async () => {
    if (!form.doctor_name) { toast.error('Doctor name is required'); return; }
    setSaving(true);
    try {
      await api.post('/users/me/prescriptions', form);
      toast.success('Prescription uploaded');
      setOpen(false);
      setForm({ doctor_name: '', title: '', date: '', notes: '', image_url: '' });
      await load();
    } catch (e) { toast.error('Could not save'); } finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this prescription?')) return;
    try { await api.delete(`/users/me/prescriptions/${id}`); toast.success('Deleted'); await load(); }
    catch (e) { toast.error('Could not delete'); }
  };

  return (
    <div className="resqly-shell">
      <div className="resqly-frame flex flex-col min-h-screen">
        <MobileShell title="Prescriptions" header action={<button data-testid="presc-add-btn" onClick={() => setOpen(true)} className="text-blue-700 text-sm font-semibold inline-flex items-center gap-1"><Plus className="w-4 h-4" /> Upload</button>}>
          <div className="px-5 py-5 pb-32">
            <div className="resqly-card p-5 bg-blue-50/50 border-blue-100 flex gap-3 items-start">
              <FileText className="w-5 h-5 text-blue-700" />
              <div>
                <div className="font-semibold text-slate-900">Prescription history</div>
                <div className="text-xs text-slate-600 mt-0.5">Keep your prescriptions organized and accessible anytime.</div>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="resqly-card p-8 text-center mt-4">
                <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                <h3 className="font-semibold text-slate-700 mt-2">No prescriptions yet</h3>
                <p className="text-sm text-slate-500 mt-1 mb-3">Upload your first prescription.</p>
                <Button data-testid="presc-empty-add" onClick={() => setOpen(true)} className="bg-blue-700 hover:bg-blue-800"><Upload className="w-4 h-4 mr-1" /> Upload Prescription</Button>
              </div>
            ) : (
              <div className="space-y-3 mt-4">
                {items.map((p) => (
                  <div key={p.id} className="resqly-card p-4">
                    <div className="flex items-start gap-3">
                      <button onClick={() => p.image_url && setViewing(p.image_url)} className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {p.image_url ? (
                          <img src={p.image_url} alt="prescription" className="w-full h-full object-cover" />
                        ) : (
                          <FileText className="w-6 h-6 text-slate-400" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900">{p.title || p.doctor_name}</div>
                        <div className="text-xs text-slate-500">Dr. {p.doctor_name}{p.date ? ` • ${p.date}` : ''}</div>
                        {p.notes && <div className="text-xs text-slate-600 mt-1">{p.notes}</div>}
                      </div>
                      <button data-testid={`presc-remove-${p.id}`} onClick={() => remove(p.id)} className="p-2 text-rose-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </MobileShell>

        {open && (
          <div className="fixed inset-0 z-40 bg-black/40 flex items-end justify-center" onClick={() => setOpen(false)}>
            <div className="bg-white rounded-t-3xl w-full max-w-[480px] p-5 max-h-[88vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-900">Upload Prescription</h3>
                <button onClick={() => setOpen(false)} className="text-slate-500"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <Field label="Doctor Name *"><Input data-testid="presc-form-doctor" value={form.doctor_name} onChange={(e) => setForm({ ...form, doctor_name: e.target.value })} placeholder="e.g. Dr. Sharma" /></Field>
                <Field label="Title (optional)"><Input data-testid="presc-form-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Cold & Cough" /></Field>
                <Field label="Date"><Input data-testid="presc-form-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
                <Field label="Notes"><Textarea data-testid="presc-form-notes" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
                <Field label="Prescription Image">
                  <button data-testid="presc-form-upload" onClick={() => fileRef.current?.click()} className="w-full border-2 border-dashed border-slate-300 rounded-lg p-4 flex flex-col items-center text-slate-500 hover:bg-slate-50">
                    {form.image_url ? (
                      <img src={form.image_url} alt="preview" className="max-h-40 rounded" />
                    ) : (<><ImageIcon className="w-6 h-6 mb-1" /><span className="text-xs">Tap to select image</span></>)}
                    <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={onFile} className="hidden" />
                  </button>
                </Field>
              </div>
              <Button data-testid="presc-form-save" onClick={save} disabled={saving} className="w-full mt-4 bg-blue-700 hover:bg-blue-800">{saving ? 'Saving...' : 'Save Prescription'}</Button>
            </div>
          </div>
        )}

        {viewing && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setViewing(null)}>
            <img src={viewing} alt="prescription" className="max-h-[90vh] max-w-full rounded-lg" />
          </div>
        )}
        <BottomNav variant="consumer" />
      </div>
    </div>
  );
}
function Field({ label, children }) { return <div><label className="text-xs font-medium text-slate-500">{label}</label><div className="mt-1">{children}</div></div>; }

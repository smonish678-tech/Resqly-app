import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { LogOut, Camera, FileText, Trash2, MapPin } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import MobileShell from '@/components/MobileShell';
import BottomNav from '@/components/BottomNav';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { CITIES, LANGUAGE_OPTIONS } from '@/lib/constants';

export default function ProviderProfile() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [p, setP] = useState(null);
  const [specOptions, setSpecOptions] = useState([]);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await api.get('/providers/me');
    setP(data.provider);
    setSpecOptions(data.provider?.specialization_options || []);
    setForm({
      name: data.provider?.name || '',
      email: data.provider?.email || '',
      city: data.provider?.city || 'Bangalore',
      service_area: data.provider?.service_area || '',
      description: data.provider?.description || '',
      profile_photo: data.provider?.profile_photo || '',
      languages: data.provider?.languages || [],
      specialization: data.provider?.specialization || [],
      bank_account_holder: data.provider?.bank_account_holder || '',
      bank_account_number: data.provider?.bank_account_number || '',
      bank_ifsc: data.provider?.bank_ifsc || '',
      bank_name: data.provider?.bank_name || '',
    });
  };
  useEffect(() => { load().catch(() => {}); }, []);

  const toggleArr = (key, val) => {
    const cur = form[key] || [];
    setForm({ ...form, [key]: cur.includes(val) ? cur.filter((v) => v !== val) : [...cur, val] });
  };

  const onPhoto = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Max 2MB'); return; }
    const r = new FileReader();
    r.onload = () => setForm({ ...form, profile_photo: r.result });
    r.readAsDataURL(file);
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.patch('/providers/me', form);
      toast.success('Profile updated');
      await load();
    } catch (e) { toast.error('Save failed'); } finally { setSaving(false); }
  };

  if (!p) return <div className="resqly-shell"><div className="resqly-frame flex items-center justify-center min-h-screen text-slate-500">Loading...</div></div>;

  return (
    <div className="resqly-shell">
      <div className="resqly-frame flex flex-col min-h-screen">
        <MobileShell title="My Profile" header>
          <div className="px-5 py-5">
            <div className="resqly-card p-5 flex items-center gap-4">
              <div className="relative">
                {form.profile_photo ? (
                  <img src={form.profile_photo} alt="profile" className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xl">
                    {(form.name || 'R').charAt(0).toUpperCase()}
                  </div>
                )}
                <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-700 rounded-full flex items-center justify-center cursor-pointer">
                  <Camera className="w-3 h-3 text-white" />
                  <input data-testid="prov-photo-input" type="file" accept="image/*" onChange={onPhoto} className="hidden" />
                </label>
              </div>
              <div>
                <div className="font-semibold text-slate-900">{form.name || 'Your name'}</div>
                <div className="text-xs text-slate-500 capitalize">{p.category?.replace('_', ' ')}</div>
                <div className="text-xs text-slate-500 mt-0.5 capitalize">Status: <b className={
                  p.approval_status === 'approved' ? 'text-emerald-600' :
                  p.approval_status === 'pending' ? 'text-amber-600' : 'text-rose-600'
                }>{p.approval_status}</b></div>
              </div>
            </div>

            <div className="resqly-card p-5 mt-4 space-y-3">
              <h3 className="font-semibold text-slate-900">Basic Info</h3>
              <Field label="Name"><Input data-testid="prov-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
              <Field label="Email"><Input data-testid="prov-email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
              <Field label="City">
                <select data-testid="prov-city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white">
                  {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Service Area"><Input data-testid="prov-service-area" value={form.service_area} onChange={(e) => setForm({ ...form, service_area: e.target.value })} placeholder="Areas you serve" /></Field>
              <Field label="Description / About You"><Textarea data-testid="prov-description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></Field>
            </div>

            <div className="resqly-card p-5 mt-4">
              <h3 className="font-semibold text-slate-900">Languages</h3>
              <div className="flex flex-wrap gap-2 mt-3">
                {LANGUAGE_OPTIONS.map((lng) => (
                  <button data-testid={`prov-lang-${lng}`} key={lng} type="button" onClick={() => toggleArr('languages', lng)}
                    className={`px-3 py-1.5 rounded-full border text-sm ${form.languages?.includes(lng) ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-slate-700 border-slate-200'}`}>{lng}</button>
                ))}
              </div>
            </div>

            {specOptions.length > 0 && (
              <div className="resqly-card p-5 mt-4">
                <h3 className="font-semibold text-slate-900">Specializations</h3>
                <div className="flex flex-wrap gap-2 mt-3">
                  {specOptions.map((sp) => (
                    <button data-testid={`prov-spec-${sp.replace(/\s+/g, '-')}`} key={sp} type="button" onClick={() => toggleArr('specialization', sp)}
                      className={`px-3 py-1.5 rounded-full border text-sm ${form.specialization?.includes(sp) ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-slate-700 border-slate-200'}`}>{sp}</button>
                  ))}
                </div>
              </div>
            )}

            <div className="resqly-card p-5 mt-4 space-y-3">
              <h3 className="font-semibold text-slate-900">Bank Details</h3>
              <Field label="Account Holder"><Input data-testid="prov-bank-holder" value={form.bank_account_holder} onChange={(e) => setForm({ ...form, bank_account_holder: e.target.value })} /></Field>
              <Field label="Bank Name"><Input data-testid="prov-bank-name" value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} /></Field>
              <Field label="Account Number"><Input data-testid="prov-bank-account" value={form.bank_account_number} onChange={(e) => setForm({ ...form, bank_account_number: e.target.value })} /></Field>
              <Field label="IFSC"><Input data-testid="prov-bank-ifsc" value={form.bank_ifsc} onChange={(e) => setForm({ ...form, bank_ifsc: e.target.value })} /></Field>
            </div>

            <Button data-testid="prov-save" onClick={save} disabled={saving} className="w-full mt-5 bg-blue-700 hover:bg-blue-800">{saving ? 'Saving...' : 'Save Changes'}</Button>

            <div className="resqly-card p-3 mt-4 divide-y">
              <Link to="/provider/documents" className="flex items-center gap-3 px-3 py-3 hover:bg-slate-50"><FileText className="w-4 h-4 text-slate-500" /><span className="text-sm font-medium">My Documents</span><span className="ml-auto text-slate-400">›</span></Link>
              <Link to="/privacy" className="flex items-center gap-3 px-3 py-3 hover:bg-slate-50"><FileText className="w-4 h-4 text-slate-500" /><span className="text-sm">Privacy Policy</span><span className="ml-auto text-slate-400">›</span></Link>
              <Link to="/terms" className="flex items-center gap-3 px-3 py-3 hover:bg-slate-50"><FileText className="w-4 h-4 text-slate-500" /><span className="text-sm">Terms & Conditions</span><span className="ml-auto text-slate-400">›</span></Link>
              <Link to="/permissions" className="flex items-center gap-3 px-3 py-3 hover:bg-slate-50"><MapPin className="w-4 h-4 text-slate-500" /><span className="text-sm">App Permissions</span><span className="ml-auto text-slate-400">›</span></Link>
              <Link to="/delete-account" className="flex items-center gap-3 px-3 py-3 hover:bg-slate-50"><Trash2 className="w-4 h-4 text-rose-600" /><span className="text-sm">Delete Account</span><span className="ml-auto text-slate-400">›</span></Link>
            </div>

            <Button data-testid="prov-logout" variant="outline" onClick={() => { logout(); navigate('/'); }} className="w-full mt-4">
              <LogOut className="w-4 h-4 mr-1" /> Logout
            </Button>
          </div>
        </MobileShell>
        <BottomNav variant="provider" />
      </div>
    </div>
  );
}

function Field({ label, children }) { return <div><label className="text-xs font-medium text-slate-500">{label}</label><div className="mt-1">{children}</div></div>; }

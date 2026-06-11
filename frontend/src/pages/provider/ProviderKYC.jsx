import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Upload, CheckCircle2, AlertCircle, FileText, X } from 'lucide-react';
import api from '@/lib/api';
import { uploadFile } from '@/lib/uploads';
import { useAuth } from '@/lib/auth';
import MobileShell from '@/components/MobileShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CITIES } from '@/lib/constants';

export default function ProviderKYC() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [provider, setProvider] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [docs, setDocs] = useState([]);
  const [name, setName] = useState('');
  const [city, setCity] = useState('Bangalore');
  const [serviceArea, setServiceArea] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    const { data } = await api.get('/providers/me');
    setProvider(data.provider);
    setRequirements(data.provider?.kyc_required || []);
    setName(data.provider?.name || '');
    setCity(data.provider?.city || 'Bangalore');
    setServiceArea(data.provider?.service_area || '');
    const docsRes = await api.get('/providers/me/documents');
    setDocs(docsRes.data.documents || []);
  };

  useEffect(() => { fetchAll().catch(() => {}); }, []);

  const saveBasic = async () => {
    setSaving(true);
    try {
      await api.patch('/providers/me', { name, city, service_area: serviceArea });
      toast.success('Saved');
      await refresh();
      await fetchAll();
    } catch (e) { toast.error('Save failed'); } finally { setSaving(false); }
  };

  const handleFile = async (docType, file) => {
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) { toast.error('File too large (max 6MB)'); return; }
    try {
      const url = await uploadFile('provider-documents', file);
      await api.post('/providers/me/documents', {
        document_type: docType,
        document_url: url,
        file_name: file.name,
      });
      toast.success(`${docType} uploaded`);
      await fetchAll();
    } catch (e) {
      toast.error(e.message || 'Upload failed');
    }
  };

  const removeDoc = async (id) => {
    try { await api.delete(`/providers/me/documents/${id}`); toast.success('Removed'); await fetchAll(); }
    catch (e) { toast.error('Could not remove'); }
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      await api.post('/providers/me/submit');
      toast.success('Submitted for review');
      await refresh();
      navigate('/provider/status', { replace: true });
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Submission failed');
    } finally { setSubmitting(false); }
  };

  const docByType = (t) => docs.find((d) => d.document_type === t);

  return (
    <MobileShell title="KYC & Documents" hideBack>
      <div className="px-5 py-5">
        <div className="resqly-card p-4 mb-4 bg-amber-50/50 border-amber-100">
          <p className="text-xs text-amber-800">Approval Status: <b className="capitalize">{provider?.approval_status || 'incomplete'}</b></p>
          {provider?.rejection_reason && (
            <p className="text-xs text-rose-700 mt-1">Reason: {provider.rejection_reason}</p>
          )}
        </div>

        <div className="resqly-card p-5 mb-4 space-y-3">
          <h3 className="font-semibold text-slate-900">Basic Information</h3>
          <Field label="Full Name / Business Name"><Input data-testid="kyc-name" value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="City">
            <select data-testid="kyc-city" value={city} onChange={(e) => setCity(e.target.value)} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white">
              {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Service Area (e.g. HSR Layout, Whitefield)"><Input data-testid="kyc-service-area" value={serviceArea} onChange={(e) => setServiceArea(e.target.value)} /></Field>
          <Button data-testid="kyc-save-basic" onClick={saveBasic} disabled={saving} variant="outline" className="w-full">{saving ? 'Saving...' : 'Save Basic Info'}</Button>
        </div>

        <div className="resqly-card p-5">
          <h3 className="font-semibold text-slate-900">Required Documents</h3>
          <p className="text-xs text-slate-500 mt-1">Category: <b className="capitalize">{(provider?.category || '').replace('_', ' ')}</b></p>
          <div className="mt-4 space-y-3">
            {requirements.map((req) => {
              const doc = docByType(req);
              return (
                <div key={req} className="border border-slate-200 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      {doc ? <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" /> : <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />}
                      <div>
                        <div className="font-medium text-sm text-slate-900">{req}</div>
                        {doc && (
                          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1"><FileText className="w-3 h-3" /> {doc.file_name || 'Uploaded'}
                            <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${doc.verification_status === 'approved' ? 'bg-emerald-100 text-emerald-700' : doc.verification_status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{doc.verification_status}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {doc && (
                      <button onClick={() => removeDoc(doc.id)} className="text-rose-500"><X className="w-4 h-4" /></button>
                    )}
                  </div>
                  <div className="mt-2">
                    <label className="inline-flex items-center gap-2 text-sm text-blue-700 cursor-pointer font-medium">
                      <Upload className="w-4 h-4" /> {doc ? 'Replace' : 'Upload'}
                      <input data-testid={`kyc-upload-${req.replace(/\s+/g, '-').toLowerCase()}`} type="file" accept="image/*,application/pdf" onChange={(e) => handleFile(req, e.target.files?.[0])} className="hidden" />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Button data-testid="kyc-submit" onClick={submit} disabled={submitting} className="w-full mt-5 bg-blue-700 hover:bg-blue-800">
          {submitting ? 'Submitting...' : 'Submit for Review'}
        </Button>
      </div>
    </MobileShell>
  );
}

function Field({ label, children }) { return <div><label className="text-xs font-medium text-slate-500">{label}</label><div className="mt-1">{children}</div></div>; }

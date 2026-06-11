import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '@/lib/api';
import MobileShell from '@/components/MobileShell';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileText, ExternalLink, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

export default function AdminProviderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [provider, setProvider] = useState(null);
  const [docs, setDocs] = useState([]);
  const [reason, setReason] = useState('');

  const load = async () => {
    const { data } = await api.get(`/admin/providers/${id}`);
    setProvider(data.provider); setDocs(data.documents);
  };
  useEffect(() => { load().catch(() => {}); }, [id]);

  const decide = async (status) => {
    try {
      await api.post(`/admin/providers/${id}/decision`, { status, reason });
      toast.success(`Marked as ${status}`);
      navigate('/admin/dashboard');
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
  };

  if (!provider) return <MobileShell title="Loading..."><div className="p-5 text-sm text-slate-500">Loading...</div></MobileShell>;

  return (
    <MobileShell title="Provider Review">
      <div className="px-5 py-5">
        <div className="resqly-card p-5">
          <div className="flex justify-between">
            <div>
              <div className="font-bold text-lg text-slate-900">{provider.name}</div>
              <div className="text-xs text-slate-500 capitalize">{provider.category?.replace('_', ' ')}</div>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 capitalize self-start">{provider.approval_status}</span>
          </div>
          <div className="mt-3 text-sm space-y-1.5">
            <Row label="Phone" value={provider.phone} />
            <Row label="Email" value={provider.email} />
            <Row label="City" value={provider.city} />
            <Row label="Service Area" value={provider.service_area} />
            <Row label="Description" value={provider.description} />
            <Row label="Languages" value={(provider.languages || []).join(', ')} />
            <Row label="Specializations" value={(provider.specialization || []).join(', ')} />
            <Row label="Profile Complete" value={`${provider.profile_completion}%`} />
          </div>
        </div>

        <div className="resqly-card p-5 mt-4">
          <h3 className="font-semibold text-slate-900">Submitted Documents ({docs.length})</h3>
          <div className="mt-3 space-y-2">
            {docs.length === 0 && <p className="text-sm text-slate-500">No documents uploaded yet.</p>}
            {docs.map((d) => (
              <div key={d.id} className="border border-slate-200 rounded-lg p-3 flex items-center gap-3">
                <FileText className="w-5 h-5 text-slate-500" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{d.document_type}</div>
                  <div className="text-xs text-slate-500">{d.file_name || 'Uploaded'}</div>
                </div>
                {d.document_url && (
                  <a data-testid={`admin-view-${d.id}`} href={d.document_url} target="_blank" rel="noreferrer" className="text-blue-700 text-xs inline-flex items-center gap-1"><ExternalLink className="w-3 h-3" /> View</a>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="resqly-card p-5 mt-4">
          <h3 className="font-semibold text-slate-900">Decision</h3>
          <Textarea data-testid="admin-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional reason / notes" className="mt-2" />
          <div className="grid grid-cols-3 gap-2 mt-3">
            <Button data-testid="admin-approve" onClick={() => decide('approved')} className="bg-emerald-600 hover:bg-emerald-700"><CheckCircle2 className="w-4 h-4 mr-1" /> Approve</Button>
            <Button data-testid="admin-resubmit" onClick={() => decide('resubmit')} variant="outline"><RefreshCw className="w-4 h-4 mr-1" /> Resubmit</Button>
            <Button data-testid="admin-reject" onClick={() => decide('rejected')} className="bg-rose-600 hover:bg-rose-700"><XCircle className="w-4 h-4 mr-1" /> Reject</Button>
          </div>
        </div>
      </div>
    </MobileShell>
  );
}
function Row({ label, value }) {
  return <div className="flex gap-2 text-sm"><span className="text-slate-500 w-32 flex-shrink-0">{label}</span><span className="text-slate-900 break-words">{value || '—'}</span></div>;
}

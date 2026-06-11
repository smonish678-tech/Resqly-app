import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import MobileShell from '@/components/MobileShell';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle2, Clock, XCircle } from 'lucide-react';

export default function ProviderDocuments() {
  const navigate = useNavigate();
  const [docs, setDocs] = useState([]);
  useEffect(() => {
    api.get('/providers/me/documents').then(({ data }) => setDocs(data.documents)).catch(() => {});
  }, []);

  const statusIcon = (s) => {
    if (s === 'approved') return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    if (s === 'rejected') return <XCircle className="w-4 h-4 text-rose-600" />;
    return <Clock className="w-4 h-4 text-amber-600" />;
  };

  return (
    <MobileShell title="My Documents">
      <div className="px-5 py-5">
        {docs.length === 0 ? (
          <div className="resqly-card p-8 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-semibold text-slate-700 mt-2">No documents uploaded</h3>
            <p className="text-sm text-slate-500 mt-1 mb-3">Complete your KYC to access the dashboard.</p>
            <Button onClick={() => navigate('/provider/kyc')} className="bg-blue-700 hover:bg-blue-800">Upload Documents</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {docs.map((d) => (
              <div key={d.id} className="resqly-card p-4 flex items-center gap-3">
                <FileText className="w-5 h-5 text-slate-500" />
                <div className="flex-1">
                  <div className="font-medium text-sm text-slate-900">{d.document_type}</div>
                  <div className="text-xs text-slate-500">{d.file_name || 'Uploaded'}</div>
                </div>
                <div className="flex items-center gap-1 text-xs font-medium capitalize">{statusIcon(d.verification_status)} {d.verification_status}</div>
              </div>
            ))}
            <Button variant="outline" onClick={() => navigate('/provider/kyc')} className="w-full">Manage / Update Documents</Button>
          </div>
        )}
      </div>
    </MobileShell>
  );
}

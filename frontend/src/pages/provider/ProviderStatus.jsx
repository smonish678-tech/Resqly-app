import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock, XCircle, RefreshCw, LogOut } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import MobileShell from '@/components/MobileShell';
import { Button } from '@/components/ui/button';

export default function ProviderStatus() {
  const navigate = useNavigate();
  const { logout, refresh } = useAuth();
  const [provider, setProvider] = useState(null);

  const load = async () => {
    const { data } = await api.get('/providers/me');
    setProvider(data.provider);
    if (data.provider?.approval_status === 'approved') navigate('/provider/dashboard', { replace: true });
  };

  useEffect(() => { load().catch(() => {}); }, []);

  const status = provider?.approval_status || 'pending';
  const config = {
    pending: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', title: 'Application Under Review', desc: 'Our team is reviewing your documents. This usually takes 24-48 hours.' },
    approved: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', title: 'Approved', desc: 'Your account is verified. Welcome to Resqly!' },
    rejected: { icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50', title: 'Application Rejected', desc: provider?.rejection_reason || 'Please review the feedback and resubmit.' },
    resubmit: { icon: RefreshCw, color: 'text-blue-600', bg: 'bg-blue-50', title: 'Resubmission Required', desc: provider?.rejection_reason || 'Please update your documents.' },
    incomplete: { icon: RefreshCw, color: 'text-slate-600', bg: 'bg-slate-50', title: 'Incomplete', desc: 'Please complete your KYC.' },
  }[status] || {};
  const Icon = config.icon || Clock;

  return (
    <MobileShell title="Application Status" hideBack>
      <div className="px-5 py-5">
        <div className={`resqly-card p-6 text-center ${config.bg}`}>
          <Icon className={`w-12 h-12 ${config.color} mx-auto`} />
          <h2 className="text-xl font-bold text-slate-900 mt-3">{config.title}</h2>
          <p className="text-sm text-slate-600 mt-2">{config.desc}</p>
        </div>

        <div className="resqly-card p-5 mt-4">
          <h3 className="font-semibold text-slate-900">Your details</h3>
          <div className="mt-3 text-sm space-y-2">
            <Row label="Name" value={provider?.name} />
            <Row label="Category" value={provider?.category?.replace('_', ' ')} />
            <Row label="Phone" value={provider?.phone} />
            <Row label="City" value={provider?.city} />
            <Row label="Service Area" value={provider?.service_area} />
          </div>
        </div>

        <div className="mt-5 space-y-2">
          {(status === 'rejected' || status === 'resubmit' || status === 'incomplete') && (
            <Button data-testid="status-update-docs" onClick={() => navigate('/provider/kyc')} className="w-full bg-blue-700 hover:bg-blue-800">Update Documents</Button>
          )}
          <Button data-testid="status-refresh" variant="outline" onClick={load} className="w-full"><RefreshCw className="w-4 h-4 mr-1" /> Refresh Status</Button>
          <Button variant="ghost" onClick={() => { logout(); navigate('/'); }} className="w-full text-slate-600"><LogOut className="w-4 h-4 mr-1" /> Logout</Button>
        </div>
      </div>
    </MobileShell>
  );
}

function Row({ label, value }) {
  return <div className="flex justify-between"><span className="text-slate-500">{label}</span><span className="text-slate-900 font-medium capitalize">{value || '—'}</span></div>;
}

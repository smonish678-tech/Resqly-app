import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import MobileShell from '@/components/MobileShell';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ShieldX } from 'lucide-react';

export default function DeleteAccount() {
  const navigate = useNavigate();
  const { token, me, logout } = useAuth();
  const [reason, setReason] = useState('');
  const [email, setEmail] = useState(me?.email || '');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!token) {
      // Public path: open mailto
      window.location.href = `mailto:privacy@resqly.in?subject=Account%20Deletion%20Request&body=${encodeURIComponent('Reason: ' + reason + '\nContact email: ' + email)}`;
      setSubmitted(true);
      return;
    }
    setLoading(true);
    try {
      await api.post('/delete-account/request', { reason, contact_email: email });
      setSubmitted(true);
      toast.success('Deletion request submitted');
    } catch (e) { toast.error('Could not submit'); } finally { setLoading(false); }
  };

  return (
    <MobileShell title="Delete Account / Data">
      <div className="px-5 py-5">
        <div className="resqly-card p-5 bg-rose-50/40 border-rose-100">
          <AlertTriangle className="w-6 h-6 text-rose-600" />
          <h2 className="text-lg font-semibold text-slate-900 mt-2">Request account & data deletion</h2>
          <p className="text-sm text-slate-600 mt-1">Per our Privacy Policy, you can request deletion of your account, emergency profile, and any KYC documents. We process requests within 7 business days.</p>
        </div>

        {submitted ? (
          <div className="resqly-card p-6 mt-4 text-center">
            <ShieldX className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="font-semibold text-slate-900 mt-2">Request received</h3>
            <p className="text-sm text-slate-500 mt-1">We've recorded your request. You'll receive a confirmation at {email || 'your contact email'}.</p>
            {token && <Button onClick={() => { logout(); navigate('/'); }} variant="outline" className="mt-3">Logout</Button>}
          </div>
        ) : (
          <div className="resqly-card p-5 mt-4 space-y-3">
            <Field label="Contact email">
              <Input data-testid="del-email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Where to confirm" />
            </Field>
            <Field label="Reason (optional)">
              <Textarea data-testid="del-reason" rows={4} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Help us improve" />
            </Field>
            <Button data-testid="del-submit" onClick={submit} disabled={loading} className="w-full bg-rose-600 hover:bg-rose-700">
              {loading ? 'Submitting...' : 'Submit Deletion Request'}
            </Button>
            <p className="text-xs text-slate-500">By submitting, you understand your data including emergency profile and KYC documents will be permanently removed.</p>
          </div>
        )}
      </div>
    </MobileShell>
  );
}
function Field({ label, children }) { return <div><label className="text-xs font-medium text-slate-500">{label}</label><div className="mt-1">{children}</div></div>; }

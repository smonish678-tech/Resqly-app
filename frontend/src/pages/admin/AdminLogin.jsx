import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Lock, Shield } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Logo from '@/components/Logo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [pwd, setPwd] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/admin/login', { password: pwd });
      login(data.token, 'admin');
      toast.success('Welcome admin');
      navigate('/admin/dashboard', { replace: true });
    } catch (e) { toast.error(e.response?.data?.detail || 'Invalid password'); }
    finally { setLoading(false); }
  };

  return (
    <div className="resqly-shell">
      <div className="resqly-frame flex flex-col">
        <div className="px-6 pt-10 pb-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold mt-4">Admin Console</h1>
          <p className="text-sm text-slate-500 mt-1">Restricted access</p>
        </div>
        <div className="px-6">
          <div className="resqly-card p-5">
            <label className="text-xs font-medium text-slate-500">Admin Password</label>
            <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2.5 mt-1">
              <Lock className="w-4 h-4 text-slate-400" />
              <input data-testid="admin-password" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} className="flex-1 outline-none" placeholder="••••••••" />
            </div>
            <Button data-testid="admin-login-btn" onClick={submit} disabled={loading} className="w-full mt-4 bg-slate-900 hover:bg-slate-800">{loading ? 'Verifying...' : 'Login'}</Button>
          </div>
          <p className="text-center text-xs text-slate-400 mt-4">
            <Link to="/">← Back to home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

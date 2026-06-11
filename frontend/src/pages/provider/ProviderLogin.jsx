import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Phone, Mail, Lock, ArrowRight, MessageSquare } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function ProviderLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // OTP state
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [mockOtp, setMockOtp] = useState('');

  // Email state
  const [emailMode, setEmailMode] = useState('login'); // login | register | forgot | reset
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPwd, setNewPwd] = useState('');

  const [loading, setLoading] = useState(false);

  const afterAuth = (data) => {
    login(data.token, 'provider');
    const p = data.provider;
    if (!p?.category) navigate('/provider/category', { replace: true });
    else if (['incomplete', 'rejected', 'resubmit'].includes(p.approval_status)) navigate('/provider/kyc', { replace: true });
    else if (p.approval_status === 'pending') navigate('/provider/status', { replace: true });
    else navigate('/provider/dashboard', { replace: true });
  };

  const requestOtp = async () => {
    if (!/^\d{10}$/.test(phone)) { toast.error('Enter valid 10-digit phone'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/otp/request', { phone, role: 'provider' });
      setMockOtp(data.mock_otp || ''); setStep('otp'); toast.success('OTP sent');
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed'); } finally { setLoading(false); }
  };
  const verifyOtp = async () => {
    if (otp.length !== 6) { toast.error('Enter 6-digit OTP'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/otp/verify', { phone, otp, role: 'provider' });
      toast.success('Welcome'); afterAuth(data);
    } catch (e) { toast.error(e.response?.data?.detail || 'Invalid OTP'); } finally { setLoading(false); }
  };

  const doLogin = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/provider/login', { email, password });
      toast.success('Welcome back'); afterAuth(data);
    } catch (e) { toast.error(e.response?.data?.detail || 'Login failed'); } finally { setLoading(false); }
  };
  const doRegister = async () => {
    if (!email || !password) { toast.error('Email & password required'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/provider/register', { email, password, name });
      toast.success('Account created'); afterAuth(data);
    } catch (e) { toast.error(e.response?.data?.detail || 'Could not register'); } finally { setLoading(false); }
  };
  const doForgot = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/provider/forgot-password', { email });
      if (data.reset_token) {
        setResetToken(data.reset_token);
        toast.success('Use the token below to reset');
        setEmailMode('reset');
      } else {
        toast.success('If email exists, token sent');
      }
    } catch (e) { toast.error('Could not generate'); } finally { setLoading(false); }
  };
  const doReset = async () => {
    setLoading(true);
    try {
      await api.post('/auth/provider/reset-password', { email, reset_token: resetToken, new_password: newPwd });
      toast.success('Password updated. Please login.');
      setEmailMode('login'); setPassword(''); setNewPwd('');
    } catch (e) { toast.error(e.response?.data?.detail || 'Reset failed'); } finally { setLoading(false); }
  };

  return (
    <div className="resqly-shell">
      <div className="resqly-frame flex flex-col">
        <div className="gradient-blue text-white px-6 pt-10 pb-12 relative">
          <Logo size={40} withText={false} />
          <h2 className="text-2xl font-bold mt-4">Resqly Ranger</h2>
          <p className="text-blue-100 text-sm mt-1">Join India's verified healthcare network</p>
        </div>
        <div className="px-6 -mt-6">
          <div className="resqly-card p-5">
            <Tabs defaultValue="otp">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger data-testid="provider-tab-otp" value="otp">Phone OTP</TabsTrigger>
                <TabsTrigger data-testid="provider-tab-email" value="email">Email</TabsTrigger>
              </TabsList>
              <TabsContent value="otp" className="pt-4">
                {step === 'phone' ? (
                  <>
                    <Label>Phone Number</Label>
                    <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2.5">
                      <span className="text-slate-500 text-sm">+91</span>
                      <Phone className="w-4 h-4 text-slate-400" />
                      <input data-testid="provider-phone-input" inputMode="numeric" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} className="flex-1 outline-none" placeholder="10-digit mobile" />
                    </div>
                    <Button data-testid="provider-send-otp" disabled={loading} onClick={requestOtp} className="mt-4 w-full bg-blue-700 hover:bg-blue-800">{loading ? 'Sending...' : 'Send OTP'} <ArrowRight className="w-4 h-4 ml-1" /></Button>
                  </>
                ) : (
                  <>
                    <Label>Enter OTP</Label>
                    <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2.5">
                      <MessageSquare className="w-4 h-4 text-slate-400" />
                      <input data-testid="provider-otp-input" inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} className="flex-1 outline-none tracking-[0.4em]" placeholder="123456" />
                    </div>
                    {mockOtp && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-md p-2 mt-3">Demo OTP: <b>{mockOtp}</b></p>}
                    <Button data-testid="provider-verify-otp" disabled={loading} onClick={verifyOtp} className="mt-4 w-full bg-blue-700 hover:bg-blue-800">{loading ? 'Verifying...' : 'Verify'}</Button>
                    <button onClick={() => setStep('phone')} className="mt-3 text-xs text-slate-500 underline w-full">Change phone</button>
                  </>
                )}
              </TabsContent>
              <TabsContent value="email" className="pt-4 space-y-3">
                {emailMode === 'login' && (<>
                  <Label>Email</Label>
                  <InputBox icon={<Mail className="w-4 h-4 text-slate-400" />}><input data-testid="provider-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1 outline-none" placeholder="you@clinic.com" /></InputBox>
                  <Label>Password</Label>
                  <InputBox icon={<Lock className="w-4 h-4 text-slate-400" />}><input data-testid="provider-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="flex-1 outline-none" placeholder="••••••••" /></InputBox>
                  <Button data-testid="provider-login-submit" disabled={loading} onClick={doLogin} className="w-full bg-blue-700 hover:bg-blue-800">{loading ? 'Signing in...' : 'Login'}</Button>
                  <div className="flex justify-between text-xs mt-1">
                    <button onClick={() => setEmailMode('forgot')} className="text-blue-700">Forgot password?</button>
                    <button data-testid="provider-switch-register" onClick={() => setEmailMode('register')} className="text-blue-700">Create account</button>
                  </div>
                </>)}
                {emailMode === 'register' && (<>
                  <Label>Name</Label>
                  <Input data-testid="provider-reg-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
                  <Label>Email</Label>
                  <Input data-testid="provider-reg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@clinic.com" />
                  <Label>Password</Label>
                  <Input data-testid="provider-reg-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" />
                  <Button data-testid="provider-register-submit" disabled={loading} onClick={doRegister} className="w-full bg-blue-700 hover:bg-blue-800">{loading ? 'Creating...' : 'Create Account'}</Button>
                  <button onClick={() => setEmailMode('login')} className="text-xs text-slate-500 w-full text-center">Already have an account? Login</button>
                </>)}
                {emailMode === 'forgot' && (<>
                  <Label>Email</Label>
                  <Input data-testid="provider-forgot-email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
                  <Button data-testid="provider-forgot-submit" disabled={loading} onClick={doForgot} className="w-full bg-blue-700 hover:bg-blue-800">Get Reset Token</Button>
                  <button onClick={() => setEmailMode('login')} className="text-xs text-slate-500 w-full text-center">Back to login</button>
                </>)}
                {emailMode === 'reset' && (<>
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded p-2">Demo token: <b>{resetToken}</b></p>
                  <Label>Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
                  <Label>Reset Token</Label><Input value={resetToken} onChange={(e) => setResetToken(e.target.value)} />
                  <Label>New Password</Label><Input value={newPwd} onChange={(e) => setNewPwd(e.target.value)} type="password" />
                  <Button disabled={loading} onClick={doReset} className="w-full bg-blue-700 hover:bg-blue-800">Reset Password</Button>
                </>)}
              </TabsContent>
            </Tabs>
          </div>
          <p className="text-center text-xs text-slate-500 mt-4">
            Looking for healthcare services?{' '}
            <Link to="/consumer/login" className="text-blue-700 font-medium">Continue as Consumer</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Label({ children }) { return <label className="text-xs font-medium text-slate-500">{children}</label>; }
function InputBox({ icon, children }) {
  return <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2.5">{icon}{children}</div>;
}

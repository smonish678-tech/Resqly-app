import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Phone, ArrowRight, MessageSquare } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ConsumerLogin() {
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [mockOtp, setMockOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const requestOtp = async () => {
    if (!/^\d{10}$/.test(phone)) {
      toast.error('Enter a valid 10-digit phone number');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/otp/request', { phone, role: 'consumer' });
      setMockOtp(data.mock_otp || '');
      setStep('otp');
      toast.success('OTP sent');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error('Enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/otp/verify', { phone, otp, role: 'consumer' });
      login(data.token, 'consumer');
      toast.success('Welcome to Resqly');
      if (data.is_new || !data.user?.name) {
        navigate('/consumer/onboarding', { replace: true });
      } else {
        navigate('/consumer/home', { replace: true });
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="resqly-shell">
      <div className="resqly-frame flex flex-col">
        <div className="gradient-blue text-white px-6 pt-10 pb-12 relative">
          <Logo size={40} withText={false} />
          <h2 className="text-2xl font-bold mt-4">Welcome back</h2>
          <p className="text-blue-100 text-sm mt-1">Login with your phone number</p>
        </div>
        <div className="px-6 -mt-6">
          <div className="resqly-card p-5">
            {step === 'phone' ? (
              <>
                <label className="text-xs font-medium text-slate-500">Phone Number</label>
                <div className="mt-1 flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2.5">
                  <span className="text-slate-500 text-sm">+91</span>
                  <Phone className="w-4 h-4 text-slate-400" />
                  <input
                    data-testid="consumer-phone-input"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    placeholder="10-digit mobile"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 outline-none text-base"
                  />
                </div>
                <Button data-testid="consumer-send-otp" disabled={loading} onClick={requestOtp} className="mt-4 w-full bg-blue-700 hover:bg-blue-800">
                  {loading ? 'Sending...' : 'Send OTP'} <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </>
            ) : (
              <>
                <label className="text-xs font-medium text-slate-500">Enter 6-digit OTP</label>
                <div className="mt-1 flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2.5">
                  <MessageSquare className="w-4 h-4 text-slate-400" />
                  <input
                    data-testid="consumer-otp-input"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 outline-none text-base tracking-[0.4em]"
                  />
                </div>
                {mockOtp && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-md p-2 mt-3">
                    Pre-launch demo OTP: <b>{mockOtp}</b>
                  </p>
                )}
                <Button data-testid="consumer-verify-otp" disabled={loading} onClick={verifyOtp} className="mt-4 w-full bg-blue-700 hover:bg-blue-800">
                  {loading ? 'Verifying...' : 'Verify & Continue'}
                </Button>
                <button onClick={() => setStep('phone')} className="mt-3 text-xs text-slate-500 underline w-full">Change phone</button>
              </>
            )}
          </div>
          <p className="text-center text-xs text-slate-500 mt-4">
            Are you a healthcare professional?{' '}
            <Link to="/provider/login" className="text-blue-700 font-medium">Join as Resqly Ranger</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, HeartPulse, Activity } from 'lucide-react';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';

export default function Landing() {
  const navigate = useNavigate();
  return (
    <div className="resqly-shell">
      <div className="resqly-frame flex flex-col">
        <div className="px-6 pt-10 pb-6 flex flex-col items-center text-center gradient-blue text-white relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10" />
          <div className="absolute -bottom-16 -left-10 w-44 h-44 rounded-full bg-white/10" />
          <div className="mb-3 z-10"><Logo size={48} withText={false} /></div>
          <h1 className="text-3xl font-bold z-10">Resqly</h1>
          <p className="text-blue-100 mt-1 z-10">Healthcare Simplified</p>
          <p className="text-sm text-blue-100/90 mt-5 max-w-xs z-10">
            India's next-generation healthcare response network. Verified providers. Trusted care.
          </p>
        </div>

        <div className="px-6 py-6 grid grid-cols-3 gap-3">
          <FeatureChip icon={<ShieldCheck className="w-5 h-5" />} label="Verified" />
          <FeatureChip icon={<HeartPulse className="w-5 h-5" />} label="24/7 Ready" />
          <FeatureChip icon={<Activity className="w-5 h-5" />} label="Trusted" />
        </div>

        <div className="px-6 mt-4 flex-1 flex flex-col gap-4">
          <RoleCard
            testid="role-consumer"
            title="Continue as Consumer"
            subtitle="Get priority access. Set up your emergency profile."
            cta="Continue"
            color="#1E40AF"
            onClick={() => navigate('/consumer/login')}
          />
          <RoleCard
            testid="role-provider"
            title="Join as Resqly Ranger"
            subtitle="Healthcare professional? Join our verified network."
            cta="Join Now"
            color="#0F766E"
            badge="For Providers"
            onClick={() => navigate('/provider/login')}
          />
        </div>

        <div className="px-6 py-6 text-center text-xs text-slate-500">
          By continuing you agree to our{' '}
          <Link className="text-blue-700 font-medium" to="/terms">Terms</Link> &{' '}
          <Link className="text-blue-700 font-medium" to="/privacy">Privacy Policy</Link>.
          <div className="mt-2 flex justify-center gap-3">
            <Link to="/support" className="text-slate-500 underline">Support</Link>
            <Link to="/contact" className="text-slate-500 underline">Contact</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureChip({ icon, label }) {
  return (
    <div className="resqly-card flex flex-col items-center justify-center py-3 text-blue-800">
      {icon}
      <span className="text-xs mt-1 font-medium">{label}</span>
    </div>
  );
}

function RoleCard({ title, subtitle, cta, onClick, color, badge, testid }) {
  return (
    <button data-testid={testid} onClick={onClick} className="resqly-card text-left p-5 transition hover:shadow-md active:scale-[0.99]">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            {badge && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">{badge}</span>}
          </div>
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        </div>
      </div>
      <div className="mt-4">
        <span className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color }}>
          {cta} <ArrowRight className="w-4 h-4" />
        </span>
      </div>
    </button>
  );
}

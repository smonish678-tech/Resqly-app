import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, User as UserIcon, MapPin, ArrowRight, Sparkles } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import BottomNav from '@/components/BottomNav';
import ServiceIcon from '@/components/ServiceIcon';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';

export default function ConsumerHome() {
  const { me } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [stats, setStats] = useState({ total: 0 });

  useEffect(() => {
    api.get('/services').then(({ data }) => setServices(data.services)).catch(() => {});
    api.get('/waitlist/stats').then(({ data }) => setStats(data)).catch(() => {});
  }, []);

  return (
    <div className="resqly-shell">
      <div className="resqly-frame flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <button onClick={() => navigate('/consumer/profile')} className="flex items-start gap-2 text-left">
            <MapPin className="w-4 h-4 text-blue-700 mt-0.5" />
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Location</div>
              <div className="text-sm font-semibold text-slate-900 flex items-center gap-1">{me?.city || 'Set your city'} <ChevronDown className="w-3 h-3" /></div>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <button data-testid="home-notifications" onClick={() => navigate('/consumer/notifications')} className="p-2 bg-slate-50 rounded-full relative">
              <Bell className="w-5 h-5 text-slate-700" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <button data-testid="home-profile" onClick={() => navigate('/consumer/profile')} className="p-2 bg-slate-50 rounded-full">
              <UserIcon className="w-5 h-5 text-slate-700" />
            </button>
          </div>
        </div>

        {/* Hero */}
        <div className="mx-5 mt-2 rounded-2xl gradient-blue text-white p-5 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -right-10 bottom-0 w-24 h-24 rounded-full bg-white/10" />
          <Logo size={28} withText={false} />
          <h1 className="text-2xl font-bold mt-2">Healthcare Simplified</h1>
          <p className="text-sm text-blue-100 mt-2 max-w-[260px]">
            Resqly is onboarding verified healthcare partners in your area. Complete your emergency profile and get priority access when services launch.
          </p>
          <Button data-testid="home-priority-access" onClick={() => navigate('/consumer/waitlist')} className="mt-4 bg-white text-blue-800 hover:bg-blue-50 font-semibold">
            Join Priority Access <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Services */}
        <div className="px-5 mt-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Our Services</h3>
            <span className="text-xs text-blue-700">Pre-launch</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            {services.map((s) => (
              <Link
                data-testid={`service-${s.key}`}
                key={s.key}
                to={`/consumer/service/${s.key}`}
                className="resqly-card p-4 flex flex-col items-center justify-center gap-2 hover:shadow-md transition"
              >
                <ServiceIcon serviceKey={s.key} />
                <span className="text-sm font-medium text-slate-800 mt-1">{s.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Ranger CTA */}
        <div className="px-5 mt-6">
          <div className="resqly-card p-5 border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-700" />
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700">For Healthcare Pros</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-1">Become a Resqly Ranger</h3>
            <p className="text-sm text-slate-600 mt-1">
              Are you a healthcare professional or service provider? Join Resqly and become part of India's next-generation healthcare response network.
            </p>
            <Button data-testid="home-ranger-cta" onClick={() => navigate('/provider/login')} className="mt-4 w-full bg-blue-700 hover:bg-blue-800">
              JOIN AS RESQLY RANGER
            </Button>
          </div>
        </div>

        {/* Footer stat */}
        <div className="px-5 mt-5 mb-6">
          <div className="text-xs text-slate-500 text-center">
            <b className="text-blue-700">{stats.total || 0}+</b> people already on the priority list across India
          </div>
        </div>

        <div className="flex-1" />
        <BottomNav variant="consumer" />
      </div>
    </div>
  );
}

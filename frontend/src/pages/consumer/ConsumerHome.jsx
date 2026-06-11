import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { Bell, ChevronDown, User as UserIcon, MapPin, ArrowRight, Sparkles, Ambulance, ChevronRight, ShieldCheck } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import BottomNav from '@/components/BottomNav';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { CONSUMER_SERVICES } from '@/lib/constants';

export default function ConsumerHome() {
  const { me } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0 });

  useEffect(() => {
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
        <div className="mx-5 mt-2 rounded-3xl gradient-blue text-white p-5 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -right-10 bottom-0 w-24 h-24 rounded-full bg-white/10" />
          <Logo size={26} withText={false} />
          <h1 className="text-2xl font-bold mt-2">Healthcare Simplified</h1>
          <p className="text-sm text-blue-100 mt-2 max-w-[260px]">
            Resqly is onboarding verified healthcare partners in your area. Complete your emergency profile and get priority access when services launch.
          </p>
          <Button data-testid="home-join-waitlist" onClick={() => navigate('/consumer/waitlist')} className="mt-4 bg-white text-blue-800 hover:bg-blue-50 font-semibold">
            Join Waitlist <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Emergency Floating Action Card */}
        <div className="px-5 mt-5">
          <button
            data-testid="home-emergency-fab"
            onClick={() => navigate('/consumer/emergency-request')}
            className="emergency-fab w-full rounded-3xl p-4 text-white text-left flex items-center gap-4 active:scale-[0.98] transition-transform"
          >
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center relative">
              <Ambulance className="w-7 h-7 text-white" strokeWidth={2.4} />
              <span className="emergency-pulse absolute inset-0 rounded-2xl" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">SOS</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/80">24/7</span>
              </div>
              <div className="text-lg font-bold mt-1">Emergency Ambulance</div>
              <div className="text-xs text-white/85">Tap to request nearest verified ambulance</div>
            </div>
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Services */}
        <div className="px-5 mt-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Our Services</h3>
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">PRE-LAUNCH</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            {CONSUMER_SERVICES.map((s) => {
              const Icon = Icons[s.icon] || Icons.Activity;
              return (
                <Link
                  data-testid={`service-${s.key}`}
                  key={s.key}
                  to={`/consumer/service/${s.key}`}
                  className="resqly-card p-4 flex flex-col items-center justify-center gap-2 hover:shadow-md transition active:scale-[0.98]"
                >
                  <div className="icon-tile" style={{ background: s.bg }}>
                    <Icon size={28} color={s.fg} strokeWidth={2.2} />
                  </div>
                  <span className="text-sm font-medium text-slate-800 mt-1">{s.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Ranger CTA */}
        <div className="px-5 mt-6">
          <div className="resqly-card p-5 border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-white">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-700" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-700">For Healthcare Professionals</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-2">Become a Resqly Ranger</h3>
            <p className="text-sm text-slate-600 mt-1">
              Join Resqly's verified healthcare network and receive service requests from patients nearby.
            </p>
            <Button data-testid="home-ranger-cta" onClick={() => navigate('/provider/login')} className="mt-4 w-full bg-blue-700 hover:bg-blue-800">
              Join as Ranger <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Footer stat */}
        <div className="px-5 mt-5 mb-3">
          <div className="text-xs text-slate-500 text-center inline-flex items-center justify-center gap-1.5 w-full">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span><b className="text-blue-700">{stats.total || 0}+</b> people on the priority list across India</span>
          </div>
        </div>

        <div className="flex-1" />
        {/* Spacer so content doesn't sit behind floating dock */}
        <div className="h-24" />
        <BottomNav variant="consumer" />
      </div>
    </div>
  );
}

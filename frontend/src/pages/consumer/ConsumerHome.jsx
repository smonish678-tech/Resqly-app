import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { Bell, ChevronDown, ShieldCheck, MapPin, ArrowRight, Ambulance, ChevronRight, Sparkles, Activity, HeartPulse } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import BottomNav from '@/components/BottomNav';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { CONSUMER_SERVICES } from '@/lib/constants';

function greetingFor(name) {
  const h = new Date().getHours();
  const greet = h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
  const first = (name || '').trim().split(/\s+/)[0];
  const hey = first ? `Hey ${first}` : 'Hey User';
  return { greet, hey };
}

export default function ConsumerHome() {
  const { me } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0 });
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    api.get('/waitlist/stats').then(({ data }) => setStats(data)).catch(() => {});
    api.get('/notifications').then(({ data }) => {
      const unread = (data.notifications || []).filter((n) => !n.read).length;
      setUnreadCount(unread);
    }).catch(() => {});
  }, []);

  const locationLabel = me?.location || me?.city || 'Set your location';

  return (
    <div className="resqly-shell">
      <div className="resqly-frame flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="px-5 pt-5 pb-2 flex items-center justify-between">
          <button data-testid="home-location" onClick={() => navigate('/consumer/location')} className="flex items-start gap-2 text-left max-w-[70%]">
            <MapPin className="w-4 h-4 text-blue-700 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Location</div>
              <div className="text-sm font-semibold text-slate-900 flex items-center gap-1 truncate">
                <span className="truncate">{locationLabel}</span>
                <ChevronDown className="w-3 h-3 flex-shrink-0" />
              </div>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <button data-testid="home-notifications" onClick={() => navigate('/consumer/notifications')} className="p-2 bg-slate-50 rounded-full relative">
              <Bell className="w-5 h-5 text-slate-700" />
              {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />}
            </button>
            <button data-testid="home-sos-vault" onClick={() => navigate('/consumer/sos-vault')} className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-full inline-flex items-center gap-1.5 font-semibold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>SOS Vault</span>
            </button>
          </div>
        </div>

        {/* Greeting */}
        <div className="px-5 pt-2 pb-1" data-testid="home-greeting">
          <div className="text-sm font-semibold text-slate-500" data-testid="home-greeting-time">{greetingFor(me?.name).greet}</div>
          <div className="text-2xl font-bold text-slate-900 mt-0.5" data-testid="home-greeting-name">{greetingFor(me?.name).hey}</div>
          <div className="text-sm text-slate-500 mt-1">How can we help you today?</div>
        </div>

        {/* Hero */}
        <div className="mx-5 mt-3 rounded-3xl gradient-blue text-white p-5 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -right-10 bottom-0 w-24 h-24 rounded-full bg-white/10" />
          <Logo size={26} withText={false} />
          <h1 className="text-xl font-bold mt-2">Healthcare Simplified</h1>
          <p className="text-sm text-blue-100 mt-1.5 max-w-[280px]">
            Resqly is onboarding verified healthcare partners near you. Complete your profile for priority access.
          </p>
          <Button data-testid="home-join-waitlist" onClick={() => navigate('/consumer/waitlist')} className="mt-4 bg-white text-blue-800 hover:bg-blue-50 font-semibold h-9">
            Join Waitlist <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Emergency SOS — immediately below hero */}
        <div className="px-5 mt-4">
          <button
            data-testid="home-emergency-sos"
            onClick={() => navigate('/consumer/emergency-request')}
            className="emergency-fab w-full rounded-3xl p-4 text-white text-left flex items-center gap-4 active:scale-[0.98] transition-transform"
          >
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center relative flex-shrink-0">
              <Ambulance className="w-7 h-7 text-white" strokeWidth={2.4} />
              <span className="emergency-pulse absolute inset-0 rounded-2xl" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">SOS</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/80">24/7</span>
              </div>
              <div className="text-lg font-bold mt-1">Emergency SOS</div>
              <div className="text-xs text-white/85">Tap to request nearest verified ambulance</div>
            </div>
            <ChevronRight className="w-5 h-5 text-white flex-shrink-0" />
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

        {/* Quick stat */}
        <div className="px-5 mt-5 mb-2">
          <div className="text-xs text-slate-500 text-center inline-flex items-center justify-center gap-1.5 w-full">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span><b className="text-blue-700">{stats.total || 0}+</b> people on the priority list across India</span>
          </div>
        </div>

        {/* Small text link to Ranger (replaces big card) */}
        <div className="px-5 mt-3 mb-4">
          <button data-testid="home-ranger-link" onClick={() => navigate('/provider/login')} className="w-full text-center text-sm text-slate-600 py-3 border-t border-slate-100">
            Healthcare Professional? <span className="text-blue-700 font-semibold">Join as a Resqly Ranger</span>
          </button>
        </div>

        <div className="flex-1" />
        <div className="h-24" />
        <BottomNav variant="consumer" />
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { Bell, ChevronDown, MapPin, ChevronRight, Activity, ArrowUpRight } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import BottomNav from '@/components/BottomNav';
import Logo from '@/components/Logo';
import { CONSUMER_SERVICES } from '@/lib/constants';

function greetingFor(name) {
  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const first = (name || '').trim().split(/\s+/)[0];
  return { greet, hey: first ? `Hey ${first}` : 'Hello there' };
}

export default function ConsumerHome() {
  const { me } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeRequest, setActiveRequest] = useState(null);
  const [loadingActive, setLoadingActive] = useState(true);
  const [requestError, setRequestError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    api.get('/notifications').then(({ data }) => {
      if (!mounted) return;
      setUnreadCount((data.notifications || []).filter((n) => !n.read).length);
    }).catch(() => {});
    // The requests page owns full history. Home only surfaces a current request if the
    // current backend exposes one; failure never blocks service discovery.
    api.get('/marketplace/requests/mine/active').then(({ data }) => {
      if (mounted) setActiveRequest(data.request || null);
    }).catch((e) => {
      if (!mounted) return;
      // A 404 means this endpoint has not been deployed yet; surface no false active card.
      setRequestError(e.response?.status !== 404);
    }).finally(() => { if (mounted) setLoadingActive(false); });
    return () => { mounted = false; };
  }, [refreshKey]);

  const locationLabel = me?.location || me?.city || 'Set your location';
  const { greet, hey } = greetingFor(me?.name);
  const activeRequestTarget = activeRequest && ['pharmacy', 'lab_test'].includes(activeRequest.service_type)
    ? `/consumer/service/${activeRequest.service_type}?request_id=${encodeURIComponent(activeRequest.id)}`
    : '/consumer/requests';

  return (
    <div className="resqly-shell">
      <div className="resqly-frame flex flex-col min-h-screen">
        <header className="px-5 pt-[calc(1.25rem+env(safe-area-inset-top,0px))] pb-3 flex items-center justify-between">
          <button data-testid="home-location" onClick={() => navigate('/consumer/location')} className="flex items-start gap-2 text-left max-w-[70%] rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
            <MapPin className="w-4 h-4 text-blue-700 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Your location</span>
              <span className="text-sm font-semibold text-slate-900 flex items-center gap-1 truncate">
                <span className="truncate">{locationLabel}</span><ChevronDown className="w-3 h-3 flex-shrink-0" />
              </span>
            </span>
          </button>
          <div className="flex items-center gap-2">
            <button aria-label="Notifications" data-testid="home-notifications" onClick={() => navigate('/consumer/notifications')} className="p-2.5 bg-white border border-slate-200 rounded-full relative min-w-[44px] min-h-[44px] flex items-center justify-center">
              <Bell className="w-5 h-5 text-slate-700" aria-hidden="true" />
              {unreadCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />}
            </button>
          </div>
        </header>

        <main className="flex-1 pb-4">
          <section className="px-5 pt-3">
            <p className="text-sm font-semibold text-slate-500">{greet}</p>
            <h1 className="text-[30px] leading-tight font-bold tracking-tight text-slate-950 mt-1">{hey}</h1>
            <p className="text-[15px] text-slate-600 mt-2">What do you need today?</p>
          </section>

          <section className="mx-5 mt-5 rounded-[28px] gradient-blue text-white p-5 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10" aria-hidden="true" />
            <div className="absolute -right-10 bottom-0 w-24 h-24 rounded-full bg-white/10" aria-hidden="true" />
            <div className="relative">
              <div className="flex items-center gap-2 text-blue-100 text-xs font-semibold tracking-wide"><Logo size={19} withText={false} /> RESQLY CARE</div>
              <h2 className="text-xl font-bold mt-3">Healthcare, made simpler.</h2>
              <p className="text-sm text-blue-100 mt-1 max-w-[300px]">Choose a service, tell us what you need, and we’ll guide you through the next step.</p>
            </div>
          </section>

          <section className="mx-5 mt-4">
            <button
              data-testid="home-emergency-sos"
              onClick={() => navigate('/consumer/emergency-request')}
              className="emergency-fab w-full rounded-2xl p-4 text-white text-left flex items-center gap-3 active:scale-[0.99] transition-transform"
            >
              <span className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0"><Icons.Ambulance className="w-6 h-6" aria-hidden="true" /></span>
              <span className="flex-1 min-w-0">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-white/90">Emergency</span>
                <span className="block text-base font-bold mt-0.5">Need an ambulance now?</span>
                <span className="block text-xs text-white/90 mt-1">Call 108 for immediate ambulance assistance.</span>
              </span>
              <ChevronRight className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            </button>
            <p className="text-[11px] text-slate-500 mt-2 px-1">Resqly emergency request logging is not an ambulance dispatch service yet.</p>
          </section>

          <section className="px-5 mt-7">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-950">Explore care</h2>
                <p className="text-sm text-slate-500 mt-0.5">Clear choices. One step at a time.</p>
              </div>
              <button onClick={() => navigate('/consumer/requests')} className="text-sm text-blue-700 font-semibold inline-flex items-center gap-1 min-h-[44px]">My Requests <ArrowUpRight className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {CONSUMER_SERVICES.map((s) => {
                const Icon = Icons[s.icon] || Icons.Activity;
                return (
                  <Link
                    data-testid={`service-${s.key}`}
                    key={s.key}
                    to={s.key === 'ambulance' ? '/consumer/emergency-request' : `/consumer/service/${s.key}`}
                    className="resqly-card group flex flex-col items-start min-h-[158px] p-4 transition-transform duration-150 active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  >
                    <span className="flex items-start justify-between w-full gap-2">
                      <span className="icon-tile w-12 h-12 rounded-2xl" style={{ background: s.bg }}>
                        <Icon size={23} color={s.fg} strokeWidth={2.1} aria-hidden="true" />
                      </span>
                      <span className={`text-[10px] leading-tight text-right font-bold rounded-full px-2 py-1 max-w-[110px] ${s.availabilityKind === 'urgent' ? 'bg-rose-50 text-rose-700' : s.availabilityKind === 'active' ? 'bg-emerald-50 text-emerald-700' : s.availabilityKind === 'waitlist' ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>{s.availability}</span>
                    </span>
                    <span className="flex items-center justify-between w-full gap-2 mt-3">
                      <span className="text-[15px] font-semibold text-slate-900">{s.label}</span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                    </span>
                    <span className="text-xs leading-relaxed text-slate-500 mt-1">{s.subtitle}</span>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="px-5 mt-6">
            <div className="resqly-card p-4">
              <div className="flex items-start gap-3">
                <span className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><Activity className="w-5 h-5 text-blue-700" aria-hidden="true" /></span>
                <div className="flex-1">
                  <h2 className="font-semibold text-slate-900">Continue your request</h2>
                  {loadingActive ? <p className="text-sm text-slate-500 mt-1">Checking for an active request…</p> :
                    activeRequest ? <><p className="text-sm text-slate-600 mt-1">{activeRequest.service_type || 'Healthcare request'} · {String(activeRequest.status || 'in progress').replaceAll('_', ' ')}</p><button className="text-sm font-semibold text-blue-700 mt-3" onClick={() => navigate(activeRequestTarget)}>View request <ArrowUpRight className="inline w-4 h-4" /></button></> :
                    requestError ? <><p className="text-sm text-slate-600 mt-1">We couldn’t check your requests just now.</p><button className="text-sm font-semibold text-blue-700 mt-3" onClick={() => { setLoadingActive(true); setRequestError(false); setRefreshKey((v) => v + 1); }}>Try again</button></> :
                    <p className="text-sm text-slate-500 mt-1">Your current and past requests will be easy to find here.</p>}
                </div>
              </div>
            </div>
          </section>

          <section className="px-5 mt-7 mb-5">
            <button data-testid="home-ranger-link" onClick={() => navigate('/provider/login')} className="w-full text-center text-sm text-slate-600 py-4 border-t border-slate-200 min-h-[48px]">
              Healthcare professional? <span className="text-blue-700 font-semibold">Join as a Resqly Ranger</span>
            </button>
          </section>
        </main>
        <BottomNav variant="consumer" />
      </div>
    </div>
  );
}

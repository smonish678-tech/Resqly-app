import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Star, ShieldCheck, CircleDollarSign, ClipboardList, FileText, LifeBuoy, User as UserIcon, Activity, ChevronRight, AlertCircle, RefreshCw, ArrowRight, Clock3 } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import BottomNav from '@/components/BottomNav';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';

const AVAIL = [
  { key: 'available', label: 'Available', color: 'bg-emerald-500', desc: 'Ready for eligible requests' },
  { key: 'busy', label: 'Busy', color: 'bg-amber-500', desc: 'You are currently occupied' },
  { key: 'offline', label: 'Offline', color: 'bg-slate-400', desc: 'You are not receiving new work' },
];
const ACTIVE_STATES = new Set(['accepted', 'in_progress', 'confirmed', 'preparing', 'ready', 'assigned', 'in_call']);
const CLOSED_STATES = new Set(['completed', 'cancelled', 'refunded', 'failed', 'expired']);

export default function ProviderDashboard() {
  const navigate = useNavigate();
  const [provider, setProvider] = useState(null);
  const [earnings, setEarnings] = useState({ today: 0, monthly: 0, lifetime: 0, completed_count: 0 });
  const [reviews, setReviews] = useState({ average: 0, total: 0 });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [providerError, setProviderError] = useState('');
  const [earningsError, setEarningsError] = useState(false);
  const [reviewsError, setReviewsError] = useState(false);
  const [ordersError, setOrdersError] = useState(false);
  const [availabilitySaving, setAvailabilitySaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setProviderError('');
    const results = await Promise.allSettled([
      api.get('/providers/me'),
      api.get('/providers/me/earnings'),
      api.get('/providers/me/reviews'),
      api.get('/providers/me/orders'),
    ]);
    const [p, e, r, o] = results;
    if (p.status === 'rejected') {
      setProviderError(p.reason?.response?.data?.detail || 'Could not load your provider profile.');
      setLoading(false);
      return;
    }
    const nextProvider = p.value.data.provider;
    setProvider(nextProvider);
    setEarningsError(e.status === 'rejected');
    setReviewsError(r.status === 'rejected');
    setOrdersError(o.status === 'rejected');
    if (e.status === 'fulfilled') setEarnings(e.value.data);
    if (r.status === 'fulfilled') setReviews(r.value.data);
    if (o.status === 'fulfilled') setOrders(Array.isArray(o.value.data.orders) ? o.value.data.orders : []);
    setLoading(false);
    if (nextProvider?.approval_status !== 'approved') navigate('/provider/status', { replace: true });
  }, [navigate]);

  useEffect(() => { load(); }, [load]);

  const setAvail = async (status) => {
    setAvailabilitySaving(true);
    try {
      let location = {};
      if (status === 'available' && provider?.category !== 'doctor') {
        if (!('geolocation' in navigator)) throw new Error('This device cannot provide location.');
        location = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
          (err) => reject(new Error(err.message || 'Location permission is required to go available.')),
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
        ));
      } else if (status === 'available' && provider?.category === 'doctor' && 'geolocation' in navigator) {
        try {
          location = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
            (err) => reject(new Error(err.message || 'Location unavailable')),
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
          ));
        } catch { toast.message('Location is off. Online consultations may still be available.'); }
      }
      const response = await api.patch('/providers/me/availability', { availability_status: status, ...location });
      setProvider((current) => ({ ...current, availability_status: response.data.availability_status, latitude: response.data.latitude, longitude: response.data.longitude }));
      toast.success(status === 'available' ? 'You are available for eligible requests' : `Status set to ${status}`);
    } catch (e) { toast.error(e.response?.data?.detail || e.message || 'Could not update availability'); }
    finally { setAvailabilitySaving(false); }
  };

  if (loading && !provider) return <div className="resqly-shell"><div className="resqly-frame flex min-h-screen items-center justify-center text-slate-500">Loading your workspace…</div></div>;

  if (!provider && providerError) return (
    <div className="resqly-shell"><div className="resqly-frame min-h-screen p-6 flex items-center justify-center"><div className="resqly-card p-5 max-w-sm w-full"><AlertCircle className="w-6 h-6 text-rose-700"/><h1 className="font-bold text-lg mt-3">Workspace unavailable</h1><p className="text-sm text-slate-600 mt-1">{providerError}</p><Button onClick={load} className="w-full mt-4"><RefreshCw className="w-4 h-4 mr-2"/>Try again</Button></div></div></div>
  );

  if (!provider) return null;
  const activeOrders = orders.filter((o) => !CLOSED_STATES.has(String(o.status || '').toLowerCase()));
  const isMarketplaceProvider = provider.category === 'pharmacy' || provider.category === 'lab_test';

  return (
    <div className="resqly-shell">
      <div className="resqly-frame flex flex-col min-h-screen">
        <header className="gradient-blue text-white px-5 pt-[calc(1.25rem+env(safe-area-inset-top,0px))] pb-16 relative">
          <div className="flex items-center justify-between">
            <Logo size={26} withText={false}/>
            <button aria-label="Open profile" onClick={() => navigate('/provider/profile')} className="p-2.5 bg-white/15 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center"><UserIcon className="w-5 h-5"/></button>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white text-blue-700 font-bold flex items-center justify-center text-xl">{(provider.name || 'R').charAt(0).toUpperCase()}</div>
            <div><p className="font-semibold text-xl">{provider.name || 'Welcome'}</p><p className="text-sm text-blue-100 capitalize mt-0.5">{String(provider.category || 'Healthcare professional').replaceAll('_', ' ')} · Verified Ranger</p></div>
          </div>
        </header>

        <div className="px-5 -mt-10 relative z-10">
          <section className="resqly-card p-5">
            <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-slate-600">Your availability</p><div className="flex items-center gap-2 mt-1"><span className={`w-2.5 h-2.5 rounded-full ${AVAIL.find((a) => a.key === provider.availability_status)?.color || 'bg-slate-400'}`}/><span className="text-xl font-bold capitalize text-slate-950">{provider.availability_status || 'offline'}</span></div></div><Activity className="w-7 h-7 text-blue-700"/></div>
            <div className="grid grid-cols-3 gap-2 mt-4">
              {AVAIL.map((a) => <button type="button" data-testid={`avail-${a.key}`} key={a.key} disabled={availabilitySaving} onClick={() => setAvail(a.key)} aria-pressed={provider.availability_status === a.key} className={`min-h-[46px] rounded-xl text-sm font-semibold border transition-colors ${provider.availability_status === a.key ? 'border-blue-700 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-700'} disabled:opacity-60`}>{a.label}</button>)}
            </div>
            <p className="text-sm text-slate-500 mt-2">{AVAIL.find((a) => a.key === provider.availability_status)?.desc || 'Choose your status to control incoming work.'}</p>
          </section>
        </div>

        <main className="flex-1 px-5 pb-6">
          <section className="mt-5">
            <div className="flex items-end justify-between gap-3"><div><h2 className="text-lg font-bold text-slate-950">Active orders</h2><p className="text-sm text-slate-500 mt-0.5">Your accepted work, and what needs attention.</p></div><button onClick={() => navigate('/provider/orders')} className="text-sm text-blue-700 font-semibold min-h-[44px] inline-flex items-center gap-1">All work <ArrowRight className="w-4 h-4"/></button></div>
            {ordersError ? <div role="alert" className="resqly-card p-4 mt-3 border-rose-200 bg-rose-50"><AlertCircle className="inline w-5 h-5 text-rose-700 mr-2"/><span className="text-sm text-rose-950">Orders could not be loaded.</span><Button variant="outline" onClick={load} className="w-full mt-3 min-h-[44px]">Try again</Button></div> :
              activeOrders.length ? <div className="space-y-3 mt-3">{activeOrders.slice(0,3).map((order) => <article key={order.id} className="resqly-card p-4"><div className="flex items-start justify-between gap-2"><div><p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700">{String(order.service_type || 'Service').replaceAll('_',' ')}</p><h3 className="font-semibold text-slate-950 mt-1">{order.customer_name || 'Customer'}</h3><p className="text-xs text-slate-500 mt-1">Order #{String(order.id).slice(0,8)}</p></div><span className="text-xs font-semibold capitalize bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{String(order.status || 'accepted').replaceAll('_',' ')}</span></div><div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100"><span className="text-sm text-slate-600">Order amount</span><span className="font-bold text-slate-950">₹{order.amount ?? '—'}</span></div><Button onClick={() => navigate('/provider/orders')} variant="outline" className="w-full mt-3 min-h-[44px]">View order list</Button></article>)}</div> :
              <div className="resqly-card p-5 mt-3"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><ClipboardList className="w-5 h-5 text-blue-700"/></div><div><h3 className="font-semibold text-slate-950">You’re all caught up</h3><p className="text-sm text-slate-500 mt-0.5">{isMarketplaceProvider ? 'New quotations are in Live Requests. Accepted work will appear here.' : 'New accepted work will appear here.'}</p></div></div>{isMarketplaceProvider && <Button onClick={() => navigate('/provider/marketplace')} className="w-full mt-4 min-h-[46px]">Open Live Requests</Button>}</div>}
          </section>

          <section className="mt-6">
            <h2 className="text-lg font-bold text-slate-950">Your snapshot</h2>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <Kpi icon={<ShieldCheck className="text-emerald-600"/>} label="Verification" value={provider.approval_status === 'approved' ? 'Approved' : 'Pending'} />
              <Kpi icon={<CircleDollarSign className="text-blue-600"/>} label="Today’s earnings" value={earningsError ? '—' : `₹${earnings.today ?? 0}`} />
              <Kpi icon={<CircleDollarSign className="text-blue-600"/>} label="This month" value={earningsError ? '—' : `₹${earnings.monthly ?? 0}`} />
              <Kpi icon={<ClipboardList className="text-blue-600"/>} label="Total orders" value={ordersError ? '—' : orders.length} />
              <Kpi icon={<Star className="text-amber-500"/>} label="Rating" value={reviewsError ? '—' : (reviews.average || provider.rating || 'New')} />
              <Kpi icon={<UserIcon className="text-blue-600"/>} label="Profile" value={`${provider.profile_completion ?? 0}%`} />
            </div>
            {(earningsError || reviewsError) && <div role="status" className="text-xs text-slate-500 mt-2">Some summary figures are temporarily unavailable. <button onClick={load} className="text-blue-700 font-semibold underline">Refresh</button></div>}
          </section>

          <section className="mt-6">
            <h2 className="font-semibold text-slate-950 mb-2">Shortcuts</h2>
            <div className="resqly-card divide-y divide-slate-100">
              {isMarketplaceProvider && <Action icon={<ClipboardList className="w-4 h-4 text-blue-700"/>} label={provider.category === 'pharmacy' ? 'Pharmacy requests' : 'Lab requests'} onClick={() => navigate('/provider/marketplace')}/>}
              <Action icon={<CircleDollarSign className="w-4 h-4 text-blue-700"/>} label="Earnings" onClick={() => navigate('/provider/earnings')}/>
              <Action icon={<Star className="w-4 h-4 text-amber-500"/>} label="Reviews" onClick={() => navigate('/provider/reviews')}/>
              <Action icon={<FileText className="w-4 h-4 text-slate-600"/>} label="Documents and verification" onClick={() => navigate('/provider/documents')}/>
              <Action icon={<LifeBuoy className="w-4 h-4 text-blue-700"/>} label="Support" onClick={() => navigate('/provider/support')}/>
            </div>
          </section>
        </main>
        <BottomNav variant="provider"/>
      </div>
    </div>
  );
}

function Kpi({ icon, label, value }) {
  return <div className="resqly-card p-3"><div className="flex items-center justify-between gap-2"><span className="text-xs text-slate-500">{label}</span><div className="w-7 h-7 rounded-md bg-slate-50 flex items-center justify-center">{icon}</div></div><div className="text-lg font-bold text-slate-950 mt-1">{value}</div></div>;
}
function Action({ icon, label, onClick }) {
  return <button onClick={onClick} className="flex items-center gap-3 w-full px-4 py-3.5 min-h-[52px] text-left"><div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">{icon}</div><span className="text-sm font-medium text-slate-800 flex-1">{label}</span><ChevronRight className="w-4 h-4 text-slate-400"/></button>;
}

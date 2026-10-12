import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Activity,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  FileText,
  LifeBuoy,
  RefreshCw,
  ShieldCheck,
  Star,
  User as UserIcon,
  Zap,
} from 'lucide-react';
import api from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';

const AVAIL = [
  { key: 'available', label: 'Available', color: 'bg-emerald-500', desc: 'You can receive eligible requests.' },
  { key: 'busy', label: 'Busy', color: 'bg-amber-500', desc: 'You are occupied and won’t receive new work.' },
  { key: 'offline', label: 'Offline', color: 'bg-slate-400', desc: 'You are not receiving new work.' },
];
const CLOSED_STATES = new Set(['completed', 'cancelled', 'refunded', 'failed', 'expired']);

function humanize(value) {
  return String(value || 'in progress').replaceAll('_', ' ');
}

function friendlyStatus(status) {
  const labels = {
    accepted: 'Accepted',
    in_progress: 'In progress',
    confirmed: 'Confirmed',
    preparing: 'Preparing',
    ready: 'Ready',
    assigned: 'Assigned',
    in_call: 'Consultation in progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
    failed: 'Needs attention',
    expired: 'Expired',
  };
  return labels[status] || humanize(status);
}

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
    const [profileResult, earningsResult, reviewsResult, ordersResult] = results;
    if (profileResult.status === 'rejected') {
      setProviderError(profileResult.reason?.response?.data?.detail || 'Could not load your provider profile.');
      setLoading(false);
      return;
    }
    const nextProvider = profileResult.value.data.provider;
    setProvider(nextProvider);
    setEarningsError(earningsResult.status === 'rejected');
    setReviewsError(reviewsResult.status === 'rejected');
    setOrdersError(ordersResult.status === 'rejected');
    if (earningsResult.status === 'fulfilled') setEarnings(earningsResult.value.data);
    if (reviewsResult.status === 'fulfilled') setReviews(reviewsResult.value.data);
    if (ordersResult.status === 'fulfilled') setOrders(Array.isArray(ordersResult.value.data.orders) ? ordersResult.value.data.orders : []);
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
          (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
          (error) => reject(new Error(error.message || 'Location permission is required to go available.')),
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
        ));
      } else if (status === 'available' && provider?.category === 'doctor' && 'geolocation' in navigator) {
        try {
          location = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(
            (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
            (error) => reject(new Error(error.message || 'Location unavailable')),
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
          ));
        } catch {
          toast.message('Location is off. Online consultations may still be available.');
        }
      }
      const response = await api.patch('/providers/me/availability', { availability_status: status, ...location });
      setProvider((current) => ({ ...current, availability_status: response.data.availability_status, latitude: response.data.latitude, longitude: response.data.longitude }));
      toast.success(status === 'available' ? 'You are available for eligible requests' : 'Status set to ' + status);
    } catch (error) {
      toast.error(error.response?.data?.detail || error.message || 'Could not update availability');
    } finally {
      setAvailabilitySaving(false);
    }
  };

  if (loading && !provider) {
    return <div className="resqly-shell"><div className="resqly-frame flex min-h-screen items-center justify-center text-slate-500">Loading your workspace…</div></div>;
  }

  if (!provider && providerError) {
    return (
      <div className="resqly-shell">
        <div className="resqly-frame min-h-screen p-6 flex items-center justify-center">
          <div className="resqly-card p-5 max-w-sm w-full">
            <AlertCircle className="w-6 h-6 text-rose-700" aria-hidden="true" />
            <h1 className="font-bold text-lg mt-3">Workspace unavailable</h1>
            <p className="text-sm text-slate-600 mt-1">{providerError}</p>
            <Button onClick={load} className="w-full mt-4"><RefreshCw className="w-4 h-4 mr-2" />Try again</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!provider) return null;
  const activeOrders = orders.filter((order) => !CLOSED_STATES.has(String(order.status || '').toLowerCase()));
  const isMarketplaceProvider = provider.category === 'pharmacy' || provider.category === 'lab_test';
  const availability = AVAIL.find((item) => item.key === provider.availability_status) || AVAIL[2];
  const firstName = (provider.name || 'there').trim().split(/\s+/)[0];
  const completion = Math.max(0, Math.min(100, Number(provider.profile_completion) || 0));

  return (
    <div className="resqly-shell resqly-provider-page">
      <div className="resqly-frame resqly-provider-frame flex flex-col min-h-screen">
        <header className="provider-masthead">
          <div className="provider-brand-row">
            <Logo size={32} />
            <button type="button" aria-label="Open profile" onClick={() => navigate('/provider/profile')} className="provider-profile-button">
              <UserIcon className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
          <div className="provider-welcome-row">
            <div className="provider-avatar">{(provider.name || 'R').charAt(0).toUpperCase()}</div>
            <div className="min-w-0 flex-1">
              <p className="provider-welcome-kicker">YOUR RANGER WORKSPACE</p>
              <h1>Welcome, {firstName}</h1>
              <p className="provider-role">{humanize(provider.category || 'Healthcare professional')} · Ranger</p>
            </div>
            <span className="provider-verification-tag"><ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" /> Verified</span>
          </div>
          <div className="provider-progress-wrap">
            <div className="provider-progress-label"><span>Profile completion</span><strong>{completion}%</strong></div>
            <div className="provider-progress-track" role="progressbar" aria-label="Profile completion" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completion}><span style={{ width: completion + '%' }} /></div>
          </div>
        </header>

        <main className="flex-1 pb-6">
          <section className="provider-availability-section">
            <div className="provider-availability-card">
              <div className="provider-availability-heading">
                <div>
                  <span className="provider-section-eyebrow">CONTROL YOUR WORKDAY</span>
                  <h2>Are you taking requests?</h2>
                </div>
                <span className={'provider-live-dot ' + (provider.availability_status === 'available' ? 'is-live' : '')} aria-hidden="true" />
              </div>
              <p className="provider-availability-description">{availability.desc}</p>
              <div className="provider-availability-options" role="group" aria-label="Choose your availability">
                {AVAIL.map((item) => (
                  <button
                    type="button"
                    data-testid={'avail-' + item.key}
                    key={item.key}
                    disabled={availabilitySaving}
                    onClick={() => setAvail(item.key)}
                    aria-pressed={provider.availability_status === item.key}
                    className={'provider-availability-option' + (provider.availability_status === item.key ? ' selected selected-' + item.key : '')}
                  >
                    <span className={'provider-status-dot ' + item.color} aria-hidden="true" />
                    {item.label}
                  </button>
                ))}
              </div>
              {availabilitySaving && <p className="provider-saving-note" role="status">Updating your availability…</p>}
            </div>
          </section>

          <section className="provider-work-section">
            <div className="provider-section-heading">
              <div>
                <span className="provider-section-eyebrow">FIRST THINGS FIRST</span>
                <h2>Active work <span className="provider-count">{ordersError ? '—' : activeOrders.length}</span></h2>
                <p>Accepted requests and what needs your attention.</p>
              </div>
              <button type="button" onClick={() => navigate('/provider/orders')} className="provider-view-all">All work <ArrowRight className="w-4 h-4" aria-hidden="true" /></button>
            </div>

            {ordersError ? (
              <div role="alert" className="provider-empty-state provider-error-state">
                <AlertCircle className="w-6 h-6 text-rose-600" aria-hidden="true" />
                <h3>We couldn’t load your work</h3>
                <p>Your dashboard is still here. Refresh to check your active orders again.</p>
                <Button variant="outline" onClick={load} className="w-full mt-3 min-h-[46px]"><RefreshCw className="w-4 h-4 mr-2" /> Try again</Button>
              </div>
            ) : activeOrders.length ? (
              <div className="provider-order-list">
                {activeOrders.slice(0, 4).map((order) => (
                  <article key={order.id} className="provider-order-card">
                    <div className="provider-order-card-top">
                      <div className="provider-order-type"><ClipboardList className="w-4 h-4" aria-hidden="true" /> {humanize(order.service_type || 'Service')}</div>
                      <span className="provider-order-status">{friendlyStatus(String(order.status || 'accepted').toLowerCase())}</span>
                    </div>
                    <h3>{order.customer_name || 'Customer'}</h3>
                    <p className="provider-order-reference">Order #{String(order.id).slice(0, 8)}</p>
                    <div className="provider-order-card-bottom">
                      <div><span>Order amount</span><strong>₹{order.amount ?? '—'}</strong></div>
                      <Button onClick={() => navigate('/provider/orders')} variant="outline" className="min-h-[44px]">View work <ArrowRight className="w-4 h-4 ml-1" /></Button>
                    </div>
                  </article>
                ))}
                {activeOrders.length > 4 && <button type="button" className="provider-more-orders" onClick={() => navigate('/provider/orders')}>View all {activeOrders.length} active orders <ArrowRight className="w-4 h-4" /></button>}
              </div>
            ) : (
              <div className="provider-empty-state">
                <div className="provider-empty-icon"><CheckCircle2 className="w-6 h-6" aria-hidden="true" /></div>
                <h3>You’re all caught up</h3>
                <p>{isMarketplaceProvider ? 'Accepted work will appear here. New customer requests are in Live Requests.' : provider.category === 'doctor' ? 'Online consultation requests are managed in your doctor workspace.' : 'When a request is accepted, it will appear here with the next step.'}</p>
                {isMarketplaceProvider && <Button onClick={() => navigate('/provider/marketplace')} className="w-full mt-4 min-h-[48px]"><Zap className="w-4 h-4 mr-2" /> Open Live Requests</Button>}
                {provider.category === 'doctor' && <Button onClick={() => navigate('/provider/doctor-requests')} className="w-full mt-4 min-h-[48px]"><ClipboardList className="w-4 h-4 mr-2" /> Open consultation requests</Button>}
              </div>
            )}
          </section>

          <section className="provider-snapshot-section">
            <div className="provider-section-heading">
              <div>
                <span className="provider-section-eyebrow">AT A GLANCE</span>
                <h2>Your snapshot</h2>
                <p>A quick look at how things are going.</p>
              </div>
            </div>
            <div className="provider-stat-grid">
              <Kpi icon={<CircleDollarSign className="w-5 h-5" />} label="Earned today" value={earningsError ? '—' : '₹' + (earnings.today ?? 0)} tone="blue" />
              <Kpi icon={<ClipboardList className="w-5 h-5" />} label="Total orders" value={ordersError ? '—' : orders.length} tone="mint" />
              <Kpi icon={<Star className="w-5 h-5" />} label="Your rating" value={reviewsError ? '—' : (reviews.average || provider.rating || 'New')} tone="amber" />
              <Kpi icon={<ShieldCheck className="w-5 h-5" />} label="Verification" value={provider.approval_status === 'approved' ? 'Approved' : 'Pending'} tone="mint" />
            </div>
            {(earningsError || reviewsError) && <div role="status" className="provider-data-note">Some figures are temporarily unavailable. <button type="button" onClick={load}>Refresh summary</button></div>}
            <div className="provider-monthly-row"><span><CircleDollarSign className="w-4 h-4" aria-hidden="true" /> Earned this month</span><strong>{earningsError ? '—' : '₹' + (earnings.monthly ?? 0)}</strong></div>
          </section>

          <section className="provider-shortcuts-section">
            <div className="provider-section-heading">
              <div>
                <span className="provider-section-eyebrow">NEED SOMETHING ELSE?</span>
                <h2>Quick links</h2>
              </div>
            </div>
            <div className="provider-shortcut-list">
              {isMarketplaceProvider && <Action testid="qa-marketplace" icon={<ClipboardList className="w-5 h-5" />} label={provider.category === 'pharmacy' ? 'Pharmacy requests' : 'Lab requests'} description="Review new customer requests" onClick={() => navigate('/provider/marketplace')} />}
              {provider.category === 'doctor' && <Action testid="qa-doctor-requests" icon={<ClipboardList className="w-5 h-5" />} label="Doctor consultation requests" description="Review online consultations and join accepted calls" onClick={() => navigate('/provider/doctor-requests')} />}
              <Action testid="qa-orders" icon={<Activity className="w-5 h-5" />} label="My work" description="View accepted and past orders" onClick={() => navigate('/provider/orders')} />
              <Action testid="qa-earnings" icon={<CircleDollarSign className="w-5 h-5" />} label="Earnings" description="See your payment summary" onClick={() => navigate('/provider/earnings')} />
              <Action testid="qa-reviews" icon={<Star className="w-5 h-5" />} label="Reviews" description="Read customer feedback" onClick={() => navigate('/provider/reviews')} />
              <Action testid="qa-documents" icon={<FileText className="w-5 h-5" />} label="Documents & verification" description="Manage your submitted details" onClick={() => navigate('/provider/documents')} />
              <Action testid="qa-support" icon={<LifeBuoy className="w-5 h-5" />} label="Get support" description="We’re here when you need help" onClick={() => navigate('/provider/support')} />
              <Action testid="qa-profile" icon={<UserIcon className="w-5 h-5" />} label="Profile & account" description="Update your details and preferences" onClick={() => navigate('/provider/profile')} />
            </div>
            {completion < 100 && (
              <button type="button" className="provider-completion-nudge" onClick={() => navigate('/provider/profile')}>
                <span className="provider-completion-icon"><UserIcon className="w-5 h-5" aria-hidden="true" /></span>
                <span className="flex-1 text-left"><strong>Finish setting up your profile</strong><span>It’s {completion}% complete. Add missing details when you have a moment.</span></span>
                <ArrowUpRight className="w-5 h-5" aria-hidden="true" />
              </button>
            )}
          </section>
        </main>
        <BottomNav variant="provider" />
      </div>
    </div>
  );
}

function Kpi({ icon, label, value, tone }) {
  return (
    <div className={'provider-stat-card tone-' + tone}>
      <span className="provider-stat-icon">{icon}</span>
      <span className="provider-stat-label">{label}</span>
      <strong className="provider-stat-value">{value}</strong>
    </div>
  );
}

function Action({ icon, label, description, onClick, testid }) {
  return (
    <button type="button" data-testid={testid} onClick={onClick} className="provider-shortcut-row">
      <span className="provider-shortcut-icon">{icon}</span>
      <span className="provider-shortcut-copy"><strong>{label}</strong><span>{description}</span></span>
      <ChevronRight className="w-5 h-5 provider-shortcut-chevron" aria-hidden="true" />
    </button>
  );
}

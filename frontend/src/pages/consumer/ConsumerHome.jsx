import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import BottomNav from '@/components/BottomNav';
import Logo from '@/components/Logo';
import { CONSUMER_SERVICES } from '@/lib/constants';

function greetingFor(name) {
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const first = (name || '').trim().split(/\s+/)[0];
  return { greet, first: first || 'there' };
}

function readableStatus(status) {
  const labels = {
    broadcasting: 'Finding providers',
    quotations_received: 'Offers are ready',
    payment_verified: 'Finding your doctor',
    accepted: 'Accepted',
    in_call: 'Consultation in progress',
    in_progress: 'In progress',
    order_placed: 'Order placed',
    completed: 'Completed',
    cancelled: 'Cancelled',
    expired: 'Expired',
    refunded_no_doctor: 'Refund started',
    refunded_no_show: 'Refund started',
    refund_pending: 'Refund needs support',
    payment_pending: 'Checking payment',
    payment_expiring: 'Checking payment',
    refund_processing: 'Checking refund',
    payment_expired: 'Payment not taken',
    refunded_abandoned_checkout: 'Refund started',
  };
  return labels[status] || String(status || 'In progress').replaceAll('_', ' ');
}

function availabilityClass(kind) {
  if (kind === 'urgent') return 'resqly-status resqly-status-urgent';
  if (kind === 'active') return 'resqly-status resqly-status-active';
  if (kind === 'waitlist') return 'resqly-status resqly-status-waitlist';
  return 'resqly-status resqly-status-soon';
}

export default function ConsumerHome() {
  const { me } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeRequest, setActiveRequest] = useState(null);
  const [loadingActive, setLoadingActive] = useState(true);
  const [requestError, setRequestError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let mounted = true;
    api.get('/notifications').then(({ data }) => {
      if (mounted) setUnreadCount((data.notifications || []).filter((item) => !item.read).length);
    }).catch(() => {});
    // Service discovery stays available if the optional active-request endpoint is offline.
    api.get('/marketplace/requests/mine/active').then(({ data }) => {
      if (mounted) setActiveRequest(data.request || null);
    }).catch((error) => {
      if (!mounted) return;
      setRequestError(error.response?.status !== 404);
    }).finally(() => {
      if (mounted) setLoadingActive(false);
    });
    return () => { mounted = false; };
  }, [refreshKey]);

  const { greet, first } = greetingFor(me && me.name);
  const locationLabel = (me && (me.location || me.city)) || 'Set your location';
  const query = search.trim().toLowerCase();
  const filteredServices = useMemo(() => CONSUMER_SERVICES.filter((service) => {
    if (!query) return true;
    return [service.label, service.subtitle, service.availability, service.key]
      .some((value) => String(value || '').toLowerCase().includes(query));
  }), [query]);
  const activeRequestTarget = activeRequest && ['pharmacy', 'lab_test'].includes(activeRequest.service_type)
    ? '/consumer/service/' + activeRequest.service_type + '?request_id=' + encodeURIComponent(activeRequest.id)
    : '/consumer/requests';

  return (
    <div className="resqly-shell resqly-home-page">
      <div className="resqly-frame resqly-home-frame flex flex-col min-h-screen">
        <header className="resqly-home-header">
          <div className="resqly-home-brand-row">
            <Link to="/consumer/home" aria-label="Resqly home" className="resqly-home-brand">
              <Logo size={32} />
            </Link>
            <button
              type="button"
              aria-label={unreadCount ? 'Notifications, ' + unreadCount + ' unread' : 'Notifications'}
              data-testid="home-notifications"
              onClick={() => navigate('/consumer/notifications')}
              className="resqly-notification-button"
            >
              <Bell className="w-5 h-5" aria-hidden="true" />
              {unreadCount > 0 && <span className="resqly-notification-dot" />}
            </button>
          </div>
          <button
            type="button"
            data-testid="home-location"
            onClick={() => navigate('/consumer/location')}
            className="resqly-location-control"
          >
            <span className="resqly-location-pin"><MapPin className="w-4 h-4" aria-hidden="true" /></span>
            <span className="min-w-0 flex-1 text-left">
              <span className="resqly-location-caption">YOUR LOCATION</span>
              <span className="resqly-location-value">{locationLabel}</span>
            </span>
            <ChevronDown className="w-4 h-4 resqly-location-chevron" aria-hidden="true" />
          </button>
        </header>

        <main className="flex-1 pb-5">
          <section className="resqly-home-hero">
            <div className="resqly-hero-orb resqly-hero-orb-one" aria-hidden="true" />
            <div className="resqly-hero-orb resqly-hero-orb-two" aria-hidden="true" />
            <div className="resqly-home-hero-content">
              <span className="resqly-hero-kicker"><Sparkles className="w-3.5 h-3.5" aria-hidden="true" /> CARE, WITHOUT THE CONFUSION</span>
              <p className="resqly-home-greeting">{greet}, {first}</p>
              <h1>How can we help you today?</h1>
              <p className="resqly-home-hero-copy">Find the right care, understand what happens next, and keep everything in one place.</p>
              <label className="resqly-home-search">
                <Search className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                <span className="sr-only">Search healthcare services</span>
                <input
                  data-testid="home-service-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search doctors, medicines, lab tests…"
                  autoComplete="off"
                />
                {search && <button type="button" onClick={() => setSearch('')} aria-label="Clear search" className="resqly-search-clear"><X className="w-4 h-4" /></button>}
              </label>
              <div className="resqly-search-hints" aria-label="Popular searches">
                <span>Try:</span>
                <button type="button" onClick={() => setSearch('doctor')}>Doctors</button>
                <button type="button" onClick={() => setSearch('medicine')}>Medicines</button>
                <button type="button" onClick={() => setSearch('lab')}>Lab tests</button>
              </div>
            </div>
          </section>

          <section className="resqly-emergency-wrap" aria-labelledby="emergency-heading">
            <div className="resqly-emergency-card">
              <div className="resqly-emergency-icon"><Icons.Ambulance className="w-6 h-6" aria-hidden="true" /></div>
              <div className="resqly-emergency-copy">
                <span className="resqly-emergency-eyebrow">NEED URGENT HELP?</span>
                <h2 id="emergency-heading">Call an ambulance</h2>
                <p>For an immediate emergency, call India’s ambulance number.</p>
                <a data-testid="home-emergency-sos" href="tel:108" className="resqly-call-108">Call 108 <ArrowUpRight className="w-4 h-4" aria-hidden="true" /></a>
                <button type="button" className="resqly-emergency-details" onClick={() => navigate('/consumer/emergency-request')}>Explore Resqly emergency options</button>
              </div>
              <span className="resqly-emergency-decoration" aria-hidden="true"><Activity className="w-14 h-14" /></span>
            </div>
            <p className="resqly-emergency-note"><ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" /> Resqly does not dispatch ambulances yet. Call 108 for immediate help.</p>
          </section>

          <section className="resqly-services-section" id="explore-care" aria-labelledby="explore-heading">
            <div className="resqly-section-heading">
              <div>
                <span className="resqly-section-eyebrow">YOUR NEXT STEP</span>
                <h2 id="explore-heading">Explore care</h2>
                <p>Pick a service to see what’s available.</p>
              </div>
              <Link to="/consumer/requests" className="resqly-text-link">My requests <ArrowRight className="w-4 h-4" aria-hidden="true" /></Link>
            </div>
            {filteredServices.length > 0 ? (
              <div className="resqly-service-grid">
                {filteredServices.map((service) => {
                  const Icon = Icons[service.icon] || Icons.Activity;
                  return (
                    <Link
                      data-testid={'service-' + service.key}
                      key={service.key}
                      to={service.key === 'ambulance' ? '/consumer/emergency-request' : '/consumer/service/' + service.key}
                      className="resqly-service-card"
                    >
                      <span className="resqly-service-card-top">
                        <span className="resqly-service-icon" style={{ background: service.bg, color: service.fg }}>
                          <Icon size={24} strokeWidth={2.1} aria-hidden="true" />
                        </span>
                        <span className={availabilityClass(service.availabilityKind)}>{service.availability}</span>
                      </span>
                      <span className="resqly-service-card-title">{service.label}<ChevronRight className="w-4 h-4" aria-hidden="true" /></span>
                      <span className="resqly-service-card-subtitle">{service.subtitle}</span>
                      <span className="resqly-service-card-action">{service.availabilityKind === 'active' ? 'Explore options' : service.availabilityKind === 'urgent' ? 'Emergency help' : service.availabilityKind === 'waitlist' ? 'See availability' : 'View details'} <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" /></span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="resqly-empty-search">
                <Search className="w-7 h-7" aria-hidden="true" />
                <h3>No services found for “{search}”</h3>
                <p>Try a different word, like doctor, medicine, or lab test.</p>
                <button type="button" onClick={() => setSearch('')}>Show all services</button>
              </div>
            )}
          </section>

          <section className="resqly-progress-section" aria-labelledby="request-heading">
            <div className="resqly-progress-card">
              <div className="resqly-progress-icon"><Activity className="w-5 h-5" aria-hidden="true" /></div>
              <div className="resqly-progress-content">
                <div className="resqly-progress-heading">
                  <div>
                    <span className="resqly-section-eyebrow">STAY IN THE LOOP</span>
                    <h2 id="request-heading">Your request progress</h2>
                  </div>
                  <Clock3 className="w-5 h-5 text-slate-400" aria-hidden="true" />
                </div>
                {loadingActive ? (
                  <p className="resqly-progress-description" role="status">Checking for an active request…</p>
                ) : activeRequest ? (
                  <>
                    <p className="resqly-progress-description">{String(activeRequest.service_type || 'Healthcare').replaceAll('_', ' ')} · {readableStatus(activeRequest.status)}</p>
                    <button type="button" className="resqly-progress-action" onClick={() => navigate(activeRequestTarget)}>View your request <ArrowRight className="w-4 h-4" aria-hidden="true" /></button>
                  </>
                ) : requestError ? (
                  <>
                    <p className="resqly-progress-description">We couldn’t check right now. Your other services are still available.</p>
                    <button type="button" className="resqly-progress-action" onClick={() => { setLoadingActive(true); setRequestError(false); setRefreshKey((value) => value + 1); }}>Try again <ArrowRight className="w-4 h-4" aria-hidden="true" /></button>
                  </>
                ) : (
                  <>
                    <p className="resqly-progress-description">When you request medicine or lab offers, you’ll see updates here.</p>
                    <button type="button" className="resqly-progress-action" onClick={() => navigate('/consumer/requests')}>View all requests <ArrowRight className="w-4 h-4" aria-hidden="true" /></button>
                  </>
                )}
              </div>
            </div>
          </section>

          <section className="resqly-how-section" aria-label="How Resqly works">
            <div className="resqly-how-heading"><CheckCircle2 className="w-4 h-4" aria-hidden="true" /> A clearer way to get care</div>
            <div className="resqly-how-steps">
              <div><span>01</span><p>Choose a service</p></div>
              <div><span>02</span><p>Tell us what you need</p></div>
              <div><span>03</span><p>Follow your updates</p></div>
            </div>
          </section>

          <section className="resqly-ranger-promo">
            <div className="resqly-ranger-icon"><Icons.Stethoscope className="w-5 h-5" aria-hidden="true" /></div>
            <div className="flex-1 min-w-0">
              <h2>Are you a healthcare professional?</h2>
              <p>Join the Resqly Ranger network.</p>
            </div>
            <button type="button" onClick={() => navigate('/provider/login')} aria-label="Join as a Resqly Ranger"><ArrowUpRight className="w-5 h-5" aria-hidden="true" /></button>
          </section>
        </main>
        <BottomNav variant="consumer" />
      </div>
    </div>
  );
}

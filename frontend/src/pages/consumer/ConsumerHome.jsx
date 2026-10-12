import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { ArrowRight, ArrowUpRight, Bell, ChevronDown, ChevronRight, MapPin, Search, ShieldCheck, Sparkles, Stethoscope, X } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import BottomNav from '@/components/BottomNav';
import Logo from '@/components/Logo';
import { CONSUMER_SERVICES } from '@/lib/constants';

const SERVICE_DETAILS = {
  ambulance: { subtitle: 'Urgent help and emergency options', availability: 'Emergency', kind: 'urgent' },
  bystander: { subtitle: 'Personal support for everyday care', availability: 'Explore options', kind: 'soon' },
  home_care: { subtitle: 'Help with care at home', availability: 'Explore options', kind: 'soon' },
  home_nursing: { subtitle: 'Nursing support at home', availability: 'Explore options', kind: 'soon' },
  lab_test: { subtitle: 'Explore lab tests and bookings', availability: 'Lab tests', kind: 'active' },
  pharmacy: { subtitle: 'Find medicines and pharmacy options', availability: 'Pharmacy', kind: 'active' },
  pet_care: { subtitle: 'Healthcare for your pets', availability: 'Explore options', kind: 'soon' },
  doctor: { subtitle: 'Online consultations and home visits', availability: 'Online & home', kind: 'active' },
};

function greetingFor(name) {
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const first = (name || '').trim().split(/\s+/)[0];
  return { greet, first: first || 'there' };
}

function availabilityClass(kind) {
  if (kind === 'urgent') return 'resqly-status resqly-status-urgent';
  if (kind === 'active') return 'resqly-status resqly-status-active';
  return 'resqly-status resqly-status-soon';
}

export default function ConsumerHome() {
  const { me } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [stats, setStats] = useState({ total: 0 });
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/waitlist/stats').then(({ data }) => setStats(data)).catch(() => {});
    api.get('/notifications').then(({ data }) => {
      setUnreadCount((data.notifications || []).filter((notification) => !notification.read).length);
    }).catch(() => {});
  }, []);

  const { greet, first } = greetingFor(me && me.name);
  const locationLabel = (me && (me.location || me.city)) || 'Set your location';
  const query = search.trim().toLowerCase();
  const filteredServices = useMemo(() => CONSUMER_SERVICES.filter((service) => {
    const details = SERVICE_DETAILS[service.key] || {};
    return !query || [service.label, service.key, details.subtitle, details.availability]
      .some((value) => String(value || '').toLowerCase().includes(query));
  }), [query]);

  return (
    <div className="resqly-shell resqly-home-page">
      <div className="resqly-frame resqly-home-frame flex flex-col min-h-screen">
        <header className="resqly-home-header">
          <div className="resqly-home-brand-row">
            <Link to="/consumer/home" aria-label="Resqly home" className="resqly-home-brand"><Logo size={32} /></Link>
            <div className="flex items-center gap-2">
              <button type="button" aria-label="Open SOS Vault" data-testid="home-sos-vault" onClick={() => navigate('/consumer/sos-vault')}
                className="inline-flex items-center gap-1.5 min-h-[44px] rounded-2xl border border-rose-100 bg-rose-50 px-3 text-xs font-bold text-rose-700">
                <ShieldCheck className="w-4 h-4" aria-hidden="true" /> SOS Vault
              </button>
              <button type="button" aria-label={unreadCount ? 'Notifications, ' + unreadCount + ' unread' : 'Notifications'}
                data-testid="home-notifications" onClick={() => navigate('/consumer/notifications')} className="resqly-notification-button">
                <Bell className="w-5 h-5" aria-hidden="true" />
                {unreadCount > 0 && <span className="resqly-notification-dot" />}
              </button>
            </div>
          </div>
          <button type="button" data-testid="home-location" onClick={() => navigate('/consumer/location')} className="resqly-location-control">
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
              <p className="resqly-home-hero-copy">Choose a care service, see your options, and keep your next step clear.</p>
              <label className="resqly-home-search">
                <Search className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                <span className="sr-only">Search healthcare services</span>
                <input data-testid="home-service-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search doctors, medicines, lab tests…" autoComplete="off" />
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
                <p>For an immediate emergency, call India’s ambulance number directly.</p>
                <a data-testid="home-call-108" href="tel:108" className="resqly-call-108">Call 108 <ArrowUpRight className="w-4 h-4" aria-hidden="true" /></a>
                <button type="button" data-testid="home-emergency-sos" className="resqly-emergency-details" onClick={() => navigate('/consumer/emergency-request')}>Explore Resqly emergency options</button>
              </div>
            </div>
            <p className="resqly-emergency-note"><ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" /> Resqly is not a substitute for emergency services. Call 108 for immediate help.</p>
          </section>

          <section className="resqly-services-section" id="explore-care" aria-labelledby="explore-heading">
            <div className="resqly-section-heading">
              <div><span className="resqly-section-eyebrow">YOUR NEXT STEP</span><h2 id="explore-heading">Explore care</h2><p>Choose a service to see how it works.</p></div>
            </div>
            {filteredServices.length ? (
              <div className="resqly-service-grid">
                {filteredServices.map((service) => {
                  const Icon = Icons[service.icon] || Icons.Activity;
                  const details = SERVICE_DETAILS[service.key] || { subtitle: 'Explore this service', availability: 'Explore options', kind: 'soon' };
                  const target = service.key === 'ambulance' ? '/consumer/emergency-request' : '/consumer/service/' + service.key;
                  return (
                    <Link data-testid={'service-' + service.key} key={service.key} to={target} className="resqly-service-card">
                      <span className="resqly-service-card-top">
                        <span className="resqly-service-icon" style={{ background: service.bg, color: service.fg }}><Icon size={24} strokeWidth={2.1} aria-hidden="true" /></span>
                        <span className={availabilityClass(details.kind)}>{details.availability}</span>
                      </span>
                      <span className="resqly-service-card-title">{service.label}<ChevronRight className="w-4 h-4" aria-hidden="true" /></span>
                      <span className="resqly-service-card-subtitle">{details.subtitle}</span>
                      <span className="resqly-service-card-action">{service.key === 'ambulance' ? 'Emergency help' : service.key === 'doctor' ? 'View consultations' : service.key === 'pharmacy' || service.key === 'lab_test' ? 'View options' : 'Explore service'} <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" /></span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="resqly-empty-search"><Search className="w-7 h-7" aria-hidden="true" /><h3>No services found for “{search}”</h3>
                <p>Try a different search, such as doctor, medicine or lab test.</p><button type="button" onClick={() => setSearch('')}>Show all services</button>
              </div>
            )}
          </section>

          <section className="resqly-progress-section" aria-labelledby="waitlist-heading">
            <div className="resqly-progress-card">
              <div className="resqly-progress-icon"><Sparkles className="w-5 h-5" aria-hidden="true" /></div>
              <div className="resqly-progress-content">
                <div className="resqly-progress-heading"><div><span className="resqly-section-eyebrow">STAY IN THE LOOP</span><h2 id="waitlist-heading">Join the priority list</h2></div><ShieldCheck className="w-5 h-5 text-slate-400" aria-hidden="true" /></div>
                <p className="resqly-progress-description">{Number(stats.total) || 0} people have joined the Resqly priority list. Sign up to stay informed as services expand.</p>
                <button type="button" className="resqly-progress-action" onClick={() => navigate('/consumer/waitlist')}>Join waitlist <ArrowRight className="w-4 h-4" aria-hidden="true" /></button>
              </div>
            </div>
          </section>

          <section className="resqly-how-section" aria-label="How Resqly works">
            <div className="resqly-how-heading"><Sparkles className="w-4 h-4" aria-hidden="true" /> Care without the guesswork</div>
            <div className="resqly-how-steps"><div><span>01</span><p>Choose a service</p></div><div><span>02</span><p>Tell us what you need</p></div><div><span>03</span><p>Follow the next step</p></div></div>
          </section>

          <section className="resqly-ranger-promo">
            <div className="resqly-ranger-icon"><Stethoscope className="w-5 h-5" aria-hidden="true" /></div>
            <div className="flex-1 min-w-0"><h2>Are you a healthcare professional?</h2><p>Join the Resqly Ranger network.</p></div>
            <button type="button" onClick={() => navigate('/provider/login')} aria-label="Join as a Resqly Ranger"><ArrowUpRight className="w-5 h-5" aria-hidden="true" /></button>
          </section>
        </main>
        <BottomNav variant="consumer" />
      </div>
    </div>
  );
}

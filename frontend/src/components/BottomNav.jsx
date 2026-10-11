import { useLocation, useNavigate } from 'react-router-dom';
import { Home, ClipboardList, FileText, User, Stethoscope, Pill, FlaskConical } from 'lucide-react';

const CONSUMER_TABS = [
  { key: 'home', label: 'Home', icon: Home, path: '/consumer/home' },
  { key: 'requests', label: 'My Requests', icon: ClipboardList, path: '/consumer/requests' },
  { key: 'prescriptions', label: 'Prescriptions', icon: FileText, path: '/consumer/prescriptions' },
  { key: 'profile', label: 'Profile', icon: User, path: '/consumer/profile' },
];

const PROVIDER_TABS = [
  { key: 'home', label: 'Home', icon: Home, path: '/provider/dashboard' },
  { key: 'work', label: 'Work', icon: ClipboardList, path: '/provider/orders' },
  { key: 'earnings', label: 'Earnings', icon: FileText, path: '/provider/earnings' },
  { key: 'profile', label: 'Profile', icon: User, path: '/provider/profile' },
];

export default function BottomNav({ variant = 'consumer' }) {
  const tabs = variant === 'provider' ? PROVIDER_TABS : CONSUMER_TABS;
  const navigate = useNavigate();
  const loc = useLocation();

  return (
    <nav aria-label={variant === 'provider' ? 'Provider navigation' : 'Main navigation'} className="sticky bottom-0 left-0 right-0 z-30 px-3 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pointer-events-none">
      <div className="glass-dock mx-auto flex items-center justify-around p-1.5 pointer-events-auto" style={{ maxWidth: 440 }}>
        {tabs.map((t) => {
          const active = loc.pathname === t.path || loc.pathname.startsWith(t.path + '/');
          const Icon = t.icon;
          return (
            <button
              type="button"
              aria-label={t.label}
              aria-current={active ? 'page' : undefined}
              data-testid={`nav-${variant}-${t.key}`}
              key={t.key}
              onClick={() => navigate(t.path)}
              className={`glass-dock-tab flex flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 min-w-[64px] min-h-[52px] ${active ? 'active' : 'text-slate-600'}`}
            >
              <Icon className="w-[19px] h-[19px]" strokeWidth={active ? 2.35 : 1.9} aria-hidden="true" />
              <span className="text-[11px] font-semibold tracking-tight">{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

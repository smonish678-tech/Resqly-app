import { useLocation, useNavigate } from 'react-router-dom';
import { Home, ClipboardList, FileText, User } from 'lucide-react';

const CONSUMER_TABS = [
  { key: 'home', label: 'Home', icon: Home, path: '/consumer/home' },
  { key: 'requests', label: 'My requests', icon: ClipboardList, path: '/consumer/requests' },
  { key: 'prescriptions', label: 'Prescriptions', icon: FileText, path: '/consumer/prescriptions' },
  { key: 'profile', label: 'Profile', icon: User, path: '/consumer/profile' },
];

const PROVIDER_TABS = [
  { key: 'home', label: 'Home', icon: Home, path: '/provider/dashboard' },
  { key: 'work', label: 'My work', icon: ClipboardList, path: '/provider/orders' },
  { key: 'earnings', label: 'Earnings', icon: FileText, path: '/provider/earnings' },
  { key: 'profile', label: 'Profile', icon: User, path: '/provider/profile' },
];

export default function BottomNav({ variant = 'consumer' }) {
  const tabs = variant === 'provider' ? PROVIDER_TABS : CONSUMER_TABS;
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav
      aria-label={variant === 'provider' ? 'Provider navigation' : 'Main navigation'}
      className="resqly-bottom-nav"
    >
      <div className="glass-dock">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path || location.pathname.startsWith(tab.path + '/');
          const Icon = tab.icon;
          return (
            <button
              type="button"
              aria-label={tab.label}
              aria-current={active ? 'page' : undefined}
              data-testid={'nav-' + variant + '-' + tab.key}
              key={tab.key}
              onClick={() => navigate(tab.path)}
              className={'glass-dock-tab' + (active ? ' active' : '')}
            >
              <span className="resqly-bottom-nav-icon"><Icon aria-hidden="true" strokeWidth={active ? 2.25 : 1.8} /></span>
              <span className="resqly-bottom-nav-label">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

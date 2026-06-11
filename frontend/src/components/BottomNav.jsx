import { useLocation, useNavigate } from 'react-router-dom';
import { Home, ClipboardList, Heart, User } from 'lucide-react';

const CONSUMER_TABS = [
  { key: 'home', label: 'Home', icon: Home, path: '/consumer/home' },
  { key: 'waitlist', label: 'Waitlist', icon: ClipboardList, path: '/consumer/waitlist' },
  { key: 'emergency', label: 'Emergency', icon: Heart, path: '/consumer/emergency' },
  { key: 'profile', label: 'Profile', icon: User, path: '/consumer/profile' },
];

const PROVIDER_TABS = [
  { key: 'home', label: 'Home', icon: Home, path: '/provider/dashboard' },
  { key: 'orders', label: 'Orders', icon: ClipboardList, path: '/provider/orders' },
  { key: 'earnings', label: 'Earnings', icon: Heart, path: '/provider/earnings' },
  { key: 'profile', label: 'Profile', icon: User, path: '/provider/profile' },
];

export default function BottomNav({ variant = 'consumer' }) {
  const tabs = variant === 'provider' ? PROVIDER_TABS : CONSUMER_TABS;
  const navigate = useNavigate();
  const loc = useLocation();
  return (
    <div className="sticky bottom-0 left-0 right-0 z-20 bg-white border-t border-slate-200">
      <div className="flex items-center justify-around py-2">
        {tabs.map((t) => {
          const active = loc.pathname === t.path;
          const Icon = t.icon;
          return (
            <button
              data-testid={`nav-${variant}-${t.key}`}
              key={t.key}
              onClick={() => navigate(t.path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 ${active ? 'text-blue-700' : 'text-slate-500'}`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] font-medium">{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

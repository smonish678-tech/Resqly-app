import { useLocation, useNavigate } from 'react-router-dom';
import { Home, FileText, FlaskConical, Users, User } from 'lucide-react';

const CONSUMER_TABS = [
  { key: 'home', label: 'Home', icon: Home, path: '/consumer/home' },
  { key: 'prescriptions', label: 'Prescriptions', icon: FileText, path: '/consumer/prescriptions' },
  { key: 'lab', label: 'Lab Tests', icon: FlaskConical, path: '/consumer/lab-tests' },
  { key: 'family', label: 'Family', icon: Users, path: '/consumer/family' },
  { key: 'profile', label: 'Profile', icon: User, path: '/consumer/profile' },
];

const PROVIDER_TABS = [
  { key: 'home', label: 'Home', icon: Home, path: '/provider/dashboard' },
  { key: 'orders', label: 'Orders', icon: FileText, path: '/provider/orders' },
  { key: 'earnings', label: 'Earnings', icon: FlaskConical, path: '/provider/earnings' },
  { key: 'profile', label: 'Profile', icon: User, path: '/provider/profile' },
];

export default function BottomNav({ variant = 'consumer' }) {
  const tabs = variant === 'provider' ? PROVIDER_TABS : CONSUMER_TABS;
  const navigate = useNavigate();
  const loc = useLocation();

  return (
    <div className="sticky bottom-0 left-0 right-0 z-30 pb-3 pt-2 px-3 pointer-events-none">
      <div className="glass-dock mx-auto flex items-center justify-around p-1.5 pointer-events-auto" style={{ maxWidth: 440 }}>
        {tabs.map((t) => {
          const active = loc.pathname.startsWith(t.path);
          const Icon = t.icon;
          return (
            <button
              data-testid={`nav-${variant}-${t.key}`}
              key={t.key}
              onClick={() => navigate(t.path)}
              className={`glass-dock-tab flex flex-col items-center gap-0.5 rounded-2xl px-3 py-2 min-w-[56px] ${active ? 'active' : 'text-slate-600'}`}
            >
              <Icon className="w-[18px] h-[18px]" strokeWidth={active ? 2.4 : 2} />
              <span className="text-[10px] font-semibold tracking-tight">{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

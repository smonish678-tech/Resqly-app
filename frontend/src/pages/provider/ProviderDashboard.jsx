import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Star, ShieldCheck, CircleDollarSign, ClipboardList, FileText, LifeBuoy, User as UserIcon, Bell, Activity, ChevronRight, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import BottomNav from '@/components/BottomNav';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';

const AVAIL = [
  { key: 'available', label: 'Available', color: 'bg-emerald-500', text: 'text-emerald-700', desc: 'Ready for requests' },
  { key: 'busy', label: 'Busy', color: 'bg-amber-500', text: 'text-amber-700', desc: 'Currently occupied' },
  { key: 'offline', label: 'Offline', color: 'bg-slate-400', text: 'text-slate-700', desc: 'Unavailable' },
];

export default function ProviderDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [provider, setProvider] = useState(null);
  const [earnings, setEarnings] = useState({ today: 0, monthly: 0, lifetime: 0, completed_count: 0 });
  const [reviews, setReviews] = useState({ average: 0, total: 0 });
  const [orders, setOrders] = useState([]);

  const load = async () => {
    const [p, e, r, o] = await Promise.all([
      api.get('/providers/me'),
      api.get('/providers/me/earnings'),
      api.get('/providers/me/reviews'),
      api.get('/providers/me/orders'),
    ]);
    setProvider(p.data.provider);
    setEarnings(e.data);
    setReviews(r.data);
    setOrders(o.data.orders);
    if (p.data.provider?.approval_status !== 'approved') {
      navigate('/provider/status', { replace: true });
    }
  };
  useEffect(() => { load().catch(() => {}); }, []);

  const setAvail = async (status) => {
    try {
      await api.patch('/providers/me/availability', { availability_status: status });
      setProvider({ ...provider, availability_status: status });
      toast.success(`Status set to ${status}`);
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed'); }
  };

  if (!provider) return <div className="resqly-shell"><div className="resqly-frame flex items-center justify-center min-h-screen text-slate-500">Loading...</div></div>;

  return (
    <div className="resqly-shell">
      <div className="resqly-frame flex flex-col min-h-screen">
        {/* Top */}
        <div className="gradient-blue text-white px-5 pt-6 pb-20 relative">
          <div className="flex items-center justify-between">
            <Logo size={26} withText={false} />
            <button onClick={() => navigate('/provider/profile')} className="p-2 bg-white/20 rounded-full"><UserIcon className="w-5 h-5" /></button>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-white text-blue-700 font-bold flex items-center justify-center text-xl">
              {(provider.name || 'R').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-semibold text-lg">{provider.name || 'Welcome'}</div>
              <div className="text-xs text-blue-100 capitalize flex items-center gap-2">
                {provider.category?.replace('_', ' ')}
                <span className="inline-flex items-center gap-1 bg-white/15 px-1.5 py-0.5 rounded"><Star className="w-3 h-3 fill-amber-300 text-amber-300" />{reviews.average || provider.rating || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Availability card overlapping */}
        <div className="px-5 -mt-14">
          <div className="resqly-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500 font-medium">Availability Status</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`pulse-dot ${AVAIL.find(a => a.key === provider.availability_status)?.color || 'bg-slate-400'}`} />
                  <span className="text-lg font-bold capitalize text-slate-900">{provider.availability_status}</span>
                </div>
              </div>
              <Activity className="w-8 h-8 text-blue-700" />
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4">
              {AVAIL.map((a) => (
                <button
                  data-testid={`avail-${a.key}`}
                  key={a.key}
                  onClick={() => setAvail(a.key)}
                  className={`py-2.5 rounded-lg text-sm font-semibold border ${provider.availability_status === a.key ? 'border-blue-700 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-700'}`}
                >{a.label}</button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">{AVAIL.find(a => a.key === provider.availability_status)?.desc}</p>
          </div>
        </div>

        {/* KPI cards */}
        <div className="px-5 mt-4 grid grid-cols-2 gap-3">
          <Kpi icon={<ShieldCheck className="text-emerald-600" />} label="Verification" value="Approved" />
          <Kpi icon={<CircleDollarSign className="text-blue-600" />} label="Today's Earnings" value={`₹${earnings.today}`} />
          <Kpi icon={<CircleDollarSign className="text-blue-600" />} label="This Month" value={`₹${earnings.monthly}`} />
          <Kpi icon={<ClipboardList className="text-blue-600" />} label="Total Orders" value={orders.length} />
          <Kpi icon={<Star className="text-amber-500" />} label="Avg Rating" value={reviews.average || provider.rating || 0} />
          <Kpi icon={<UserIcon className="text-blue-600" />} label="Profile" value={`${provider.profile_completion}%`} />
        </div>

        {/* Quick Actions */}
        <div className="px-5 mt-5">
          <h3 className="font-semibold text-slate-900 mb-2">Quick Actions</h3>
          <div className="resqly-card divide-y">
            <Action testid="qa-orders" icon={<ClipboardList className="w-4 h-4 text-blue-600" />} label="Orders" onClick={() => navigate('/provider/orders')} />
            <Action testid="qa-earnings" icon={<CircleDollarSign className="w-4 h-4 text-blue-600" />} label="Earnings" onClick={() => navigate('/provider/earnings')} />
            <Action testid="qa-reviews" icon={<Star className="w-4 h-4 text-amber-500" />} label="Reviews" onClick={() => navigate('/provider/reviews')} />
            <Action testid="qa-documents" icon={<FileText className="w-4 h-4 text-slate-600" />} label="Documents" onClick={() => navigate('/provider/documents')} />
            <Action testid="qa-support" icon={<LifeBuoy className="w-4 h-4 text-blue-600" />} label="Support" onClick={() => navigate('/provider/support')} />
            <Action testid="qa-profile" icon={<UserIcon className="w-4 h-4 text-blue-600" />} label="Profile" onClick={() => navigate('/provider/profile')} />
          </div>
        </div>

        {provider.profile_completion < 100 && (
          <div className="px-5 mt-5">
            <div className="resqly-card p-4 bg-amber-50/60 border-amber-100 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-700 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-slate-900">Complete your profile</div>
                <div className="text-xs text-slate-600">Your profile is {provider.profile_completion}% complete. Add bank details, languages and specializations to attract more customers.</div>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1" />
        <BottomNav variant="provider" />
      </div>
    </div>
  );
}

function Kpi({ icon, label, value }) {
  return (
    <div className="resqly-card p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">{label}</span>
        <div className="w-7 h-7 rounded-md bg-slate-50 flex items-center justify-center">{icon}</div>
      </div>
      <div className="text-lg font-bold text-slate-900 mt-1">{value}</div>
    </div>
  );
}
function Action({ icon, label, onClick, testid }) {
  return (
    <button data-testid={testid} onClick={onClick} className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-slate-50">
      <div className="w-7 h-7 rounded-md bg-slate-50 flex items-center justify-center">{icon}</div>
      <span className="text-sm font-medium text-slate-800">{label}</span>
      <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />
    </button>
  );
}

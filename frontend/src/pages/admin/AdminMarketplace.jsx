import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pill, FlaskConical, Clock3, ShoppingBag } from 'lucide-react';
import api from '@/lib/api';
import MobileShell from '@/components/MobileShell';

export default function AdminMarketplace() {
  const navigate = useNavigate();
  const [data, setData] = useState({ requests: [], quotations: [], orders: [], providers: [] });

  const load = async () => {
    try {
      const response = await api.get('/admin/marketplace');
      setData(response.data);
    } catch {}
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, []);

  const livePharmacies = data.providers.filter((p) => p.category === 'pharmacy' && p.availability_status === 'available').length;
  const liveLabs = data.providers.filter((p) => p.category === 'lab_test' && p.availability_status === 'available').length;
  const openRequests = data.requests.filter((r) => r.status === 'broadcasting' || r.status === 'quotations_received');

  return (
    <MobileShell title="Marketplace Operations" action={<button onClick={() => navigate('/admin/dashboard')} className="text-xs text-slate-500">Back</button>}>
      <div className="px-5 py-5 pb-10">
        <div className="grid grid-cols-2 gap-3">
          <Metric icon={<Pill className="w-5 h-5 text-emerald-700" />} label="Live pharmacies" value={livePharmacies} />
          <Metric icon={<FlaskConical className="w-5 h-5 text-violet-700" />} label="Live labs" value={liveLabs} />
          <Metric icon={<Clock3 className="w-5 h-5 text-blue-700" />} label="Open requests" value={openRequests.length} />
          <Metric icon={<ShoppingBag className="w-5 h-5 text-amber-700" />} label="Orders" value={data.orders.length} />
        </div>

        <section className="mt-6">
          <h3 className="font-semibold text-slate-900 mb-2">Open customer requests</h3>
          {openRequests.length === 0 ? <div className="resqly-card p-5 text-sm text-slate-500">No open requests.</div> : openRequests.map((r) => {
            const qs = data.quotations.filter((q) => q.request_id === r.id && q.eligible);
            const best = qs.length ? qs.slice().sort((a, b) => Number(a.total_price) - Number(b.total_price))[0] : null;
            return <div key={r.id} className="resqly-card p-4 mb-2">
              <div className="flex justify-between"><span className="text-[10px] uppercase font-bold tracking-wider text-blue-700">{r.service_type}</span><span className="text-xs">{r.status.replace('_', ' ')}</span></div>
              <div className="font-semibold text-slate-900 mt-1">{r.customer_name}</div>
              <div className="text-xs text-slate-500 mt-1">{r.address}</div>
              <div className="text-xs text-slate-600 mt-2">{qs.length} eligible quotation(s){best ? ' • best ₹' + best.total_price : ''}</div>
            </div>;
          })}
        </section>

        <section className="mt-6">
          <h3 className="font-semibold text-slate-900 mb-2">Provider availability</h3>
          {data.providers.map((p) => (
            <div key={p.id} className="flex items-center justify-between py-3 border-b border-slate-100">
              <div><div className="text-sm font-medium text-slate-900">{p.name || 'Unnamed'}</div><div className="text-xs text-slate-500 capitalize">{p.category?.replace('_',' ')} • {p.city || '—'}</div></div>
              <span className={p.availability_status === 'available' ? 'text-xs font-semibold text-emerald-700' : 'text-xs font-semibold text-slate-400'}>{p.availability_status}</span>
            </div>
          ))}
        </section>

        <section className="mt-6">
          <h3 className="font-semibold text-slate-900 mb-2">Recent marketplace orders</h3>
          {data.orders.length === 0 ? <div className="resqly-card p-5 text-sm text-slate-500">No marketplace orders yet.</div> : data.orders.slice(0, 10).map((o) => (
            <div key={o.id} className="resqly-card p-4 mb-2">
              <div className="flex justify-between"><span className="text-xs text-slate-500">{o.service_type}</span><span className="font-semibold">₹{o.amount}</span></div>
              <div className="text-sm font-medium mt-1">{o.customer_name || 'Customer'}</div>
              <div className="text-xs text-slate-500 mt-1">ETA {o.eta_minutes ? o.eta_minutes + ' min' : '—'} • {o.status}</div>
            </div>
          ))}
        </section>
      </div>
    </MobileShell>
  );
}
function Metric({ icon, label, value }) {
  return <div className="resqly-card p-4"><div className="flex items-center justify-between"><span className="text-xs text-slate-500">{label}</span>{icon}</div><div className="text-2xl font-bold mt-1">{value}</div></div>;
}

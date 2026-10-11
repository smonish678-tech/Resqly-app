import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pill, FlaskConical, Clock3, ShoppingBag, RefreshCw, AlertCircle, ArrowLeft, Search } from 'lucide-react';
import api from '@/lib/api';
import MobileShell from '@/components/MobileShell';
import { Button } from '@/components/ui/button';

export default function AdminMarketplace() {
  const navigate = useNavigate();
  const [data, setData] = useState({ requests: [], quotations: [], orders: [], providers: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('open');

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const response = await api.get('/admin/marketplace');
      setData({
        requests: Array.isArray(response.data.requests) ? response.data.requests : [],
        quotations: Array.isArray(response.data.quotations) ? response.data.quotations : [],
        orders: Array.isArray(response.data.orders) ? response.data.orders : [],
        providers: Array.isArray(response.data.providers) ? response.data.providers : [],
      });
      setError('');
    } catch (e) {
      setError(e.response?.data?.detail || 'Marketplace operations could not be loaded.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(() => load(true), 12000);
    return () => clearInterval(timer);
  }, [load]);

  const livePharmacies = data.providers.filter((p) => p.category === 'pharmacy' && p.availability_status === 'available').length;
  const liveLabs = data.providers.filter((p) => p.category === 'lab_test' && p.availability_status === 'available').length;
  const openRequests = data.requests.filter((r) => ['broadcasting', 'quotations_received'].includes(r.status));
  const visibleRequests = data.requests.filter((r) => {
    const query = search.trim().toLowerCase();
    const matches = !query || [r.customer_name, r.address, r.service_type, r.id].some((v) => String(v || '').toLowerCase().includes(query));
    return matches && (filter === 'all' || filter === 'open' ? filter === 'all' || ['broadcasting','quotations_received'].includes(r.status) : r.status === filter);
  });

  return (
    <MobileShell wide title="Marketplace operations" action={<button onClick={() => navigate('/admin/dashboard')} className="text-sm text-blue-700 font-semibold inline-flex gap-1 items-center min-h-[44px]"><ArrowLeft className="w-4 h-4"/> Admin overview</button>}>
      <div className="px-4 py-5 sm:px-6 lg:px-8 pb-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div><p className="text-xs uppercase tracking-widest font-bold text-blue-700">Live operations</p><h1 className="text-2xl sm:text-3xl font-bold text-slate-950 mt-1">Pharmacy & lab marketplace</h1><p className="text-sm text-slate-500 mt-1">Check provider availability, customer requests, offers and orders.</p></div>
          <Button variant="outline" onClick={() => load()} disabled={loading} className="min-h-[44px]"><RefreshCw className="w-4 h-4 mr-2"/> Refresh</Button>
        </div>

        {error && <div role="alert" className="resqly-card p-4 mt-5 border-rose-200 bg-rose-50 flex flex-col sm:flex-row sm:items-center gap-3"><AlertCircle className="w-5 h-5 text-rose-700"/><span className="text-sm text-rose-950 flex-1">{error}</span><Button variant="outline" onClick={() => load()}>Try again</Button></div>}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
          <Metric icon={<Pill className="w-5 h-5 text-emerald-700"/>} label="Live pharmacies" value={livePharmacies}/>
          <Metric icon={<FlaskConical className="w-5 h-5 text-violet-700"/>} label="Live labs" value={liveLabs}/>
          <Metric icon={<Clock3 className="w-5 h-5 text-blue-700"/>} label="Open requests" value={openRequests.length}/>
          <Metric icon={<ShoppingBag className="w-5 h-5 text-amber-700"/>} label="Orders" value={data.orders.length}/>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)] gap-5 mt-6 items-start">
          <section className="min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"><div><h2 className="text-xl font-bold text-slate-950">Customer requests</h2><p className="text-sm text-slate-500 mt-1">See which offers are arriving and which requests need attention.</p></div><div className="relative w-full sm:w-64"><Search className="w-4 h-4 absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"/><input aria-label="Search requests" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Customer, area, service…" className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-base focus-visible:ring-2 focus-visible:ring-blue-600 outline-none"/></div></div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar mt-4 pb-1">
              {[['open','Open'],['all','All requests'],['order_placed','Order placed'],['cancelled','Cancelled'],['expired','Expired']].map(([key,label]) => <button key={key} onClick={() => setFilter(key)} className={`rounded-full border min-h-[40px] px-3.5 text-sm font-semibold whitespace-nowrap ${filter === key ? 'bg-blue-700 border-blue-700 text-white' : 'bg-white border-slate-200 text-slate-700'}`}>{label}</button>)}
            </div>
            {loading && !data.requests.length ? <div role="status" className="resqly-card p-8 mt-3 text-center text-slate-500">Loading requests…</div> :
              !error && !visibleRequests.length ? <div className="resqly-card p-8 mt-3 text-center"><Clock3 className="w-8 h-8 text-slate-300 mx-auto"/><h3 className="font-semibold text-slate-950 mt-2">No requests in this view</h3><p className="text-sm text-slate-500 mt-1">Try another status or search term.</p></div> :
              <div className="space-y-3 mt-3">{visibleRequests.map((req) => {
                const qs = data.quotations.filter((q) => q.request_id === req.id && q.eligible);
                const best = qs.length ? qs.slice().sort((a,b) => Number(a.total_price) - Number(b.total_price) || Number(a.eta_minutes || 1e9)-Number(b.eta_minutes || 1e9))[0] : null;
                return <article key={req.id} className="resqly-card p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div><span className="text-[11px] uppercase font-bold tracking-wide text-blue-700">{String(req.service_type || 'service').replaceAll('_',' ')}</span><h3 className="font-semibold text-slate-950 mt-1">{req.customer_name || 'Customer'}</h3></div><span className={`text-xs font-semibold capitalize px-2 py-1 rounded-full ${['broadcasting','quotations_received'].includes(req.status) ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{String(req.status || 'unknown').replaceAll('_',' ')}</span></div><p className="text-sm text-slate-500 mt-2">{req.address || 'Address not provided'}</p><div className="grid grid-cols-2 gap-3 mt-4"><div className="rounded-xl bg-slate-50 p-3"><div className="text-xs text-slate-500">Eligible offers</div><div className="text-lg font-bold text-slate-950 mt-1">{qs.length}</div></div><div className="rounded-xl bg-slate-50 p-3"><div className="text-xs text-slate-500">Lowest offer</div><div className="text-lg font-bold text-slate-950 mt-1">{best ? '₹'+best.total_price : '—'}</div></div></div></article>;
              })}</div>}
          </section>

          <aside className="space-y-5">
            <section className="resqly-card p-5"><h2 className="text-lg font-bold text-slate-950">Provider availability</h2><p className="text-sm text-slate-500 mt-1">Approved pharmacies and labs currently listed in the marketplace.</p>
              {data.providers.length ? <div className="mt-4 max-h-[430px] overflow-y-auto divide-y divide-slate-100">{data.providers.map((provider) => <div key={provider.id} className="py-3 flex items-center justify-between gap-3"><div className="min-w-0"><div className="text-sm font-semibold text-slate-950 truncate">{provider.name || 'Unnamed provider'}</div><div className="text-xs text-slate-500 mt-0.5 capitalize">{String(provider.category || '').replaceAll('_',' ')} · {provider.city || '—'}</div></div><span className={`text-xs font-semibold rounded-full px-2 py-1 ${provider.availability_status === 'available' ? 'bg-emerald-50 text-emerald-700' : provider.availability_status === 'busy' ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-slate-500'}`}>{provider.availability_status || 'offline'}</span></div>)}</div> : <p className="text-sm text-slate-500 mt-4">No marketplace providers returned yet.</p>}
            </section>
            <section className="resqly-card p-5"><h2 className="text-lg font-bold text-slate-950">Recent orders</h2><p className="text-sm text-slate-500 mt-1">Latest accepted marketplace orders.</p>
              {!data.orders.length ? <p className="text-sm text-slate-500 mt-4">No marketplace orders yet.</p> : <div className="space-y-2 mt-4">{data.orders.slice(0,8).map((o) => <div key={o.id} className="border border-slate-100 rounded-xl p-3"><div className="flex items-center justify-between gap-2"><span className="text-sm font-semibold text-slate-950">{o.customer_name || 'Customer'}</span><span className="text-sm font-bold">₹{o.amount}</span></div><p className="text-xs text-slate-500 mt-1 capitalize">{String(o.service_type || '').replaceAll('_',' ')} · {String(o.status || '').replaceAll('_',' ')}</p></div>)}</div>}
            </section>
          </aside>
        </div>
      </div>
    </MobileShell>
  );
}
function Metric({ icon, label, value }) {
  return <div className="resqly-card p-4"><div className="flex items-center justify-between gap-2"><span className="text-xs text-slate-500">{label}</span>{icon}</div><div className="text-2xl font-bold text-slate-950 mt-2">{value}</div></div>;
}

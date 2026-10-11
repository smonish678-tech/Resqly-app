import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import api from '@/lib/api';
import MobileShell from '@/components/MobileShell';
import BottomNav from '@/components/BottomNav';
import { ClipboardList, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProviderOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const { data } = await api.get('/providers/me/orders');
      setOrders(Array.isArray(data.orders) ? data.orders : []);
      setError('');
    } catch (e) {
      setError(e.response?.data?.detail || 'We could not load your orders.');
      if (!quiet) toast.error(e.response?.data?.detail || 'Could not load orders');
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="resqly-shell"><div className="resqly-frame flex flex-col min-h-screen">
      <MobileShell title="My work" header>
        <div className="px-5 py-5 pb-8">
          <div className="flex items-start justify-between gap-3">
            <div><h2 className="text-xl font-bold text-slate-950">Orders & active work</h2><p className="text-sm text-slate-500 mt-1">Accepted work stays here so you always know what is next.</p></div>
            <Button variant="outline" onClick={() => load()} disabled={loading} aria-label="Refresh orders" className="min-h-[44px]"><RefreshCw className="w-4 h-4 mr-2" /> Refresh</Button>
          </div>
          {error && <div role="alert" className="resqly-card p-4 mt-4 border-rose-200 bg-rose-50"><AlertCircle className="w-5 h-5 text-rose-700 inline mr-2" /><span className="text-sm">{error}</span><Button variant="outline" onClick={() => load()} className="w-full mt-3">Try again</Button></div>}
          {loading ? <div role="status" aria-live="polite" className="resqly-card p-8 mt-4 text-center text-slate-500">Loading your work…</div> :
            !error && !orders.length ? <div className="resqly-card p-8 mt-4 text-center"><ClipboardList className="w-10 h-10 text-slate-300 mx-auto" /><h3 className="font-semibold text-slate-900 mt-2">You're all caught up</h3><p className="text-sm text-slate-500 mt-1">New accepted orders will appear here. Pharmacy and lab requests are in your Live Requests section.</p></div> :
              <div className="space-y-3 mt-4">{orders.map((o) => {
                const status = String(o.status || 'in progress').replaceAll('_', ' ');
                const active = !['completed', 'cancelled', 'refunded', 'failed'].includes(String(o.status || '').toLowerCase());
                return <article key={o.id} className="resqly-card p-4">
                  <div className="flex items-start justify-between gap-3"><div><span className="text-[11px] text-slate-500">Order #{String(o.id).slice(0, 8)}</span><h3 className="font-semibold text-slate-950 mt-1">{o.customer_name || 'Customer'}</h3></div><span className={`text-xs font-semibold capitalize px-2 py-1 rounded-full ${active ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{status}</span></div>
                  <div className="text-xs text-slate-500 mt-1 capitalize">{String(o.service_type || 'service').replaceAll('_', ' ')}</div>
                  <div className="grid grid-cols-2 gap-3 mt-3"><div className="rounded-xl bg-slate-50 p-3"><div className="text-xs text-slate-500">Order amount</div><div className="font-bold text-slate-950 mt-1">₹{o.amount ?? '—'}</div></div><div className="rounded-xl bg-slate-50 p-3"><div className="text-xs text-slate-500">Your earnings</div><div className="font-bold text-slate-950 mt-1">₹{o.net_earnings ?? '—'}</div></div></div>
                  {active && <div className="mt-3 text-sm text-slate-600 inline-flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-700" /> This order is active. Follow its service workflow for the next step.</div>}
                </article>;
              })}</div>}
        </div>
      </MobileShell>
      <BottomNav variant="provider" />
    </div></div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, ClipboardList, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import MobileShell from '@/components/MobileShell';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';

const ACTIVE = new Set(['broadcasting', 'quotations_received', 'payment_verified', 'accepted', 'in_call', 'in_progress']);
function friendlyStatus(status) {
  const map = {
    broadcasting: 'Finding providers', quotations_received: 'Offers received', payment_verified: 'Finding your doctor',
    accepted: 'Accepted', in_call: 'Consultation in progress', in_progress: 'Visit in progress',
    order_placed: 'Order placed', completed: 'Completed', cancelled: 'Cancelled', expired: 'Expired',
    refunded_no_doctor: 'Refund started', refunded_no_show: 'Refund started', refund_pending: 'Refund needs support',
    payment_pending: 'Checking payment', payment_expiring: 'Checking payment', refund_processing: 'Checking refund',
    payment_expired: 'Payment not taken', refunded_abandoned_checkout: 'Refund started',
  };
  return map[status] || String(status || 'In progress').replaceAll('_', ' ');
}

export default function ConsumerRequests() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/marketplace/requests/mine');
      setItems(Array.isArray(data.requests) ? data.requests : []);
      setError('');
    } catch (e) {
      setError(e.response?.data?.detail || 'We couldn’t load your requests. Please try again.');
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <MobileShell title="My Requests">
      <div className="flex min-h-[calc(100dvh-60px)] flex-col">
        <main className="flex-1 px-5 py-5 pb-8">
          <h1 className="text-2xl font-bold text-slate-950">Your healthcare activity</h1>
          <p className="text-sm text-slate-600 mt-1">Pharmacy and lab requests, their offers and the decisions you have made.</p>
          <Button variant="outline" onClick={load} disabled={loading} className="mt-4 min-h-[44px]"><RefreshCw className="w-4 h-4 mr-2" /> Refresh</Button>
          {error && <div role="alert" className="resqly-card p-4 mt-4 bg-rose-50 border-rose-200"><AlertCircle className="w-5 h-5 text-rose-700 inline mr-2"/><span className="text-sm">{error}</span><Button variant="outline" onClick={load} className="w-full mt-3 min-h-[44px]">Try again</Button></div>}
          {loading ? <div role="status" aria-live="polite" className="resqly-card p-8 mt-4 text-center text-slate-500">Loading your requests…</div> :
          !error && !items.length ? <div className="resqly-card p-8 mt-4 text-center"><ClipboardList className="w-10 h-10 text-slate-300 mx-auto"/><h2 className="font-semibold text-slate-950 mt-2">Nothing here yet</h2><p className="text-sm text-slate-600 mt-1">When you request medicine or lab offers, the progress will appear here.</p><Button onClick={() => navigate('/consumer/home')} className="w-full mt-4 min-h-[48px]">Explore services</Button></div> :
          !error && <div className="space-y-3 mt-4">{items.map((item) => {
            const status = String(item.status || '');
            const service = item.service_type === 'lab_test' ? 'Lab tests' : item.service_type === 'pharmacy' ? 'Pharmacy' : String(item.service_type || 'Healthcare').replaceAll('_',' ');
            const isActive = ACTIVE.has(status);
            const target = item.service_type === 'pharmacy' || item.service_type === 'lab_test'
              ? `/consumer/service/${item.service_type}?request_id=${encodeURIComponent(item.id)}`
              : '/consumer/home';
            return <button key={item.id} onClick={() => navigate(target)} className="resqly-card w-full p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
              <div className="flex items-start justify-between gap-3"><div><span className="text-[11px] uppercase tracking-wide font-bold text-blue-700">{service}</span><h2 className="font-semibold text-slate-950 mt-1">Request #{String(item.id).slice(0,8)}</h2></div><span className={`text-xs font-semibold px-2 py-1 rounded-full ${isActive ? 'bg-blue-50 text-blue-700' : status === 'completed' || status === 'order_placed' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{friendlyStatus(status)}</span></div>
              <div className="text-xs text-slate-500 mt-2">{item.updated_at || item.created_at ? new Date(item.updated_at || item.created_at).toLocaleString() : 'Recently'}</div>
              <div className="text-sm font-semibold text-blue-700 mt-3 inline-flex items-center gap-1">View request <ArrowRight className="w-4 h-4"/></div>
            </button>;
          })}</div>}
        </main>
        <BottomNav variant="consumer"/>
      </div>
    </MobileShell>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import MobileShell from '@/components/MobileShell';
import { LogOut, Users, ShieldCheck, Clock, XCircle, ShoppingBasket, Search, RefreshCw, AlertCircle, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FILTERS = [
  { key: 'pending', label: 'Pending' }, { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' }, { key: 'resubmit', label: 'Resubmit' },
  { key: 'incomplete', label: 'Incomplete' }, { key: '', label: 'All providers' },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [providers, setProviders] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const [s, p] = await Promise.allSettled([
      api.get('/admin/stats'),
      api.get(filter ? `/admin/providers?status=${filter}` : '/admin/providers'),
    ]);
    if (s.status === 'fulfilled') setStats(s.value.data);
    if (p.status === 'fulfilled') setProviders(Array.isArray(p.value.data.providers) ? p.value.data.providers : []);
    const messages = [];
    if (s.status === 'rejected') messages.push('Summary metrics could not be loaded.');
    if (p.status === 'rejected') messages.push('Provider list could not be loaded.');
    setError(messages.join(' '));
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return providers;
    return providers.filter((p) => [p.name, p.phone, p.email, p.city, p.service_area, p.category].some((v) => String(v || '').toLowerCase().includes(q)));
  }, [providers, search]);

  return (
    <MobileShell wide title="Admin operations" hideBack action={
      <button onClick={() => { logout(); navigate('/'); }} className="text-sm text-slate-600 inline-flex items-center gap-2 min-h-[44px]"><LogOut className="w-4 h-4"/> Sign out</button>
    }>
      <div className="px-4 py-5 sm:px-6 lg:px-8 pb-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
          <div><p className="text-xs uppercase tracking-widest font-bold text-blue-700">Resqly control room</p><h1 className="text-2xl sm:text-3xl font-bold text-slate-950 mt-1">Operations overview</h1><p className="text-sm text-slate-500 mt-1">Review partners and follow marketplace activity from one workspace.</p></div>
          <Button variant="outline" onClick={load} disabled={loading} className="min-h-[44px] self-start"><RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`}/> Refresh data</Button>
        </div>

        {error && <div role="alert" className="resqly-card border-rose-200 bg-rose-50 p-4 mt-5 flex flex-col sm:flex-row sm:items-center gap-3"><AlertCircle className="w-5 h-5 text-rose-700"/><p className="text-sm text-rose-950 flex-1">{error}</p><Button variant="outline" onClick={load}>Try again</Button></div>}

        <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mt-5">
          <Card label="All providers" value={stats?.providers?.total} icon={<Users className="w-4 h-4 text-blue-600"/>}/>
          <Card label="Approved" value={stats?.providers?.approved} icon={<ShieldCheck className="w-4 h-4 text-emerald-600"/>}/>
          <Card label="Needs review" value={stats?.providers?.pending} icon={<Clock className="w-4 h-4 text-amber-600"/>}/>
          <Card label="Rejected" value={stats?.providers?.rejected} icon={<XCircle className="w-4 h-4 text-rose-600"/>}/>
          <Card label="Consumers" value={stats?.consumers?.total} icon={<Users className="w-4 h-4 text-slate-600"/>}/>
          <Card label="Waitlist" value={stats?.waitlist?.total} icon={<Users className="w-4 h-4 text-blue-600"/>}/>
        </section>

        <button onClick={() => navigate('/admin/marketplace')} className="w-full mt-4 resqly-card p-4 sm:p-5 flex items-center gap-3 text-left hover:shadow-md transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center"><ShoppingBasket className="w-5 h-5 text-emerald-700"/></div>
          <div className="flex-1 min-w-0"><div className="font-semibold text-slate-950">Pharmacy & lab operations</div><div className="text-sm text-slate-500 mt-1">Monitor requests, offers, orders and provider availability.</div></div>
          <span className="text-sm font-bold text-emerald-700 whitespace-nowrap">{stats?.marketplace?.open_requests ?? '—'} open <ArrowUpRight className="inline w-4 h-4"/></span>
        </button>

        <section className="mt-7 grid grid-cols-1 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)] gap-5 items-start">
          <div className="min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div><h2 className="text-xl font-bold text-slate-950">Provider approvals</h2><p className="text-sm text-slate-500 mt-1">Search the queue and open an application to review its details.</p></div>
              <div className="relative w-full sm:w-72"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input aria-label="Search providers" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, phone, city…" className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-blue-600"/></div>
            </div>
            <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar pb-1">
              {FILTERS.map((f) => <button data-testid={`admin-filter-${f.key || 'all'}`} key={f.key} onClick={() => setFilter(f.key)} className={`px-3.5 py-2 rounded-full text-sm border whitespace-nowrap min-h-[40px] font-semibold ${filter === f.key ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-slate-700 border-slate-200'}`}>{f.label}</button>)}
            </div>
            {loading && !providers.length ? <div role="status" className="resqly-card p-8 mt-3 text-center text-slate-500">Loading provider queue…</div> :
              !error && !filtered.length ? <div className="resqly-card p-8 mt-3 text-center"><Users className="w-8 h-8 text-slate-300 mx-auto"/><h3 className="font-semibold text-slate-950 mt-2">{search ? 'No matches' : 'Queue is clear'}</h3><p className="text-sm text-slate-500 mt-1">{search ? 'Try a different name or city.' : 'No providers match this status.'}</p></div> :
              <div className="resqly-card overflow-hidden mt-3">
                {filtered.map((p) => <Link data-testid={`admin-provider-${p.id}`} key={p.id} to={`/admin/providers/${p.id}`} className="flex items-start gap-3 p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-blue-50 flex items-center justify-center text-blue-800 font-bold">{(p.name || '?').slice(0,1).toUpperCase()}</div>
                  <div className="flex-1 min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="font-semibold text-slate-950">{p.name || 'Unnamed provider'}</span><span className={`text-xs px-2 py-1 rounded-full capitalize ${p.approval_status === 'approved' ? 'bg-emerald-50 text-emerald-700' : p.approval_status === 'rejected' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-800'}`}>{p.approval_status || 'unknown'}</span></div><p className="text-sm text-slate-600 mt-1 capitalize">{String(p.category || 'No category').replaceAll('_',' ')} · {p.city || 'City not set'}</p><p className="text-xs text-slate-500 mt-1">{p.phone || p.email || 'No contact listed'} · {p.service_area || 'Service area not set'}</p></div><ArrowUpRight className="w-4 h-4 text-slate-400 mt-1 flex-shrink-0"/>
                </Link>)}
              </div>}
          </div>
          <aside className="resqly-card p-5">
            <h2 className="text-lg font-bold text-slate-950">Admin checklist</h2><p className="text-sm text-slate-500 mt-1">Keep the network safe and reliable.</p>
            <div className="space-y-4 mt-5">
              <Checklist icon={<ShieldCheck className="w-5 h-5 text-emerald-700"/>} title="Verification first" description="Confirm submitted identity and professional documents before approving a provider."/>
              <Checklist icon={<Clock className="w-5 h-5 text-amber-700"/>} title="Clear review outcomes" description="Use the approval details page to approve, reject or request updates with a clear reason."/>
              <Checklist icon={<ShoppingBasket className="w-5 h-5 text-blue-700"/>} title="Marketplace health" description="Use pharmacy & lab operations to watch live requests, prices and order activity." onClick={() => navigate('/admin/marketplace')}/>
            </div>
          </aside>
        </section>
      </div>
    </MobileShell>
  );
}

function Card({ label, value, icon }) {
  return <div className="resqly-card p-4"><div className="flex items-center justify-between gap-2"><span className="text-xs uppercase tracking-wide text-slate-500 font-semibold">{label}</span>{icon}</div><div className="text-2xl font-bold text-slate-950 mt-2">{value ?? '—'}</div></div>;
}
function Checklist({ icon, title, description, onClick }) {
  const content = <><span className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0">{icon}</span><span className="flex-1"><span className="block text-sm font-semibold text-slate-950">{title}</span><span className="block text-sm text-slate-500 mt-1">{description}</span></span></>;
  return onClick ? <button onClick={onClick} className="w-full flex items-start gap-3 text-left">{content}<ArrowUpRight className="w-4 h-4 text-slate-400 flex-shrink-0"/></button> : <div className="flex items-start gap-3">{content}</div>;
}

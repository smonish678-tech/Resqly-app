import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import MobileShell from '@/components/MobileShell';
import { LogOut, Users, ShieldCheck, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FILTERS = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'resubmit', label: 'Resubmit' },
  { key: 'incomplete', label: 'Incomplete' },
  { key: '', label: 'All' },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [providers, setProviders] = useState([]);
  const [filter, setFilter] = useState('pending');

  const load = async () => {
    const [s, p] = await Promise.all([
      api.get('/admin/stats'),
      api.get(filter ? `/admin/providers?status=${filter}` : '/admin/providers'),
    ]);
    setStats(s.data); setProviders(p.data.providers);
  };
  useEffect(() => { load().catch(() => {}); }, [filter]);

  return (
    <div className="resqly-shell">
      <div className="resqly-frame flex flex-col min-h-screen">
        <MobileShell title="Admin Console" hideBack action={
          <button onClick={() => { logout(); navigate('/'); }} className="text-xs text-slate-500 inline-flex items-center gap-1"><LogOut className="w-3 h-3" /> Logout</button>
        }>
          <div className="px-5 py-5">
            {stats && (
              <div className="grid grid-cols-3 gap-2">
                <Card label="Total" value={stats.providers.total} icon={<Users className="w-4 h-4 text-blue-600" />} />
                <Card label="Approved" value={stats.providers.approved} icon={<ShieldCheck className="w-4 h-4 text-emerald-600" />} />
                <Card label="Pending" value={stats.providers.pending} icon={<Clock className="w-4 h-4 text-amber-600" />} />
                <Card label="Rejected" value={stats.providers.rejected} icon={<XCircle className="w-4 h-4 text-rose-600" />} />
                <Card label="Consumers" value={stats.consumers.total} icon={<Users className="w-4 h-4 text-slate-600" />} />
                <Card label="Waitlist" value={stats.waitlist.total} icon={<Users className="w-4 h-4 text-blue-600" />} />
              </div>
            )}

            <div className="flex gap-2 mt-5 overflow-x-auto no-scrollbar">
              {FILTERS.map((f) => (
                <button data-testid={`admin-filter-${f.key || 'all'}`} key={f.key} onClick={() => setFilter(f.key)} className={`px-3 py-1.5 rounded-full text-sm border whitespace-nowrap ${filter === f.key ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-slate-700 border-slate-200'}`}>{f.label}</button>
              ))}
            </div>

            <div className="mt-3 space-y-2">
              {providers.length === 0 ? (
                <div className="resqly-card p-6 text-center text-sm text-slate-500">No providers in this list.</div>
              ) : providers.map((p) => (
                <Link data-testid={`admin-provider-${p.id}`} key={p.id} to={`/admin/providers/${p.id}`} className="resqly-card p-4 block hover:shadow-md">
                  <div className="flex justify-between">
                    <div className="font-medium text-slate-900">{p.name || 'Unnamed'}</div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 capitalize">{p.approval_status}</span>
                  </div>
                  <div className="text-xs text-slate-500 capitalize mt-0.5">{p.category?.replace('_', ' ') || 'No category'} • {p.phone || p.email}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{p.city} • {p.service_area || '—'}</div>
                </Link>
              ))}
            </div>
          </div>
        </MobileShell>
      </div>
    </div>
  );
}

function Card({ label, value, icon }) {
  return (
    <div className="resqly-card p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{label}</span>
        {icon}
      </div>
      <div className="text-xl font-bold mt-1">{value || 0}</div>
    </div>
  );
}

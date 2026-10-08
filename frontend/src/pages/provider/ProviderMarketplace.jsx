import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import api from '@/lib/api';
import MobileShell from '@/components/MobileShell';
import BottomNav from '@/components/BottomNav';
import { ClipboardList, Upload, MapPin, CheckCircle2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProviderMarketplace() {
  const [requests, setRequests] = useState([]);
  const [forms, setForms] = useState({});

  const load = async () => {
    try {
      const response = await api.get('/providers/me/marketplace/requests');
      setRequests(response.data.requests || []);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Could not load live requests');
    }
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, []);

  const update = (id, patch) => setForms((x) => ({ ...x, [id]: { ...(x[id] || {}), ...patch } }));
  const rowsFor = (r) => { const existing = forms[r.id] && forms[r.id].items; if (existing) return existing; if ((r.requested_items || []).length) return r.requested_items.map((name) => ({ name, quantity: 1, unit_price: '' })); return [{ name: '', quantity: 1, unit_price: '' }]; };
  const updateItem = (r, i, patch) => update(r.id, { items: rowsFor(r).map((row, idx) => idx === i ? { ...row, ...patch } : row) });

  const quotePharmacy = async (r) => {
    const form = forms[r.id] || {};
    const rows = rowsFor(r);
    if (!rows.length && !form.coverage_confirmed) return toast.error('Confirm full prescription coverage');
    if (rows.some((x) => !String(x.name || '').trim() || !Number.isFinite(Number(x.unit_price)) || Number(x.unit_price) < 0)) return toast.error('Enter a medicine name and price for every line');
    try {
      await api.post('/marketplace/pharmacy/quotations', { request_id: r.id, items: rows, coverage_confirmed: Boolean(form.coverage_confirmed), notes: form.notes || '' });
      toast.success('Quotation submitted');
      await load();
    } catch (e) { toast.error(e.response?.data?.detail || 'Could not submit quotation'); }
  };

  const quoteLab = async (r) => {
    const form = forms[r.id] || {};
    const price = Number(form.total_price);
    if (!Number.isFinite(price) || price < 0) return toast.error('Enter a valid quotation');
    try {
      await api.post('/marketplace/lab/quotations', { request_id: r.id, total_price: price, available_slots: form.available_slots || '', notes: form.notes || '' });
      toast.success('Quotation submitted');
      await load();
    } catch (e) { toast.error(e.response?.data?.detail || 'Could not submit quotation'); }
  };

  return (
    <MobileShell title="Live Requests" header>
      <div className="px-5 py-5 pb-24">
        <div className="resqly-card p-4 bg-blue-50/60 border-blue-100"><div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-blue-700" /><div className="font-semibold text-slate-900">Verified live marketplace</div></div><p className="text-xs text-slate-600 mt-1">You receive requests only while approved, available and location-enabled.</p></div>
        {!requests.length ? <div className="resqly-card p-8 mt-4 text-center"><ClipboardList className="w-10 h-10 text-slate-300 mx-auto" /><div className="font-semibold mt-2">No live requests</div><div className="text-sm text-slate-500 mt-1">New customer requests appear automatically.</div></div> : null}
        <div className="space-y-4 mt-4">{requests.map((r) => {
          const pharmacy = r.service_type === 'pharmacy';
          const form = forms[r.id] || {};
          const rows = rowsFor(r);
          return <div key={r.id} className="resqly-card p-5">
            <div className="flex justify-between gap-2"><div><div className="text-[10px] uppercase font-bold tracking-wider text-blue-700">{pharmacy ? 'Pharmacy request' : 'Lab request'}</div><div className="font-semibold text-slate-900 mt-1">{r.customer_name || 'Customer'}</div></div><span className="text-xs font-semibold px-2 py-1 bg-slate-100 rounded-full">{r.status.replace('_', ' ')}</span></div>
            <div className="mt-3 text-xs text-slate-600 flex gap-2"><MapPin className="w-4 h-4 text-blue-700" />{r.address}</div>
            {r.attachment_url ? <a href={r.attachment_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-700"><FileText className="w-4 h-4" /> Open attachment</a> : null}
            {r.description ? <div className="text-sm text-slate-700 bg-slate-50 rounded-xl p-3 mt-3">{r.description}</div> : null}
            {pharmacy ? <div className="mt-4 space-y-2">
              {r.requested_items.length ? r.requested_items.map((name, i) => <div key={i} className="grid grid-cols-[1fr_88px] gap-2"><input readOnly value={rows[i]?.name || name} className="border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-sm" /><input type="number" min="0" step="0.01" placeholder="Price" value={rows[i]?.unit_price ?? ''} onChange={(e) => updateItem(r, i, { unit_price: e.target.value })} className="border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-sm" /></div>) : <>
                        <div className="flex items-center justify-between gap-2"><div className="text-xs text-slate-500">Prescription uploaded. List every medicine you can fulfil and its price.</div><button onClick={() => update(r.id, { items: [...rows, { name: '', quantity: 1, unit_price: '' }] })} className="text-blue-700 text-xs font-semibold whitespace-nowrap">+ Add medicine</button></div>
                        {rows.map((row, i) => <div key={i} className="grid grid-cols-[1fr_88px] gap-2"><input value={row.name || ''} onChange={(e) => updateItem(r, i, { name: e.target.value })} placeholder="Medicine name" className="border border-slate-200 rounded-lg px-3 py-2 text-sm" /><input type="number" min="0" step="0.01" placeholder="Price" value={row.unit_price ?? ''} onChange={(e) => updateItem(r, i, { unit_price: e.target.value })} className="border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>)}
                        <label className="flex gap-2 items-start border border-amber-200 bg-amber-50 rounded-xl p-3 text-sm"><input type="checkbox" checked={Boolean(form.coverage_confirmed)} onChange={(e) => update(r.id, { coverage_confirmed: e.target.checked })} className="mt-1" /><span><b>I checked the prescription and can fulfil it</b><span className="block text-xs text-slate-500 mt-0.5">This confirmation makes the prescription-only quotation eligible.</span></span></label>
                      </>}
              <textarea rows="2" placeholder="Optional note" value={form.notes || ''} onChange={(e) => update(r.id, { notes: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              <Button onClick={() => quotePharmacy(r)} className="w-full bg-blue-700 hover:bg-blue-800"><Upload className="w-4 h-4 mr-1" /> Submit pharmacy quotation</Button>
            </div> : <div className="mt-4 space-y-2">
              <input type="number" min="0" step="0.01" placeholder="Total quotation (₹)" value={form.total_price || ''} onChange={(e) => update(r.id, { total_price: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
              <input placeholder="Earliest available slot" value={form.available_slots || ''} onChange={(e) => update(r.id, { available_slots: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
              <textarea rows="2" placeholder="Optional note" value={form.notes || ''} onChange={(e) => update(r.id, { notes: e.target.value })} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              <Button onClick={() => quoteLab(r)} className="w-full bg-blue-700 hover:bg-blue-800">Submit lab quotation</Button>
            </div>}
          </div>;
        })}</div>
      </div>
      <BottomNav variant="provider" />
    </MobileShell>
  );
}

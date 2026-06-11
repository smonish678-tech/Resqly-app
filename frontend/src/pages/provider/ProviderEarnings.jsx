import { useEffect, useState } from 'react';
import api from '@/lib/api';
import MobileShell from '@/components/MobileShell';
import BottomNav from '@/components/BottomNav';
import { CircleDollarSign, TrendingUp, Wallet, Banknote } from 'lucide-react';

export default function ProviderEarnings() {
  const [data, setData] = useState({ today: 0, monthly: 0, lifetime: 0, completed_count: 0, payout_history: [] });
  const [provider, setProvider] = useState(null);
  useEffect(() => {
    api.get('/providers/me/earnings').then(({ data }) => setData(data)).catch(() => {});
    api.get('/providers/me').then(({ data }) => setProvider(data.provider)).catch(() => {});
  }, []);

  return (
    <div className="resqly-shell">
      <div className="resqly-frame flex flex-col min-h-screen">
        <MobileShell title="Earnings" header>
          <div className="px-5 py-5">
            <div className="resqly-card p-5 gradient-blue text-white">
              <div className="text-xs text-blue-100">Lifetime Earnings</div>
              <div className="text-3xl font-bold mt-1">₹{data.lifetime}</div>
              <div className="text-xs text-blue-100 mt-1">From {data.completed_count} completed orders</div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <Stat icon={<CircleDollarSign />} label="Today" value={`₹${data.today}`} />
              <Stat icon={<TrendingUp />} label="This Month" value={`₹${data.monthly}`} />
            </div>

            <div className="resqly-card p-5 mt-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2"><Banknote className="w-4 h-4" /> Bank Details</h3>
              <div className="text-sm mt-3 space-y-1">
                <Row label="Account Holder" value={provider?.bank_account_holder} />
                <Row label="Bank Name" value={provider?.bank_name} />
                <Row label="Account No." value={provider?.bank_account_number ? `**** ${provider.bank_account_number.slice(-4)}` : ''} />
                <Row label="IFSC" value={provider?.bank_ifsc} />
              </div>
              {!provider?.bank_account_number && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded p-2 mt-3">Add your bank details in Profile to receive payouts.</p>
              )}
            </div>

            <div className="resqly-card p-5 mt-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2"><Wallet className="w-4 h-4" /> Payout History</h3>
              {data.payout_history.length === 0 ? (
                <p className="text-sm text-slate-500 mt-2">No payouts yet. Payouts will appear here after launch.</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {data.payout_history.map((p) => (
                    <div key={p.id} className="flex justify-between text-sm"><span>{p.date}</span><span>₹{p.amount}</span></div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </MobileShell>
        <BottomNav variant="provider" />
      </div>
    </div>
  );
}
function Stat({ icon, label, value }) {
  return <div className="resqly-card p-4"><div className="text-xs text-slate-500">{label}</div><div className="text-xl font-bold mt-1">{value}</div></div>;
}
function Row({ label, value }) {
  return <div className="flex justify-between"><span className="text-slate-500">{label}</span><span className="text-slate-900 font-medium">{value || '—'}</span></div>;
}

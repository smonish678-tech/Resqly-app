import { useEffect, useState } from 'react';
import api from '@/lib/api';
import MobileShell from '@/components/MobileShell';
import BottomNav from '@/components/BottomNav';
import { ClipboardList } from 'lucide-react';

export default function ProviderOrders() {
  const [orders, setOrders] = useState([]);
  useEffect(() => {
    api.get('/providers/me/orders').then(({ data }) => setOrders(data.orders)).catch(() => {});
  }, []);

  return (
    <div className="resqly-shell">
      <div className="resqly-frame flex flex-col min-h-screen">
        <MobileShell title="Orders" header>
          <div className="px-5 py-5">
            {orders.length === 0 ? (
              <div className="resqly-card p-8 text-center">
                <ClipboardList className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="font-semibold text-slate-700 mt-2">No orders yet</h3>
                <p className="text-sm text-slate-500 mt-1">Orders will appear here once the marketplace goes live.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((o) => (
                  <div key={o.id} className="resqly-card p-4">
                    <div className="flex justify-between">
                      <div className="text-xs text-slate-500">#{o.id.slice(0,8)}</div>
                      <span className="text-xs font-semibold capitalize px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{o.status}</span>
                    </div>
                    <div className="font-medium text-slate-900 mt-1">{o.customer_name || 'Customer'}</div>
                    <div className="text-xs text-slate-500">{o.service_type}</div>
                    <div className="flex justify-between mt-2 text-sm">
                      <span>Amount: ₹{o.amount}</span>
                      <span>Net: ₹{o.net_earnings}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </MobileShell>
        <BottomNav variant="provider" />
      </div>
    </div>
  );
}

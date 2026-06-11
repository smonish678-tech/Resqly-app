import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import api from '@/lib/api';
import MobileShell from '@/components/MobileShell';

export default function ConsumerNotifications() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    api.get('/notifications').then(({ data }) => setItems(data.notifications)).catch(() => {});
  }, []);
  return (
    <MobileShell title="Notifications">
      <div className="px-5 py-5">
        {items.length === 0 ? (
          <div className="resqly-card p-8 text-center">
            <Bell className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="font-semibold text-slate-700 mt-2">No notifications yet</h3>
            <p className="text-sm text-slate-500 mt-1">We'll notify you about service launches and updates here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((n) => (
              <div key={n.id} className="resqly-card p-4">
                <div className="font-medium text-slate-900 text-sm">{n.title}</div>
                <div className="text-sm text-slate-600 mt-1">{n.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileShell>
  );
}

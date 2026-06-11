import { useEffect, useState } from 'react';
import api from '@/lib/api';
import MobileShell from '@/components/MobileShell';
import BottomNav from '@/components/BottomNav';
import { Star } from 'lucide-react';

export default function ProviderReviews() {
  const [data, setData] = useState({ reviews: [], average: 0, total: 0 });
  useEffect(() => {
    api.get('/providers/me/reviews').then(({ data }) => setData(data)).catch(() => {});
  }, []);

  return (
    <div className="resqly-shell">
      <div className="resqly-frame flex flex-col min-h-screen">
        <MobileShell title="Reviews" header>
          <div className="px-5 py-5">
            <div className="resqly-card p-5 text-center">
              <div className="text-4xl font-bold text-slate-900">{data.average || 0}</div>
              <div className="flex justify-center mt-1">
                {[1,2,3,4,5].map((i) => (
                  <Star key={i} className={`w-4 h-4 ${i <= Math.round(data.average) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                ))}
              </div>
              <div className="text-xs text-slate-500 mt-1">{data.total} reviews</div>
            </div>

            <div className="mt-4">
              {data.reviews.length === 0 ? (
                <div className="resqly-card p-8 text-center">
                  <Star className="w-8 h-8 text-slate-300 mx-auto" />
                  <h3 className="font-semibold text-slate-700 mt-2">No reviews yet</h3>
                  <p className="text-sm text-slate-500 mt-1">Reviews from customers will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.reviews.map((r) => (
                    <div key={r.id} className="resqly-card p-4">
                      <div className="flex justify-between">
                        <div className="font-medium text-slate-900 text-sm">{r.customer_name}</div>
                        <div className="flex">{[1,2,3,4,5].map((i) => <Star key={i} className={`w-3 h-3 ${i <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />)}</div>
                      </div>
                      <p className="text-sm text-slate-600 mt-2">{r.review}</p>
                    </div>
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

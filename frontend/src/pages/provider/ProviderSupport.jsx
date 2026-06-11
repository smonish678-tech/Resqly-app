import MobileShell from '@/components/MobileShell';
import { LifeBuoy, Mail, Phone } from 'lucide-react';

export default function ProviderSupport() {
  return (
    <MobileShell title="Support">
      <div className="px-5 py-5">
        <div className="resqly-card p-6 text-center">
          <LifeBuoy className="w-10 h-10 text-blue-700 mx-auto" />
          <h2 className="text-lg font-semibold text-slate-900 mt-2">We're here to help</h2>
          <p className="text-sm text-slate-500 mt-1">Reach out to our provider support team</p>
        </div>
        <div className="resqly-card p-5 mt-4 space-y-3">
          <a href="mailto:support@resqly.in" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50">
            <Mail className="w-5 h-5 text-blue-700" />
            <div>
              <div className="text-sm font-medium text-slate-900">Email Support</div>
              <div className="text-xs text-slate-500">support@resqly.in</div>
            </div>
          </a>
          <a href="tel:+918000000000" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50">
            <Phone className="w-5 h-5 text-blue-700" />
            <div>
              <div className="text-sm font-medium text-slate-900">Phone Support</div>
              <div className="text-xs text-slate-500">+91 80000 00000</div>
            </div>
          </a>
        </div>
        <p className="text-xs text-slate-500 mt-4 text-center">Response time: typically within 24 hours.</p>
      </div>
    </MobileShell>
  );
}

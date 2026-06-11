import MobileShell from '@/components/MobileShell';
import { Mail, Phone, MessageCircle } from 'lucide-react';

export default function Support() {
  return (
    <MobileShell title="Support">
      <div className="px-5 py-5">
        <div className="resqly-card p-6 text-center">
          <MessageCircle className="w-10 h-10 text-blue-700 mx-auto" />
          <h2 className="text-lg font-semibold text-slate-900 mt-2">How can we help?</h2>
          <p className="text-sm text-slate-500 mt-1">Our team is available 24/7 to assist you.</p>
        </div>
        <div className="resqly-card p-5 mt-4 divide-y">
          <a href="mailto:support@resqly.in" className="flex items-center gap-3 p-3">
            <Mail className="w-5 h-5 text-blue-700" />
            <div><div className="text-sm font-medium">Email Support</div><div className="text-xs text-slate-500">support@resqly.in</div></div>
          </a>
          <a href="tel:+918000000000" className="flex items-center gap-3 p-3">
            <Phone className="w-5 h-5 text-blue-700" />
            <div><div className="text-sm font-medium">Phone</div><div className="text-xs text-slate-500">+91 80000 00000</div></div>
          </a>
        </div>
        <div className="mt-4">
          <h3 className="font-semibold text-slate-900">Frequently asked</h3>
          <div className="mt-2 space-y-2">
            <FAQ q="When will services go live?" a="We are onboarding providers across India. We will notify you as soon as Resqly is live in your area." />
            <FAQ q="Is my data safe?" a="Yes. We use industry-grade encryption and only share emergency information with authorised responders." />
            <FAQ q="How can I become a Resqly Ranger?" a="Tap 'Join as Resqly Ranger' from the landing page and complete the KYC flow for your category." />
          </div>
        </div>
      </div>
    </MobileShell>
  );
}
function FAQ({ q, a }) {
  return (
    <details className="resqly-card p-4">
      <summary className="cursor-pointer font-medium text-sm text-slate-900">{q}</summary>
      <p className="text-sm text-slate-600 mt-2">{a}</p>
    </details>
  );
}

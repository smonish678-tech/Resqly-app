import MobileShell from '@/components/MobileShell';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function Contact() {
  return (
    <MobileShell title="Contact Us">
      <div className="px-5 py-5">
        <div className="resqly-card p-5">
          <h2 className="text-lg font-semibold text-slate-900">Resqly Healthcare Pvt. Ltd.</h2>
          <p className="text-sm text-slate-500 mt-1">Healthcare Simplified</p>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <div className="flex gap-3"><Mail className="w-4 h-4 text-blue-700 mt-0.5" /><div><div className="font-medium">Email</div><div className="text-slate-500">hello@resqly.in</div></div></div>
            <div className="flex gap-3"><Phone className="w-4 h-4 text-blue-700 mt-0.5" /><div><div className="font-medium">Phone</div><div className="text-slate-500">+91 80000 00000</div></div></div>
            <div className="flex gap-3"><MapPin className="w-4 h-4 text-blue-700 mt-0.5" /><div><div className="font-medium">Office</div><div className="text-slate-500">HSR Layout, Bangalore, Karnataka 560102, India</div></div></div>
          </div>
        </div>
        <div className="resqly-card p-5 mt-4 text-sm text-slate-600">
          <h3 className="font-semibold text-slate-900">Business Hours</h3>
          <div className="mt-2 space-y-1">
            <div>Mon – Sat: 9:00 AM – 9:00 PM</div>
            <div>Sun: 10:00 AM – 6:00 PM</div>
            <div className="text-blue-700 font-medium">Emergency support: 24x7</div>
          </div>
        </div>
      </div>
    </MobileShell>
  );
}

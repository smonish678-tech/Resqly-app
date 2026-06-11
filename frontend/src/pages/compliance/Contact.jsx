import MobileShell from '@/components/MobileShell';
import { Mail, Phone, MapPin, Building2 } from 'lucide-react';

export default function Contact() {
  return (
    <MobileShell title="Contact Us">
      <div className="px-5 py-5">
        <div className="resqly-card p-5">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-700" />
            <h2 className="text-lg font-bold text-slate-900">Resqly Private Limited</h2>
          </div>
          <p className="text-sm text-slate-500 mt-1">Healthcare Simplified</p>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <div className="flex gap-3">
              <MapPin className="w-4 h-4 text-blue-700 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium">Registered Office</div>
                <div className="text-slate-500">
                  OM Chambers, 648/A, 4th Floor<br/>
                  Binnamangala, 1st Stage, Indiranagar<br/>
                  Bangalore, Karnataka – 560038<br/>
                  India
                </div>
              </div>
            </div>
            <a data-testid="contact-email" href="mailto:info@resqly.in" className="flex gap-3 hover:bg-slate-50 -mx-2 px-2 py-2 rounded-lg">
              <Mail className="w-4 h-4 text-blue-700 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium">Email</div>
                <div className="text-blue-700">info@resqly.in</div>
              </div>
            </a>
            <a data-testid="contact-phone" href="tel:+918095404400" className="flex gap-3 hover:bg-slate-50 -mx-2 px-2 py-2 rounded-lg">
              <Phone className="w-4 h-4 text-blue-700 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium">Phone</div>
                <div className="text-blue-700">+91 80954 04400</div>
              </div>
            </a>
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
        <div className="resqly-card p-5 mt-4 text-sm text-slate-600">
          <h3 className="font-semibold text-slate-900">Grievances</h3>
          <p className="mt-2">For grievances under Indian IT regulations, please write to <a href="mailto:info@resqly.in" className="text-blue-700 font-medium">info@resqly.in</a>. We aim to acknowledge complaints within 48 hours and resolve them within 15 working days.</p>
        </div>
      </div>
    </MobileShell>
  );
}

import MobileShell from '@/components/MobileShell';
import { Camera, Image as ImageIcon, MapPin, ShieldCheck } from 'lucide-react';

export default function Permissions() {
  return (
    <MobileShell title="App Permissions">
      <div className="px-5 py-5">
        <div className="resqly-card p-5">
          <ShieldCheck className="w-8 h-8 text-blue-700" />
          <h2 className="text-lg font-semibold text-slate-900 mt-2">Why we ask for permissions</h2>
          <p className="text-sm text-slate-500 mt-1">We only request the minimum set of permissions required to provide healthcare services. We never request background location, SMS, contacts or call logs.</p>
        </div>
        <div className="resqly-card p-5 mt-4 divide-y">
          <PermItem icon={<Camera className="w-5 h-5 text-blue-700" />} title="Camera" desc="Used to capture KYC documents and selfie verification for providers." />
          <PermItem icon={<ImageIcon className="w-5 h-5 text-blue-700" />} title="Photos / Media" desc="Used to upload KYC documents and profile photos." />
          <PermItem icon={<MapPin className="w-5 h-5 text-blue-700" />} title="Location (While Using App)" desc="Used to set your city, find nearby providers, and dispatch emergency responders." />
        </div>
        <p className="text-xs text-slate-500 mt-4 text-center">You can revoke permissions any time from your device settings.</p>
      </div>
    </MobileShell>
  );
}
function PermItem({ icon, title, desc }) {
  return (
    <div className="flex gap-3 p-3">
      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">{icon}</div>
      <div><div className="font-medium text-slate-900 text-sm">{title}</div><div className="text-xs text-slate-500 mt-0.5">{desc}</div></div>
    </div>
  );
}

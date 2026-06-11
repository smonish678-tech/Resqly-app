import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Heart, Phone, AlertTriangle, Edit3, HeartPulse, Activity, Hospital, PillBottle } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import MobileShell from '@/components/MobileShell';
import { Button } from '@/components/ui/button';

export default function SOSVault() {
  const { me } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  useEffect(() => {
    api.get('/me').then(({ data }) => setUser(data.user)).catch(() => {});
  }, []);
  const u = user || me || {};
  const contacts = u.emergency_contacts || [];

  return (
    <div className="resqly-shell">
      <div className="resqly-frame flex flex-col min-h-screen pb-32">
        <MobileShell title="SOS Vault" header action={
          <button data-testid="sosv-edit" onClick={() => navigate('/consumer/profile')} className="text-blue-700 text-sm font-semibold inline-flex items-center gap-1"><Edit3 className="w-4 h-4" /> Edit</button>
        }>
          <div className="px-5 py-5">
            {/* Hero */}
            <div className="emergency-fab rounded-3xl p-5 text-white">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">PREMIUM</span>
              </div>
              <h2 className="text-2xl font-bold mt-2">Your safety profile</h2>
              <p className="text-sm text-white/90 mt-1">First responders can access this critical information instantly in an emergency.</p>
            </div>

            {/* Critical Cards */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <Card icon={<Heart className="w-5 h-5 text-rose-600" />} label="Blood Group" value={u.blood_group || 'Not set'} testid="sosv-blood" />
              <Card icon={<Hospital className="w-5 h-5 text-blue-600" />} label="Preferred Hospital" value={u.preferred_hospital || 'Not set'} testid="sosv-hospital" />
            </div>

            <Section title="Allergies" icon={<AlertTriangle className="w-4 h-4 text-amber-600" />} list={u.allergies} empty="None reported" testid="sosv-allergies" />
            <Section title="Medical Conditions" icon={<HeartPulse className="w-4 h-4 text-rose-600" />} list={[...(u.medical_conditions || []), ...(u.chronic_diseases || [])]} empty="None reported" testid="sosv-conditions" />
            <Section title="Current Medications" icon={<PillBottle className="w-4 h-4 text-emerald-600" />} list={u.current_medications} empty="None" testid="sosv-medications" />
            <Section title="Past Surgeries" icon={<Activity className="w-4 h-4 text-blue-600" />} list={u.surgeries} empty="None reported" testid="sosv-surgeries" />

            <div className="mt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Emergency Contacts</h3>
              {contacts.length === 0 ? (
                <div className="resqly-card p-4 text-sm text-slate-500 text-center">
                  No emergency contacts. <button onClick={() => navigate('/consumer/profile')} className="text-blue-700 font-semibold">Add now</button>
                </div>
              ) : (
                <div className="space-y-2">
                  {contacts.map((c, i) => (
                    <div key={i} className="resqly-card p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 font-bold flex items-center justify-center">{(c.name || '?').charAt(0).toUpperCase()}</div>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900">{c.name}</div>
                        <div className="text-xs text-slate-500">{c.relation || 'Contact'} • +91 {c.phone}</div>
                      </div>
                      <a data-testid={`sosv-call-${i}`} href={`tel:${c.phone}`} className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center"><Phone className="w-4 h-4" /></a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="resqly-card p-4 mt-5 bg-blue-50/50 border-blue-100 text-xs text-slate-700">
              <b>How SOS Vault works:</b> When you request an emergency ambulance, this profile is automatically shared with the responding provider so they arrive prepared with the right equipment and care plan.
            </div>

            <div className="grid grid-cols-2 gap-3 mt-5">
              <Button data-testid="sosv-emergency-call" onClick={() => window.location.href = 'tel:108'} className="bg-rose-600 hover:bg-rose-700 h-12"><Phone className="w-4 h-4 mr-1" /> Call 108</Button>
              <Button data-testid="sosv-request-ambulance" onClick={() => navigate('/consumer/emergency-request')} variant="outline" className="border-rose-200 text-rose-700 hover:bg-rose-50 h-12">Request Ambulance</Button>
            </div>
          </div>
        </MobileShell>
      </div>
    </div>
  );
}

function Card({ icon, label, value, testid }) {
  return (
    <div data-testid={testid} className="resqly-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">{label}</span>
        {icon}
      </div>
      <div className="text-lg font-bold text-slate-900 mt-1">{value}</div>
    </div>
  );
}

function Section({ title, icon, list, empty, testid }) {
  const items = (list || []).filter(Boolean);
  return (
    <div className="mt-4" data-testid={testid}>
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 inline-flex items-center gap-1">{icon} {title}</h3>
      <div className="resqly-card p-3">
        {items.length === 0 ? (
          <span className="text-sm text-slate-500">{empty}</span>
        ) : (
          <div className="flex flex-wrap gap-2">
            {items.map((x, i) => <span key={i} className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-medium">{x}</span>)}
          </div>
        )}
      </div>
    </div>
  );
}

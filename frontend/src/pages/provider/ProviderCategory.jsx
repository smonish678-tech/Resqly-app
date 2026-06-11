import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Ambulance, Stethoscope, Pill, Home as HomeIcon, HeartPulse, Users, PawPrint, PillBottle, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import MobileShell from '@/components/MobileShell';
import { Button } from '@/components/ui/button';

const ICONS = {
  ambulance: Ambulance, doctor: Stethoscope, pharmacy: Pill, home_nursing: HomeIcon,
  home_care: HeartPulse, bystander: Users, pet_doctor: PawPrint, pet_pharmacy: PillBottle,
};

export default function ProviderCategory() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data.categories)).catch(() => {});
    api.get('/providers/me').then(({ data }) => setSelected(data.provider?.category || '')).catch(() => {});
  }, []);

  const save = async () => {
    if (!selected) { toast.error('Choose a category'); return; }
    setSaving(true);
    try {
      await api.patch('/providers/me/category', { category: selected });
      await refresh();
      navigate('/provider/kyc');
    } catch (e) { toast.error(e.response?.data?.detail || 'Failed'); } finally { setSaving(false); }
  };

  return (
    <MobileShell title="Select your category" hideBack>
      <div className="px-5 py-5">
        <h2 className="text-xl font-semibold text-slate-900">What service do you offer?</h2>
        <p className="text-sm text-slate-500 mt-1">Choose one to get the right KYC checklist.</p>

        <div className="grid grid-cols-2 gap-3 mt-5">
          {categories.map((c) => {
            const Icon = ICONS[c.key] || Stethoscope;
            const active = selected === c.key;
            return (
              <button
                data-testid={`cat-${c.key}`}
                key={c.key}
                onClick={() => setSelected(c.key)}
                className={`resqly-card p-4 flex flex-col items-center gap-2 border-2 transition ${active ? 'border-blue-600 bg-blue-50' : 'border-transparent'}`}
              >
                <div className={`icon-tile ${active ? 'bg-blue-100' : 'bg-slate-50'}`}>
                  <Icon className={`w-6 h-6 ${active ? 'text-blue-700' : 'text-slate-700'}`} />
                </div>
                <span className="text-sm font-medium text-slate-800">{c.label}</span>
                {active && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
              </button>
            );
          })}
        </div>

        <Button data-testid="cat-continue" onClick={save} disabled={!selected || saving} className="w-full mt-6 bg-blue-700 hover:bg-blue-800">
          {saving ? 'Saving...' : 'Continue to KYC'}
        </Button>
      </div>
    </MobileShell>
  );
}

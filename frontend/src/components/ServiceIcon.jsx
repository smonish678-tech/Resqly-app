import * as Icons from 'lucide-react';
import { SERVICE_ICONS, SERVICE_COLORS } from '@/lib/constants';

export default function ServiceIcon({ serviceKey, size = 28 }) {
  const iconName = SERVICE_ICONS[serviceKey] || 'Activity';
  const Icon = Icons[iconName] || Icons.Activity;
  const colors = SERVICE_COLORS[serviceKey] || { bg: '#E0F2FE', fg: '#0284C7' };
  return (
    <div className="icon-tile" style={{ background: colors.bg }}>
      <Icon size={size} color={colors.fg} strokeWidth={2} />
    </div>
  );
}

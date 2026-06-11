import { useEffect, useState } from 'react';
import Logo from '@/components/Logo';

export default function Splash({ onDone, duration = 2200 }) {
  const [fading, setFading] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), duration - 500);
    const t2 = setTimeout(() => onDone && onDone(), duration);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [duration, onDone]);
  return (
    <div className={`splash-screen ${fading ? 'fade-out' : ''}`}>
      <div className="splash-logo flex flex-col items-center">
        <Logo size={84} withText={false} />
        <div className="mt-5 text-white font-bold text-3xl tracking-tight">Resqly</div>
        <div className="mt-2 text-blue-100 text-sm font-medium">Healthcare Simplified</div>
      </div>
      <div className="absolute bottom-10 text-white/70 text-xs font-medium tracking-wider">
        TRUSTED HEALTHCARE NETWORK
      </div>
    </div>
  );
}

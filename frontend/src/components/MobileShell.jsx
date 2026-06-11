import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function MobileShell({ children, header = true, title, hideBack, action }) {
  const navigate = useNavigate();
  return (
    <div className="resqly-shell">
      <div className="resqly-frame flex flex-col">
        {header && (
          <div className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-100 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {!hideBack && (
                <button data-testid="shell-back" onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-slate-100">
                  <ChevronLeft className="w-5 h-5 text-slate-700" />
                </button>
              )}
              <div className="font-semibold text-slate-900">{title}</div>
            </div>
            <div>{action}</div>
          </div>
        )}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function MobileShell({ children, header = true, title, hideBack, action, wide = false }) {
  const navigate = useNavigate();
  return (
    <div className={`resqly-shell ${wide ? 'admin-shell' : ''}`}>
      <div className={`resqly-frame flex flex-col ${wide ? 'resqly-frame-wide' : ''}`}>
        {header && (
          <div className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-100 px-4 py-3 safe-area-header flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              {!hideBack && (
                <button aria-label="Go back" data-testid="shell-back" onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 min-w-[44px] min-h-[44px] flex items-center justify-center">
                  <ChevronLeft className="w-5 h-5 text-slate-700" />
                </button>
              )}
              <div className="font-semibold text-slate-950 truncate">{title}</div>
            </div>
            <div className="flex-shrink-0">{action}</div>
          </div>
        )}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

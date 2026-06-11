// Resqly logo as inline SVG to avoid external asset dependency.
export default function Logo({ size = 36, withText = true, className = '', textColor = '#1E40AF' }) {
  const iconSize = size;
  const textSize = size * 0.62;
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* R mark */}
      <svg width={iconSize} height={iconSize} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Resqly logo">
        <defs>
          <linearGradient id="resqlyGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#1E40AF" />
            <stop offset="1" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="60" height="60" rx="14" fill="url(#resqlyGrad)" />
        {/* Stylised R */}
        <path
          d="M20 14 H36 C44 14 49 19 49 26 C49 31 46 35 41 37 L51 50 H42 L33 38 H28 V50 H20 Z M28 22 V31 H35 C38.5 31 40.5 29 40.5 26.5 C40.5 24 38.5 22 35 22 Z"
          fill="#FFFFFF"
        />
      </svg>
      {withText && (
        <div className="flex items-end gap-0.5">
          <span className="font-bold tracking-tight" style={{ fontSize: textSize, color: textColor, lineHeight: 1 }}>Resqly</span>
        </div>
      )}
    </div>
  );
}

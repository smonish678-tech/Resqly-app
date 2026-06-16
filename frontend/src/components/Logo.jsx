import logo from '../assets/Resqly Logo app.png';

export default function Logo({ size = 36, withText = true, className = '' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src={logo}
        alt="Resqly"
        style={{
          width: size,
          height: size,
          objectFit: 'contain'
        }}
      />

      {withText && (
        <span className="font-bold">
          Resqly
        </span>
      )}
    </div>
  );
}
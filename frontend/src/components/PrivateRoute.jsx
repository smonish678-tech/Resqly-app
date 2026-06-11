import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';

export default function PrivateRoute({ children, allow }) {
  const { token, role, loading } = useAuth();
  if (loading) {
    return (
      <div className="resqly-shell">
        <div className="resqly-frame flex items-center justify-center min-h-screen">
          <div className="text-slate-500 text-sm">Loading...</div>
        </div>
      </div>
    );
  }
  if (!token) {
    if (allow && allow.includes('provider')) return <Navigate to="/provider/login" replace />;
    return <Navigate to="/consumer/login" replace />;
  }
  if (allow && !allow.includes(role)) {
    if (role === 'provider') return <Navigate to="/provider/dashboard" replace />;
    if (role === 'consumer') return <Navigate to="/consumer/home" replace />;
    if (role === 'admin') return <Navigate to="/admin" replace />;
  }
  return children;
}

import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/auth';
import { Toaster } from '@/components/ui/sonner';
import PrivateRoute from '@/components/PrivateRoute';
import Splash from '@/components/Splash';

// Consumer
import ConsumerLogin from '@/pages/consumer/ConsumerLogin';
import ConsumerOnboarding from '@/pages/consumer/ConsumerOnboarding';
import ConsumerHome from '@/pages/consumer/ConsumerHome';
import ConsumerServiceDetail from '@/pages/consumer/ConsumerServiceDetail';
import ConsumerWaitlist from '@/pages/consumer/ConsumerWaitlist';
import ConsumerEmergency from '@/pages/consumer/ConsumerEmergency';
import ConsumerProfile from '@/pages/consumer/ConsumerProfile';
import ConsumerNotifications from '@/pages/consumer/ConsumerNotifications';
import ConsumerFamily from '@/pages/consumer/ConsumerFamily';
import ConsumerPrescriptions from '@/pages/consumer/ConsumerPrescriptions';
import ConsumerLabTests from '@/pages/consumer/ConsumerLabTests';
import ConsumerEmergencyRequest from '@/pages/consumer/ConsumerEmergencyRequest';

// Provider
import ProviderLogin from '@/pages/provider/ProviderLogin';
import ProviderCategory from '@/pages/provider/ProviderCategory';
import ProviderKYC from '@/pages/provider/ProviderKYC';
import ProviderStatus from '@/pages/provider/ProviderStatus';
import ProviderDashboard from '@/pages/provider/ProviderDashboard';
import ProviderOrders from '@/pages/provider/ProviderOrders';
import ProviderEarnings from '@/pages/provider/ProviderEarnings';
import ProviderReviews from '@/pages/provider/ProviderReviews';
import ProviderDocuments from '@/pages/provider/ProviderDocuments';
import ProviderProfile from '@/pages/provider/ProviderProfile';
import ProviderSupport from '@/pages/provider/ProviderSupport';

// Admin
import AdminLogin from '@/pages/admin/AdminLogin';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminProviderDetail from '@/pages/admin/AdminProviderDetail';

// Compliance
import Privacy from '@/pages/compliance/Privacy';
import Terms from '@/pages/compliance/Terms';
import Support from '@/pages/compliance/Support';
import Contact from '@/pages/compliance/Contact';
import DeleteAccount from '@/pages/compliance/DeleteAccount';
import Permissions from '@/pages/compliance/Permissions';

import '@/App.css';

function RootRedirect() {
  // Consumer is the default experience. If already logged in as consumer, go to home.
  // Otherwise, go to consumer login.
  const { token, role, loading } = useAuth();
  if (loading) return null;
  if (token && role === 'consumer') return <Navigate to="/consumer/home" replace />;
  if (token && role === 'provider') return <Navigate to="/provider/dashboard" replace />;
  if (token && role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/consumer/login" replace />;
}

function App() {
  const [splashed, setSplashed] = useState(() => sessionStorage.getItem('resqly_splashed') === '1');
  useEffect(() => {
    if (splashed) sessionStorage.setItem('resqly_splashed', '1');
  }, [splashed]);

  return (
    <AuthProvider>
      {!splashed && <Splash onDone={() => { sessionStorage.setItem('resqly_splashed', '1'); setSplashed(true); }} />}
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />

          {/* Consumer */}
          <Route path="/consumer/login" element={<ConsumerLogin />} />
          <Route path="/consumer/onboarding" element={<PrivateRoute allow={['consumer']}><ConsumerOnboarding /></PrivateRoute>} />
          <Route path="/consumer/home" element={<PrivateRoute allow={['consumer']}><ConsumerHome /></PrivateRoute>} />
          <Route path="/consumer/service/:serviceKey" element={<PrivateRoute allow={['consumer']}><ConsumerServiceDetail /></PrivateRoute>} />
          <Route path="/consumer/waitlist" element={<PrivateRoute allow={['consumer']}><ConsumerWaitlist /></PrivateRoute>} />
          <Route path="/consumer/emergency" element={<PrivateRoute allow={['consumer']}><ConsumerEmergency /></PrivateRoute>} />
          <Route path="/consumer/emergency-request" element={<PrivateRoute allow={['consumer']}><ConsumerEmergencyRequest /></PrivateRoute>} />
          <Route path="/consumer/profile" element={<PrivateRoute allow={['consumer']}><ConsumerProfile /></PrivateRoute>} />
          <Route path="/consumer/notifications" element={<PrivateRoute allow={['consumer']}><ConsumerNotifications /></PrivateRoute>} />
          <Route path="/consumer/family" element={<PrivateRoute allow={['consumer']}><ConsumerFamily /></PrivateRoute>} />
          <Route path="/consumer/prescriptions" element={<PrivateRoute allow={['consumer']}><ConsumerPrescriptions /></PrivateRoute>} />
          <Route path="/consumer/lab-tests" element={<PrivateRoute allow={['consumer']}><ConsumerLabTests /></PrivateRoute>} />

          {/* Provider */}
          <Route path="/provider/login" element={<ProviderLogin />} />
          <Route path="/provider/category" element={<PrivateRoute allow={['provider']}><ProviderCategory /></PrivateRoute>} />
          <Route path="/provider/kyc" element={<PrivateRoute allow={['provider']}><ProviderKYC /></PrivateRoute>} />
          <Route path="/provider/status" element={<PrivateRoute allow={['provider']}><ProviderStatus /></PrivateRoute>} />
          <Route path="/provider/dashboard" element={<PrivateRoute allow={['provider']}><ProviderDashboard /></PrivateRoute>} />
          <Route path="/provider/orders" element={<PrivateRoute allow={['provider']}><ProviderOrders /></PrivateRoute>} />
          <Route path="/provider/earnings" element={<PrivateRoute allow={['provider']}><ProviderEarnings /></PrivateRoute>} />
          <Route path="/provider/reviews" element={<PrivateRoute allow={['provider']}><ProviderReviews /></PrivateRoute>} />
          <Route path="/provider/documents" element={<PrivateRoute allow={['provider']}><ProviderDocuments /></PrivateRoute>} />
          <Route path="/provider/profile" element={<PrivateRoute allow={['provider']}><ProviderProfile /></PrivateRoute>} />
          <Route path="/provider/support" element={<PrivateRoute allow={['provider']}><ProviderSupport /></PrivateRoute>} />

          {/* Admin (hidden) */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<PrivateRoute allow={['admin']}><AdminDashboard /></PrivateRoute>} />
          <Route path="/admin/providers/:id" element={<PrivateRoute allow={['admin']}><AdminProviderDetail /></PrivateRoute>} />

          {/* Compliance */}
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/support" element={<Support />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/delete-account" element={<DeleteAccount />} />
          <Route path="/permissions" element={<Permissions />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-center" richColors closeButton />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/lib/auth';
import { Toaster } from '@/components/ui/sonner';
import PrivateRoute from '@/components/PrivateRoute';

import Landing from '@/pages/Landing';

// Consumer
import ConsumerLogin from '@/pages/consumer/ConsumerLogin';
import ConsumerOnboarding from '@/pages/consumer/ConsumerOnboarding';
import ConsumerHome from '@/pages/consumer/ConsumerHome';
import ConsumerServiceDetail from '@/pages/consumer/ConsumerServiceDetail';
import ConsumerWaitlist from '@/pages/consumer/ConsumerWaitlist';
import ConsumerEmergency from '@/pages/consumer/ConsumerEmergency';
import ConsumerProfile from '@/pages/consumer/ConsumerProfile';
import ConsumerNotifications from '@/pages/consumer/ConsumerNotifications';

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

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />

          {/* Consumer */}
          <Route path="/consumer/login" element={<ConsumerLogin />} />
          <Route path="/consumer/onboarding" element={<PrivateRoute allow={['consumer']}><ConsumerOnboarding /></PrivateRoute>} />
          <Route path="/consumer/home" element={<PrivateRoute allow={['consumer']}><ConsumerHome /></PrivateRoute>} />
          <Route path="/consumer/service/:serviceKey" element={<PrivateRoute allow={['consumer']}><ConsumerServiceDetail /></PrivateRoute>} />
          <Route path="/consumer/waitlist" element={<PrivateRoute allow={['consumer']}><ConsumerWaitlist /></PrivateRoute>} />
          <Route path="/consumer/emergency" element={<PrivateRoute allow={['consumer']}><ConsumerEmergency /></PrivateRoute>} />
          <Route path="/consumer/profile" element={<PrivateRoute allow={['consumer']}><ConsumerProfile /></PrivateRoute>} />
          <Route path="/consumer/notifications" element={<PrivateRoute allow={['consumer']}><ConsumerNotifications /></PrivateRoute>} />

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

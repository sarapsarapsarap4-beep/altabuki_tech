import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Users from './pages/Users';
import Vendors from './pages/Vendors';
import Categories from './pages/Categories';
import Banners from './pages/Banners';
import Coupons from './pages/Coupons';
import Reviews from './pages/Reviews';
import Analytics from './pages/Analytics';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Earnings from './pages/Earnings';
import Reports from './pages/Reports';
import AdminStore from './pages/AdminStore';
import Staff from './pages/Staff';
import Disputes from './pages/Disputes';
import DeliverySlots from './pages/DeliverySlots';
import Shipping from './pages/Shipping';
import BulkOperations from './pages/BulkOperations';
import WifiNetworks from './pages/WifiNetworks';
import './index.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-teal-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
          <p className="text-gray-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-teal-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
          <p className="text-gray-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
      <Route path="/vendors" element={<ProtectedRoute><Vendors /></ProtectedRoute>} />
      <Route path="/wifi-networks" element={<ProtectedRoute><WifiNetworks /></ProtectedRoute>} />
      <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
      <Route path="/banners" element={<ProtectedRoute><Banners /></ProtectedRoute>} />
      <Route path="/coupons" element={<ProtectedRoute><Coupons /></ProtectedRoute>} />
      <Route path="/reviews" element={<ProtectedRoute><Reviews /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
       <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
       <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/earnings" element={<ProtectedRoute><Earnings /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="/admin-store" element={<ProtectedRoute><AdminStore /></ProtectedRoute>} />
      <Route path="/disputes" element={<ProtectedRoute><Disputes /></ProtectedRoute>} />
      <Route path="/staff" element={<ProtectedRoute><Staff /></ProtectedRoute>} />
      <Route path="/delivery-slots" element={<ProtectedRoute><DeliverySlots /></ProtectedRoute>} />
      <Route path="/shipping" element={<ProtectedRoute><Shipping /></ProtectedRoute>} />
      <Route path="/bulk-operations" element={<ProtectedRoute><BulkOperations /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

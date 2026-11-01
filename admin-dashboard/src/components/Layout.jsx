import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SkipToContent from './SkipToContent';
import {
  LayoutDashboard, Users, ShoppingBag, Store,
  FolderTree, Star, BarChart3, LogOut, Menu, X, Settings,
  Bell, Image, ChevronLeft, ChevronRight, Wallet, FileText, Activity, Shield, Tag, UserCog, Scale,
  Clock, Truck, Database, Wifi, } from 'lucide-react';

const menuItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, color: 'from-violet-500 to-purple-600' },
  { path: '/users', label: 'Users', icon: Users, color: 'from-blue-500 to-cyan-600' },
  { path: '/vendors', label: 'Vendors', icon: Store, color: 'from-teal-500 to-violet-600' },
  { path: '/wifi-networks', label: 'Wi-Fi Networks', icon: Wifi, color: 'from-violet-500 to-purple-700' },
  { path: '/orders', label: 'Orders', icon: ShoppingBag, color: 'from-orange-500 to-red-500' },
  { path: '/categories', label: 'Categories', icon: FolderTree, color: 'from-indigo-500 to-blue-600' },
  { path: '/banners', label: 'Banners', icon: Image, color: 'from-pink-500 to-rose-600' },
  { path: '/coupons', label: 'Coupons', icon: Tag, color: 'from-purple-500 to-violet-600' },
  { path: '/disputes', label: 'Disputes', icon: Scale, color: 'from-red-500 to-rose-600' },
  { path: '/reviews', label: 'Reviews', icon: Star, color: 'from-yellow-500 to-amber-600' },
  { path: '/notifications', label: 'Notifications', icon: Bell, color: 'from-amber-500 to-orange-600' },
  { path: '/earnings', label: 'Earnings', icon: Wallet, color: 'from-purple-500 to-violet-600' },
  { path: '/reports', label: 'Reports', icon: FileText, color: 'from-gray-500 to-slate-600' },
  { path: '/analytics', label: 'Analytics', icon: Activity, color: 'from-cyan-500 to-blue-600' },
  { path: '/delivery-slots', label: 'Delivery Slots', icon: Clock, color: 'from-cyan-500 to-teal-600' },
  { path: '/shipping', label: 'Shipping', icon: Truck, color: 'from-blue-500 to-indigo-600' },
  { path: '/bulk-operations', label: 'Bulk Ops', icon: Database, color: 'from-orange-500 to-amber-600' },
  { path: '/staff', label: 'Staff', icon: UserCog, color: 'from-rose-500 to-pink-600' },
  { path: '/admin-store', label: 'Admin Store', icon: Shield, color: 'from-violet-500 to-purple-600' },
  { path: '/settings', label: 'Settings', icon: Settings, color: 'from-slate-500 to-gray-600' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentPath = '/' + (location.pathname.split('/')[1] || '');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30">
      <SkipToContent />
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-violet-600 to-purple-600 flex items-center px-4 z-30 shadow-lg shadow-violet-900/10">
        <button onClick={() => setMobileOpen(true)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
          <Menu size={24} className="text-white" />
        </button>
        <div className="ml-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <Store size={20} className="text-white" />
          </div>
          <span className="font-bold text-xl text-white">MyMart Admin</span>
        </div>
      </div>

      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 260 : 80 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={`
          fixed top-0 left-0 h-full z-40 shadow-2xl shadow-violet-900/5
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="h-full bg-gradient-to-b from-violet-600 via-purple-600 to-violet-700">
          <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
            <AnimatePresence mode="wait">
              {sidebarOpen ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Store size={24} className="text-white" />
                  </div>
                  <div>
                    <span className="font-bold text-xl text-white">MyMart</span>
                    <p className="text-[10px] text-violet-200 font-medium">Platform Admin</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mx-auto backdrop-blur-sm"
                >
                  <Store size={22} className="text-white" />
                </motion.div>
              )}
            </AnimatePresence>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:flex p-2 hover:bg-white/10 rounded-lg transition-all"
            >
              {sidebarOpen ? (
                <ChevronLeft size={20} className="text-white/80" />
              ) : (
                <ChevronRight size={20} className="text-white/80" />
              )}
            </button>
          </div>

          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg"
          >
            <X size={20} className="text-white" />
          </button>

          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)]">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <motion.button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setMobileOpen(false);
                  }}
                  onMouseEnter={() => setHoveredItem(item.path)}
                  onMouseLeave={() => setHoveredItem(null)}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
                    ${isActive
                      ? 'bg-white/20 backdrop-blur-sm shadow-lg shadow-black/10'
                      : 'hover:bg-white/10'}
                  `}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br ${item.color} shadow-lg ${hoveredItem === item.path ? 'scale-110' : ''} transition-transform`}>
                    <Icon size={20} className="text-white" />
                  </div>
                  <AnimatePresence mode="wait">
                    {sidebarOpen && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className={`font-medium ${isActive ? 'text-white' : 'text-violet-100'}`}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute left-0 w-1 h-8 bg-white rounded-r-full"
                    />
                  )}
                </motion.button>
              );
            })}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/10 bg-violet-800/30 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-300 to-purple-400 flex items-center justify-center shadow-lg">
                <span className="text-violet-700 font-bold text-lg">
                  {user?.first_name?.[0]?.toUpperCase() || 'A'}
                </span>
              </div>
              {sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 min-w-0"
                >
                  <p className="font-semibold text-white truncate">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-[11px] text-violet-200 truncate">{user?.email}</p>
                </motion.div>
              )}
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-red-500/20 text-white/80 hover:text-red-200 rounded-xl transition-all backdrop-blur-sm"
            >
              <LogOut size={18} />
              {sidebarOpen && <span className="font-medium">Logout</span>}
            </motion.button>
          </div>
        </div>
      </motion.aside>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.main
        id="main-content"
        initial={false}
        animate={{ marginLeft: sidebarOpen ? 260 : 80 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="min-h-screen pt-16 lg:pt-0"
      >
        <div className="p-6">
          {children}
        </div>
      </motion.main>
    </div>
  );
}

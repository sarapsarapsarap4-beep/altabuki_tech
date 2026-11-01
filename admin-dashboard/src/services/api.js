import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'https://my-mart-backend-two.vercel.app/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const cache = new Map();
const CACHE_TTL = 60000;

const getCached = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

const setCached = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
};

// Auth
export const adminLogin = (email, password) => api.post('/auth/login', { email, password });
export const getAdminProfile = () => api.get('/auth/profile');

// Admin Dashboard
export const getDashboardStats = (period = '30') => {
  const cacheKey = `dashboard_${period}`;
  const cached = getCached(cacheKey);
  if (cached) return Promise.resolve({ data: cached });
  return api.get('/admin/dashboard/stats', { params: { period } }).then(res => {
    setCached(cacheKey, res.data);
    return res;
  });
};

// Users
export const getUsers = (params = {}) => api.get('/admin/users', { params });
export const getUserById = (id) => api.get(`/admin/users/${id}`);
export const updateUserStatus = (id, is_active) => api.put(`/admin/users/${id}/status`, { is_active });
export const deleteUser = (id) => {
  cache.clear();
  return api.delete(`/admin/users/${id}`);
};

// Vendor Management (Admin manages vendor accounts, not their products)
export const getStores = (params = {}) => api.get('/admin/vendors', { params });
export const getStoreById = (id) => api.get(`/stores/${id}`);
export const updateStore = (id, data) => api.put(`/stores/${id}`, data);
export const approveVendor = (storeId) => {
  cache.clear();
  return api.put(`/admin/vendors/${storeId}/approve`);
};
export const approveStore = (storeId) => {
  cache.clear();
  return api.put(`/admin/stores/${storeId}/approve`);
};
export const suspendVendor = (id) => {
  cache.clear();
  return api.put(`/admin/vendors/${id}/suspend`, { reason: 'Policy violation' });
};
export const reactivateVendor = (id) => {
  cache.clear();
  return api.put(`/admin/vendors/${id}/reactivate`);
};

// Products - Admin does NOT manage vendor products
export const getProducts = (params = {}) => {
  return api.get('/products', { params });
};
export const getProductById = (id) => api.get(`/products/${id}`);

// Order Stats (Admin only sees summaries, not individual orders)
export const getOrders = (params = {}) => {
  return api.get('/admin/orders', { params });
};
export const getOrderStats = (params = {}) => {
  return api.get('/admin/orders/stats', { params });
};
export const getOrderById = (id) => api.get(`/orders/${id}`);
export const updateOrderStatus = (id, status) => api.put(`/admin/orders/${id}/status`, { status });

// Categories - Admin CRUD
export const getCategories = () => api.get('/admin/categories');
export const createCategory = (data) => api.post('/categories', data);
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);
export const getProductsByCategory = (categoryId, params = {}) => api.get(`/admin/categories/${categoryId}/products`, { params });

// Reviews
export const getReviews = (params = {}) => api.get('/reviews', { params });
export const deleteReview = (id) => api.delete(`/reviews/${id}`);

// Analytics
export const getAnalytics = (params = {}) => api.get('/admin/analytics/sales', { params });
export const getTopProducts = (params = {}) => api.get('/admin/analytics/top-products', { params });

// Reports
export const generateReport = (data) => api.post('/admin/reports/generate', data);
export const getReports = () => api.get('/admin/reports');

// Settings
export const getSettings = () => api.get('/admin/settings');
export const updateSetting = (key, value) => api.put('/admin/settings', { key, value });

// Commission
export const getCommissionSummary = () => api.get('/admin/commissions');
export const processPayout = (id, data) => api.post(`/admin/payouts`, { id, ...data });

// Settlements (real earnings/commission data)
export const getSettlementAdminStats = () => api.get('/settlements/admin/stats');
export const generateSettlement = (data) => api.post('/settlements/admin/settlements/generate', data);
export const processPayoutRequest = (data) => api.put('/settlements/admin/payout-requests/process', data);
export const getAllSettlements = (params) => api.get('/settlements/admin/settlements', { params });
export const getAllPayoutRequests = (params) => api.get('/settlements/admin/payout-requests', { params });

// Banners
export const getBanners = () => api.get('/banners/admin/all');
export const createBanner = (data) => api.post('/banners', data);
export const updateBanner = (id, data) => api.put(`/banners/${id}`, data);
export const deleteBanner = (id) => api.delete(`/banners/${id}`);

// Offers
export const getOffers = () => api.get('/banners/offers/admin/all');
export const createOffer = (data) => api.post('/banners/offers', data);
export const updateOffer = (id, data) => api.put(`/banners/offers/${id}`, data);
export const deleteOffer = (id) => api.delete(`/banners/offers/${id}`);

// Admin Store - Admin's own store management
export const getAdminStore = () => api.get('/admin/store');
export const createAdminStore = (data) => api.post('/admin/store', data);
export const updateAdminStore = (data) => api.put('/admin/store', data);

export const getAdminStoreProducts = () => api.get('/admin/store/products');
export const createAdminStoreProduct = (data) => api.post('/admin/store/products', data);
export const updateAdminStoreProduct = (id, data) => api.put(`/admin/store/products/${id}`, data);
export const deleteAdminStoreProduct = (id) => api.delete(`/admin/store/products/${id}`);
export const getAdminStoreOrders = (params = {}) => api.get('/admin/store/orders', { params });

export const getAdminAllOrders = (params = {}) => api.get('/admin/orders', { params });
export const getAdminStoreOrderStats = () => api.get('/admin/store/orders/stats');
export const updateAdminStoreOrderStatus = (id, status) => api.put(`/admin/store/orders/${id}/status`, { status });
export const markAdminStorePaymentReceived = (id) => api.put(`/admin/store/orders/${id}/payment-status`);

export const uploadAdminStoreImage = (data) => api.post('/storage/product-image', data);

// Coupons
export const getCoupons = (params = {}) => api.get('/coupons', { params });
export const createCoupon = (data) => api.post('/coupons', data);
export const getCouponById = (id) => api.get(`/coupons/${id}`);
export const updateCoupon = (id, data) => api.put(`/coupons/${id}`, data);
export const deleteCoupon = (id) => {
  cache.clear();
  return api.delete(`/coupons/${id}`);
};
export const toggleCouponStatus = (id) => api.put(`/coupons/${id}/toggle`);
export const getCouponAnalytics = () => api.get('/coupons/analytics');

// Disputes
export const getAdminDisputes = (params = {}) => api.get('/disputes', { params });
export const getAdminDisputeDetail = (id) => api.get(`/disputes/${id}`);
export const updateAdminDispute = (id, data) => api.put(`/disputes/${id}`, data);
export const addDisputeResponse = (id, data) => api.post(`/disputes/${id}/response`, data);

// Notifications
export const getAdminNotifications = (params = {}) => api.get('/notifications', { params });
export const markAllNotificationsRead = () => api.put('/notifications/read-all');
export const getNotificationTemplates = () => api.get('/notifications/templates');
export const createNotificationTemplate = (data) => api.post('/notifications/templates', data);
export const sendNotification = (data) => api.post('/notifications/send', data);
export const sendEmailNotification = (data) => api.post('/notifications/email', data);
export const sendSMSNotification = (data) => api.post('/notifications/sms', data);
export const getNotificationLogs = (params = {}) => api.get('/notifications/logs', { params });

// Delivery Slots
export const getDeliverySlots = () => api.get('/orders/delivery-slots');

// Shipping
export const getShippingProviders = () => api.get('/shipping/providers');
export const getAllShipments = (params) => api.get('/shipping', { params });
export const getShipmentByOrder = (orderId) => api.get(`/shipping/order/${orderId}`);
export const updateShipmentStatus = (id, data) => api.put(`/shipping/${id}/status`, data);
export const addTrackingUpdate = (id, data) => api.post(`/shipping/${id}/tracking`, data);

// Bulk Operations
export const bulkImportProducts = (formData) => api.post('/bulk/import/products', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const bulkUpdateInventory = (data) => api.put('/bulk/inventory', data);
export const bulkDeleteProducts = (data) => api.delete('/bulk/products', { data });
export const getImportJobs = () => api.get('/bulk/import-jobs');
export const exportProducts = (params) => api.get('/bulk/export/products', { params });
export const exportOrders = (params) => api.get('/bulk/export/orders', { params });
export const getExportJobs = () => api.get('/bulk/export-jobs');
export const getProductsTemplate = () => api.get('/bulk/template/products');

// Staff Management
export const getStaffRoles = () => api.get('/staff/roles');
export const createStaffRole = (data) => api.post('/staff/roles', data);
export const updateStaffRole = (data) => api.put('/staff/staff/update-role', data);
export const getStoreStaff = (storeId) => api.get(storeId ? `/staff/store/${storeId}/staff` : '/staff/store-staff');
export const inviteStaff = (data) => api.post('/staff/invite', data);
export const removeStaff = (staffId) => api.delete(`/staff/staff/${staffId}`);
export const getStaffActivity = (storeId) => api.get(storeId ? `/staff/store/${storeId}/activity` : '/staff/activity');
export const getStaffPermissions = () => api.get('/staff/permissions');

export default api;

// Wi-Fi network owner registrations (Phase 1)
export const getWifiNetworkRegistrations = () => api.get('/wifi-vouchers/admin/registrations');
export const reviewWifiNetworkRegistration = (registrationId, decision, note = '') =>
  api.post(`/wifi-vouchers/admin/registrations/${registrationId}/review`, { decision, note });

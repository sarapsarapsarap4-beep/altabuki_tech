class ApiConfig {
  static String get baseUrl => 'https://my-mart-backend-two.vercel.app';

  // Default headers for API requestsr
  static Map<String, String> get headers => {
    'Content-Type': 'application/json',
  };

  // API Endpoints
  static const String login = '/api/auth/login';
  static const String register = '/api/auth/register';
  static const String profile = '/api/auth/profile';
  static const String changePassword = '/api/auth/change-password';
  static const String resetPassword = '/api/auth/reset-password';

  // Supabase Auth Endpoints (OTP based)
  static const String sendOtp = '/api/supabase-auth/send-otp';
  static const String verifyOtp = '/api/supabase-auth/verify-otp';
  static const String resendOtp = '/api/supabase-auth/resend-otp';
  static const String sendForgotPasswordOtp =
      '/api/supabase-auth/send-forgot-password-otp';
  static const String verifyForgotPasswordOtp =
      '/api/supabase-auth/verify-forgot-password-otp';
  static const String supabaseResetPassword =
      '/api/supabase-auth/reset-password';

  static const String banners = '/api/banners';
  static const String activeBanners = '/api/banners/active';

  static const String products = '/api/products';
  static const String featuredProducts = '/api/products/featured';
  static const String newArrivals = '/api/products/new-arrivals';
  static const String deals = '/api/products/deals';
  static const String vendorProducts = '/api/products/vendor/my-products';

  static const String categories = '/api/categories';
  static const String categoryTree = '/api/categories/tree';
  static const String featuredCategories = '/api/categories/featured';

  static const String cart = '/api/cart';

  static const String orders = '/api/orders';
  static const String myOrders = '/api/orders/my';

  static const String stores = '/api/stores';
  static const String myStore = '/api/stores/vendor/my-store';

  static const String wishlist = '/api/wishlist';
  static const String wishlistLists = '/api/wishlist/lists';

  static const String reviews = '/api/reviews';

  static const String search = '/api/search';
  static const String searchSuggestions = '/api/search/suggestions';
  static const String searchTrending = '/api/search/trending';

  static const String notifications = '/api/notifications';

  static const String coupons = '/api/coupons';
  static const String availableCoupons = '/api/coupons/available';

  static const String shipping = '/api/shipping';
  static const String shippingProviders = '/api/shipping/providers';

  static const String payments = '/api/payments';
  static const String stripeConfig = '/api/stripe/config';
  static const String stripeCreateIntent = '/api/stripe/create-intent';
  static const String stripeConfirm = '/api/stripe/confirm';
  static const String stripeCards = '/api/stripe/cards';
  static const String stripeDeleteCard = '/api/stripe/cards'; // DELETE /api/stripe/cards/:card_id
  static const String stripeSetupIntent = '/api/stripe/setup-intent';
  static const String stripeSaveCard = '/api/payments/stripe/save-card';
  static const String stripeSavedCardPay = '/api/payments/stripe/saved-card-pay';
  static const String stripeCreateCheckoutSession = '/api/stripe/create-checkout-session';
  static const String stripeCheckoutSession = '/api/stripe/checkout-session';

  static const String returns = '/api/returns';
  static const String myReturns = '/api/returns/my';
  static const String disputes = '/api/disputes';

  static const String settlements = '/api/settlements';
  static const String vendorWallet = '/api/settlements/vendor/wallet';

  static const String vendorDashboard = '/api/vendor/dashboard/dashboard';
  static const String adminDashboard = '/api/admin/dashboard/stats';
  static const String adminStore = '/api/admin/store';
  static const String adminStoreProducts = '/api/admin/store/products';
  static const String adminStoreOrders = '/api/admin/store/orders';
  static const String vendorOrders = '/api/orders/vendor/orders';
  static const String vendorOrderStatus = '/api/orders/vendor/orders'; // + /:id/status
  static const String uploadProductImage = '/api/storage/product-image';

  // Wi-Fi network and voucher marketplace (Phase 1)
  static const String wifiNetworks = '/api/wifi-vouchers/networks';
  static const String myWifiNetworks = '/api/wifi-vouchers/networks/mine';
  static const String registerWifiNetwork = '/api/wifi-vouchers/networks/register';
  static const String wifiWallet = '/api/wifi-vouchers/wallet';
  static const String myVoucherPurchases = '/api/wifi-vouchers/purchases/mine';
}

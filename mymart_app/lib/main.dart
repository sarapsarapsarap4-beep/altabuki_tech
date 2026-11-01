import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';
import 'config/theme.dart';
import 'localization/app_localizations.dart';
import 'providers/auth_provider.dart';
import 'providers/cart_provider.dart';
import 'providers/product_provider.dart';
import 'providers/wishlist_provider.dart';
import 'providers/order_provider.dart';
import 'providers/address_provider.dart';
import 'providers/notification_provider.dart';
import 'screens/splash_screen.dart';
import 'screens/profile/profile_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/register_screen.dart';
import 'screens/auth/forgot_password_screen.dart';
import 'screens/auth/reset_password_screen.dart';
import 'screens/auth/otp_verification_screen.dart';
import 'screens/auth/otp_login_screen.dart';
import 'screens/home/main_screen.dart';
import 'screens/wishlist/wishlist_screen.dart';
import 'services/network_service.dart';
import 'services/notification_service.dart';
import 'providers/theme_provider.dart';
import 'providers/language_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  FlutterError.onError = (FlutterErrorDetails details) {
    FlutterError.presentError(details);
    debugPrint('=== Flutter Error ===\n${details.exception}\n${details.stack}');
  };

  await NetworkService().initialize();
  await NotificationService.initialize();
  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  late AuthProvider _authProvider;
  late CartProvider _cartProvider;
  late ProductProvider _productProvider;
  late WishlistProvider _wishlistProvider;
  late OrderProvider _orderProvider;
  late AddressProvider _addressProvider;
  late NotificationProvider _notificationProvider;
  late ThemeProvider _themeProvider;
  late LanguageProvider _languageProvider;

  static Route<T> _fadeSlideRoute<T>(RouteSettings settings, Widget page) {
    final route = AppTheme.fadeSlideRoute<T>(page, duration: const Duration(milliseconds: 300));
    return route;
  }

  @override
  void initState() {
    super.initState();
    _authProvider = AuthProvider();
    _cartProvider = CartProvider();
    _productProvider = ProductProvider();
    _wishlistProvider = WishlistProvider();
    _orderProvider = OrderProvider();
    _addressProvider = AddressProvider();
    _notificationProvider = NotificationProvider();
    _themeProvider = ThemeProvider();
    _languageProvider = LanguageProvider();

    _notificationProvider.loadPreferences();

    _authProvider.initialize();

    _authProvider.onLogout = () {
      _cartProvider.resetLocalCart();
      _wishlistProvider.clearLocalWishlist();
      _addressProvider.addresses.clear();
    };
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: NetworkService()),
        ChangeNotifierProvider.value(value: _authProvider),
        ChangeNotifierProvider.value(value: _cartProvider),
        ChangeNotifierProvider.value(value: _productProvider),
        ChangeNotifierProvider.value(value: _wishlistProvider),
        ChangeNotifierProvider.value(value: _orderProvider),
        ChangeNotifierProvider.value(value: _addressProvider),
        ChangeNotifierProvider.value(value: _notificationProvider),
        ChangeNotifierProvider.value(value: _themeProvider),
        ChangeNotifierProvider.value(value: _languageProvider),
      ],
      child: Consumer2<ThemeProvider, LanguageProvider>(
        builder: (context, themeProvider, langProvider, child) {
          return MaterialApp(
            title: 'Baqshat Tech',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.lightTheme,
            darkTheme: AppTheme.darkTheme,
            themeMode: themeProvider.themeMode,
            locale: langProvider.locale,
            localizationsDelegates: [
              AppLocalizations.delegate,
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            supportedLocales: LanguageProvider.supportedLocales,
            home: const NetworkAwareWidget(
              child: SplashScreen(),
            ),
            onGenerateRoute: (settings) {
              Widget page;
              switch (settings.name) {
                case '/home':
                  final tabIndex = settings.arguments as int? ?? 0;
                  page = MainScreen(initialTabIndex: tabIndex);
                  break;
                case '/login':
                  page = const LoginScreen();
                  break;
                case '/register':
                  page = const RegisterScreen();
                  break;
                case '/forgot-password':
                  page = const ForgotPasswordScreen();
                  break;
                case '/reset-password':
                  page = ResetPasswordScreen(email: '', otp: '');
                  break;
                case '/otp-verification':
                  page = const OtpVerificationScreen(email: '', isReset: false);
                  break;
                case '/otp-login':
                  page = const OtpLoginScreen();
                  break;
                case '/wishlist':
                  page = const WishlistScreen();
                  break;
                default:
                  return null;
              }
              return _fadeSlideRoute(settings, page);
            },
          );
        },
      ),
    );
  }
}

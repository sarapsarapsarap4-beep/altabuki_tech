import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../localization/app_localizations.dart';
import '../../config/theme.dart';
import '../../providers/cart_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/address_provider.dart';
import '../../providers/wishlist_provider.dart';
import 'home_screen.dart';
import 'categories_screen.dart';
import '../cart/cart_screen.dart';
import '../profile/profile_screen.dart';
import '../store/stores_screen.dart';
import '../store/my_networks_screen.dart';

class MainScreen extends StatefulWidget {
  final int initialTabIndex;
  const MainScreen({super.key, this.initialTabIndex = 0});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> with SingleTickerProviderStateMixin {
  late int _currentIndex;
  final Map<int, Widget> _cachedScreens = {};

  final List<_NavItem> _navItems = [
    _NavItem(Icons.home_rounded, Icons.home_rounded, 'home'),
    _NavItem(Icons.category_rounded, Icons.category_rounded, 'categories'),
    _NavItem(Icons.wifi_tethering_rounded, Icons.wifi_tethering_rounded, 'my_networks'),
    _NavItem(Icons.shopping_cart_outlined, Icons.shopping_cart_rounded, 'cart'),
    _NavItem(Icons.person_outline, Icons.person_rounded, 'profile'),
  ];

  Widget _getScreen(int index) {
    return _cachedScreens.putIfAbsent(
      index,
      () => switch (index) {
        0 => const HomeScreen(),
        1 => const CategoriesScreen(),
        2 => const MyNetworksScreen(),
        3 => const CartScreen(),
        4 => const ProfileScreen(),
        _ => const HomeScreen(),
      },
    );
  }

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialTabIndex;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final cartProvider = Provider.of<CartProvider>(context, listen: false);
      if (authProvider.isLoggedIn) {
        cartProvider.loadCart();
        Provider.of<AddressProvider>(context, listen: false).loadAddresses();
        Provider.of<WishlistProvider>(context, listen: false).loadWishlist();
      } else {
        cartProvider.resetLocalCart();
      }
    });
  }

  @override
  void didUpdateWidget(MainScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.initialTabIndex != oldWidget.initialTabIndex) {
      setState(() => _currentIndex = widget.initialTabIndex);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBody: true,
      backgroundColor: AppTheme.background,
      body: IndexedStack(
        index: _currentIndex,
        children: List.generate(5, _getScreen),
      ),
      bottomNavigationBar: Container(
        margin: const EdgeInsets.only(left: 20, right: 20, bottom: 24),
        decoration: BoxDecoration(
          gradient: AppTheme.primaryGradientVertical,
          borderRadius: BorderRadius.circular(28),
          boxShadow: AppTheme.shadowPrimary,
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: List.generate(5, (index) => _buildNavItem(index)),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(int index) {
    final isSelected = _currentIndex == index;
    final item = _navItems[index];

    return GestureDetector(
      onTap: () => setState(() => _currentIndex = index),
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOutCubic,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? Colors.white.withValues(alpha: 0.12) : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 200),
                  child: Icon(
                    isSelected ? item.activeIcon : item.icon,
                    key: ValueKey('$index-$isSelected'),
                    color: Colors.white,
                    size: 22,
                  ),
                ),
                const SizedBox(height: 3),
                AnimatedDefaultTextStyle(
                  duration: const Duration(milliseconds: 200),
                  style: GoogleFonts.inter(
                    color: Colors.white,
                    fontSize: 9,
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                  ),
                  child: Text(AppLocalizations.of(context).translate(item.label)),
                ),
              ],
            ),
            if (index == 3)
              Positioned(
                top: -4,
                right: -4,
                child: Consumer<CartProvider>(
                  builder: (context, cartProvider, _) {
                    if (cartProvider.itemCount == 0) return const SizedBox.shrink();
                    return _AnimatedCartBadge(count: cartProvider.itemCount);
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _NavItem {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  const _NavItem(this.icon, this.activeIcon, this.label);
}

class _AnimatedCartBadge extends StatefulWidget {
  final int count;
  const _AnimatedCartBadge({required this.count});

  @override
  State<_AnimatedCartBadge> createState() => _AnimatedCartBadgeState();
}

class _AnimatedCartBadgeState extends State<_AnimatedCartBadge>
    with TickerProviderStateMixin {
  late AnimationController _popController;
  late AnimationController _pulseController;
  late Animation<double> _popAnim;
  late Animation<double> _pulseAnim;

  @override
  void initState() {
    super.initState();
    _popController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    _popAnim = TweenSequence<double>([
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 1.4), weight: 30),
      TweenSequenceItem(tween: Tween(begin: 1.4, end: 0.8), weight: 20),
      TweenSequenceItem(tween: Tween(begin: 0.8, end: 1.15), weight: 25),
      TweenSequenceItem(tween: Tween(begin: 1.15, end: 1.0), weight: 25),
    ]).animate(CurvedAnimation(parent: _popController, curve: Curves.easeOut));
    _pulseController = AnimationController(vsync: this, duration: const Duration(milliseconds: 1500))
      ..repeat(reverse: true);
    _pulseAnim = Tween<double>(begin: 1.0, end: 1.08)
        .animate(CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut));
    _popController.forward();
  }

  @override
  void dispose() {
    _popController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  @override
  void didUpdateWidget(_AnimatedCartBadge oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.count != widget.count) {
      _popController.reset();
      _popController.forward();
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: Listenable.merge([_popAnim, _pulseAnim]),
      builder: (context, child) {
        final scale = _popController.isAnimating ? _popAnim.value : _pulseAnim.value;
        return Transform.scale(scale: scale, child: child);
      },
      child: Container(
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: AppTheme.sale,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: AppTheme.sale.withValues(alpha: 0.5),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        constraints: const BoxConstraints(minWidth: 17, minHeight: 17),
        child: Text(
          widget.count > 99 ? '99+' : widget.count.toString(),
          style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

String formatPrice(dynamic price, {bool showSymbol = true}) {
  if (price == null) return showSymbol ? '\$0.00' : '0.00';
  double value = 0;
  if (price is double) {
    value = price;
  } else if (price is int) {
    value = price.toDouble();
  } else if (price is String) {
    value = double.tryParse(price) ?? 0;
  }
  if (showSymbol) return '\$${value.toStringAsFixed(2)}';
  return value.toStringAsFixed(2);
}

class AppTheme {
  static const Color primary = Color(0xFF4B3B68);
  static const Color primaryDark = Color(0xFF392A54);
  static const Color primaryDarker = Color(0xFF2C203F);
  static const Color primaryLight = Color(0xFF665184);
  static const Color primaryLighter = Color(0xFF8E7BAE);
  static const Color primaryExtraLight = Color(0xFFEDE8F5);
  static const Color primaryGradientStart = Color(0xFF4B3B68);
  static const Color primaryGradientEnd = Color(0xFF665184);

  static const Color secondary = Color(0xFF392A54);
  static const Color secondaryLight = Color(0xFF665184);

  static const Color accent = Color(0xFFF97316);
  static const Color accentLight = Color(0xFFFFEDD5);

  static const Color sale = Color(0xFFDC2626);
  static const Color saleLight = Color(0xFFFEE2E2);
  static const Color saleGradientStart = Color(0xFFDC2626);
  static const Color saleGradientEnd = Color(0xFFEF4444);

  static const Color success = Color(0xFF059669);
  static const Color error = Color(0xFFDC2626);
  static const Color warning = Color(0xFFD97706);
  static const Color info = Color(0xFF2563EB);

  static const Color textPrimary = Color(0xFF0F172A);
  static const Color textSecondary = Color(0xFF475569);
  static const Color textTertiary = Color(0xFF94A3B8);
  static const Color textLight = Color(0xFFCBD5E1);

  static const Color background = Color(0xFFF4F4F8);
  static const Color backgroundDark = Color(0xFFEEEEF3);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color divider = Color(0xFFE2E8F0);

  static const Color star = Color(0xFFF59E0B);
  static const Color starLight = Color(0xFFFEF3C7);

  static const Color whatsapp = Color(0xFF25D366);

  static Gradient get primaryGradient => const LinearGradient(
    colors: [primaryGradientStart, primaryGradientEnd],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    stops: [0.0, 1.0],
  );

  static Gradient get primaryGradientVertical => const LinearGradient(
    colors: [primaryGradientStart, primaryDarker],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  static Gradient get saleGradient => const LinearGradient(
    colors: [saleGradientStart, saleGradientEnd],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static Gradient get accentGradient => const LinearGradient(
    colors: [accent, Color(0xFFFBBF24)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static Gradient get shimmerGradient => const LinearGradient(
    colors: [Color(0xFFE2E8F0), Color(0xFFF4F4F8), Color(0xFFE2E8F0)],
    stops: [0.0, 0.5, 1.0],
    begin: Alignment(-1.0, -1.0),
    end: Alignment(1.0, 1.0),
  );

  static const double radiusXs = 6;
  static const double radiusSm = 10;
  static const double radiusMd = 14;
  static const double radiusLg = 18;
  static const double radiusXl = 24;
  static const double radiusFull = 100;

  static const EdgeInsets paddingXs = EdgeInsets.all(6);
  static const EdgeInsets paddingSm = EdgeInsets.all(10);
  static const EdgeInsets paddingMd = EdgeInsets.all(14);
  static const EdgeInsets paddingLg = EdgeInsets.all(18);
  static const EdgeInsets paddingXl = EdgeInsets.all(24);

  static List<BoxShadow> get shadowSm => [
    BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 4, offset: const Offset(0, 1)),
    BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 2, offset: const Offset(0, 1)),
  ];

  static List<BoxShadow> get shadowMd => [
    BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 10, offset: const Offset(0, 4)),
    BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 4, offset: const Offset(0, 2)),
  ];

  static List<BoxShadow> get shadowLg => [
    BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 20, offset: const Offset(0, 8)),
    BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 6, offset: const Offset(0, 2)),
  ];

  static List<BoxShadow> get shadowXl => [
    BoxShadow(color: Colors.black.withValues(alpha: 0.12), blurRadius: 30, offset: const Offset(0, 12)),
    BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 4)),
  ];

  static List<BoxShadow> get shadowPrimary => [
    BoxShadow(color: primary.withValues(alpha: 0.25), blurRadius: 12, offset: const Offset(0, 6)),
    BoxShadow(color: primary.withValues(alpha: 0.1), blurRadius: 4, offset: const Offset(0, 2)),
  ];

  static Decoration get cardDecoration => BoxDecoration(
    color: surface,
    borderRadius: BorderRadius.circular(radiusMd),
    boxShadow: shadowSm,
  );

  static Decoration get cardDecorationMd => BoxDecoration(
    color: surface,
    borderRadius: BorderRadius.circular(radiusMd),
    boxShadow: shadowMd,
  );

  static Decoration get cardDecorationLg => BoxDecoration(
    color: surface,
    borderRadius: BorderRadius.circular(radiusLg),
    boxShadow: shadowLg,
  );

  static Decoration get glassDecoration => BoxDecoration(
    color: surface.withValues(alpha: 0.85),
    borderRadius: BorderRadius.circular(radiusMd),
    border: Border.all(color: surface.withValues(alpha: 0.5)),
    boxShadow: shadowMd,
  );

  static Decoration get primaryButtonDecoration => BoxDecoration(
    gradient: primaryGradient,
    borderRadius: BorderRadius.circular(radiusSm),
    boxShadow: shadowPrimary,
  );

  // Deprecated aliases for backward compatibility
  @Deprecated('Use shadowSm[0].color instead')
  static Color get cardShadow => Colors.black.withValues(alpha: 0.04);
  @Deprecated('Use shadowMd instead')
  static List<BoxShadow> get cardShadowMedium => shadowMd;
  @Deprecated('Use shadowSm instead')
  static List<BoxShadow> get cardShadowLight => shadowSm;
  @Deprecated('Use Color(0xFFE2E8F0) instead')
  static Color get shimmerBase => const Color(0xFFE2E8F0);
  @Deprecated('Use Color(0xFFF4F4F8) instead')
  static Color get shimmerHighlight => const Color(0xFFF4F4F8);

  static Route<T> fadeSlideRoute<T>(Widget page, {Duration duration = const Duration(milliseconds: 300)}) {
    return PageRouteBuilder<T>(
      pageBuilder: (_, animation, _) => FadeTransition(
        opacity: animation,
        child: SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(0.04, 0),
            end: Offset.zero,
          ).animate(CurvedAnimation(parent: animation, curve: Curves.easeOutQuart)),
          child: page,
        ),
      ),
      transitionDuration: duration,
    );
  }

  static Route<T> scaleRoute<T>(Widget page, {Duration duration = const Duration(milliseconds: 350)}) {
    return PageRouteBuilder<T>(
      pageBuilder: (_, animation, _) => page,
      transitionsBuilder: (_, animation, __, child) => ScaleTransition(
        scale: Tween<double>(begin: 0.92, end: 1.0).animate(
          CurvedAnimation(parent: animation, curve: Curves.easeOutCubic),
        ),
        child: FadeTransition(opacity: animation, child: child),
      ),
      transitionDuration: duration,
    );
  }

  static ThemeData get lightTheme => _lightTheme;
  static ThemeData get darkTheme => _darkTheme;

  static final ThemeData _lightTheme = ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: primary,
      primary: primary,
      secondary: secondary,
      surface: surface,
      brightness: Brightness.light,
    ),
    scaffoldBackgroundColor: background,
    textTheme: GoogleFonts.interTextTheme().apply(
      bodyColor: textPrimary,
      displayColor: textPrimary,
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: surface,
      foregroundColor: textPrimary,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: GoogleFonts.inter(
        color: textPrimary,
        fontSize: 20,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.3,
      ),
      iconTheme: const IconThemeData(color: textPrimary, size: 24),
      shadowColor: Colors.transparent,
      surfaceTintColor: Colors.transparent,
    ),
    cardTheme: CardThemeData(
      color: surface,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radiusMd)),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primary,
        foregroundColor: Colors.white,
        minimumSize: const Size(double.infinity, 54),
        elevation: 0,
        shadowColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radiusSm)),
        textStyle: GoogleFonts.inter(
          fontSize: 15,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.2,
        ),
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
      ).copyWith(
        overlayColor: WidgetStateProperty.resolveWith<Color?>(
          (states) => states.contains(WidgetState.pressed) ? Colors.white.withValues(alpha: 0.2) : null,
        ),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: primary,
        minimumSize: const Size(double.infinity, 54),
        side: const BorderSide(color: primary, width: 1.5),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radiusSm)),
        textStyle: GoogleFonts.inter(
          fontSize: 15,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.2,
        ),
      ).copyWith(
        overlayColor: WidgetStateProperty.resolveWith<Color?>(
          (states) => states.contains(WidgetState.pressed) ? primary.withValues(alpha: 0.08) : null,
        ),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: background,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusSm),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusSm),
        borderSide: BorderSide(color: divider, width: 1),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusSm),
        borderSide: const BorderSide(color: primary, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusSm),
        borderSide: const BorderSide(color: error),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusSm),
        borderSide: const BorderSide(color: error, width: 2),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      hintStyle: GoogleFonts.inter(color: textTertiary, fontSize: 14),
      labelStyle: GoogleFonts.inter(color: textSecondary, fontSize: 14),
      prefixIconColor: textTertiary,
      suffixIconColor: textTertiary,
    ),
    bottomNavigationBarTheme: BottomNavigationBarThemeData(
      backgroundColor: surface,
      selectedItemColor: primary,
      unselectedItemColor: textTertiary,
      selectedLabelStyle: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 11),
      unselectedLabelStyle: GoogleFonts.inter(fontWeight: FontWeight.w500, fontSize: 11),
      type: BottomNavigationBarType.fixed,
      elevation: 0,
    ),
    iconTheme: const IconThemeData(color: textPrimary, size: 24),
    splashColor: primary.withValues(alpha: 0.06),
    highlightColor: primary.withValues(alpha: 0.04),
    dialogTheme: DialogThemeData(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radiusMd)),
      elevation: 0,
    ),
    bottomSheetTheme: BottomSheetThemeData(
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(radiusLg)),
      ),
      elevation: 0,
    ),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radiusSm)),
      contentTextStyle: GoogleFonts.inter(fontSize: 14),
    ),
    checkboxTheme: CheckboxThemeData(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
      fillColor: WidgetStateProperty.resolveWith((states) =>
        states.contains(WidgetState.selected) ? primary : null),
    ),
    chipTheme: ChipThemeData(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radiusFull)),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
    ),
    dividerTheme: DividerThemeData(
      color: divider,
      thickness: 1,
      space: 1,
    ),
    progressIndicatorTheme: const ProgressIndicatorThemeData(
      color: primary,
      linearTrackColor: Color(0xFFE2E8F0),
    ),
    floatingActionButtonTheme: FloatingActionButtonThemeData(
      backgroundColor: primary,
      foregroundColor: Colors.white,
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radiusMd)),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: surface,
      indicatorColor: primaryExtraLight,
      labelTextStyle: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 12, color: primary);
        }
        return GoogleFonts.inter(fontWeight: FontWeight.w500, fontSize: 12, color: textTertiary);
      }),
      iconTheme: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return const IconThemeData(color: primary, size: 24);
        }
        return const IconThemeData(color: textTertiary, size: 24);
      }),
    ),
  );

  static final ThemeData _darkTheme = ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: primary,
      primary: primaryLighter,
      secondary: secondaryLight,
      surface: const Color(0xFF1E293B),
      brightness: Brightness.dark,
    ),
    scaffoldBackgroundColor: const Color(0xFF0F172A),
    textTheme: GoogleFonts.interTextTheme(ThemeData.dark().textTheme).apply(
      bodyColor: const Color(0xFFEEEEF3),
      displayColor: const Color(0xFFEEEEF3),
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: const Color(0xFF1E293B),
      foregroundColor: const Color(0xFFEEEEF3),
      elevation: 0,
      centerTitle: false,
      titleTextStyle: GoogleFonts.inter(
        color: const Color(0xFFEEEEF3),
        fontSize: 20,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.3,
      ),
      iconTheme: const IconThemeData(color: Color(0xFFEEEEF3), size: 24),
      shadowColor: Colors.transparent,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primaryLight,
        foregroundColor: Colors.white,
        minimumSize: const Size(double.infinity, 54),
        elevation: 0,
        shadowColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radiusSm)),
        textStyle: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600, letterSpacing: 0.2),
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: const Color(0xFF1E293B),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusSm),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusSm),
        borderSide: const BorderSide(color: Color(0xFF334155), width: 1),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusSm),
        borderSide: const BorderSide(color: primaryLight, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusSm),
        borderSide: const BorderSide(color: error),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      hintStyle: GoogleFonts.inter(color: textTertiary, fontSize: 14),
      labelStyle: GoogleFonts.inter(color: const Color(0xFF94A3B8), fontSize: 14),
    ),
    bottomNavigationBarTheme: BottomNavigationBarThemeData(
      backgroundColor: const Color(0xFF1E293B),
      selectedItemColor: primaryLighter,
      unselectedItemColor: const Color(0xFF64748B),
      selectedLabelStyle: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 11),
      unselectedLabelStyle: GoogleFonts.inter(fontWeight: FontWeight.w500, fontSize: 11),
      type: BottomNavigationBarType.fixed,
      elevation: 0,
    ),
    cardTheme: CardThemeData(
      color: const Color(0xFF1E293B),
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radiusMd)),
    ),
    dividerTheme: DividerThemeData(
      color: const Color(0xFF334155),
      thickness: 1,
      space: 1,
    ),
    progressIndicatorTheme: const ProgressIndicatorThemeData(
      color: primaryLighter,
      linearTrackColor: Color(0xFF334155),
    ),
    chipTheme: ChipThemeData(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radiusFull)),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
    ),
  );
}

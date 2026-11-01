import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LanguageProvider extends ChangeNotifier {
  Locale _locale = const Locale('ar');

  Locale get locale => _locale;

  LanguageProvider() {
    _loadLocale();
  }

  Future<void> _loadLocale() async {
    final prefs = await SharedPreferences.getInstance();
    final code = prefs.getString('language_code') ?? 'ar';
    _locale = Locale(code);
    notifyListeners();
  }

  Future<void> setLocale(Locale locale) async {
    if (!['en', 'ur', 'ar', 'hi', 'zh'].contains(locale.languageCode)) return;
    _locale = locale;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('language_code', locale.languageCode);
  }

  static const List<Locale> supportedLocales = [
    Locale('en', 'US'),
    Locale('ur', 'PK'),
    Locale('ar', 'SA'),
    Locale('hi', 'IN'),
    Locale('zh', 'CN'),
  ];

  static const Map<String, String> languageNames = {
    'en': 'English',
    'ur': 'اردو',
    'ar': 'العربية',
    'hi': 'हिन्दी',
    'zh': '中文',
  };
}

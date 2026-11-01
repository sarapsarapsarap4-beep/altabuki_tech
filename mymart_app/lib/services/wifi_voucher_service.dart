import '../config/api_config.dart';
import 'api_service.dart';

/// API client for Wi-Fi network registration, voucher inventory and wallet.
/// Real payment-provider integrations are intentionally not included in Phase 1.
class WifiVoucherService {
  static Future<Map<String, dynamic>> listNetworks() =>
      ApiService.get(ApiConfig.wifiNetworks);

  static Future<Map<String, dynamic>> listMyNetworks() =>
      ApiService.get(ApiConfig.myWifiNetworks);

  static Future<Map<String, dynamic>> registerNetwork({
    required String fullName,
    required String businessActivity,
    required String address,
    required String documentType,
    required String documentFrontUrl,
    String? documentBackUrl,
    String? distributorAccountNumber,
    String? networkName,
    String? networkDescription,
    required bool termsAccepted,
  }) => ApiService.post(ApiConfig.registerWifiNetwork, body: {
    'fullName': fullName,
    'businessActivity': businessActivity,
    'address': address,
    'documentType': documentType,
    'documentFrontUrl': documentFrontUrl,
    'documentBackUrl': documentBackUrl,
    'distributorAccountNumber': distributorAccountNumber,
    'networkName': networkName,
    'networkDescription': networkDescription,
    'termsAccepted': termsAccepted,
  });

  static Future<Map<String, dynamic>> listCategories(String networkId) =>
      ApiService.get('${ApiConfig.wifiNetworks}/$networkId/categories');

  static Future<Map<String, dynamic>> getNetworkReport(String networkId) =>
      ApiService.get('${ApiConfig.wifiNetworks}/$networkId/report');

  static Future<Map<String, dynamic>> addCategory({
    required String networkId,
    required String name,
    required num denomination,
    required num salePrice,
    String? dataAllowance,
    String? validity,
  }) => ApiService.post('${ApiConfig.wifiNetworks}/$networkId/categories', body: {
    'name': name,
    'denomination': denomination,
    'salePrice': salePrice,
    'dataAllowance': dataAllowance,
    'validity': validity,
  });

  static Future<Map<String, dynamic>> addVouchers({
    required String categoryId,
    required List<Map<String, String>> vouchers,
  }) => ApiService.post('/api/wifi-vouchers/categories/$categoryId/vouchers', body: {
    'vouchers': vouchers,
  });

  static Future<Map<String, dynamic>> purchaseVoucher(String voucherId) =>
      ApiService.post('/api/wifi-vouchers/vouchers/$voucherId/purchase', body: {});

  static Future<Map<String, dynamic>> purchaseCategory(String categoryId) =>
      ApiService.post('/api/wifi-vouchers/categories/$categoryId/purchase', body: {});

  static Future<Map<String, dynamic>> getWallet() =>
      ApiService.get(ApiConfig.wifiWallet);

  static Future<Map<String, dynamic>> getMyPurchases() =>
      ApiService.get(ApiConfig.myVoucherPurchases);
}

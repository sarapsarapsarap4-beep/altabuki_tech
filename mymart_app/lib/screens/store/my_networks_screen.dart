import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../services/wifi_voucher_service.dart';

/// Owner-only network gallery. It intentionally requests only /networks/mine;
/// public marketplace networks are never mixed into the owner's management view.
class MyNetworksScreen extends StatefulWidget {
  const MyNetworksScreen({super.key});

  @override
  State<MyNetworksScreen> createState() => _MyNetworksScreenState();
}

class _MyNetworksScreenState extends State<MyNetworksScreen> {
  bool _loading = true;
  String? _error;
  List<Map<String, dynamic>> _networks = [];
  final _purple = const Color(0xFF4B3B68);

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final result = await WifiVoucherService.listMyNetworks();

      if (result['success'] == false) {
        throw Exception(result['error'] ?? 'تعذر تحميل شبكاتك');
      }

      final rows = (result['networks'] as List? ?? [])
          .whereType<Map>()
          .map((e) => Map<String, dynamic>.from(e))
          .toList();

      if (mounted) {
        setState(() {
          _networks = rows;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error =
              'تعذر الاتصال بالخادم. تحقق من تسجيل الدخول والاتصال ثم أعد المحاولة.';
          _loading = false;
        });
      }
    }
  }

  Future<void> _register() async {
    final formKey = GlobalKey<FormState>();

    final name = TextEditingController();
    final activity = TextEditingController();
    final address = TextEditingController();
    final front = TextEditingController();
    final back = TextEditingController();
    final networkName = TextEditingController();

    String docType = 'national_id';
    bool accepted = false;
    bool sending = false;

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) => StatefulBuilder(
        builder: (context, refresh) => Container(
          padding: EdgeInsets.fromLTRB(
            20,
            18,
            20,
            MediaQuery.of(context).viewInsets.bottom + 24,
          ),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(
              top: Radius.circular(26),
            ),
          ),
          child: Form(
            key: formKey,
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Center(
                    child: Container(
                      width: 42,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.black12,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'إضافة شبكة جديدة',
                    textAlign: TextAlign.right,
                    style: TextStyle(
                      fontSize: 21,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF392A54),
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'أدخل بياناتك وروابط مستنداتك الآمنة HTTPS. '
                    'ستبقى الشبكة قيد المراجعة حتى موافقة الإدارة.',
                    textAlign: TextAlign.right,
                    style: TextStyle(
                      color: Colors.black54,
                      height: 1.5,
                    ),
                  ),
                  const SizedBox(height: 14),
                  _field(name, 'الاسم الكامل'),
                  _field(activity, 'النشاط التجاري'),
                  _field(address, 'العنوان'),
                  _field(
                    networkName,
                    'اسم الشبكة (اختياري)',
                    required: false,
                  ),
                  DropdownButtonFormField<String>(
                    value: docType,
                    decoration: _decoration('نوع إثبات الهوية'),
                    items: const [
                      DropdownMenuItem(
                        value: 'national_id',
                        child: Text('بطاقة شخصية'),
                      ),
                      DropdownMenuItem(
                        value: 'passport',
                        child: Text('جواز سفر'),
                      ),
                      DropdownMenuItem(
                        value: 'family_card',
                        child: Text('بطاقة عائلية'),
                      ),
                      DropdownMenuItem(
                        value: 'commercial_registration',
                        child: Text('سجل تجاري'),
                      ),
                    ],
                    onChanged: (v) {
                      refresh(() {
                        docType = v ?? docType;
                      });
                    },
                  ),
                  const SizedBox(height: 10),
                  _field(front, 'رابط صورة الوجه الأمامي (HTTPS)'),
                  _field(
                    back,
                    'رابط الخلف (HTTPS، إلزامي عدا الجواز)',
                    required: docType != 'passport',
                  ),
                  CheckboxListTile(
                    value: accepted,
                    onChanged: (v) {
                      refresh(() {
                        accepted = v ?? false;
                      });
                    },
                    contentPadding: EdgeInsets.zero,
                    controlAffinity: ListTileControlAffinity.leading,
                    title: const Text(
                      'أوافق على الشروط وسياسة الخصوصية',
                      textAlign: TextAlign.right,
                      style: TextStyle(fontSize: 13),
                    ),
                  ),
                  const SizedBox(height: 8),
                  FilledButton.icon(
                    style: FilledButton.styleFrom(
                      backgroundColor: _purple,
                      minimumSize: const Size.fromHeight(50),
                    ),
                    onPressed: sending
                        ? null
                        : () async {
                            if (!formKey.currentState!.validate()) {
                              return;
                            }

                            if (!accepted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text(
                                    'يرجى الموافقة على الشروط أولاً',
                                  ),
                                ),
                              );
                              return;
                            }

                            refresh(() {
                              sending = true;
                            });

                            try {
                              final r =
                                  await WifiVoucherService.registerNetwork(
                                fullName: name.text.trim(),
                                businessActivity: activity.text.trim(),
                                address: address.text.trim(),
                                documentType: docType,
                                documentFrontUrl: front.text.trim(),
                                documentBackUrl: back.text.trim().isEmpty
                                    ? null
                                    : back.text.trim(),
                                networkName: networkName.text.trim().isEmpty
                                    ? null
                                    : networkName.text.trim(),
                                termsAccepted: accepted,
                              );

                              if (r['success'] == false) {
                                throw Exception(
                                  r['error'] ?? 'تعذر إرسال الطلب',
                                );
                              }

                              if (sheetContext.mounted) {
                                Navigator.pop(sheetContext);
                              }

                              await _load();

                              if (mounted) {
                                ScaffoldMessenger.of(this.context)
                                    .showSnackBar(
                                  const SnackBar(
                                    content: Text(
                                      'تم إرسال الطلب، بانتظار موافقة الإدارة',
                                    ),
                                  ),
                                );
                              }
                            } catch (e) {
                              refresh(() {
                                sending = false;
                              });

                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(
                                    e.toString().replaceFirst(
                                          'Exception: ',
                                          '',
                                        ),
                                  ),
                                ),
                              );
                            }
                          },
                    icon: sending
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Icon(Icons.send_rounded),
                    label: Text(
                      sending ? 'جارٍ الإرسال...' : 'إرسال للمراجعة',
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  InputDecoration _decoration(String label) => InputDecoration(
        labelText: label,
        filled: true,
        fillColor: const Color(0xFFF7F6FA),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(13),
          borderSide: BorderSide.none,
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 14,
          vertical: 13,
        ),
      );

  Widget _field(
    TextEditingController c,
    String label, {
    bool required = true,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: TextFormField(
        controller: c,
        textAlign: TextAlign.right,
        decoration: _decoration(label),
        validator: (v) {
          if (required && (v == null || v.trim().isEmpty)) {
            return 'هذا الحقل مطلوب';
          }
          return null;
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F4F8),
      appBar: AppBar(
        backgroundColor: _purple,
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'معرض شبكاتي',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            onPressed: _load,
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      body: _loading
          ? Center(
              child: CircularProgressIndicator(color: _purple),
            )
          : _error != null
              ? _message(
                  Icons.wifi_off_rounded,
                  _error!,
                  'إعادة المحاولة',
                  _load,
                )
              : RefreshIndicator(
                  color: _purple,
                  onRefresh: _load,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      Container(
                        padding: const EdgeInsets.all(18),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [
                              Color(0xFF4B3B68),
                              Color(0xFF2C203F),
                            ],
                          ),
                          borderRadius: BorderRadius.circular(22),
                        ),
                        child: const Row(
                          children: [
                            CircleAvatar(
                              backgroundColor: Color(0x33FFFFFF),
                              radius: 27,
                              child: Icon(
                                Icons.wifi_tethering_rounded,
                                color: Colors.white,
                                size: 29,
                              ),
                            ),
                            SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(
                                    'شبكاتك في مكان واحد',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  SizedBox(height: 5),
                                  Text(
                                    'تابع حالة الطلب وأدر الفئات والمخزون بعد الاعتماد',
                                    textAlign: TextAlign.right,
                                    style: TextStyle(
                                      color: Color(0xFFDAD3E7),
                                      height: 1.4,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 18),

                      // الإصلاح الأول: استخدام for بدلاً من ...map.
                      if (_networks.isEmpty)
                        _emptyState()
                      else
                        for (final network in _networks)
                          _networkCard(network),

                      if (_networks.isEmpty ||
                          _networks.every(
                            (n) => n['status'] == 'rejected',
                          )) ...[
                        const SizedBox(height: 14),
                        FilledButton.icon(
                          style: FilledButton.styleFrom(
                            backgroundColor: _purple,
                            minimumSize: const Size.fromHeight(52),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(15),
                            ),
                          ),
                          onPressed: _register,
                          icon: const Icon(Icons.add_business_rounded),
                          label: const Text(
                            'أضف شبكتك مجانًا',
                            style: TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                      const SizedBox(height: 18),
                    ],
                  ),
                ),
    );
  }

  Widget _emptyState() {
    return Container(
      margin: const EdgeInsets.only(top: 24),
      padding: const EdgeInsets.fromLTRB(24, 28, 24, 26),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: const Color(0xFFE8E4EF),
        ),
      ),
      child: Column(
        children: [
          Container(
            width: 82,
            height: 82,
            decoration: const BoxDecoration(
              color: Color(0xFFEDE8F5),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.router_rounded,
              size: 42,
              color: Color(0xFF4B3B68),
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'ليس لديك شبكة حتى الآن',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 18,
              color: Color(0xFF392A54),
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'أضف شبكتك مجانًا، وبعد مراجعة الإدارة والموافقة '
            'ستظهر لك أدوات إدارة الفئات والكروت والتقارير.',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.black54,
              height: 1.6,
            ),
          ),
          const SizedBox(height: 18),
          OutlinedButton.icon(
            onPressed: _register,
            icon: const Icon(Icons.add),
            label: const Text('ابدأ بإضافة شبكتك'),
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFF4B3B68),
              side: const BorderSide(
                color: Color(0xFF4B3B68),
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(13),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _networkCard(Map<String, dynamic> n) {
    final status = '${n['status'] ?? 'pending'}';
    final approved = status == 'approved';
    final rejected = status == 'rejected';

    final label = approved
        ? 'معتمدة'
        : rejected
            ? 'مرفوضة'
            : status == 'suspended'
                ? 'موقوفة'
                : 'بانتظار موافقة الإدارة';

    final color = approved
        ? const Color(0xFF138A62)
        : rejected
            ? const Color(0xFFC43D55)
            : const Color(0xFFB7791F);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(19),
        border: Border.all(
          color: const Color(0xFFE9E5F0),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: const Color(0xFFEDE8F5),
                  borderRadius: BorderRadius.circular(15),
                ),
                child: const Icon(
                  Icons.router_rounded,
                  color: Color(0xFF4B3B68),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  '${n['name'] ?? 'شبكتي'}',
                  textAlign: TextAlign.right,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF30263D),
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: .10),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  label,
                  style: TextStyle(
                    color: color,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          if (n['address'] != null) ...[
            const SizedBox(height: 10),
            Text(
              '${n['address']}',
              textAlign: TextAlign.right,
              style: const TextStyle(color: Colors.black54),
            ),
          ],
          if (approved) ...[
            const SizedBox(height: 14),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF5F2FA),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Text(
                'تم اعتماد شبكتك. يمكنك الآن الانتقال إلى إدارة '
                'الفئات والكروت والتقارير.',
                textAlign: TextAlign.right,
                style: TextStyle(
                  color: Color(0xFF4B3B68),
                  height: 1.4,
                ),
              ),
            ),
            const SizedBox(height: 10),
            Align(
              alignment: Alignment.centerRight,
              child: FilledButton.icon(
                onPressed: () => _showManagementInfo(n),
                style: FilledButton.styleFrom(
                  backgroundColor: _purple,
                ),
                icon: const Icon(
                  Icons.settings_rounded,
                  size: 18,
                ),
                label: const Text('إدارة الشبكة'),
              ),
            ),
          ] else if (!rejected) ...[
            const SizedBox(height: 12),
            const Text(
              'لن تظهر أدوات إدارة الفئات والمخزون حتى اعتماد الإدارة للشبكة.',
              textAlign: TextAlign.right,
              style: TextStyle(
                color: Colors.black54,
                fontSize: 12,
                height: 1.4,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _showManagementInfo(
    Map<String, dynamic> n,
  ) async {
    await _showNetworkManagement(n);
  }

  Future<void> _showNetworkManagement(
    Map<String, dynamic> network,
  ) async {
    final networkId = '${network['id']}';

    try {
      final result = await Future.wait([
        WifiVoucherService.listCategories(networkId),
        WifiVoucherService.getNetworkReport(networkId),
      ]);

      // الإصلاح الثاني: تحديد نوع قائمة الفئات صراحةً.
      final List<Map<String, dynamic>> categories =
          (result[0]['categories'] as List? ?? [])
              .whereType<Map>()
              .map<Map<String, dynamic>>(
                (e) => Map<String, dynamic>.from(e),
              )
              .toList();

      final report = Map<String, dynamic>.from(
        result[1]['report'] as Map? ?? {},
      );

      if (!mounted) return;

      await showModalBottomSheet<void>(
        context: context,
        showDragHandle: true,
        isScrollControlled: true,
        builder: (ctx) => StatefulBuilder(
          builder: (ctx, refresh) => SafeArea(
            child: Padding(
              padding: EdgeInsets.fromLTRB(
                18,
                8,
                18,
                MediaQuery.of(ctx).viewInsets.bottom + 20,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      'إدارة ${network['name']}',
                      textAlign: TextAlign.right,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 20,
                        color: Color(0xFF30263D),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        _metric(
                          'الفئات',
                          '${report['categories'] ?? categories.length}',
                        ),
                        _metric(
                          'الكروت المتاحة',
                          '${report['available_vouchers'] ?? 0}',
                        ),
                        _metric(
                          'الكروت المباعة',
                          '${report['sold_vouchers'] ?? 0}',
                        ),
                        _metric(
                          'إجمالي المبيعات',
                          '${report['gross_sales'] ?? '0'} ر.ي',
                        ),
                        _metric('عمولة المنصة', '0%'),
                      ],
                    ),
                    const SizedBox(height: 14),
                    FilledButton.icon(
                      style: FilledButton.styleFrom(
                        backgroundColor: _purple,
                      ),
                      onPressed: () async {
                        Navigator.pop(ctx);
                        await _addCategory(networkId);
                        await _showNetworkManagement(network);
                      },
                      icon: const Icon(Icons.add_circle_outline),
                      label: const Text('إضافة فئة كروت'),
                    ),
                    const SizedBox(height: 12),

                    // الإصلاح الثالث: استخدام for بدلاً من ...categories.map.
                    if (categories.isEmpty)
                      const Padding(
                        padding: EdgeInsets.all(14),
                        child: Text(
                          'لا توجد فئات حتى الآن. أضف فئة ثم أضف الكروت الخاصة بها.',
                          textAlign: TextAlign.right,
                        ),
                      )
                    else
                      for (final category in categories)
                        Container(
                          margin: const EdgeInsets.only(bottom: 9),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF7F6FA),
                            borderRadius: BorderRadius.circular(13),
                          ),
                          child: Row(
                            children: [
                              OutlinedButton.icon(
                                onPressed: () async {
                                  Navigator.pop(ctx);
                                  await _addVouchers(category);
                                  await _showNetworkManagement(network);
                                },
                                icon: const Icon(Icons.playlist_add),
                                label: const Text('إضافة كروت'),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Text(
                                      '${category['name']}',
                                      style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      'السعر ${category['sale_price']} ر.ي • '
                                      'المتوفر ${category['available_count'] ?? 0}',
                                      textAlign: TextAlign.right,
                                      style: const TextStyle(
                                        color: Colors.black54,
                                        fontSize: 12,
                                      ),
                                    ),
                                    Text(
                                      '${category['data_allowance'] ?? ''} • '
                                      '${category['validity'] ?? ''}',
                                      textAlign: TextAlign.right,
                                      style: const TextStyle(
                                        color: Color(0xFF665184),
                                        fontSize: 11,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),

                    const SizedBox(height: 10),
                    OutlinedButton(
                      onPressed: () => Navigator.pop(ctx),
                      child: const Text('إغلاق'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      );
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('تعذر تحميل إدارة الشبكة والتقارير'),
          ),
        );
      }
    }
  }

  Widget _metric(String title, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 11,
        vertical: 10,
      ),
      decoration: BoxDecoration(
        color: const Color(0xFFEDE8F5),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Text(
            title,
            style: const TextStyle(
              color: Color(0xFF665184),
              fontSize: 11,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            value,
            style: const TextStyle(
              color: Color(0xFF392A54),
              fontWeight: FontWeight.bold,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _addCategory(String networkId) async {
    final form = GlobalKey<FormState>();

    final name = TextEditingController();
    final denomination = TextEditingController();
    final price = TextEditingController();
    final data = TextEditingController();
    final validity = TextEditingController();

    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text(
          'إضافة فئة كروت',
          textAlign: TextAlign.right,
        ),
        content: Form(
          key: form,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                _dialogField(name, 'اسم الفئة'),
                _dialogField(
                  denomination,
                  'القيمة الاسمية بالريال',
                  numeric: true,
                ),
                _dialogField(
                  price,
                  'سعر البيع بالريال',
                  numeric: true,
                ),
                _dialogField(
                  data,
                  'حجم التحميل (مثال 3GB)',
                  required: false,
                ),
                _dialogField(
                  validity,
                  'الصلاحية (مثال 10 أيام)',
                  required: false,
                ),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('إلغاء'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: _purple,
            ),
            onPressed: () async {
              if (!form.currentState!.validate()) return;

              try {
                final r = await WifiVoucherService.addCategory(
                  networkId: networkId,
                  name: name.text.trim(),
                  denomination: num.parse(denomination.text),
                  salePrice: num.parse(price.text),
                  dataAllowance: data.text.trim().isEmpty
                      ? null
                      : data.text.trim(),
                  validity: validity.text.trim().isEmpty
                      ? null
                      : validity.text.trim(),
                );

                if (r['success'] == false) {
                  throw Exception(
                    r['error'] ?? 'تعذر إنشاء الفئة',
                  );
                }

                if (ctx.mounted) {
                  Navigator.pop(ctx);
                }

                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('تمت إضافة الفئة'),
                    ),
                  );
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                        e.toString().replaceFirst(
                              'Exception: ',
                              '',
                            ),
                      ),
                    ),
                  );
                }
              }
            },
            child: const Text('حفظ الفئة'),
          ),
        ],
      ),
    );
  }

  Widget _dialogField(
    TextEditingController controller,
    String label, {
    bool required = true,
    bool numeric = false,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: TextFormField(
        controller: controller,
        textAlign: TextAlign.right,
        keyboardType: numeric
            ? const TextInputType.numberWithOptions(decimal: true)
            : TextInputType.text,
        decoration: _decoration(label),
        validator: (v) {
          if (required && (v == null || v.trim().isEmpty)) {
            return 'هذا الحقل مطلوب';
          }

          if (numeric && v != null && v.trim().isNotEmpty) {
            final number = num.tryParse(v.trim());

            if (number == null) {
              return 'أدخل رقمًا صحيحًا';
            }

            if (number < 0) {
              return 'لا يمكن أن تكون القيمة سالبة';
            }
          }

          return null;
        },
      ),
    );
  }

  Future<void> _addVouchers(
    Map<String, dynamic> category,
  ) async {
    final input = TextEditingController();

    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(
          'إضافة كروت — ${category['name']}',
          textAlign: TextAlign.right,
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'أدخل كرتًا في كل سطر. الصيغة: رقم الكرت|الرقم السري (اختياري).',
              textAlign: TextAlign.right,
            ),
            const SizedBox(height: 10),
            TextField(
              controller: input,
              minLines: 5,
              maxLines: 9,
              textAlign: TextAlign.left,
              decoration: const InputDecoration(
                hintText: 'CARD001|1234\nCARD002|5678',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('إلغاء'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: _purple,
            ),
            onPressed: () async {
              final vouchers = input.text
                  .split('\n')
                  .map((line) {
                    final parts = line.trim().split('|');

                    return <String, String>{
                      'code': parts.first.trim(),
                      'secret': parts.length > 1
                          ? parts.sublist(1).join('|').trim()
                          : '',
                    };
                  })
                  .where((v) => v['code']!.isNotEmpty)
                  .toList();

              if (vouchers.isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('أدخل رقم كرت واحد على الأقل'),
                  ),
                );
                return;
              }

              try {
                final r = await WifiVoucherService.addVouchers(
                  categoryId: '${category['id']}',
                  vouchers: vouchers,
                );

                if (r['success'] == false) {
                  throw Exception(
                    r['error'] ?? 'تعذر إضافة الكروت',
                  );
                }

                if (ctx.mounted) {
                  Navigator.pop(ctx);
                }

                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                        'تمت إضافة ${r['inserted'] ?? vouchers.length} كرت',
                      ),
                    ),
                  );
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                        e.toString().replaceFirst(
                              'Exception: ',
                              '',
                            ),
                      ),
                    ),
                  );
                }
              }
            },
            child: const Text('حفظ الكروت'),
          ),
        ],
      ),
    );
  }

  Widget _message(
    IconData icon,
    String text,
    String action,
    VoidCallback onTap,
  ) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 52,
              color: _purple,
            ),
            const SizedBox(height: 14),
            Text(
              text,
              textAlign: TextAlign.center,
              style: const TextStyle(height: 1.5),
            ),
            const SizedBox(height: 14),
            FilledButton(
              onPressed: onTap,
              style: FilledButton.styleFrom(
                backgroundColor: _purple,
              ),
              child: Text(action),
            ),
          ],
        ),
      ),
    );
  }
}

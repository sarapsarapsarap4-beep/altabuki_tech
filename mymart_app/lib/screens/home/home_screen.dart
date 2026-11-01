import 'package:flutter/material.dart';
import '../../config/theme.dart';
import '../../services/wifi_voucher_service.dart';
import '../store/my_networks_screen.dart';

/// Main customer dashboard for browsing approved Wi-Fi networks and buying vouchers.
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final Color purple = const Color(0xFF4B3B68);
  bool loading = true;
  List<Map<String, dynamic>> networks = [];
  String? error;
  Map<String, dynamic> wallet = {'balance': '—', 'currency': 'YER'};
  List<Map<String, dynamic>> purchases = [];

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() { loading = true; error = null; });
    try {
      final r = await WifiVoucherService.listNetworks();
      networks = (r['networks'] as List? ?? []).whereType<Map>().map((e) => Map<String,dynamic>.from(e)).toList();
      try {
        final w = await WifiVoucherService.getWallet();
        wallet = Map<String,dynamic>.from(w['wallet'] as Map? ?? {'balance':'0.00','currency':'YER'});
        final p = await WifiVoucherService.getMyPurchases();
        purchases = (p['purchases'] as List? ?? []).whereType<Map>().map((e)=>Map<String,dynamic>.from(e)).toList();
      } catch (_) { wallet = {'balance':'—','currency':'YER'}; }
    } catch (_) { error = 'تعذر تحميل الشبكات الآن. اسحب الشاشة للأسفل للمحاولة مجددًا.'; }
    if (mounted) setState(() => loading = false);
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: const Color(0xFFF4F4F8),
    body: RefreshIndicator(color:purple,onRefresh:_load,child: CustomScrollView(slivers:[
      SliverToBoxAdapter(child:Container(padding:EdgeInsets.fromLTRB(20,MediaQuery.of(context).padding.top+14,20,24),decoration:const BoxDecoration(gradient:LinearGradient(begin:Alignment.topLeft,end:Alignment.bottomRight,colors:[Color(0xFF4B3B68),Color(0xFF2C203F)]),borderRadius:BorderRadius.vertical(bottom:Radius.circular(28))),child:Column(children:[
        Row(children:[Container(width:42,height:42,decoration:BoxDecoration(color:Colors.white.withValues(alpha:.16),borderRadius:BorderRadius.circular(14)),child:const Icon(Icons.wifi_tethering_rounded,color:Colors.white,size:25)),const SizedBox(width:11),const Expanded(child:Column(crossAxisAlignment:CrossAxisAlignment.end,children:[Text('منصة شبكات الواي فاي',style:TextStyle(color:Colors.white,fontSize:18,fontWeight:FontWeight.bold)),Text('اشترِ كروتك وأدر شبكتك بسهولة',style:TextStyle(color:Color(0xFFDAD3E7),fontSize:12))])),IconButton(onPressed:_load,icon:const Icon(Icons.refresh_rounded,color:Colors.white))]),
        const SizedBox(height:20),Container(width:double.infinity,padding:const EdgeInsets.all(17),decoration:BoxDecoration(color:Colors.white.withValues(alpha:.12),borderRadius:BorderRadius.circular(20),border:Border.all(color:Colors.white.withValues(alpha:.15))),child:Row(children:[const Icon(Icons.account_balance_wallet_outlined,color:Colors.white,size:28),const SizedBox(width:12),Expanded(child:Column(crossAxisAlignment:CrossAxisAlignment.end,children:[const Text('رصيد محفظتي',style:TextStyle(color:Color(0xFFDAD3E7),fontSize:12)),const SizedBox(height:4),Text('${wallet['balance'] ?? '—'} ${wallet['currency'] ?? 'ر.ي'}',style:const TextStyle(color:Colors.white,fontWeight:FontWeight.bold,fontSize:24))])),const SizedBox(width:8),Container(padding:const EdgeInsets.all(10),decoration:BoxDecoration(color:Colors.white.withValues(alpha:.12),shape:BoxShape.circle),child:const Icon(Icons.account_balance,color:Colors.white))])),
        const SizedBox(height:14),Row(children:[Expanded(child:_quickAction(Icons.router_outlined,'معرض شبكاتي',()=>Navigator.push(context,MaterialPageRoute(builder:(_)=>const MyNetworksScreen())))),const SizedBox(width:10),Expanded(child:_quickAction(Icons.receipt_long_outlined,'مشترياتي',_showPurchases))]),
      ]))),
      SliverToBoxAdapter(child:Padding(padding:const EdgeInsets.fromLTRB(16,22,16,10),child:Row(children:[const Icon(Icons.wifi,color:Color(0xFF4B3B68)),const SizedBox(width:8),const Expanded(child:Text('شبكات متاحة للشراء',textAlign:TextAlign.right,style:TextStyle(fontWeight:FontWeight.bold,fontSize:18,color:Color(0xFF30263D)))),Text('${networks.length} شبكة',style:const TextStyle(color:Colors.black54,fontSize:12))]))),
      if (loading) const SliverToBoxAdapter(child:Padding(padding:EdgeInsets.all(35),child:Center(child:CircularProgressIndicator()))),
      if (!loading && error != null) SliverToBoxAdapter(child:Padding(padding:const EdgeInsets.all(18),child:Column(children:[const Icon(Icons.wifi_off_rounded,size:42,color:Color(0xFF8E7BAE)),const SizedBox(height:10),Text(error!,textAlign:TextAlign.center),const SizedBox(height:10),FilledButton(onPressed:_load,style:FilledButton.styleFrom(backgroundColor:purple),child:const Text('إعادة المحاولة'))]))),
      if (!loading && error == null && networks.isEmpty) SliverToBoxAdapter(child:Padding(padding:const EdgeInsets.all(24),child:Container(padding:const EdgeInsets.all(24),decoration:BoxDecoration(color:Colors.white,borderRadius:BorderRadius.circular(20)),child:const Column(children:[Icon(Icons.router_outlined,size:45,color:Color(0xFF8E7BAE)),SizedBox(height:12),Text('لا توجد شبكات معتمدة حاليًا',style:TextStyle(fontWeight:FontWeight.bold,fontSize:16)),SizedBox(height:6),Text('ستظهر الشبكات هنا بعد اعتمادها من الإدارة.',textAlign:TextAlign.center,style:TextStyle(color:Colors.black54))])))),
      if (!loading && error == null) SliverPadding(padding:const EdgeInsets.symmetric(horizontal:16),sliver:SliverList(delegate:SliverChildBuilderDelegate((context,index)=>_networkTile(networks[index]),childCount:networks.length))),
      const SliverToBoxAdapter(child:SizedBox(height:110)),
    ])),
  );

  Widget _quickAction(IconData icon,String title,VoidCallback onTap)=>Material(color:purple,borderRadius:BorderRadius.circular(15),child:InkWell(onTap:onTap,borderRadius:BorderRadius.circular(15),child:Padding(padding:const EdgeInsets.symmetric(horizontal:12,vertical:13),child:Row(mainAxisAlignment:MainAxisAlignment.center,children:[Icon(icon,color:Colors.white,size:18),const SizedBox(width:8),Flexible(child:Text(title,style:const TextStyle(color:Colors.white,fontWeight:FontWeight.w600,fontSize:12)))]))));

  Widget _networkTile(Map<String,dynamic> n)=>Container(margin:const EdgeInsets.only(bottom:12),decoration:BoxDecoration(color:Colors.white,borderRadius:BorderRadius.circular(19),border:Border.all(color:const Color(0xFFE9E5F0))),child:ListTile(contentPadding:const EdgeInsets.all(14),leading:Container(width:48,height:48,decoration:BoxDecoration(color:const Color(0xFFEDE8F5),borderRadius:BorderRadius.circular(15)),child:const Icon(Icons.router_rounded,color:Color(0xFF4B3B68),size:27)),title:Text('${n['name'] ?? 'شبكة Wi-Fi'}',textAlign:TextAlign.right,style:const TextStyle(fontWeight:FontWeight.bold,color:Color(0xFF30263D))),subtitle:Padding(padding:const EdgeInsets.only(top:6),child:Text('${n['category_count'] ?? 0} فئة • ${n['available_vouchers'] ?? 0} كرت متوفر',textAlign:TextAlign.right,style:const TextStyle(color:Colors.black54,fontSize:12))),trailing:Icon(Icons.chevron_left,color:purple),onTap:()=>_showCategories(n));

  Future<void> _showCategories(Map<String,dynamic> network) async {
    showModalBottomSheet(context:context,isScrollControlled:true,showDragHandle:true,backgroundColor:Colors.white,builder:(ctx)=>_CategorySheet(network:network,onBuy:_confirmBuy));
  }

  Future<void> _confirmBuy(Map<String,dynamic> category) async {
    final yes=await showDialog<bool>(context:context,builder:(ctx)=>AlertDialog(title:const Text('تأكيد شراء الكرت',textAlign:TextAlign.right),content:Text('سيتم خصم ${category['sale_price']} ر.ي من محفظتك. عمولة المنصة 0%.',textAlign:TextAlign.right),actions:[TextButton(onPressed:()=>Navigator.pop(ctx,false),child:const Text('إلغاء')),FilledButton(style:FilledButton.styleFrom(backgroundColor:purple),onPressed:()=>Navigator.pop(ctx,true),child:const Text('تأكيد الشراء'))]));
    if(yes!=true)return;
    try {
      final r=await WifiVoucherService.purchaseCategory('${category['id']}');
      if(r['success']==false)throw Exception(r['error']??'فشل الشراء');
      final voucher=Map<String,dynamic>.from(r['voucher'] as Map? ?? {});
      await _load();
      if(!mounted)return;
      showDialog<void>(context:context,builder:(ctx)=>AlertDialog(title:const Row(children:[Icon(Icons.check_circle,color:Color(0xFF138A62)),SizedBox(width:8),Text('تم الشراء بنجاح')]),content:Column(mainAxisSize:MainAxisSize.min,crossAxisAlignment:CrossAxisAlignment.stretch,children:[const Text('رقم الكرت',textAlign:TextAlign.right),SelectableText('${voucher['code']??'—'}',textAlign:TextAlign.center,style:const TextStyle(fontWeight:FontWeight.bold,fontSize:19)),if(voucher['secret']!=null)...[const SizedBox(height:12),const Text('الرقم السري',textAlign:TextAlign.right),SelectableText('${voucher['secret']}',textAlign:TextAlign.center,style:const TextStyle(fontWeight:FontWeight.bold,fontSize:18))],const SizedBox(height:12),const Text('عمولة المنصة: 0%',textAlign:TextAlign.right,style:TextStyle(color:Color(0xFF138A62)))]),actions:[TextButton(onPressed:()=>Navigator.pop(ctx),child:const Text('إغلاق'))]));
    } catch(e) { if(mounted)ScaffoldMessenger.of(context).showSnackBar(SnackBar(content:Text(e.toString().replaceFirst('Exception: ','')))); }
  }

  void _showPurchases() {
    showModalBottomSheet(context:context,isScrollControlled:true,showDragHandle:true,builder:(ctx)=>SafeArea(child:Padding(padding:const EdgeInsets.all(18),child:Column(mainAxisSize:MainAxisSize.min,crossAxisAlignment:CrossAxisAlignment.stretch,children:[const Text('مشترياتي',textAlign:TextAlign.right,style:TextStyle(fontWeight:FontWeight.bold,fontSize:20)),const SizedBox(height:12),if(purchases.isEmpty)const Text('لا توجد مشتريات مسجلة بعد',textAlign:TextAlign.right)else ...purchases.take(15).map((p)=>ListTile(leading:const Icon(Icons.confirmation_number_outlined,color:Color(0xFF4B3B68)),title:Text('${p['networkName']??'شبكة'} — ${p['categoryName']??'كرت'}',textAlign:TextAlign.right),subtitle:Text('${p['amount']??0} ر.ي • ${p['status']??''}',textAlign:TextAlign.right))),const SizedBox(height:10),FilledButton(style:FilledButton.styleFrom(backgroundColor:purple),onPressed:()=>Navigator.pop(ctx),child:const Text('إغلاق'))]))));
  }
}

class _CategorySheet extends StatefulWidget {
  final Map<String,dynamic> network;
  final Future<void> Function(Map<String,dynamic>) onBuy;
  const _CategorySheet({required this.network,required this.onBuy});
  @override State<_CategorySheet> createState()=>_CategorySheetState();
}
class _CategorySheetState extends State<_CategorySheet> {
  bool loading=true; List<Map<String,dynamic>> categories=[];
  @override void initState(){super.initState();_load();}
  Future<void> _load() async {try{final r=await WifiVoucherService.listCategories('${widget.network['id']}');categories=(r['categories'] as List? ?? []).whereType<Map>().map((e)=>Map<String,dynamic>.from(e)).toList();}catch(_){}if(mounted)setState(()=>loading=false);}
  @override Widget build(BuildContext context)=>SafeArea(child:Padding(padding:const EdgeInsets.all(18),child:Column(mainAxisSize:MainAxisSize.min,crossAxisAlignment:CrossAxisAlignment.stretch,children:[Text('${widget.network['name']??'الشبكة'}',textAlign:TextAlign.right,style:const TextStyle(fontSize:20,fontWeight:FontWeight.bold,color:Color(0xFF30263D))),const SizedBox(height:12),if(loading)const Center(child:CircularProgressIndicator())else if(categories.isEmpty)const Text('لا توجد كروت متاحة في هذه الشبكة حاليًا.',textAlign:TextAlign.right)else ...categories.map((c)=>Container(margin:const EdgeInsets.only(bottom:10),padding:const EdgeInsets.all(13),decoration:BoxDecoration(color:const Color(0xFFF7F6FA),borderRadius:BorderRadius.circular(14)),child:Row(children:[FilledButton(style:FilledButton.styleFrom(backgroundColor:const Color(0xFF4B3B68)),onPressed:(int.tryParse('${c['available_count']??0}')??0)>0?(){Navigator.pop(context);widget.onBuy(c);}:null,child:const Text('شراء')),const SizedBox(width:12),Expanded(child:Column(crossAxisAlignment:CrossAxisAlignment.end,children:[Text('${c['name']??'فئة كروت'}',style:const TextStyle(fontWeight:FontWeight.bold)),const SizedBox(height:4),Text('${c['sale_price']??0} ر.ي • متوفر ${c['available_count']??0} كرت',style:const TextStyle(color:Colors.black54,fontSize:12)),if(c['data_allowance']!=null||c['validity']!=null)Text('${c['data_allowance']??''} • ${c['validity']??''}',style:const TextStyle(color:Color(0xFF665184),fontSize:12))]))])),const SizedBox(height:8)])));
}

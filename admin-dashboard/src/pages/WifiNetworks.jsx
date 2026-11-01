import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Clock3, FileImage, RefreshCw, Router, XCircle } from 'lucide-react';
import { getWifiNetworkRegistrations, reviewWifiNetworkRegistration } from '../services/api';

const statusText = { pending: 'بانتظار المراجعة', approved: 'معتمد', rejected: 'مرفوض' };
const statusClass = { pending: 'bg-amber-50 text-amber-700', approved: 'bg-emerald-50 text-emerald-700', rejected: 'bg-rose-50 text-rose-700' };

export default function WifiNetworks() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [filter, setFilter] = useState('pending');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await getWifiNetworkRegistrations();
      setRows(response.data?.registrations || []);
    } catch (e) {
      setError(e.response?.data?.error || 'تعذر تحميل طلبات تسجيل الشبكات. تحقق من اتصال الخادم وصلاحية المدير.');
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const decide = async (row, decision) => {
    const notePrompt = decision === 'rejected' ? window.prompt('سبب الرفض (اختياري):') : '';
    if (notePrompt === null) return;
    const note = notePrompt || '';
    setBusy(row.id);
    try { await reviewWifiNetworkRegistration(row.id, decision, note); await load(); }
    catch (e) { window.alert(e.response?.data?.error || 'تعذر تحديث الطلب'); }
    finally { setBusy(''); }
  };

  const visible = rows.filter(r => filter === 'all' || r.status === filter);
  return <div className="p-4 sm:p-6 space-y-6" dir="rtl">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div><p className="text-sm text-violet-600 font-semibold">إدارة أصحاب الشبكات</p><h1 className="text-2xl font-bold text-slate-900 mt-1">طلبات تسجيل شبكات Wi-Fi</h1><p className="text-slate-500 mt-2">راجع بيانات صاحب الشبكة والمستندات قبل الاعتماد.</p></div>
      <button onClick={load} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 text-white px-4 py-3 hover:bg-violet-800"><RefreshCw size={17}/> تحديث القائمة</button>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {[['pending','قيد المراجعة',Clock3,'text-amber-700 bg-amber-50'],['approved','معتمدة',CheckCircle2,'text-emerald-700 bg-emerald-50'],['rejected','مرفوضة',XCircle,'text-rose-700 bg-rose-50']].map(([key,label,Icon,cls])=><button key={key} onClick={()=>setFilter(key)} className={`text-right bg-white border rounded-2xl p-4 shadow-sm ${filter===key?'border-violet-500 ring-2 ring-violet-100':'border-slate-200'}`}><div className="flex items-center justify-between"><span className={`p-2 rounded-xl ${cls}`}><Icon size={20}/></span><span className="text-2xl font-bold">{rows.filter(r=>r.status===key).length}</span></div><p className="mt-3 text-sm text-slate-600">{label}</p></button>)}
    </div>
    <div className="flex gap-2 flex-wrap">{[['pending','قيد المراجعة'],['approved','المعتمدة'],['rejected','المرفوضة'],['all','الكل']].map(([k,v])=><button key={k} onClick={()=>setFilter(k)} className={`rounded-full px-4 py-2 text-sm font-semibold ${filter===k?'bg-violet-700 text-white':'bg-white text-slate-600 border border-slate-200'}`}>{v}</button>)}</div>
    {error && <div className="p-4 rounded-xl bg-rose-50 text-rose-700 border border-rose-100">{error}</div>}
    {loading ? <div className="p-10 text-center text-slate-500">جارٍ تحميل الطلبات...</div> : visible.length === 0 ? <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center"><Router size={42} className="mx-auto text-violet-400"/><p className="mt-3 font-semibold text-slate-800">لا توجد طلبات في هذا القسم</p><p className="text-slate-500 text-sm mt-1">ستظهر هنا طلبات أصحاب الشبكات الجديدة.</p></div> : <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">{visible.map(r=><article key={r.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
      <div className="flex items-start gap-3"><div className="p-3 bg-violet-50 text-violet-700 rounded-xl"><Router size={23}/></div><div className="flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold text-lg text-slate-900">{r.network_name || 'شبكة جديدة'}</h2><span className={`text-xs px-3 py-1 rounded-full font-semibold ${statusClass[r.status] || statusClass.pending}`}>{statusText[r.status] || r.status}</span></div><p className="text-sm text-slate-500 mt-1">{r.full_name} · {r.business_activity}</p></div></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm"><div className="bg-slate-50 rounded-xl p-3"><p className="text-slate-500">العنوان</p><p className="font-medium mt-1">{r.address || '—'}</p></div><div className="bg-slate-50 rounded-xl p-3"><p className="text-slate-500">وسيلة التواصل</p><p className="font-medium mt-1">{r.phone || r.email || '—'}</p></div><div className="bg-slate-50 rounded-xl p-3"><p className="text-slate-500">نوع الوثيقة</p><p className="font-medium mt-1">{({national_id:'بطاقة شخصية',passport:'جواز سفر',family_card:'بطاقة عائلية',commercial_registration:'سجل تجاري'})[r.document_type] || r.document_type}</p></div><div className="bg-slate-50 rounded-xl p-3"><p className="text-slate-500">تاريخ الطلب</p><p className="font-medium mt-1">{r.created_at ? new Date(r.created_at).toLocaleString('ar-YE') : '—'}</p></div></div>
      <div className="flex flex-wrap gap-2">{r.document_front_url && <a target="_blank" rel="noreferrer" href={r.document_front_url} className="inline-flex items-center gap-2 rounded-lg border border-violet-200 text-violet-700 px-3 py-2 text-sm"><FileImage size={16}/> صورة الوثيقة</a>}{r.document_back_url && <a target="_blank" rel="noreferrer" href={r.document_back_url} className="inline-flex items-center gap-2 rounded-lg border border-violet-200 text-violet-700 px-3 py-2 text-sm"><FileImage size={16}/> الوجه الخلفي</a>}</div>
      {r.review_note && <p className="text-sm bg-rose-50 text-rose-700 rounded-lg p-3">ملاحظة الإدارة: {r.review_note}</p>}
      {r.status==='pending' && <div className="flex gap-3 pt-1"><button disabled={busy===r.id} onClick={()=>decide(r,'approved')} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 hover:bg-violet-800 text-white py-3 font-semibold disabled:opacity-50"><CheckCircle2 size={17}/> اعتماد الشبكة</button><button disabled={busy===r.id} onClick={()=>decide(r,'rejected')} className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 px-4 py-3 font-semibold disabled:opacity-50"><XCircle size={17}/> رفض</button></div>}
    </article>)}</div>}
  </div>;
}

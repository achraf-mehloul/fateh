import { Order, ORDER_STATUS_LABELS, OrderStatus } from '@/lib/orders';
import { normalizePhone } from '@/lib/validation';

const STORE_NAME = 'Voltech Chlef';
const STORE_PHONE = '';
const STORE_ADDRESS = 'الشلف، الجزائر';
const STORE_SOCIAL = '';
const STORE_LOGO_URL = `${window.location.origin}/logo.png`;

const escapeHtml = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatMoney = (value: number): string =>
  `${Number(value || 0).toLocaleString('fr-DZ')} دج`;

const formatDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('ar-DZ', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
};

const toInternational = (phone: string): string => {
  const local = normalizePhone(phone);
  return local.startsWith('0') ? '213' + local.slice(1) : local;
};

export const statusMessage = (order: Order, status: OrderStatus): string => {
  const label = ORDER_STATUS_LABELS[status];
  const intro = `مرحباً ${order.customer_name} 👋\nطلبك رقم ${order.order_number} في متجر ${STORE_NAME}`;
  const details: Record<OrderStatus, string> = {
    pending: 'تم استلام طلبك وهو قيد المراجعة.',
    confirmed: 'تم تأكيد طلبك ✅ وسنبدأ في تحضيره.',
    preparing: 'جاري تحضير طلبك 📦',
    shipped: 'تم شحن طلبك 🚚 وسيصلك قريباً.',
    delivered: 'تم توصيل طلبك ✅ شكراً لثقتك بنا!',
    cancelled: 'تم إلغاء طلبك. للاستفسار تواصل معنا.',
  };
  return `${intro}\nالحالة: ${label}\n${details[status]}\nالمبلغ: ${order.total_price.toLocaleString()} دج\nتتبع طلبك: ${window.location.origin}/track-order?order=${order.order_number}`;
};

export const whatsappLink = (phone: string, message: string): string =>
  `https://wa.me/${toInternational(phone)}?text=${encodeURIComponent(message)}`;

export const mailtoLink = (email: string, subject: string, body: string): string =>
  `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

export const printDeliverySlip = (order: Order) => {
  const rows = order.items.map((item, index) => {
    const quantity = Number(item.quantity || 0);
    const unitPrice = Number(item.product.price || 0);
    return `<tr>
      <td class="center">${index + 1}</td>
      <td class="product">${escapeHtml(item.product.name)}</td>
      <td class="center">${quantity}</td>
      <td class="money">${formatMoney(unitPrice)}</td>
      <td class="money">${formatMoney(unitPrice * quantity)}</td>
    </tr>`;
  }).join('');

  const paymentMethod = order.payment_method === 'cash' ? 'الدفع عند الاستلام' : 'البريدي موب';
  const deliveryType = order.delivery_type === 'office' ? 'مكتب (Stop Desk)' : 'التوصيل إلى المنزل';
  const address = [order.wilaya, order.municipality].filter(Boolean).map(escapeHtml).join('، ');
  const notes = order.notes ? `<p><b>ملاحظات:</b> ${escapeHtml(order.notes)}</p>` : '';
  const storeInfo = [
    STORE_PHONE ? `الهاتف: ${escapeHtml(STORE_PHONE)}` : '',
    STORE_ADDRESS ? `العنوان: ${escapeHtml(STORE_ADDRESS)}` : '',
    STORE_SOCIAL ? escapeHtml(STORE_SOCIAL) : '',
  ].filter(Boolean).join('<br>');

  const totalItems = order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>فاتورة ${escapeHtml(order.order_number)}</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  :root { color-scheme: light; }
  body { margin: 0; color: #18313b; background: #fff; font: 12px/1.65 Tahoma, Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .sheet { position: relative; width: 210mm; min-height: 297mm; margin: 0 auto; padding: 17mm 14mm 24mm; overflow: hidden; background: linear-gradient(145deg,#fbfaf5 0%,#f4f2e9 55%,#e8e6d9 100%); }
  .top-art { position:absolute; top:-53mm; left:-24mm; width:118mm; height:118mm; border-radius:50%; background:linear-gradient(135deg,#dcefeb,#3ca69d); opacity:.9; }
  .top-art:after { content:""; position:absolute; top:10mm; left:10mm; width:98mm; height:98mm; border-radius:50%; background:#fbfaf5; }
  .content { position:relative; z-index:1; }
  .hero { display:flex; align-items:flex-start; justify-content:space-between; gap:20px; min-height:68mm; }
  .brand { display:flex; align-items:center; gap:12px; max-width:58%; }
  .logo-wrap { display:flex; align-items:center; justify-content:center; width:23mm; height:23mm; flex:0 0 23mm; border-radius:14px; background:#fff; box-shadow:0 5px 18px #12343b12; overflow:hidden; }
  .logo { display:block; max-width:90%; max-height:90%; object-fit:contain; }
  .brand-name { margin:0; color:#12323d; font-size:20px; font-weight:900; letter-spacing:.2px; }
  .brand-sub { color:#5b6c70; font-size:10px; }
  .invoice-title { min-width:65mm; padding-top:1mm; text-align:left; }
  .invoice-title h1 { margin:0; color:#12323d; font-size:34px; line-height:1.15; letter-spacing:1.5px; }
  .invoice-meta { margin-top:13mm; color:#344b50; font-size:12px; }
  .invoice-meta div { margin:2px 0; }
  .invoice-meta b { color:#12323d; }
  .intro-grid { display:grid; grid-template-columns:1fr 1fr; gap:18mm; margin-top:-1mm; margin-bottom:16mm; }
  .label { margin:0 0 7px; color:#12323d; font-size:12px; font-weight:900; letter-spacing:1px; }
  .info { color:#43565a; font-size:11px; }
  .info p { margin:2px 0; }
  .table-head { display:grid; grid-template-columns:minmax(0,1fr) 17mm 29mm 29mm; align-items:center; gap:8px; padding:11px 17px; border-radius:30px; color:#fff; background:linear-gradient(100deg,#17657c,#36a99b); font-weight:900; letter-spacing:.7px; font-size:11px; }
  table { width:100%; margin-top:5mm; border-collapse:separate; border-spacing:0; overflow:hidden; border-radius:17px; background:#fff; }
  thead { display:none; }
  td { padding:8px 13px; color:#253c41; border:0; vertical-align:middle; }
  tbody tr:not(:last-child) td { border-bottom:1px solid #edf0eb; }
  tbody tr:first-child td:first-child { border-top-right-radius:15px; }
  tbody tr:last-child td:first-child { border-bottom-right-radius:15px; }
  tbody tr:nth-child(even) { background:#fbfcf9; }
  td:nth-child(1) { width:9mm; text-align:center; color:#6d8588; }
  td:nth-child(2) { font-weight:600; }
  td:nth-child(3) { width:17mm; text-align:center; }
  td:nth-child(4), td:nth-child(5) { width:29mm; text-align:left; direction:ltr; white-space:nowrap; }
  .bottom-grid { display:grid; grid-template-columns:1fr 96mm; gap:12mm; align-items:start; margin-top:5mm; }
  .notes { padding-top:5mm; }
  .notes p { margin:5px 0; color:#5b6c70; font-size:10px; }
  .summary { padding:5mm 7mm; border-radius:18px; background:#fff; }
  .summary-row { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:3px 0; color:#344b50; font-size:12px; }
  .summary-row strong { color:#18313b; font-weight:900; }
  .summary-row.grand { margin-top:3px; padding-top:7px; border-top:1px solid #e5ebe6; font-size:14px; }
  .summary-row.grand strong { color:#087e8b; }
  .pay-note { margin-top:5mm; padding:3mm 4mm; border-right:3px solid #36a99b; border-radius:8px; background:#ffffffb8; color:#43565a; font-size:10px; }
  .signatures { display:grid; grid-template-columns:1fr 1fr; gap:15mm; margin-top:10mm; }
  .signature { padding-top:4mm; border-top:1px dashed #9aacab; color:#5b6c70; font-size:10px; }
  .footer { position:absolute; right:0; bottom:0; left:0; display:flex; align-items:center; justify-content:space-around; gap:10px; min-height:18mm; padding:4mm 10mm; color:#fff; background:linear-gradient(100deg,#17657c,#36a99b); font-size:10px; }
  .footer strong { color:#fff; }
  @media screen { body { background:#dce3df; padding:18px; } .sheet { box-shadow:0 12px 40px #18313b22; } }
  @media print { body { margin:0; padding:0; } .sheet { margin:0; box-shadow:none; } }
</style>
</head>
<body>
<div class="sheet">
  <div class="top-art"></div>
  <div class="content">
    <div class="hero">
      <div class="brand">
        <div class="logo-wrap"><img class="logo" src="${escapeHtml(STORE_LOGO_URL)}" alt="Logo ${escapeHtml(STORE_NAME)}" onerror="this.style.display='none'"></div>
        <div><h2 class="brand-name">${escapeHtml(STORE_NAME)}</h2><div class="brand-sub">وصل الطلب · Bon de livraison</div></div>
      </div>
      <div class="invoice-title">
        <h1>FACTURE</h1>
        <div class="invoice-meta"><div><b>رقم الطلب:</b> <span dir="ltr">${escapeHtml(order.order_number)}</span></div><div><b>التاريخ:</b> ${escapeHtml(formatDate(order.created_at))}</div><div><b>الحالة:</b> ${escapeHtml(ORDER_STATUS_LABELS[order.status])}</div></div>
      </div>
    </div>
    <div class="intro-grid">
      <section><h3 class="label">معلومات الزبون</h3><div class="info"><p><b>${escapeHtml(order.customer_name)}</b></p><p>${escapeHtml(order.phone || '—')}</p><p>${address || 'العنوان غير محدد'}</p><p>${escapeHtml(order.municipality || '')}</p></div></section>
      <section><h3 class="label">تفاصيل الطلب</h3><div class="info"><p>طريقة الدفع: ${escapeHtml(paymentMethod)}</p><p>نوع التوصيل: ${escapeHtml(deliveryType)}</p><p>عدد القطع: ${totalItems}</p>${notes}</div></section>
    </div>
    <div class="table-head"><span>وصف المنتج / ITEM DESCRIPTION</span><span style="text-align:center">الكمية</span><span style="text-align:left">السعر</span><span style="text-align:left">المجموع</span></div>
    <table><tbody>${rows || '<tr><td colspan="5" style="text-align:center">لا توجد منتجات</td></tr>'}</tbody></table>
    <div class="bottom-grid">
      <section class="notes"><h3 class="label">ملاحظات</h3><p>شكراً لاختياركم ${escapeHtml(STORE_NAME)}. نحرص دائماً على تقديم أفضل خدمة لكم.</p><p>يرجى التأكد من محتويات الطلب عند الاستلام.</p></section>
      <section class="summary">
        <div class="summary-row"><span>عدد القطع</span><strong>${totalItems}</strong></div>
        <div class="summary-row grand"><span>المبلغ الإجمالي</span><strong>${formatMoney(order.total_price)}</strong></div>
      </section>
    </div>
    <div class="pay-note"><b>المبلغ المطلوب عند الاستلام:</b> ${order.payment_method === 'cash' ? formatMoney(order.total_price) : 'حسب تأكيد الدفع'}</div>
    <div class="signatures"><div class="signature">توقيع الزبون / Signature client</div><div class="signature">توقيع الموصّل / Signature livreur</div></div>
  </div>
  <footer class="footer"><span>✦ ${escapeHtml(STORE_NAME)}</span><span>${escapeHtml(STORE_ADDRESS)}</span>${STORE_PHONE ? `<span>☎ ${escapeHtml(STORE_PHONE)}</span>` : ''}${STORE_SOCIAL ? `<span>${escapeHtml(STORE_SOCIAL)}</span>` : ''}</footer>
</div>
<script>window.onload = () => { window.focus(); window.print(); };</script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=900,height=1000');
  if (!win) return false;
  win.document.open();
  win.document.write(html);
  win.document.close();
  return true;
};

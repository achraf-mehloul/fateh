import { Order, ORDER_STATUS_LABELS, OrderStatus } from '@/lib/orders';
import { normalizePhone } from '@/lib/validation';

const STORE_NAME = 'Velvet Store';

// تحويل رقم محلي إلى صيغة دولية بدون +
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

// رابط واتساب لإرسال إشعار للزبون
export const whatsappLink = (phone: string, message: string): string =>
  `https://wa.me/${toInternational(phone)}?text=${encodeURIComponent(message)}`;

// رابط بريد إلكتروني (mailto) للإشعار
export const mailtoLink = (email: string, subject: string, body: string): string =>
  `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

// طباعة وصل التسليم
export const printDeliverySlip = (order: Order) => {
  const rows = order.items
    .map(
      (item) => `<tr>
        <td>${item.product.name}</td>
        <td style="text-align:center">${item.quantity}</td>
        <td style="text-align:left">${(item.product.price * item.quantity).toLocaleString()} دج</td>
      </tr>`
    )
    .join('');

  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<title>وصل تسليم ${order.order_number}</title>
<style>
  * { font-family: "Segoe UI", Tahoma, Arial, sans-serif; }
  body { padding: 24px; color: #111; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .muted { color: #666; font-size: 12px; }
  .box { border: 1px solid #ddd; border-radius: 8px; padding: 12px; margin-top: 12px; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th, td { border-bottom: 1px solid #eee; padding: 8px; font-size: 13px; }
  th { background: #f7f7f7; text-align: right; }
  .total { margin-top: 12px; font-size: 18px; font-weight: bold; text-align: left; }
  .grid { display: flex; gap: 12px; }
  .grid > div { flex: 1; }
  .sign { margin-top: 36px; display: flex; justify-content: space-between; font-size: 12px; }
</style>
</head>
<body>
  <h1>${STORE_NAME} — وصل تسليم</h1>
  <div class="muted">رقم الطلب: ${order.order_number} — التاريخ: ${new Date(order.created_at).toLocaleString('ar-DZ')}</div>
  <div class="grid">
    <div class="box">
      <strong>معلومات الزبون</strong><br/>
      الاسم: ${order.customer_name}<br/>
      الهاتف: ${order.phone || '—'}<br/>
      الولاية: ${order.wilaya}<br/>
      البلدية: ${order.municipality}<br/>
      نوع التوصيل: ${order.delivery_type === 'office' ? 'مكتب (Stop Desk)' : 'للمنزل'}
    </div>
    <div class="box">
      <strong>الدفع</strong><br/>
      الطريقة: ${order.payment_method === 'cash' ? 'الدفع عند الاستلام' : 'البريدي موب'}<br/>
      الحالة: ${ORDER_STATUS_LABELS[order.status]}<br/>
      ${order.notes ? `ملاحظات: ${order.notes}` : ''}
    </div>
  </div>
  <table>
    <thead><tr><th>المنتج</th><th style="text-align:center">الكمية</th><th style="text-align:left">السعر</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="total">المبلغ الإجمالي: ${order.total_price.toLocaleString()} دج</div>
  <div class="sign"><span>توقيع الزبون: ................</span><span>توقيع الموصّل: ................</span></div>
  <script>window.onload = () => { window.print(); };<\/script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=800,height=900');
  if (!win) return false;
  win.document.write(html);
  win.document.close();
  return true;
};

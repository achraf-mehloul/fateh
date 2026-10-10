import { supabase } from "@/integrations/supabase/client";
import { CartItem } from "@/data/store";
import { Json } from "@/integrations/supabase/types";

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';

export type DeliveryType = 'home' | 'office';

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  wilaya: string;
  municipality: string;
  phone?: string;
  payment_method: 'cash' | 'baridimob';
  status: OrderStatus;
  total_price: number;
  items: CartItem[];
  payment_receipt_url?: string;
  sender_account?: string;
  notes?: string;
  delivery_type?: DeliveryType;
  created_at: string;
  updated_at: string;
}

export const DELIVERY_TYPE_LABELS: Record<DeliveryType, string> = {
  home: 'توصيل للمنزل',
  office: 'توصيل للمكتب (Stop Desk)',
};


export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'قيد الانتظار',
  confirmed: 'تم التأكيد',
  preparing: 'قيد التحضير',
  shipped: 'تم الشحن',
  delivered: 'تم التوصيل',
  cancelled: 'ملغي',
};

export const ORDER_STATUS_STEPS: OrderStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'shipped',
  'delivered',
];

// Generate unique order number
export const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

// Create new order in database
export const createOrder = async (
  items: CartItem[],
  totalPrice: number,
  customerName: string,
  wilaya: string,
  municipality: string,
  paymentMethod: 'cash' | 'baridimob',
  phone?: string,
  senderAccount?: string,
  paymentReceiptUrl?: string,
  deliveryType: DeliveryType = 'home'
): Promise<Order | null> => {
  const orderNumber = generateOrderNumber();
  
  const orderData = {
    order_number: orderNumber,
    customer_name: customerName,
    wilaya,
    municipality,
    phone: phone || null,
    payment_method: paymentMethod,
    total_price: totalPrice,
    items: JSON.parse(JSON.stringify(items)) as Json,
    sender_account: senderAccount || null,
    payment_receipt_url: paymentReceiptUrl || null,
    delivery_type: deliveryType,
  };

  // ملاحظة مهمة:
  // لا نستعمل .select() هنا لأن سياسة SELECT محمية (للأدمن فقط)
  // بينما INSERT مسموح للجميع. استخدام select بعد insert سيُرجع خطأ RLS
  // رغم أن الطلب قد تم إدخاله فعلاً.
  const { error } = await supabase
    .from('orders')
    .insert([orderData]);

  if (error) {
    console.error('Error creating order:', error);
    return null;
  }

  const nowIso = new Date().toISOString();

  // نُرجع كائن الطلب محلياً (المهم للعميل هو رقم الطلب للتتبع)
  return {
    id: 'pending',
    order_number: orderNumber,
    customer_name: customerName,
    wilaya,
    municipality,
    phone: phone || undefined,
    payment_method: paymentMethod,
    status: 'pending',
    total_price: totalPrice,
    items,
    payment_receipt_url: paymentReceiptUrl || undefined,
    sender_account: senderAccount || undefined,
    notes: undefined,
    delivery_type: deliveryType,
    created_at: nowIso,
    updated_at: nowIso,
  };
};

// Find order by order number (uses secure database function)
export const findOrderByNumber = async (orderNumber: string): Promise<Order | null> => {
  const { data, error } = await supabase
    .rpc('get_order_by_number', { _order_number: orderNumber.toUpperCase().trim() });

  if (error) {
    console.error('Error finding order:', error);
    return null;
  }

  if (!data || data.length === 0) {
    return null;
  }

  const order = data[0];
  return {
    ...order,
    items: order.items as unknown as CartItem[],
    payment_method: order.payment_method as 'cash' | 'baridimob',
    status: order.status as OrderStatus,
    delivery_type: ((order as { delivery_type?: string }).delivery_type as DeliveryType) || 'home',
  };
};

// Get all orders (admin only)
export const getAllOrders = async (): Promise<Order[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    return [];
  }

  return data.map(order => ({
    ...order,
    items: order.items as unknown as CartItem[],
    payment_method: order.payment_method as 'cash' | 'baridimob',
    status: order.status as OrderStatus,
    delivery_type: ((order as { delivery_type?: string }).delivery_type as DeliveryType) || 'home',
  }));
};


// Update order status (admin only)
export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<boolean> => {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId);

  if (error) {
    console.error('Error updating order status:', error);
    return false;
  }

  return true;
};

// Update order notes (admin only)
export const updateOrderNotes = async (orderId: string, notes: string): Promise<boolean> => {
  const { error } = await supabase
    .from('orders')
    .update({ notes })
    .eq('id', orderId);

  if (error) {
    console.error('Error updating order notes:', error);
    return false;
  }

  return true;
};

// Delete order (admin only)
export const deleteOrder = async (orderId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', orderId);

  if (error) {
    console.error('Error deleting order:', error);
    return false;
  }

  return true;
};

// Get orders statistics
export const getOrdersStats = (orders: Order[]) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const todayOrders = orders.filter(o => new Date(o.created_at) >= today);
  const weekOrders = orders.filter(o => new Date(o.created_at) >= thisWeek);
  const monthOrders = orders.filter(o => new Date(o.created_at) >= thisMonth);

  const totalRevenue = orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + o.total_price, 0);

  const todayRevenue = todayOrders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + o.total_price, 0);

  const weekRevenue = weekOrders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + o.total_price, 0);

  const monthRevenue = monthOrders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + o.total_price, 0);

  const pendingRevenue = orders
    .filter(o => !['delivered', 'cancelled'].includes(o.status))
    .reduce((sum, o) => sum + o.total_price, 0);

  // Daily orders for chart (last 7 days)
  const dailyOrders: { date: string; orders: number; revenue: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toLocaleDateString('ar-DZ', { weekday: 'short', day: 'numeric' });
    const dayOrders = orders.filter(o => {
      const orderDate = new Date(o.created_at);
      return orderDate.toDateString() === date.toDateString();
    });
    dailyOrders.push({
      date: dateStr,
      orders: dayOrders.length,
      revenue: dayOrders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.total_price, 0),
    });
  }

  // Status distribution
  const statusDistribution = Object.keys(ORDER_STATUS_LABELS).map(status => ({
    name: ORDER_STATUS_LABELS[status as OrderStatus],
    value: orders.filter(o => o.status === status).length,
    status,
  }));

  // Payment method distribution
  const paymentDistribution = [
    { name: 'الدفع عند الاستلام', value: orders.filter(o => o.payment_method === 'cash').length },
    { name: 'البريدي موب', value: orders.filter(o => o.payment_method === 'baridimob').length },
  ];

  // Top wilayas
  const wilayaCounts: Record<string, number> = {};
  orders.forEach(o => {
    wilayaCounts[o.wilaya] = (wilayaCounts[o.wilaya] || 0) + 1;
  });
  const topWilayas = Object.entries(wilayaCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));

  // أكثر المنتجات مبيعاً
  const productCounts: Record<string, { name: string; quantity: number; revenue: number }> = {};
  orders
    .filter(o => o.status !== 'cancelled')
    .forEach(o => {
      o.items.forEach(item => {
        const key = item.product.id || item.product.name;
        if (!productCounts[key]) {
          productCounts[key] = { name: item.product.name, quantity: 0, revenue: 0 };
        }
        productCounts[key].quantity += item.quantity;
        productCounts[key].revenue += item.quantity * item.product.price;
      });
    });
  const topProducts = Object.values(productCounts)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // نسبة الإلغاء ونسبة التسليم
  const cancelledCount = orders.filter(o => o.status === 'cancelled').length;
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;
  const cancelRate = orders.length ? (cancelledCount / orders.length) * 100 : 0;
  const deliveryRate = orders.length ? (deliveredCount / orders.length) * 100 : 0;
  const avgOrderValue = orders.length ? totalRevenue / orders.length : 0;

  return {
    total: orders.length,
    today: todayOrders.length,
    thisWeek: weekOrders.length,
    thisMonth: monthOrders.length,
    totalRevenue,
    todayRevenue,
    weekRevenue,
    monthRevenue,
    pendingRevenue,
    dailyOrders,
    statusDistribution,
    paymentDistribution,
    topWilayas,
    topProducts,
    cancelledCount,
    deliveredCount,
    cancelRate,
    deliveryRate,
    avgOrderValue,
  };
};

// Export orders to CSV
export const exportOrdersToCSV = (orders: Order[]): string => {
  const headers = [
    'رقم الطلب',
    'اسم العميل',
    'الهاتف',
    'الولاية',
    'البلدية',
    'نوع التوصيل',
    'طريقة الدفع',
    'الحالة',
    'المبلغ الإجمالي',
    'تاريخ الإنشاء',
    'المنتجات',
  ];

  const rows = orders.map(order => [
    order.order_number,
    order.customer_name,
    order.phone || '',
    order.wilaya,
    order.municipality,
    order.delivery_type === 'office' ? 'مكتب (Stop Desk)' : 'للمنزل',
    order.payment_method === 'cash' ? 'الدفع عند الاستلام' : 'البريدي موب',
    ORDER_STATUS_LABELS[order.status],
    order.total_price.toString(),
    new Date(order.created_at).toLocaleString('ar-DZ'),
    order.items.map(i => `${i.product.name} (${i.quantity})`).join(' | '),
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  return '\uFEFF' + csvContent; // BOM for Excel Arabic support
};

// تصدير الطلبات إلى ملف Excel (XLSX)
export const exportOrdersToExcel = (orders: Order[]) => {
  const headers = [
    'رقم الطلب', 'اسم العميل', 'الهاتف', 'الولاية', 'البلدية', 'نوع التوصيل',
    'طريقة الدفع', 'الحالة', 'المبلغ الإجمالي', 'تاريخ الإنشاء', 'المنتجات',
  ];
  const esc = (v: string) =>
    String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const body = orders
    .map(order => {
      const cells = [
        order.order_number,
        order.customer_name,
        order.phone || '',
        order.wilaya,
        order.municipality,
        order.delivery_type === 'office' ? 'مكتب (Stop Desk)' : 'للمنزل',
        order.payment_method === 'cash' ? 'الدفع عند الاستلام' : 'البريدي موب',
        ORDER_STATUS_LABELS[order.status],
        order.total_price.toString(),
        new Date(order.created_at).toLocaleString('ar-DZ'),
        order.items.map(i => `${i.product.name} (${i.quantity})`).join(' | '),
      ];
      return `<tr>${cells.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`;
    })
    .join('');

  const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8" /></head>
<body><table border="1" dir="rtl">
<thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
<tbody>${body}</tbody></table></body></html>`;

  const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `orders-${new Date().toISOString().split('T')[0]}.xls`;
  a.click();
  URL.revokeObjectURL(url);
};


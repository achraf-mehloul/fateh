import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, Clock, CheckCircle, Truck, Home, XCircle, 
  LogOut, RefreshCw, Search, ChevronDown, ChevronUp,
  MessageSquare, MapPin, CreditCard, Trash2, Download,
  Image as ImageIcon, ExternalLink, TrendingUp, DollarSign,
  BarChart3, PieChart, Users, Calendar, AlertTriangle, Tag,
  ShoppingBag, FolderOpen, Flame, Printer, FileSpreadsheet, Send
} from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { 
  Order, OrderStatus, ORDER_STATUS_LABELS, 
  getAllOrders, updateOrderStatus, updateOrderNotes, deleteOrder,
  getOrdersStats, exportOrdersToCSV, exportOrdersToExcel
} from '@/lib/orders';
import { whatsappLink, statusMessage, printDeliverySlip } from '@/lib/notify';
import { supabase } from '@/integrations/supabase/client';

import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, LineChart, Line } from 'recharts';
import CouponManager from '@/components/admin/CouponManager';
import ProductManager from '@/components/admin/ProductManager';
import CategoryManager from '@/components/admin/CategoryManager';
import DealsManager from '@/components/admin/DealsManager';

const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
  confirmed: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
  preparing: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
  shipped: 'bg-cyan-500/20 text-cyan-500 border-cyan-500/30',
  delivered: 'bg-green-500/20 text-green-500 border-green-500/30',
  cancelled: 'bg-red-500/20 text-red-500 border-red-500/30',
};

const statusChartColors: Record<OrderStatus, string> = {
  pending: '#eab308',
  confirmed: '#3b82f6',
  preparing: '#a855f7',
  shipped: '#06b6d4',
  delivered: '#22c55e',
  cancelled: '#ef4444',
};

const statusIcons: Record<OrderStatus, React.ReactNode> = {
  pending: <Clock className="h-4 w-4" />,
  confirmed: <CheckCircle className="h-4 w-4" />,
  preparing: <Package className="h-4 w-4" />,
  shipped: <Truck className="h-4 w-4" />,
  delivered: <Home className="h-4 w-4" />,
  cancelled: <XCircle className="h-4 w-4" />,
};

// صوت تنبيه بسيط عند وصول طلب جديد
const playNewOrderSound = () => {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    // تجاهل إذا منع المتصفح الصوت
  }
};


const Admin: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading, signOut } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState('');
  const [receiptImageUrl, setReceiptImageUrl] = useState<string | null>(null);
  const [deleteConfirmOrder, setDeleteConfirmOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState('orders');

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/admin/login');
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchOrders();
      
      const channel = supabase
        .channel('orders-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const newOrder = payload.new as { order_number?: string; customer_name?: string; total_price?: number };
              // تنبيه فوري للأدمن عند وصول طلب جديد
              toast.success('🔔 طلب جديد وصل الآن!', {
                description: `${newOrder.customer_name || ''} — ${(newOrder.total_price || 0).toLocaleString()} دج (${newOrder.order_number || ''})`,
                duration: 10000,
              });
              playNewOrderSound();
            }
            fetchOrders();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, isAdmin]);


  useEffect(() => {
    let filtered = orders;
    
    if (searchQuery) {
      filtered = filtered.filter(order => 
        order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.phone?.includes(searchQuery)
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    
    setFilteredOrders(filtered);
  }, [orders, searchQuery, statusFilter]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    const data = await getAllOrders();
    setOrders(data);
    setLoadingOrders(false);
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    const success = await updateOrderStatus(orderId, newStatus);
    if (success) {
      const order = orders.find(o => o.id === orderId);
      toast.success('تم تحديث حالة الطلب', {
        description: order?.phone ? 'يمكنك إشعار الزبون عبر واتساب' : undefined,
        action: order?.phone
          ? {
              label: 'إشعار واتساب',
              onClick: () =>
                window.open(
                  whatsappLink(order.phone!, statusMessage({ ...order, status: newStatus }, newStatus)),
                  '_blank'
                ),
            }
          : undefined,
        duration: 8000,
      });
      fetchOrders();
    } else {
      toast.error('فشل تحديث حالة الطلب');
    }
  };

  // إشعار الزبون عبر واتساب
  const notifyByWhatsapp = (order: Order) => {
    if (!order.phone) {
      toast.error('لا يوجد رقم هاتف لهذا الطلب');
      return;
    }
    window.open(whatsappLink(order.phone, statusMessage(order, order.status)), '_blank');
  };

  // طباعة وصل التسليم
  const handlePrintSlip = (order: Order) => {
    const ok = printDeliverySlip(order);
    if (!ok) toast.error('يرجى السماح بالنوافذ المنبثقة للطباعة');
  };


  const handleSaveNotes = async (orderId: string) => {
    const success = await updateOrderNotes(orderId, notesValue);
    if (success) {
      toast.success('تم حفظ الملاحظات');
      setEditingNotes(null);
      fetchOrders();
    } else {
      toast.error('فشل حفظ الملاحظات');
    }
  };

  const handleDeleteOrder = async () => {
    if (!deleteConfirmOrder) return;
    
    const success = await deleteOrder(deleteConfirmOrder.id);
    if (success) {
      toast.success('تم حذف الطلب بنجاح');
      setDeleteConfirmOrder(null);
      fetchOrders();
    } else {
      toast.error('فشل حذف الطلب');
    }
  };

  const handleExportCSV = () => {
    const csv = exportOrdersToCSV(filteredOrders);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('تم تصدير البيانات بنجاح');
  };

  const handleExportExcel = () => {
    exportOrdersToExcel(filteredOrders);
    toast.success('تم تصدير ملف Excel بنجاح');
  };


  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-DZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('ar-DZ') + ' دج';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground mt-4">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  const stats = getOrdersStats(orders);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header onSearch={() => {}} />
      
      <main className="flex-1 container py-4 sm:py-8 px-3 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl gradient-text">لوحة التحكم</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">إدارة الطلبات والإحصائيات</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={fetchOrders} disabled={loadingOrders}>
              <RefreshCw className={`h-4 w-4 ml-1 sm:ml-2 ${loadingOrders ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">تحديث</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="h-4 w-4 ml-1 sm:ml-2" />
              <span className="hidden sm:inline">CSV</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportExcel}>
              <FileSpreadsheet className="h-4 w-4 ml-1 sm:ml-2" />
              <span className="hidden sm:inline">Excel</span>
            </Button>
            <Button variant="destructive" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 ml-1 sm:ml-2" />
              <span className="hidden sm:inline">خروج</span>
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex flex-wrap gap-1 h-auto p-1 lg:w-auto">
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">الطلبات</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">المنتجات</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              <span className="hidden sm:inline">التصنيفات</span>
            </TabsTrigger>
            <TabsTrigger value="deals" className="flex items-center gap-2">
              <Flame className="h-4 w-4" />
              <span className="hidden sm:inline">العروض</span>
            </TabsTrigger>
            <TabsTrigger value="coupons" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              <span className="hidden sm:inline">الكوبونات</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">الإحصائيات</span>
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products">
            <ProductManager />
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories">
            <CategoryManager />
          </TabsContent>

          {/* Deals Tab */}
          <TabsContent value="deals">
            <DealsManager />
          </TabsContent>

          {/* Coupons Tab */}
          <TabsContent value="coupons">
            <CouponManager />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 sm:p-3 rounded-lg bg-primary/10">
                    <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold gradient-text">{stats.total}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">إجمالي الطلبات</p>
                  </div>
                </div>
              </div>
              <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 sm:p-3 rounded-lg bg-green-500/10">
                    <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-bold text-green-500">{formatCurrency(stats.totalRevenue)}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">الإيرادات المحققة</p>
                  </div>
                </div>
              </div>
              <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 sm:p-3 rounded-lg bg-yellow-500/10">
                    <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-bold text-yellow-500">{formatCurrency(stats.pendingRevenue)}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">قيد المعالجة</p>
                  </div>
                </div>
              </div>
              <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 sm:p-3 rounded-lg bg-blue-500/10">
                    <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-blue-500">{stats.today}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">طلبات اليوم</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Period Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card rounded-xl border border-border p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  اليوم
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الطلبات</span>
                    <span className="font-bold">{stats.today}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الإيرادات</span>
                    <span className="font-bold text-green-500">{formatCurrency(stats.todayRevenue)}</span>
                  </div>
                </div>
              </div>
              <div className="bg-card rounded-xl border border-border p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  هذا الأسبوع
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الطلبات</span>
                    <span className="font-bold">{stats.thisWeek}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الإيرادات</span>
                    <span className="font-bold text-green-500">{formatCurrency(stats.weekRevenue)}</span>
                  </div>
                </div>
              </div>
              <div className="bg-card rounded-xl border border-border p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  هذا الشهر
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الطلبات</span>
                    <span className="font-bold">{stats.thisMonth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الإيرادات</span>
                    <span className="font-bold text-green-500">{formatCurrency(stats.monthRevenue)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Daily Orders Chart */}
              <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  الطلبات (آخر 7 أيام)
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.dailyOrders}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          direction: 'rtl'
                        }}
                        formatter={(value: number) => [value, 'الطلبات']}
                      />
                      <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Status Distribution */}
              <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-primary" />
                  توزيع حالات الطلبات
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={stats.statusDistribution.filter(s => s.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                        labelLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                      >
                        {stats.statusDistribution.map((entry) => (
                          <Cell 
                            key={entry.status} 
                            fill={statusChartColors[entry.status as OrderStatus]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          direction: 'rtl'
                        }}
                      />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  طرق الدفع
                </h3>
                <div className="space-y-4">
                  {stats.paymentDistribution.map((method) => (
                    <div key={method.name}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">{method.name}</span>
                        <span className="text-sm font-semibold">{method.value}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all"
                          style={{ width: `${stats.total > 0 ? (method.value / stats.total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Wilayas */}
              <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  أكثر الولايات طلباً
                </h3>
                {stats.topWilayas.length > 0 ? (
                  <div className="space-y-3">
                    {stats.topWilayas.map((wilaya, index) => (
                      <div key={wilaya.name} className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-yellow-500 text-yellow-950' :
                          index === 1 ? 'bg-gray-400 text-gray-950' :
                          index === 2 ? 'bg-orange-600 text-orange-950' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}
                        </span>
                        <span className="flex-1">{wilaya.name}</span>
                        <span className="font-bold">{wilaya.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">لا توجد بيانات</p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            {/* Quick Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 sm:gap-4">
              <div 
                className={`bg-card rounded-xl border p-3 sm:p-4 text-center cursor-pointer transition-all ${statusFilter === 'all' ? 'ring-2 ring-primary' : 'border-border hover:border-primary/50'}`}
                onClick={() => setStatusFilter('all')}
              >
                <p className="text-xl sm:text-2xl font-bold gradient-text">{stats.total}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">الكل</p>
              </div>
              {Object.entries(ORDER_STATUS_LABELS).map(([status, label]) => (
                <div 
                  key={status} 
                  className={`bg-card rounded-xl border p-3 sm:p-4 text-center cursor-pointer transition-all ${statusFilter === status ? 'ring-2 ring-primary' : 'border-border hover:border-primary/50'}`}
                  onClick={() => setStatusFilter(status)}
                >
                  <p className={`text-xl sm:text-2xl font-bold ${statusColors[status as OrderStatus].split(' ')[1]}`}>
                    {orders.filter(o => o.status === status).length}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 truncate">{label}</p>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="بحث برقم الطلب أو الاسم أو الهاتف..."
                    className="pr-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="جميع الحالات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  {Object.entries(ORDER_STATUS_LABELS).map(([status, label]) => (
                    <SelectItem key={status} value={status}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Orders List */}
            {loadingOrders ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
                <p className="text-muted-foreground mt-4">جاري تحميل الطلبات...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">لا توجد طلبات</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="bg-card rounded-xl border border-border overflow-hidden">
                    {/* Order Header */}
                    <div 
                      className="p-3 sm:p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className={`p-2 rounded-lg border ${statusColors[order.status]}`}>
                            {statusIcons[order.status]}
                          </div>
                          <div>
                            <p className="font-mono font-bold text-sm sm:text-base" dir="ltr">{order.order_number}</p>
                            <p className="text-xs sm:text-sm text-muted-foreground">{order.customer_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="text-left">
                            <p className="font-bold gradient-text text-sm sm:text-base">{formatCurrency(order.total_price)}</p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                          </div>
                          {expandedOrder === order.id ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Order Details */}
                    {expandedOrder === order.id && (
                      <div className="border-t border-border p-3 sm:p-4 space-y-4 sm:space-y-6 animate-fade-in">
                        {/* Status Update */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">تحديث الحالة</label>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(ORDER_STATUS_LABELS).map(([status, label]) => (
                              <Button
                                key={status}
                                size="sm"
                                variant={order.status === status ? 'default' : 'outline'}
                                className={`text-xs sm:text-sm ${order.status === status ? 'btn-velvet' : ''}`}
                                onClick={() => handleStatusChange(order.id, status as OrderStatus)}
                              >
                                {statusIcons[status as OrderStatus]}
                                <span className="mr-1 sm:mr-2 hidden sm:inline">{label}</span>
                              </Button>
                            ))}
                          </div>
                        </div>

                        {/* Customer & Payment Info */}
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <h4 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                              <MapPin className="h-4 w-4" />
                              معلومات التوصيل
                            </h4>
                            <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-xs sm:text-sm">
                              <p><strong>الاسم:</strong> {order.customer_name}</p>
                              <p><strong>الولاية:</strong> {order.wilaya}</p>
                              <p><strong>البلدية:</strong> {order.municipality}</p>
                              {order.phone && <p><strong>الهاتف:</strong> <span dir="ltr">{order.phone}</span></p>}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <h4 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                              <CreditCard className="h-4 w-4" />
                              معلومات الدفع
                            </h4>
                            <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-xs sm:text-sm">
                              <p><strong>طريقة الدفع:</strong> {order.payment_method === 'cash' ? 'الدفع عند الاستلام' : 'البريدي موب'}</p>
                              {order.sender_account && <p><strong>رقم حساب المرسل:</strong> <span dir="ltr">{order.sender_account}</span></p>}
                              
                              {order.payment_receipt_url && (
                                <div className="mt-3 pt-3 border-t border-border">
                                  <p className="font-semibold flex items-center gap-2 mb-2">
                                    <ImageIcon className="h-4 w-4" />
                                    صورة إثبات الدفع
                                  </p>
                                  <div 
                                    className="relative group cursor-pointer rounded-lg overflow-hidden border border-border"
                                    onClick={() => setReceiptImageUrl(order.payment_receipt_url || null)}
                                  >
                                    <img 
                                      src={order.payment_receipt_url} 
                                      alt="إيصال الدفع" 
                                      className="w-full h-24 sm:h-32 object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <ExternalLink className="h-6 w-6 text-white" />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Products */}
                        <div>
                          <h4 className="font-semibold flex items-center gap-2 mb-2 text-sm sm:text-base">
                            <Package className="h-4 w-4" />
                            المنتجات ({order.items.length})
                          </h4>
                          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex items-center justify-between text-xs sm:text-sm gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <img 
                                    src={item.product.image} 
                                    alt={item.product.name}
                                    className="w-8 h-8 sm:w-10 sm:h-10 rounded object-cover flex-shrink-0"
                                  />
                                  <span className="truncate">{item.product.name}</span>
                                  <span className="text-muted-foreground flex-shrink-0">×{item.quantity}</span>
                                </div>
                                <span className="font-semibold flex-shrink-0">
                                  {formatCurrency(item.product.price * item.quantity)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Notes */}
                        <div>
                          <h4 className="font-semibold flex items-center gap-2 mb-2 text-sm sm:text-base">
                            <MessageSquare className="h-4 w-4" />
                            ملاحظات
                          </h4>
                          {editingNotes === order.id ? (
                            <div className="space-y-2">
                              <Textarea
                                value={notesValue}
                                onChange={(e) => setNotesValue(e.target.value)}
                                placeholder="أضف ملاحظات..."
                                rows={3}
                                className="text-sm"
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleSaveNotes(order.id)}>
                                  حفظ
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingNotes(null)}>
                                  إلغاء
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div 
                              className="bg-muted/50 rounded-lg p-3 text-xs sm:text-sm cursor-pointer hover:bg-muted transition-colors"
                              onClick={() => {
                                setEditingNotes(order.id);
                                setNotesValue(order.notes || '');
                              }}
                            >
                              {order.notes || 'انقر لإضافة ملاحظات...'}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="pt-4 border-t border-border flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePrintSlip(order)}
                          >
                            <Printer className="h-4 w-4 ml-2" />
                            طباعة وصل التسليم
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!order.phone}
                            onClick={() => notifyByWhatsapp(order)}
                          >
                            <Send className="h-4 w-4 ml-2" />
                            إشعار واتساب
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => setDeleteConfirmOrder(order)}
                          >
                            <Trash2 className="h-4 w-4 ml-2" />
                            حذف الطلب
                          </Button>
                        </div>

                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Receipt Image Modal */}
        <Dialog open={!!receiptImageUrl} onOpenChange={() => setReceiptImageUrl(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                صورة إثبات الدفع
              </DialogTitle>
            </DialogHeader>
            {receiptImageUrl && (
              <div className="relative">
                <img 
                  src={receiptImageUrl} 
                  alt="إيصال الدفع" 
                  className="w-full h-auto rounded-lg"
                />
                <a 
                  href={receiptImageUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="absolute top-2 left-2"
                >
                  <Button size="sm" variant="secondary">
                    <ExternalLink className="h-4 w-4 ml-2" />
                    فتح في نافذة جديدة
                  </Button>
                </a>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={!!deleteConfirmOrder} onOpenChange={() => setDeleteConfirmOrder(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                تأكيد الحذف
              </DialogTitle>
              <DialogDescription>
                هل أنت متأكد من حذف الطلب رقم <strong dir="ltr">{deleteConfirmOrder?.order_number}</strong>؟
                <br />
                لا يمكن التراجع عن هذا الإجراء.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setDeleteConfirmOrder(null)}>
                إلغاء
              </Button>
              <Button variant="destructive" onClick={handleDeleteOrder}>
                <Trash2 className="h-4 w-4 ml-2" />
                حذف
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Admin;

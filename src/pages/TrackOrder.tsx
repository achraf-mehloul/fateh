import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Package, Calendar, MapPin, CreditCard, Copy, Check } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import OrderStatusTracker from '@/components/OrderStatusTracker';
import { findOrderByNumber, Order, ORDER_STATUS_LABELS } from '@/lib/orders';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const TrackOrder: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(searchParams.get('order') || '');
  const [order, setOrder] = useState<Order | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const orderFromUrl = searchParams.get('order');
    if (orderFromUrl) {
      handleSearchOrder(orderFromUrl);
    }
  }, []);

  const handleSearchOrder = async (searchNumber: string) => {
    if (!searchNumber.trim()) {
      toast.error('يرجى إدخال رقم الطلب');
      return;
    }
    
    setLoading(true);
    const foundOrder = await findOrderByNumber(searchNumber.trim());
    setOrder(foundOrder);
    setSearched(true);
    setLoading(false);
    
    if (!foundOrder) {
      toast.error('لم يتم العثور على طلب بهذا الرقم');
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSearchOrder(orderNumber);
  };

  const copyOrderNumber = () => {
    if (order) {
      navigator.clipboard.writeText(order.order_number);
      setCopied(true);
      toast.success('تم نسخ رقم الطلب');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-DZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header onSearch={() => {}} />
      
      <main className="flex-1 container py-8">
        <h1 className="font-display text-3xl mb-8 gradient-text text-center">
          تتبع طلبك
        </h1>

        {/* Search Form */}
        <div className="max-w-xl mx-auto mb-12">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="أدخل رقم الطلب (مثال: ORD-XXXXX-XXXX)"
                className="pr-10 text-lg h-12"
                dir="ltr"
                disabled={loading}
              />
            </div>
            <Button type="submit" className="btn-velvet h-12 px-8" disabled={loading}>
              {loading ? 'جاري البحث...' : 'بحث'}
            </Button>
          </form>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">جاري البحث عن الطلب...</p>
          </div>
        )}

        {/* Order Details */}
        {!loading && order && (
          <div className="max-w-4xl mx-auto animate-fade-in">
            {/* Order Header */}
            <div className="bg-card rounded-xl border border-border p-6 mb-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">رقم الطلب</p>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xl font-bold gradient-text" dir="ltr">
                      {order.order_number}
                    </span>
                    <button
                      onClick={copyOrderNumber}
                      className="p-1.5 rounded-md hover:bg-muted transition-colors"
                      title="نسخ رقم الطلب"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="text-left">
                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                    order.status === 'delivered' 
                      ? 'bg-green-500/20 text-green-500'
                      : order.status === 'shipped'
                      ? 'bg-blue-500/20 text-blue-500'
                      : order.status === 'cancelled'
                      ? 'bg-red-500/20 text-red-500'
                      : 'bg-primary/20 text-primary'
                  }`}>
                    <Package className="h-4 w-4" />
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                </div>
              </div>

              {/* Status Tracker */}
              {order.status !== 'cancelled' && (
                <OrderStatusTracker order={order} />
              )}
            </div>

            {/* Order Info Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Customer Info */}
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="font-display text-lg mb-4 gradient-text">معلومات التوصيل</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-sm">👤</span>
                    </div>
                    <span>{order.customer_name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <span>{order.municipality}، {order.wilaya}</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <span>{order.payment_method === 'cash' ? 'الدفع عند الاستلام' : 'البريدي موب'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <span>{formatDate(order.created_at)}</span>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="font-display text-lg mb-4 gradient-text">المنتجات</h3>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">الكمية: {item.quantity}</p>
                      </div>
                      <span className="text-sm font-semibold">
                        {(item.product.price * item.quantity).toLocaleString()} دج
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">المجموع الكلي</span>
                    <span className="text-xl font-bold gradient-text">
                      {order.total_price.toLocaleString()} دج
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Order Found */}
        {!loading && searched && !order && (
          <div className="text-center py-12 animate-fade-in">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <Package className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">لم يتم العثور على الطلب</h2>
            <p className="text-muted-foreground">تأكد من صحة رقم الطلب وحاول مرة أخرى</p>
          </div>
        )}

        {/* Initial State */}
        {!loading && !searched && (
          <div className="text-center py-12 text-muted-foreground">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
              <Search className="h-12 w-12 text-muted-foreground/50" />
            </div>
            <p>أدخل رقم الطلب لمتابعة حالته</p>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default TrackOrder;

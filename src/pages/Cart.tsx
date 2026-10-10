import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartItem from '@/components/CartItem';
import CheckoutForm from '@/components/CheckoutForm';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';

const Cart: React.FC = () => {
  const { items, totalPrice } = useCart();
  const [isCheckout, setIsCheckout] = React.useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Header onSearch={() => {}} />
      
      <main className="flex-1 container py-8">
        <h1 className="font-display text-3xl mb-8 gradient-text text-center">
          {isCheckout ? 'إتمام الطلب' : 'سلة التسوق'}
        </h1>

        {isCheckout ? (
          <div className="animate-fade-in">
            <Button
              variant="ghost"
              onClick={() => setIsCheckout(false)}
              className="mb-6"
            >
              <ArrowRight className="h-4 w-4 ml-2" />
              العودة للسلة
            </Button>
            <CheckoutForm />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">السلة فارغة</h2>
            <p className="text-muted-foreground mb-6">لم تقم بإضافة أي منتجات بعد</p>
            <Link to="/">
              <Button className="btn-velvet">
                تصفح المنتجات
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8 animate-fade-in">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <CartItem key={item.product.id} item={item} />
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-xl border border-border p-6 sticky top-24">
                <h2 className="font-display text-xl mb-6 gradient-text">ملخص الطلب</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-muted-foreground">
                    <span>عدد المنتجات</span>
                    <span>{items.length}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>التوصيل</span>
                    <span className="text-sm">حسب الولاية</span>
                  </div>
                  <div className="border-t border-border pt-3">
                    <div className="flex justify-between font-bold text-lg">
                      <span>المنتجات</span>
                      <span className="gradient-text">{totalPrice.toLocaleString()} دج</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      + تكلفة التوصيل عند اختيار الولاية
                    </p>
                  </div>
                </div>

                <Button 
                  onClick={() => setIsCheckout(true)} 
                  className="w-full btn-velvet"
                >
                  إتمام الطلب
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Cart;

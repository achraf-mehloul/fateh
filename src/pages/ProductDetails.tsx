import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowRight, Star, ShoppingCart, Minus, Plus, Check, Truck, Shield, RotateCcw } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface DBProduct {
  id: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  price: number;
  original_price: number | null;
  category_id: string | null;
  image_url: string | null;
  images: string[] | null;
  stock: number;
  is_active: boolean;
  is_deal: boolean;
  rating: number | null;
  reviews_count: number | null;
}

const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<DBProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .maybeSingle();

      if (data) {
        setProduct(data);
        if (data.category_id) {
          const { data: cat } = await supabase
            .from('categories')
            .select('name_ar')
            .eq('id', data.category_id)
            .maybeSingle();
          if (cat) setCategoryName(cat.name_ar);
        }
      }
      setLoading(false);
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header onSearch={() => {}} />
        <main className="flex-1 container py-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <Skeleton className="aspect-square rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-12 w-1/3" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header onSearch={() => {}} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-display gradient-text mb-4">المنتج غير موجود</h1>
            <Link to="/" className="btn-velvet inline-flex items-center gap-2 px-6 py-3 rounded-lg">
              <ArrowRight className="w-4 h-4" />
              العودة للرئيسية
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const displayName = product.name_ar || product.name;
  const displayDesc = product.description_ar || product.description || '';
  const images = (product.images && product.images.length > 0) ? product.images : (product.image_url ? [product.image_url] : []);

  const outOfStock = product.stock <= 0;

  const handleAddToCart = () => {
    if (outOfStock) {
      toast.error('هذا المنتج غير متوفر حالياً');
      return;
    }
    const cartProduct = {
      id: product.id,
      name: displayName,
      price: product.price,
      image: product.image_url || '/placeholder.svg',
      images: product.images || [],
      category: categoryName,
      description: displayDesc,
      rating: product.rating || 0,
      reviews_count: product.reviews_count || 0,
      original_price: product.original_price,
      is_deal: product.is_deal,
      stock: product.stock,
    };
    const added = addToCart(cartProduct, quantity);
    if (added) {
      toast.success('تمت الإضافة إلى السلة', {
        description: `${displayName} × ${quantity}`,
      });
    }
  };


  return (
    <div className="min-h-screen flex flex-col">
      <Header onSearch={() => {}} />
      
      <main className="flex-1">
        <div className="container py-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors">الرئيسية</Link>
            <span>/</span>
            {categoryName && <><span className="hover:text-primary">{categoryName}</span><span>/</span></>}
            <span className="text-foreground">{displayName}</span>
          </nav>
        </div>

        <section className="container py-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="space-y-4">
              <div className="aspect-square bg-card rounded-2xl overflow-hidden border border-border">
                {images.length > 0 ? (
                  <img src={images[selectedImage]} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <ShoppingCart className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === idx ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <h1 className="font-display text-3xl md:text-4xl gradient-text mb-2">{displayName}</h1>
                <p className="text-muted-foreground text-lg">{displayDesc}</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className={`w-5 h-5 ${star <= (product.rating || 0) ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} />
                  ))}
                </div>
                <span className="text-muted-foreground">({product.reviews_count || 0} تقييم)</span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-4xl font-bold gradient-text">{product.price.toLocaleString()} دج</span>
                {product.original_price && (
                  <span className="text-xl text-muted-foreground line-through">{product.original_price.toLocaleString()} دج</span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 bg-card border border-border rounded-lg p-1">
                  <Button variant="ghost" size="icon" disabled={outOfStock} onClick={() => setQuantity(Math.max(1, quantity - 1))} className="h-10 w-10">
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-12 text-center font-semibold text-lg">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={outOfStock || quantity >= product.stock}
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="h-10 w-10"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <Button onClick={handleAddToCart} disabled={outOfStock} className="btn-velvet flex-1 h-12 text-lg">
                  <ShoppingCart className="w-5 h-5 ml-2" />
                  {outOfStock ? 'نفد المخزون' : 'أضف إلى السلة'}
                </Button>
              </div>


              <div className={`text-sm ${product.stock > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {product.stock > 0 ? `متوفر (${product.stock} في المخزون)` : 'غير متوفر حالياً'}
              </div>

              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-2">
                    <Truck className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">توصيل سريع</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-2">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">ضمان الجودة</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-2">
                    <RotateCcw className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">إرجاع مجاني</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default ProductDetails;

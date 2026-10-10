import React, { useState, useMemo, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSection from '@/components/HeroSection';
import CategorySection from '@/components/CategorySection';
import DealsSection from '@/components/DealsSection';
import ProductCard from '@/components/ProductCard';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface DBCategory {
  id: string;
  name: string;
  name_ar: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
}

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
  deal_ends_at: string | null;
  rating: number | null;
  reviews_count: number | null;
}

// تحويل منتج قاعدة البيانات إلى الشكل المستخدم في الواجهة
const mapDBProductToProduct = (dbProduct: DBProduct, categorySlug?: string) => ({
  id: dbProduct.id,
  name: dbProduct.name_ar || dbProduct.name,
  price: dbProduct.price,
  image: dbProduct.image_url || '/placeholder.svg',
  images: dbProduct.images || [],
  category: categorySlug || dbProduct.category_id || '',
  description: dbProduct.description_ar || dbProduct.description || '',
  rating: dbProduct.rating || 0,
  reviews_count: dbProduct.reviews_count || 0,
  original_price: dbProduct.original_price,
  is_deal: dbProduct.is_deal,
  stock: dbProduct.stock,
});

const Index: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<DBCategory[]>([]);
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [dealsActive, setDealsActive] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // جلب التصنيفات والمنتجات وإعدادات العروض بشكل متوازي
      const [categoriesRes, productsRes, dealsRes] = await Promise.all([
        supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('products').select('*').eq('is_active', true),
        supabase.from('deals_settings').select('*').limit(1).maybeSingle(),
      ]);

      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (productsRes.data) setProducts(productsRes.data);
      if (dealsRes.data) setDealsActive(dealsRes.data.is_active);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  const categoryMap = useMemo(() => {
    const map: Record<string, DBCategory> = {};
    categories.forEach(cat => {
      map[cat.id] = cat;
    });
    return map;
  }, [categories]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return products.filter((product) => {
      const productName = product.name_ar || product.name;
      const productDesc = product.description_ar || product.description || '';
      const categoryName = product.category_id ? (categoryMap[product.category_id]?.name_ar || '') : '';
      
      return (
        productName.includes(searchQuery) ||
        productDesc.includes(searchQuery) ||
        categoryName.includes(searchQuery)
      );
    });
  }, [searchQuery, products, categoryMap]);

  const getProductsByCategory = (categoryId: string) => {
    return products.filter((product) => product.category_id === categoryId);
  };

  const dealProducts = useMemo(() => {
    return products.filter(p => p.is_deal);
  }, [products]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header onSearch={setSearchQuery} />
        <main className="flex-1">
          <HeroSection />
          <div className="container py-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-48 w-full rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header onSearch={setSearchQuery} />
      
      <main className="flex-1">
        <HeroSection />
        
        {/* Deals Section with Countdown */}
        {dealsActive && dealProducts.length > 0 && (
          <DealsSection 
            products={dealProducts.map(p => mapDBProductToProduct(p, categoryMap[p.category_id || '']?.slug))} 
          />
        )}
        
        <div id="products">
          {/* Search Results */}
          {filteredProducts !== null ? (
            <section className="py-8 container">
              <h2 className="font-display text-2xl mb-6 gradient-text">
                نتائج البحث: "{searchQuery}"
              </h2>
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredProducts.map((product) => (
                    <ProductCard 
                      key={product.id} 
                      product={mapDBProductToProduct(product, categoryMap[product.category_id || '']?.slug)} 
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">لم يتم العثور على منتجات</p>
                </div>
              )}
            </section>
          ) : (
            /* Category Sections */
            categories.map((category) => {
              const categoryProducts = getProductsByCategory(category.id);
              if (categoryProducts.length === 0) return null;
              
              return (
                <CategorySection
                  key={category.id}
                  category={{
                    id: category.slug,
                    name: category.name_ar,
                    image: categoryProducts[0]?.image_url || '/placeholder.svg',
                  }}
                  products={categoryProducts.map(p => mapDBProductToProduct(p, category.slug))}
                />
              );
            })
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;

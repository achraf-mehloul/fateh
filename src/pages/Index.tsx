
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
    void fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    try {
      const [categoriesRes, productsRes, dealsRes] = await Promise.all([
        supabase
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('sort_order'),
        supabase
          .from('products')
          .select('*')
          .eq('is_active', true),
        supabase
          .from('deals_settings')
          .select('*')
          .limit(1)
          .maybeSingle(),
      ]);

      if (categoriesRes.error) {
        console.error('Error fetching categories:', categoriesRes.error);
      } else {
        setCategories(categoriesRes.data || []);
      }

      if (productsRes.error) {
        console.error('Error fetching products:', productsRes.error);
      } else {
        setProducts(productsRes.data || []);
      }

      if (dealsRes.error) {
        console.error('Error fetching deals settings:', dealsRes.error);
      } else {
        setDealsActive(dealsRes.data?.is_active ?? false);
      }
    } catch (error) {
      console.error('Error fetching homepage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const categoryMap = useMemo(() => {
    const map: Record<string, DBCategory> = {};

    categories.forEach((category) => {
      map[category.id] = category;
    });

    return map;
  }, [categories]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();

    if (!query) return null;

    return products.filter((product) => {
      const productName = product.name_ar || product.name;
      const productDescription =
        product.description_ar || product.description || '';
      const categoryName = product.category_id
        ? categoryMap[product.category_id]?.name_ar || ''
        : '';

      return (
        productName.toLocaleLowerCase().includes(query) ||
        product.name.toLocaleLowerCase().includes(query) ||
        productDescription.toLocaleLowerCase().includes(query) ||
        categoryName.toLocaleLowerCase().includes(query)
      );
    });
  }, [searchQuery, products, categoryMap]);

  const getProductsByCategory = (categoryId: string) => {
    return products.filter((product) => product.category_id === categoryId);
  };

  const uncategorizedProducts = useMemo(() => {
    return products.filter(
      (product) =>
        !product.category_id || !categoryMap[product.category_id]
    );
  }, [products, categoryMap]);

  const dealProducts = useMemo(() => {
    return products.filter((product) => product.is_deal);
  }, [products]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header onSearch={setSearchQuery} />
        <main className="flex-1">
          <HeroSection />
          <div className="container py-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {[...Array(10)].map((_, index) => (
                <div key={index} className="space-y-3">
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

        {dealsActive && dealProducts.length > 0 && (
          <DealsSection
            products={dealProducts.map((product) =>
              mapDBProductToProduct(
                product,
                categoryMap[product.category_id || '']?.slug
              )
            )}
          />
        )}

        <div id="products">
          {filteredProducts !== null ? (
            <section className="container py-8">
              <h2 className="font-display text-2xl mb-6 gradient-text">
                نتائج البحث: "{searchQuery}"
              </h2>

              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={mapDBProductToProduct(
                        product,
                        categoryMap[product.category_id || '']?.slug
                      )}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    لم يتم العثور على منتجات
                  </p>
                </div>
              )}
            </section>
          ) : (
            <>
              {uncategorizedProducts.length > 0 && (
                <section className="container py-8">
                  <h2 className="font-display text-2xl mb-6 gradient-text">
                    جميع المنتجات
                  </h2>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {uncategorizedProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={mapDBProductToProduct(product)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {categories.map((category) => {
                const categoryProducts = getProductsByCategory(category.id);

                if (categoryProducts.length === 0) return null;

                return (
                  <CategorySection
                    key={category.id}
                    category={{
                      id: category.slug,
                      name: category.name_ar || category.name,
                      image:
                        categoryProducts[0]?.image_url || '/placeholder.svg',
                    }}
                    products={categoryProducts.map((product) =>
                      mapDBProductToProduct(product, category.slug)
                    )}
                  />
                );
              })}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;

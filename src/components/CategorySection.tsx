import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Product, Category } from '@/data/store';
import ProductCard from './ProductCard';
import { Button } from '@/components/ui/button';

interface CategorySectionProps {
  category: Category;
  products: Product[];
}

const CategorySection: React.FC<CategorySectionProps> = ({ category, products }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
      setTimeout(checkScroll, 350);
    }
  };

  if (products.length === 0) return null;

  return (
    <section className="py-6 sm:py-8 animate-fade-in">
      <div className="container px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-to-b from-primary to-secondary rounded-full" />
            <h2 className="font-display text-xl sm:text-2xl md:text-3xl gradient-text">
              {category.name}
            </h2>
          </div>
          
          {/* Scroll Buttons - Hidden on mobile */}
          <div className="hidden sm:flex gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className="rounded-full h-10 w-10 hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className="rounded-full h-10 w-10 hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        {/* Products Scroll Container */}
        <div className="relative">
          {/* Gradient Overlays for scroll indication */}
          {canScrollRight && (
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none hidden sm:block" />
          )}
          {canScrollLeft && (
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none hidden sm:block" />
          )}
          
          <div 
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 sm:mx-0 sm:px-0"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {products.map((product) => (
              <div 
                key={product.id} 
                className="flex-shrink-0 w-[160px] sm:w-[200px] md:w-[240px]"
                style={{ scrollSnapAlign: 'start' }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
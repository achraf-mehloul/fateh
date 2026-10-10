import React, { useState, useEffect } from 'react';
import { Clock, Flame, ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';
import { Product } from '@/data/store';
import { Button } from '@/components/ui/button';

interface DealProduct extends Product {
  originalPrice: number;
  discount: number;
}

interface DealsSectionProps {
  products: Product[];
}

const DealsSection: React.FC<DealsSectionProps> = ({ products }) => {
  // Create deal products with discounts
  const dealProducts: DealProduct[] = products.slice(0, 8).map((product, index) => {
    const discounts = [30, 50, 25, 40, 35, 45, 20, 55];
    const discount = discounts[index % discounts.length];
    const originalPrice = Math.round(product.price / (1 - discount / 100));
    return {
      ...product,
      originalPrice,
      discount,
    };
  });

  // Countdown timer - ends in 24 hours from now
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 59,
    seconds: 59,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          // Reset timer when it reaches 0
          return { hours: 23, minutes: 59, seconds: 59 };
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (num: number) => num.toString().padStart(2, '0');

  return (
    <section className="py-8 sm:py-12 relative overflow-hidden">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5" />
      
      <div className="container relative px-4 sm:px-6">
        {/* Header with countdown */}
        <div className="flex flex-col gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Title Section */}
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 bg-primary/20 rounded-full">
              <Flame className="w-6 h-6 sm:w-8 sm:h-8 text-primary animate-pulse" />
            </div>
            <div>
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl gradient-text">
                عروض حصرية
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base mt-0.5">
                خصومات لا تُفوَّت على أفضل المنتجات
              </p>
            </div>
          </div>

          {/* Countdown Timer */}
          <div className="flex items-center gap-2 sm:gap-3 bg-card/80 backdrop-blur-sm border border-primary/30 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg w-fit">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            <span className="text-muted-foreground text-xs sm:text-sm hidden sm:inline">ينتهي خلال:</span>
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="flex flex-col items-center">
                <span className="bg-primary text-primary-foreground font-bold text-lg sm:text-2xl px-2 sm:px-3 py-1 sm:py-2 rounded-lg min-w-[2.5rem] sm:min-w-[3rem] text-center">
                  {formatTime(timeLeft.hours)}
                </span>
                <span className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">ساعة</span>
              </div>
              <span className="text-primary text-lg sm:text-2xl font-bold">:</span>
              <div className="flex flex-col items-center">
                <span className="bg-primary text-primary-foreground font-bold text-lg sm:text-2xl px-2 sm:px-3 py-1 sm:py-2 rounded-lg min-w-[2.5rem] sm:min-w-[3rem] text-center">
                  {formatTime(timeLeft.minutes)}
                </span>
                <span className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">دقيقة</span>
              </div>
              <span className="text-primary text-lg sm:text-2xl font-bold">:</span>
              <div className="flex flex-col items-center">
                <span className="bg-secondary text-secondary-foreground font-bold text-lg sm:text-2xl px-2 sm:px-3 py-1 sm:py-2 rounded-lg min-w-[2.5rem] sm:min-w-[3rem] text-center animate-pulse">
                  {formatTime(timeLeft.seconds)}
                </span>
                <span className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">ثانية</span>
              </div>
            </div>
          </div>
        </div>

        {/* Deals Grid - Responsive */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {dealProducts.map((deal) => (
            <ProductCard 
              key={deal.id} 
              product={deal} 
              showOriginalPrice={deal.originalPrice}
              discount={deal.discount}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-6 sm:mt-8 text-center">
          <p className="text-muted-foreground text-sm sm:text-base">
            🔥 أسرع! العروض محدودة والكمية محدودة
          </p>
        </div>
      </div>
    </section>
  );
};

export default DealsSection;
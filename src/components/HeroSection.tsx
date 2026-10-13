import React from 'react';
import { ArrowLeft, Sparkles, Truck, Shield, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HeroSection: React.FC = () => {
  const scrollToProducts = () => {
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-[50vh] sm:min-h-[60vh] flex items-center justify-center overflow-hidden py-8 sm:py-0">
      {/* Background Gradient */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(340 65% 50%) 0%, transparent 70%)',
        }}
      />
      
      {/* Animated shapes */}
      <div className="absolute top-10 sm:top-20 left-4 sm:left-10 w-20 sm:w-32 h-20 sm:h-32 rounded-full bg-primary/10 blur-3xl animate-pulse" />
      <div className="absolute bottom-10 sm:bottom-20 right-4 sm:right-10 w-24 sm:w-40 h-24 sm:h-40 rounded-full bg-secondary/10 blur-3xl animate-pulse delay-1000" />
      
      <div className="container relative z-10 text-center px-4 sm:px-6">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm mb-4 sm:mb-6 animate-fade-in">
          <Sparkles className="h-4 w-4" />
          <span>منتجات أصلية 100%</span>
        </div>
        
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl mb-4 sm:mb-6 animate-slide-up leading-tight">
          <span className="gradient-text">Voltech chlef</span>
        </h1>
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto animate-fade-in">
          اكتشف تشكيلة واسعة من المنتجات الفاخرة بأسعار مناسبة
        </p>
        <Button 
          onClick={scrollToProducts}
          className="btn-velvet text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 animate-slide-up"
        >
          تسوق الآن
          <ArrowLeft className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
        
        {/* Features - Mobile optimized */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8 sm:mt-12 max-w-3xl mx-auto animate-fade-in">
          <div className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
            <Truck className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <span className="text-xs sm:text-sm text-muted-foreground text-center">توصيل سريع</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
            <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <span className="text-xs sm:text-sm text-muted-foreground text-center">منتجات أصلية</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
            <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <span className="text-xs sm:text-sm text-muted-foreground text-center">دفع آمن</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <span className="text-xs sm:text-sm text-muted-foreground text-center">جودة عالية</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

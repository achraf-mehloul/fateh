import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, Menu, Package } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import logo from '@/assets/logo.png';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface HeaderProps {
  onSearch: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onSearch }) => {
  const { totalItems } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const lastClickRef = useRef(0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const triggerLogoAction = () => {
    const now = Date.now();
    if (now - lastClickRef.current < 350) {
      navigate('/admin');
      lastClickRef.current = 0;
      return true;
    }
    lastClickRef.current = now;
    setTimeout(() => {
      if (lastClickRef.current === now) {
        navigate('/');
      }
    }, 350);
    return false;
  };

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    triggerLogoAction();
  };

  const handleLogoTouchEnd = (e: React.TouchEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    triggerLogoAction();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link
          to="/"
          onClick={handleLogoClick}
          onTouchEnd={handleLogoTouchEnd}
          className="flex items-center gap-2 select-none"
          style={{ touchAction: 'manipulation' }}
        >
          <img
            src={logo}
            alt="Voltech Chlef"
            className="h-12 w-12 rounded-lg object-contain pointer-events-none"
          />
          <span className="font-display text-lg md:text-xl gradient-text hidden sm:inline">
            Voltech Chlef
          </span>
        </Link>

        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="ابحث عن المنتجات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 w-full"
            />
          </div>
        </form>

        <div className="flex items-center gap-2">
          <Link to="/track-order" className="hidden md:inline-flex">
            <Button variant="ghost" size="sm" className="gap-2">
              <Package className="h-4 w-4" />
              تتبع الطلب
            </Button>
          </Link>

          <Link to="/cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -left-1 h-5 w-5 rounded-full bg-primary text-xs text-primary-foreground flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Button>
          </Link>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle className="font-display gradient-text">القائمة</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="ابحث عن المنتجات..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                </form>
                <nav className="flex flex-col gap-2">
                  <Link
                    to="/"
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    الرئيسية
                  </Link>
                  <Link
                    to="/track-order"
                    className="p-2 hover:bg-muted rounded-lg transition-colors flex items-center gap-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Package className="h-4 w-4" />
                    تتبع الطلب
                  </Link>
                  <Link
                    to="/cart"
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    السلة ({totalItems})
                  </Link>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;

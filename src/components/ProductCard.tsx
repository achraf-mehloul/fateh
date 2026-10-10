import React from 'react';
import { Plus, ShoppingCart, Star, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product } from '@/data/store';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
  showOriginalPrice?: number;
  discount?: number;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, showOriginalPrice, discount }) => {
  const { addToCart } = useCart();
  const outOfStock = typeof product.stock === 'number' && product.stock <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) {
      toast.error('نفد المخزون', { description: product.name });
      return;
    }
    const added = addToCart(product);
    if (added) {
      toast.success('تمت الإضافة إلى السلة', {
        description: product.name,
      });
    }
  };

  return (
    <Link to={`/product/${product.id}`} className="block group">
      <div className="relative bg-card rounded-2xl overflow-hidden border border-border/50 transition-all duration-500 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2">
        {/* Discount Badge */}
        {discount && (
          <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-primary to-secondary text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
            -{discount}%
          </div>
        )}

        {/* Out of stock badge */}
        {outOfStock && (
          <div className="absolute top-3 left-3 z-10 bg-destructive text-destructive-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
            نفد المخزون
          </div>
        )}
        
        {/* Image Container */}
        <div className={`relative aspect-square overflow-hidden bg-muted ${outOfStock ? 'opacity-60' : ''}`}>
          {product.image ? (
            <img 
              src={product.image} 
              alt={product.name} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              loading="lazy"
              decoding="async"
              width={400}
              height={400}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
              <ShoppingCart className="h-12 w-12 text-muted-foreground/50" />
            </div>
          )}
          
          {/* Overlay with Quick Actions */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-4">
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={handleAddToCart}
                disabled={outOfStock}
                className="btn-velvet px-4 py-2 shadow-lg"
              >
                <Plus className="h-4 w-4 ml-1" />
                {outOfStock ? 'غير متوفر' : 'أضف للسلة'}
              </Button>

              <Button
                size="sm"
                variant="secondary"
                className="px-3 py-2 bg-white/90 hover:bg-white text-foreground shadow-lg"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Rating Stars */}
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`h-3 w-3 ${i < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} 
              />
            ))}
            <span className="text-xs text-muted-foreground mr-1">(4.0)</span>
          </div>
          
          {/* Product Name */}
          <h3 className="font-display text-sm sm:text-base font-semibold line-clamp-2 leading-tight group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          
          {/* Description */}
          <p className="text-muted-foreground text-xs line-clamp-2 leading-relaxed">
            {product.description}
          </p>
          
          {/* Price Section */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex flex-col">
              {showOriginalPrice && (
                <span className="text-xs text-muted-foreground line-through">
                  {showOriginalPrice.toLocaleString()} دج
                </span>
              )}
              <span className="gradient-text font-bold text-lg">
                {product.price.toLocaleString()} دج
              </span>
            </div>
            
            {/* Mobile Add Button */}
            <Button 
              size="icon"
              onClick={handleAddToCart}
              disabled={outOfStock}
              className="btn-velvet h-10 w-10 rounded-full shadow-lg md:hidden"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { CartItem as CartItemType } from '@/data/store';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';

interface CartItemProps {
  item: CartItemType;
}

const CartItem: React.FC<CartItemProps> = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <div className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border">
      {/* Image */}
      <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
        {item.product.image ? (
          <img 
            src={item.product.image} 
            alt={item.product.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
            <span className="text-2xl">📦</span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h3 className="font-display text-sm sm:text-base font-semibold truncate">{item.product.name}</h3>
        <p className="text-muted-foreground text-sm">{item.product.price.toLocaleString()} دج</p>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="icon" 
          className="h-8 w-8"
          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="w-8 text-center font-semibold">{item.quantity}</span>
        <Button 
          variant="outline" 
          size="icon" 
          className="h-8 w-8"
          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {/* Total & Remove */}
      <div className="flex flex-col items-end gap-2">
        <span className="gradient-text font-bold">
          {(item.product.price * item.quantity).toLocaleString()} دج
        </span>
        <Button 
          variant="ghost" 
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => removeFromCart(item.product.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default CartItem;

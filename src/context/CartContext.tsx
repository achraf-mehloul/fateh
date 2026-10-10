import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CartItem, Product } from '@/data/store';
import { toast } from 'sonner';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => boolean;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// الحد الأقصى المتاح للمنتج (المخزون إن كان معروفاً)
const availableStock = (product: Product): number =>
  typeof product.stock === 'number' ? product.stock : Infinity;

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (product: Product, quantity = 1): boolean => {
    const stock = availableStock(product);

    if (stock <= 0) {
      toast.error('نفد المخزون', { description: product.name });
      return false;
    }

    const current = items.find((item) => item.product.id === product.id)?.quantity ?? 0;
    if (current + quantity > stock) {
      toast.error('الكمية المطلوبة غير متوفرة', {
        description: `المتوفر حالياً: ${stock} قطعة`,
      });
      return false;
    }

    setItems((prev) => {
      const existingItem = prev.find((item) => item.product.id === product.id);
      if (existingItem) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, product, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    return true;
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.product.id !== productId) return item;
        const stock = availableStock(item.product);
        if (quantity > stock) {
          toast.error('الكمية المطلوبة غير متوفرة', {
            description: `المتوفر حالياً: ${stock} قطعة`,
          });
          return { ...item, quantity: stock };
        }
        return { ...item, quantity };
      })
    );
  };

  const clearCart = () => setItems([]);


  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = items.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

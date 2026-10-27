import React, { createContext, useContext, useState, ReactNode } from 'react';
import { toast } from 'sonner';
import { MenuItem } from './MenuContext';

export interface CartItem {
  item: MenuItem;
  quantity: number;
  specialInstructions?: string;
  customizations?: string[];
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: MenuItem, quantity?: number, specialInstructions?: string) => void;
  removeFromCart: (itemId: number) => void;
  updateQuantity: (itemId: number, quantity: number) => void;
  updateSpecialInstructions: (itemId: number, notes: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  showUpsell: boolean;
  setShowUpsell: (show: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showUpsell, setShowUpsell] = useState(false);

  const addToCart = (item: MenuItem, quantity = 1, specialInstructions?: string) => {
    if (item.soldOut) {
      toast.error('Sorry, this item is currently sold out.');
      return;
    }

    setCartItems(prevItems => {
      const existingItem = prevItems.find(cartItem => cartItem.item.itemId === item.itemId);
      
      if (existingItem) {
        // Update quantity if item already exists
        return prevItems.map(cartItem =>
          cartItem.item.itemId === item.itemId
            ? { 
                ...cartItem, 
                quantity: cartItem.quantity + quantity,
                specialInstructions: specialInstructions || cartItem.specialInstructions
              }
            : cartItem
        );
      } else {
        // Add new item
        return [...prevItems, { item, quantity, specialInstructions }];
      }
    });
    
    const isMainCourse = item.categoryId === 3 || (item as any).category === 'mains';
    const isPasta = item.categoryId === 4 || (item as any).category === 'pasta';
    
    if (isMainCourse || isPasta) {
      const hasWine = cartItems.some(ci => ci.item.foodName.toLowerCase().includes('wine'));
      if (!hasWine) {
        setShowUpsell(true);
      }
    }
    
    // Show cart briefly
    setIsCartOpen(true);
    setTimeout(() => setIsCartOpen(false), 2000);
  };

  const removeFromCart = (itemId: number) => {
    setCartItems(prevItems => prevItems.filter(cartItem => cartItem.item.itemId !== itemId));
  };

  const updateSpecialInstructions = (itemId: number, notes: string) => {
    setCartItems(prev =>
      prev.map(ci =>
        ci.item.itemId === itemId ? { ...ci, specialInstructions: notes } : ci
      )
    );
  };

  const updateQuantity = (itemId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCartItems(prevItems =>
      prevItems.map(cartItem =>
        cartItem.item.itemId === itemId
          ? { ...cartItem, quantity }
          : cartItem
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, cartItem) => total + cartItem.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, cartItem) => {
      return total + (cartItem.item.price * cartItem.quantity);
    }, 0);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      updateSpecialInstructions,
      clearCart,
      getTotalItems,
      getTotalPrice,
      isCartOpen,
      setIsCartOpen,
      showUpsell,
      setShowUpsell
    }}>
      {children}
    </CartContext.Provider>
  );
};


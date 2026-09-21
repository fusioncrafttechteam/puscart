import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useSyncExternalStore } from 'react';
/* eslint-disable react-refresh/only-export-components -- context module also exports cart hooks */
import type { ReactNode } from 'react';
import type { CartItem, ProductWithCategory } from '../types';

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: ProductWithCategory }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' };

const EMPTY_CART: CartState = {
  items: [],
  total: 0,
  itemCount: 0,
};

const loadCartFromStorage = (): CartState => {
  try {
    const savedCart = localStorage.getItem('puscart_cart');
    if (savedCart) {
      return JSON.parse(savedCart) as CartState;
    }
  } catch (error) {
    console.error('Error loading cart from localStorage:', error);
  }
  return EMPTY_CART;
};

const initialState: CartState = loadCartFromStorage();

const calculateTotals = (state: CartState): CartState => {
  const total = state.items.reduce(
    (sum, item) => sum + (item.product.offer_price || item.product.price) * item.quantity,
    0
  );
  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);

  return { ...state, total, itemCount };
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.product.id === action.payload.id);

      if (existingItem) {
        const updatedItems = state.items.map(item =>
          item.product.id === action.payload.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        return calculateTotals({ ...state, items: updatedItems });
      }

      return calculateTotals({
        ...state,
        items: [...state.items, { product: action.payload, quantity: 1 }],
      });
    }

    case 'REMOVE_ITEM': {
      return calculateTotals({
        ...state,
        items: state.items.filter(item => item.product.id !== action.payload),
      });
    }

    case 'UPDATE_QUANTITY': {
      const { id, quantity } = action.payload;
      if (quantity <= 0) {
        return calculateTotals({
          ...state,
          items: state.items.filter(item => item.product.id !== id),
        });
      }

      return calculateTotals({
        ...state,
        items: state.items.map(item =>
          item.product.id === id ? { ...item, quantity } : item
        ),
      });
    }

    case 'CLEAR_CART':
      return EMPTY_CART;

    default:
      return state;
  }
};

interface CartActions {
  addItem: (product: ProductWithCategory) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

interface CartContextType extends CartActions {
  state: CartState;
}

const CartActionsContext = createContext<CartActions | undefined>(undefined);

let cartSnapshot: CartState = initialState;
const cartListeners = new Set<() => void>();

function subscribeCart(listener: () => void) {
  cartListeners.add(listener);
  return () => {
    cartListeners.delete(listener);
  };
}

function getCartSnapshot() {
  return cartSnapshot;
}

function emitCart(next: CartState) {
  cartSnapshot = next;
  cartListeners.forEach((listener) => listener());
}

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  useEffect(() => {
    emitCart(state);
    try {
      localStorage.setItem('puscart_cart', JSON.stringify(state));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [state]);

  const addItem = useCallback((product: ProductWithCategory) => {
    dispatch({ type: 'ADD_ITEM', payload: product });
  }, []);

  const removeItem = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, []);

  const actions = useMemo<CartActions>(() => ({
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
  }), [addItem, removeItem, updateQuantity, clearCart]);

  return (
    <CartActionsContext.Provider value={actions}>
      {children}
    </CartActionsContext.Provider>
  );
};

function useCartActionsContext() {
  const actions = useContext(CartActionsContext);
  if (actions === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return actions;
}

export const useCartActions = () => useCartActionsContext();

export const useCart = (): CartContextType => {
  const actions = useCartActionsContext();
  const state = useSyncExternalStore(subscribeCart, getCartSnapshot, getCartSnapshot);
  return { state, ...actions };
};

export const useIsInCart = (productId: string) => {
  return useSyncExternalStore(
    subscribeCart,
    () => cartSnapshot.items.some(item => item.product.id === productId),
    () => false
  );
};

export const useCartItemCount = () => {
  return useSyncExternalStore(
    subscribeCart,
    () => cartSnapshot.itemCount,
    () => 0
  );
};

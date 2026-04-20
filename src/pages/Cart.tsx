import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

const Cart: React.FC = () => {
  const { user } = useAuth();
  const { state, updateQuantity, removeItem } = useCart();
  const { items: cartItems } = state;

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const calculateTotal = () => {
    return state.total;
  };

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <ShoppingCart className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please sign in</h2>
          <p className="text-gray-600 mb-6">Sign in to view your cart and manage orders</p>
          <Link to="/login" className="btn-primary">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Empty cart
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background pt-20 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="w-12 h-12 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Add items from the shop to continue
            </p>
            <Link 
              to="/shop" 
              className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors duration-200 shadow-md hover:shadow-lg w-full"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const total = calculateTotal();
  const deliveryFee = total >= 100 ? 0 : 50;
  const tax = total * 0.00;
  const finalTotal = total + deliveryFee + tax;

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Shopping Cart</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-soft p-4 sm:p-6">
              {cartItems.map((item) => (
                <div key={item.product.id} className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 py-4 border-b border-gray-200 last:border-0">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl shrink-0"
                  />
                  
                  <div className="flex-1 w-full">
                    <h3 className="font-medium text-gray-900 text-sm sm:text-base">{item.product.name}</h3>
                    <p className="text-sm text-gray-500 hidden sm:block">{item.product.description?.substring(0, 50)}...</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-blue-600 font-bold text-sm sm:text-base">
                        ₹{item.product.offer_price || item.product.price}
                      </span>
                      {item.product.offer_price && (
                        <span className="text-gray-400 line-through text-sm">
                          ₹{item.product.price}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between w-full sm:w-auto sm:flex-col sm:space-y-2">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                        className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                        className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="text-right sm:text-center">
                      <p className="font-bold text-gray-900 text-sm sm:text-base">
                        ₹{((item.product.offer_price || item.product.price) * item.quantity).toFixed(2)}
                      </p>
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="text-red-500 hover:text-red-600 mt-1 sm:mt-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Order Summary */}
          <div className="lg:sticky lg:top-24">
            <div className="bg-white rounded-2xl shadow-soft p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600 text-sm sm:text-base">
                  <span>Subtotal</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600 text-sm sm:text-base">
                  <span>Delivery Fee</span>
                  <span>{deliveryFee === 0 ? 'Free' : `₹${deliveryFee.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-gray-600 text-sm sm:text-base">
                  <span>Tax</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between font-semibold text-gray-900 text-base sm:text-lg">
                    <span>Total</span>
                    <span>₹{finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <Link 
                  to="/checkout" 
                  className="btn-primary w-full flex items-center justify-center py-3 sm:py-4 px-4 sm:px-6 text-sm sm:text-base min-h-[44px] sm:min-h-[48px]"
                >
                  Proceed to Checkout
                </Link>
                
                <Link 
                  to="/shop" 
                  className="w-full text-center text-blue-600 hover:text-blue-700 py-3 sm:py-4 px-4 sm:px-6 text-sm sm:text-base min-h-[44px] sm:min-h-[48px] flex items-center justify-center"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;

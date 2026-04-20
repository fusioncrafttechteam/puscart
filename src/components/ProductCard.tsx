import React, { useState, useEffect } from 'react';
import { ShoppingCart, Star, Check } from 'lucide-react';
import type { ProductWithCategory } from '../types';
import { useCart } from '../contexts/CartContext';

interface ProductCardProps {
  product: ProductWithCategory;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem, state } = useCart();
  const [isAdded, setIsAdded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const hasDiscount = product.discount_percentage > 0;
  const discountPercentage = product.discount_percentage;

  // Check if product is already in cart
  const isInCart = state.items.some(item => item.product.id === product.id);

  useEffect(() => {
    setIsAdded(isInCart);
  }, [isInCart]);

  // Get unit display logic
  const getUnitDisplay = (product: ProductWithCategory) => {
    if (product.unit) {
      return product.unit;
    }
    
    // Auto-detect based on category
    const categoryName = product.categories?.name?.toLowerCase() || '';
    if (categoryName.includes('fruit')) return 'kg';
    if (categoryName.includes('vegetable')) return 'kg';
    if (categoryName.includes('cereal') || categoryName.includes('grain')) return 'kg';
    if (categoryName.includes('pulse')) return 'kg';
    if (categoryName.includes('cleansing') || categoryName.includes('cleaning')) return 'pcs';
    if (categoryName.includes('milk') || categoryName.includes('liquid')) return 'L';
    
    return 'g'; // Default fallback
  };

  const unitDisplay = getUnitDisplay(product);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock > 0 && !isAdded) {
      setIsAnimating(true);
      addItem(product);
      setIsAdded(true);
      
      // Reset animation after 600ms
      setTimeout(() => {
        setIsAnimating(false);
      }, 600);
    }
  };

  return (
    <div className="group bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col h-full">
      <div className="relative">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-32 md:h-40 object-cover group-hover:scale-105 transition duration-300"
        />
        
        {/* Stock Badge - Top Left */}
        <div className="absolute top-2 left-2">
          <div className={`rounded-full px-2 py-1 text-xs font-medium ${
            product.stock > 0 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}>
            {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
          </div>
        </div>
        
        {/* Discount Badge - Top Right */}
        {hasDiscount && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            {discountPercentage}% OFF
          </div>
        )}
      </div>
        
      <div className="p-3 flex flex-col flex-1 justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 text-sm md:text-base mb-1 line-clamp-2">
            {product.name}
          </h3>
          
          <p className="text-xs text-gray-500 mb-2">
            {product.categories?.name || 'Unknown Category'}
          </p>
          
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500 ml-1">(4.0)</span>
          </div>
          
          {/* Price with Unit */}
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-primary-600 font-bold text-sm md:text-base">
              ₹{hasDiscount ? (product.price * (1 - product.discount_percentage / 100)).toFixed(2) : product.price} / {unitDisplay}
            </span>
            {hasDiscount && (
              <span className="text-gray-400 line-through text-xs">
                ₹{product.price} / {unitDisplay}
              </span>
            )}
          </div>
        </div>
        
        {/* Cart Button - Zomato/Swiggy Style with Animation */}
        <div className="flex justify-between items-center mt-2">
          <div className="flex-1"></div>
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center gap-2 ${
              product.stock > 0
                ? isAdded
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg transform hover:scale-105'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            } ${
              isAnimating ? 'animate-pulse transform scale-110' : ''
            }`}
          >
            {product.stock > 0 ? (
              isAdded ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>ADDED</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  <span>ADD</span>
                </>
              )
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                <span>Out of Stock</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

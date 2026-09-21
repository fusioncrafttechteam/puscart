import React, { useState, useEffect } from 'react';
import { ShoppingCart, Check, X } from 'lucide-react';
import type { ProductWithCategory } from '../types';
import { useCart } from '../contexts/CartContext';

interface ProductCardProps {
  product: ProductWithCategory;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem, state } = useCart();
  const [isAdded, setIsAdded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const hasDiscount = product.discount_percentage > 0;
  const discountPercentage = product.discount_percentage;

  // Check if product is already in cart
  const isInCart = state.items.some(item => item.product.id === product.id);

  useEffect(() => {
    setIsAdded(isInCart);
  }, [isInCart]);

  // Get unit display logic - use category unit as single source of truth
  const unitDisplay = product.categories?.unit || 'g';

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock > 0 && !isAdded) {
      // Check if on mobile UI
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        setIsBottomSheetOpen(true);
        return;
      }

      executeAddToCart();
    }
  };

  const executeAddToCart = () => {
    setIsAnimating(true);
    addItem(product);
    setIsAdded(true);

    // Reset animation after 600ms
    setTimeout(() => {
      setIsAnimating(false);
    }, 600);
  };

  const handleConfirmAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    executeAddToCart();
    setIsBottomSheetOpen(false);
  };

  return (
    <div className="group bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col h-full">
      <div className="relative">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          decoding="async"
          width="300"
          height="300"
          sizes="(max-width:768px) 150px, (max-width:1200px) 300px, 500px"
          className="w-full h-32 md:h-40 object-cover group-hover:scale-105 transition duration-300"
        />

        {/* Stock Badge - Top Left */}
        <div className="absolute top-2 left-2">
          <div className={`rounded-full px-2 py-1 text-xs font-medium ${product.stock > 0
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
            aria-label={isAdded ? `Remove ${product.name} from cart` : `Add ${product.name} to cart`}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center gap-2 ${product.stock > 0
              ? isAdded
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg transform hover:scale-105'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              } ${isAnimating ? 'animate-pulse transform scale-110' : ''
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
      {/* Mobile Bottom Sheet Modal */}
      {isBottomSheetOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:hidden">
          <style>{`
            @keyframes slideUp {
              from { transform: translateY(100%); }
              to { transform: translateY(0); }
            }
          `}</style>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsBottomSheetOpen(false);
            }}
          />

          {/* Sheet */}
          <div
            className="w-full bg-white rounded-t-3xl p-5 shadow-xl h-[60vh] flex flex-col z-10"
            style={{ animation: 'slideUp 0.3s ease-out forwards' }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {/* Top: Drag handle & close icon */}
            <div className="flex justify-between items-center mb-4 relative">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full absolute left-1/2 -translate-x-1/2 top-0"></div>
              <div className="flex-1"></div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsBottomSheetOpen(false);
                }}
                className="p-4 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 z-10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Middle: Product Details */}
            <div className="flex-1 overflow-y-auto pb-4">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-48 object-contain rounded-xl mb-4"
              />
              <h2 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h2>
              <p className="text-sm text-gray-500 mb-4">{product.categories?.name || 'Unknown Category'}</p>

              <div className="flex items-center space-x-2 mb-4">
                <span className="text-primary-600 font-bold text-2xl">
                  ₹{hasDiscount ? (product.price * (1 - product.discount_percentage / 100)).toFixed(2) : product.price}
                </span>
                <span className="text-gray-500">/ {unitDisplay}</span>
                {hasDiscount && (
                  <span className="text-gray-400 line-through text-sm">
                    ₹{product.price} / {unitDisplay}
                  </span>
                )}
              </div>

              {(product as ProductWithCategory & { description?: string }).description && (
                <p className="text-gray-600 text-m mb-4 leading-relaxed whitespace-pre-wrap">
                  {(product as ProductWithCategory & { description?: string }).description}
                </p>
              )}
            </div>

            {/* Bottom: Add To Cart action */}
            <div className="pt-4 border-t border-gray-100 mt-auto bg-white">
              <button
                onClick={handleConfirmAddToCart}
                disabled={product.stock === 0}
                className="w-full py-3.5 rounded-xl font-bold text-white bg-green-500 active:bg-green-600 shadow-lg flex items-center justify-center gap-2"
              >
                {product.stock > 0 ? (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    <span>Add To Cart</span>
                  </>
                ) : (
                  <span>Out of Stock</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default React.memo(ProductCard);

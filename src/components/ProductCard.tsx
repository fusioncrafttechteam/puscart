import React, { memo } from 'react';
import { ShoppingCart, Check } from 'lucide-react';
import type { ProductWithCategory } from '../types';
import { useCartActions, useIsInCart } from '../contexts/CartContext';

interface ProductCardProps {
  product: ProductWithCategory;
}

function getUnitDisplay(product: ProductWithCategory) {
  if (product.unit) return product.unit;

  const categoryName = product.categories?.name?.toLowerCase() || '';
  if (categoryName.includes('fruit')) return 'kg';
  if (categoryName.includes('vegetable')) return 'kg';
  if (categoryName.includes('cereal') || categoryName.includes('grain')) return 'kg';
  if (categoryName.includes('pulse')) return 'kg';
  if (categoryName.includes('cleansing') || categoryName.includes('cleaning')) return 'pcs';
  if (categoryName.includes('milk') || categoryName.includes('liquid')) return 'L';
  return 'g';
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem } = useCartActions();
  const isInCart = useIsInCart(product.id);
  const [isAnimating, setIsAnimating] = React.useState(false);
  const hasDiscount = product.discount_percentage > 0;
  const unitDisplay = getUnitDisplay(product);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock > 0 && !isInCart) {
      setIsAnimating(true);
      addItem(product);
      window.setTimeout(() => {
        setIsAnimating(false);
      }, 600);
    }
  };

  return (
    <div className="product-tile group bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col h-full">
      <div className="relative overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          width={240}
          height={160}
          loading="lazy"
          decoding="async"
          className="w-full h-32 md:h-40 object-cover"
        />

        <div className="absolute top-2 left-2">
          <div className={`rounded-full px-2 py-1 text-xs font-medium ${
            product.stock > 0
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}>
            {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
          </div>
        </div>

        {hasDiscount && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            {product.discount_percentage}% OFF
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
            <p className="text-[11px] leading-none text-amber-400" aria-label="Rated 4 out of 5">
              ★★★★<span className="text-gray-300">★</span>
            </p>
            <span className="text-xs text-gray-500 ml-1">(4.0)</span>
          </div>

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

        <div className="flex justify-between items-center mt-2">
          <div className="flex-1"></div>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            aria-label={
              product.stock === 0
                ? `${product.name} is out of stock`
                : isInCart
                  ? `${product.name} is already in the cart`
                  : `Add ${product.name} to cart`
            }
            className={`px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 ${
              product.stock > 0
                ? isInCart
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-green-500 hover:bg-green-600 text-white shadow-md'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            } ${
              isAnimating ? 'animate-pulse' : ''
            }`}
          >
            {product.stock > 0 ? (
              isInCart ? (
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

export default memo(ProductCard);

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, Shield, Truck, Star, Search, X } from 'lucide-react';
import { getFeaturedProducts, getPopularProducts, getBestSellingProducts, getCategories, getOfferBanners, searchProducts } from '../services/productService';
import ProductCard from '../components/ProductCard';
import CategorySlider from '../components/CategorySlider';
import OfferBanner from '../components/OfferBanner';
import Footer from '../components/Footer';
import SkeletonLoader from '../components/SkeletonLoader';
import MetaTags from '../components/MetaTags';
import type { ProductWithCategory, Category } from '../types';

const Home: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<ProductWithCategory[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState<ProductWithCategory[]>([]);
  const [popularProducts, setPopularProducts] = useState<ProductWithCategory[]>([]);
  const [bestSellingProducts, setBestSellingProducts] = useState<ProductWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleSearch = async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        try {
          const results = await searchProducts(searchQuery.trim());
          setSearchSuggestions(results.slice(0, 5)); // Limit to 5 suggestions
          setShowSuggestions(true);
        } catch (error) {
          setSearchSuggestions([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const debounceTimer = setTimeout(handleSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
    }
  }, [searchQuery, navigate]);

  const handleSuggestionClick = useCallback((product: ProductWithCategory) => {
    navigate(`/product/${product.id}`);
    setShowSuggestions(false);
    setSearchQuery('');
  }, [navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [featuredData, popularData, bestSellingData, categoriesData, offersData] = await Promise.all([
        getFeaturedProducts(),
        getPopularProducts(),
        getBestSellingProducts(),
        getCategories(),
        getOfferBanners()
      ]);
      
      setFeaturedProducts(featuredData);
      setPopularProducts(popularData);
      setBestSellingProducts(bestSellingData);
      setCategories(categoriesData);
      setOffers(offersData);
    } catch (error) {
      // Error fetching data
    } finally {
      setLoading(false);
    }
  };


  const deliveryBenefits = [
    {
      icon: Clock,
      title: '30-Min Delivery',
      description: 'Fast delivery to your doorstep',
    },
    {
      icon: Shield,
      title: 'Safe Payment',
      description: 'Secure payment methods',
    },
    {
      icon: Truck,
      title: 'Free Shipping',
      description: 'On orders above ₹100',
    },
    {
      icon: Star,
      title: 'Quality Assured',
      description: '100% fresh products',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-14 md:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <SkeletonLoader />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MetaTags
        title="Puscart - Online Grocery Delivery Service"
        description="Order fresh groceries online with Puscart. Fast delivery, quality products, and great prices. Get fruits, vegetables, dairy, and more delivered to your doorstep in 30 minutes."
        keywords="online grocery, grocery delivery, fresh vegetables, fruits, dairy products, food delivery, Puscart, Tamil Nadu grocery"
      />
      <header>
        {/* Offer Banner Section */}
        <section className="mb-4 md:mb-8">
          <OfferBanner offers={offers} />
        </section>

        {/* Mobile Search Bar - Only visible on mobile */}
        <section className="md:hidden mb-8 px-4">
          <div className="relative max-w-md mx-auto" ref={searchRef}>
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for fresh groceries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.trim().length >= 2 && setShowSuggestions(true)}
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchSuggestions([]);
                      setShowSuggestions(false);
                    }}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </form>

            {/* Search Suggestions Dropdown */}
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-80 overflow-y-auto">
                {isSearching ? (
                  <div className="p-4 text-center text-gray-500">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    <p className="mt-2 text-sm">Searching...</p>
                  </div>
                ) : searchSuggestions.length > 0 ? (
                  <div className="py-2">
                    {searchSuggestions.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleSuggestionClick(product)}
                        className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors text-left"
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          loading="lazy"
                          width="48"
                          height="48"
                          sizes="48px"
                          className="w-12 h-12 object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/48x48?text=No+Image';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{product.name}</p>
                          <p className="text-sm text-gray-500 truncate">{product.categories?.name}</p>
                          <p className="text-sm font-semibold text-green-600">₹{product.price}</p>
                        </div>
                      </button>
                    ))}
                    <button
                      onClick={handleSearchSubmit}
                      className="w-full px-4 py-2 text-center text-blue-600 hover:text-blue-700 font-medium text-sm border-t border-gray-100"
                    >
                      View all results for "{searchQuery}"
                    </button>
                  </div>
                ) : searchQuery.trim().length >= 2 ? (
                  <div className="p-4 text-center text-gray-500">
                    <p className="text-sm">No products found</p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </section>
      </header>

      <main>
        {/* Page Heading for SEO */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 md:mt-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Fresh Groceries Delivered to Your Doorstep</h1>
          <p className="text-gray-600 mb-6">Shop from a wide range of fresh products with fast delivery</p>
        </section>

        {/* Categories */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 md:mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Categories</h2>
          <CategorySlider categories={categories} />
        </section>

        {/* Featured Products */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
            <Link to="/shop" className="text-primary-500 hover:text-primary-600 font-medium">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Popular Products */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Popular Products</h2>
            <Link to="/shop" className="text-primary-500 hover:text-primary-600 font-medium">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {popularProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Best Selling Products */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Best Selling</h2>
            <Link to="/shop" className="text-primary-500 hover:text-primary-600 font-medium">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {bestSellingProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Delivery Benefits */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 mb-20">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Why Choose Puscart?
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
            {deliveryBenefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <article key={index} className="text-center">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-primary-500" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-gray-600 text-sm">{benefit.description}</p>
                </article>
              );
            })}
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;

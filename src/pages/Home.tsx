import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Shield, Truck, Star, Search } from 'lucide-react';
import { getFeaturedProducts, getPopularProducts, getBestSellingProducts, getCategories, getOfferBanners } from '../services/productService';
import ProductCard from '../components/ProductCard';
import CategorySlider from '../components/CategorySlider';
import OfferBanner from '../components/OfferBanner';
import Footer from '../components/Footer';
import SkeletonLoader from '../components/SkeletonLoader';
import type { ProductWithCategory, Category } from '../types';

const Home: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredProducts, setFeaturedProducts] = useState<ProductWithCategory[]>([]);
  const [popularProducts, setPopularProducts] = useState<ProductWithCategory[]>([]);
  const [bestSellingProducts, setBestSellingProducts] = useState<ProductWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

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
      console.error('Error fetching data:', error);
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
      <div className="min-h-screen bg-background pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <SkeletonLoader />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background  md:pt-0">
      <header>
        {/* Offer Banner Section */}
        <section className="mb-6 md:mb-10">
          <OfferBanner offers={offers} />
        </section>

        {/* Mobile Search Bar - Only visible on mobile */}
        <section className="md:hidden mb-8 px-4">
          <div className="relative max-w-md mx-auto">
            <input
              type="text"
              placeholder="Search for fresh groceries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </section>
      </header>

      <main>
        {/* Categories */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-8">
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

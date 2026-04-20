import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Offer {
  id: string;
  title: string;
  description: string;
  image: string;
  discount: string;
  code: string;
}

interface OfferBannerProps {
  offers: Offer[];
}

const OfferBanner: React.FC<OfferBannerProps> = ({ offers }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const bannerRef = useRef<HTMLDivElement>(null);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % offers.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + offers.length) % offers.length);
  };

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(0);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextSlide();
    }
    if (isRightSwipe) {
      prevSlide();
    }
  };

  if (offers.length === 0) return null;

const currentOffer = offers[currentIndex];

  return (
    <div 
      ref={bannerRef}
      className="relative rounded-1xl overflow-hidden shadow-medium w-full"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="relative h-56 sm:h-64 md:h-64">
        <img
          src={currentOffer.image}
          alt={currentOffer.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/50 flex items-center justify-center">
          <div className="text-center text-white px-4 sm:px-6">
            <div className="mb-3">
              <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                {currentOffer.discount} OFF
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">
              {currentOffer.title}
            </h2>
            <p className="text-xs sm:text-sm md:text-base mb-4 text-white/90 max-w-xs mx-auto">
              {currentOffer.description}
            </p>
            <div className="flex items-center justify-center space-x-2 bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-lg">
              <span className="text-xs sm:text-sm font-medium">Code:</span>
              <span className="font-bold text-sm sm:text-base">{currentOffer.code}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons - Hidden on Mobile */}
      <button
        onClick={prevSlide}
        className="hidden md:block absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-colors duration-200"
      >
        <ChevronLeft className="w-4 h-4 text-gray-800" />
      </button>
      <button
        onClick={nextSlide}
        className="hidden md:block absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-colors duration-200"
      >
        <ChevronRight className="w-4 h-4 text-gray-800" />
      </button>
      
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
        {offers.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-colors duration-200 ${
              index === currentIndex ? 'bg-white' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default OfferBanner;

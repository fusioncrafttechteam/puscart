import React, { memo, useRef } from 'react';
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
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const touchStart = useRef(0);
  const touchEnd = useRef(0);

  if (offers.length === 0) return null;

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % offers.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + offers.length) % offers.length);
  };

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    touchEnd.current = 0;
    touchStart.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEnd.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;

    const distance = touchStart.current - touchEnd.current;
    if (distance > minSwipeDistance) {
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      prevSlide();
    }
  };

  const currentOffer = offers[currentIndex];

  return (
    <div
      className="relative overflow-hidden shadow-medium w-full"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="relative h-56 sm:h-64 md:h-64">
        <img
          src={currentOffer.image}
          alt={currentOffer.title}
          width={1200}
          height={320}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-r from-black/70 to-black/50 flex items-center justify-center">
          <div className="text-center text-white px-4 sm:px-6">
            <div className="mb-3">
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                {currentOffer.discount} OFF
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">
              {currentOffer.title}
            </h2>
            <p className="text-xs sm:text-sm md:text-base mb-4 text-white/90 max-w-xs mx-auto">
              {currentOffer.description}
            </p>
            <div className="flex items-center justify-center space-x-2 bg-white/20 px-3 sm:px-4 py-2 rounded-lg">
              <span className="text-xs sm:text-sm font-medium">Code:</span>
              <span className="font-bold text-sm sm:text-base">{currentOffer.code}</span>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={prevSlide}
        aria-label="Previous offer"
        className="hidden md:block absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 hover:bg-white transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <ChevronLeft className="w-4 h-4 text-gray-800" />
      </button>
      <button
        type="button"
        onClick={nextSlide}
        aria-label="Next offer"
        className="hidden md:block absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 hover:bg-white transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <ChevronRight className="w-4 h-4 text-gray-800" />
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
        {offers.map((_, index) => (
          <button
            type="button"
            key={offers[index].id}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Show offer ${index + 1}`}
            className={`w-2 h-2 rounded-full transition-colors duration-200 ${
              index === currentIndex ? 'bg-white' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default memo(OfferBanner);

import React from 'react';
import { Link } from 'react-router-dom';
import type { Category } from '../types';

interface CategorySliderProps {
  categories: Category[];
}

const CategorySlider: React.FC<CategorySliderProps> = ({ categories }) => {
  return (
    <div className="grid grid-cols-3 md:flex md:space-x-4 md:overflow-x-auto md:pb-2 gap-4 md:gap-0">
      {categories.map((category) => (
        <Link
          key={category.id}
          to={`/shop?category=${category.name}`}
          className="flex flex-col items-center space-y-2 group md:min-w-[100px]"
        >
          <div className="w-20 h-20 md:w-16 md:h-16 rounded-full overflow-hidden border-2 border-gray-200 group-hover:border-primary-500 transition-colors duration-200">
            <img
              src={category.image}
              alt={category.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
            />
          </div>
          <span className="text-xs md:text-sm text-gray-700 text-center font-medium group-hover:text-primary-500 transition-colors duration-200">
            {category.name}
          </span>
        </Link>
      ))}
    </div>
  );
};

export default CategorySlider;

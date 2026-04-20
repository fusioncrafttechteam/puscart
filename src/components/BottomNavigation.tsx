import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Clock, ShoppingCart, User } from 'lucide-react';

interface BottomNavigationProps {
  cartItemCount: number;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ cartItemCount }) => {
  const location = useLocation();

  const navItems = [
    { name: 'Home', icon: Home, path: '/' },
    { name: 'Orders', icon: Clock, path: '/orders' },
    { name: 'Cart', icon: ShoppingCart, path: '/cart' },
    { name: 'Profile', icon: User, path: '/profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-blue-800 to-blue-900 border-t border-slate-700 z-40 md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex flex-col items-center justify-center space-y-1 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.name === 'Cart' && cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-white text-slate-800 text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {cartItemCount > 9 ? '9+' : cartItemCount}
                  </span>
                )}
              </div>
              <span className="text-xs">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;

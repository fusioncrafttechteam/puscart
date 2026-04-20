import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, MapPin, X, BarChart3, Home, ShoppingBag, Tag, Image, ClipboardList, Users } from 'lucide-react';
import { useLocation as useLiveLocation } from '../hooks/useLocation';
import { useAuth } from '../contexts/AuthContext';

interface MobileNavbarProps {
  isAuthenticated: boolean;
  cartItemCount: number;
  isAdmin?: boolean;
}

const MobileNavbar: React.FC<MobileNavbarProps> = ({ isAuthenticated, isAdmin = false }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const locationData = useLiveLocation();
  const currentRoute = useLocation();
  const liveLocation = locationData.latitude && locationData.longitude ? {
    latitude: locationData.latitude,
    longitude: locationData.longitude,
    city: locationData.locationName || 'Current Location'
  } : null;
  const { signOut } = useAuth();
  const loading = locationData.loading;
  const error =
  locationData.locationName === "Enable location";
  const getCurrentLocation = () => {
  locationData.refreshLocation();
};
  const navigate = useNavigate();

  // Check if current route is admin route
  const isAdminRoute = currentRoute.pathname.startsWith('/admin');

  const adminNavigation = [
    { name: 'Admin', path: '/admin', icon: BarChart3 },
  ];

  const adminMenuItems = [
    { name: 'Dashboard', path: '/admin', icon: Home },
    { name: 'Products', path: '/admin/products', icon: ShoppingBag },
    { name: 'Categories', path: '/admin/categories', icon: Tag },
    { name: 'Offer Banners', path: '/admin/banners', icon: Image },
    { name: 'Orders', path: '/admin/orders', icon: ClipboardList },
    { name: 'Users', path: '/admin/users', icon: Users },
    ...(isAuthenticated ? [{ name: 'Logout', path: '/logout' }] : []),
  ];

  const regularMenuItems = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    
    { name: 'Profile', path: '/profile' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
    ...(isAdmin ? adminNavigation : []),
    ...(isAuthenticated ? [{ name: 'Logout', path: '/logout' }] : []),
  ] as const;

  const menuItems = isAdminRoute ? adminMenuItems : regularMenuItems;

  const handleMenuClick = async (path: string) => {
    if (path === '/logout') {
      try {
        await signOut();
        navigate('/');
      } catch (error) {
        console.error('Logout failed:', error);
        // Still navigate even if logout fails
        navigate('/');
      }
    } else {
      navigate(path);
    }
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Top Navbar */}
      <nav className="bg-linear-to-r from-blue-800 to-blue-900 border-b border-blue-700 relative z-50">
        <div className="flex items-center justify-between h-14 px-4 sm:px-6 lg:px-8">
          {/* Logo - Left */}
          <Link to="/" className="flex items-center">
            <img 
              src="/src/assets/Puscart logo.jpeg" 
              alt="Puscart Logo" 
              className="w-8 h-8 object-contain"
            />
          </Link>

          {/* Delivery Location - Center */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <button 
              onClick={getCurrentLocation}
              className="flex items-center space-x-1 text-sm text-white hover:text-blue-100 transition-colors"
              title="Click to refresh location"
              disabled={loading}
            >
              <MapPin className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} />
              <span className="truncate max-w-[120px]">
                {loading ? (
  <span className="animate-pulse">Detecting...</span>
) : error ? (
  <span className="text-red-300">Enable location</span>
) : liveLocation?.city ? (
  liveLocation.city
) : (
  "Tap to detect"
)}
              </span>
            </button>
          </div>

          {/* Hamburger Menu - Right */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors"
          >
            {isMenuOpen ? (
              <X className="w-5 h-5 text-white" />
            ) : (
              <Menu className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setIsMenuOpen(false)}>
          <div
            className="fixed right-0 top-0 h-full w-64 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {isAdminRoute ? 'Admin Menu' : 'Menu'}
                </h2>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-700" />
                </button>
              </div>
            </div>
            
            <div className="py-2">
              {menuItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleMenuClick(item.path)}
                  className={`block w-full text-left px-4 py-3 transition-colors ${
                    isAdminRoute 
                      ? 'text-blue-700 hover:bg-blue-50 font-medium' 
                      : item.name === 'Admin' 
                        ? 'text-purple-700 hover:bg-purple-50 font-medium' 
                        : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {'icon' in item && item.icon ? <item.icon className="w-4 h-4" /> : null}
                    <span>{item.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileNavbar;

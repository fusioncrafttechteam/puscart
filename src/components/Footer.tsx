import React from "react";
import { Link } from "react-router-dom";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Shield,
  Truck,
} from "lucide-react";

import logo from '../assets/Puscart logo.jpeg'

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: "Shop",
      links: [
        { name: "All Products", href: "/shop" },
        { name: "Categories", href: "/categories" },
        { name: "Deals", href: "/deals" },
        { name: "New Arrivals", href: "/new" },
      ],
    },
    {
      title: "Customer Service",
      links: [
        { name: "Contact Us", href: "/contact" },
        { name: "About Us", href: "/about" },
        { name: "FAQ", href: "/faq" },
        { name: "Shipping Info", href: "/shipping" },
      ],
    },
  ];

  return (
    <footer className="bg-blue-950 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Top Grid Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">

          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-6">
              <img 
                src={logo} 
                alt="Puscart Logo" 
                className="w-10 h-10 object-contain rounded-lg"
              />

              <div>
                <h3 className="text-xl font-bold">Puscart</h3>
                <p className="text-gray-400 text-sm">
                  Delivery Service
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start space-x-2 text-gray-300">
                <MapPin className="w-4 h-4 mt-1" />
                <span className="text-sm">
                  No.391, Thindivanam Main Road <br />
                  Opp to India One ATM, Somasipadi Post <br />
                  Kilpennathur Taluk, Thiruvannamalai <br />
                  Tamil Nadu – 606611
                </span>
              </div>

              <div className="flex items-center space-x-2 text-gray-300">
                <Phone className="w-4 h-4" />
                <span className="text-sm">+91 9894122804</span>
              </div>

              <div className="flex items-center space-x-2 text-gray-300">
                <Mail className="w-4 h-4" />
                <span className="text-sm">
                  puscartdeliveryservice@gmail.com
                </span>
              </div>
            </div>
          </div>

          {/* Dynamic Footer Sections */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="text-lg font-semibold mb-4">
                {section.title}
              </h4>

              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-gray-300 hover:text-white transition-colors duration-200 text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">

            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center space-x-2 text-gray-400">
                <Clock className="w-4 h-4" />
                <span className="text-sm">24/7 Delivery</span>
              </div>

              <div className="flex items-center space-x-2 text-gray-400">
                <Truck className="w-4 h-4" />
                <span className="text-sm">
                  Free Shipping on ₹100
                </span>
              </div>

              <div className="flex items-center space-x-2 text-gray-400">
                <Shield className="w-4 h-4" />
                <span className="text-sm">
                  Secure Payment
                </span>
              </div>
            </div>

            <div>
              <span className="text-gray-400 text-sm">
                © {currentYear} Puscart. All rights reserved.
              </span>
            </div>

          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
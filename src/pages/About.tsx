import React from 'react';
import Footer from '../components/Footer';

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">About Puscart</h1>
        
        <div className="bg-white rounded-2xl shadow-soft p-6 md:p-8">
          <div className="prose max-w-none">
            <p className="text-lg text-gray-600 mb-6">
              Puscart is your trusted online grocery delivery service, bringing fresh and quality products right to your doorstep. We are committed to making grocery shopping convenient, affordable, and enjoyable for everyone.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-gray-600 mb-6">
              To provide fresh, high-quality groceries with fast and reliable delivery, while supporting local farmers and suppliers. We believe everyone deserves access to fresh food without the hassle of traditional grocery shopping.
            </p>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-4">What We Offer</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2 mb-6">
              <li>Fresh fruits and vegetables</li>
              <li>Quality meat and poultry</li>
              <li>Daily essentials and groceries</li>
              <li>Household cleaning products</li>
              <li>30-minute delivery promise</li>
              <li>100% quality guarantee</li>
            </ul>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Why Choose Us?</h2>
            <p className="text-gray-600">
              With our user-friendly mobile app and website, you can shop for groceries from the comfort of your home. Our dedicated team ensures that every product is carefully selected and delivered to you in perfect condition.
            </p>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default About;

/**
 * Shipping Policy Page
 */

import React from 'react'
import { Truck } from 'lucide-react'

const ShippingPolicy: React.FC = () => {
  const currentYear = new Date().getFullYear()

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center gap-3 mb-6">
            <Truck className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Shipping Policy</h1>
          </div>

          <p className="text-gray-600 mb-8">
            Last updated: January {currentYear}
          </p>

          <div className="prose prose-blue max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Delivery Area</h2>
              <p className="text-gray-700">
                Puscart currently delivers to the following areas in Thiruvannamalai district, Tamil Nadu:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Kilpennathur Taluk</li>
                <li>Thiruvannamalai Town</li>
                <li>Somasipadi</li>
                <li>Surrounding areas within 15km radius</li>
              </ul>
              <p className="text-gray-700 mt-3">
                We are continuously expanding our delivery network. Check your address during checkout to confirm availability.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Delivery Time</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li><strong>Standard Delivery:</strong> 30-60 minutes from order confirmation</li>
                <li><strong>Scheduled Delivery:</strong> Choose a convenient time slot (up to 24 hours in advance)</li>
                <li><strong>Peak Hours:</strong> Delivery times may be longer during peak hours (12 PM - 2 PM, 6 PM - 8 PM)</li>
                <li><strong>Weather Conditions:</strong> Severe weather may cause delays</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Delivery Charges</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li><strong>Free Delivery:</strong> Orders above ₹100</li>
                <li><strong>Standard Delivery Fee:</strong> ₹30 for orders below ₹100</li>
                <li><strong>Express Delivery:</strong> Additional ₹20 (where available)</li>
                <li><strong>Scheduled Delivery:</strong> No additional charge</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Delivery Process</h2>
              <ol className="list-decimal list-inside space-y-3 text-gray-700">
                <li>Place your order through the app or website</li>
                <li>Receive order confirmation with estimated delivery time</li>
                <li>Our team prepares your order</li>
                <li>Delivery partner picks up your order</li>
                <li>You receive real-time tracking updates</li>
                <li>Order is delivered to your doorstep</li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Receiving Your Delivery</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Someone must be available to receive the delivery</li>
                <li>Please check all items before the delivery person leaves</li>
                <li>Report any missing or damaged items immediately</li>
                <li>If you're not available, the delivery person will attempt to contact you</li>
                <li>After 2 failed attempts, the order may be cancelled</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Contactless Delivery</h2>
              <p className="text-gray-700">
                We offer contactless delivery for your safety. You can request this option during checkout. The delivery person will leave your order at your doorstep and notify you.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Special Instructions</h2>
              <p className="text-gray-700">
                You can provide special delivery instructions during checkout, such as:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Leave at the door</li>
                <li>Call upon arrival</li>
                <li>Landmark details</li>
                <li>Building/gate code</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Order Tracking</h2>
              <p className="text-gray-700">
                Track your order in real-time through the app or website. You'll receive updates at each stage of the delivery process.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Delayed Deliveries</h2>
              <p className="text-gray-700">
                If your delivery is significantly delayed, please contact us. We will provide updates and, in some cases, offer compensation for the inconvenience.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Failed Deliveries</h2>
              <p className="text-gray-700">
                If we cannot complete the delivery due to incorrect address, unavailability, or other reasons, we may cancel the order and process a refund (subject to our refund policy).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Packaging</h2>
              <p className="text-gray-700">
                All items are carefully packaged to ensure freshness and prevent damage during transit. We use eco-friendly packaging materials where possible.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Contact Us</h2>
              <p className="text-gray-700">
                For shipping-related queries, please contact us at:
              </p>
              <div className="mt-3 p-4 bg-gray-50 rounded-md">
                <p className="text-gray-700"><strong>Email:</strong> puscartdeliveryservice@gmail.com</p>
                <p className="text-gray-700"><strong>Phone:</strong> +91 9894122804</p>
                <p className="text-gray-700"><strong>Address:</strong> No.391, Thindivanam Main Road, Opp to India One ATM, Somasipadi Post, Kilpennathur Taluk, Thiruvannamalai, Tamil Nadu – 606611</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ShippingPolicy

/**
 * Refund Policy Page
 */

import React from 'react'
import { RefreshCw } from 'lucide-react'

const RefundPolicy: React.FC = () => {
  const currentYear = new Date().getFullYear()

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center gap-3 mb-6">
            <RefreshCw className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Refund Policy</h1>
          </div>

          <p className="text-gray-600 mb-8">
            Last updated: January {currentYear}
          </p>

          <div className="prose prose-blue max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Overview</h2>
              <p className="text-gray-700">
                At Puscart, we strive to ensure your satisfaction with every order. This Refund Policy outlines the circumstances under which refunds are issued and the process for requesting them.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Eligibility for Refunds</h2>
              <p className="text-gray-700">Refunds may be issued in the following situations:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li><strong>Wrong Items Delivered:</strong> If you receive items different from what you ordered</li>
                <li><strong>Damaged or Spoiled Products:</strong> If products arrive damaged or spoiled</li>
                <li><strong>Missing Items:</strong> If items from your order are missing</li>
                <li><strong>Quality Issues:</strong> If products do not meet quality standards</li>
                <li><strong>Order Cancellation:</strong> If you cancel before dispatch (subject to timing)</li>
                <li><strong>Delivery Failures:</strong> If we are unable to complete the delivery</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Non-Refundable Items</h2>
              <p className="text-gray-700">The following are generally not eligible for refunds:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Perishable items that have been consumed or partially used</li>
                <li>Items returned after 24 hours of delivery</li>
                <li>Items without proper packaging or receipt</li>
                <li>Personal preference items (e.g., taste, color preferences)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Refund Request Process</h2>
              <ol className="list-decimal list-inside space-y-3 text-gray-700">
                <li>Contact us within 24 hours of delivery via email at puscartdeliveryservice@gmail.com or call +91 9894122804</li>
                <li>Provide your order number and details of the issue</li>
                <li>Provide photos of damaged or incorrect items (if applicable)</li>
                <li>Our team will review your request within 24-48 hours</li>
                <li>Upon approval, refund will be processed within 5-7 business days</li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Refund Methods</h2>
              <p className="text-gray-700">
                Refunds will be processed to the original payment method used for the order. The time taken for the refund to reflect in your account depends on your bank or payment provider.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Partial Refunds</h2>
              <p className="text-gray-700">
                If only part of your order is eligible for a refund, we will issue a partial refund for the affected items only.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Order Cancellation</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li><strong>Before Dispatch:</strong> Full refund with no cancellation fee</li>
                <li><strong>After Dispatch but Before Delivery:</strong> 90% refund (10% handling fee)</li>
                <li><strong>After Delivery:</strong> Follow the standard refund process</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Replacement Instead of Refund</h2>
              <p className="text-gray-700">
                In many cases, we may offer a replacement for the affected items instead of a refund. This is typically faster and more convenient for you.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Refund for Payment Failures</h2>
              <p className="text-gray-700">
                If your payment fails but the amount is deducted from your account, the refund will be automatically processed by your payment provider within 5-7 business days. Contact us if the refund is not received after this period.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Dispute Resolution</h2>
              <p className="text-gray-700">
                If your refund request is denied and you believe this is incorrect, you can escalate the matter by contacting our customer support team or writing to our management.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Contact Us</h2>
              <p className="text-gray-700">
                For refund-related queries, please contact us at:
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

export default RefundPolicy

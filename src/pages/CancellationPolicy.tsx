/**
 * Cancellation Policy Page
 */

import React from 'react'
import { XCircle } from 'lucide-react'

const CancellationPolicy: React.FC = () => {
  const currentYear = new Date().getFullYear()

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center gap-3 mb-6">
            <XCircle className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Cancellation Policy</h1>
          </div>

          <p className="text-gray-600 mb-8">
            Last updated: January {currentYear}
          </p>

          <div className="prose prose-blue max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Overview</h2>
              <p className="text-gray-700">
                We understand that plans change. This Cancellation Policy explains how you can cancel your order and what to expect in terms of refunds.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Cancellation Timeframes</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li><strong>Within 5 minutes of ordering:</strong> Full refund, no questions asked</li>
                <li><strong>5-15 minutes after ordering:</strong> Full refund (if order not yet processed)</li>
                <li><strong>15-30 minutes after ordering:</strong> 90% refund (10% cancellation fee)</li>
                <li><strong>After 30 minutes or when dispatched:</strong> Cannot cancel, follow refund process instead</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">How to Cancel</h2>
              <ol className="list-decimal list-inside space-y-3 text-gray-700">
                <li>Go to your Orders section in the app or website</li>
                <li>Find the order you wish to cancel</li>
                <li>Click on "Cancel Order" button</li>
                <li>Select a reason for cancellation</li>
                <li>Confirm cancellation</li>
                <li>You will receive a confirmation message</li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Cancellation via Phone/Email</h2>
              <p className="text-gray-700">
                If you're unable to cancel through the app, you can contact us:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li><strong>Phone:</strong> +91 9894122804</li>
                <li><strong>Email:</strong> puscartdeliveryservice@gmail.com</li>
              </ul>
              <p className="text-gray-700 mt-3">
                Please provide your order number and contact details. Response time: 5-10 minutes during business hours.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Refund Processing</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Refunds are processed to the original payment method</li>
                <li>Processing time: 5-7 business days</li>
                <li>You will receive a refund confirmation email</li>
                <li>The exact timing depends on your bank/payment provider</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Partial Cancellation</h2>
              <p className="text-gray-700">
                You can cancel specific items from your order if the order hasn't been processed yet. The refund will be for the cancelled items only.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Scheduled Orders</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Scheduled orders can be cancelled up to 1 hour before the scheduled delivery time</li>
                <li>Cancellations within 1 hour of scheduled time may incur a 10% fee</li>
                <li>Full refund if cancelled well in advance</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">When Cancellation is Not Possible</h2>
              <p className="text-gray-700">You cannot cancel if:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>The order has been dispatched</li>
                <li>The delivery person is already at your location</li>
                <li>The order has been delivered</li>
                <li>More than 30 minutes have passed since ordering</li>
              </ul>
              <p className="text-gray-700 mt-3">
                In these cases, please refer to our Refund Policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Cancellation by Puscart</h2>
              <p className="text-gray-700">
                We reserve the right to cancel orders in the following situations:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Product is out of stock</li>
                <li>Delivery address is outside our service area</li>
                <li>Payment verification fails</li>
                <li>Severe weather or other unforeseen circumstances</li>
                <li>Suspicious or fraudulent activity detected</li>
              </ul>
              <p className="text-gray-700 mt-3">
                In such cases, you will receive a full refund.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Cancellation Fees</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>No fee for cancellations within 15 minutes of ordering</li>
                <li>10% fee for cancellations between 15-30 minutes</li>
                <li>No fee for cancellations by Puscart</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Refund Issues</h2>
              <p className="text-gray-700">
                If you haven't received your refund within 7 business days, please contact us with your order number and payment details.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Contact Us</h2>
              <p className="text-gray-700">
                For cancellation-related queries, please contact us at:
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

export default CancellationPolicy

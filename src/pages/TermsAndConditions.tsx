/**
 * Terms & Conditions Page
 */

import React from 'react'
import { FileText } from 'lucide-react'

const TermsAndConditions: React.FC = () => {
  const currentYear = new Date().getFullYear()

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Terms & Conditions</h1>
          </div>

          <p className="text-gray-600 mb-8">
            Last updated: January {currentYear}
          </p>

          <div className="prose prose-blue max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Introduction</h2>
              <p className="text-gray-700">
                Welcome to Puscart. By using our grocery delivery service, you agree to these Terms & Conditions. Please read them carefully.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Acceptance of Terms</h2>
              <p className="text-gray-700">
                By accessing or using Puscart, you agree to be bound by these Terms & Conditions and our Privacy Policy. If you do not agree to these terms, please do not use our service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Account Registration</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>You must be at least 18 years old to create an account</li>
                <li>You must provide accurate and complete information</li>
                <li>You are responsible for maintaining the security of your account</li>
                <li>You must notify us immediately of any unauthorized use</li>
                <li>You are responsible for all activities under your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Products and Services</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>We strive to display accurate product information and images</li>
                <li>Prices are subject to change without prior notice</li>
                <li>We reserve the right to limit quantities</li>
                <li>Product availability may vary by location</li>
                <li>Substitutions may be made for unavailable items</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Orders and Payments</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>All orders are subject to acceptance and availability</li>
                <li>Payment must be made at the time of ordering</li>
                <li>We accept payments through Razorpay and other supported methods</li>
                <li>Order confirmation will be sent via email</li>
                <li>We reserve the right to cancel orders for any reason</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Delivery</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Delivery times are estimates and not guaranteed</li>
                <li>We are not responsible for delays due to weather, traffic, or other factors</li>
                <li>Someone must be available to receive the delivery</li>
                <li>Failed delivery attempts may incur additional charges</li>
                <li>Free delivery applies to orders above ₹100</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Returns and Refunds</h2>
              <p className="text-gray-700">
                Please refer to our Refund Policy for detailed information about returns and refunds.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">User Conduct</h2>
              <p className="text-gray-700">You agree not to:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Use the service for any illegal purpose</li>
                <li>Interfere with or disrupt the service</li>
                <li>Attempt to gain unauthorized access</li>
                <li>Use automated tools to scrape the platform</li>
                <li>Provide false or misleading information</li>
                <li>Harass or abuse other users or our staff</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Intellectual Property</h2>
              <p className="text-gray-700">
                All content on Puscart, including text, images, logos, and software, is our property or the property of our licensors and is protected by copyright laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Limitation of Liability</h2>
              <p className="text-gray-700">
                Puscart shall not be liable for any indirect, incidental, special, or consequential damages arising from the use of our service. Our liability is limited to the amount paid for the specific order in question.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Indemnification</h2>
              <p className="text-gray-700">
                You agree to indemnify and hold Puscart harmless from any claims arising from your use of the service or violation of these terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Termination</h2>
              <p className="text-gray-700">
                We reserve the right to terminate or suspend your account at any time for violation of these terms or for any other reason at our sole discretion.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Governing Law</h2>
              <p className="text-gray-700">
                These terms shall be governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Thiruvannamalai, Tamil Nadu.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Changes to Terms</h2>
              <p className="text-gray-700">
                We may modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Contact Us</h2>
              <p className="text-gray-700">
                For questions about these Terms & Conditions, please contact us at:
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

export default TermsAndConditions

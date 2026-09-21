/**
 * Privacy Policy Page
 */

import React from 'react'
import { Shield } from 'lucide-react'

const PrivacyPolicy: React.FC = () => {
  const currentYear = new Date().getFullYear()

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
          </div>

          <p className="text-gray-600 mb-8">
            Last updated: January {currentYear}
          </p>

          <div className="prose prose-blue max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Introduction</h2>
              <p className="text-gray-700">
                Puscart ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our grocery delivery service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Information We Collect</h2>
              <div className="space-y-3 text-gray-700">
                <p><strong>Personal Information:</strong> Name, email address, phone number, delivery address, and payment information.</p>
                <p><strong>Account Information:</strong> User ID, password (encrypted), and profile preferences.</p>
                <p><strong>Order Information:</strong> Products ordered, order history, and delivery preferences.</p>
                <p><strong>Technical Information:</strong> IP address, device information, browser type, and usage data.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">How We Use Your Information</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Process and deliver your orders</li>
                <li>Provide customer support</li>
                <li>Send order confirmations and updates</li>
                <li>Improve our services and user experience</li>
                <li>Communicate promotional offers (with your consent)</li>
                <li>Prevent fraud and ensure security</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Information Sharing</h2>
              <p className="text-gray-700">
                We do not sell your personal information. We may share your information only with:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Delivery partners for order fulfillment</li>
                <li>Payment processors for transaction processing</li>
                <li>Service providers who assist in operating our platform</li>
                <li>Legal authorities when required by law</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Data Security</h2>
              <p className="text-gray-700">
                We implement industry-standard security measures to protect your information, including encryption, secure servers, and regular security audits. However, no method of transmission over the internet is completely secure.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Your Rights</h2>
              <p className="text-gray-700">You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Delete your account and personal data</li>
                <li>Opt-out of marketing communications</li>
                <li>Object to processing of your data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Cookies</h2>
              <p className="text-gray-700">
                We use cookies and similar technologies to improve your experience, analyze usage, and personalize content. You can manage cookie preferences through your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Third-Party Services</h2>
              <p className="text-gray-700">
                Our platform integrates with third-party services including Supabase (database), Razorpay (payments), and EmailJS (email communications). These services have their own privacy policies.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Children's Privacy</h2>
              <p className="text-gray-700">
                Our service is not intended for children under 16. We do not knowingly collect personal information from children.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Changes to This Policy</h2>
              <p className="text-gray-700">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Contact Us</h2>
              <p className="text-gray-700">
                If you have questions about this Privacy Policy, please contact us at:
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

export default PrivacyPolicy

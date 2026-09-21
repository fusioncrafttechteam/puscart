/**
 * 404 Not Found Page
 * Displayed when a user tries to access a non-existent route
 */

import React from 'react'
import { Link } from 'react-router-dom'
import { Home, Search } from 'lucide-react'

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="mb-6">
          <h1 className="text-8xl font-bold text-blue-600">404</h1>
        </div>

        <div className="flex items-center justify-center w-16 h-16 mx-auto bg-blue-100 rounded-full mb-6">
          <Search className="w-8 h-8 text-blue-600" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Page Not Found
        </h2>

        <p className="text-gray-600 mb-6">
          The page you're looking for doesn't exist or has been moved.
          Please check the URL or navigate to a different page.
        </p>

        <div className="space-y-3">
          <Link
            to="/"
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200"
          >
            <Home className="w-4 h-4" />
            Go to Homepage
          </Link>

          <Link
            to="/shop"
            className="w-full flex items-center justify-center gap-2 bg-gray-200 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-300 transition-colors duration-200"
          >
            Browse Products
          </Link>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Need help? Contact us at{' '}
            <a href="mailto:puscartdeliveryservice@gmail.com" className="text-blue-600 hover:underline">
              puscartdeliveryservice@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage

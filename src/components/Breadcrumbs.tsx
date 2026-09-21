/**
 * Breadcrumbs Component
 * Displays breadcrumb navigation with schema markup
 */

import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { generateBreadcrumbSchema } from '../utils/seo'

interface BreadcrumbItem {
  name: string
  path: string
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[]
  customSchema?: Record<string, any>
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, customSchema }) => {
  const location = useLocation()

  // Generate breadcrumbs from current path if not provided
  const defaultItems: BreadcrumbItem[] = React.useMemo(() => {
    if (items) return items

    const pathSegments = location.pathname.split('/').filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = [
      { name: 'Home', path: '/' }
    ]

    let currentPath = ''
    pathSegments.forEach((segment) => {
      currentPath += `/${segment}`
      const name = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      
      breadcrumbs.push({ name, path: currentPath })
    })

    return breadcrumbs
  }, [location.pathname, items])

  // Generate schema
  const schema = customSchema || generateBreadcrumbSchema(
    defaultItems.map(item => ({
      name: item.name,
      url: `https://puscart.com${item.path}`
    }))
  )

  return (
    <>
      {/* Schema Markup */}
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>

      {/* Breadcrumb Navigation */}
      <nav className="bg-gray-50 border-b border-gray-200" aria-label="Breadcrumb">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ol className="flex items-center space-x-2 py-3 text-sm">
            {defaultItems.map((item, index) => (
              <li key={item.path} className="flex items-center">
                {index === 0 ? (
                  <Link
                    to={item.path}
                    className="flex items-center text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    <Home className="w-4 h-4" />
                  </Link>
                ) : (
                  <>
                    <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />
                    {index === defaultItems.length - 1 ? (
                      <span className="text-gray-900 font-medium" aria-current="page">
                        {item.name}
                      </span>
                    ) : (
                      <Link
                        to={item.path}
                        className="text-gray-500 hover:text-blue-600 transition-colors"
                      >
                        {item.name}
                      </Link>
                    )}
                  </>
                )}
              </li>
            ))}
          </ol>
        </div>
      </nav>
    </>
  )
}

export default Breadcrumbs

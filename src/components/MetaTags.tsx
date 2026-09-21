/**
 * MetaTags Component
 * Dynamic meta tags for SEO and social sharing
 */

import React from 'react'
import { Helmet } from 'react-helmet-async'

interface MetaTagsProps {
  title?: string
  description?: string
  keywords?: string
  ogImage?: string
  ogType?: string
  canonical?: string
  noIndex?: boolean
  structuredData?: Record<string, any>
}

const MetaTags: React.FC<MetaTagsProps> = ({
  title = 'Puscart - Online Grocery Delivery Service',
  description = 'Order fresh groceries online with Puscart. Fast delivery, quality products, and great prices. Get fruits, vegetables, dairy, and more delivered to your doorstep in 30 minutes.',
  keywords = 'online grocery, grocery delivery, fresh vegetables, fruits, dairy products, food delivery, Puscart, Tamil Nadu grocery',
  ogImage = '/Puscart logo.jpeg',
  ogType = 'website',
  canonical,
  noIndex = false,
  structuredData
}) => {
  const siteName = 'Puscart'
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`
  const siteUrl = 'https://puscart.com'
  const fullCanonical = canonical || `${siteUrl}${window.location.pathname}`

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="Puscart Delivery Service" />
      
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Canonical URL */}
      <link rel="canonical" href={fullCanonical} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`${siteUrl}${ogImage}`} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="en_IN" />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={fullCanonical} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={`${siteUrl}${ogImage}`} />
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  )
}

export default MetaTags

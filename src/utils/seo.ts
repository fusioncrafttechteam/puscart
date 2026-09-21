/**
 * SEO Utilities
 * Helper functions for generating SEO-related data
 */

export interface ProductSchema {
  name: string
  description: string
  image: string
  price: number
  currency: string
  availability: string
  category: string
  brand: string
  sku: string
}

export interface BreadcrumbItem {
  name: string
  url: string
}

/**
 * Generate Product Schema for structured data
 */
export const generateProductSchema = (product: ProductSchema) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    brand: {
      '@type': 'Brand',
      name: product.brand
    },
    sku: product.sku,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: product.currency,
      availability: product.availability,
      url: window.location.href,
      seller: {
        '@type': 'Organization',
        name: 'Puscart'
      }
    },
    category: product.category
  }
}

/**
 * Generate Breadcrumb Schema for structured data
 */
export const generateBreadcrumbSchema = (items: BreadcrumbItem[]) => {
  const itemListElement = items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url
  }))

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement
  }
}

/**
 * Generate Organization Schema
 */
export const generateOrganizationSchema = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Puscart',
    url: 'https://puscart.com',
    logo: 'https://puscart.com/Puscart logo.jpeg',
    description: 'Online grocery delivery service providing fresh groceries to your doorstep',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'No.391, Thindivanam Main Road, Opp to India One ATM, Somasipadi Post',
      addressLocality: 'Kilpennathur Taluk',
      addressRegion: 'Thiruvannamalai',
      postalCode: '606611',
      addressCountry: 'IN'
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91 9894122804',
      contactType: 'customer service',
      email: 'puscartdeliveryservice@gmail.com'
    },
    sameAs: []
  }
}

/**
 * Generate Local Business Schema
 */
export const generateLocalBusinessSchema = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Puscart',
    image: 'https://puscart.com/Puscart logo.jpeg',
    telephone: '+91 9894122804',
    email: 'puscartdeliveryservice@gmail.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'No.391, Thindivanam Main Road, Opp to India One ATM, Somasipadi Post',
      addressLocality: 'Kilpennathur Taluk',
      addressRegion: 'Thiruvannamalai',
      postalCode: '606611',
      addressCountry: 'IN'
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday'
      ],
      opens: '08:00',
      closes: '22:00'
    },
    priceRange: '₹₹'
  }
}

/**
 * Generate WebSite Schema
 */
export const generateWebSiteSchema = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Puscart',
    url: 'https://puscart.com',
    description: 'Online grocery delivery service',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://puscart.com/shop?q={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  }
}

/**
 * Generate FAQ Schema
 */
export const generateFAQSchema = (faqs: Array<{ question: string; answer: string }>) => {
  const mainEntity = faqs.map(faq => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer
    }
  }))

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity
  }
}

/**
 * Generate URL slug from text
 */
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim()
}

/**
 * Format price for display
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(price)
}

/**
 * Generate meta description from content
 */
export const generateMetaDescription = (content: string, maxLength: number = 160): string => {
  const cleaned = content.replace(/\s+/g, ' ').trim()
  if (cleaned.length <= maxLength) {
    return cleaned
  }
  return cleaned.substring(0, maxLength - 3) + '...'
}

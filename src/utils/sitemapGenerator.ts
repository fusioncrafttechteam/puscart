/**
 * Sitemap Generator
 * Generates XML sitemap for SEO
 */

export interface SitemapUrl {
  loc: string
  lastmod?: string
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
}

export class SitemapGenerator {
  private baseUrl: string = 'https://puscart.com'
  private urls: SitemapUrl[] = []

  constructor(baseUrl?: string) {
    if (baseUrl) {
      this.baseUrl = baseUrl
    }
  }

  /**
   * Add URL to sitemap
   */
  addUrl(url: SitemapUrl): void {
    this.urls.push(url)
  }

  /**
   * Add multiple URLs to sitemap
   */
  addUrls(urls: SitemapUrl[]): void {
    this.urls.push(...urls)
  }

  /**
   * Generate static pages
   */
  addStaticPages(): void {
    const staticPages: SitemapUrl[] = [
      { loc: '/', changefreq: 'daily', priority: 1.0 },
      { loc: '/shop', changefreq: 'daily', priority: 0.9 },
      { loc: '/about', changefreq: 'monthly', priority: 0.5 },
      { loc: '/contact', changefreq: 'monthly', priority: 0.5 },
      { loc: '/privacy-policy', changefreq: 'monthly', priority: 0.3 },
      { loc: '/terms-and-conditions', changefreq: 'monthly', priority: 0.3 },
      { loc: '/refund-policy', changefreq: 'monthly', priority: 0.3 },
      { loc: '/shipping-policy', changefreq: 'monthly', priority: 0.3 },
      { loc: '/cancellation-policy', changefreq: 'monthly', priority: 0.3 }
    ]
    this.addUrls(staticPages)
  }

  /**
   * Add product pages
   */
  addProductPages(products: Array<{ id: string; updated_at: string }>): void {
    const productUrls: SitemapUrl[] = products.map(product => ({
      loc: `/product/${product.id}`,
      lastmod: product.updated_at,
      changefreq: 'weekly',
      priority: 0.8
    }))
    this.addUrls(productUrls)
  }

  /**
   * Add category pages
   */
  addCategoryPages(categories: Array<{ id: string; updated_at: string }>): void {
    const categoryUrls: SitemapUrl[] = categories.map(category => ({
      loc: `/category/${category.id}`,
      lastmod: category.updated_at,
      changefreq: 'weekly',
      priority: 0.7
    }))
    this.addUrls(categoryUrls)
  }

  /**
   * Generate XML sitemap
   */
  generate(): string {
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>'
    const urlsetStart = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    const urlsetEnd = '</urlset>'

    const urlElements = this.urls.map(url => {
      const loc = `<loc>${this.baseUrl}${url.loc}</loc>`
      const lastmod = url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''
      const changefreq = url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''
      const priority = url.priority !== undefined ? `<priority>${url.priority}</priority>` : ''

      return `    <url>\n      ${loc}\n      ${lastmod}\n      ${changefreq}\n      ${priority}\n    </url>`
    }).join('\n')

    return `${xmlHeader}\n${urlsetStart}\n${urlElements}\n${urlsetEnd}`
  }

  /**
   * Clear all URLs
   */
  clear(): void {
    this.urls = []
  }

  /**
   * Get current URLs count
   */
  getCount(): number {
    return this.urls.length
  }
}

/**
 * Generate sitemap for robots.txt
 */
export const generateRobotsTxt = (sitemapUrl: string): string => {
  return `User-agent: *
Allow: /

Sitemap: ${sitemapUrl}`
}

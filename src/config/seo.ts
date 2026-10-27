// SEO Configuration - Update these values when you decide on your company name and domain
export const SEO_CONFIG = {
  // Company Information
  companyName: 'ServeKaro',
  productName: 'Digital Menu Platform',
  
  // Domain and URLs
  baseUrl: 'https://your-domain.com',
  
  // Social Media
  twitterHandle: '@yourcompany',
  
  // Default SEO Values
  defaultTitle: 'Digital Menu Platform for Restaurants | QR Code Ordering System',
  defaultDescription: 'Transform your restaurant with our digital menu platform. Reduce wait times by 70%, boost revenue by 35%, and provide contactless QR code ordering.',
  defaultKeywords: 'digital menu, QR code ordering, restaurant technology, contactless dining, interactive menu, restaurant POS, mobile ordering, restaurant management, food service technology, restaurant software',
  
  // Images
  defaultImage: '/og-image.jpg',
  
  // Contact Information
  contactEmail: 'hello@your-domain.com',
  
  // Business Information
  businessType: 'SoftwareApplication',
  applicationCategory: 'BusinessApplication',
  
  // Pricing (update when you finalize pricing)
  pricing: {
    starter: {
      price: '29',
      currency: 'USD'
    },
    professional: {
      price: '79', 
      currency: 'USD'
    },
    enterprise: {
      price: '199',
      currency: 'USD'
    }
  },
  
  // Ratings (update with real data)
  ratings: {
    value: '4.8',
    count: '1250'
  }
};

// Helper function to generate full title
export const getFullTitle = (pageTitle?: string): string => {
  if (!pageTitle) return `${SEO_CONFIG.companyName} - ${SEO_CONFIG.defaultTitle}`;
  if (pageTitle.includes(SEO_CONFIG.companyName)) return pageTitle;
  return `${pageTitle} | ${SEO_CONFIG.companyName}`;
};

// Helper function to generate full URL
export const getFullUrl = (path: string = ''): string => {
  return `${SEO_CONFIG.baseUrl}${path}`;
};

/**
 * 🔗 EXTERNAL LINKS CONFIGURATION
 *
 * This is the central place to configure all external links in your ImageHost app.
 *
 * 🚀 QUICK START:
 * 1. Replace 'your-username' with your actual GitHub username
 * 2. Replace 'imagehost' with your repository name
 * 3. Update social media handles as needed
 *
 * 📍 WHAT THIS AFFECTS:
 * - Footer GitHub icon and "Source Code" link
 * - API documentation references
 * - Social media links (when added)
 *
 * 💡 TIP: After updating, restart your dev server to see changes
 */

export const EXTERNAL_LINKS = {
  // GitHub Repository Links
  github: {
    main: 'https://github.com/thatqne/seruvo',
    organization: 'https://github.com/thatqne',
  },
  
  // Social Media Links
  social: {
    twitter: 'https://twitter.com/your-handle',
    discord: 'https://discord.gg/your-server',
    linkedin: 'https://linkedin.com/in/your-profile',
  },
  
  // Documentation Links
  docs: {
    api: '/api/docs',
    explorer: '/api',
    changelog: '/changelog',
    support: '/support',
  },
  
  // External Services
  services: {
    supabase: 'https://supabase.com',
    nextjs: 'https://nextjs.org',
    vercel: 'https://vercel.com',
  }
} as const

// Helper function to get GitHub link with fallback
export const getGitHubLink = (repo?: string) => {
  if (repo) {
    return `${EXTERNAL_LINKS.github.main}/${repo}`
  }
  return EXTERNAL_LINKS.github.main
}

// Helper function to check if link is external
export const isExternalLink = (url: string) => {
  return url.startsWith('http://') || url.startsWith('https://')
}

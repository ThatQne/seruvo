# ImageHost Configuration Guide

This guide explains how to configure various aspects of your ImageHost deployment.

## 🔗 External Links Configuration

All external links (GitHub, social media, etc.) are centrally managed in `src/config/links.ts`.

### Quick Setup

1. **Open the config file:**
   ```
   src/config/links.ts
   ```

2. **Update the GitHub links:**
   ```typescript
   github: {
     main: 'https://github.com/YOUR-USERNAME/imagehost',
     organization: 'https://github.com/YOUR-ORGANIZATION',
   }
   ```

3. **Add your social media links:**
   ```typescript
   social: {
     twitter: 'https://twitter.com/YOUR-HANDLE',
     discord: 'https://discord.gg/YOUR-SERVER',
     linkedin: 'https://linkedin.com/in/YOUR-PROFILE',
   }
   ```

### What Gets Updated

When you change the config file, these locations automatically update:

- **Footer GitHub icon** - Links to your main repository
- **Footer "Source Code" link** - Links to your main repository  
- **API documentation references** - Uses your configured docs URLs
- **Social media icons** (when added to footer)

### Example Configuration

```typescript
export const EXTERNAL_LINKS = {
  github: {
    main: 'https://github.com/mycompany/imagehost-pro',
    organization: 'https://github.com/mycompany',
  },
  
  social: {
    twitter: 'https://twitter.com/mycompany',
    discord: 'https://discord.gg/myserver',
    linkedin: 'https://linkedin.com/company/mycompany',
  },
  
  // Internal links (usually don't need to change)
  docs: {
    api: '/api/docs',
    explorer: '/api',
    changelog: '/changelog',
    support: '/support',
  }
}
```

## 🎨 Branding Configuration

### App Name & Logo

Update these in multiple places:

1. **Layout metadata** (`src/app/layout.tsx`):
   ```typescript
   export const metadata: Metadata = {
     title: "YourApp - Modern Image Hosting Platform",
     description: "Your custom description here",
   }
   ```

2. **Header component** (`src/components/layout/Header.tsx`):
   ```typescript
   <span className="text-xl font-bold text-gray-900">YourApp</span>
   ```

3. **Footer component** (`src/components/layout/Footer.tsx`):
   ```typescript
   <span className="text-xl font-bold text-gray-900">YourApp</span>
   ```

### Favicon & App Icons

Replace files in the `public/` directory:
- `favicon.ico`
- `apple-touch-icon.png`
- `icon.png`

## 🌐 Domain Configuration

### Supabase Configuration

Update your Supabase settings in:

1. **Environment variables** (`.env.local`):
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. **Next.js config** (`next.config.ts`):
   ```typescript
   images: {
     remotePatterns: [
       {
         protocol: 'https',
         hostname: 'your-project-id.supabase.co',
         pathname: '/storage/v1/object/public/images/**',
       },
     ],
   }
   ```

### API Base URLs

The API documentation automatically uses your current domain, but you can override it in:

- `src/app/api/docs/page.tsx`
- `src/app/api/page.tsx`

Look for:
```typescript
{typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}
```

## 🚀 Deployment Configuration

### Vercel Deployment

1. **Connect your GitHub repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Update domain** in Supabase dashboard under Authentication > URL Configuration

### Custom Domain

1. **Add domain** in Vercel dashboard
2. **Update Supabase** site URL and redirect URLs
3. **Update any hardcoded URLs** in the config files

## 📝 Quick Checklist

Before deploying, make sure you've updated:

- [ ] GitHub links in `src/config/links.ts`
- [ ] App name in header, footer, and metadata
- [ ] Supabase environment variables
- [ ] Next.js image domains
- [ ] Favicon and app icons
- [ ] Social media links (optional)
- [ ] Custom domain configuration (if applicable)

## 🔧 Advanced Configuration

### Adding New External Links

1. **Add to config:**
   ```typescript
   // In src/config/links.ts
   export const EXTERNAL_LINKS = {
     // ... existing config
     custom: {
       documentation: 'https://docs.yourapp.com',
       support: 'https://support.yourapp.com',
     }
   }
   ```

2. **Use in components:**
   ```typescript
   import { EXTERNAL_LINKS } from '@/config/links'
   
   <a href={EXTERNAL_LINKS.custom.documentation}>
     Documentation
   </a>
   ```

### Environment-Specific Configuration

You can create different configs for different environments:

```typescript
const isDevelopment = process.env.NODE_ENV === 'development'

export const EXTERNAL_LINKS = {
  github: {
    main: isDevelopment 
      ? 'https://github.com/dev-repo/imagehost' 
      : 'https://github.com/prod-repo/imagehost',
  }
}
```

---

Need help? Check the GitHub repository or open an issue!

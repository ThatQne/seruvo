# 🚀 GitHub Pages Deployment Guide

Deploy your ImageHost app to GitHub Pages with a single command!

## Quick Deploy

```bash
npm run deploy
```

That's it! The script handles everything automatically.

## What the Script Does

1. **🔒 Protects Private Data**
   - Creates a production environment with demo/public values
   - Never exposes your real Supabase keys or private data
   - Automatically excludes sensitive files

2. **⚙️ Configures for GitHub Pages**
   - Updates Next.js config for static export
   - Sets up proper base paths and asset prefixes
   - Optimizes images for static hosting

3. **🏗️ Builds & Deploys**
   - Builds the app with production settings
   - Creates/updates the `gh-pages` branch
   - Pushes to GitHub Pages automatically

4. **🧹 Cleans Up**
   - Restores original configuration
   - Removes temporary files
   - Leaves your dev environment unchanged

## First-Time Setup

### 1. Update Repository URLs

Edit `scripts/deploy-github-pages.js` and replace:
```javascript
NEXT_PUBLIC_APP_URL=https://YOUR-USERNAME.github.io/YOUR-REPO-NAME
NEXT_PUBLIC_BASE_PATH=/YOUR-REPO-NAME
```

### 2. Configure GitHub Repository

1. Push your code to GitHub
2. Go to repository Settings → Pages
3. Set source to "Deploy from a branch"
4. Select "gh-pages" branch and "/ (root)" folder
5. Save settings

### 3. Set Up Demo Supabase (Optional)

For a fully functional demo:
1. Create a separate Supabase project for public demos
2. Update the demo URLs in the deployment script
3. Set up public test data

## Environment Security

### ✅ What's Safe (Included in Deployment)
- App name and branding
- Public API endpoints
- GitHub repository links
- Demo/public Supabase URLs

### ❌ What's Protected (Never Deployed)
- Real Supabase service role keys
- Private database credentials
- User authentication secrets
- Personal environment variables

## Deployment Commands

```bash
# Deploy to GitHub Pages
npm run deploy

# Alternative command
npm run deploy:github
```

## Troubleshooting

### Build Fails
- Check that all dependencies are installed: `npm install`
- Ensure your code builds locally: `npm run build`
- Check for TypeScript errors: `npm run lint`

### Deployment Fails
- Verify you have push access to the repository
- Check that GitHub Pages is enabled in repository settings
- Ensure the `gh-pages` branch exists and is accessible

### Site Not Loading
- Check GitHub Pages settings in repository
- Verify the base path matches your repository name
- Wait a few minutes for GitHub Pages to update

### Images Not Loading
- Update image domains in `next.config.ts`
- Ensure Supabase storage is publicly accessible
- Check CORS settings in Supabase

## Custom Domain (Optional)

To use a custom domain:

1. **Add CNAME file:**
   ```bash
   echo "yourdomain.com" > public/CNAME
   ```

2. **Update environment:**
   ```bash
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   NEXT_PUBLIC_BASE_PATH=
   ```

3. **Configure DNS:**
   - Point your domain to GitHub Pages
   - Follow GitHub's custom domain guide

## Demo Mode

The deployed version runs in "demo mode" with:
- ✅ Full UI functionality
- ✅ Public album browsing
- ✅ API documentation
- ❌ User authentication (demo only)
- ❌ File uploads (demo only)
- ❌ Private features

Perfect for showcasing your app's design and features!

## Manual Deployment

If you prefer manual control:

```bash
# 1. Build for production
npm run build

# 2. Deploy to gh-pages
npx gh-pages -d out

# 3. Configure GitHub Pages settings
```

---

🎉 **Your ImageHost app is now live on GitHub Pages!**

Share your public URL: `https://YOUR-USERNAME.github.io/YOUR-REPO-NAME`

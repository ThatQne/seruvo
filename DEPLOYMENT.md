# 🚀 Deployment Guide

Deploy your ImageHost app with separate frontend and backend services.

## Architecture

- **Frontend**: Next.js app deployed to Vercel/Netlify
- **Backend**: Express.js API server deployed to Render
- **Database**: Supabase (hosted)

## Backend Deployment (Render)

### 1. Create Render Service

1. Go to [Render](https://render.com) and create an account
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `imagehost-backend`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

### 2. Set Environment Variables

In Render dashboard, add these environment variables:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
PORT=10000
```

### 3. Deploy

Render will automatically deploy your backend when you push to your main branch.

Your backend URL will be: `https://your-service-name.onrender.com`

## Frontend Deployment

### Option 1: Vercel (Recommended)

```bash
npm install -g vercel
vercel --prod
```

### Option 2: Netlify

```bash
npm run build
# Upload the 'out' folder to Netlify
```

### Environment Variables for Frontend

Set these in your deployment platform:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
```
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

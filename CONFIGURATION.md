# ⚙️ Configuration Guide

This guide covers all configuration options for your ImageHost application.

## Architecture Overview

- **Frontend**: Next.js application (deployed to Vercel/Netlify)
- **Backend**: Express.js API server (deployed to Render)
- **Database**: Supabase (hosted service)
- **Storage**: Supabase Storage

## Quick Setup

Run the interactive setup script:
```bash
npm run setup
```

This will prompt you for all required configuration values and create the necessary environment files.

## Manual Configuration

### 1. Frontend Environment (.env.local)

```bash
# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Backend API Configuration (REQUIRED)
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com

# App Configuration (OPTIONAL)
NEXT_PUBLIC_APP_NAME=ImageHost
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
```

### 2. Backend Environment (server/.env)

```bash
# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Server Configuration
PORT=3001
NODE_ENV=development
```

## API Endpoints

The backend server provides these endpoints:

### Public Albums
- `GET /api/albums` - Get all public albums
- `GET /api/albums/{albumId}` - Get specific album
- `GET /api/albums/{albumId}/images` - Get album images

### Images
- `GET /api/images/{imageId}` - Get specific image
- `POST /api/upload` - Upload image (requires auth)

### Utility
- `GET /` - Health check
- `GET /health` - Detailed health status
- `POST /api/check-email` - Check if email exists

## Development vs Production

### Development
- Frontend: `http://localhost:3000`
- Backend: `https://your-backend-url.onrender.com` (same as production)
- Uses Render backend for consistency

### Production
- Frontend: Your deployed frontend URL
- Backend: `https://your-backend-url.onrender.com`
- Uses platform environment variables

## Environment Variable Details

### NEXT_PUBLIC_SUPABASE_URL
Your Supabase project URL from the project settings.

### NEXT_PUBLIC_SUPABASE_ANON_KEY
Public anonymous key for client-side operations.

### SUPABASE_SERVICE_ROLE_KEY
Service role key for server-side operations (keep secret).

### NEXT_PUBLIC_API_URL
URL of your backend API server. Both development and production should use your Render service URL for consistency: `https://your-backend-url.onrender.com`

## Deployment Configuration

### Render (Backend)
Set these environment variables in your Render dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PORT=10000`

### Vercel/Netlify (Frontend)
Set these environment variables in your deployment platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL`

## Troubleshooting

### API Connection Issues
1. Check that `NEXT_PUBLIC_API_URL` is set correctly
2. Verify the backend server is running
3. Check CORS configuration in the backend

### Supabase Connection Issues
1. Verify all Supabase environment variables are set
2. Check that your Supabase project is active
3. Ensure the database schema is properly set up

### Upload Issues
1. Check Supabase Storage bucket configuration
2. Verify service role key permissions
3. Check file size limits in both frontend and backend

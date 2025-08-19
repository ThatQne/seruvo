# Express Backend Deployment

This application can be deployed to Render.com using the following steps:

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure the following settings:
   - Name: imagehost-api (or your preferred name)
   - Environment: Node
   - Region: Choose nearest to your users
   - Branch: main
   - Build Command: `cd server && npm install && npm run build`
   - Start Command: `cd server && npm start`
   - Auto-Deploy: Yes

## Environment Variables

### Render Backend
Add these environment variables in your Render dashboard:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `PORT`: Optional, defaults to 3001

### Next.js Frontend
After deploying to Render, update these environment variables:

1. In `.env.production`:
   ```
   NEXT_PUBLIC_API_URL=https://your-api.onrender.com
   ```
   Replace `your-api.onrender.com` with your actual Render API URL.

2. In GitHub repository settings (for GitHub Actions):
   - Go to Settings > Secrets and Variables > Actions
   - Add a new secret:
     - Name: `NEXT_PUBLIC_PRODUCTION_API_URL`
     - Value: `https://your-api.onrender.com` (your Render API URL)

## Development

1. Install dependencies:
   ```bash
   cd server
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

The server will run on http://localhost:3001 by default.

## API Routes

All API routes from the Next.js app are preserved with the same functionality:

- `GET /api/albums/:albumId` - Get album by ID
- `GET /api/albums/:albumId/images` - Get images in an album
- `GET /api/images/:imageId` - Get image by ID
- `POST /api/upload` - Upload images
- `POST /api/check-email` - Email verification
- `GET /api/albums` - List public albums

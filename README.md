# ImageHost - Modern Image Hosting Platform

A clean, minimalist image hosting platform with drag-and-drop uploads, album management, and API access.

## Features

- 🔐 **User Authentication** - Secure login/signup with Supabase Auth
- 📁 **Album Management** - Organize images into albums
- 🖼️ **Drag & Drop Upload** - Easy image uploading with progress indicators
- 🎨 **Clean UI** - Minimalist design with Tailwind CSS
- 🔗 **API Access** - RESTful APIs for external integration
- 📱 **Responsive** - Works on all devices
- 🆓 **Free Database** - Powered by Supabase

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Express.js server with TypeScript
- **Database & Auth**: Supabase (Database, Auth, Storage)
- **UI Components**: Custom components with Lucide icons
- **File Upload**: React Dropzone with Multer backend
- **Deployment**: Frontend on Vercel/Netlify, Backend on Render

## Setup Instructions

### 1. Supabase Setup

1. Go to [Supabase](https://supabase.com) and create a new project
2. In the SQL Editor, run the schema from `supabase/schema.sql`
3. Run the storage configuration from `supabase/storage.sql`
4. Go to Settings > API to get your project URL and anon key

### 2. Environment Variables

1. Copy `.env.example` to `.env.local`
2. Fill in your Supabase credentials and backend URL:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
   ```

### 3. Backend Setup

The backend server is located in the `/server` directory and handles API requests, file uploads, and data fetching.

#### Local Development:
```bash
cd server
npm install
npm run dev
```

#### Production (Render):
The backend is automatically deployed to Render. Make sure to set these environment variables in Render:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 4. Frontend Setup

#### Install Dependencies

```bash
npm install
```

#### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

### Get Album Images
```
GET /api/albums/[albumId]/images
```

### Get Single Image
```
GET /api/images/[imageId]
```

### Upload Image
```
POST /api/images/upload
```

## Project Structure

```
src/
├── app/                 # Next.js app directory
├── components/          # Reusable UI components
├── lib/                # Utilities and configurations
└── types/              # TypeScript type definitions
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details.

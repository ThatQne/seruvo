# Supabase Setup Guide

Follow these steps to set up your Supabase database and storage for ImageHost.

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" or "New Project"
3. Sign in with GitHub (recommended) or create an account
4. Create a new organization if needed
5. Click "New Project"
6. Fill in:
   - **Name**: `imagehost` (or any name you prefer)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your location
7. Click "Create new project"
8. Wait for the project to be created (takes 1-2 minutes)

## Step 2: Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click "New query"
3. Copy and paste the entire content from `supabase/schema.sql` (see below)
4. Click "Run" to execute the SQL

### Database Schema SQL:
```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create albums table
CREATE TABLE IF NOT EXISTS public.albums (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create images table
CREATE TABLE IF NOT EXISTS public.images (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    album_id UUID REFERENCES public.albums(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    alt_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_albums_user_id ON public.albums(user_id);
CREATE INDEX IF NOT EXISTS idx_images_album_id ON public.images(album_id);
CREATE INDEX IF NOT EXISTS idx_images_user_id ON public.images(user_id);
CREATE INDEX IF NOT EXISTS idx_albums_created_at ON public.albums(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_images_created_at ON public.images(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Albums policies
CREATE POLICY "Users can view their own albums" ON public.albums
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public albums" ON public.albums
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can insert their own albums" ON public.albums
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own albums" ON public.albums
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own albums" ON public.albums
    FOR DELETE USING (auth.uid() = user_id);

-- Images policies
CREATE POLICY "Users can view their own images" ON public.images
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view images from public albums" ON public.images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.albums 
            WHERE albums.id = images.album_id 
            AND albums.is_public = true
        )
    );

CREATE POLICY "Users can insert their own images" ON public.images
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own images" ON public.images
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own images" ON public.images
    FOR DELETE USING (auth.uid() = user_id);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_albums_updated_at
    BEFORE UPDATE ON public.albums
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_images_updated_at
    BEFORE UPDATE ON public.images
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

## Step 3: Set Up Storage

1. In your Supabase dashboard, go to **Storage** (left sidebar)
2. Click "Create a new bucket"
3. Fill in:
   - **Name**: `images`
   - **Public bucket**: ✅ Check this box
   - **File size limit**: `10485760` (10MB)
   - **Allowed MIME types**: `image/jpeg,image/jpg,image/png,image/gif,image/webp`
4. Click "Create bucket"

### Storage Policies (Run in SQL Editor):
```sql
-- Storage policies for images bucket
CREATE POLICY "Users can upload images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'images' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can view their own images" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'images' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can view public images" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'images'
        AND EXISTS (
            SELECT 1 FROM public.images 
            WHERE images.storage_path = storage.objects.name
            AND EXISTS (
                SELECT 1 FROM public.albums 
                WHERE albums.id = images.album_id 
                AND albums.is_public = true
            )
        )
    );

CREATE POLICY "Users can update their own images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'images' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete their own images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'images' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );
```

## Step 4: Get Your API Keys

1. Go to **Settings** > **API** (left sidebar)
2. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)
   - **service_role** key (long string starting with `eyJ...`)

## Step 5: Configure Environment Variables

1. In your project folder, copy `.env.example` to `.env.local`
2. Fill in your Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_here
```

## Step 6: Test Your Setup

1. Run the development server:
   ```bash
   npm run dev
   ```

2. Open [http://localhost:3000](http://localhost:3000)

3. Try creating an account and uploading an image!

## Troubleshooting

- **Can't create bucket**: Make sure you're on the Storage tab and have the correct permissions
- **SQL errors**: Make sure you copied the entire SQL script and ran it in the SQL Editor
- **Upload errors**: Check that your environment variables are correct and the storage bucket exists
- **Auth errors**: Verify your Supabase URL and anon key are correct

## Need Help?

If you run into issues, check:
1. Supabase project is fully created (green status)
2. All SQL scripts ran without errors
3. Storage bucket named "images" exists and is public
4. Environment variables are correctly set
5. Development server is running on port 3000

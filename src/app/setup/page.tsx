'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { CheckCircle, Copy, ExternalLink, Database, Settings } from 'lucide-react'

export default function SetupPage() {
  const [step, setStep] = useState(1)
  const [supabaseUrl, setSupabaseUrl] = useState('')
  const [anonKey, setAnonKey] = useState('')
  const [serviceKey, setServiceKey] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const generateEnvFile = () => {
    return `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}
SUPABASE_SERVICE_ROLE_KEY=${serviceKey}

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=${Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)}`
  }

  const schemaSQL = `-- Enable necessary extensions
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
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();`

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">ImageHost Setup</h1>
        <p className="text-gray-600 mt-2">Let&apos;s get your Supabase database configured</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        {[1, 2, 3, 4].map((stepNum) => (
          <div key={stepNum} className="flex items-center">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              ${step >= stepNum ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}
            `}>
              {step > stepNum ? <CheckCircle className="h-5 w-5" /> : stepNum}
            </div>
            {stepNum < 4 && (
              <div className={`w-12 h-0.5 ${step > stepNum ? 'bg-blue-600' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Create Supabase Project */}
      {step === 1 && (
        <Card variant="elevated">
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <ExternalLink className="h-5 w-5 mr-2" />
              Step 1: Create Supabase Project
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="text-gray-700">Follow these steps to create your Supabase project:</p>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">supabase.com</a></li>
                <li>Click &quot;Start your project&quot; and sign in</li>
                <li>Create a new project with name &quot;imagehost&quot;</li>
                <li>Choose your region and set a database password</li>
                <li>Wait for the project to be created (1-2 minutes)</li>
              </ol>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setStep(2)}>
                Project Created, Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Database Schema */}
      {step === 2 && (
        <Card variant="elevated">
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Database className="h-5 w-5 mr-2" />
              Step 2: Set Up Database Schema
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="text-gray-700">Copy this SQL and run it in your Supabase SQL Editor:</p>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Go to your Supabase dashboard → SQL Editor</li>
                <li>Click &quot;New query&quot;</li>
                <li>Copy the SQL below and paste it</li>
                <li>Click &quot;Run&quot; to execute</li>
              </ol>
            </div>
            
            <div className="relative">
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg max-h-64 overflow-y-auto text-sm">
                <pre>{schemaSQL}</pre>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(schemaSQL, 'schema')}
              >
                {copied === 'schema' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={() => setStep(3)}>
                Schema Applied, Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Storage Setup */}
      {step === 3 && (
        <Card variant="elevated">
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Step 3: Set Up Storage
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="text-gray-700">Create a storage bucket for images:</p>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Go to Storage in your Supabase dashboard</li>
                <li>Click &quot;Create a new bucket&quot;</li>
                <li>Name: <code className="bg-gray-100 px-1 rounded">images</code></li>
                <li>Check &quot;Public bucket&quot;</li>
                <li>File size limit: <code className="bg-gray-100 px-1 rounded">10485760</code> (10MB)</li>
                <li>Allowed MIME types: <code className="bg-gray-100 px-1 rounded">image/jpeg,image/jpg,image/png,image/gif,image/webp</code></li>
                <li>Click &quot;Create bucket&quot;</li>
              </ol>
            </div>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button onClick={() => setStep(4)}>
                Storage Created, Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Environment Variables */}
      {step === 4 && (
        <Card variant="elevated">
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">Step 4: Configure Environment Variables</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="text-gray-700">Get your API keys from Supabase Settings → API and fill them below:</p>
              
              <Input
                label="Supabase URL"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://xxxxx.supabase.co"
              />
              
              <Input
                label="Anon Public Key"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJ..."
              />
              
              <Input
                label="Service Role Key"
                value={serviceKey}
                onChange={(e) => setServiceKey(e.target.value)}
                placeholder="eyJ..."
              />
            </div>

            {supabaseUrl && anonKey && serviceKey && (
              <div className="space-y-3">
                <p className="text-gray-700">Copy this to your <code className="bg-gray-100 px-1 rounded">.env.local</code> file:</p>
                <div className="relative">
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm">
                    <pre>{generateEnvFile()}</pre>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(generateEnvFile(), 'env')}
                  >
                    {copied === 'env' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)}>
                Back
              </Button>
              {supabaseUrl && anonKey && serviceKey && (
                <div className="text-center">
                  <p className="text-green-600 font-medium mb-2">✅ Setup Complete!</p>
                  <p className="text-sm text-gray-600">Run <code className="bg-gray-100 px-1 rounded">npm run dev</code> to start your app</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

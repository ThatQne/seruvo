-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'images',
    'images',
    true,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
);

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

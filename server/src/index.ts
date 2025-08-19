import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import { supabase } from './lib/supabase';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'ImageHost API Server is running' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Routes
app.get('/api/albums/:albumId', async (req, res) => {
  const { albumId } = req.params;

  if (!albumId) {
    return res.status(400).json({ error: 'Missing albumId' });
  }

  const { data, error } = await supabase
    .from('albums')
    .select('*')
    .eq('id', albumId)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: 'Album not found' });
  }

  if (!data.is_public) {
    return res.status(403).json({ error: 'Album is private' });
  }

  res.json(data);
});

app.get('/api/albums/:albumId/images', async (req, res) => {
  const { albumId } = req.params;

  if (!albumId) {
    return res.status(400).json({ error: 'Missing albumId' });
  }

  const { data, error } = await supabase
    .from('images')
    .select('*')
    .eq('album_id', albumId)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch images' });
  }

  res.json(data || []);
});

app.get('/api/images/:imageId', async (req, res) => {
  const { imageId } = req.params;

  if (!imageId) {
    return res.status(400).json({ error: 'Missing imageId' });
  }

  const { data, error } = await supabase
    .from('images')
    .select('*')
    .eq('id', imageId)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: 'Image not found' });
  }

  res.json(data);
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { albumId, userId } = req.body;

  if (!albumId || !userId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Generate unique filename
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const storagePath = `${filename}`;

    // Upload to Supabase Storage
    const { data: storageData, error: storageError } = await supabase.storage
      .from('images')
      .upload(storagePath, req.file.buffer);

    if (storageError) {
      throw storageError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(storagePath);

    // Save to database
    const { data: dbData, error: dbError } = await supabase
      .from('images')
      .insert([
        {
          album_id: albumId,
          user_id: userId,
          filename,
          original_name: req.file.originalname,
          file_size: req.file.size,
          mime_type: req.file.mimetype,
          storage_path: storagePath,
          public_url: publicUrl
        }
      ])
      .select()
      .single();

    if (dbError) throw dbError;

    res.json({ url: publicUrl, ...dbData });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

app.post('/api/check-email', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ error: 'Failed to check email' });
  }

  res.json({ exists: !!data });
});

app.get('/api/albums', async (req, res) => {
  const { data, error } = await supabase
    .from('albums')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch albums' });
  }

  res.json(data || []);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

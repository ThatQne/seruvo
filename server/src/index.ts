import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import { supabase, getServiceClient } from './lib/supabase';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const cleanupIntervalMs = parseInt(process.env.IMAGE_CLEANUP_INTERVAL_MS || '100000', 10); // default 5 min

// --- CORS Configuration ---
// Include localhost and deployed Vercel domain by default (can be overridden via env)
const rawAllowed = 'http://localhost:3000,https://seruvo.vercel.app';
// Support comma-separated list
const allowedOrigins = rawAllowed.split(',').map(o => o.trim()).filter(Boolean);
const normalizeOrigin = (o?: string | null) => o ? o.replace(/\/$/, '') : o;
const normalizedAllowed = allowedOrigins.map(normalizeOrigin);
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow non-browser (curl, server-side)
    const norm = normalizeOrigin(origin);
    if (normalizedAllowed.includes('*') || (norm && normalizedAllowed.includes(norm))) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Length'],
  credentials: false,
  maxAge: 86400,
};
app.use(cors(corsOptions));
// Explicit preflight handling (some hosting setups skip middleware on 404)
app.options('*', cors(corsOptions));
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

// --- In-memory realtime (SSE) infrastructure (per process, not clustered) ---
interface ImageEventPayload {
  imageId: string;
  [key: string]: any;
}
const imageSubscribers: Record<string, Set<express.Response>> = {};
const imageExpiryTimers = new Map<string, NodeJS.Timeout>();

function broadcastImageEvent(imageId: string, event: string, payload: Record<string, any> = {}) {
  const subs = imageSubscribers[imageId];
  if (!subs || subs.size === 0) return;
  const data: ImageEventPayload = { imageId, ...payload };
  const serialized = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  subs.forEach(res => {
    try { res.write(serialized); } catch { /* ignore broken pipe */ }
  });
}

function scheduleExpiry(imageId: string, expiresAtIso?: string | null) {
  if (!expiresAtIso) return;
  const ts = Date.parse(expiresAtIso);
  if (Number.isNaN(ts)) return;
  const now = Date.now();
  const diff = ts - now;
  // Clear any existing timer
  const existing = imageExpiryTimers.get(imageId);
  if (existing) clearTimeout(existing);
  if (diff <= 0) {
    // Already expired - broadcast immediately (cleanup job will delete soon)
    broadcastImageEvent(imageId, 'expired', { expires_at: expiresAtIso });
    return;
  }
  const timer = setTimeout(() => {
    broadcastImageEvent(imageId, 'expired', { expires_at: expiresAtIso });
    imageExpiryTimers.delete(imageId);
  }, diff);
  imageExpiryTimers.set(imageId, timer);
}

// SSE endpoint for a single image
app.get('/api/stream/image/:imageId', (req, res) => {
  const { imageId } = req.params;
  if (!imageId) return res.status(400).end();
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  // Ensure CORS headers present for EventSource (especially on some proxies)
  const requestOrigin = req.headers.origin;
  if (requestOrigin && (allowedOrigins.includes('*') || allowedOrigins.includes(requestOrigin))) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
  }
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.flushHeaders?.();

  if (!imageSubscribers[imageId]) imageSubscribers[imageId] = new Set();
  imageSubscribers[imageId].add(res);

  // Initial event
  res.write(`event: connected\ndata: ${JSON.stringify({ imageId })}\n\n`);

  const heartbeat = setInterval(() => {
    try { res.write('event: ping\ndata: {}\n\n'); } catch { /* ignore */ }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    imageSubscribers[imageId].delete(res);
    if (imageSubscribers[imageId].size === 0) delete imageSubscribers[imageId];
  });
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
  const started = Date.now();
  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
  }

  try {
    const serviceClient = getServiceClient();
    const client = serviceClient || supabase; // prefer service role (bypasses RLS)

    // With current RLS, anon client cannot read other users' profiles.
    // So we rely on service role to get an accurate answer.
    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (profileError) {
      console.error('[check-email] profiles query error', profileError);
    }

    if (profile) {
      return res.json({ exists: true, source: 'profiles', ms: Date.now() - started });
    }

    // If no profile but service client present, verify user exists via admin API
    if (serviceClient) {
      try {
        // Fallback: list users (paginated) and find email (small scale acceptable). For large scale implement RPC.
        const { data: listData, error: listErr } = await serviceClient.auth.admin.listUsers({ perPage: 100 });
        if (listErr) {
          console.error('[check-email] admin.listUsers error', listErr);
        } else if (listData && listData.users?.some(u => u.email?.toLowerCase() === email.toLowerCase())) {
          return res.json({ exists: true, source: 'auth.admin.listUsers', ms: Date.now() - started });
        }
      } catch (adminErr) {
        console.error('[check-email] admin lookup exception', adminErr);
      }
    }

    return res.json({ exists: false, source: 'none', ms: Date.now() - started });
  } catch (e) {
    console.error('[check-email] unexpected error', e);
    return res.status(500).json({ error: 'Failed to check email' });
  }
});

// Bulk delete images (and underlying storage objects)
app.post('/api/delete-images', async (req, res) => {
  const { imageIds, userId } = req.body as { imageIds?: string[]; userId?: string };
  if (!Array.isArray(imageIds) || imageIds.length === 0 || !userId) {
    return res.status(400).json({ error: 'Missing imageIds or userId' });
  }
  try {
    const serviceClient = getServiceClient() || supabase;
    // Fetch images to get storage paths (ensure ownership)
    const { data: images, error: fetchErr } = await serviceClient
      .from('images')
      .select('id, storage_path')
      .in('id', imageIds)
      .eq('user_id', userId);
    if (fetchErr) throw fetchErr;
    const paths = (images || []).map(i => i.storage_path);
    // Delete DB rows first so UI state stays consistent even if storage partially fails
  const { error: dbErr } = await serviceClient
      .from('images')
      .delete()
      .in('id', imageIds)
      .eq('user_id', userId);
    if (dbErr) throw dbErr;
  imageIds.forEach(id => broadcastImageEvent(id, 'deleted'));
    // Remove storage objects (best effort, batch size 50)
    const BATCH = 50;
    let storageFailures: string[] = [];
    for (let i = 0; i < paths.length; i += BATCH) {
      const slice = paths.slice(i, i + BATCH);
      const { error: storageError } = await serviceClient.storage.from('images').remove(slice);
      if (storageError) {
        console.warn('[delete-images] batch storage delete failed', slice, storageError);
        storageFailures = storageFailures.concat(slice);
      }
    }
    return res.json({ deleted: imageIds.length, storageFailures });
  } catch (e) {
    console.error('[delete-images] error', e);
    return res.status(500).json({ error: 'Failed to delete images' });
  }
});

// Delete an album and all its images (DB + storage)
app.post('/api/delete-album', async (req, res) => {
  const { albumId, userId } = req.body as { albumId?: string; userId?: string };
  if (!albumId || !userId) {
    return res.status(400).json({ error: 'Missing albumId or userId' });
  }
  try {
    const serviceClient = getServiceClient() || supabase;
    // Fetch images for album
    const { data: images, error: fetchErr } = await serviceClient
      .from('images')
      .select('id, storage_path')
      .eq('album_id', albumId)
      .eq('user_id', userId);
    if (fetchErr) throw fetchErr;
    const paths = (images || []).map(i => i.storage_path);
    // Delete image rows
  const { error: imgDelErr } = await serviceClient
      .from('images')
      .delete()
      .eq('album_id', albumId)
      .eq('user_id', userId);
    if (imgDelErr) throw imgDelErr;
  (images || []).forEach(i => broadcastImageEvent(i.id, 'deleted'));
    // Delete album row
    const { error: albumErr } = await serviceClient
      .from('albums')
      .delete()
      .eq('id', albumId)
      .eq('user_id', userId);
    if (albumErr) throw albumErr;
    // Delete storage objects best effort
    const BATCH = 50;
    let storageFailures: string[] = [];
    for (let i = 0; i < paths.length; i += BATCH) {
      const slice = paths.slice(i, i + BATCH);
      const { error: storageError } = await serviceClient.storage.from('images').remove(slice);
      if (storageError) {
        console.warn('[delete-album] batch storage delete failed', slice, storageError);
        storageFailures = storageFailures.concat(slice);
      }
    }
    return res.json({ deletedImages: paths.length, storageFailures });
  } catch (e) {
    console.error('[delete-album] error', e);
    return res.status(500).json({ error: 'Failed to delete album' });
  }
});

// Mark image as opened (for expires_on_open logic). Body: { imageId: string }
app.post('/api/open-image', async (req, res) => {
  const { imageId } = req.body as { imageId?: string };
  if (!imageId) return res.status(400).json({ error: 'Missing imageId' });
  try {
    const client = getServiceClient() || supabase;
    // Fetch image
    const { data: img, error: fetchErr } = await client
      .from('images')
      .select('id, expires_on_open, opened_at, expires_at')
      .eq('id', imageId)
      .single();
    if (fetchErr || !img) return res.status(404).json({ error: 'Not found' });
    // If not an expires_on_open image or already opened, return existing expiry
    if (!img.expires_on_open || img.opened_at) {
      return res.json({ expires_at: img.expires_at, alreadyOpened: !!img.opened_at });
    }
  const expiresAt = new Date(Date.now() + 1 * 60 * 1000).toISOString(); // 1 min expiry per requirements
    const { error: updErr } = await client
      .from('images')
      .update({ opened_at: new Date().toISOString(), expires_at: expiresAt })
      .eq('id', imageId);
    if (updErr) throw updErr;
    scheduleExpiry(imageId, expiresAt);
    broadcastImageEvent(imageId, 'updated', { expires_at: expiresAt });
    return res.json({ expires_at: expiresAt, started: true });
  } catch (e) {
    console.error('[open-image] error', e);
    return res.status(500).json({ error: 'Failed to mark opened' });
  }
});

// Manual trigger for expired image cleanup
app.post('/api/cleanup-expired', async (_req, res) => {
  try {
    const result = await cleanupExpiredImages();
    res.json(result);
  } catch (e) {
    console.error('[manual-cleanup-expired] error', e);
    res.status(500).json({ error: 'Cleanup failed' });
  }
});

// --- Expired Images Cleanup Logic ---
async function cleanupExpiredImages() {
  const started = Date.now();
  const client = getServiceClient() || supabase;
  const nowIso = new Date().toISOString();
  const BATCH = 500; // DB rows per loop
  const STORAGE_BATCH = 50;
  let totalDeleted = 0;
  let storageFailures: string[] = [];

  try {
    while (true) {
      const { data: rows, error } = await client
        .from('images')
        .select('id, storage_path')
        .lt('expires_at', nowIso)
        .limit(BATCH);
      if (error) {
        console.error('[expired-cleanup] select error', error);
        break;
      }
      if (!rows || rows.length === 0) break;

      const ids = rows.map(r => r.id);
      const paths = rows.map(r => r.storage_path);

      // Delete DB rows first
  const { error: delErr } = await client
        .from('images')
        .delete()
        .in('id', ids);
      if (delErr) {
        console.error('[expired-cleanup] db delete error', delErr);
        // Stop to avoid orphan logic confusion
        break;
      }

      totalDeleted += ids.length;
  ids.forEach(id => broadcastImageEvent(id, 'deleted', { reason: 'expired' }));

      // Remove storage objects best effort
      for (let i = 0; i < paths.length; i += STORAGE_BATCH) {
        const slice = paths.slice(i, i + STORAGE_BATCH);
        const { error: storageError } = await client.storage.from('images').remove(slice);
        if (storageError) {
          console.warn('[expired-cleanup] storage batch failed', slice, storageError);
          storageFailures = storageFailures.concat(slice);
        }
      }

      // Continue loop until fewer than batch
      if (rows.length < BATCH) break;
    }
  } catch (e) {
    console.error('[expired-cleanup] unexpected error', e);
  }

  const elapsed = Date.now() - started;
  const summary = { deleted: totalDeleted, storageFailures, ms: elapsed };
  if (totalDeleted > 0) {
    console.log('[expired-cleanup] summary', summary);
  }
  return summary;
}

// Start periodic cleanup (only if interval > 0)
if (cleanupIntervalMs > 0) {
  setInterval(() => {
    cleanupExpiredImages().catch(e => console.error('[expired-cleanup] interval error', e));
  }, cleanupIntervalMs);
  console.log(`[expired-cleanup] scheduled every ${cleanupIntervalMs}ms`);
}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

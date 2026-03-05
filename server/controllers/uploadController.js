import path from 'path';
import fs from 'fs';
import fsPromises from 'fs/promises';
import { randomUUID } from 'crypto';
import { getUploadsDir } from '../config/uploads.js';
import { isDurableUploadConfigured, uploadToDurableStorage } from '../services/durableUploadService.js';

const UPLOAD_DIR = getUploadsDir();
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXT = ['.pdf', '.png', '.jpg', '.jpeg'];

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

export function getUploadMiddleware(multer) {
  ensureUploadsDir();
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || '.bin';
      cb(null, `${randomUUID()}${ext.toLowerCase()}`);
    },
  });
  return multer({
    storage,
    limits: { fileSize: MAX_SIZE },
    fileFilter: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (ALLOWED_EXT.includes(ext)) return cb(null, true);
      cb(new Error('Only PDF and images allowed'));
    },
  }).single('file');
}

async function cleanupTempFile(filePath) {
  if (!filePath) return;
  try {
    await fsPromises.unlink(filePath);
  } catch {
    // Ignore cleanup errors for temp files.
  }
}

export async function handleUpload(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const type = req.file.mimetype?.startsWith('image/') ? 'image' : 'pdf';

  if (process.env.VERCEL) {
    if (!isDurableUploadConfigured()) {
      await cleanupTempFile(req.file.path);
      return res.status(503).json({
        error: 'Upload storage not configured. Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and SUPABASE_STORAGE_BUCKET.',
      });
    }

    const objectPath = `uploads/${path.basename(req.file.filename)}`;
    try {
      const uploaded = await uploadToDurableStorage({
        localFilePath: req.file.path,
        objectPath,
        mimeType: req.file.mimetype,
      });
      await cleanupTempFile(req.file.path);
      return res.json({
        url: uploaded.url,
        id: path.basename(req.file.filename),
        name: req.file.originalname,
        path: uploaded.path,
        type,
        uploadedAt: new Date().toISOString(),
      });
    } catch (error) {
      await cleanupTempFile(req.file.path);
      console.error('Durable upload failed', error);
      return res.status(502).json({ error: 'Upload failed' });
    }
  }

  const url = '/uploads/' + path.basename(req.file.filename);
  res.json({
    url,
    id: req.file.filename,
    name: req.file.originalname,
    path: url,
    type,
    uploadedAt: new Date().toISOString(),
  });
}

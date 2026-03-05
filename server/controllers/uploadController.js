import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import { getUploadsDir } from '../config/uploads.js';

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

export function handleUpload(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const url = '/uploads/' + path.basename(req.file.filename);
  const type = req.file.mimetype?.startsWith('image/') ? 'image' : 'pdf';
  res.json({
    url,
    id: req.file.filename,
    name: req.file.originalname,
    path: url,
    type,
    uploadedAt: new Date().toISOString(),
  });
}

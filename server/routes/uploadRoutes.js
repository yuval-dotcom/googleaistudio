import { Router } from 'express';
import multer from 'multer';
import { getUploadMiddleware, handleUpload } from '../controllers/uploadController.js';

const router = Router();
const uploadMw = getUploadMiddleware(multer);

router.post('/', uploadMw, async (req, res, next) => {
  try {
    await handleUpload(req, res);
  } catch (error) {
    next(error);
  }
}, (err, _req, res, _next) => {
  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large (max 10MB)' });
  }
  res.status(400).json({ error: err?.message || 'Upload failed' });
});

export default router;

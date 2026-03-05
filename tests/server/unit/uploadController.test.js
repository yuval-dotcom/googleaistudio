import { describe, expect, it, vi } from 'vitest';
import { getUploadMiddleware, handleUpload } from '../../../server/controllers/uploadController.js';

describe('uploadController', () => {
  describe('getUploadMiddleware', () => {
    it('configures multer with expected limits and single file field', () => {
      const single = vi.fn().mockReturnValue('mw');
      const multer = vi.fn().mockReturnValue({ single });
      multer.diskStorage = vi.fn((cfg) => cfg);

      const out = getUploadMiddleware(multer);

      expect(out).toBe('mw');
      expect(multer.diskStorage).toHaveBeenCalledOnce();
      expect(multer).toHaveBeenCalledWith(
        expect.objectContaining({
          limits: { fileSize: 10 * 1024 * 1024 },
        })
      );
      expect(single).toHaveBeenCalledWith('file');
    });

    it('allows only pdf and image extensions in fileFilter', () => {
      const single = vi.fn().mockReturnValue('mw');
      const multer = vi.fn().mockReturnValue({ single });
      multer.diskStorage = vi.fn((cfg) => cfg);

      getUploadMiddleware(multer);
      const cfg = multer.mock.calls[0][0];
      const allowCb = vi.fn();
      const rejectCb = vi.fn();

      cfg.fileFilter({}, { originalname: 'test.PDF' }, allowCb);
      cfg.fileFilter({}, { originalname: 'photo.jpeg' }, allowCb);
      cfg.fileFilter({}, { originalname: 'script.exe' }, rejectCb);

      expect(allowCb).toHaveBeenCalledWith(null, true);
      expect(rejectCb).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('handleUpload', () => {
    it('returns 400 when file is missing', () => {
      const req = {};
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      handleUpload(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'No file uploaded' });
    });

    it('returns image response payload for uploaded image', () => {
      const req = {
        file: {
          filename: 'abc-123.png',
          originalname: 'my-picture.png',
          mimetype: 'image/png',
        },
      };
      const res = { json: vi.fn() };

      handleUpload(req, res);
      const payload = res.json.mock.calls[0][0];

      expect(payload.id).toBe('abc-123.png');
      expect(payload.url).toBe('/uploads/abc-123.png');
      expect(payload.path).toBe('/uploads/abc-123.png');
      expect(payload.name).toBe('my-picture.png');
      expect(payload.type).toBe('image');
      expect(typeof payload.uploadedAt).toBe('string');
    });

    it('returns pdf type for non-image mimetype', () => {
      const req = {
        file: {
          filename: '../unsafe.pdf',
          originalname: 'contract.pdf',
          mimetype: 'application/pdf',
        },
      };
      const res = { json: vi.fn() };

      handleUpload(req, res);
      const payload = res.json.mock.calls[0][0];

      expect(payload.url).toBe('/uploads/unsafe.pdf');
      expect(payload.type).toBe('pdf');
    });
  });
});

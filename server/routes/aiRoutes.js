import { Router } from 'express';
import { handleAiRequest } from '../controllers/aiController.js';

const router = Router();

// POST /api/ai
router.post('/', handleAiRequest);

export default router;


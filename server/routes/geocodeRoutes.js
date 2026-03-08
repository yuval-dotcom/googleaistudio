import express from 'express';
import { geocodeAddress } from '../controllers/geocodeController.js';

const router = express.Router();

router.post('/', geocodeAddress);

export default router;

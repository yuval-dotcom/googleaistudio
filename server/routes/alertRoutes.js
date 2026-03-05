import { Router } from 'express';
import * as alertController from '../controllers/alertController.js';

const router = Router();

router.get('/', alertController.list);

export default router;


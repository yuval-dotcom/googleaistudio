import { Router } from 'express';
import * as dealController from '../controllers/dealController.js';

const router = Router();

router.get('/', dealController.list);
router.get('/:id', dealController.getOne);
router.post('/', dealController.create);

export default router;


import { Router } from 'express';
import * as bankAccountController from '../controllers/bankAccountController.js';

const router = Router();

router.get('/', bankAccountController.list);
router.post('/', bankAccountController.create);
router.delete('/:id', bankAccountController.remove);

export default router;


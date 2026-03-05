import { Router } from 'express';
import * as assetController from '../controllers/assetController.js';

const router = Router();

router.get('/', assetController.list);
router.get('/:id/projection', assetController.projection);
router.get('/:id/ownership-income', assetController.ownershipIncome);
router.get('/:id', assetController.getOne);
router.post('/', assetController.create);
router.put('/:id', assetController.update);
router.delete('/:id', assetController.remove);

export default router;

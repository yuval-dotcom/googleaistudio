import { Router } from 'express';
import * as unitController from '../controllers/unitController.js';

const router = Router({ mergeParams: true });

router.get('/', unitController.list);
router.get('/:unitId', unitController.getOne);
router.post('/', unitController.create);
router.put('/:unitId', unitController.update);
router.delete('/:unitId', unitController.remove);

export default router;

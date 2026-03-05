import { Router } from 'express';
import * as contractController from '../controllers/contractController.js';

const router = Router({ mergeParams: true });

router.get('/', contractController.list);
router.get('/:contractId', contractController.getOne);
router.post('/', contractController.create);
router.put('/:contractId', contractController.update);
router.delete('/:contractId', contractController.remove);

export default router;

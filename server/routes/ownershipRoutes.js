import { Router } from 'express';
import * as ownershipController from '../controllers/ownershipController.js';

const router = Router({ mergeParams: true });

router.get('/', ownershipController.list);
router.get('/:ownershipId', ownershipController.getOne);
router.post('/', ownershipController.create);
router.put('/:ownershipId', ownershipController.update);
router.delete('/:ownershipId', ownershipController.remove);

export default router;

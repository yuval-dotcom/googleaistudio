import { Router } from 'express';
import * as loanController from '../controllers/loanController.js';

const router = Router({ mergeParams: true });

router.get('/', loanController.list);
router.get('/:loanId', loanController.getOne);
router.post('/', loanController.create);
router.put('/:loanId', loanController.update);
router.delete('/:loanId', loanController.remove);

export default router;

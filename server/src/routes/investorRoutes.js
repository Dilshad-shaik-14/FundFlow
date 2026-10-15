import { Router } from 'express';
import {
  createInvestor,
  deleteInvestor,
  getInvestor,
  listInvestors,
  updateInvestor,
} from '../controllers/investorController.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

router.use(authenticate);
router.route('/').get(listInvestors).post(createInvestor);
router.route('/:investorId').get(getInvestor).patch(updateInvestor).delete(deleteInvestor);

export default router;

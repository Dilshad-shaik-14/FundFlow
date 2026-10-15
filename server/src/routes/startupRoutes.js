import { Router } from 'express';
import {
  createStartup,
  deleteStartup,
  getStartup,
  listStartups,
  updateStartup,
} from '../controllers/startupController.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

router.use(authenticate);
router.route('/').get(listStartups).post(createStartup);
router.route('/:startupId').get(getStartup).patch(updateStartup).delete(deleteStartup);

export default router;

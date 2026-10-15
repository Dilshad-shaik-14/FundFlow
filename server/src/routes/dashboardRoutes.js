import { Router } from 'express';
import { getDashboardMetrics } from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

router.use(authenticate);
router.get('/metrics', getDashboardMetrics);

export default router;

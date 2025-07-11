import { Router } from 'express'
import { controllerAnalyticsSocials } from '../controllers/analytics.controller.js';

const router = Router();

router.post('/analytics/socials', controllerAnalyticsSocials)

export default router;
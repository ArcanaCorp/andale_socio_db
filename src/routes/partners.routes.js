import { Router } from "express";
import { controllerPartner, controllerPartnerId } from "../controllers/partners.controller.js";

const router = Router();

router.get('/partners', controllerPartner)
router.get('/partners/:sub', controllerPartnerId)

export default router;
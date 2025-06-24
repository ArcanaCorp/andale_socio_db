import { Router } from "express";
import { controllerGetInfo, controllerGetPhoto } from "../controllers/bussines.controller.js";

const router = Router()

router.get('/account', controllerGetInfo)
router.get('/account/photo/:sub/:photo', controllerGetPhoto)

export default router;
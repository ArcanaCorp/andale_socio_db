import { Router} from "express";
import { controllerWelcome } from "../controllers/index.controller.js";

const router = Router()

router.get('/', controllerWelcome)

export default router;
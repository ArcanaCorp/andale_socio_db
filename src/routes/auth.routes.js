import { Router } from "express";
import { controllerAccount, controllerCompleted, controllerLogin, controllerPhoto, controllerVerify } from "../controllers/auth.controller.js";
import { uploadPhoto } from "../middlewares/upload-photo.js";

const router = Router()

router.post('/auth/login', controllerLogin)
router.post('/auth/verify', controllerVerify)
router.post('/auth/completed', controllerCompleted)
router.post('/auth/photo-profile', uploadPhoto.single('photo'), controllerPhoto)

router.get('/auth/account', controllerAccount)

export default router;
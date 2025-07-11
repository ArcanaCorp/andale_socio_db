import { Router } from "express";
import { controllerGetInfo, controllerGetPhoto, controllerUpdateInfo, controllerUpdatePhoto } from "../controllers/bussines.controller.js";
import { uploadPhoto } from "../middlewares/upload-photo.js";

const router = Router()

router.get('/account', controllerGetInfo)
router.put('/account', controllerUpdateInfo)
router.get('/account/photo/:sub/:photo', controllerGetPhoto)
router.put('/account/photo', uploadPhoto.single('photo'), controllerUpdatePhoto)

export default router;
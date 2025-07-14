import { Router } from "express";
import { controllerEditAccount, controllerGetInfo, controllerGetPhoto, controllerUpdateInfo, controllerUpdatePhoto } from "../controllers/bussines.controller.js";
import { uploadPhoto } from "../middlewares/upload-photo.js";

const router = Router()

router.get('/account', controllerGetInfo)
router.put('/account', controllerUpdateInfo)
router.get('/account/photo/:sub/:photo', controllerGetPhoto)
router.put('/account/photo', uploadPhoto.single('photo'), controllerUpdatePhoto)

router.post('/account/edit', controllerEditAccount)

export default router;
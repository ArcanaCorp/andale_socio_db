import { Router } from "express";
import { controllerCreateProduct, controllerPhotoProduct } from "../controllers/product.controller.js";
import { uploadProductPhotos } from "../middlewares/upload-files.js";

const router = Router();

router.post('/product/create', uploadProductPhotos.array('images', 5), controllerCreateProduct)

router.get('/product/photo/:sub/:photo', controllerPhotoProduct)

export default router;
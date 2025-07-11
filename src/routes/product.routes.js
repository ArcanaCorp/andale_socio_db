import { Router } from "express";
import { controllerCreateProduct, controllerDeleteProduct, controllerListProduct, controllerListProducts, controllerPhotoProduct, controllerUpdateProduct } from "../controllers/product.controller.js";
import { uploadProductPhotos } from "../middlewares/upload-files.js";
import { controllerCreateCategory, controllerListCategory } from "../controllers/categories.controller.js";

const router = Router();

router.get('/product/list', controllerListProducts)

router.get('/product/list/:productId', controllerListProduct)

router.post('/product/create', uploadProductPhotos.array('images', 5), controllerCreateProduct)

router.put('/product/:productId', controllerUpdateProduct)

router.delete('/product/:productId', controllerDeleteProduct)

router.get('/product/photo/:sub/:photo', controllerPhotoProduct)


/* CATEGORIES */

router.get('/categories', controllerListCategory)
router.post('/category/create', controllerCreateCategory)

export default router;
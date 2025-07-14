import { Router } from "express";
import { controllerCreateProduct, controllerDeletePhotoProduct, controllerDeleteProduct, controllerListProduct, controllerListProducts, controllerPhotoProduct, controllerUpdateProduct } from "../controllers/product.controller.js";
import { uploadProductPhotos } from "../middlewares/upload-files.js";
import { controllerCreateCategory, controllerDeleteCategory, controllerListCategory, controllerUpdateCategory } from "../controllers/categories.controller.js";

const router = Router();

router.get('/product/list', controllerListProducts)

router.get('/product/list/:productId', controllerListProduct)

router.post('/product/create', uploadProductPhotos.array('images', 5), controllerCreateProduct)

router.put('/product/:productId', uploadProductPhotos.array('images', 5), controllerUpdateProduct)

router.delete('/product/:productId', controllerDeleteProduct)

router.delete('/product/photo/:productId', controllerDeletePhotoProduct)

router.get('/product/photo/:sub/:photo', controllerPhotoProduct)


/* CATEGORIES */

router.get('/categories', controllerListCategory)
router.post('/category/create', controllerCreateCategory)
router.delete('/category/:id', controllerDeleteCategory)
router.put('/category/:id', controllerUpdateCategory)

export default router;
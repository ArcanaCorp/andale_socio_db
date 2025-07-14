import { ENDPOINT, JWT_SECRET } from "../config.js";
import pool from "../db/db.js";
import jwt from 'jsonwebtoken'
import path from 'path'
import fs from 'fs'

export const controllerListProducts = async (req, res) => {
    
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ ok: false, message: 'Token no proporcionado', error: 'ERR_TOKEN_NOT_FOUND', code: 401 });

        const token = authHeader.split(' ')[1]; 

        try {
            
            const decoded = jwt.verify(token, JWT_SECRET);
            const sub = decoded.sub;
                                
            if (!sub) return res.status(401).json({ ok: false, message: 'Token inválido: falta sub_user', code: 401 });

                // LEFT JOIN permite que el producto aparezca aunque no tenga imágenes
                const sqlListProducts = `
                    SELECT p.*, pi.id_image, pi.image_url, pi.is_main 
                    FROM products p 
                    LEFT JOIN product_images pi ON p.id_product = pi.id_product 
                    WHERE p.sub_bussines = ? 
                    ORDER BY p.id_product, pi.is_main DESC
                `;
                const [listProducts] = await pool.query(sqlListProducts, [sub]);

                // Agrupar imágenes por producto
                const productsMap = new Map();

                for (const row of listProducts) {
                    if (!productsMap.has(row.id_product)) {
                        productsMap.set(row.id_product, {
                            id: row.id_product,
                            name: row.name_product,
                            text: row.text_product,
                            category: row.category_product,
                            amount: row.amount_product,
                            price: Number(row.price_product).toFixed(2),
                            status: row.status_product,
                            images: []
                        });
                    }

                    // Si tiene imagen, agregarla
                    if (row.id_image) {
                        productsMap.get(row.id_product).images.push({
                            id: row.id_image,
                            filename: `${ENDPOINT}/product/photo/${sub}/${row.image_url}`,
                            is_main: row.is_main === 1
                        });
                    }
                }

                const products = Array.from(productsMap.values());

                return res.status(200).json({ok: true, message: `Se obtuvieron ${products.length} productos`, products, length: products.length, error: '',code: 200});

        } catch (error) {
            return res.status(500).json({ok: false, message: error.message, error: error, code: 500});
        }
};

export const controllerListProduct = async (req, res) => {

    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ ok: false, message: 'Token no proporcionado', error: 'ERR_TOKEN_NOT_FOUND', code: 401 });

        const token = authHeader.split(' ')[1]; 

        const { productId } = req.params;

        try {
            
            const decoded = jwt.verify(token, JWT_SECRET);
            const sub = decoded.sub;
                            
            if (!sub) return res.status(401).json({ ok: false, message: 'Token inválido: falta sub_user', code: 401 });

                const sql = `SELECT p.*, pi.image_url, pi.is_main FROM products p LEFT JOIN product_images pi ON pi.id_product = p.id_product WHERE p.id_product = ? AND p.sub_bussines = ?`;
                const [ listProduct ] = await pool.query(sql, [ productId, sub ])

                if (!listProduct.length === 0) return res.status(404).json({ok: false, message: 'No se encontró el producto', error: 'ERR_PRODUCT_NOT_FOUND', code: 404})

                    // Organizar las imágenes del producto
                    const product = listProduct[0]; // Producto principal

                    const images = listProduct.map(row => ({
                        id: row.id_image,
                        image_url: row.image_url,
                        is_main: row.is_main
                    }));

                    const result = {
                        id: product.id_product,
                        name: product.name_product,
                        text: product.text_product,
                        category: product.category_product,
                        amount: product.amount_product,
                        price: Number(product.price_product),
                        status: product.status_product,
                        images: images
                    }

                    // Devuelves el producto con sus imágenes organizadas
                    return res.status(200).json({ok: true, product: result, code: 200});

        } catch (error) {
            return res.status(500).json({ok: false, message: error.message, error: error, code: 500})
        }

}

export const controllerCreateProduct = async (req, res) => {

    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ ok: false, message: 'Token no proporcionado', error: 'ERR_TOKEN_NOT_FOUND', code: 401 });

        const token = authHeader.split(' ')[1]; 
    
        const { name, text, category, amount, price } = req.body;
        const images = req.files; // Array de archivos

            if (!name || !text || !category || !amount || !price) return res.status(400).json({ ok: false, message: "Todos los campos son obligatorios" });
        
            try {
                
                const decoded = jwt.verify(token, JWT_SECRET);
                const subUser = decoded.sub;
                            
                if (!subUser) return res.status(401).json({ ok: false, message: 'Token inválido: falta sub_user', code: 401 });

                    const sqlAdd = 'INSERT INTO products (sub_bussines, name_product, text_product, category_product, amount_product, price_product, status_product, created_product, update_product) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())'
                    const [ add ] = await pool.query(sqlAdd, [ subUser, name, text, category, amount, price, 1 ])

                    if (!add.affectedRows === 0) return res.status(403).json({ok: false, message: 'No se pudo crear el producto', error: '', code: 403})

                        const productId = add.insertId;
                        const sqlAddImages = 'INSERT INTO product_images (id_product, image_url, is_main, created_at) VALUES (?, ?, ?, NOW())'
                        
                        for (let i = 0; i < images.length; i++) {
                            const file = images[i];
                            const filePath = file.filename;
                            const isMain = i === 0 ? 1 : 0;
                            await pool.query(sqlAddImages, [productId, filePath, isMain]);
                        }
                        
                        const imageNames = images.map((img, index) => ({
                            filename: img.filename,
                            is_main: index === 0 ? true : false
                        }));


                        const product = {
                            id: productId,
                            name: name,
                            text: text,
                            category: category,
                            amount: amount, 
                            price: Number(price),
                            status: 1,
                            images: imageNames
                        }

                        return res.status(201).json({ok: true, message: 'Se creó con éxito el producto', product: product, error: '', code: 201})


            } catch (error) {
                return res.status(500).json({ok: false, message: error.message, error: error, code: 500})
            }
        
}

export const controllerUpdateProduct = async (req, res) => {

    const authHeader = req.headers.authorization;
    const { productId } = req.params;
    const { column, value } = req.body;

    if (!productId || !authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ ok: false, message: 'Token no proporcionado', error: 'ERR_TOKEN_NOT_FOUND', code: 401 });

        const token = authHeader.split(' ')[1];

        try {
            
            const decoded = jwt.verify(token, JWT_SECRET);
            const sub = decoded.sub;
            
            const sqlInfo = 'SELECT * FROM bussines WHERE sub_bussines = ?'
            const [ info ] = await pool.query(sqlInfo, [ sub ])

            if (info.length === 0) return res.status(403).json({ok: false, message: 'No hay datos sobre el negocio', error: '', code: 403})

                const fieldMap = {
                    name: 'name_product',
                    text: 'text_product',
                    category: 'category_product',
                    amount: 'amount_product',
                    price: 'price_product'
                }

                const sqlUpdate = `UPDATE products SET ${fieldMap[column]} = ? WHERE id_product = ? AND sub_bussines = ?`
                const [ update ] = await pool.query(sqlUpdate, [ value, productId, sub ])

                if (update.affectedRows === 0) return res.status(403).json({ok: false, message: 'No se pudo actualizar los campos necesarios', error: '', code: 403})

                    return res.status(200).json({ok: true, message: 'Se actualizó con éxito el product', error: '', code: 200})

        } catch (error) {
            return res.status(500).json({ok: false, message: error.message, error: error, code: 500})
        }

}

export const controllerDeleteProduct = async (req, res) => {

    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ ok: false, message: 'Token no proporcionado', error: 'ERR_TOKEN_NOT_FOUND', code: 401 });

        const token = authHeader.split(' ')[1]; 

        const { productId } = req.params;

        if (!productId) return res.status(403).json({ok: false, message: 'No se obtuvo el product', error: '', code: 403})

            try {
                
                const decoded = jwt.verify(token, JWT_SECRET);
                const sub = decoded.sub;
                            
                if (!sub) return res.status(401).json({ ok: false, message: 'Token inválido: falta sub_user', code: 401 });

                    const sqlDeleteProduct = 'DELETE FROM products WHERE sub_bussines = ? AND id_product = ?'
                    const [ deleteProduct ] = await pool.query(sqlDeleteProduct, [ sub, productId ])

                    if (deleteProduct.affectedRows === 0) return res.status(404).json({ok: false, message: 'No se pudo eliminar el producto', error: '', code: 403})

                        //const sqlImages = 'DELETE FROM product_images WHERE id_product = ?'
                        //await pool.query(sqlImages, [ productId ])

                        return res.status(201).json({ok: true, message: 'Se eliminó con éxito el producto', error: '', code: 201})

            } catch (error) {
                return res.status(500).json({ok: false, message: error.message, error: error, code: 500})
            }

}

export const controllerPhotoProduct = async (req, res) => {

    const { sub, photo } = req.params;
    
        if (!sub || !photo) return res.status(403).json({ok: false, message: 'No existen los parámetros necesarios', error: '', code: 403})
    
        try {
            
            const imagePath = path.join(process.cwd(), 'partners', sub, 'products', photo);
    
            // Verifica si existe el archivo
            if (!fs.existsSync(imagePath)) {
                return res.status(404).json({
                    ok: false,
                    message: 'Imagen no encontrada',
                    error: '',
                    code: 404
                });
            }
    
            // Envía el archivo como respuesta
            return res.sendFile(imagePath); 
    
        } catch (error) {
            return res.status(500).json({ok: false, message: error.message, error: error, code: 500})
        }

}

export const controllerDeletePhotoProduct = async (req, res) => {

    const authHeader = req.headers.authorization;
    const { productId } = req.params;
    const { id } = req.body;

    if (!productId || !authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ ok: false, message: 'Token no proporcionado', error: 'ERR_TOKEN_NOT_FOUND', code: 401 });

        const token = authHeader.split(' ')[1];

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            const sub = decoded.sub;
            
            const sqlInfo = 'SELECT * FROM bussines WHERE sub_bussines = ?'
            const [ info ] = await pool.query(sqlInfo, [ sub ])

            if (info.length === 0) return res.status(403).json({ok: false, message: 'No hay datos sobre el negocio', error: '', code: 403})

                const [photo] = await pool.query('SELECT is_main FROM product_images WHERE id_image = ? AND id_product = ?', [id, productId]);

                if (photo.length === 0) return res.status(404).json({ok: false, message: 'Imagen no encontrada', error: '', code: 404});
                    
                    const isMain = photo[0].is_main === 1;

                    const sqlDeletePhoto = 'DELETE FROM product_images WHERE id_image = ? AND id_product = ?'
                    const [ deletePhoto ] = await pool.query(sqlDeletePhoto, [ id, productId ])

                    if (deletePhoto.affectedRows === 0) return res.status(403).json({ok: false, message: 'No se pudo eliminar la imagen', error: '', code: 403})

                        if (isMain) {
                            const [others] = await pool.query('SELECT id_image FROM product_images WHERE id_product = ? ORDER BY id_image ASC LIMIT 1', [productId]);
                            if (others.length > 0) {
                                const newMainId = others[0].id_image;
                                await pool.query('UPDATE product_images SET is_main = 1 WHERE id_image = ?', [newMainId]);
                            }
                        }

                        return res.status(200).json({ok: true, message: 'Se eliminó la imagen con éxito', error: '', code: 200})

        } catch (error) {
            return res.status(500).json({ok: false, message: error.message, error: error, code: 500})
        }

}
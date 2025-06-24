import { JWT_SECRET } from "../config.js";
import pool from "../db/db.js";
import jwt from 'jsonwebtoken'
import path from 'path'
import fs from 'fs'

export const controllerCreateProduct = async (req, res) => {

    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ ok: false, message: 'Token no proporcionado', error: 'ERR_TOKEN_NOT_FOUND', code: 401 });

        const token = authHeader.split(' ')[1]; 
    
        const { name, text, amount, price } = req.body;
        const images = req.files; // Array de archivos

            if (!name || !text || !amount || !price || images.length === 0) return res.status(400).json({ ok: false, message: "Todos los campos son obligatorios" });
        
            try {
                
                const decoded = jwt.verify(token, JWT_SECRET);
                const subUser = decoded.sub;
                            
                if (!subUser) return res.status(401).json({ ok: false, message: 'Token inválido: falta sub_user', code: 401 });

                    const sqlAdd = 'INSERT INTO products (sub_bussines, name_product, text_product, amount_product, price_product, status_product, created_product, update_product) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())'
                    const [ add ] = await pool.query(sqlAdd, [ subUser, name, text, amount, price, 1 ])

                    if (!add.affectedRows === 0) return res.status(403).json({ok: false, message: 'No se pudo crear el producto', error: '', code: 403})

                        const productId = add.insertId;
                        const sqlAddImages = 'INSERT INTO product_images (id_product, image_url, is_main, created_at) VALUES (?, ?, ?, NOW())'
                        
                        for (let i = 0; i < images.length; i++) {
                            const file = images[i];
                            const filePath = file.filename;
                            const isMain = i === 0 ? 1 : 0;
                            await pool.query(sqlAddImages, [productId, filePath, isMain]);
                        }
                        
                        const imageNames = images.map(img => img.filename);

                        const product = {
                            id: productId,
                            name: name,
                            text: text,
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
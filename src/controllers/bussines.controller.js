import path from 'path';
import fs from 'fs';
import pool from '../db/db.js';
import jwt from 'jsonwebtoken'
import { ENDPOINT, JWT_SECRET } from '../config.js';

export const controllerGetInfo = async (req, res) => {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ ok: false, message: 'Token no proporcionado', error: 'ERR_TOKEN_NOT_FOUND', code: 401 });

        const token = authHeader.split(' ')[1];

        try {

            const decoded = jwt.verify(token, JWT_SECRET);
            const subBussines = decoded.sub;
            
            const sqlInfo = 'SELECT * FROM bussines WHERE sub_bussines = ?'
            const [ info ] = await pool.query(sqlInfo, [ subBussines ])

            if (info.length === 0) return res.status(403).json({ok: false, message: 'No hay datos sobre el negocio', error: '', code: 403})

                const sqlProducts = 'SELECT p.*, pi.image_url, pi.is_main FROM products p INNER JOIN product_images pi ON p.id_product = pi.id_product WHERE p.sub_bussines = ? ORDER BY p.id_product, pi.is_main DESC'
                const [productsData] = await pool.query(sqlProducts, [subBussines]);

                // Agrupar imágenes por producto
                const productsMap = new Map();

                for (const row of productsData) {
                    if (!productsMap.has(row.id_product)) {
                        productsMap.set(row.id_product, {
                            id: row.id_product,
                            name: row.name_product,
                            text: row.text_product,
                            amount: row.amount_product,
                            price:  Number(row.price_product),
                            status: row.status_product,
                            images: []
                        });
                    }

                    productsMap.get(row.id_product).images.push({
                        filename: row.image_url,
                        is_main: row.is_main === 1
                    });
                }

                const products = Array.from(productsMap.values());

                const bussines = info.map((data) => ({
                    id: data.id_bussines,
                    sub: data.sub_bussines,
                    name: data.name_bussines,
                    text: data.text_bussines,
                    category: data.category_bussines,
                    sub_category: data.subcategory_bussines,
                    location: data.direction_bussines,
                    photo: `${ENDPOINT}/account/photo/${data.sub_bussines}/${data.photo_bussines}`,
                    products: products
                }))

                return res.status(201).json({ok: true, message: 'Datos del negocio obtenidos', bussines: bussines[0], error: '', code: 201})

        } catch (error) {
            return res.status(500).json({ok: false, message: error.message, error: error, code: 500})
        }
}

export const controllerUpdateInfo = async (req, res) => {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ ok: false, message: 'Token no proporcionado', error: 'ERR_TOKEN_NOT_FOUND', code: 401 });

        const token = authHeader.split(' ')[1];

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            const sub = decoded.sub;
            
            const sqlInfo = 'SELECT * FROM bussines WHERE sub_bussines = ?'
            const [ info ] = await pool.query(sqlInfo, [ sub ])

            if (info.length === 0) return res.status(403).json({ok: false, message: 'No hay datos sobre el negocio', error: '', code: 403})
        
                // Mapeo de campos del body a columnas de la base de datos
                const fieldMap = {
                    name: 'name_bussines',
                    text: 'text_bussines',
                    category: 'category_bussines',
                    subcategory: 'subcategory_bussines',
                    location: 'direction_bussines',
                };

                const fieldsToUpdate = [];
                const values = [];

                for (const [key, column] of Object.entries(fieldMap)) {
                    const value = req.body[key];
                    if (value && typeof value === 'string' && value.trim() !== '') {
                        fieldsToUpdate.push(`${column} = ?`);
                        values.push(value.trim());
                    }
                }

                if (fieldsToUpdate.length === 0) return res.status(400).json({ ok: false, message: 'No se proporcionó ningún dato válido para actualizar', code: 400});

                    // Ejecutar el update
                    values.push(sub);
                    const updateQuery = `UPDATE bussines SET ${fieldsToUpdate.join(', ')} WHERE sub_bussines = ?`;
                    await pool.query(updateQuery, values);

                    return res.status(200).json({ok: true, message: 'Datos actualizados correctamente', code: 200});

        } catch (error) {
            
            return res.status(500).json({ok: false, message: error.message, error: error, code: 500})

        }

}

export const controllerGetPhoto = async (req, res) => {

    const { sub, photo } = req.params;

    if (!sub || !photo) return res.status(403).json({ok: false, message: 'No existen los parámetros necesarios', error: '', code: 403})

    try {
        
        const imagePath = path.join(process.cwd(), 'partners', sub, 'profile', photo);

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

export const controllerUpdatePhoto = async (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ ok: false, message: 'Token no proporcionado', error: 'ERR_TOKEN_NOT_FOUND', code: 401 });

        const token = authHeader.split(' ')[1]; 

        try {
            
            const decoded = jwt.verify(token, JWT_SECRET);
            const subUser = decoded.sub;
            
            if (!subUser) return res.status(401).json({ ok: false, message: 'Token inválido: falta sub_user', code: 401 });
                        
                if (!req.file) return res.status(404).json({ok: false, message: 'No se subió ninguna imagen', error: 'NOT_UPLOADED_IMAGE', code: 404})

                    const fileUrl = `${req.file.filename}`;

                    const sqlUpdatePhoto = 'UPDATE bussines SET photo_bussines = ? WHERE sub_bussines = ?'
                    const [ updatePhoto ] = await pool.query(sqlUpdatePhoto, [ fileUrl, subUser ])

                    if (!updatePhoto.affectedRows === 0) return res.status(404).json({ok: false, message: 'No se pudo actualizar la foto', error: 'NOT_UPDATE_PHOTO', code: 404})

                        const photoURL = `${ENDPOINT}/account/photo/${subUser}/${fileUrl}`
                        return res.status(200).json({ok: true, message: 'Se actualizó la imagen', photo: photoURL, error: '', code: 200})

        } catch (error) {
            console.error(error);
            return res.status(500).json({ok: false, message: `Error: ${error.message}`, error: error, code: 500})
        }
}
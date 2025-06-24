import path from 'path';
import fs from 'fs';
import pool from '../db/db.js';
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../config.js';

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

                const bussines = info.map((data) => ({
                    id: data.id_bussines,
                    sub: data.sub_bussines,
                    name: data.name_bussines,
                    text: data.text_bussines,
                    category: data.category_bussines,
                    sub_category: data.subcategory_bussines,
                    location: data.direction_bussines,
                    photo: data.photo_bussines,
                    products: []
                }))

                return res.status(201).json({ok: true, message: 'Datos del negocio obtenidos', bussines: bussines[0], error: '', code: 201})

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
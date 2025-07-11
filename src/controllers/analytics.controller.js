import jwt from 'jsonwebtoken'
import pool from "../db/db.js";
import { JWT_SECRET } from '../config.js';

export const controllerAnalyticsSocials = async (req, res) => {

    const { domain } = req.body;

    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ ok: false, message: 'Token no proporcionado', error: 'ERR_TOKEN_NOT_FOUND', code: 401 });

        const token = authHeader.split(' ')[1]; 

        try {

            const decoded = jwt.verify(token, JWT_SECRET);
            const user = decoded.sub;
                        
            if (!user) return res.status(401).json({ ok: false, message: 'Token inválido: falta sub_user', code: 401 });

                const sql = 'INSERT INTO analytics_socials (sub_bussines, social_analytics_social, created_analytics_social) VALUES (?, ?, NOW())'
                const [ add ] = await pool.query(sql, [ user, domain ])

                if (add.affectedRows === 0) return res.status(404).json({ok: false, message: 'No se pudo insertar', error: 'ERR_NOT_ADD_SOCIAL', code: 404})

                    return res.status(200).json({ok: true, message: 'Se añadio', error: '', code: 200})

        } catch (error) {
            return res.status(500).json({ok: false, message: `Error: ${error.message}`, error: error, code: 500})
        }

}
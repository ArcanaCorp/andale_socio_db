import jwt from 'jsonwebtoken'
import pool from "../db/db.js";
import { JWT_SECRET } from "../config.js";

export const controllerListCategory = async (req, res) => {

    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ ok: false, message: 'Token no proporcionado', error: 'ERR_TOKEN_NOT_FOUND', code: 401 });

        const token = authHeader.split(' ')[1]; 

        try {

            const decoded = jwt.verify(token, JWT_SECRET);
            const sub = decoded.sub;
                                            
            if (!sub) return res.status(401).json({ ok: false, message: 'Token inválido: falta sub_user', code: 401 });

                const sql = 'SELECT * FROM bussines_category WHERE sub_bussines = ?'
                const [ consult ] = await pool.query(sql, [ sub ])
                if (consult.length === 0) return res.status(404).json({ ok: false, message: 'No hay categorias disponibles', length: 0, error: '', code: 404 })
                    
                    const cgt = consult.map(row => ({
                        id: row.id_bcategory,
                        category: row.name_bcategory
                    }))

                    return res.status(200).json({ok: true, message: 'Categorias encontradas', categories: cgt, length: consult.length, error: '', code: 200})

        } catch (error) {
            return res.status(500).json({ok: false, message: error.message, error: error, code: 500})
        }

}

export const controllerCreateCategory = async (req, res) => {

    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ ok: false, message: 'Token no proporcionado', error: 'ERR_TOKEN_NOT_FOUND', code: 401 });

        const token = authHeader.split(' ')[1]; 

        try {

            const decoded = jwt.verify(token, JWT_SECRET);
            const sub = decoded.sub;
                                        
            if (!sub) return res.status(401).json({ ok: false, message: 'Token inválido: falta sub_user', code: 401 });

                const { category } = req.body;

                const sql = 'INSERT INTO bussines_category (sub_bussines, name_bcategory, created_bcategory) VALUES (?, ?, NOW())'
                const [ consult ] = await pool.query(sql, [ sub, category ])
                if (consult.affectedRows === 0) return res.status(404).json({ok: false, message: 'No se pudo crear la categoria', error: '', code: 404})
            
                    return res.status(201).json({ok: true, message: 'Se creó con éxito la categoria', error: '', code: 201})

        } catch (error) {
            return res.status(500).json({ok: false, message: error.message, error: error, code: 500})
        }

}
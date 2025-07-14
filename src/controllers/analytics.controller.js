import pool from "../db/db.js";

export const controllerAnalyticsSocials = async (req, res) => {

    const { slug, domain } = req.body;
    
    if (!slug || !domain) return res.status(401).json({ ok: false, message: 'Datos no proporcionados', error: 'ERR_TOKEN_NOT_FOUND', code: 401 });

        try {
                        
            const sqlExisting = 'SELECT sub_bussines FROM bussines WHERE short_bussines = ? OR sub_bussines = ?'
            const [ existing ] = await pool.query(sqlExisting, [ slug, slug ]);
            if (existing.length === 0) return res.status(401).json({ ok: false, message: 'Usuario no encontrado', error: 'ERR_TOKEN_NOT_FOUND', code: 401 });

                const user = existing[0].sub_bussines;
                const sql = 'INSERT INTO analytics_socials (sub_bussines, social_analytics_social, created_analytics_social) VALUES (?, ?, NOW())'
                const [ add ] = await pool.query(sql, [ user, domain ])

                if (add.affectedRows === 0) return res.status(404).json({ok: false, message: 'No se pudo insertar', error: 'ERR_NOT_ADD_SOCIAL', code: 404})

                    return res.status(200).json({ok: true, message: 'Se añadio', error: '', code: 200})

        } catch (error) {
            return res.status(500).json({ok: false, message: `Error: ${error.message}`, error: error, code: 500})
        }

}
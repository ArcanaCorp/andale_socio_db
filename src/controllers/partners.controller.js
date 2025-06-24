import pool from "../db/db.js";

export const controllerPartner = async (req, res) => {
    return res.status(201).json({ok: true})
}

export const controllerPartnerId = async (req, res) => {

    const { sub } = req.params;
       
    if (!sub) return res.status(403).json({ok: false, message: 'No se proporciono el token', error: '', code: 403})

    try {
    
        const sql = 'SELECT * FROM bussines WHERE sub_bussines = ? OR short_bussines = ?'
        const [ data ] = await pool.query(sql, [ sub, sub ])

        if (data.length === 0) return res.status(404).json({ok: false, message: 'No se encontraron resultados', error: '', code: 404})

            const bussines = {
                id: data[0].id_bussines,
                sub: data[0].sub_bussines,
                name: data[0].name_bussines,
                text: data[0].text_bussines,
                category: data[0].category_bussines,
                sub_category: data[0].subcategory_bussines,
                location: data[0].direction_bussines,
                photo: data[0].photo_bussines,
                products: []
            }

            return res.status(201).json({ok: true, message: 'Encontrado', error: '', code: 201, bussines: bussines})


    } catch (error) {
        return res.status(500).json({ok: false, message: error.message, error: error, code: 500})
    }

}
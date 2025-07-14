import { ENDPOINT } from "../config.js";
import pool from "../db/db.js";
import { getCategoriesPartners, getProductsWithImages, getSocialsPartners } from "../libs/partners.lib.js";

export const controllerPartner = async (req, res) => {
    return res.status(201).json({ok: true})
}

export const controllerPartnerId = async (req, res) => {
    const { sub } = req.params;

    if (!sub) return res.status(403).json({ ok: false, message: 'No se proporcionó el token', error: '', code: 403 });

        try {
            const sql = 'SELECT * FROM bussines WHERE sub_bussines = ? OR short_bussines = ?';
            const [data] = await pool.query(sql, [sub, sub]);

            if (data.length === 0) return res.status(404).json({ ok: false, message: 'No se encontraron resultados', error: '', code: 404 });

            const info = data[0];

            const categories = await getCategoriesPartners(info.sub_bussines)
            const products = await getProductsWithImages(info.sub_bussines)
            const sociales = await getSocialsPartners(info.sub_bussines)

            const bussines = {
                id: info.id_bussines,
                sub: info.sub_bussines,
                short: info.short_bussines,
                name: info.name_bussines,
                text: info.text_bussines,
                category: info.category_bussines,
                sub_category: info.subcategory_bussines,
                location: info.direction_bussines,
                photo: `${ENDPOINT || 'http://'}/account/photo/${info.sub_bussines}/${info.photo_bussines}`,
                products,
                sociales,
                categories
            };

            return res.status(200).json({ok: true, message: 'Encontrado', error: '', code: 200, bussines});

        } catch (error) {
            return res.status(500).json({ ok: false, message: error.message, error: error, code: 500 });
        }
}
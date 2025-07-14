import pool from "../db/db.js";

export const getCategoriesPartners = async (sub_bussines) => {
    try {
        
        const sql = 'SELECT * FROM bussines_category WHERE sub_bussines = ?'
        const [ rows ] = await pool.query(sql, [ sub_bussines ])

        if (rows.length === 0) return [];

            const categories = rows.map((r) => ({
                id: r.id_bcategory,
                txt: r.name_bcategory
            }))

            return categories;

    } catch (error) {
        return [];
    }
}

export const getProductsWithImages = async (sub_bussines) => {
    try {
        const sql = `
            SELECT p.*, pi.id_image, pi.image_url, pi.is_main 
            FROM products p 
            LEFT JOIN product_images pi ON p.id_product = pi.id_product 
            WHERE p.sub_bussines = ? 
            ORDER BY p.id_product, pi.is_main DESC
        `;
        const [rows] = await pool.query(sql, [sub_bussines]);

        const productsMap = new Map();

        for (const row of rows) {
            if (!productsMap.has(row.id_product)) {
                productsMap.set(row.id_product, {
                    id: row.id_product,
                    name: row.name_product,
                    text: row.text_product,
                    category: row.category_product,
                    amount: Number(row.amount_product),
                    price: Number(row.price_product),
                    status: row.status_product === '1',
                    images: []
                });
            }

            if (row.image_url) {
                productsMap.get(row.id_product).images.push({
                    id: row.id_image,
                    filename: `${ENDPOINT}/product/photo/${sub_bussines}/${row.image_url}`,
                    is_main: row.is_main === 1
                });
            }
        }

        return Array.from(productsMap.values());
    } catch (error) {
        return [];
    }
}

export const getSocialsPartners = async (sub_bussines) => {
    try {
        
        const sql = 'SELECT * FROM bussines_socials WHERE sub_bussines = ?'
        const [ rows ] = await pool.query(sql, [ sub_bussines ])
        if (rows.length === 0) return [];

            const sociales = rows.map((r) => ({
                id: r.id_bsocial,
                red: r.social_bsocial,
                link: r.link_bsocial
            }))

            return sociales;

    } catch (error) {
        return [];
    }
}
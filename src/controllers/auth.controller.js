import { ENDPOINT, JWT_SECRET } from "../config.js";
import pool from "../db/db.js";
import jwt from 'jsonwebtoken'
import { sendOTP } from "../utils/otp.js";
import { generateSlug } from "../utils/slug.js";

const generateCodeOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

export const controllerLogin = async (req, res) => {

    const { phone } = req.body;

    if (!phone || phone.length < 9) return res.status(404).json({ok: false, message: 'Número de teléfono no válido', error: 'Phone Error', code: 404})

    try {
        
        const sqlExisting = 'SELECT * FROM bussines WHERE phone_bussines = ?'
        const [ existing ] = await pool.query(sqlExisting, [ phone ])

        if (existing.length === 0) {

            const sub = Date.now();

            const sqlCreated = 'INSERT INTO bussines (sub_bussines, phone_bussines, name_bussines, text_bussines, category_bussines, direction_bussines, photo_bussines, created_bussines) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())'
            const [ created ] = await pool.query(sqlCreated, [ sub, phone, '', '', '', '', '' ])

            if (created.affectedRows === 0) return res.status(404).json({ok: false, message: 'No se pudo registrar al usuario. Inténtelo más tarde', error: 'Register Error', code: 404})

                const code = generateCodeOTP();

                await sendOTP(phone, code)
                console.log(`Send code: ${phone} - ${code}`);

                const expires = new Date(Date.now() + 10 * 60 * 1000);
                const sqlOTP = 'INSERT INTO login_tokens (sub_bussines, code_token, created_token, expires_token) VALUES (?, ?, NOW(), ?)'
                const [ otp ] = await pool.query(sqlOTP, [ sub, code, expires ])

                if (otp.affectedRows === 0) return res.status(404).json({ok: false, message: 'No se pudo enviar el código. Inténtelo más tarde', error: 'Code Error', code: 404})

                    const payload = {
                        sub: sub
                    }

                    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1y' })

                    return res.status(201).json({ok: true, message: 'Se envio el código de verificación', token: token, error: '', code: 201})

        } else {

            const user = existing[0]
            const sub = user.sub_bussines
            const code = generateCodeOTP();

            const send = await sendOTP(phone, code)

            if (!send.ok) return res.status(404).json({ok: false, message: send.message, error: send.message, code: 404})

                const expires = new Date(Date.now() + 10 * 60 * 1000);
                
                const sqlOTP = 'INSERT INTO login_tokens (sub_bussines, code_token, created_token, expires_token) VALUES (?, ?, NOW(), ?)'
                const [ otp ] = await pool.query(sqlOTP, [ sub, code, expires ])

                    if (otp.affectedRows === 0) return res.status(404).json({ok: false, message: 'No se pudo enviar el código. Inténtelo más tarde', error: 'Code Error', code: 404})

                        return res.status(201).json({ok: true, message: 'Se envio el código de verificación', error: '', code: 201})
            

        }

    } catch (error) {
        console.error(error);
        return res.status(500).json({ok: false, message: `Error: ${error.message}`, error: error, code: 500})
    }

}

export const controllerVerify = async (req, res) => {

    const { phone, code } = req.body;

        if (!code || !/^\d{6}$/.test(code)) return res.status(401).json({ok: false, message: 'No se proporciono el código de verificación', error: 'ERR_NOT_CODE_FOUND', code: 401})

            try {
                
                if (!phone) return res.status(401).json({ ok: false, message: 'Token inválido: falta sub_user', code: 401 });

                    const sqlExisting = 'SELECT * FROM bussines WHERE phone_bussines = ?'
                    const [ existing ] = await pool.query(sqlExisting, [ phone ])

                    if (existing.length === 0) return res.status(401).json({ ok: false, message: 'No existe el usuario', code: 401 });

                        const bussines = existing[0];

                        const sqlSearchToken = 'SELECT * FROM login_tokens WHERE sub_bussines = ? AND code_token = ? AND expires_token > NOW() ORDER BY created_token DESC LIMIT 1'
                        const [ searchToken ] = await pool.query(sqlSearchToken, [ bussines.sub_bussines, code ])

                        if (searchToken.length === 0) return res.status(401).json({ok: false, message: 'Código OTP inválido o ha expirado', error: 'ERR_INVALID_OTP', code: 401})

                            const tkn = searchToken[0];
                            const id_tkn = tkn.id_token;
                            const sqlDeleteToken = 'DELETE FROM login_tokens WHERE id_token = ?'
                            await pool.query(sqlDeleteToken, [ id_tkn ])

                            const payload = {
                                sub: bussines.sub_bussines
                            }

                            const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1y' })

                            const completed = bussines.name_bussines === '' ? false : true

                            return res.status(201).json({ok: true, message: 'Se verifico con éxito.', token: token, completed: completed, error: '', code: 201})

            } catch (error) {
                console.error(error);
                return res.status(500).json({ok: false, message: `Error: ${error.message}`, error: error, code: 500})
            }

}

export const controllerCompleted = async (req, res) => {

    const { phone, name, text, type, category, location } = req.body;
    
        if (!phone || !name || !text || !category || !type || !location) return res.status(401).json({ok: false, message: 'No se proporciono la información necesaria', error: 'ERR_NOT_DATA_FOUND', code: 401})

            try {
                
                const sqlExisting = 'SELECT * FROM bussines WHERE phone_bussines = ?'
                const [ existe ] = await pool.query(sqlExisting, [ phone ])
                if (existe.length === 0) return res.status(401).json({ ok: false, message: 'Token inválido: falta phone_user', code: 401 });

                    const short = generateSlug(name)

                    const sqlUpdateInfo = 'UPDATE bussines SET short_bussines = ?, name_bussines = ?, text_bussines = ?, category_bussines = ?, subcategory_bussines = ?, direction_bussines = ? WHERE phone_bussines = ?'
                    const [ updateInfo ] = await pool.query(sqlUpdateInfo, [ short, name, text, type, category, location, phone ])

                    if (updateInfo.affectedRows === 0) return res.status(404).json({ok: false, message: 'No se pudo actualizar la información', error: 'ERR_NOT_UPDATE_INFO', code: 403})
                        
                        const user = existe[0];
                        const payload = {
                            sub: user.sub_bussines
                        }

                        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1y' })

                        return res.status(201).json({ok: true, message: 'Se actualizó con éxito la información', token: token, completed: true, error: '', code: 201})

            } catch (error) {
                console.error(error);
                return res.status(500).json({ok: false, message: `Error: ${error.message}`, error: error, code: 500})
            }

}

export const controllerPhoto = async (req, res) => {

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

                        return res.status(200).json({ok: true, message: 'Se actualizó la imagen', completed: true, error: '', code: 200})

        } catch (error) {
            console.error(error);
            return res.status(500).json({ok: false, message: `Error: ${error.message}`, error: error, code: 500})
        }

}

export const controllerAccount = async (req, res) => {

    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ ok: false, message: 'Token no proporcionado', error: 'ERR_TOKEN_NOT_FOUND', code: 401 });

        const token = authHeader.split(' ')[1]; 

        try {
            
            const decoded = jwt.verify(token, JWT_SECRET);
            const user = decoded.sub;
            
            if (!user) return res.status(401).json({ ok: false, message: 'Token inválido: falta sub_user', code: 401 });

                const sql = 'SELECT * FROM bussines WHERE sub_bussines = ?'
                const [ info ] = await pool.query(sql, [ user ])
                if (info.length === 0) return res.status(404).json({ok: false, message: 'No hay datos del usuario', error: 'USER_NOT_FOUND', code: 404})

                    const sqlProducts = 'SELECT p.*, pi.image_url, pi.is_main FROM products p INNER JOIN product_images pi ON p.id_product = pi.id_product WHERE p.sub_bussines = ? ORDER BY p.id_product, pi.is_main DESC'
                    const [productsData] = await pool.query(sqlProducts, [user]);

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
                        short: data.short_bussines,
                        name: data.name_bussines,
                        text: data.text_bussines,
                        category: data.category_bussines,
                        sub_category: data.subcategory_bussines,
                        location: data.direction_bussines,
                        photo: data.photo_bussines !== '' ? `${ENDPOINT}/account/photo/${data.sub_bussines}/${data.photo_bussines}` : 'https://empowher.org/wp-content/uploads/2021/03/image-placeholder-350x350-1.png',
                        products: products
                    }))

                    const userToken = jwt.sign({bussines}, JWT_SECRET, { expiresIn: 365 })

                    return res.status(200).json({ok: true, message: 'Usuario obtenido', token: userToken, error: '', code: 200})

        } catch (error) {
            console.error(error);
            return res.status(500).json({ok: false, message: `Error: ${error.message}`, error: error, code: 500})
        }

}
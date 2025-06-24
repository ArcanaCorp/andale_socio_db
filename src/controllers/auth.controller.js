import { JWT_SECRET } from "../config.js";
import pool from "../db/db.js";
import jwt from 'jsonwebtoken'
import { sendOTP } from "../utils/otp.js";

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
            const expires = new Date(Date.now() + 10 * 60 * 1000);
            const sqlOTP = 'INSERT INTO login_tokens (sub_bussines, code_token, created_token, expires_token) VALUES (?, ?, NOW(), ?)'
            const [ otp ] = await pool.query(sqlOTP, [ sub, code, expires ])

                if (otp.affectedRows === 0) return res.status(404).json({ok: false, message: 'No se pudo enviar el código. Inténtelo más tarde', error: 'Code Error', code: 404})

                    const payload = {
                        sub: sub
                    }

                    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1y' })

                    return res.status(201).json({ok: true, message: 'Se envio el código de verificación', token: token, error: '', code: 201})
            

        }

    } catch (error) {
        console.error(error);
        return res.status(500).json({ok: false, message: `Error: ${error.message}`, error: error, code: 500})
    }

}

export const controllerVerify = async (req, res) => {

    const authHeader = req.headers.authorization;
    const { code } = req.body;

    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ ok: false, message: 'Token no proporcionado', error: 'ERR_TOKEN_NOT_FOUND', code: 401 });

        if (!code || !/^\d{6}$/.test(code)) return res.status(401).json({ok: false, message: 'No se proporciono el código de verificación', error: 'ERR_NOT_CODE_FOUND', code: 401})

            const token = authHeader.split(' ')[1];

            try {
                
                // Verificar y decodificar el token
                const decoded = jwt.verify(token, JWT_SECRET);
                const subUser = decoded.sub;
                
                if (!subUser) return res.status(401).json({ ok: false, message: 'Token inválido: falta sub_user', code: 401 });

                    const sqlExisting = 'SELECT * FROM bussines WHERE sub_bussines = ?'
                    const [ existing ] = await pool.query(sqlExisting, [ subUser ])

                    if (existing.length === 0) return res.status(401).json({ ok: false, message: 'No existe el usuario', code: 401 });

                        const bussines = existing[0];

                        const sqlSearchToken = 'SELECT * FROM login_tokens WHERE sub_bussines = ? AND code_token = ? AND expires_token > NOW() ORDER BY created_token DESC LIMIT 1'
                        const [ searchToken ] = await pool.query(sqlSearchToken, [ subUser, code ])

                        if (searchToken.length === 0) return res.status(401).json({ok: false, message: 'Código OTP inválido o ha expirado', error: 'ERR_INVALID_OTP', code: 401})

                            const tkn = searchToken[0];
                            const id_tkn = tkn.id_token;
                            const sqlDeleteToken = 'DELETE FROM login_tokens WHERE id_token = ?'
                            await pool.query(sqlDeleteToken, [ id_tkn ])

                            const completed = bussines.name_bussines === '' ? false : true

                            return res.status(201).json({ok: true, message: 'Se verifico con éxito.', completed: completed, error: '', code: 201})

            } catch (error) {
                console.error(error);
                return res.status(500).json({ok: false, message: `Error: ${error.message}`, error: error, code: 500})
            }

}

export const controllerCompleted = async (req, res) => {

    const authHeader = req.headers.authorization;
    const { name, text, category, subcategory, location } = req.body;

    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ ok: false, message: 'Token no proporcionado', error: 'ERR_TOKEN_NOT_FOUND', code: 401 });

        if (!name || !text || !category || !subcategory || !location) return res.status(401).json({ok: false, message: 'No se proporciono la información necesaria', error: 'ERR_NOT_DATA_FOUND', code: 401})

            const token = authHeader.split(' ')[1];

            try {
                
                // Verificar y decodificar el token
                const decoded = jwt.verify(token, JWT_SECRET);
                const subUser = decoded.sub;
                
                if (!subUser) return res.status(401).json({ ok: false, message: 'Token inválido: falta sub_user', code: 401 });

                    const sqlUpdateInfo = 'UPDATE bussines SET name_bussines = ?, text_bussines = ?, category_bussines = ?, subcategory_bussines = ?, direction_bussines = ? WHERE sub_bussines = ?'
                    const [ updateInfo ] = await pool.query(sqlUpdateInfo, [ name, text, category, subcategory, location, subUser ])

                    if (updateInfo.affectedRows === 0) return res.status(404).json({ok: false, message: 'No se pudo actualizar la información', error: 'ERR_NOT_UPDATE_INFO', code: 403})

                        return res.status(201).json({ok: true, message: 'Se actualizó con éxito la información', error: '', code: 201})

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
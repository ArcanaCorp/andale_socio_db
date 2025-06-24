import multer from 'multer';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';
import { JWT_SECRET } from '../config.js';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        try {
            
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) return cb(new Error('Token no proporcionado'), null);
                const token = authHeader.split(' ')[1];
                const decoded = jwt.verify(token, JWT_SECRET);
                const sub = decoded.sub;
            
                if (!sub) return cb(new Error('Token inválido: falta sub'), null);

                    const folder = path.join(process.cwd(), 'partners', sub, 'profile');

                    fs.mkdirSync(folder, { recursive: true })

                    req.sub = sub;

                    cb(null, folder)

        } catch (error) {
            cb(error, null)
        }
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname)
        const fileName = `${Date.now()}${ext}`;
        cb(null, fileName)
    }
})

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(new Error('Formato de imagen no permitido'), false)
    }
}

export const uploadPhoto = multer({storage, fileFilter})
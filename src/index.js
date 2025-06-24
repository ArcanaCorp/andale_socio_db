import express from 'express';
import http from 'http';
import cors from 'cors';

import { PORT } from './config.js';

const app = express();
const server = http.createServer(app);

//Middlewares de Express
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

//RUTAS USER
import indexRoutes from "./routes/index.routes.js";
import authRoutes from './routes/auth.routes.js'
import bussinesRoutes from './routes/bussines.routes.js'
import partnersRoutes from './routes/partners.routes.js'
import productsRoutes from './routes/product.routes.js'

//USE ROUTERS USER
app.use('/api/v1/', indexRoutes)
app.use('/api/v1/', authRoutes)

app.use('/api/v1/', bussinesRoutes)
app.use('/api/v1/', partnersRoutes)

app.use('/api/v1/', productsRoutes)

// Manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

server.listen(PORT, () => {
    console.log(`Listening on port http://localhost:${PORT}`);
});
import { config } from "dotenv";

config()

export const {
  PORT,
  HOST_DB,
  USER_DB,
  PASSWORD_DB,
  PORT_DB,
  ENDPOINT,
  DATABASE_DB,
  JWT_SECRET,
  NODE_ENV,
  INSTANCIA_FACTILIZA,
  API_FACTILIZA_WHATSAPP
} = process.env;
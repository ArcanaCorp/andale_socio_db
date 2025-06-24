import { API_FACTILIZA_WHATSAPP, INSTANCIA_FACTILIZA } from "../config.js";

export const sendOTP = async (phone, code) => {

    if (!phone || !code) return { ok: false, message: 'No se recibieron los datos para el envio del OTP' }

    try {
        
        const response = await fetch(`https://apiwsp.factiliza.com/v1/message/sendtext/${INSTANCIA_FACTILIZA}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${API_FACTILIZA_WHATSAPP}`, 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                number: `51${phone}`,
                text: `Bienvenido a Ándale socio(a):\nEste es tu código de verificación: *${otp}*`
            })    
        })

        const data = await response.json();
        
        if (!response.ok) return { ok: false, message: data.message || 'No se pudo enviar el OTP' };
            
            return { ok: data.succes, message: data.message }

    } catch (error) {
        return { ok: false, message: 'No se pudo enviar el OTP', error: error }
    }

}
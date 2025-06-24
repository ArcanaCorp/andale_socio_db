export const controllerWelcome = async (req, res) => {
    return res.status(200).json({ok: true, message: 'Servidor activo', error: '', code: 200})
}
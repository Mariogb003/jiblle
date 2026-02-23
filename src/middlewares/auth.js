import config from '../config.js';

/**
 * Middleware de autenticación por Bearer token.
 *
 * Todas las rutas de /api/jibble requieren la cabecera:
 *   Authorization: Bearer <API_SECRET>
 *
 * El secreto se define en .env → API_SECRET.
 * Si no está configurado, el servidor arranca pero rechaza todas las peticiones
 * para avisar al administrador.
 */
const authMiddleware = (req, res, next) => {
  if (!config.apiSecret) {
    return res.status(500).json({ success: false, message: 'API_SECRET no configurado en .env' });
  }

  const authHeader = req.headers['authorization'] ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token || token !== config.apiSecret) {
    return res.status(401).json({ success: false, message: 'No autorizado. Cabecera requerida: Authorization: Bearer <API_SECRET>' });
  }

  next();
};

export default authMiddleware;

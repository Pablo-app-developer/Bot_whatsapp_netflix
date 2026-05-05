import NodeCache from 'node-cache';

/**
 * CACHE DE CONVERSACIONES
 * Almacena el historial de chat de cada usuario
 * TTL: 1 hora (3600 segundos)
 */
export const conversationCache = new NodeCache({
    stdTTL: 3600,
    checkperiod: 120,
    useClones: false
});

/**
 * CACHE DE SESIONES DE PAGO
 * Almacena referencias de pago pendientes
 * TTL: 30 minutos
 */
export const paymentCache = new NodeCache({
    stdTTL: 1800,
    checkperiod: 60
});

// Event listeners para debugging
conversationCache.on('expired', (key, value) => {
    console.log(`🗑️  Conversation cache expired for: ${key}`);
});

paymentCache.on('expired', (key, value) => {
    console.log(`🗑️  Payment cache expired for: ${key}`);
});

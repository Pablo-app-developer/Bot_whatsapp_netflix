import { logger } from '../utils/logger.js';

// Catálogo de servicios
const SERVICES = {
    netflix: {
        id: 'netflix',
        name: 'Netflix',
        keywords: ['netflix', 'netflx', 'flix'],
        plans: {
            movil: { id: 'movil', name: 'Móvil', price: 16900 },
            estandar: { id: 'estandar', name: 'Estándar', price: 26900 },
            premium: { id: 'premium', name: 'Premium', price: 38900 }
        }
    },
    max: {
        id: 'max',
        name: 'Max',
        keywords: ['max', 'hbo', 'hbomax', 'hbo max'],
        plans: {
            estandar: { id: 'estandar', name: 'Estándar', price: 19900 },
            platino: { id: 'platino', name: 'Platino', price: 29900 }
        }
    }
};

/**
 * DETECTAR INTENCIÓN DE COMPRA
 * Analiza el mensaje del usuario para detectar si quiere comprar algo
 */
export const extractPurchaseIntent = (userMessage, conversationHistory = []) => {
    const lowerMessage = userMessage.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Palabras clave de intención de compra
    const buyKeywords = [
        'quiero', 'comprar', 'dame', 'vender', 'necesito',
        'me das', 'cuanto cuesta', 'precio', 'cotizar',
        'enviar', 'pagar', 'link', 'de una', 'si'
    ];

    const hasBuyIntent = buyKeywords.some(keyword => lowerMessage.includes(keyword));

    // Detectar servicio mencionado
    let detectedService = null;
    for (const [key, service] of Object.entries(SERVICES)) {
        if (service.keywords.some(keyword => lowerMessage.includes(keyword))) {
            detectedService = service;
            break;
        }
    }

    // Detectar plan mencionado
    let detectedPlan = null;
    if (detectedService) {
        for (const [planKey, plan] of Object.entries(detectedService.plans)) {
            if (lowerMessage.includes(planKey) || lowerMessage.includes(plan.name.toLowerCase())) {
                detectedPlan = plan;
                break;
            }
        }

        // Si no se detectó plan pero está hablando de Netflix/Max, usar contexto
        if (!detectedPlan && hasBuyIntent) {
            // Revisar historial reciente para ver si mencionaron un plan antes
            const recentMessages = conversationHistory.slice(-3).map(m => m.content.toLowerCase());
            for (const msg of recentMessages) {
                for (const [planKey, plan] of Object.entries(detectedService.plans)) {
                    if (msg.includes(planKey) || msg.includes(plan.name.toLowerCase())) {
                        detectedPlan = plan;
                        break;
                    }
                }
                if (detectedPlan) break;
            }

            // Si aún no hay plan, usar el más popular (Estándar)
            if (!detectedPlan && detectedService.plans.estandar) {
                detectedPlan = detectedService.plans.estandar;
            }
        }
    }

    const hasPurchaseIntent = hasBuyIntent && detectedService && detectedPlan;

    logger.info('🔍 Intent analysis:', {
        hasBuyIntent,
        detectedService: detectedService?.name,
        detectedPlan: detectedPlan?.name,
        hasPurchaseIntent
    });

    return {
        hasPurchaseIntent,
        service: detectedService?.name,
        plan: detectedPlan?.name,
        serviceId: detectedService?.id,
        planId: detectedPlan?.id,
        price: detectedPlan?.price
    };
};

/**
 * OBTENER CATÁLOGO COMPLETO
 */
export const getCatalog = () => {
    return SERVICES;
};

/**
 * BUSCAR SERVICIO POR ID
 */
export const getServiceById = (serviceId) => {
    return SERVICES[serviceId] || null;
};

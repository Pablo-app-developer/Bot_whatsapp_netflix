import { logger } from '../utils/logger.js';

// Catálogo de servicios
const SERVICES = {
    redes: {
        id: 'redes-sociales',
        name: 'Redes Sociales que Venden',
        keywords: ['redes', 'redes sociales', 'instagram', 'tiktok', 'seguidores', 'social media'],
        plans: {
            curso: { id: 'curso', name: 'Curso', price: 10000 }
        }
    },
    finanzas: {
        id: 'finanzas',
        name: 'Finanzas Personales desde Cero',
        keywords: ['finanzas', 'plata', 'ahorrar', 'invertir', 'dinero', 'financiero'],
        plans: {
            curso: { id: 'curso', name: 'Curso', price: 10000 }
        }
    },
    canva: {
        id: 'canva',
        name: 'Canva Pro en 1 Hora',
        keywords: ['canva', 'diseño', 'disenar', 'grafico'],
        plans: {
            curso: { id: 'curso', name: 'Curso', price: 10000 }
        }
    },
    copywriting: {
        id: 'copywriting',
        name: 'Copywriting para WhatsApp',
        keywords: ['copywriting', 'copy', 'mensajes', 'escribir', 'textos', 'whatsapp'],
        plans: {
            curso: { id: 'curso', name: 'Curso', price: 10000 }
        }
    },
    productividad: {
        id: 'productividad',
        name: 'Productividad Real',
        keywords: ['productividad', 'productivo', 'rendir', 'tiempo', 'organizar', 'habitos'],
        plans: {
            curso: { id: 'curso', name: 'Curso', price: 10000 }
        }
    },
    django: {
        id: 'django',
        name: 'Django desde Cero',
        keywords: ['django', 'python', 'web', 'programar', 'programacion', 'desarrollo web', 'backend'],
        plans: {
            curso: { id: 'curso', name: 'Curso', price: 10000 }
        }
    },
    hacking: {
        id: 'hacking-etico',
        name: 'Hacking Ético',
        keywords: ['hacking', 'hack', 'etico', 'ciberseguridad', 'seguridad', 'pentest', 'hackers'],
        plans: {
            curso: { id: 'curso', name: 'Curso', price: 10000 }
        }
    },
    excel: {
        id: 'excel',
        name: 'Excel que Sí Usas',
        keywords: ['excel', 'hoja de calculo', 'tablas', 'formulas', 'spreadsheet'],
        plans: {
            curso: { id: 'curso', name: 'Curso', price: 10000 }
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
        'quiero', 'comprar', 'dame', 'necesito', 'me das',
        'cuanto cuesta', 'precio', 'pagar', 'link', 'de una',
        'si', 'sí', 'listo', 'dale', 'claro', 'va', 'bueno',
        'me interesa', 'interesado', 'interesada', 'lo quiero',
        'la quiero', 'tomarlo', 'adquirir', 'ok', 'okay'
    ];

    const hasBuyIntent = buyKeywords.some(keyword => lowerMessage.includes(keyword));

    // Detectar servicio mencionado en el mensaje actual
    let detectedService = null;
    for (const [key, service] of Object.entries(SERVICES)) {
        if (service.keywords.some(keyword => lowerMessage.includes(keyword))) {
            detectedService = service;
            break;
        }
    }

    // Si no se detectó en el mensaje actual, buscar en historial reciente
    if (!detectedService && conversationHistory.length > 0) {
        const recentTexts = conversationHistory.slice(-6).map(m =>
            m.content.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
        );
        for (const text of recentTexts.reverse()) {
            for (const [key, service] of Object.entries(SERVICES)) {
                if (service.keywords.some(keyword => text.includes(keyword))) {
                    detectedService = service;
                    break;
                }
            }
            if (detectedService) break;
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

            // Todos los cursos tienen un solo plan: 'curso' — usarlo por defecto
            if (!detectedPlan) {
                detectedPlan = detectedService.plans.curso;
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

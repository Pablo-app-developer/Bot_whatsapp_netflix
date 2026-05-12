import { logger } from '../utils/logger.js';

const SERVICES = {
    hacking: {
        id: 'hacking-etico',
        name: 'Hacking Ético',
        keywords: ['hacking', 'hack', 'etico', 'ciberseguridad', 'seguridad', 'pentest', 'hackers', 'kali', 'metasploit'],
        plans: { curso: { id: 'curso', name: 'Curso', price: 10000 } }
    },
    python: {
        id: 'python',
        name: 'Python desde Cero',
        keywords: ['python'],
        plans: { curso: { id: 'curso', name: 'Curso', price: 10000 } }
    },
    django: {
        id: 'django',
        name: 'Django desde Cero',
        keywords: ['django', 'desarrollo web', 'backend', 'framework'],
        plans: { curso: { id: 'curso', name: 'Curso', price: 10000 } }
    },
    excel: {
        id: 'excel',
        name: 'Excel que Sí Usas',
        keywords: ['excel', 'hoja de calculo', 'tablas', 'formulas', 'spreadsheet', 'tablas dinamicas'],
        plans: { curso: { id: 'curso', name: 'Curso', price: 10000 } }
    },
    canva: {
        id: 'canva',
        name: 'Canva Pro en 1 Hora',
        keywords: ['canva', 'diseno', 'diseño', 'grafico'],
        plans: { curso: { id: 'curso', name: 'Curso', price: 10000 } }
    },
    copywriting: {
        id: 'copywriting',
        name: 'Copywriting para WhatsApp',
        keywords: ['copywriting', 'copy', 'redaccion', 'persuasion'],
        plans: { curso: { id: 'curso', name: 'Curso', price: 10000 } }
    },
    productividad: {
        id: 'productividad',
        name: 'Productividad Real',
        keywords: ['productividad', 'productivo', 'habitos', 'organizacion', 'tiempo'],
        plans: { curso: { id: 'curso', name: 'Curso', price: 10000 } }
    },
    redes: {
        id: 'redes-sociales',
        name: 'Redes Sociales que Venden',
        keywords: ['redes', 'redes sociales', 'instagram', 'tiktok', 'seguidores', 'social media'],
        plans: { curso: { id: 'curso', name: 'Curso', price: 10000 } }
    },
    finanzas: {
        id: 'finanzas',
        name: 'Finanzas Personales desde Cero',
        keywords: ['finanzas', 'dinero', 'ahorrar', 'invertir', 'financiero'],
        plans: { curso: { id: 'curso', name: 'Curso', price: 10000 } }
    }
};

const BUY_KEYWORDS = [
    'quiero', 'comprar', 'dame', 'necesito', 'me das',
    'cuanto cuesta', 'precio', 'pagar', 'link', 'de una',
    'si', 'sí', 'listo', 'dale', 'claro', 'va', 'bueno',
    'me interesa', 'interesado', 'interesada', 'lo quiero',
    'la quiero', 'tomarlo', 'adquirir', 'ok', 'okay', 'perfecto'
];

const normalize = (text) =>
    text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// Detecta qué servicio se menciona en un texto (sin requerir intención de compra)
export const detectService = (text) => {
    const norm = normalize(text);
    for (const service of Object.values(SERVICES)) {
        if (service.keywords.some(k => norm.includes(normalize(k)))) {
            return service;
        }
    }
    return null;
};

// Detecta si el mensaje tiene intención de compra
export const hasBuyIntent = (text) => {
    const norm = normalize(text);
    return BUY_KEYWORDS.some(k => norm.includes(normalize(k)));
};

export const extractPurchaseIntent = (userMessage) => {
    const buyIntent = hasBuyIntent(userMessage);
    const service = detectService(userMessage);
    const plan = service?.plans?.curso ?? null;

    const hasPurchaseIntent = buyIntent && !!service;

    logger.info('🔍 Intent:', {
        buyIntent,
        service: service?.name,
        hasPurchaseIntent
    });

    return {
        hasPurchaseIntent,
        hasServiceMention: !!service,
        hasBuyIntent: buyIntent,
        service: service?.name,
        plan: plan?.name,
        serviceId: service?.id,
        planId: plan?.id,
        price: plan?.price
    };
};

export const getCatalog = () => SERVICES;
export const getServiceById = (id) => Object.values(SERVICES).find(s => s.id === id) || null;

import { createOrder, findOrderByReference, updateOrderStatus } from './orderService.js';
import { deliverCourse } from './credentialService.js';
import { logger } from '../utils/logger.js';

const BOLD_SECRET_KEY = process.env.BOLD_SECRET_KEY;
const BASE_URL = process.env.BASE_URL || 'https://botwhatsappnetflix-production.up.railway.app';

export const getPaymentLink = async (courseSlug, courseName, customerPhone) => {
    const amount = 10000; // COP
    const reference = `FPT-${courseSlug}-${Date.now()}-${customerPhone.slice(-4)}`;

    createOrder({
        reference,
        phone: customerPhone,
        service: courseSlug,
        plan: 'curso',
        amount,
    });

    logger.info('🔑 Bold key configured:', !!BOLD_SECRET_KEY);

    let response;
    try {
        response = await fetch('https://integrations.bold.co/integration/payment/link/v1', {
            method: 'POST',
            headers: {
                'Authorization': `x-api-key ${BOLD_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount_type: 'CLOSE',
                amount: {
                    currency: 'COP',
                    total_amount: amount,
                },
                description: `Curso: ${courseName}`,
                reference,
                expiration_date: '2099-12-31',
                callback_url: 'https://formacionparatodos.online',
            }),
        });
    } catch (fetchError) {
        logger.error('❌ Error de red al llamar Bold:', {
            message: fetchError.message,
            code: fetchError.cause?.code,
            cause: String(fetchError.cause),
        });
        throw fetchError;
    }

    const data = await response.json();
    logger.info('📡 Bold API response:', { status: response.status, data: JSON.stringify(data) });

    if (!response.ok) {
        logger.error('❌ Bold API error:', { status: response.status, body: data });
        throw new Error(`Bold API error ${response.status}`);
    }

    const url = data?.payload?.url || data?.url || data?.payment_url || data?.link;
    if (!url) {
        logger.error('❌ Bold no devolvió URL. Respuesta completa:', JSON.stringify(data));
        throw new Error('Bold no devolvió link de pago');
    }

    logger.info('💳 Link Bold generado:', { course: courseSlug, reference, customer: customerPhone });

    return { url, reference, amount, course: courseSlug };
};

export const handleBoldWebhook = async (webhookData) => {
    try {
        const { type, data } = webhookData;

        if (!data) {
            logger.warn('⚠️ Bold webhook sin datos de transacción');
            return { processed: false };
        }

        logger.info('📥 Bold webhook recibido:', {
            type,
            reference: data.reference,
            status: data.status,
        });

        if (type === 'PAYMENT' && data.status === 'APPROVED') {
            const order = findOrderByReference(data.reference);

            if (!order) {
                logger.error('❌ Orden no encontrada para referencia:', data.reference);
                return { processed: false, error: 'order_not_found' };
            }

            if (order.status === 'approved') {
                logger.warn('⚠️ Orden ya procesada:', data.reference);
                return { processed: true };
            }

            updateOrderStatus(data.reference, 'approved');
            await deliverCourse(order);

            logger.info('✅ Curso entregado:', { reference: data.reference, phone: order.phone });
            return { processed: true };
        }

        return { processed: true };

    } catch (error) {
        logger.error('❌ Error procesando webhook Bold:', error);
        throw error;
    }
};

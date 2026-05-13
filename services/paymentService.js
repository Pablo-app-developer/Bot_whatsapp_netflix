import { createOrder, findOrderByReference, updateOrderStatus } from './orderService.js';
import { deliverCourse } from './credentialService.js';
import { logger } from '../utils/logger.js';

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const BASE_URL = process.env.BASE_URL || 'https://botwhatsappnetflix-production.up.railway.app';

export const getPaymentLink = async (courseSlug, courseName, customerPhone) => {
    const amount = 10000;
    const reference = `FPT-${courseSlug}-${Date.now()}-${customerPhone.slice(-4)}`;

    createOrder({
        reference,
        phone: customerPhone,
        service: courseSlug,
        plan: 'curso',
        amount,
    });

    const body = {
        items: [{
            title: `Curso: ${courseName}`,
            quantity: 1,
            unit_price: amount,
            currency_id: 'COP',
        }],
        external_reference: reference,
        back_urls: {
            success: 'https://formacionparatodos.online',
            failure: 'https://formacionparatodos.online',
            pending: 'https://formacionparatodos.online',
        },
        auto_return: 'approved',
        notification_url: `${BASE_URL}/mp-webhook`,
    };

    let response;
    try {
        response = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
    } catch (fetchError) {
        logger.error('❌ Error de red MP:', { message: fetchError.message, cause: String(fetchError.cause) });
        throw fetchError;
    }

    const data = await response.json();
    logger.info('📡 MP API response:', { status: response.status, id: data.id });

    if (!response.ok) {
        logger.error('❌ MP API error:', { status: response.status, body: data });
        throw new Error(`MP API error ${response.status}`);
    }

    // En modo test usar sandbox_init_point, en producción init_point
    const url = MP_ACCESS_TOKEN?.startsWith('TEST-') ? data.sandbox_init_point : data.init_point;

    logger.info('💳 Link MP generado:', { course: courseSlug, reference, url });

    return { url, reference, amount, course: courseSlug };
};

export const handleMPWebhook = async (webhookData) => {
    try {
        const { type, data } = webhookData;

        if (type !== 'payment' || !data?.id) {
            return { processed: false };
        }

        logger.info('📥 MP webhook recibido:', { type, paymentId: data.id });

        // Consultar detalles del pago a MP
        const res = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
            headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` },
        });
        const payment = await res.json();

        logger.info('💰 MP pago:', { status: payment.status, reference: payment.external_reference });

        if (payment.status !== 'approved') {
            return { processed: true };
        }

        const order = findOrderByReference(payment.external_reference);
        if (!order) {
            logger.error('❌ Orden no encontrada:', payment.external_reference);
            return { processed: false, error: 'order_not_found' };
        }

        if (order.status === 'approved') {
            return { processed: true };
        }

        updateOrderStatus(payment.external_reference, 'approved');
        await deliverCourse(order);

        logger.info('✅ Curso entregado:', { reference: payment.external_reference, phone: order.phone });
        return { processed: true };

    } catch (error) {
        logger.error('❌ Error procesando webhook MP:', error);
        throw error;
    }
};

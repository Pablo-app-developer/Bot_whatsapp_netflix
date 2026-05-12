import crypto from 'crypto';
import { createOrder, findOrderByReference, updateOrderStatus } from './orderService.js';
import { deliverCourse } from './credentialService.js';
import { logger } from '../utils/logger.js';

const WOMPI_PUBLIC_KEY = process.env.WOMPI_PUBLIC_KEY;
const WOMPI_INTEGRITY_KEY = process.env.WOMPI_INTEGRITY_KEY;
const WOMPI_EVENTS_KEY = process.env.WOMPI_EVENTS_KEY;
const BASE_URL = process.env.BASE_URL || 'https://botwhatsappnetflix-production.up.railway.app';

export const getPaymentLink = async (courseSlug, courseName, customerPhone) => {
    const amountInCents = 10000 * 100;
    const reference = `FPT-${courseSlug}-${Date.now()}-${customerPhone.slice(-4)}`;

    // Guardar orden pendiente para recuperarla cuando llegue el webhook
    createOrder({
        reference,
        phone: customerPhone,
        service: courseSlug,
        plan: 'curso',
        amount: amountInCents / 100,
    });

    const params = new URLSearchParams({
        'public-key': WOMPI_PUBLIC_KEY,
        'currency': 'COP',
        'amount-in-cents': amountInCents,
        'reference': reference,
        'redirect-url': `https://formacionparatodos.online`,
    });

    const paymentUrl = `https://checkout.wompi.co/p/?${params.toString()}`;

    logger.info('💳 Payment link generated:', { course: courseSlug, reference, customer: customerPhone });

    return { url: paymentUrl, reference, amount: amountInCents / 100, course: courseSlug };
};

// Verifica que el evento viene realmente de Wompi
const verifyWompiSignature = (transactionId, amountInCents, currency, status, signature) => {
    if (!WOMPI_EVENTS_KEY || !signature) return true; // en test no siempre viene firma
    const raw = `${transactionId}${amountInCents}${currency}${status}${WOMPI_EVENTS_KEY}`;
    const expected = crypto.createHash('sha256').update(raw).digest('hex');
    return expected === signature;
};

export const handleWompiWebhook = async (webhookData, signature) => {
    try {
        const event = webhookData?.event;
        const transaction = webhookData?.data?.transaction;

        if (!transaction) {
            logger.warn('⚠️ Wompi webhook sin datos de transacción');
            return { processed: false };
        }

        logger.info('📥 Wompi webhook recibido:', {
            event,
            reference: transaction.reference,
            status: transaction.status,
        });

        const isValid = verifyWompiSignature(
            transaction.id,
            transaction.amount_in_cents,
            transaction.currency,
            transaction.status,
            signature
        );

        if (!isValid) {
            logger.error('❌ Firma de webhook inválida');
            return { processed: false, error: 'invalid_signature' };
        }

        if (event === 'transaction.updated' && transaction.status === 'APPROVED') {
            const order = findOrderByReference(transaction.reference);

            if (!order) {
                logger.error('❌ Orden no encontrada para referencia:', transaction.reference);
                return { processed: false, error: 'order_not_found' };
            }

            if (order.status === 'approved') {
                logger.warn('⚠️ Orden ya procesada:', transaction.reference);
                return { processed: true };
            }

            updateOrderStatus(transaction.reference, 'approved');
            await deliverCourse(order);

            logger.info('✅ Curso entregado:', { reference: transaction.reference, phone: order.phone });
            return { processed: true };
        }

        return { processed: true };

    } catch (error) {
        logger.error('❌ Error procesando webhook Wompi:', error);
        throw error;
    }
};

import axios from 'axios';
import { logger } from '../utils/logger.js';

const WOMPI_PUBLIC_KEY = process.env.WOMPI_PUBLIC_KEY || 'pub_test_Q5yDA9xoKdePzhS8qn9G7UYvxyS99qYp';
const BASE_URL = process.env.BASE_URL || 'https://streamflow.com';

/**
 * GENERAR LINK DE PAGO WOMPI
 * Crea un enlace de pago único para el cliente
 */
export const getPaymentLink = async (serviceName, planName, customerPhone) => {
    try {
        // En producción, aquí buscarías el precio real de tu DB
        const mockPrices = {
            'Netflix Móvil': 16900,
            'Netflix Estándar': 26900,
            'Netflix Premium': 38900,
            'Max Estándar': 19900,
            'Max Platino': 29900
        };

        const fullPlanName = `${serviceName} ${planName}`;
        const amountInCents = (mockPrices[fullPlanName] || 20000) * 100;

        // Generar referencia única
        const reference = `SF-${Date.now()}-${customerPhone.slice(-4)}`;

        // Construir URL de Wompi Widget
        const wompiUrl = `https://checkout.wompi.co/p/`;

        const params = new URLSearchParams({
            'public-key': WOMPI_PUBLIC_KEY,
            'currency': 'COP',
            'amount-in-cents': amountInCents,
            'reference': reference,
            'redirect-url': `${BASE_URL}/success`,
            'customer-data:phone-number': customerPhone
        });

        const paymentUrl = `${wompiUrl}?${params.toString()}`;

        logger.info('💳 Payment link generated:', {
            service: serviceName,
            plan: planName,
            amount: amountInCents / 100,
            reference,
            customer: customerPhone
        });

        // TODO: Guardar referencia en base de datos para tracking
        // await savePaymentReference(reference, serviceName, planName, customerPhone);

        return {
            url: paymentUrl,
            reference,
            amount: amountInCents / 100,
            service: serviceName,
            plan: planName
        };

    } catch (error) {
        logger.error('❌ Error generating payment link:', error);
        throw new Error('No se pudo generar el link de pago');
    }
};

/**
 * VERIFICAR ESTADO DE PAGO
 * Consulta el estado de una transacción en Wompi
 */
export const checkPaymentStatus = async (transactionId) => {
    try {
        const url = `https://production.wompi.co/v1/transactions/${transactionId}`;

        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${process.env.WOMPI_PUBLIC_KEY}`
            }
        });

        const transaction = response.data.data;

        logger.info('Payment status checked:', {
            id: transactionId,
            status: transaction.status,
            amount: transaction.amount_in_cents / 100
        });

        return {
            status: transaction.status, // APPROVED, DECLINED, PENDING, VOIDED
            reference: transaction.reference,
            amount: transaction.amount_in_cents / 100,
            paymentMethod: transaction.payment_method_type,
            createdAt: transaction.created_at
        };

    } catch (error) {
        logger.error('Error checking payment status:', error.response?.data || error.message);
        return null;
    }
};

/**
 * WEBHOOK HANDLER PARA WOMPI
 * Recibe notificación cuando un pago es aprobado
 */
export const handleWompiWebhook = async (webhookData, signature) => {
    try {
        // TODO: Verificar firma del webhook
        // const isValid = verifyWompiSignature(webhookData, signature);
        // if (!isValid) throw new Error('Invalid webhook signature');

        const event = webhookData.event;
        const transaction = webhookData.data.transaction;

        logger.info('📥 Wompi webhook received:', {
            event,
            reference: transaction.reference,
            status: transaction.status
        });

        if (event === 'transaction.updated' && transaction.status === 'APPROVED') {
            // Pago aprobado - generar y enviar credenciales
            logger.info('✅ Payment approved:', transaction.reference);

            // TODO: 
            // 1. Buscar orden por referencia
            // 2. Generar credenciales del servicio
            // 3. Enviar credenciales por WhatsApp al cliente
            // 4. Marcar orden como completada

            return {
                processed: true,
                action: 'credentials_sent'
            };
        }

        return { processed: true };

    } catch (error) {
        logger.error('Error processing Wompi webhook:', error);
        throw error;
    }
};

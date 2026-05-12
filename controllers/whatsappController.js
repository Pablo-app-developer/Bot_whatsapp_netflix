import { sendWhatsAppMessage, markMessageAsRead } from '../services/whatsappService.js';
import { getAIResponse } from '../services/geminiService.js';
import { extractPurchaseIntent } from '../services/intentService.js';
import { getPaymentLink } from '../services/paymentService.js';
import { isAdminCommand, processAdminCommand } from '../services/adminService.js';
import { deliverCourse } from '../services/credentialService.js';
import { findOrderByReference, updateOrderStatus } from '../services/orderService.js';
import { logger } from '../utils/logger.js';
import { conversationCache } from '../utils/cache.js';
import crypto from 'crypto';

export const verifyWebhook = (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
        logger.info('✅ Webhook verified');
        res.status(200).send(challenge);
    } else {
        logger.error('❌ Webhook verification failed');
        res.status(403).json({ error: 'Forbidden' });
    }
};

export const handleIncomingMessage = async (req, res) => {
    try {
        res.sendStatus(200);

        const body = req.body;
        if (!body.object || body.object !== 'whatsapp_business_account') return;

        const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
        if (!message) return;

        const from = message.from;
        const messageId = message.id;
        const messageType = message.type;

        logger.info(`📩 Message from ${from} [${messageType}]`);
        await markMessageAsRead(messageId);

        if (messageType !== 'text') {
            await sendWhatsAppMessage(from, {
                type: 'text',
                text: { body: 'Hola! Escríbeme un mensaje de texto para ayudarte 😊' },
            });
            return;
        }

        const userMessage = message.text.body;
        logger.info(`💬 "${userMessage}"`);

        // ── Admin commands ─────────────────────────────────────────
        if (isAdminCommand(from, userMessage)) {
            const response = processAdminCommand(userMessage);
            await sendWhatsAppMessage(from, { type: 'text', text: { body: response } });
            return;
        }

        // ── Normal flow ────────────────────────────────────────────
        const history = conversationCache.get(from) || [];
        history.push({ role: 'user', content: userMessage, timestamp: new Date().toISOString() });

        const purchaseIntent = extractPurchaseIntent(userMessage, history);
        let responseText;

        if (purchaseIntent.hasPurchaseIntent) {
            logger.info('🛒 Purchase intent:', purchaseIntent);
            responseText = await getAIResponse(history, {
                forceCheckout: true,
                service: purchaseIntent.service,
                plan: purchaseIntent.plan,
            });
        } else {
            responseText = await getAIResponse(history);
        }

        history.push({ role: 'assistant', content: responseText, timestamp: new Date().toISOString() });
        conversationCache.set(from, history.slice(-20));

        await sendWhatsAppMessage(from, { type: 'text', text: { body: responseText } });

        // Send payment link if purchase detected
        if (purchaseIntent.hasPurchaseIntent) {
            // getPaymentLink ya guarda la orden internamente
            const paymentData = await getPaymentLink(purchaseIntent.serviceId, purchaseIntent.service, from);

            await sendWhatsAppMessage(from, {
                type: 'text',
                text: { body: `💳 *Link de pago seguro (Wompi):*\n\n${paymentData.url}\n\n✅ El material se envía automáticamente al confirmar el pago.` },
            });
        }

        logger.info('✅ Message processed');
    } catch (err) {
        logger.error('❌ Error handling message:', err);
    }
};

// ── Wompi payment webhook ─────────────────────────────────────────────────────

export const handleWompiWebhook = async (req, res) => {
    try {
        res.sendStatus(200);

        const event = req.body?.event;
        const transaction = req.body?.data?.transaction;

        logger.info(`💳 Wompi event: ${event} | status: ${transaction?.status}`);

        if (event !== 'transaction.updated' || transaction?.status !== 'APPROVED') return;

        const reference = transaction.reference;
        const order = findOrderByReference(reference);

        if (!order) {
            logger.warn(`⚠️ No order found for reference: ${reference}`);
            return;
        }

        if (order.status === 'approved') {
            logger.info(`Order ${reference} already processed`);
            return;
        }

        logger.info(`✅ Payment approved for ${reference} — delivering course`);
        await deliverCourse(order);

    } catch (err) {
        logger.error('❌ Wompi webhook error:', err);
    }
};

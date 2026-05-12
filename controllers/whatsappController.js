import { sendWhatsAppMessage, markMessageAsRead } from '../services/whatsappService.js';
import { getAIResponse } from '../services/geminiService.js';
import { extractPurchaseIntent, detectService, hasBuyIntent } from '../services/intentService.js';
import { getPaymentLink } from '../services/paymentService.js';
import { isAdminCommand, processAdminCommand } from '../services/adminService.js';
import { deliverCourse } from '../services/credentialService.js';
import { findOrderByReference, updateOrderStatus } from '../services/orderService.js';
import { logger } from '../utils/logger.js';
import { conversationCache, paymentCache } from '../utils/cache.js';

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
                text: { body: 'Escríbeme un mensaje de texto para ayudarte.' },
            });
            return;
        }

        const userMessage = message.text.body;
        logger.info(`💬 "${userMessage}"`);

        // ── Admin ──────────────────────────────────────────────────
        if (isAdminCommand(from, userMessage)) {
            const response = processAdminCommand(userMessage);
            await sendWhatsAppMessage(from, { type: 'text', text: { body: response } });
            return;
        }

        // ── Detectar servicio y compra ─────────────────────────────
        const intent = extractPurchaseIntent(userMessage);

        // Si se menciona un curso, guardarlo en el cache de sesión
        if (intent.hasServiceMention) {
            paymentCache.set(`service:${from}`, {
                serviceId: intent.serviceId,
                serviceName: intent.service,
            });
            logger.info(`💾 Servicio guardado en sesión: ${intent.serviceId}`);
        }

        // Si hay intención de compra pero el curso no está en el mensaje actual,
        // buscarlo en el cache de sesión (mencionado antes en la conversación)
        let targetService = null;
        if (intent.hasBuyIntent) {
            if (intent.serviceId) {
                targetService = { serviceId: intent.serviceId, serviceName: intent.service };
            } else {
                const cached = paymentCache.get(`service:${from}`);
                if (cached) {
                    targetService = cached;
                    logger.info(`📦 Servicio recuperado del cache: ${cached.serviceId}`);
                }
            }
        }

        const shouldSendLink = intent.hasBuyIntent && !!targetService;

        // ── Respuesta IA ───────────────────────────────────────────
        const history = conversationCache.get(from) || [];
        history.push({ role: 'user', content: userMessage, timestamp: new Date().toISOString() });

        const responseText = await getAIResponse(history, shouldSendLink ? {
            forceCheckout: true,
            service: targetService?.serviceName,
            plan: 'Curso',
        } : {});

        history.push({ role: 'assistant', content: responseText, timestamp: new Date().toISOString() });
        conversationCache.set(from, history.slice(-20));

        await sendWhatsAppMessage(from, { type: 'text', text: { body: responseText } });

        // ── Enviar link de pago ────────────────────────────────────
        if (shouldSendLink) {
            try {
                const paymentData = await getPaymentLink(targetService.serviceId, targetService.serviceName, from);
                await sendWhatsAppMessage(from, {
                    type: 'text',
                    text: { body: `💳 *Link de pago seguro:*\n\n${paymentData.url}\n\n✅ El material se envía automáticamente por WhatsApp al confirmar el pago.` },
                });
                logger.info(`💳 Link enviado a ${from} para ${targetService.serviceId}`);
            } catch (payErr) {
                logger.error('❌ Error enviando link de pago:', payErr);
            }
        }

    } catch (err) {
        logger.error('❌ Error handling message:', err);
    }
};

// ── Wompi webhook ─────────────────────────────────────────────────────────────
export const handleWompiWebhook = async (req, res) => {
    try {
        res.sendStatus(200);

        const event = req.body?.event;
        const transaction = req.body?.data?.transaction;

        logger.info(`💳 Wompi event: ${event} | status: ${transaction?.status}`);

        if (event !== 'transaction.updated' || transaction?.status !== 'APPROVED') return;

        const order = findOrderByReference(transaction.reference);
        if (!order) {
            logger.warn(`⚠️ Orden no encontrada: ${transaction.reference}`);
            return;
        }
        if (order.status === 'approved') return;

        updateOrderStatus(transaction.reference, 'approved');
        await deliverCourse(order);

    } catch (err) {
        logger.error('❌ Wompi webhook error:', err);
    }
};

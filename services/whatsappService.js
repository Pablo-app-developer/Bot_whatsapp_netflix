import axios from 'axios';
import { logger } from '../utils/logger.js';

const WHATSAPP_API_URL = 'https://graph.facebook.com/v21.0';
const PHONE_NUMBER_ID = () => process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = () => process.env.WHATSAPP_API_TOKEN;

/**
 * ENVIAR MENSAJE DE WHATSAPP
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages
 */
export const sendWhatsAppMessage = async (to, messageData) => {
    try {
        const url = `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID()}/messages`;

        const payload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: to,
            ...messageData
        };

        logger.info('📤 Sending WhatsApp message:', { to, type: messageData.type });

        const response = await axios.post(url, payload, {
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN()}`,
                'Content-Type': 'application/json'
            }
        });

        logger.info('✅ Message sent successfully:', response.data);
        return response.data;

    } catch (error) {
        logger.error('❌ Error sending WhatsApp message:', {
            error: error.response?.data || error.message,
            to
        });
        throw error;
    }
};

/**
 * MARCAR MENSAJE COMO LEÍDO
 */
export const markMessageAsRead = async (messageId) => {
    try {
        const url = `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID()}/messages`;

        await axios.post(url, {
            messaging_product: 'whatsapp',
            status: 'read',
            message_id: messageId
        }, {
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN()}`,
                'Content-Type': 'application/json'
            }
        });

        logger.info('✅ Message marked as read:', messageId);
    } catch (error) {
        logger.error('Error marking message as read:', error.response?.data || error.message);
    }
};

/**
 * ENVIAR MENSAJE CON BOTONES INTERACTIVOS
 */
export const sendInteractiveButtons = async (to, bodyText, buttons) => {
    const messageData = {
        type: 'interactive',
        interactive: {
            type: 'button',
            body: {
                text: bodyText
            },
            action: {
                buttons: buttons.map((btn, idx) => ({
                    type: 'reply',
                    reply: {
                        id: btn.id || `btn_${idx}`,
                        title: btn.title.substring(0, 20) // Max 20 chars
                    }
                }))
            }
        }
    };

    return sendWhatsAppMessage(to, messageData);
};

/**
 * ENVIAR MENSAJE CON LISTA DE OPCIONES
 */
export const sendInteractiveList = async (to, bodyText, buttonText, sections) => {
    const messageData = {
        type: 'interactive',
        interactive: {
            type: 'list',
            body: {
                text: bodyText
            },
            action: {
                button: buttonText,
                sections: sections
            }
        }
    };

    return sendWhatsAppMessage(to, messageData);
};

/**
 * ENVIAR IMAGEN
 */
export const sendImage = async (to, imageUrl, caption) => {
    const messageData = {
        type: 'image',
        image: {
            link: imageUrl,
            caption: caption
        }
    };

    return sendWhatsAppMessage(to, messageData);
};

/**
 * ENVIAR DOCUMENTO
 */
export const sendDocument = async (to, documentUrl, filename, caption) => {
    const messageData = {
        type: 'document',
        document: {
            link: documentUrl,
            filename: filename,
            caption: caption
        }
    };

    return sendWhatsAppMessage(to, messageData);
};

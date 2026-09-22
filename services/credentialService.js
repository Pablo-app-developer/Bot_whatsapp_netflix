import { sendWhatsAppMessage } from './whatsappService.js';
import { getBookById } from './catalogService.js';
import { logger } from '../utils/logger.js';

export const deliverBook = async (order) => {
    const { phone, bookId, reference } = order;
    const book = getBookById(bookId);

    if (!book) {
        logger.error(`❌ Libro no encontrado en catálogo: ${bookId}`);
        const adminPhone = process.env.ADMIN_PHONE;
        if (adminPhone) {
            await sendWhatsAppMessage(adminPhone, {
                type: 'text',
                text: { body: `🚨 *Pago recibido con bookId inválido*\nID: ${bookId}\nCliente: ${phone}\nRef: ${reference}` },
            });
        }
        await sendWhatsAppMessage(phone, {
            type: 'text',
            text: { body: '✅ Pago confirmado. Te enviamos el acceso en unos minutos.' },
        });
        return false;
    }

    const msg =
        `✅ *Pago confirmado — acceso listo* 🎉\n\n` +
        `📖 *${book.title}*\n` +
        `📁 ${book.category}\n\n` +
        `📂 *Tu material:*\n${book.url}\n\n` +
        `📌 Guarda este link — es tu acceso de por vida.\n` +
        `Cualquier problema responde aquí mismo.`;

    await sendWhatsAppMessage(phone, { type: 'text', text: { body: msg } });
    logger.info(`✅ Libro entregado a ${phone}: ${book.title}`);
    return true;
};


import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { sendWhatsAppMessage } from './whatsappService.js';
import { logger } from '../utils/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const coursesPath = join(__dirname, '../data/courses.json');

const getCourses = () => JSON.parse(readFileSync(coursesPath, 'utf8'));

export const deliverCourse = async (order) => {
    const { phone, service: courseSlug, reference } = order;
    const courses = getCourses();
    const course = courses[courseSlug];

    if (!course) {
        logger.error(`❌ Curso no encontrado en catálogo: ${courseSlug}`);
        await sendWhatsAppMessage(phone, {
            type: 'text',
            text: { body: '✅ Pago confirmado. Estamos preparando tu acceso, te lo enviamos en unos minutos.' },
        });
        return false;
    }

    if (!course.driveLink) {
        // Curso sin link aún — notificar admin
        logger.error(`❌ Sin link para curso: ${courseSlug}`);
        const adminPhone = process.env.ADMIN_PHONE;
        if (adminPhone) {
            await sendWhatsAppMessage(adminPhone, {
                type: 'text',
                text: { body: `🚨 *Pago recibido sin link configurado*\nCurso: ${course.name}\nCliente: ${phone}\nRef: ${reference}\n\n⚡ Agrega el link en data/courses.json` },
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
        `${course.emoji} *${course.name}*\n\n` +
        `📂 *Tu material de estudio:*\n` +
        `${course.driveLink}\n\n` +
        `📌 Guarda este link — es tu acceso de por vida.\n` +
        `Cualquier problema responde aquí mismo.`;

    await sendWhatsAppMessage(phone, { type: 'text', text: { body: msg } });
    logger.info(`✅ Curso entregado a ${phone}: ${course.name}`);
    return true;
};

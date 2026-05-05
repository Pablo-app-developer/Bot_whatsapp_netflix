import { sendWhatsAppMessage } from './whatsappService.js';
import { getAvailableAccount, assignAccount } from './inventoryService.js';
import { updateOrderStatus, saveClient } from './orderService.js';
import { logger } from '../utils/logger.js';

const SERVICE_EMOJI = { netflix: '📺', max: '🎬' };
const PLAN_LABEL = {
    movil: 'Móvil',
    estandar: 'Estándar',
    premium: 'Premium',
    platino: 'Platino',
};

export const deliverCredentials = async (order) => {
    const { phone, service, plan, reference } = order;

    const account = getAvailableAccount(service, plan);
    if (!account) {
        logger.error(`❌ No available accounts for ${service} ${plan}`);

        await sendWhatsAppMessage(phone, {
            type: 'text',
            text: { body: '✅ *Pago confirmado!* Gracias parce 💫\n\n⚠️ Estoy preparando tu cuenta, te la envío en unos minutos. Si en 10 min no llega escríbeme de una.' },
        });

        // Notify admin
        const adminPhone = process.env.ADMIN_PHONE;
        if (adminPhone) {
            await sendWhatsAppMessage(adminPhone, {
                type: 'text',
                text: { body: `🚨 *ALERTA: Sin stock!*\nPago aprobado pero no hay cuentas disponibles.\n\nCliente: ${phone}\nServicio: ${service} ${plan}\nRef: ${reference}\n\n⚡ Agrega una cuenta con:\n!agregar ${service} ${plan} email pass Perfil PIN` },
            });
        }
        return false;
    }

    const assigned = assignAccount(account.id, phone);
    updateOrderStatus(reference, 'approved', account.id);
    saveClient({ phone, service, plan, accountId: account.id });

    const emoji = SERVICE_EMOJI[service] || '🎬';
    const planLabel = PLAN_LABEL[plan] || plan;
    const serviceName = service.charAt(0).toUpperCase() + service.slice(1);

    let msg = `✅ *Pago confirmado! Tu cuenta está lista* 🎉\n\n`;
    msg += `${emoji} *${serviceName} ${planLabel}*\n\n`;
    msg += `📧 *Correo:* ${assigned.email}\n`;
    msg += `🔑 *Contraseña:* ${assigned.password}\n`;

    if (assigned.profileName) {
        msg += `\n👤 *Tu perfil:* ${assigned.profileName}\n`;
    }
    if (assigned.profilePin) {
        msg += `🔢 *PIN del perfil:* ${assigned.profilePin}\n`;
    }

    msg += `\n⚠️ *Importante:*\n`;
    msg += `• Usa SOLO tu perfil\n`;
    msg += `• NO cambies la contraseña\n`;
    msg += `• Garantía total por 30 días\n\n`;
    msg += `Cualquier problema me avisas de una 💫`;

    await sendWhatsAppMessage(phone, { type: 'text', text: { body: msg } });
    logger.info(`✅ Credentials delivered to ${phone}: ${service} ${plan}`);
    return true;
};

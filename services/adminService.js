import { addAccount, listAccounts, getInventoryStats, releaseAccount, getAccountById } from './inventoryService.js';
import { listOrders, listClients, getClientByPhone } from './orderService.js';
import { logger } from '../utils/logger.js';

const ADMIN_PHONE = () => process.env.ADMIN_PHONE;
const ADMIN_KEY = () => process.env.ADMIN_KEY || '!admin';

export const isAdminCommand = (phone, message) => {
    if (phone !== ADMIN_PHONE()) return false;
    return message.trim().startsWith(ADMIN_KEY());
};

export const processAdminCommand = (message) => {
    const key = ADMIN_KEY();
    const raw = message.trim().slice(key.length).trim();
    const parts = raw.split(/\s+/);
    const cmd = (parts[0] || '').toLowerCase();

    try {
        switch (cmd) {
            case 'agregar':
            case 'add':
                return cmdAgregar(parts.slice(1));

            case 'listar':
            case 'list':
                return cmdListar(parts.slice(1));

            case 'disponibles':
            case 'stock':
                return cmdDisponibles();

            case 'stats':
            case 'resumen':
                return cmdStats();

            case 'ordenes':
            case 'orders':
                return cmdOrdenes(parts.slice(1));

            case 'clientes':
            case 'clients':
                return cmdClientes(parts.slice(1));

            case 'liberar':
            case 'release':
                return cmdLiberar(parts[1]);

            case 'cliente':
                return cmdCliente(parts[1]);

            case 'ayuda':
            case 'help':
            default:
                return cmdAyuda();
        }
    } catch (err) {
        logger.error('Admin command error:', err);
        return `❌ Error: ${err.message}`;
    }
};

// ─── Comandos ────────────────────────────────────────────────────────────────

const cmdAgregar = (args) => {
    // !agregar <service> <plan> <email> <password> [profileName] [profilePin] [notes]
    if (args.length < 4) {
        return `❌ Faltan datos.\nUso: ${ADMIN_KEY()} agregar <servicio> <plan> <email> <contraseña> [perfil] [pin]\n\nEjemplo:\n${ADMIN_KEY()} agregar netflix premium cuenta@gmail.com clave123 MiPerfil 1234`;
    }
    const [service, plan, email, password, profileName = '', profilePin = ''] = args;
    const account = addAccount({ service, plan, email, password, profileName, profilePin });
    return `✅ *Cuenta agregada!*\n\n📺 ${service.toUpperCase()} ${plan}\n📧 ${email}\n👤 Perfil: ${profileName || 'sin perfil'}\n🔢 PIN: ${profilePin || 'sin PIN'}\nID: \`${account.id}\``;
};

const cmdListar = (args) => {
    const filter = {};
    if (args[0]) filter.service = args[0];
    if (args[1]) filter.plan = args[1];

    const accounts = listAccounts(filter);
    if (accounts.length === 0) return '📦 No hay cuentas registradas.';

    const lines = accounts.map((a) => {
        const status = a.isAssigned ? `🔴 Asignada → ${a.assignedTo}` : '🟢 Disponible';
        return `• ${a.service.toUpperCase()} ${a.plan} | ${a.email} | ${status}`;
    });

    return `📋 *Inventario (${accounts.length} cuentas):*\n\n${lines.join('\n')}`;
};

const cmdDisponibles = () => {
    const stats = getInventoryStats();
    if (Object.keys(stats).length === 0) return '📦 No hay cuentas en inventario.';

    const lines = Object.entries(stats).map(([key, s]) => {
        const [svc, plan] = key.split('_');
        return `• ${svc.toUpperCase()} ${plan}: ${s.available} disponibles / ${s.total} total`;
    });

    return `📊 *Stock disponible:*\n\n${lines.join('\n')}`;
};

const cmdStats = () => {
    const stats = getInventoryStats();
    const orders = listOrders({ status: 'approved' });
    const clients = listClients({ status: 'active' });
    const pending = listOrders({ status: 'pending' });

    const totalCuentas = Object.values(stats).reduce((s, v) => s + v.total, 0);
    const disponibles = Object.values(stats).reduce((s, v) => s + v.available, 0);
    const ingresos = orders.reduce((s, o) => s + (o.amount || 0), 0);

    return `📊 *Resumen del negocio:*\n\n` +
        `👥 Clientes activos: ${clients.length}\n` +
        `📦 Cuentas en inventario: ${totalCuentas}\n` +
        `✅ Cuentas disponibles: ${disponibles}\n` +
        `⏳ Ordenes pendientes: ${pending.length}\n` +
        `💰 Ingresos confirmados: $${ingresos.toLocaleString('es-CO')} COP\n` +
        `\nUsa *${ADMIN_KEY()} listar* para ver detalle`;
};

const cmdOrdenes = (args) => {
    const status = args[0] || null;
    const orders = listOrders(status ? { status } : {});
    if (orders.length === 0) return '📭 No hay órdenes registradas.';

    const lines = orders.slice(0, 10).map((o) => {
        const statusIcon = { pending: '⏳', approved: '✅', declined: '❌' }[o.status] || '❓';
        return `${statusIcon} ${o.service} ${o.plan} | ${o.phone} | $${(o.amount || 0).toLocaleString('es-CO')}`;
    });

    return `📋 *Órdenes recientes:*\n\n${lines.join('\n')}`;
};

const cmdClientes = (args) => {
    const status = args[0] === 'activos' ? 'active' : null;
    const clients = listClients(status ? { status } : {});
    if (clients.length === 0) return '👥 No hay clientes registrados.';

    const lines = clients.slice(0, 15).map((c) => {
        const exp = c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('es-CO') : 'N/A';
        return `• ${c.phone} | ${c.service} ${c.plan} | vence: ${exp}`;
    });

    return `👥 *Clientes (${clients.length}):*\n\n${lines.join('\n')}`;
};

const cmdCliente = (phone) => {
    if (!phone) return `❌ Uso: ${ADMIN_KEY()} cliente <número>`;
    const client = getClientByPhone(phone);
    if (!client) return `❌ No se encontró cliente con número ${phone}`;

    const exp = client.expiresAt ? new Date(client.expiresAt).toLocaleDateString('es-CO') : 'N/A';
    const account = client.accountId ? getAccountById(client.accountId) : null;

    let msg = `👤 *Cliente:* ${phone}\n`;
    msg += `📺 ${client.service} ${client.plan}\n`;
    msg += `📅 Vence: ${exp}\n`;
    msg += `🔄 Estado: ${client.status}\n`;
    if (account) {
        msg += `\n📧 Cuenta: ${account.email}\n`;
        msg += `🔑 Pass: ${account.password}\n`;
        if (account.profileName) msg += `👤 Perfil: ${account.profileName}\n`;
        if (account.profilePin) msg += `🔢 PIN: ${account.profilePin}\n`;
    }
    return msg;
};

const cmdLiberar = (accountId) => {
    if (!accountId) return `❌ Uso: ${ADMIN_KEY()} liberar <id-cuenta>`;
    const ok = releaseAccount(accountId);
    return ok ? `✅ Cuenta ${accountId} liberada y disponible de nuevo.` : `❌ No se encontró cuenta con ID ${accountId}`;
};

const cmdAyuda = () => {
    const k = ADMIN_KEY();
    return `🛠️ *Comandos de administrador:*\n\n` +
        `*Inventario:*\n` +
        `• \`${k} agregar <svc> <plan> <email> <pass> [perfil] [pin]\`\n` +
        `• \`${k} listar [svc] [plan]\`\n` +
        `• \`${k} disponibles\`\n` +
        `• \`${k} liberar <id>\`\n\n` +
        `*Clientes y órdenes:*\n` +
        `• \`${k} clientes [activos]\`\n` +
        `• \`${k} cliente <número>\`\n` +
        `• \`${k} ordenes [pending|approved]\`\n\n` +
        `*Resumen:*\n` +
        `• \`${k} stats\`\n\n` +
        `Ejemplo: \`${k} agregar netflix premium user@gmail.com pass123 Perfil1 1234\``;
};

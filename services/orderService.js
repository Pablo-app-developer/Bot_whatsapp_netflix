import { db, generateId } from './dbService.js';
import { logger } from '../utils/logger.js';

export const createOrder = ({ reference, phone, service, plan, amount }) => {
    const orders = db.orders.all();
    const order = {
        id: generateId(),
        reference,
        phone,
        service,
        plan,
        amount,
        status: 'pending',
        accountId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    orders.push(order);
    db.orders.save(orders);
    logger.info(`📦 Order created: ${reference} | ${service} ${plan} | ${phone}`);
    return order;
};

export const findOrderByReference = (reference) =>
    db.orders.all().find((o) => o.reference === reference) || null;

export const updateOrderStatus = (reference, status, accountId = null) => {
    const orders = db.orders.all();
    const idx = orders.findIndex((o) => o.reference === reference);
    if (idx === -1) return null;

    orders[idx] = {
        ...orders[idx],
        status,
        accountId: accountId ?? orders[idx].accountId,
        updatedAt: new Date().toISOString(),
    };
    db.orders.save(orders);
    return orders[idx];
};

export const listOrders = (filter = {}) => {
    let orders = db.orders.all();
    if (filter.status) orders = orders.filter((o) => o.status === filter.status);
    if (filter.phone) orders = orders.filter((o) => o.phone === filter.phone);
    return orders.slice(-50).reverse();
};

export const saveClient = ({ phone, service, plan, accountId, durationDays = 30 }) => {
    const clients = db.clients.all();
    const existing = clients.findIndex((c) => c.phone === phone);

    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    const clientData = {
        phone,
        service,
        plan,
        accountId,
        status: 'active',
        startedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
    };

    if (existing !== -1) {
        clients[existing] = { ...clients[existing], ...clientData };
    } else {
        clients.push({ id: generateId(), createdAt: now.toISOString(), ...clientData });
    }
    db.clients.save(clients);
};

export const getClientByPhone = (phone) =>
    db.clients.all().find((c) => c.phone === phone) || null;

export const listClients = (filter = {}) => {
    let clients = db.clients.all();
    if (filter.status) clients = clients.filter((c) => c.status === filter.status);
    return clients;
};

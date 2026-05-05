import { db, generateId } from './dbService.js';
import { logger } from '../utils/logger.js';

export const addAccount = ({ service, plan, email, password, profileName, profilePin, notes = '' }) => {
    const accounts = db.accounts.all();
    const account = {
        id: generateId(),
        service: service.toLowerCase(),
        plan: plan.toLowerCase(),
        email,
        password,
        profileName: profileName || '',
        profilePin: profilePin || '',
        isAssigned: false,
        assignedTo: null,
        assignedAt: null,
        expiresAt: null,
        notes,
        createdAt: new Date().toISOString(),
    };
    accounts.push(account);
    db.accounts.save(accounts);
    logger.info(`✅ Account added: ${service} ${plan} - ${email}`);
    return account;
};

export const getAvailableAccount = (service, plan) => {
    const accounts = db.accounts.all();
    return accounts.find(
        (a) => a.service === service.toLowerCase() &&
               a.plan === plan.toLowerCase() &&
               !a.isAssigned
    ) || null;
};

export const assignAccount = (accountId, phone, durationDays = 30) => {
    const accounts = db.accounts.all();
    const idx = accounts.findIndex((a) => a.id === accountId);
    if (idx === -1) return null;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    accounts[idx] = {
        ...accounts[idx],
        isAssigned: true,
        assignedTo: phone,
        assignedAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
    };
    db.accounts.save(accounts);
    return accounts[idx];
};

export const releaseAccount = (accountId) => {
    const accounts = db.accounts.all();
    const idx = accounts.findIndex((a) => a.id === accountId);
    if (idx === -1) return false;

    accounts[idx] = {
        ...accounts[idx],
        isAssigned: false,
        assignedTo: null,
        assignedAt: null,
        expiresAt: null,
    };
    db.accounts.save(accounts);
    return true;
};

export const getAccountById = (id) =>
    db.accounts.all().find((a) => a.id === id) || null;

export const listAccounts = (filter = {}) => {
    let accounts = db.accounts.all();
    if (filter.service) accounts = accounts.filter((a) => a.service === filter.service.toLowerCase());
    if (filter.plan) accounts = accounts.filter((a) => a.plan === filter.plan.toLowerCase());
    if (filter.available !== undefined) accounts = accounts.filter((a) => !a.isAssigned === filter.available);
    return accounts;
};

export const getInventoryStats = () => {
    const accounts = db.accounts.all();
    const stats = {};
    for (const acc of accounts) {
        const key = `${acc.service}_${acc.plan}`;
        if (!stats[key]) stats[key] = { total: 0, available: 0, assigned: 0 };
        stats[key].total++;
        if (acc.isAssigned) stats[key].assigned++;
        else stats[key].available++;
    }
    return stats;
};

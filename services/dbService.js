import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');

const FILES = {
    accounts: join(DATA_DIR, 'accounts.json'),
    orders: join(DATA_DIR, 'orders.json'),
    clients: join(DATA_DIR, 'clients.json'),
};

const read = (file) => {
    const raw = readFileSync(FILES[file], 'utf-8');
    return JSON.parse(raw);
};

const write = (file, data) => {
    writeFileSync(FILES[file], JSON.stringify(data, null, 2), 'utf-8');
};

export const db = {
    accounts: {
        all: () => read('accounts').accounts,
        save: (accounts) => write('accounts', { accounts }),
    },
    orders: {
        all: () => read('orders').orders,
        save: (orders) => write('orders', { orders }),
    },
    clients: {
        all: () => read('clients').clients,
        save: (clients) => write('clients', { clients }),
    },
};

export const generateId = () =>
    Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

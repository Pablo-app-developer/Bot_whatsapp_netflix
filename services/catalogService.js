import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CATALOG_PATH = path.join(__dirname, '..', 'data', 'catalog.json');

let _catalog = null;
let _byId = null;
let _byCategory = null;

const load = () => {
    if (_catalog) return;
    const raw = fs.readFileSync(CATALOG_PATH, 'utf-8');
    _catalog = JSON.parse(raw);
    _byId = new Map(_catalog.map(b => [b.id, b]));
    _byCategory = new Map();
    for (const b of _catalog) {
        if (!_byCategory.has(b.category)) _byCategory.set(b.category, []);
        _byCategory.get(b.category).push(b);
    }
    logger.info(`📚 Catálogo cargado: ${_catalog.length} libros, ${_byCategory.size} categorías`);
};

export const listCategories = () => {
    load();
    return [..._byCategory.entries()].map(([name, books]) => ({
        name,
        count: books.length,
    })).sort((a, b) => b.count - a.count);
};

export const listBooksByCategory = (categoryName, limit = 12) => {
    load();
    // Match case-insensitive y sin tildes
    const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const target = norm(categoryName);
    for (const [name, books] of _byCategory) {
        if (norm(name).includes(target) || target.includes(norm(name))) {
            return {
                category: name,
                total: books.length,
                books: books.slice(0, limit).map(b => ({ id: b.id, title: b.title })),
            };
        }
    }
    return null;
};

export const searchBooks = (query, limit = 8) => {
    load();
    const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const terms = norm(query).split(/\s+/).filter(t => t.length > 2);
    if (terms.length === 0) return [];

    const scored = _catalog.map(b => {
        const hay = norm(b.title + ' ' + b.category);
        const score = terms.reduce((s, t) => s + (hay.includes(t) ? 1 : 0), 0);
        return { book: b, score };
    })
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

    return scored.map(x => ({
        id: x.book.id,
        title: x.book.title,
        category: x.book.category,
    }));
};

export const getBookById = (id) => {
    load();
    return _byId.get(Number(id)) || null;
};

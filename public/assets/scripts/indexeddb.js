// indexeddb.js
// Módulo básico para manejar transacciones con IndexedDB

const DB_NAME = 'FinanzasDB';
const DB_VERSION = 1;
const STORE_NAME = 'transacciones';
const USER_STORE = 'usuarios';

export function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = function(e) {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains(USER_STORE)) {
                db.createObjectStore(USER_STORE, { keyPath: 'username' });
            }
        };
// Usuarios
window.addUsuario = function(usuario) {
    return openDB().then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(USER_STORE, 'readwrite');
            const store = tx.objectStore(USER_STORE);
            const req = store.add(usuario);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    });
}

window.getUsuario = function(username) {
    return openDB().then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(USER_STORE, 'readonly');
            const store = tx.objectStore(USER_STORE);
            const req = store.get(username);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    });
}
        request.onsuccess = function(e) {
            resolve(e.target.result);
        };
        request.onerror = function(e) {
            reject(e);
        };
    });
}

export function addTransaccion(transaccion) {
    return openDB().then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.add(transaccion);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    });
}

export function getTransacciones() {
    return openDB().then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    });
}

export function deleteTransaccion(id) {
    return openDB().then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.delete(id);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    });
}

export function updateTransaccion(transaccion) {
    return openDB().then(db => {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.put(transaccion);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    });
}

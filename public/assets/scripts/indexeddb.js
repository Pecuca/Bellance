// Abrir (o crear) la base de datos
const dbName = "FinanzasDB";
const dbVersion = 1;
let db;

const request = indexedDB.open(dbName, dbVersion);

request.onupgradeneeded = function(event) {
    db = event.target.result;
    // Crear almacén de usuarios si no existe
    if (!db.objectStoreNames.contains("usuarios")) {
        db.createObjectStore("usuarios", { keyPath: "username" }); // username como clave primaria
    }
    // Crear almacén de transacciones si no existe
    if (!db.objectStoreNames.contains("transacciones")) {
        const transStore = db.createObjectStore("transacciones", { keyPath: "id", autoIncrement: true });
        transStore.createIndex("username", "username", { unique: false }); // Relacionar con usuario
        transStore.createIndex("fecha", "fecha", { unique: false });
    }
};

request.onsuccess = function(event) {
    db = event.target.result;
    // Puedes exponer db o funciones aquí si lo necesitas
};

request.onerror = function(event) {
    console.error("Error abriendo IndexedDB:", event.target.errorCode);
};

// Agregar usuario
window.addUsuario = function(usuario) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction("usuarios", "readwrite");
        const store = tx.objectStore("usuarios");
        const req = store.add(usuario);
        req.onsuccess = () => resolve();
        req.onerror = (e) => reject(e);
    });
};

// Buscar usuario por username
window.getUsuario = function(username) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction("usuarios", "readonly");
        const store = tx.objectStore("usuarios");
        const req = store.get(username);
        req.onsuccess = () => resolve(req.result);
        req.onerror = (e) => reject(e);
    });
};

// Agregar transacción
window.addTransaccion = function(transaccion) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction("transacciones", "readwrite");
        const store = tx.objectStore("transacciones");
        const req = store.add(transaccion);
        req.onsuccess = () => resolve();
        req.onerror = (e) => reject(e);
    });
};

// Obtener transacciones de un usuario
window.getTransaccionesByUser = function(username) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction("transacciones", "readonly");
        const store = tx.objectStore("transacciones");
        const index = store.index("username");
        const req = index.getAll(username);
        req.onsuccess = () => resolve(req.result);
        req.onerror = (e) => reject(e);
    });
};
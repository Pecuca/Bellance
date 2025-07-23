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
    // Crear almacén de categorías si no existe
    if (!db.objectStoreNames.contains("categorias")) {
        const catStore = db.createObjectStore("categorias", { keyPath: "id", autoIncrement: true });
        catStore.createIndex("username", "username", { unique: false });
        catStore.createIndex("nombre", "nombre", { unique: false });
    }
    // Crear almacén de presupuestos si no existe
    if (!db.objectStoreNames.contains("presupuestos")) {
        const store = db.createObjectStore("presupuestos", { keyPath: "id", autoIncrement: true });
        store.createIndex("username", "username", { unique: false });
        store.createIndex("mes_categoria", ["username", "mes", "categoria"], { unique: true });
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

// Agregar categoría
window.addCategoria = function(categoria) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction("categorias", "readwrite");
        const store = tx.objectStore("categorias");
        const req = store.add(categoria);
        req.onsuccess = () => resolve();
        req.onerror = (e) => reject(e);
    });
};

// Obtener categorías de un usuario
window.getCategoriasByUser = function(username) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction("categorias", "readonly");
        const store = tx.objectStore("categorias");
        const index = store.index("username");
        const req = index.getAll(username);
        req.onsuccess = () => resolve(req.result);
        req.onerror = (e) => reject(e);
    });
};

// Eliminar categoría
window.deleteCategoria = function(id) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction("categorias", "readwrite");
        const store = tx.objectStore("categorias");
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = (e) => reject(e);
    });
};

// Actualizar categoría
window.updateCategoria = function(categoria) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction("categorias", "readwrite");
        const store = tx.objectStore("categorias");
        const req = store.put(categoria);
        req.onsuccess = () => resolve();
        req.onerror = (e) => reject(e);
    });
};

// Agregar presupuesto
window.addPresupuesto = function(presupuesto) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction("presupuestos", "readwrite");
        const store = tx.objectStore("presupuestos");
        store.put(presupuesto);
        tx.oncomplete = () => resolve();
        tx.onerror = e => reject(e);
    });
};

// Obtener presupuestos por usuario y mes
window.getPresupuestosByUserAndMonth = function(username, mes) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction("presupuestos", "readonly");
        const store = tx.objectStore("presupuestos");
        const index = store.index("username");
        const req = index.getAll(username);
        req.onsuccess = () => {
            const presupuestos = req.result.filter(p => p.mes === mes);
            resolve(presupuestos);
        };
        req.onerror = e => reject(e);
    });
};
// Abrir (o crear) la base de datos
const dbName = "FinanzasDB";
const dbVersion = 3; // Usa la versión más alta usada en tu app
let db;
let dbReadyResolve;
const dbReady = new Promise((resolve) => { dbReadyResolve = resolve; });

const request = indexedDB.open(dbName, dbVersion);

request.onupgradeneeded = function(event) {
    db = event.target.result;
    // Crear almacén de usuarios si no existe
    if (!db.objectStoreNames.contains("usuarios")) {
        db.createObjectStore("usuarios", { keyPath: "username" });
    }
    // Crear almacén de transacciones si no existe
    if (!db.objectStoreNames.contains("transacciones")) {
        const transStore = db.createObjectStore("transacciones", { keyPath: "id", autoIncrement: true });
        transStore.createIndex("username", "username", { unique: false });
        transStore.createIndex("fecha", "fecha", { unique: false });
    }
    // Crear almacén de categorías si no existe
    if (!db.objectStoreNames.contains("categorias")) {
        const catStore = db.createObjectStore("categorias", { keyPath: "id", autoIncrement: true });
        catStore.createIndex("username", "username", { unique: false });
        catStore.createIndex("username_nombre", ["username", "nombre"], { unique: true }); // índice compuesto único
    } else {
        // Si ya existe, asegúrate de que el índice compuesto existe (solo para migraciones manuales)
        const catStore = event.target.transaction.objectStore("categorias");
        if (!catStore.indexNames.contains("username_nombre")) {
           
        }
    }
    // Crear almacén de presupuestos si no existe
    if (!db.objectStoreNames.contains("presupuestos")) {
        db.createObjectStore("presupuestos", { keyPath: "id", autoIncrement: true });
    }
};

request.onsuccess = function(event) {
    db = event.target.result;
    dbReadyResolve();
    // Puedes exponer db o funciones aquí si lo necesitas
};

request.onerror = function(event) {
    console.error("Error abriendo IndexedDB:", event.target.error || event.target.errorCode || event);
};

// Helper to ensure DB is ready before any operation
function withDBReady(fn) {
    return (...args) => dbReady.then(() => fn(...args));
}

// Agregar usuario
window.addUsuario = withDBReady(function(usuario) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction("usuarios", "readwrite");
        const store = tx.objectStore("usuarios");
        const req = store.add(usuario);
        req.onsuccess = () => resolve();
        req.onerror = (e) => {
            if (e.target && e.target.error && e.target.error.name === "ConstraintError") {
                reject(new Error("El usuario ya existe."));
            } else {
                reject(e);
            }
        };
    });
});

// Buscar usuario por username
window.getUsuario = withDBReady(function(username) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction("usuarios", "readonly");
        const store = tx.objectStore("usuarios");
        const req = store.get(username);
        req.onsuccess = () => resolve(req.result);
        req.onerror = (e) => reject(e);
    });
});

// Agregar transacción
window.addTransaccion = withDBReady(function(transaccion) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction("transacciones", "readwrite");
        const store = tx.objectStore("transacciones");
        const req = store.add(transaccion);
        req.onsuccess = () => resolve();
        req.onerror = (e) => reject(e);
    });
});

// Obtener transacciones de un usuario
window.getTransaccionesByUser = withDBReady(function(username) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction("transacciones", "readonly");
        const store = tx.objectStore("transacciones");
        const index = store.index("username");
        const req = index.getAll(username);
        req.onsuccess = () => resolve(req.result);
        req.onerror = (e) => reject(e);
    });
});

// Agregar categoría
window.addCategoria = withDBReady(function(categoria) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction("categorias", "readwrite");
        const store = tx.objectStore("categorias");
        const req = store.add(categoria);
        req.onsuccess = () => resolve();
        req.onerror = (e) => {
            if (e.target && e.target.error && e.target.error.name === "ConstraintError") {
                reject(new Error("La categoría ya existe para este usuario."));
            } else {
                reject(e);
            }
        };
    });
});

// Obtener categorías de un usuario
window.getCategoriasByUser = withDBReady(function(username) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction("categorias", "readonly");
        const store = tx.objectStore("categorias");
        const index = store.index("username");
        const req = index.getAll(username);
        req.onsuccess = () => resolve(req.result);
        req.onerror = (e) => reject(e);
    });
});

// Eliminar categoría
window.deleteCategoria = withDBReady(function(id) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction("categorias", "readwrite");
        const store = tx.objectStore("categorias");
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = (e) => reject(e);
    });
});

// Actualizar categoría
window.updateCategoria = withDBReady(function(categoria) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction("categorias", "readwrite");
        const store = tx.objectStore("categorias");
        const req = store.put(categoria);
        req.onsuccess = () => resolve();
        req.onerror = (e) => {
            if (e.target && e.target.error && e.target.error.name === "ConstraintError") {
                reject(new Error("Ya existe una categoría con ese nombre para este usuario."));
            } else {
                reject(e);
            }
        };
    });
});

// Agregar presupuesto
window.addPresupuesto = withDBReady(function(presupuesto) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction("presupuestos", "readwrite");
        const store = tx.objectStore("presupuestos");
        const req = store.put(presupuesto);
        req.onsuccess = () => resolve();
        req.onerror = (e) => {
            if (e.target && e.target.error && e.target.error.name === "ConstraintError") {
                reject(new Error("Ya existe un presupuesto para este usuario, mes y categoría."));
            } else {
                reject(e);
            }
        };
    });
});

// Obtener presupuestos por usuario y mes
window.getPresupuestosByUserAndMonth = withDBReady(function(username, mes) {
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
});

if (!window.indexedDB) {
    console.error("Este navegador no soporta IndexedDB.");
}
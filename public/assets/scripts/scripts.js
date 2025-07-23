// --- Login y registro ---
document.addEventListener('DOMContentLoaded', function() {
    const loginView = document.getElementById('loginView');
    const mainLayout = document.querySelector('.layout');
    const loginForm = document.getElementById('loginForm');
    const loginMsg = document.getElementById('loginMsg');
    const registerForm = document.getElementById('registerForm');
    const regMsg = document.getElementById('regMsg');

    // Ocultar app hasta login
    if (mainLayout) mainLayout.style.display = 'none';
    if (loginView) loginView.style.display = 'flex';

    // Login
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
                const user = document.getElementById('loginUser').value.trim();
                const pass = document.getElementById('loginPass').value;
                if (!user || !pass) {
                    loginMsg.textContent = 'Debes ingresar usuario y contraseña.';
                    loginMsg.style.display = 'block';
                    return;
                }
                // Validar usuario en IndexedDB
                window.getUsuario(user).then(u => {
                    if (!u) {
                        loginMsg.textContent = 'El usuario no existe.';
                        loginMsg.style.display = 'block';
                    } else if (u.password !== pass) {
                        loginMsg.textContent = 'La contraseña no es válida.';
                        loginMsg.style.display = 'block';
                    } else {
                        loginMsg.style.display = 'none';
                        setTimeout(() => {
                            if (loginView) {
                                loginView.style.display = 'none';
                                loginView.style.zIndex = '0';
                            }
                            if (mainLayout) {
                                mainLayout.style.display = '';
                                mainLayout.style.zIndex = '1';
                            }
                            // Cambiar nombre en el layout
                            const sidebarUserName = document.getElementById('sidebarUserName');
                            if (sidebarUserName) sidebarUserName.textContent = user;

                            // Actualizar avatar con las 2 primeras letras
                            const userAvatar = document.querySelector('.user-avatar');
                            if (userAvatar) {
                                userAvatar.textContent = user.slice(0, 2).toUpperCase();
                            }
                        }, 100);

                        // Nuevo: Cargar transacciones del usuario
                        currentUser = user;
                        window.getTransaccionesByUser(user).then(trs => {
                            transacciones = trs;
                            renderChart(chartTypeSelect.value); // Actualiza los gráficos con los datos reales
                            renderTransTable(); // Renderiza la tabla de transacciones
                        });

                        // Nuevo: Cargar categorías del usuario
                        setTimeout(() => {
                            loadCategorias();
                        }, 100);
                    }
                });
            });
    }

    // Registro
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const user = document.getElementById('regUser').value.trim();
            const pass = document.getElementById('regPass').value;
            if (!user || !pass) return;
            window.getUsuario(user).then(u => {
                if (u) {
                    regMsg.textContent = "El usuario ya existe.";
                } else {
                    window.addUsuario({username: user, password: pass}).then(() => {
                        // Categorías predefinidas
                        const categoriasDefault = [
                            "Alimentación", "Transporte", "Ocio", "Servicios", "Salud", "Educación", "Otros"
                        ];
                        Promise.all(
                            categoriasDefault.map(nombre =>
                                window.addCategoria({nombre, username: user})
                            )
                        ).then(() => {
                            regMsg.textContent = "Usuario registrado correctamente.";
                            // Aquí puedes hacer login automático o mostrar mensaje
                        });
                    });
                }
            });
        });
    }

    // AJUSTES: Mostrar/ocultar modal
    const settingsBtn = document.getElementById('settingsBtn');
    const sidebarSettingsBtn = document.getElementById('sidebarSettingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettings = document.getElementById('closeSettings');
    if (settingsModal && closeSettings) {
        // Abrir modal desde cualquiera de los dos botones
        if (settingsBtn) settingsBtn.onclick = () => settingsModal.style.display = 'flex';
        if (sidebarSettingsBtn) sidebarSettingsBtn.onclick = () => settingsModal.style.display = 'flex';
        closeSettings.onclick = () => settingsModal.style.display = 'none';
        settingsModal.addEventListener('click', function(e) {
            if (e.target === settingsModal) settingsModal.style.display = 'none';
        });
    }
});
// Navegación de vistas del layout
const navLinks = document.querySelectorAll('.sidebar-nav a');
const views = document.querySelectorAll('.view-section');
navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        // Si es el link de transacción, no cambiar vista
        if (link.id === 'toggleTransForm') return;
        e.preventDefault();
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        views.forEach(view => view.style.display = 'none');
        if (link.textContent.includes('Dashboard')) {
            document.getElementById('dashboard').style.display = 'block';
        } else if (link.textContent.includes('Transacciones')) {
            document.getElementById('transactions').style.display = 'block';
        } else if (link.textContent.includes('Categorías')) {
            document.getElementById('categories').style.display = 'block';
        } else if (link.textContent.includes('Presupuestos')) {
            document.getElementById('budgets').style.display = 'block';
        }
    });
});
const helpBtn = document.getElementById('helpBtn');
const helpModal = document.getElementById('helpModal');
const closeHelp = document.getElementById('closeHelp');
helpBtn.onclick = () => helpModal.style.display = 'flex';
closeHelp.onclick = () => helpModal.style.display = 'none';
window.onclick = (e) => {
    if (e.target === helpModal) helpModal.style.display = 'none';
};

// Mostrar/ocultar formulario de transacción en sidebar
const toggleTransForm = document.getElementById('toggleTransForm');
const sidebarTransForm = document.getElementById('sidebarTransForm');
if (toggleTransForm && sidebarTransForm) {
    toggleTransForm.onclick = (e) => {
        e.preventDefault();
        if (sidebarTransForm.style.display === 'none') {
            sidebarTransForm.style.display = 'block';
        } else {
            sidebarTransForm.style.display = 'none';
        }
    };
}

// Chart.js: Finanzas
const chartTypeSelect = document.getElementById('chartType');
const chartCanvas = document.getElementById('finanzasChart');
const monthFilter = document.getElementById('monthFilter');
let finanzasChart = null;

// Datos de ejemplo para transacciones (en producción, esto vendría de una base de datos)
let transacciones = [];
let currentUser = null;
let categorias = [];

function getMonthString(date) {
    // date: '2025-07-01' => '2025-07'
    return date.slice(0, 7);
}

function getFilteredTransacciones(month) {
    if (!month) return transacciones;
    return transacciones.filter(t => getMonthString(t.fecha) === month);
}

function getGastosPorCategoria(month) {
    const cats = ['Alimentación', 'Transporte', 'Ocio', 'Servicios', 'Salud', 'Educación', 'Otros'];
    const filtered = getFilteredTransacciones(month).filter(t => t.tipo === 'Egreso');
    return cats.map(cat => {
        const total = filtered.filter(t => t.categoria === cat).reduce((sum, t) => sum + t.monto, 0);
        return total;
    });
}

const chartData = {
    gastosCategoria: function(month) {
        return {
            type: 'doughnut',
            data: {
                labels: ['Alimentación', 'Transporte', 'Ocio', 'Servicios', 'Salud', 'Educación', 'Otros'],
                datasets: [{
                    data: getGastosPorCategoria(month),
                    backgroundColor: ['#58a6ff', '#f39c12', '#e74c3c', '#8e44ad', '#27ae60', '#d35400', '#95a5a6'],
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {position: 'bottom'},
                    datalabels: {
                        color: '#fff',
                        font: {weight: 'bold', size: 15},
                        formatter: function(value, context) {
                            const label = context.chart.data.labels[context.dataIndex];
                            return label + "\n$" + value;
                        },
                        align: 'center',
                        anchor: 'center',
                        textAlign: 'center',
                    }
                }
            },
            plugins: [ChartDataLabels]
        };
    },
    balanceMensual: {
        type: 'line',
        data: {
            labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio'],
            datasets: [
                {label: 'Balance Estimado', data: [1200, 1300, 1400, 1500, 1600, 1700, 1800], borderColor: '#58a6ff', fill: false},
                {label: 'Balance Real', data: [1100, 1250, 1350, 1450, 1550, 1650, 1750], borderColor: '#e74c3c', fill: false}
            ]
        },
        options: {responsive: true, plugins: {legend: {position: 'bottom'}}}
    },
    ingresosComparativo: {
        type: 'bar',
        data: {
            labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio'],
            datasets: [
                {label: 'Ingreso Estimado', data: [2000, 2100, 2200, 2300, 2400, 2500, 2600], backgroundColor: '#58a6ff'},
                {label: 'Ingreso Real', data: [1950, 2050, 2150, 2250, 2350, 2450, 2550], backgroundColor: '#27ae60'}
            ]
        },
        options: {responsive: true, plugins: {legend: {position: 'bottom'}}}
    },
    evolucionBalance: {
        type: 'line',
        data: {
            labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
            datasets: [
                {label: 'Balance', data: [1200, 1250, 1300, 1350, 1400, 1450, 1500, 1550, 1600, 1650, 1700, 1750], borderColor: '#58a6ff', fill: true, backgroundColor: 'rgba(88,166,255,0.1)'}
            ]
        },
        options: {responsive: true, plugins: {legend: {position: 'bottom'}}}
    },
    distribucionGastosIngresos: {
        type: 'bar',
        data: {
            labels: ['Gastos', 'Ingresos'],
            datasets: [
                {label: 'Distribución', data: [1200, 2500], backgroundColor: ['#e74c3c', '#27ae60']}
            ]
        },
        options: {responsive: true, plugins: {legend: {display: false}}}
    }
};

function renderChart(type) {
    if (!chartCanvas) return;
    if (finanzasChart) {
        finanzasChart.destroy();
    }
    let config;
    const month = monthFilter ? monthFilter.value : '';
    if (typeof chartData[type] === 'function') {
        config = chartData[type](month);
    } else {
        config = chartData[type];
    }
    finanzasChart = new Chart(chartCanvas, config);
}

if (chartTypeSelect && chartCanvas) {
    chartTypeSelect.addEventListener('change', function() {
        renderChart(this.value);
    });
    if (monthFilter) {
        monthFilter.addEventListener('change', function() {
            renderChart(chartTypeSelect.value);
        });
    }
    renderChart(chartTypeSelect.value);

    // Actualización en tiempo real al registrar transacción (demo)
    const transForm = document.getElementById('transForm');
    if (transForm) {
        transForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const tipo = transForm.querySelector('select').value;
            const monto = Number(transForm.querySelector('input[type="number"]').value);
            const fecha = transForm.querySelector('input[type="date"]').value;
            const categoria = transForm.querySelector('input[placeholder="Categoría"]').value;
            const descripcion = transForm.querySelector('input[placeholder="Descripción"]').value;
            if (fecha && categoria && monto && currentUser) {
                const nuevaTrans = {fecha, tipo, categoria, monto, descripcion, username: currentUser};
                window.addTransaccion(nuevaTrans).then(() => {
                    window.getTransaccionesByUser(currentUser).then(trs => {
                        transacciones = trs;
                        renderChart(chartTypeSelect.value);
                        renderTransTable();
                        updateDashboardSummary(); // <-- Agrega esta línea
                    });
                });
            }
        });
    }
}

function renderTransTable() {
    const table = document.getElementById('transTable');
    if (!table) return;
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';
    if (!transacciones.length) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="5" style="text-align:center;color:#888;">Sin transacciones</td>';
        tbody.appendChild(tr);
        return;
    }
    transacciones.forEach(t => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${t.fecha}</td>
            <td>${t.tipo}</td>
            <td>${t.categoria}</td>
            <td>${t.monto}</td>
            <td>${t.descripcion || ''}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Renderizar lista de categorías
function renderCategorias() {
    const ul = document.querySelector('#categories ul');
    if (!ul) return;
    ul.innerHTML = '';
    if (!categorias.length) {
        ul.innerHTML = '<li style="color:#888;">Sin categorías</li>';
        return;
    }
    categorias.forEach(cat => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="cat-name">${cat.nombre}</span>
            <button data-id="${cat.id}" class="edit-cat-btn">Editar</button>
            <button data-id="${cat.id}" class="delete-cat-btn">Eliminar</button>
        `;
        ul.appendChild(li);

        // Botón editar
        li.querySelector('.edit-cat-btn').onclick = function() {
            const span = li.querySelector('.cat-name');
            const input = document.createElement('input');
            input.type = 'text';
            input.value = cat.nombre;
            input.style.marginRight = '8px';
            span.replaceWith(input);

            this.style.display = 'none'; // Oculta el botón editar

            // Botón guardar
            const saveBtn = document.createElement('button');
            saveBtn.textContent = 'Guardar';
            saveBtn.className = 'save-cat-btn';
            li.insertBefore(saveBtn, li.querySelector('.delete-cat-btn'));

            saveBtn.onclick = function() {
                const newName = input.value.trim();
                if (!newName) return;
                window.updateCategoria({...cat, nombre: newName}).then(() => {
                    loadCategorias();
                });
            };
        };
    });
}

// Cargar categorías del usuario actual
function loadCategorias() {
    if (!currentUser) return;
    window.getCategoriasByUser(currentUser).then(cats => {
        categorias = cats;
        renderCategorias();
    });
}

// Crear nueva categoría
const catForm = document.getElementById('catForm');
if (catForm) {
    catForm.onsubmit = function(e) {
        e.preventDefault();
        const nombre = catForm.querySelector('input[type="text"]').value.trim();
        if (!nombre || !currentUser) return;
        window.addCategoria({nombre, username: currentUser}).then(() => {
            catForm.reset();
            loadCategorias();
        });
    };
}

// --- LOGOUT ---
const logoutBtn = document.querySelector('.logout');
if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
        // Limpiar usuario actual (si usas window.currentUser, localStorage, etc.)
        if (window.currentUser) window.currentUser = null;
        // Ocultar dashboard/layout y mostrar login
        document.querySelector('.layout').style.display = 'none';
        document.getElementById('loginView').style.display = 'flex';
        // Limpiar mensajes de error
        document.getElementById('loginMsg').style.display = 'none';
        document.getElementById('regMsg').style.display = 'none';
        // Limpiar formularios
        document.getElementById('loginForm').reset();
        document.getElementById('registerForm').reset();
    });
}
// --- END LOGOUT ---
// --- AJUSTES ---
const settingsBtn = document.getElementById('settingsBtn');
const sidebarSettingsBtn = document.getElementById('sidebarSettingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettings = document.getElementById('closeSettings');
const editProfileForm = document.getElementById('editProfileForm');
const changePassForm = document.getElementById('changePassForm');
const currencyFormat = document.getElementById('currencyFormat');
const deleteAccountBtn = document.getElementById('deleteAccountBtn');
const settingsMsg = document.getElementById('settingsMsg');

// Mostrar/ocultar modal de ajustes
if (settingsBtn && settingsModal && closeSettings) {
    settingsBtn.onclick = () => settingsModal.style.display = 'flex';
    closeSettings.onclick = () => settingsModal.style.display = 'none';
    // Cerrar modal si se hace click fuera del contenido
    settingsModal.addEventListener('click', function(e) {
        if (e.target === settingsModal) settingsModal.style.display = 'none';
    });
}

// Editar perfil (nombre de usuario)
if (editProfileForm) {
    editProfileForm.onsubmit = function(e) {
        e.preventDefault();
        const newName = document.getElementById('editUsername').value.trim();
        const sidebarUserName = document.getElementById('sidebarUserName');
        if (sidebarUserName && newName) sidebarUserName.textContent = newName;

        // Actualizar avatar con las 2 primeras letras del nuevo nombre
        const userAvatar = document.querySelector('.user-avatar');
        if (userAvatar && newName) {
            userAvatar.textContent = newName.slice(0, 2).toUpperCase();
        }

        // Aquí deberías actualizar el nombre en IndexedDB y en la UI
        settingsMsg.textContent = 'Nombre de usuario actualizado (demo)';
        settingsMsg.style.display = 'block';
        setTimeout(() => settingsMsg.style.display = 'none', 2000);
    };
}

// Cambiar contraseña
if (changePassForm) {
    changePassForm.onsubmit = function(e) {
        e.preventDefault();
        // Aquí deberías validar y actualizar la contraseña en IndexedDB
        settingsMsg.textContent = 'Contraseña cambiada (demo)';
        settingsMsg.style.display = 'block';
        setTimeout(() => settingsMsg.style.display = 'none', 2000);
    };
}

// Cambiar formato de moneda
if (currencyFormat) {
    currencyFormat.onchange = function() {
        // Aquí puedes guardar la preferencia en localStorage o IndexedDB
        settingsMsg.textContent = 'Formato de moneda actualizado (demo)';
        settingsMsg.style.display = 'block';
        setTimeout(() => settingsMsg.style.display = 'none', 2000);
    };
}

// Eliminar cuenta
if (deleteAccountBtn) {
    deleteAccountBtn.onclick = function() {
        if (confirm('¿Seguro que deseas eliminar tu cuenta? Esta acción no se puede deshacer.')) {
            // Aquí deberías borrar el usuario de IndexedDB y cerrar sesión
            settingsMsg.textContent = 'Cuenta eliminada (demo)';
            settingsMsg.style.display = 'block';
            setTimeout(() => {
                settingsModal.style.display = 'none';
                // Simular logout
                document.querySelector('.layout').style.display = 'none';
                document.getElementById('loginView').style.display = 'flex';
            }, 1500);
        }
    };
}
// --- FIN AJUSTES ---
// --- PRESUPUESTOS ---

// Guardar presupuesto
const presupuestoForm = document.getElementById('presupuestoForm');
if (presupuestoForm) {
    presupuestoForm.onsubmit = function(e) {
        e.preventDefault();
        const mes = presupuestoForm.querySelector('input[type="month"]').value;
        const ingresoEsperado = parseFloat(presupuestoForm.querySelector('input[placeholder="Ingreso esperado"]').value);
        const egresoEsperado = parseFloat(presupuestoForm.querySelector('input[placeholder="Egreso esperado"]').value);
        if (!mes || isNaN(ingresoEsperado) || isNaN(egresoEsperado) || !currentUser) return;
        window.addPresupuesto({
            username: currentUser.username,
            mes,
            ingresoEsperado,
            egresoEsperado
        }).then(() => {
            loadPresupuestos();
            updateDashboardSummary();
            presupuestoForm.reset();
        });
    };
}

// Mostrar presupuestos en la tabla
function loadPresupuestos() {
    const mes = document.querySelector('#budgets input[type="month"]')?.value || '';
    if (!currentUser || !mes) return;
    window.getPresupuestosByUserAndMonth(currentUser.username, mes).then(presupuestos => {
        const tbody = document.querySelector('#budgets table tbody');
        tbody.innerHTML = '';
        if (!presupuestos.length) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#888;">Sin presupuestos para este mes</td></tr>`;
            return;
        }
        presupuestos.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${mesToString(p.mes)}</td>
                <td>
                    <input type="number" value="${p.ingresoEsperado || 0}" style="width:80px;" class="edit-ingreso" />
                </td>
                <td>
                    <input type="number" value="${p.egresoEsperado || 0}" style="width:80px;" class="edit-egreso" />
                </td>
                <td>
                    <button class="save-presupuesto" data-id="${p.id}">Guardar</button>
                </td>
            `;
            tbody.appendChild(tr);

            tr.querySelector('.save-presupuesto').onclick = function() {
                const nuevoIngreso = parseFloat(tr.querySelector('.edit-ingreso').value);
                const nuevoEgreso = parseFloat(tr.querySelector('.edit-egreso').value);
                // Asegúrate de pasar el id si existe
                const presupuestoActualizado = {
                    ...p,
                    ingresoEsperado: nuevoIngreso,
                    egresoEsperado: nuevoEgreso
                };
                if (p.id) presupuestoActualizado.id = p.id;
                window.addPresupuesto(presupuestoActualizado).then(() => {
                    loadPresupuestos();
                    updateDashboardSummary();
                });
            };
        });
    });
}

// Utilidad para mostrar el mes en texto
function mesToString(mes) {
    const [y, m] = mes.split('-');
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    return `${meses[parseInt(m)-1]} ${y}`;
}

// Cargar presupuestos al cambiar el mes
const presupuestoMesInput = document.querySelector('#budgets input[type="month"]');
if (presupuestoMesInput) {
    presupuestoMesInput.addEventListener('change', loadPresupuestos);
}

// Actualizar dashboard con los datos del presupuesto
function updateDashboardSummary() {
    const monthInput = document.getElementById('monthFilter');
    let mes = '';
    if (monthInput && monthInput.value) {
        mes = monthInput.value;
    } else {
        const now = new Date();
        mes = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
    if (!currentUser) return;
    window.getPresupuestosByUserAndMonth(currentUser.username, mes).then(presupuestos => {
        let ingreso = 0;
        let egreso = 0;
        presupuestos.forEach(p => {
            ingreso += Number(p.ingresoEsperado) || 0;
            egreso += Number(p.egresoEsperado) || 0;
        });
        const balance = ingreso - egreso;
        const summaryItems = document.querySelectorAll('.summary-item span');
        if (summaryItems.length >= 3) {
            summaryItems[0].textContent = `$${ingreso}`;
            summaryItems[1].textContent = `$${egreso}`;
            summaryItems[2].textContent = `$${balance}`;
        }
    });
}

// Actualizar dashboard al cambiar el mes
const monthInput = document.getElementById('monthFilter');
if (monthInput) {
    monthInput.addEventListener('change', updateDashboardSummary);
}

// Llama a updateDashboardSummary al cargar la página
document.addEventListener('DOMContentLoaded', updateDashboardSummary);

// indexeddb.js
request.onupgradeneeded = function(event) {
    db = event.target.result;
    if (!db.objectStoreNames.contains("presupuestos")) {
        db.createObjectStore("presupuestos", { keyPath: "id", autoIncrement: true });
    }
    // ...
};

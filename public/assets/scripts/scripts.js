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

function getGastosPorCategoriaFiltrado(month) {
    const cats = ['Alimentación', 'Transporte', 'Ocio', 'Servicios', 'Salud', 'Educación', 'Otros'];
    const filtered = getFilteredTransacciones(month).filter(t => t.tipo === 'Egreso');
    // Solo incluye categorías con gasto > 0
    const result = cats.map(cat => {
        const total = filtered.filter(t => t.categoria === cat).reduce((sum, t) => sum + t.monto, 0);
        return { cat, total };
    }).filter(item => item.total > 0);
    return {
        labels: result.map(item => item.cat),
        data: result.map(item => item.total)
    };
}

const chartData = {
    gastosCategoria: function(month) {
        const gastos = getGastosPorCategoriaFiltrado(month);
        return {
            type: 'doughnut',
            data: {
                labels: gastos.labels,
                datasets: [{
                    data: gastos.data,
                    backgroundColor: ['#58a6ff', '#f39c12', '#e74c3c', '#8e44ad', '#27ae60', '#d35400', '#95a5a6'].slice(0, gastos.labels.length),
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
    balanceMensual: function() {
        // Gráfico de línea: muestra el balance real y el estimado de los últimos 6 meses + actual
        const meses = [];
        const balancesEstimados = [];
        const balancesReales = [];
        const now = new Date();
        const promesas = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const mesStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            meses.push(mesToString(mesStr));
            promesas.push(
                Promise.all([
                    window.getPresupuestosByUserAndMonth(currentUser, mesStr),
                    Promise.resolve(getFilteredTransacciones(mesStr))
                ]).then(([presupuestos, trans]) => {
                    let ingresoEst = 0, egresoEst = 0;
                    if (presupuestos && presupuestos.length > 0) {
                        ingresoEst = Number(presupuestos[0].ingresoEsperado) || 0;
                        egresoEst = Number(presupuestos[0].egresoEsperado) || 0;
                    }
                    const ingresoReal = trans.filter(t => t.tipo === "Ingreso").reduce((sum, t) => sum + Number(t.monto), 0);
                    const egresoReal = trans.filter(t => t.tipo === "Egreso").reduce((sum, t) => sum + Number(t.monto), 0);
                    return {
                        balanceEstimado: ingresoEst - egresoEst,
                        balanceReal: ingresoReal - egresoReal
                    };
                })
            );
        }
        // Devuelve una promesa que resuelve el config del gráfico
        return Promise.all(promesas).then(results => {
            results.forEach(r => {
                balancesEstimados.push(r.balanceEstimado);
                balancesReales.push(r.balanceReal);
            });
            return {
                type: 'line',
                data: {
                    labels: meses,
                    datasets: [
                        {label: 'Balance Estimado', data: balancesEstimados, borderColor: '#58a6ff', fill: false},
                        {label: 'Balance Real', data: balancesReales, borderColor: '#e74c3c', fill: false}
                    ]
                },
                options: {responsive: true, plugins: {legend: {position: 'bottom'}}}
            };
        });
    },
    ingresosComparativo: function() {
        // Gráfico de barras: muestra ingresos estimados y reales de los últimos 6 meses + actual
        const meses = [];
        const ingresosEstimados = [];
        const ingresosReales = [];
        const now = new Date();
        const promesas = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const mesStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            meses.push(mesToString(mesStr));
            promesas.push(
                Promise.all([
                    window.getPresupuestosByUserAndMonth(currentUser, mesStr),
                    Promise.resolve(getFilteredTransacciones(mesStr))
                ]).then(([presupuestos, trans]) => {
                    let ingresoEst = 0;
                    if (presupuestos && presupuestos.length > 0) {
                        ingresoEst = Number(presupuestos[0].ingresoEsperado) || 0;
                    }
                    const ingresoReal = trans.filter(t => t.tipo === "Ingreso").reduce((sum, t) => sum + Number(t.monto), 0);
                    return {
                        ingresoEstimado: ingresoEst,
                        ingresoReal: ingresoReal
                    };
                })
            );
        }
        return Promise.all(promesas).then(results => {
            results.forEach(r => {
                ingresosEstimados.push(r.ingresoEstimado);
                ingresosReales.push(r.ingresoReal);
            });
            return {
                type: 'bar',
                data: {
                    labels: meses,
                    datasets: [
                        {label: 'Ingreso Estimado', data: ingresosEstimados, backgroundColor: '#58a6ff'},
                        {label: 'Ingreso Real', data: ingresosReales, backgroundColor: '#27ae60'}
                    ]
                },
                options: {responsive: true, plugins: {legend: {position: 'bottom'}}}
            };
        });
    },
    evolucionBalance: function() {
        // Gráfico de línea: evolución del balance real mes a mes (últimos 12 meses)
        const meses = [];
        const balances = [];
        const now = new Date();
        const promesas = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const mesStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            meses.push(mesToString(mesStr));
            promesas.push(
                Promise.resolve(getFilteredTransacciones(mesStr)).then(trans => {
                    const ingreso = trans.filter(t => t.tipo === "Ingreso").reduce((sum, t) => sum + Number(t.monto), 0);
                    const egreso = trans.filter(t => t.tipo === "Egreso").reduce((sum, t) => sum + Number(t.monto), 0);
                    return ingreso - egreso;
                })
            );
        }
        return Promise.all(promesas).then(results => {
            results.forEach(bal => balances.push(bal));
            return {
                type: 'line',
                data: {
                    labels: meses,
                    datasets: [
                        {label: 'Balance', data: balances, borderColor: '#58a6ff', fill: true, backgroundColor: 'rgba(88,166,255,0.1)'}
                    ]
                },
                options: {responsive: true, plugins: {legend: {position: 'bottom'}}}
            };
        });
    },
    distribucionGastosIngresos: function(month) {
        // Gráfico de barras: compara egresos reales vs ingresos reales del mes seleccionado
        const trans = getFilteredTransacciones(month);
        const ingreso = trans.filter(t => t.tipo === "Ingreso").reduce((sum, t) => sum + Number(t.monto), 0);
        const egreso = trans.filter(t => t.tipo === "Egreso").reduce((sum, t) => sum + Number(t.monto), 0);
        return {
            type: 'bar',
            data: {
                labels: ['Gastos', 'Ingresos'],
                datasets: [
                    {label: 'Distribución', data: [egreso, ingreso], backgroundColor: ['#e74c3c', '#27ae60']}
                ]
            },
            options: {responsive: true, plugins: {legend: {display: false}}}
        };
    }
};

// Modifica renderChart para soportar promesas en los gráficos dinámicos
function renderChart(type) {
    if (!chartCanvas) return;
    if (finanzasChart) {
        finanzasChart.destroy();
    }
    let configFn = chartData[type];
    const month = monthFilter ? monthFilter.value : '';
    let configPromise;
    if (typeof configFn === 'function') {
        // Si la función devuelve una promesa, espera a que se resuelva
        const result = configFn(type === "gastosCategoria" || type === "distribucionGastosIngresos" ? month : undefined);
        if (result && typeof result.then === "function") {
            configPromise = result;
        } else {
            configPromise = Promise.resolve(result);
        }
    } else {
        configPromise = Promise.resolve(configFn);
    }
    configPromise.then(config => {
        finanzasChart = new Chart(chartCanvas, config);
    });
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
            // Cambia aquí: usa el valor del select de categorías
            const categoria = document.getElementById('transCategoriaSelect')?.value || '';
            const descripcion = transForm.querySelector('input[placeholder="Descripción"]').value;
            if (fecha && categoria && monto && currentUser) {
                const nuevaTrans = {fecha, tipo, categoria, monto, descripcion, username: currentUser};
                window.addTransaccion(nuevaTrans).then(() => {
                    window.getTransaccionesByUser(currentUser).then(trs => {
                        transacciones = trs;
                        renderChart(chartTypeSelect.value);
                        renderTransTable();
                        updateDashboardSummary();
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
    } else {
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

            // Botón eliminar (abre el modal)
            li.querySelector('.delete-cat-btn').onclick = function() {
                openDeleteCatModal(cat.id, cat.nombre);
            };
        });
    }

    // Llenar el selector de categorías en el formulario de transacciones
    const catSelect = document.getElementById('transCategoriaSelect');
    if (catSelect) {
        catSelect.innerHTML = '';
        if (!categorias.length) {
            const opt = document.createElement('option');
            opt.value = '';
            opt.textContent = 'Sin categorías';
            catSelect.appendChild(opt);
        } else {
            categorias.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat.nombre;
                opt.textContent = cat.nombre;
                catSelect.appendChild(opt);
            });
        }
    }
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
            username: currentUser,
            mes,
            ingresoEsperado,
            egresoEsperado
        }).then(() => {
            refreshBudgetsTablesAndDashboard();
            presupuestoForm.reset();
        });
    };
}

// Mostrar tabla de presupuestos por mes en la configuración de presupuestos
function loadPresupuestosMesConfigTable() {
    if (!currentUser) return;
    window.getAllPresupuestosByUser(currentUser).then(presupuestos => {
        presupuestos.sort((a, b) => (a.mes < b.mes ? 1 : -1));
        const tbody = document.querySelector("#presupuestosMesConfigTable tbody");
        if (!tbody) return;
        tbody.innerHTML = "";
        if (!presupuestos.length) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:#888;">Sin presupuestos registrados</td></tr>`;
            return;
        }
        presupuestos.forEach(p => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${mesToString(p.mes)}</td>
                <td>$${p.ingresoEsperado || 0}</td>
                <td>$${p.egresoEsperado || 0}</td>
            `;
            tbody.appendChild(tr);
        });
    });
}

// Refresca la tabla y el dashboard después de guardar o editar presupuesto
function refreshBudgetsTablesAndDashboard() {
    loadPresupuestosMesConfigTable();
    updateDashboardSummary();
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
    presupuestoMesInput.addEventListener('change', loadPresupuestosMesConfigTable);
}

// Actualizar dashboard con los datos del presupuesto y los montos reales del mes seleccionado
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

    // Obtiene los montos reales de transacciones del mes
    const trans = getFilteredTransacciones(mes);
    const ingresoReal = trans.filter(t => t.tipo === "Ingreso").reduce((sum, t) => sum + Number(t.monto), 0);
    const egresoReal = trans.filter(t => t.tipo === "Egreso").reduce((sum, t) => sum + Number(t.monto), 0);
    const balanceReal = ingresoReal - egresoReal;

    // Muestra los montos reales en el dashboard
    const ingresosEl = document.getElementById('dashboardIngresos');
    const gastosEl = document.getElementById('dashboardGastos');
    const balanceEl = document.getElementById('dashboardBalance');
    if (ingresosEl) ingresosEl.textContent = `$${ingresoReal}`;
    if (gastosEl) gastosEl.textContent = `$${egresoReal}`;
    if (balanceEl) balanceEl.textContent = `$${balanceReal}`;
};


// Actualizar dashboard al cambiar el mes
const monthInput = document.getElementById('monthFilter');
if (monthInput) {
    monthInput.addEventListener('change', updateDashboardSummary);
}

// Llama a updateDashboardSummary al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    updateDashboardSummary();
    loadPresupuestosMesConfigTable();
});

// --- Mensaje global estilo Bellance ---
function showGlobalMsg(msg, timeout = 3500) {
    const cont = document.getElementById('globalMsg');
    const txt = document.getElementById('globalMsgText');
    if (!cont || !txt) return;
    txt.textContent = msg;
    cont.style.display = 'flex';
    if (timeout > 0) {
        if (cont._timeout) clearTimeout(cont._timeout);
        cont._timeout = setTimeout(() => { cont.style.display = 'none'; }, timeout);
    }
}
function hideGlobalMsg() {
    const cont = document.getElementById('globalMsg');
    if (cont) cont.style.display = 'none';
}
const globalMsgClose = document.getElementById('globalMsgClose');
if (globalMsgClose) {
    globalMsgClose.onclick = hideGlobalMsg;
}

// --- Modal de confirmación para eliminar categoría ---
let catToDeleteId = null;
const deleteCatModal = document.getElementById('deleteCatModal');
const deleteCatConfirm = document.getElementById('deleteCatConfirm');
const deleteCatCancel = document.getElementById('deleteCatCancel');

function openDeleteCatModal(catId, catName) {
    catToDeleteId = catId;
    const msg = document.getElementById('deleteCatMsg');
    if (msg) msg.textContent = `¿Seguro que deseas eliminar la categoría "${catName}"?`;
    if (deleteCatModal) deleteCatModal.style.display = 'flex';
}
function closeDeleteCatModal() {
    catToDeleteId = null;
    if (deleteCatModal) deleteCatModal.style.display = 'none';
}
if (deleteCatCancel) deleteCatCancel.onclick = closeDeleteCatModal;
if (deleteCatConfirm) {
    deleteCatConfirm.onclick = function() {
        if (catToDeleteId !== null) {
            window.deleteCategoria(catToDeleteId)
                .then(() => {
                    loadCategorias();
                    closeDeleteCatModal();
                })
                .catch(err => {
                    showGlobalMsg("No se pudo eliminar la categoría. Puede estar en uso en alguna transacción.", 4000);
                    closeDeleteCatModal();
                });
        }
    };
}


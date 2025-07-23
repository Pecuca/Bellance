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
            // Permitir cualquier usuario y contraseña
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
                    regMsg.textContent = 'El usuario ya existe.';
                    regMsg.style.display = 'block';
                } else {
                    window.addUsuario({username: user, password: pass}).then(() => {
                        regMsg.textContent = 'Usuario registrado. Ahora puedes iniciar sesión.';
                        regMsg.style.display = 'block';
                    });
                }
            });
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
let transacciones = [
    {fecha: '2025-07-01', tipo: 'Ingreso', categoria: 'Salario', monto: 2000, descripcion: 'Pago mensual'},
    {fecha: '2025-07-03', tipo: 'Egreso', categoria: 'Alimentación', monto: 150, descripcion: 'Supermercado'},
    {fecha: '2025-07-05', tipo: 'Egreso', categoria: 'Transporte', monto: 60, descripcion: 'Bus'},
    {fecha: '2025-07-10', tipo: 'Egreso', categoria: 'Ocio', monto: 80, descripcion: 'Cine'},
    {fecha: '2025-07-12', tipo: 'Egreso', categoria: 'Servicios', monto: 90, descripcion: 'Luz'},
    {fecha: '2025-07-15', tipo: 'Egreso', categoria: 'Salud', monto: 60, descripcion: 'Farmacia'},
    {fecha: '2025-07-18', tipo: 'Egreso', categoria: 'Educación', monto: 40, descripcion: 'Libros'},
    {fecha: '2025-07-20', tipo: 'Egreso', categoria: 'Otros', monto: 30, descripcion: 'Varios'}
];

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
    const transForm = document.querySelector('#transactions form');
    if (transForm) {
        transForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const tipo = transForm.querySelector('select').value;
            const monto = Number(transForm.querySelector('input[type="number"]').value);
            const fecha = transForm.querySelector('input[type="date"]').value;
            const categoria = transForm.querySelector('input[placeholder="Categoría"]').value;
            const descripcion = transForm.querySelector('input[placeholder="Descripción"]').value;
            if (fecha && categoria && monto) {
                transacciones.push({fecha, tipo, categoria, monto, descripcion});
                renderChart(chartTypeSelect.value);
            }
        });
    }
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
    window.addEventListener('click', (e) => {
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

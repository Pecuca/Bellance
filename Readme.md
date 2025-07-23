# PocketPiggyPlanner

Sistema de Finanzas Personales - Bellance

## Descripción

PocketPiggyPlanner es una aplicación web para la gestión de finanzas personales. Permite registrar ingresos, egresos, categorías, presupuestos mensuales y visualizar gráficos de tu situación financiera. Todo funciona localmente en tu navegador usando IndexedDB, sin necesidad de backend.

## Requisitos

- Navegador moderno (Chrome, Firefox, Edge, Safari)
- No requiere instalación ni servidor backend

## Instalación y uso

1. **Descarga o clona este repositorio**  
   ```
   git clone https://github.com/tuusuario/PocketPiggyPlanner.git
   ```

2. **Abre el archivo `index.html`**  
   Navega a la carpeta del proyecto y abre el archivo `index.html` en tu navegador.

3. **¡Listo!**  
   Puedes crear tu usuario, registrar transacciones, presupuestos y ver tus estadísticas.

## Estructura del proyecto

- `/public/index.html` - Página principal de la aplicación
- `/public/assets/styles/main.css` - Estilos principales
- `/public/assets/scripts/scripts.js` - Lógica de la aplicación
- `/public/assets/scripts/indexeddb.js` - Funciones para almacenamiento local
- `/public/assets/img/` - Imágenes y logos
- `/public/assets/fonts/` - Fuentes personalizadas

## Funcionalidades principales

- **Registro e inicio de sesión** (local, por usuario)
- **Gestión de transacciones** (ingresos y egresos)
- **Gestión de categorías** (crear, editar, eliminar)
- **Presupuestos mensuales** (ingreso y egreso esperado)
- **Visualización de gráficos** (Chart.js)
- **Ajustes de perfil** (nombre, contraseña, formato de moneda)
- **Modo pastel y diseño amigable**

## Personalización

- Puedes modificar los colores y estilos en `main.css`.
- Para agregar más monedas, edita el `<select>` de moneda en el modal de ajustes.

## Créditos

Desarrollado por Alex Hernandez y Ronald del Moral  
Materia: Clientes Web 2025B

---

**¡Disfruta organizando tus finanzas!**
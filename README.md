# Lemon-Sys 🍋

Sistema ERP para **Bebidas y Abarrotes S.A.**, distribuidora guatemalteca de productos base limón.

Demo en vivo: **[https://EsvinAmbrocio.github.io/lemon-sys/](https://EsvinAmbrocio.github.io/lemon-sys/)**

---

## Descripción

Lemon-Sys es un ERP frontend completo que funciona **100% offline**, sin backend ni base de datos en servidor. Todos los datos se almacenan en el navegador mediante IndexedDB.

Incluye gestión de producción, logística, ventas y finanzas con 4 meses de historial pre-cargado automáticamente al abrir por primera vez.

---

## Credenciales de acceso

| Usuario | Correo | Contraseña | Módulos |
|---|---|---|---|
| Administrador | admin@lemonsys.com | admin123 | Todo |
| Producción | produccion@lemonsys.com | prod123 | Producción |
| Logística | logistica@lemonsys.com | logis123 | Logística |
| Ventas | ventas@lemonsys.com | ventas123 | Ventas |
| Finanzas | finanzas@lemonsys.com | finanzas123 | Finanzas |

---

## Módulos

### Producción
- **Productos** — catálogo con tipo Venta (terminados) / Compra (insumos/materias primas)
- **Recetas** — fórmulas de producción con insumos, cantidades y costo estimado por batch
- **Lotes** — control de lotes con fechas de vencimiento, alertas a 30 días y bloqueo automático
- **Inventario** — stock disponible por producto y presentación
- **Movimientos** — historial de entradas y salidas

### Logística
- **Proveedores** — directorio con NIT guatemalteco
- **Órdenes de Compra** — solo muestra insumos (type=compra), genera lotes al recibir
- **Facturas de Servicios** — registro de facturas por energía, agua, mantenimiento, etc. con IVA 12%
- **Ruta del Día** — pedidos agrupados por zona de entrega
- **Entregas** — seguimiento de estado de entregas

### Ventas
- **Clientes** — con NIT / CF, 4 listas de precios, crédito configurable
- **Pedidos** — pedidos mayoristas por cajas, solo muestra productos terminados (type=venta)
- **Facturas** — vista imprimible con IVA desglosado
- **Promociones** — descuentos por porcentaje o monto fijo
- **Reportes** — ventas por período y categoría con gráficas

### Finanzas
- **Cuentas por Cobrar** — seguimiento de facturas a crédito
- **Cuentas por Pagar** — control de OC a crédito
- **Gastos** — registro de gastos operativos por categoría
- **Flujo de Caja** — movimientos de ingresos y egresos

### Configuración *(solo Admin)*
- Usuarios, zonas de entrega, catálogos y **Reset de Base de Datos**

---

## Stack tecnológico

| Tecnología | Uso |
|---|---|
| Vue 3 + Vite | Framework y bundler |
| Vuetify 3 | UI components (tema verde limón) |
| Pinia | Estado global (sesión) |
| Vue Router 4 | Navegación con guardias por rol |
| Dexie.js | Wrapper de IndexedDB |
| vue-chartjs | Gráficas en Dashboard |
| Driver.js | Tour guiado por módulo |
| date-fns | Manejo de fechas |

---

## Características técnicas

- **FIFO automático** en despacho, excluyendo lotes vencidos
- **Alertas automáticas** de lotes próximos a vencer (30 días) y stock bajo
- **IVA 12%** desglosado en facturas (Guatemala)
- **NIT guatemalteco** formato `1234567-8`, consumidor final = `CF`
- **Moneda Quetzal (Q)** con locale `es-GT`
- **4 listas de precios** (A, B, C, D) con multiplicador por lista
- **Tour guiado** con Driver.js — arranca automático la primera vez, botón `?` para relanzar
- **Seed automático** — al abrir por primera vez carga 4 meses de historial de ventas, compras, lotes y movimientos

---

## Instalación local

```bash
# Clonar el repositorio
git clone https://github.com/EsvinAmbrocio/lemon-sys.git
cd lemon-sys

# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev

# Build para producción
npm run build
```

El sistema estará disponible en `http://localhost:5173`

> **Nota:** Si es la primera vez que abres el sistema, el seed carga automáticamente. Si quieres reiniciar los datos, ve a **Configuración → Catálogos → Reiniciar Base de Datos**.

---

## Despliegue

El proyecto se despliega automáticamente en GitHub Pages al hacer push a `main`.

```bash
git add .
git commit -m "mensaje"
git push origin main
```

El workflow en `.github/workflows/deploy.yml` se encarga del build y publicación.

---

## Estructura del proyecto

```
src/
├── components/
│   └── common/          # LemonLogo, AlertsBell, KpiCard
├── composables/
│   ├── useAlerts.js     # Alertas de lotes y stock
│   └── useTour.js       # Tour guiado Driver.js
├── db/
│   ├── db.js            # Esquema Dexie (IndexedDB)
│   └── seed.js          # Datos de prueba (4 meses)
├── layouts/
│   ├── AppLayout.vue    # Sidebar + navbar
│   └── AuthLayout.vue   # Layout de login
├── plugins/
│   └── vuetify.js       # Tema lemonTheme
├── router/
│   └── index.js         # Rutas + guardias por rol
├── stores/
│   └── auth.js          # Pinia — sesión de usuario
└── views/
    ├── auth/
    ├── dashboard/
    ├── produccion/      # Productos, Recetas, Lotes, Inventario, Movimientos
    ├── logistica/       # Proveedores, OC, Fact. Servicios, Ruta, Entregas
    ├── ventas/          # Clientes, Pedidos, Facturas, Promociones, Reportes
    ├── finanzas/        # CxC, CxP, Gastos, Flujo de Caja
    └── configuracion/   # Usuarios, Zonas, Catálogos
```

---

## Proyecto universitario

Curso: Introducción a Sistemas  
Universidad: —  
Integrantes: —

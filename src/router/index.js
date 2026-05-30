import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    component: () => import('@/layouts/AuthLayout.vue'),
    children: [
      { path: '', name: 'login', component: () => import('@/views/auth/LoginView.vue') }
    ]
  },
  {
    path: '/',
    component: () => import('@/layouts/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', name: 'dashboard', component: () => import('@/views/dashboard/DashboardView.vue'), meta: { roles: ['admin','produccion','logistica','ventas','finanzas'] } },
      // Producción
      { path: 'produccion/productos',    name: 'productos',    component: () => import('@/views/produccion/ProductosView.vue'),    meta: { roles: ['admin','produccion'] } },
      { path: 'produccion/recetas',      name: 'recetas',      component: () => import('@/views/produccion/RecetasView.vue'),      meta: { roles: ['admin','produccion'] } },
      { path: 'produccion/inventario',   name: 'inventario',   component: () => import('@/views/produccion/InventarioView.vue'),   meta: { roles: ['admin','produccion','logistica'] } },
      { path: 'produccion/movimientos',  name: 'movimientos',  component: () => import('@/views/produccion/MovimientosView.vue'),  meta: { roles: ['admin','produccion'] } },
      { path: 'produccion/lotes',        name: 'lotes',        component: () => import('@/views/produccion/LotesView.vue'),        meta: { roles: ['admin','produccion'] } },
      // Logística
      { path: 'logistica/proveedores',   name: 'proveedores',  component: () => import('@/views/logistica/ProveedoresView.vue'),   meta: { roles: ['admin','logistica'] } },
      { path: 'logistica/compras',       name: 'compras',      component: () => import('@/views/logistica/OrdenesCompraView.vue'), meta: { roles: ['admin','logistica'] } },
      { path: 'logistica/facturas-compra', name: 'facturas-compra', component: () => import('@/views/logistica/FacturasCompraView.vue'), meta: { roles: ['admin','logistica','finanzas'] } },
      { path: 'logistica/entregas',      name: 'entregas',     component: () => import('@/views/logistica/EntregasView.vue'),      meta: { roles: ['admin','logistica'] } },
      { path: 'logistica/ruta-dia',      name: 'ruta-dia',     component: () => import('@/views/logistica/RutaDiaView.vue'),       meta: { roles: ['admin','logistica'] } },
      // Ventas
      { path: 'ventas/clientes',         name: 'clientes',     component: () => import('@/views/ventas/ClientesView.vue'),         meta: { roles: ['admin','ventas'] } },
      { path: 'ventas/pedidos',          name: 'pedidos',      component: () => import('@/views/ventas/PedidosView.vue'),          meta: { roles: ['admin','ventas'] } },
      { path: 'ventas/facturas',         name: 'facturas',     component: () => import('@/views/ventas/FacturasView.vue'),         meta: { roles: ['admin','ventas','finanzas'] } },
      { path: 'ventas/promociones',      name: 'promociones',  component: () => import('@/views/ventas/PromocionesView.vue'),      meta: { roles: ['admin','ventas'] } },
      { path: 'ventas/reportes',         name: 'reportes',     component: () => import('@/views/ventas/ReportesView.vue'),         meta: { roles: ['admin','ventas','finanzas'] } },
      // Finanzas
      { path: 'finanzas/cxc',            name: 'cxc',          component: () => import('@/views/finanzas/CxCView.vue'),            meta: { roles: ['admin','finanzas'] } },
      { path: 'finanzas/cxp',            name: 'cxp',          component: () => import('@/views/finanzas/CxPView.vue'),            meta: { roles: ['admin','finanzas'] } },
      { path: 'finanzas/gastos',         name: 'gastos',       component: () => import('@/views/finanzas/GastosView.vue'),         meta: { roles: ['admin','finanzas'] } },
      { path: 'finanzas/flujo-caja',     name: 'flujo-caja',   component: () => import('@/views/finanzas/FlujoCajaView.vue'),      meta: { roles: ['admin','finanzas'] } },
      // Configuración
      { path: 'configuracion/usuarios',  name: 'usuarios',     component: () => import('@/views/configuracion/UsuariosView.vue'),  meta: { roles: ['admin'] } },
      { path: 'configuracion/zonas',     name: 'zonas',        component: () => import('@/views/configuracion/ZonasView.vue'),     meta: { roles: ['admin'] } },
      { path: 'configuracion/catalogos', name: 'catalogos',    component: () => import('@/views/configuracion/CatalogosView.vue'), meta: { roles: ['admin'] } },
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated) return next('/login')
  if (to.path === '/login' && auth.isAuthenticated) return next('/dashboard')
  if (to.meta.roles && !to.meta.roles.includes(auth.role)) return next('/dashboard')
  next()
})

export default router

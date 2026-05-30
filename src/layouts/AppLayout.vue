<template>
  <v-app theme="lemonTheme">
    <!-- Navigation Drawer -->
    <v-navigation-drawer v-model="drawer" :rail="rail" permanent color="primary" class="lemon-drawer">
      <!-- Logo -->
      <div class="sidebar-logo pa-4 d-flex align-center" :class="rail ? 'justify-center' : ''">
        <LemonLogo :size="rail ? 32 : 40" />
        <Transition name="fade">
          <div v-if="!rail" class="ml-3">
            <div class="text-white font-weight-bold" style="font-size:15px; line-height:1.2">Lemon-Sys</div>
            <div class="text-green-lighten-3" style="font-size:10px; line-height:1.2">Control y Distribución</div>
          </div>
        </Transition>
      </div>

      <v-divider color="rgba(255,255,255,0.2)" />

      <!-- User chip -->
      <div class="pa-3" v-if="!rail">
        <v-chip color="rgba(255,255,255,0.15)" text-color="white" size="small" class="w-100" style="border-radius:8px">
          <v-avatar color="white" size="22" class="mr-2">
            <span class="text-primary font-weight-bold" style="font-size:11px">{{ userInitials }}</span>
          </v-avatar>
          <span class="text-white text-truncate" style="font-size:12px; max-width:120px">{{ auth.userName }}</span>
          <v-spacer />
          <v-chip color="accent" size="x-small" class="ml-1">{{ roleLabel }}</v-chip>
        </v-chip>
      </div>

      <v-list density="compact" nav class="px-2">
        <!-- Dashboard -->
        <v-list-item
          v-for="item in visibleNav"
          :key="item.to"
          :to="item.to"
          :prepend-icon="item.icon"
          :title="rail ? '' : item.title"
          rounded="lg"
          class="nav-item mb-1"
          active-class="nav-item-active"
        >
          <template #append v-if="!rail && item.badge">
            <v-badge :content="item.badge" color="error" inline />
          </template>
        </v-list-item>

        <!-- Sections -->
        <template v-for="section in visibleSections" :key="section.title">
          <v-list-subheader v-if="!rail" class="text-green-lighten-3 mt-2 px-2" style="font-size:10px; font-weight:600; letter-spacing:1px; text-transform:uppercase">
            {{ section.title }}
          </v-list-subheader>
          <v-divider v-else color="rgba(255,255,255,0.15)" class="my-1" />
          <v-list-item
            v-for="item in section.items"
            :key="item.to"
            :to="item.to"
            :prepend-icon="item.icon"
            :title="rail ? '' : item.title"
            rounded="lg"
            class="nav-item mb-1"
            active-class="nav-item-active"
          >
            <template #append v-if="!rail && item.badge">
              <v-badge :content="item.badge" color="error" inline />
            </template>
          </v-list-item>
        </template>
      </v-list>

      <template #append>
        <v-divider color="rgba(255,255,255,0.2)" />
        <div class="pa-2">
          <v-list-item
            prepend-icon="mdi-logout"
            :title="rail ? '' : 'Cerrar Sesión'"
            rounded="lg"
            class="nav-item"
            @click="handleLogout"
          />
        </div>
      </template>
    </v-navigation-drawer>

    <!-- App Bar -->
    <v-app-bar elevation="0" color="white" border="b">
      <v-app-bar-nav-icon @click="toggleRail" color="primary" />
      <v-toolbar-title>
        <span class="text-primary font-weight-bold">{{ currentPageTitle }}</span>
      </v-toolbar-title>
      <template #append>
        <AlertsBell />
        <v-btn icon="mdi-help-circle-outline" color="primary" variant="text" @click="replayTour" title="Ver tutorial" />
      </template>
    </v-app-bar>

    <!-- Main content -->
    <v-main style="background:#F9FBE7; min-height:100vh">
      <v-container fluid class="pa-6">
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LemonLogo from '@/components/common/LemonLogo.vue'
import AlertsBell from '@/components/common/AlertsBell.vue'
import { useAlerts } from '@/composables/useAlerts'
import { useTour } from '@/composables/useTour'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const drawer = ref(true)
const rail = ref(false)

const { alertCount } = useAlerts()
const { replayTour } = useTour()

function toggleRail() { rail.value = !rail.value }

const roleLabel = computed(() => ({
  admin: 'Admin', produccion: 'Producción', logistica: 'Logística', ventas: 'Ventas', finanzas: 'Finanzas'
}[auth.role] || auth.role))

const userInitials = computed(() => auth.userName.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase())

const allNav = {
  dashboard: { to: '/dashboard', icon: 'mdi-view-dashboard', title: 'Dashboard', roles: ['admin','produccion','logistica','ventas','finanzas'] },
}

const allSections = [
  {
    title: 'Producción',
    roles: ['admin','produccion','logistica'],
    items: [
      { to: '/produccion/productos',   icon: 'mdi-package-variant',    title: 'Productos',   roles: ['admin','produccion'] },
      { to: '/produccion/recetas',     icon: 'mdi-flask-outline',      title: 'Recetas',     roles: ['admin','produccion'] },
      { to: '/produccion/lotes',       icon: 'mdi-layers-outline',     title: 'Lotes',       roles: ['admin','produccion'] },
      { to: '/produccion/inventario',  icon: 'mdi-warehouse',          title: 'Inventario',  roles: ['admin','produccion','logistica'] },
      { to: '/produccion/movimientos', icon: 'mdi-swap-horizontal',    title: 'Movimientos', roles: ['admin','produccion'] },
    ]
  },
  {
    title: 'Logística',
    roles: ['admin','logistica','finanzas'],
    items: [
      { to: '/logistica/proveedores',     icon: 'mdi-truck-outline',       title: 'Proveedores',       roles: ['admin','logistica'] },
      { to: '/logistica/compras',         icon: 'mdi-cart-outline',        title: 'Órd. de Compra',    roles: ['admin','logistica'] },
      { to: '/logistica/facturas-compra', icon: 'mdi-receipt-text-outline',title: 'Fact. Servicios',   roles: ['admin','logistica','finanzas'] },
      { to: '/logistica/ruta-dia',        icon: 'mdi-map-marker-path',     title: 'Ruta del Día',      roles: ['admin','logistica'] },
      { to: '/logistica/entregas',        icon: 'mdi-package-check',       title: 'Entregas',          roles: ['admin','logistica'] },
    ]
  },
  {
    title: 'Ventas',
    roles: ['admin','ventas'],
    items: [
      { to: '/ventas/clientes',    icon: 'mdi-account-group',      title: 'Clientes',    roles: ['admin','ventas'] },
      { to: '/ventas/pedidos',     icon: 'mdi-clipboard-list',     title: 'Pedidos',     roles: ['admin','ventas'] },
      { to: '/ventas/facturas',    icon: 'mdi-receipt-text',       title: 'Facturas',    roles: ['admin','ventas','finanzas'] },
      { to: '/ventas/promociones', icon: 'mdi-tag-multiple',       title: 'Promociones', roles: ['admin','ventas'] },
      { to: '/ventas/reportes',    icon: 'mdi-chart-bar',          title: 'Reportes',    roles: ['admin','ventas','finanzas'] },
    ]
  },
  {
    title: 'Finanzas',
    roles: ['admin','finanzas'],
    items: [
      { to: '/finanzas/cxc',        icon: 'mdi-cash-plus',         title: 'Cuentas x Cobrar', roles: ['admin','finanzas'] },
      { to: '/finanzas/cxp',        icon: 'mdi-cash-minus',        title: 'Cuentas x Pagar',  roles: ['admin','finanzas'] },
      { to: '/finanzas/gastos',     icon: 'mdi-bank-minus',        title: 'Gastos',            roles: ['admin','finanzas'] },
      { to: '/finanzas/flujo-caja', icon: 'mdi-chart-line',        title: 'Flujo de Caja',     roles: ['admin','finanzas'] },
    ]
  },
  {
    title: 'Configuración',
    roles: ['admin'],
    items: [
      { to: '/configuracion/usuarios',  icon: 'mdi-account-cog',   title: 'Usuarios', roles: ['admin'] },
      { to: '/configuracion/zonas',     icon: 'mdi-map-outline',   title: 'Zonas',    roles: ['admin'] },
      { to: '/configuracion/catalogos', icon: 'mdi-format-list-bulleted', title: 'Catálogos', roles: ['admin'] },
    ]
  },
]

const visibleNav = computed(() =>
  Object.values(allNav).filter(i => i.roles.includes(auth.role))
)
const visibleSections = computed(() =>
  allSections
    .filter(s => s.roles.includes(auth.role))
    .map(s => ({ ...s, items: s.items.filter(i => i.roles.includes(auth.role)) }))
    .filter(s => s.items.length > 0)
)

const routeTitles = {
  '/dashboard': 'Dashboard',
  '/produccion/productos': 'Productos',
  '/produccion/recetas': 'Recetas de Producción',
  '/produccion/lotes': 'Gestión de Lotes',
  '/produccion/inventario': 'Inventario',
  '/produccion/movimientos': 'Movimientos de Stock',
  '/logistica/proveedores': 'Proveedores',
  '/logistica/compras': 'Órdenes de Compra',
  '/logistica/facturas-compra': 'Facturas de Servicios',
  '/logistica/ruta-dia': 'Ruta del Día',
  '/logistica/entregas': 'Entregas',
  '/ventas/clientes': 'Clientes',
  '/ventas/pedidos': 'Pedidos Mayoristas',
  '/ventas/facturas': 'Facturas',
  '/ventas/promociones': 'Promociones',
  '/ventas/reportes': 'Reportes de Ventas',
  '/finanzas/cxc': 'Cuentas por Cobrar',
  '/finanzas/cxp': 'Cuentas por Pagar',
  '/finanzas/gastos': 'Gastos Operativos',
  '/finanzas/flujo-caja': 'Flujo de Caja',
  '/configuracion/usuarios': 'Usuarios del Sistema',
  '/configuracion/zonas': 'Zonas de Entrega',
  '/configuracion/catalogos': 'Catálogos',
}
const currentPageTitle = computed(() => routeTitles[route.path] || 'Lemon-Sys')

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.lemon-drawer { border-right: none !important; }
.nav-item { color: rgba(255,255,255,0.85) !important; }
.nav-item:hover { background: rgba(255,255,255,0.12) !important; color: white !important; }
.nav-item-active { background: rgba(255,255,255,0.2) !important; color: white !important; font-weight: 600 !important; }
.sidebar-logo { min-height: 64px; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

<template>
  <div>
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h2 class="text-h5 font-weight-bold text-primary">Bienvenido, {{ auth.userName.split(' ')[0] }} 👋</h2>
        <p class="text-body-2 text-medium-emphasis">{{ today }}</p>
      </div>
    </div>

    <!-- KPI Cards -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" lg="3">
        <KpiCard id="kpi-ventas" title="Ventas del Día" :value="fmt(kpis.ventasHoy)" subtitle="Total facturado hoy" icon="mdi-currency-usd" color="primary" text-color="white" icon-color="white" :trend="kpis.trendVentas" />
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <KpiCard id="kpi-stock" title="Stock Bajo Mínimo" :value="kpis.stockBajo" subtitle="Presentaciones por reponer" icon="mdi-package-variant-closed-remove" :icon-color="kpis.stockBajo > 0 ? 'warning' : 'success'" />
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <KpiCard id="kpi-lotes" title="Lotes por Vencer" :value="kpis.lotesPorVencer" subtitle="Próximos 30 días" icon="mdi-clock-alert-outline" :icon-color="kpis.lotesPorVencer > 0 ? 'warning' : 'success'" />
      </v-col>
      <v-col cols="12" sm="6" lg="3">
        <KpiCard id="kpi-cxc" title="CxC Vencidas" :value="fmt(kpis.cxcVencida)" subtitle="Cobro pendiente urgente" icon="mdi-cash-remove" :icon-color="kpis.cxcVencida > 0 ? 'error' : 'success'" />
      </v-col>
    </v-row>

    <!-- Second row KPIs -->
    <v-row class="mb-6">
      <v-col cols="12" sm="4">
        <KpiCard title="Pedidos Activos" :value="kpis.pedidosActivos" subtitle="En preparación o en ruta" icon="mdi-truck-delivery-outline" icon-color="info" />
      </v-col>
      <v-col cols="12" sm="4">
        <KpiCard title="Ventas del Mes" :value="fmt(kpis.ventasMes)" subtitle="Mes actual acumulado" icon="mdi-chart-line" icon-color="secondary" />
      </v-col>
      <v-col cols="12" sm="4">
        <KpiCard title="Lotes Vencidos" :value="kpis.lotesVencidos" subtitle="Bloqueados para venta" icon="mdi-alert-circle-outline" :icon-color="kpis.lotesVencidos > 0 ? 'error' : 'success'" />
      </v-col>
    </v-row>

    <!-- Charts row -->
    <v-row>
      <v-col cols="12" lg="8">
        <v-card rounded="xl" elevation="2" id="chart-ventas">
          <v-card-title class="pa-5 pb-2 d-flex align-center">
            <v-icon color="primary" class="mr-2">mdi-chart-bar</v-icon>
            Ventas — Últimos 30 Días
          </v-card-title>
          <v-card-text class="pa-4">
            <Bar v-if="ventasChartData.labels.length" :data="ventasChartData" :options="barOptions" height="220" />
            <div v-else class="d-flex align-center justify-center" style="height:220px">
              <v-progress-circular indeterminate color="primary" />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" lg="4">
        <v-card rounded="xl" elevation="2" class="mb-4">
          <v-card-title class="pa-5 pb-2 d-flex align-center">
            <v-icon color="primary" class="mr-2">mdi-chart-pie</v-icon>
            Ventas por Categoría
          </v-card-title>
          <v-card-text class="pa-4">
            <Doughnut v-if="categoriaChartData.labels.length" :data="categoriaChartData" :options="doughnutOptions" height="200" />
            <div v-else class="d-flex align-center justify-center" style="height:200px">
              <v-progress-circular indeterminate color="primary" />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Alertas recientes -->
    <v-row class="mt-2">
      <v-col cols="12" lg="6">
        <v-card rounded="xl" elevation="2">
          <v-card-title class="pa-5 pb-2 d-flex align-center">
            <v-icon color="warning" class="mr-2">mdi-alert</v-icon>
            Alertas Activas
          </v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item v-for="alerta in alertas" :key="alerta.text" :prepend-icon="alerta.icon" :title="alerta.text" :subtitle="alerta.sub" rounded="lg" class="mb-1" :to="alerta.to">
              <template #prepend><v-icon :color="alerta.color">{{ alerta.icon }}</v-icon></template>
              <template #append><v-chip :color="alerta.color" size="x-small">{{ alerta.chip }}</v-chip></template>
            </v-list-item>
            <v-list-item v-if="!alertas.length" title="Sin alertas activas" subtitle="Todo en orden ✓">
              <template #prepend><v-icon color="success">mdi-check-circle</v-icon></template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
      <v-col cols="12" lg="6">
        <v-card rounded="xl" elevation="2">
          <v-card-title class="pa-5 pb-2 d-flex align-center">
            <v-icon color="primary" class="mr-2">mdi-clipboard-clock</v-icon>
            Entregas de Hoy
          </v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item v-for="e in entregasHoy" :key="e.id" :title="`Cliente #${e.customerId}`" :subtitle="statusLabel(e.status)" rounded="lg" class="mb-1" to="/logistica/ruta-dia">
              <template #prepend><v-icon :color="statusColor(e.status)">{{ statusIcon(e.status) }}</v-icon></template>
              <template #append>
                <v-chip :color="statusColor(e.status)" size="x-small">{{ statusLabel(e.status) }}</v-chip>
              </template>
            </v-list-item>
            <v-list-item v-if="!entregasHoy.length" title="Sin entregas programadas hoy">
              <template #prepend><v-icon color="grey">mdi-truck-outline</v-icon></template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { Bar, Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js'
import { format, subDays, startOfMonth, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import db from '@/db/db'
import { useAuthStore } from '@/stores/auth'
import KpiCard from '@/components/common/KpiCard.vue'
import { useTour } from '@/composables/useTour'
import { addDays } from 'date-fns'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

const auth = useAuthStore()
const { startTourIfNew } = useTour()

const today = format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })

const kpis = ref({ ventasHoy: 0, stockBajo: 0, lotesPorVencer: 0, cxcVencida: 0, pedidosActivos: 0, ventasMes: 0, lotesVencidos: 0, trendVentas: 0 })
const ventasChartData = ref({ labels: [], datasets: [] })
const categoriaChartData = ref({ labels: [], datasets: [] })
const alertas = ref([])
const entregasHoy = ref([])

const fmt = (v) => `Q${Number(v || 0).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const barOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { callback: v => 'Q' + v.toLocaleString() } } } }
const doughnutOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } } }

const COLORS = ['#2E7D32','#4CAF50','#8BC34A','#CDDC39','#F9A825','#FF7043','#7E57C2']

function statusLabel(s) { return { nuevo:'Nuevo', preparando:'Preparando', en_ruta:'En Ruta', entregado:'Entregado' }[s] || s }
function statusColor(s) { return { nuevo:'grey', preparando:'info', en_ruta:'warning', entregado:'success' }[s] || 'grey' }
function statusIcon(s)  { return { nuevo:'mdi-new-box', preparando:'mdi-progress-wrench', en_ruta:'mdi-truck', entregado:'mdi-check-circle' }[s] || 'mdi-circle' }

async function loadData() {
  const now = new Date()
  const in30 = addDays(now, 30)
  const mesStart = startOfMonth(now)

  // Ventas hoy y mes
  const invoices = await db.invoices.toArray()
  const ventasHoy = invoices.filter(i => isSameDay(new Date(i.date), now)).reduce((s, i) => s + (i.total || 0), 0)
  const ventasMes = invoices.filter(i => new Date(i.date) >= mesStart).reduce((s, i) => s + (i.total || 0), 0)

  // Trend ventas (vs mismo período mes anterior)
  const mesAnteriorStart = startOfMonth(subDays(mesStart, 1))
  const diasTranscurridos = Math.ceil((now - mesStart) / 86400000)
  const mesAnteriorEnd = addDays(mesAnteriorStart, diasTranscurridos)
  const ventasMesAnterior = invoices.filter(i => new Date(i.date) >= mesAnteriorStart && new Date(i.date) <= mesAnteriorEnd).reduce((s, i) => s + (i.total || 0), 0)
  const trendVentas = ventasMesAnterior > 0 ? Math.round(((ventasMes - ventasMesAnterior) / ventasMesAnterior) * 100) : 0

  // Batches
  const batches = await db.batches.toArray()
  const lotesPorVencer = batches.filter(b => b.available > 0 && new Date(b.expiryDate) > now && new Date(b.expiryDate) <= in30).length
  const lotesVencidos  = batches.filter(b => new Date(b.expiryDate) < now).length

  // Stock bajo (usando minStock default 50)
  const products = await db.products.where('active').equals(1).toArray()
  const presentations = await db.presentations.toArray()
  let stockBajo = 0
  for (const p of products) {
    const pres = presentations.filter(pr => pr.productId === p.id)
    for (const pr of pres) {
      const stock = batches.filter(b => b.presentationId === pr.id && new Date(b.expiryDate) >= now).reduce((s, b) => s + (b.available || 0), 0)
      if (stock < (p.minStock || 50)) stockBajo++
    }
  }

  // CxC vencida
  const cxcVencidas = await db.accountsReceivable.where('status').equals('vencida').toArray()
  const cxcVencida = cxcVencidas.reduce((s, r) => s + (r.amount - r.paidAmount), 0)

  // Pedidos activos
  const pedidosActivos = await db.salesOrders.where('status').anyOf(['preparando','en_ruta']).count()

  kpis.value = { ventasHoy, ventasMes, lotesPorVencer, lotesVencidos, stockBajo, cxcVencida, pedidosActivos, trendVentas }

  // Chart ventas 30 días
  const last30 = Array.from({ length: 30 }, (_, i) => subDays(now, 29 - i))
  const ventasPorDia = last30.map(d => ({
    label: format(d, 'd/M'),
    value: invoices.filter(i => isSameDay(new Date(i.date), d)).reduce((s, i) => s + (i.total || 0), 0)
  }))
  ventasChartData.value = {
    labels: ventasPorDia.map(d => d.label),
    datasets: [{ label: 'Ventas', data: ventasPorDia.map(d => d.value), backgroundColor: '#4CAF50', borderRadius: 4 }]
  }

  // Chart por categoría
  const cats = await db.categories.toArray()
  const salesItems = await db.salesOrderItems.toArray()
  const prods = await db.products.toArray()
  const catTotals = cats.map(c => {
    const catProds = prods.filter(p => p.categoryId === c.id).map(p => p.id)
    const total = salesItems.filter(si => catProds.includes(si.productId)).reduce((s, si) => s + (si.subtotal || 0), 0)
    return { name: c.name, total }
  }).filter(c => c.total > 0)
  categoriaChartData.value = {
    labels: catTotals.map(c => c.name),
    datasets: [{ data: catTotals.map(c => c.total), backgroundColor: COLORS.slice(0, catTotals.length) }]
  }

  // Alertas
  const al = []
  if (lotesVencidos > 0) al.push({ icon: 'mdi-alert-circle', color: 'error', text: `${lotesVencidos} lote(s) vencido(s)`, sub: 'Bloqueados para venta', chip: 'Urgente', to: '/produccion/lotes' })
  if (lotesPorVencer > 0) al.push({ icon: 'mdi-clock-alert', color: 'warning', text: `${lotesPorVencer} lote(s) por vencer`, sub: 'Dentro de 30 días', chip: 'Revisar', to: '/produccion/lotes' })
  if (stockBajo > 0) al.push({ icon: 'mdi-package-variant-closed-remove', color: 'warning', text: `${stockBajo} presentación(es) bajo mínimo`, sub: 'Requieren reabastecimiento', chip: 'Revisar', to: '/produccion/inventario' })
  if (cxcVencidas.length > 0) al.push({ icon: 'mdi-cash-remove', color: 'error', text: `${cxcVencidas.length} CxC vencidas`, sub: fmt(cxcVencida) + ' pendiente de cobro', chip: 'Urgente', to: '/finanzas/cxc' })
  alertas.value = al

  // Entregas hoy
  const allOrders = await db.salesOrders.toArray()
  entregasHoy.value = allOrders.filter(o => o.deliveryType === 'domicilio' && isSameDay(new Date(o.date), now)).slice(0, 6)
}

onMounted(async () => {
  await loadData()
  await startTourIfNew('dashboard')
})
</script>

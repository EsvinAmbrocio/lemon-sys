<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <div><h2 class="text-h6 font-weight-bold text-primary">Flujo de Caja</h2><p class="text-body-2 text-medium-emphasis">Ingresos vs Egresos — Análisis financiero mensual</p></div>
      <v-select id="selector-mes" v-model="selectedMonth" :items="monthItems" label="Período" hide-details density="compact" style="max-width:260px" @update:model-value="load" />
    </div>

    <!-- KPIs -->
    <v-row class="mb-6" id="comparativo">
      <v-col cols="12" sm="4">
        <KpiCard title="Ingresos del Período" :value="'Q'+totals.ingresos.toLocaleString('es-GT',{minimumFractionDigits:2})" icon="mdi-trending-up" color="success" text-color="white" icon-color="white" />
      </v-col>
      <v-col cols="12" sm="4">
        <KpiCard title="Egresos del Período" :value="'Q'+totals.egresos.toLocaleString('es-GT',{minimumFractionDigits:2})" icon="mdi-trending-down" color="error" text-color="white" icon-color="white" />
      </v-col>
      <v-col cols="12" sm="4">
        <KpiCard :title="'Balance del Período'" :value="'Q'+totals.balance.toLocaleString('es-GT',{minimumFractionDigits:2})" icon="mdi-scale-balance" :color="totals.balance>=0?'primary':'error'" text-color="white" icon-color="white" />
      </v-col>
    </v-row>

    <!-- Comparativo vs mes anterior -->
    <v-row class="mb-6">
      <v-col cols="12" sm="4" v-for="comp in comparativo" :key="comp.label">
        <v-card rounded="xl" elevation="2" class="pa-4">
          <div class="text-caption text-medium-emphasis mb-1">{{ comp.label }}</div>
          <div class="text-h6 font-weight-bold" :class="comp.color">{{ comp.value }}</div>
          <div class="d-flex align-center mt-1">
            <v-icon :color="comp.trendColor" size="16">{{ comp.trendIcon }}</v-icon>
            <span class="text-caption ml-1" :class="comp.trendColor + '--text'">{{ comp.trend }}% vs mes anterior</span>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Gráfica principal -->
    <v-card rounded="xl" elevation="2" class="mb-4" id="grafica-flujo">
      <v-card-title class="pa-5 pb-2"><v-icon color="primary" class="mr-2">mdi-chart-line</v-icon>Flujo de Caja — Acumulado del Período</v-card-title>
      <v-card-text class="pa-4">
        <Bar v-if="chartData.labels.length" :data="chartData" :options="chartOpts" height="280" />
        <div v-else class="d-flex align-center justify-center" style="height:280px"><v-progress-circular indeterminate color="primary" /></div>
      </v-card-text>
    </v-card>

    <!-- Detalle de movimientos -->
    <v-row>
      <v-col cols="12" lg="6">
        <v-card rounded="xl" elevation="2">
          <v-card-title class="pa-5 pb-2 d-flex align-center">
            <v-icon color="success" class="mr-2">mdi-cash-plus</v-icon>
            Ingresos del Período
            <v-spacer />
            <v-chip color="success" size="small" variant="tonal">{{ ingresos.length }}</v-chip>
          </v-card-title>
          <v-list density="compact" class="pa-2" style="max-height:300px;overflow-y:auto">
            <v-list-item v-for="m in ingresos.slice(0,20)" :key="m.id" class="mb-1" rounded="lg">
              <v-list-item-title class="text-body-2">{{ m.description }}</v-list-item-title>
              <v-list-item-subtitle>{{ formatDate(m.date) }}</v-list-item-subtitle>
              <template #append><span class="font-weight-bold text-success">Q{{ Number(m.amount||0).toLocaleString('es-GT',{minimumFractionDigits:2}) }}</span></template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
      <v-col cols="12" lg="6">
        <v-card rounded="xl" elevation="2">
          <v-card-title class="pa-5 pb-2 d-flex align-center">
            <v-icon color="error" class="mr-2">mdi-cash-minus</v-icon>
            Egresos del Período
            <v-spacer />
            <v-chip color="error" size="small" variant="tonal">{{ egresos.length }}</v-chip>
          </v-card-title>
          <v-list density="compact" class="pa-2" style="max-height:300px;overflow-y:auto">
            <v-list-item v-for="m in egresos.slice(0,20)" :key="m.id" class="mb-1" rounded="lg">
              <v-list-item-title class="text-body-2">{{ m.description }}</v-list-item-title>
              <v-list-item-subtitle>{{ formatDate(m.date) }}</v-list-item-subtitle>
              <template #append><span class="font-weight-bold text-error">-Q{{ Number(m.amount||0).toLocaleString('es-GT',{minimumFractionDigits:2}) }}</span></template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { format, startOfMonth, endOfMonth, subMonths, eachWeekOfInterval, endOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import db from '@/db/db'
import KpiCard from '@/components/common/KpiCard.vue'
import { useTour } from '@/composables/useTour'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)
const { startTourIfNew } = useTour()

const now = new Date()
const selectedMonth = ref('current')

const monthItems = computed(() => {
  const items = [{ title: 'Mes Actual (' + format(now, 'MMMM yyyy', {locale:es}) + ')', value: 'current' }]
  for (let i = 1; i <= 3; i++) {
    const d = subMonths(now, i)
    items.push({ title: format(d, 'MMMM yyyy', {locale:es}), value: `m${i}` })
  }
  return items
})

const ingresos = ref([])
const egresos = ref([])
const totals = ref({ ingresos: 0, egresos: 0, balance: 0 })
const totalsAnterior = ref({ ingresos: 0, egresos: 0, balance: 0 })
const chartData = ref({ labels: [], datasets: [] })

const chartOpts = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { position: 'top' } },
  scales: { y: { beginAtZero: false, ticks: { callback: v => 'Q' + v.toLocaleString() } } }
}

function formatDate(d) { try { return format(new Date(d), 'dd/MM/yyyy') } catch { return '-' } }

function getPeriod() {
  if (selectedMonth.value === 'current') return { from: startOfMonth(now), to: now }
  const m = parseInt(selectedMonth.value.replace('m', ''))
  const d = subMonths(now, m)
  return { from: startOfMonth(d), to: endOfMonth(d) }
}

const comparativo = computed(() => {
  const calcTrend = (cur, prev) => prev > 0 ? Math.round(((cur - prev) / prev) * 100) : 0
  const ti = calcTrend(totals.value.ingresos, totalsAnterior.value.ingresos)
  const te = calcTrend(totals.value.egresos, totalsAnterior.value.egresos)
  const tb = calcTrend(totals.value.balance, totalsAnterior.value.balance)
  return [
    { label: 'Ingresos', value: 'Q' + totals.value.ingresos.toLocaleString('es-GT', {minimumFractionDigits:2}), color: 'text-success', trend: ti, trendColor: ti >= 0 ? 'success' : 'error', trendIcon: ti >= 0 ? 'mdi-trending-up' : 'mdi-trending-down' },
    { label: 'Egresos', value: 'Q' + totals.value.egresos.toLocaleString('es-GT', {minimumFractionDigits:2}), color: 'text-error', trend: te, trendColor: te <= 0 ? 'success' : 'error', trendIcon: te <= 0 ? 'mdi-trending-down' : 'mdi-trending-up' },
    { label: 'Balance', value: 'Q' + totals.value.balance.toLocaleString('es-GT', {minimumFractionDigits:2}), color: totals.value.balance >= 0 ? 'text-primary' : 'text-error', trend: tb, trendColor: tb >= 0 ? 'success' : 'error', trendIcon: tb >= 0 ? 'mdi-trending-up' : 'mdi-trending-down' },
  ]
})

async function load() {
  const { from, to } = getPeriod()
  const prevFrom = startOfMonth(subMonths(from, 1))
  const prevTo = endOfMonth(subMonths(from, 1))

  const all = await db.cashMovements.toArray()
  const period = all.filter(m => new Date(m.date) >= from && new Date(m.date) <= to)
  const prevPeriod = all.filter(m => new Date(m.date) >= prevFrom && new Date(m.date) <= prevTo)

  ingresos.value = period.filter(m => m.type === 'ingreso').sort((a, b) => new Date(b.date) - new Date(a.date))
  egresos.value = period.filter(m => m.type === 'egreso').sort((a, b) => new Date(b.date) - new Date(a.date))

  const ti = ingresos.value.reduce((s, m) => s + (m.amount || 0), 0)
  const te = egresos.value.reduce((s, m) => s + (m.amount || 0), 0)
  totals.value = { ingresos: ti, egresos: te, balance: parseFloat((ti - te).toFixed(2)) }

  const pi = prevPeriod.filter(m => m.type === 'ingreso').reduce((s, m) => s + (m.amount || 0), 0)
  const pe = prevPeriod.filter(m => m.type === 'egreso').reduce((s, m) => s + (m.amount || 0), 0)
  totalsAnterior.value = { ingresos: pi, egresos: pe, balance: pi - pe }

  // Gráfica semanal
  const weeks = eachWeekOfInterval({ start: from, end: to }, { weekStartsOn: 1 })
  const labels = weeks.map(w => format(w, "'Sem' d/M"))
  const ingData = weeks.map(w => {
    const we = endOfWeek(w, { weekStartsOn: 1 })
    return ingresos.value.filter(m => new Date(m.date) >= w && new Date(m.date) <= we).reduce((s, m) => s + (m.amount || 0), 0)
  })
  const egData = weeks.map(w => {
    const we = endOfWeek(w, { weekStartsOn: 1 })
    return egresos.value.filter(m => new Date(m.date) >= w && new Date(m.date) <= we).reduce((s, m) => s + (m.amount || 0), 0)
  })
  chartData.value = {
    labels,
    datasets: [
      { label: 'Ingresos', data: ingData, backgroundColor: '#4CAF50', borderRadius: 4 },
      { label: 'Egresos', data: egData, backgroundColor: '#F44336', borderRadius: 4 },
    ]
  }
}

onMounted(async () => { await load(); await startTourIfNew('flujoCaja') })
</script>

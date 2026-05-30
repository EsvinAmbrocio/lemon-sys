<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h2 class="text-h6 font-weight-bold text-primary">Estado de Resultados</h2>
        <p class="text-body-2 text-medium-emphasis">Ingresos, costos y utilidad del período</p>
      </div>
      <div class="d-flex align-center gap-3">
        <v-select
          v-model="selectedPeriod"
          :items="periodItems"
          density="compact"
          hide-details
          style="min-width:200px"
          @update:model-value="load"
        />
        <v-btn variant="tonal" color="primary" prepend-icon="mdi-printer" @click="print">Imprimir</v-btn>
      </div>
    </div>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

    <div id="estado-resultados-print">
      <!-- Encabezado imprimible -->
      <div class="text-center mb-6 d-none d-print-block">
        <div class="text-h5 font-weight-bold">Bebidas y Abarrotes S.A.</div>
        <div class="text-h6">Estado de Resultados</div>
        <div class="text-body-2">Período: {{ periodoLabel }}</div>
      </div>

      <!-- ── Tarjetas resumen ── -->
      <v-row class="mb-6">
        <v-col cols="6" sm="3">
          <v-card rounded="xl" elevation="2" color="primary" class="pa-4 text-white text-center">
            <div class="text-caption mb-1">Ingresos Netos</div>
            <div class="text-h6 font-weight-bold">Q{{ fmtNum(data.ingresos) }}</div>
          </v-card>
        </v-col>
        <v-col cols="6" sm="3">
          <v-card rounded="xl" elevation="2" color="warning" class="pa-4 text-white text-center">
            <div class="text-caption mb-1">Costos Totales</div>
            <div class="text-h6 font-weight-bold">Q{{ fmtNum(data.costoTotal) }}</div>
          </v-card>
        </v-col>
        <v-col cols="6" sm="3">
          <v-card rounded="xl" elevation="2" :color="data.utilidadNeta >= 0 ? 'success' : 'error'" class="pa-4 text-white text-center">
            <div class="text-caption mb-1">Utilidad Neta</div>
            <div class="text-h6 font-weight-bold">Q{{ fmtNum(data.utilidadNeta) }}</div>
          </v-card>
        </v-col>
        <v-col cols="6" sm="3">
          <v-card rounded="xl" elevation="2" :color="data.margen >= 0 ? 'secondary' : 'error'" class="pa-4 text-white text-center">
            <div class="text-caption mb-1">Margen Neto</div>
            <div class="text-h6 font-weight-bold">{{ data.margen.toFixed(1) }}%</div>
          </v-card>
        </v-col>
      </v-row>

      <!-- ── Estado de Resultados detallado ── -->
      <v-card rounded="xl" elevation="2">
        <v-card-title class="pa-5 pb-2 text-primary text-body-1 font-weight-bold">
          <v-icon class="mr-2" size="20">mdi-file-chart</v-icon>
          Bebidas y Abarrotes S.A. — {{ periodoLabel }}
        </v-card-title>
        <v-card-text class="pa-0">
          <v-table>
            <tbody>
              <!-- INGRESOS -->
              <tr class="section-header">
                <td colspan="2" class="text-primary font-weight-bold px-6 py-3" style="background:rgba(46,125,50,0.08)">
                  INGRESOS
                </td>
              </tr>
              <tr class="data-row">
                <td class="px-6 py-2">Ventas brutas</td>
                <td class="text-right px-6 font-weight-medium">Q{{ fmtNum(data.ventasBrutas) }}</td>
              </tr>
              <tr class="data-row">
                <td class="px-6 py-2 text-medium-emphasis">(-) Descuentos y devoluciones</td>
                <td class="text-right px-6 text-error">-Q{{ fmtNum(data.descuentos) }}</td>
              </tr>
              <tr class="subtotal-row">
                <td class="px-6 py-2 font-weight-bold">Ingresos Netos</td>
                <td class="text-right px-6 font-weight-bold">Q{{ fmtNum(data.ingresos) }}</td>
              </tr>

              <!-- COSTO DE PRODUCCIÓN -->
              <tr class="section-header">
                <td colspan="2" class="text-primary font-weight-bold px-6 py-3" style="background:rgba(46,125,50,0.08)">
                  COSTO DE VENTAS / PRODUCCIÓN
                </td>
              </tr>
              <tr class="data-row">
                <td class="px-6 py-2">Costo de producción (órdenes ejecutadas)</td>
                <td class="text-right px-6">Q{{ fmtNum(data.costoProduccion) }}</td>
              </tr>
              <tr class="subtotal-row">
                <td class="px-6 py-2 font-weight-bold">Utilidad Bruta</td>
                <td class="text-right px-6 font-weight-bold" :class="data.utilidadBruta >= 0 ? 'text-success' : 'text-error'">
                  Q{{ fmtNum(data.utilidadBruta) }}
                </td>
              </tr>
              <tr class="data-row">
                <td class="px-6 py-1 text-caption text-medium-emphasis">
                  Margen bruto: {{ data.margenBruto.toFixed(1) }}%
                </td>
                <td></td>
              </tr>

              <!-- GASTOS OPERATIVOS -->
              <tr class="section-header">
                <td colspan="2" class="text-primary font-weight-bold px-6 py-3" style="background:rgba(46,125,50,0.08)">
                  GASTOS OPERATIVOS
                </td>
              </tr>
              <tr v-for="gasto in data.gastosPorCategoria" :key="gasto.cat" class="data-row">
                <td class="px-6 py-2 text-medium-emphasis">{{ gasto.cat }}</td>
                <td class="text-right px-6">Q{{ fmtNum(gasto.total) }}</td>
              </tr>
              <tr class="data-row">
                <td class="px-6 py-2 text-medium-emphasis">Servicios (luz, agua, mantenimiento…)</td>
                <td class="text-right px-6">Q{{ fmtNum(data.gastosServicios) }}</td>
              </tr>
              <tr class="subtotal-row">
                <td class="px-6 py-2 font-weight-bold">Total Gastos Operativos</td>
                <td class="text-right px-6 font-weight-bold text-error">-Q{{ fmtNum(data.gastosOperativos) }}</td>
              </tr>

              <!-- UTILIDAD OPERATIVA -->
              <tr class="subtotal-row" style="background:rgba(46,125,50,0.05)">
                <td class="px-6 py-2 font-weight-bold text-body-1">Utilidad Operativa (EBIT)</td>
                <td class="text-right px-6 font-weight-bold text-body-1" :class="data.utilidadOperativa >= 0 ? 'text-success' : 'text-error'">
                  Q{{ fmtNum(data.utilidadOperativa) }}
                </td>
              </tr>

              <!-- IMPUESTOS (ISR estimado 25%) -->
              <tr class="section-header">
                <td colspan="2" class="text-primary font-weight-bold px-6 py-3" style="background:rgba(46,125,50,0.08)">
                  IMPUESTOS
                </td>
              </tr>
              <tr class="data-row">
                <td class="px-6 py-2 text-medium-emphasis">ISR estimado (25% sobre utilidad positiva)</td>
                <td class="text-right px-6">Q{{ fmtNum(data.isr) }}</td>
              </tr>

              <!-- UTILIDAD NETA -->
              <tr style="background:rgba(46,125,50,0.12)">
                <td class="px-6 py-4 font-weight-bold text-h6 text-primary">UTILIDAD NETA</td>
                <td class="text-right px-6 font-weight-bold text-h6" :class="data.utilidadNeta >= 0 ? 'text-success' : 'text-error'">
                  Q{{ fmtNum(data.utilidadNeta) }}
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
      </v-card>

      <!-- ── Comparativo mensual (mini chart) ── -->
      <v-row class="mt-6">
        <v-col cols="12" md="6">
          <v-card rounded="xl" elevation="2" class="pa-4">
            <div class="text-body-2 font-weight-bold text-primary mb-3">Tendencia — Últimos 4 meses</div>
            <v-table density="compact">
              <thead>
                <tr>
                  <th>Mes</th>
                  <th class="text-right">Ingresos</th>
                  <th class="text-right">Costos</th>
                  <th class="text-right">Utilidad</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="m in tendencia" :key="m.label">
                  <td>{{ m.label }}</td>
                  <td class="text-right">Q{{ fmtNum(m.ingresos) }}</td>
                  <td class="text-right">Q{{ fmtNum(m.costos) }}</td>
                  <td class="text-right font-weight-bold" :class="m.utilidad >= 0 ? 'text-success' : 'text-error'">
                    Q{{ fmtNum(m.utilidad) }}
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card>
        </v-col>
        <v-col cols="12" md="6">
          <v-card rounded="xl" elevation="2" class="pa-4">
            <div class="text-body-2 font-weight-bold text-primary mb-3">Distribución de Costos — {{ periodoLabel }}</div>
            <v-table density="compact">
              <tbody>
                <tr>
                  <td>Producción</td>
                  <td class="text-right">Q{{ fmtNum(data.costoProduccion) }}</td>
                  <td class="text-right text-medium-emphasis">{{ pct(data.costoProduccion, data.costoTotal) }}%</td>
                </tr>
                <tr v-for="g in data.gastosPorCategoria" :key="g.cat">
                  <td>{{ g.cat }}</td>
                  <td class="text-right">Q{{ fmtNum(g.total) }}</td>
                  <td class="text-right text-medium-emphasis">{{ pct(g.total, data.costoTotal) }}%</td>
                </tr>
                <tr>
                  <td>Servicios</td>
                  <td class="text-right">Q{{ fmtNum(data.gastosServicios) }}</td>
                  <td class="text-right text-medium-emphasis">{{ pct(data.gastosServicios, data.costoTotal) }}%</td>
                </tr>
              </tbody>
            </v-table>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import db from '@/db/db'

const loading = ref(false)
const now = new Date()

// ── Períodos ──────────────────────────────────────────────────
const periodItems = computed(() => {
  const items = []
  for (let i = 0; i < 5; i++) {
    const d = subMonths(now, i)
    items.push({
      title: i === 0 ? `Mes actual (${format(d, 'MMMM yyyy')})` : format(d, 'MMMM yyyy'),
      value: i,
    })
  }
  return items
})
const selectedPeriod = ref(0)
const periodoLabel = computed(() => {
  const d = subMonths(now, selectedPeriod.value)
  return format(d, 'MMMM yyyy').replace(/^\w/, c => c.toUpperCase())
})

// ── Datos ─────────────────────────────────────────────────────
const data = ref({
  ventasBrutas: 0, descuentos: 0, ingresos: 0,
  costoProduccion: 0,
  utilidadBruta: 0, margenBruto: 0,
  gastosPorCategoria: [], gastosServicios: 0, gastosOperativos: 0,
  utilidadOperativa: 0,
  isr: 0, utilidadNeta: 0, margen: 0, costoTotal: 0,
})
const tendencia = ref([])

function fmtNum(v) { return Number(v||0).toLocaleString('es-GT', { minimumFractionDigits:2, maximumFractionDigits:2 }) }
function pct(v, total) { return total > 0 ? ((v / total) * 100).toFixed(1) : '0.0' }

async function calcPeriod(monthsBack) {
  const ref_d  = subMonths(now, monthsBack)
  const ms = startOfMonth(ref_d)
  const me = endOfMonth(ref_d)
  const inRange = d => new Date(d) >= ms && new Date(d) <= me

  // Ingresos
  const invoices = await db.invoices.toArray()
  const periInv  = invoices.filter(i => inRange(i.date))
  const ventasBrutas  = periInv.reduce((s, i) => s + (i.subtotal || 0), 0)
  const descuentos    = periInv.reduce((s, i) => s + (i.discount || 0), 0)
  const ingresos      = ventasBrutas - descuentos

  // Costo de producción
  const prodOrders = await db.productionOrders.toArray()
  const costoProduccion = prodOrders
    .filter(o => o.status === 'completada' && inRange(o.date))
    .reduce((s, o) => s + (o.totalCost || 0), 0)

  // Gastos operativos por categoría
  const expenses = await db.expenses.toArray()
  const periExp  = expenses.filter(e => inRange(e.date))
  const byCat = {}
  for (const e of periExp) {
    byCat[e.category] = (byCat[e.category] || 0) + (e.amount || 0)
  }
  const gastosPorCategoria = Object.entries(byCat).map(([cat, total]) => ({ cat, total }))
  const totalExpenses = gastosPorCategoria.reduce((s, g) => s + g.total, 0)

  // Servicios
  const svcInv = await db.serviceInvoices.toArray()
  const gastosServicios = svcInv
    .filter(i => inRange(i.date) && i.status !== 'cancelada')
    .reduce((s, i) => s + (i.amount || 0), 0) // sin IVA para el P&L

  const gastosOperativos = totalExpenses + gastosServicios

  // Cálculos
  const utilidadBruta    = ingresos - costoProduccion
  const margenBruto      = ingresos > 0 ? (utilidadBruta / ingresos) * 100 : 0
  const utilidadOperativa = utilidadBruta - gastosOperativos
  const isr              = utilidadOperativa > 0 ? utilidadOperativa * 0.25 : 0
  const utilidadNeta     = utilidadOperativa - isr
  const margen           = ingresos > 0 ? (utilidadNeta / ingresos) * 100 : 0
  const costoTotal       = costoProduccion + gastosOperativos

  return { ventasBrutas, descuentos, ingresos, costoProduccion, utilidadBruta, margenBruto,
           gastosPorCategoria, gastosServicios, gastosOperativos, utilidadOperativa,
           isr, utilidadNeta, margen, costoTotal }
}

async function load() {
  loading.value = true
  data.value = await calcPeriod(selectedPeriod.value)

  // Tendencia últimos 4 meses
  const t = []
  for (let i = 3; i >= 0; i--) {
    const d = subMonths(now, i)
    const r = await calcPeriod(i)
    t.push({ label: format(d, 'MMM yyyy'), ingresos: r.ingresos, costos: r.costoTotal, utilidad: r.utilidadNeta })
  }
  tendencia.value = t
  loading.value = false
}

function print() { window.print() }

onMounted(load)
</script>

<style>
@media print {
  .v-navigation-drawer, .v-app-bar, .v-btn { display: none !important; }
  #estado-resultados-print { padding: 20px; }
  .section-header td { background: #e8f5e9 !important; -webkit-print-color-adjust: exact; }
}
</style>

<template>
  <div>
    <div class="mb-6">
      <h2 class="text-h6 font-weight-bold text-primary">Reportes de Ventas</h2>
      <p class="text-body-2 text-medium-emphasis">Análisis de rendimiento comercial</p>
    </div>

    <v-row class="mb-4">
      <v-col cols="12" md="4">
        <v-select v-model="period" :items="periodItems" label="Período" hide-details density="compact" @update:model-value="load" />
      </v-col>
    </v-row>

    <!-- KPIs -->
    <v-row class="mb-6">
      <v-col cols="12" sm="3" v-for="k in kpis" :key="k.title">
        <KpiCard :title="k.title" :value="k.value" :icon="k.icon" :icon-color="k.color" />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" lg="8">
        <v-card rounded="xl" elevation="2" class="mb-4">
          <v-card-title class="pa-5 pb-2"><v-icon color="primary" class="mr-2">mdi-chart-bar</v-icon>Ventas por Día</v-card-title>
          <v-card-text><Bar v-if="ventasData.labels.length" :data="ventasData" :options="barOpts" height="250" /></v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" lg="4">
        <v-card rounded="xl" elevation="2" class="mb-4">
          <v-card-title class="pa-5 pb-2"><v-icon color="primary" class="mr-2">mdi-chart-pie</v-icon>Por Categoría</v-card-title>
          <v-card-text><Doughnut v-if="catData.labels.length" :data="catData" :options="doughOpts" height="250" /></v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Top productos y clientes -->
    <v-row>
      <v-col cols="12" lg="6">
        <v-card rounded="xl" elevation="2">
          <v-card-title class="pa-5 pb-2"><v-icon color="primary" class="mr-2">mdi-podium</v-icon>Top 10 Productos</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item v-for="(p,i) in topProducts" :key="p.name" class="mb-1">
              <template #prepend>
                <v-avatar :color="i<3?'primary':'grey-lighten-2'" size="28"><span :class="i<3?'text-white':'text-grey'" style="font-size:12px;font-weight:700">{{i+1}}</span></v-avatar>
              </template>
              <v-list-item-title>{{ p.name }}</v-list-item-title>
              <v-list-item-subtitle>{{ p.qty }} cajas</v-list-item-subtitle>
              <template #append><span class="font-weight-bold text-primary">Q{{ p.total.toLocaleString('es-GT',{minimumFractionDigits:2}) }}</span></template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
      <v-col cols="12" lg="6">
        <v-card rounded="xl" elevation="2">
          <v-card-title class="pa-5 pb-2"><v-icon color="primary" class="mr-2">mdi-account-star</v-icon>Top 10 Clientes</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item v-for="(c,i) in topCustomers" :key="c.name" class="mb-1">
              <template #prepend>
                <v-avatar :color="i<3?'secondary':'grey-lighten-2'" size="28"><span :class="i<3?'text-white':'text-grey'" style="font-size:12px;font-weight:700">{{i+1}}</span></v-avatar>
              </template>
              <v-list-item-title>{{ c.name }}</v-list-item-title>
              <v-list-item-subtitle>{{ c.orders }} pedidos</v-list-item-subtitle>
              <template #append><span class="font-weight-bold text-primary">Q{{ c.total.toLocaleString('es-GT',{minimumFractionDigits:2}) }}</span></template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Bar, Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js'
import { format, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import db from '@/db/db'
import KpiCard from '@/components/common/KpiCard.vue'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

const period = ref('30d')
const periodItems = [
  {title:'Últimos 30 días',value:'30d'},{title:'Mes actual',value:'current'},
  {title:'Mes anterior',value:'prev'},{title:'Últimos 3 meses',value:'3m'},
]
const kpis = ref([])
const ventasData = ref({labels:[],datasets:[]})
const catData = ref({labels:[],datasets:[]})
const topProducts = ref([])
const topCustomers = ref([])
const barOpts = {responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{callback:v=>'Q'+v.toLocaleString()}}}}
const doughOpts = {responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{boxWidth:12}}}}
const COLORS = ['#2E7D32','#4CAF50','#8BC34A','#CDDC39','#F9A825','#FF7043','#7E57C2']

async function load() {
  const now = new Date()
  let from, to = now
  if (period.value === '30d') { from = subMonths(now, 1) }
  else if (period.value === 'current') { from = startOfMonth(now); to = now }
  else if (period.value === 'prev') { const pm = subMonths(now, 1); from = startOfMonth(pm); to = endOfMonth(pm) }
  else { from = subMonths(now, 3) }

  const invoices = await db.invoices.toArray()
  const filtered = invoices.filter(i => new Date(i.date) >= from && new Date(i.date) <= to)
  const customers = await db.customers.toArray()
  const products = await db.products.toArray()
  const categories = await db.categories.toArray()
  const salesItems = await db.salesOrderItems.toArray()

  const total = filtered.reduce((s,i)=>s+(i.total||0),0)
  const count = filtered.length
  const avgTicket = count > 0 ? total/count : 0
  const paidCount = filtered.filter(i=>i.status==='pagada').length

  kpis.value = [
    { title:'Total Ventas', value:'Q'+total.toLocaleString('es-GT',{minimumFractionDigits:2}), icon:'mdi-currency-usd', color:'primary' },
    { title:'N° Pedidos', value:count, icon:'mdi-clipboard-list', color:'secondary' },
    { title:'Ticket Promedio', value:'Q'+avgTicket.toLocaleString('es-GT',{minimumFractionDigits:2}), icon:'mdi-receipt', color:'info' },
    { title:'Facturas Cobradas', value:`${paidCount} / ${count}`, icon:'mdi-check-circle', color:'success' },
  ]

  // Ventas por día
  const days = eachDayOfInterval({start:from,end:to})
  const daysToShow = days.length > 60 ? days.filter((_,i)=>i%2===0) : days
  ventasData.value = {
    labels: daysToShow.map(d=>format(d,'d/M')),
    datasets: [{label:'Ventas',data:daysToShow.map(d=>filtered.filter(i=>format(new Date(i.date),'yyyy-MM-dd')===format(d,'yyyy-MM-dd')).reduce((s,i)=>s+(i.total||0),0)),backgroundColor:'#4CAF50',borderRadius:4}]
  }

  // Por categoría
  const catTotals = categories.map(c=>{
    const catProds = products.filter(p=>p.categoryId===c.id).map(p=>p.id)
    const invIds = new Set(filtered.map(i=>i.salesOrderId))
    const total = salesItems.filter(si=>invIds.has(si.salesOrderId)&&catProds.includes(si.productId)).reduce((s,si)=>s+(si.subtotal||0),0)
    return {name:c.name,total}
  }).filter(c=>c.total>0)
  catData.value = { labels:catTotals.map(c=>c.name), datasets:[{data:catTotals.map(c=>c.total),backgroundColor:COLORS.slice(0,catTotals.length)}] }

  // Top productos
  const invIds = new Set(filtered.map(i=>i.salesOrderId))
  const prodMap = {}
  for (const si of salesItems) {
    if (!invIds.has(si.salesOrderId)) continue
    if (!prodMap[si.productId]) prodMap[si.productId] = { qty:0, total:0 }
    prodMap[si.productId].qty += si.quantity||0
    prodMap[si.productId].total += si.subtotal||0
  }
  topProducts.value = Object.entries(prodMap).map(([id,v])=>({name:products.find(p=>p.id===parseInt(id))?.name||'-',...v})).sort((a,b)=>b.total-a.total).slice(0,10)

  // Top clientes
  const custMap = {}
  for (const inv of filtered) {
    if (!custMap[inv.customerId]) custMap[inv.customerId] = { orders:0, total:0 }
    custMap[inv.customerId].orders++
    custMap[inv.customerId].total += inv.total||0
  }
  topCustomers.value = Object.entries(custMap).map(([id,v])=>({name:customers.find(c=>c.id===parseInt(id))?.name||'-',...v})).sort((a,b)=>b.total-a.total).slice(0,10)
}

onMounted(load)
</script>

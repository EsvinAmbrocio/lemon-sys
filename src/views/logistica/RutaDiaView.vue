<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h2 class="text-h6 font-weight-bold text-primary">Ruta del Día</h2>
        <p class="text-body-2 text-medium-emphasis">{{ todayStr }} — Entregas programadas por zona</p>
      </div>
      <div class="d-flex gap-2">
        <v-chip color="success" variant="tonal">Entregados: {{ countByStatus('entregado') }}</v-chip>
        <v-chip color="warning" variant="tonal">En Ruta: {{ countByStatus('en_ruta') }}</v-chip>
        <v-chip color="info" variant="tonal">Preparando: {{ countByStatus('preparando') }}</v-chip>
        <v-chip color="grey" variant="tonal">Nuevos: {{ countByStatus('nuevo') }}</v-chip>
      </div>
    </div>

    <!-- Filtro zona -->
    <v-card rounded="xl" elevation="1" class="mb-4">
      <v-card-text class="pa-4">
        <v-row align="center">
          <v-col cols="12" md="4">
            <v-select id="filtro-zona" v-model="filterZone" :items="zoneItems" label="Filtrar por Zona" clearable hide-details density="compact" prepend-inner-icon="mdi-map-marker" />
          </v-col>
          <v-col cols="12" md="4">
            <v-select v-model="filterStatus" :items="statusItems" label="Estado" clearable hide-details density="compact" />
          </v-col>
          <v-col cols="auto">
            <v-btn color="primary" variant="tonal" prepend-icon="mdi-refresh" @click="load" :loading="loading" size="small">Actualizar</v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Lista por zona -->
    <template v-if="!loading">
      <div v-for="zone in visibleZones" :key="zone.id" class="mb-4">
        <div class="d-flex align-center mb-2">
          <v-icon color="primary" class="mr-2">mdi-map-marker</v-icon>
          <span class="text-h6 font-weight-bold text-primary">{{ zone.name }}</span>
          <v-chip class="ml-2" size="small" color="primary" variant="tonal">{{ zoneOrders(zone.id).length }} entrega(s)</v-chip>
        </div>
        <v-card rounded="xl" elevation="2" id="lista-ruta">
          <v-list density="comfortable">
            <v-list-item
              v-for="order in zoneOrders(zone.id)"
              :key="order.id"
              :class="'order-item order-' + order.status"
              rounded="lg"
              class="ma-2 mb-1"
            >
              <template #prepend>
                <v-avatar :color="statusColor(order.status)" size="40">
                  <v-icon :color="'white'" size="20">{{ statusIcon(order.status) }}</v-icon>
                </v-avatar>
              </template>
              <v-list-item-title class="font-weight-bold">
                {{ customerName(order.customerId) }}
                <v-chip v-if="order.deliveryType==='bodega'" size="x-small" color="secondary" variant="tonal" class="ml-2">Retiro Bodega</v-chip>
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ customerAddress(order.customerId) }}
                <span v-if="order.notes" class="ml-2 text-warning">📝 {{ order.notes }}</span>
              </v-list-item-subtitle>
              <template #append>
                <div class="d-flex flex-column align-end gap-1">
                  <v-chip :color="statusColor(order.status)" size="small" variant="tonal">{{ statusLabel(order.status) }}</v-chip>
                  <span class="text-caption font-weight-medium text-primary">Q{{ Number(order.total||0).toLocaleString('es-GT',{minimumFractionDigits:2}) }}</span>
                  <div class="d-flex gap-1 mt-1" id="btn-avanzar">
                    <v-btn v-if="nextStatus(order.status)" :color="statusColor(nextStatus(order.status))" size="x-small" variant="tonal" @click="advance(order)" :loading="advancing===order.id">
                      {{ nextStatusLabel(order.status) }} →
                    </v-btn>
                  </div>
                </div>
              </template>
            </v-list-item>
            <v-list-item v-if="zoneOrders(zone.id).length===0">
              <v-list-item-title class="text-medium-emphasis">Sin entregas en esta zona hoy</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </div>
      <v-card v-if="visibleZones.length===0" rounded="xl" elevation="1" class="pa-8 text-center">
        <v-icon size="48" color="grey-lighten-1">mdi-truck-outline</v-icon>
        <div class="text-h6 text-medium-emphasis mt-2">Sin entregas programadas para hoy</div>
      </v-card>
    </template>
    <v-skeleton-loader v-else type="list-item-three-line@4" />

    <v-snackbar v-model="snack.show" :color="snack.color" timeout="3000" location="bottom right">{{ snack.text }}</v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { format, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import db from '@/db/db'
import { useTour } from '@/composables/useTour'

const { startTourIfNew } = useTour()
const loading = ref(true); const advancing = ref(null)
const filterZone = ref(null); const filterStatus = ref(null)
const orders = ref([]); const zones = ref([]); const customers = ref([])
const snack = ref({ show:false,text:'',color:'success' })
const todayStr = format(new Date(), "EEEE d 'de' MMMM", { locale:es })
const today = new Date()

const zoneItems = computed(() => zones.value.map(z=>({title:z.name,value:z.id})))
const statusItems = [
  {title:'Nuevo',value:'nuevo'},{title:'Preparando',value:'preparando'},
  {title:'En Ruta',value:'en_ruta'},{title:'Entregado',value:'entregado'},
]

function statusColor(s) { return {nuevo:'grey',preparando:'info',en_ruta:'warning',entregado:'success'}[s]||'grey' }
function statusIcon(s)  { return {nuevo:'mdi-new-box',preparando:'mdi-progress-wrench',en_ruta:'mdi-truck',entregado:'mdi-check-circle'}[s]||'mdi-circle' }
function statusLabel(s) { return {nuevo:'Nuevo',preparando:'Preparando',en_ruta:'En Ruta',entregado:'Entregado'}[s]||s }
function nextStatus(s)  { return {nuevo:'preparando',preparando:'en_ruta',en_ruta:'entregado'}[s]||null }
function nextStatusLabel(s) { return statusLabel(nextStatus(s)) }
function customerName(id) { return customers.value.find(c=>c.id===id)?.name||`Cliente #${id}` }
function customerAddress(id) { return customers.value.find(c=>c.id===id)?.address||'' }
function countByStatus(s) { return orders.value.filter(o=>o.status===s).length }

const todayOrders = computed(() => orders.value.filter(o => isSameDay(new Date(o.date), today)))

const filteredOrders = computed(() => {
  let list = todayOrders.value
  if (filterZone.value) list = list.filter(o=>o.zoneId===filterZone.value)
  if (filterStatus.value) list = list.filter(o=>o.status===filterStatus.value)
  return list
})

const visibleZones = computed(() => {
  if (filterZone.value) return zones.value.filter(z=>z.id===filterZone.value)
  const zoneIds = [...new Set(filteredOrders.value.map(o=>o.zoneId))]
  return zones.value.filter(z=>zoneIds.includes(z.id))
})

function zoneOrders(zoneId) { return filteredOrders.value.filter(o=>o.zoneId===zoneId) }

async function load() {
  loading.value=true
  orders.value=await db.salesOrders.toArray()
  zones.value=await db.zones.toArray()
  customers.value=await db.customers.toArray()
  loading.value=false
}

async function advance(order) {
  const ns = nextStatus(order.status)
  if (!ns) return
  advancing.value=order.id
  await db.salesOrders.update(order.id,{status:ns})
  const idx = orders.value.findIndex(o=>o.id===order.id)
  if (idx>=0) orders.value[idx].status=ns
  advancing.value=null
  snack.value={show:true,text:`Pedido actualizado: ${statusLabel(ns)}`,color:statusColor(ns)}
}

onMounted(async () => { await load(); await startTourIfNew('rutaDia') })
</script>

<style scoped>
.order-item { border-left: 4px solid transparent; transition: border-color 0.2s; }
.order-nuevo { border-left-color: #9E9E9E; }
.order-preparando { border-left-color: #2196F3; }
.order-en_ruta { border-left-color: #FF9800; }
.order-entregado { border-left-color: #4CAF50; }
</style>

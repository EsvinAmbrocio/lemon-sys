<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h2 class="text-h6 font-weight-bold text-primary">Gestión de Entregas</h2>
        <p class="text-body-2 text-medium-emphasis">Historial completo de pedidos y estado de entregas</p>
      </div>
    </div>
    <v-card rounded="xl" elevation="1" class="mb-4">
      <v-card-text class="pa-4">
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field v-model="search" label="Buscar cliente..." prepend-inner-icon="mdi-magnify" clearable hide-details density="compact" />
          </v-col>
          <v-col cols="12" md="4">
            <v-select v-model="filterStatus" :items="statusItems" label="Estado" clearable hide-details density="compact" />
          </v-col>
          <v-col cols="12" md="4">
            <v-select v-model="filterZone" :items="zoneItems" label="Zona" clearable hide-details density="compact" />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
    <v-card rounded="xl" elevation="2">
      <v-data-table :headers="headers" :items="filteredOrders" :loading="loading" items-per-page="15" hover>
        <template #item.customerId="{ item }">{{ customerName(item.customerId) }}</template>
        <template #item.zoneId="{ item }">{{ zoneName(item.zoneId) }}</template>
        <template #item.status="{ item }">
          <v-chip :color="statusColor(item.status)" size="small" variant="tonal">{{ statusLabel(item.status) }}</v-chip>
        </template>
        <template #item.deliveryType="{ item }">
          <v-chip size="x-small" :color="item.deliveryType==='domicilio'?'primary':'secondary'" variant="tonal">{{ item.deliveryType==='domicilio'?'Domicilio':'Bodega' }}</v-chip>
        </template>
        <template #item.total="{ item }">
          <span class="font-weight-medium">Q{{ Number(item.total||0).toLocaleString('es-GT',{minimumFractionDigits:2}) }}</span>
        </template>
        <template #item.date="{ item }">{{ formatDate(item.date) }}</template>
        <template #item.actions="{ item }">
          <v-btn v-if="nextStatus(item.status)" icon="mdi-arrow-right-circle" size="small" variant="text" color="primary" @click="advance(item)" :title="'→ ' + statusLabel(nextStatus(item.status))" />
        </template>
      </v-data-table>
    </v-card>
    <v-snackbar v-model="snack.show" :color="snack.color" timeout="2000" location="bottom right">{{ snack.text }}</v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { format } from 'date-fns'
import db from '@/db/db'

const loading = ref(true); const search = ref(''); const filterStatus = ref(null); const filterZone = ref(null)
const orders = ref([]); const customers = ref([]); const zones = ref([])
const snack = ref({ show:false,text:'',color:'success' })
const headers = [
  { title:'#', key:'id', width:60 }, { title:'Cliente', key:'customerId' },
  { title:'Zona', key:'zoneId', width:130 }, { title:'Estado', key:'status', width:140 },
  { title:'Entrega', key:'deliveryType', width:110 }, { title:'Total', key:'total', width:130 },
  { title:'Fecha', key:'date', width:130 }, { title:'', key:'actions', sortable:false, width:60 },
]
const statusItems = [{title:'Nuevo',value:'nuevo'},{title:'Preparando',value:'preparando'},{title:'En Ruta',value:'en_ruta'},{title:'Entregado',value:'entregado'}]
const zoneItems = computed(() => zones.value.map(z=>({title:z.name,value:z.id})))
function statusColor(s) { return {nuevo:'grey',preparando:'info',en_ruta:'warning',entregado:'success'}[s]||'grey' }
function statusLabel(s) { return {nuevo:'Nuevo',preparando:'Preparando',en_ruta:'En Ruta',entregado:'Entregado'}[s]||s }
function nextStatus(s)  { return {nuevo:'preparando',preparando:'en_ruta',en_ruta:'entregado'}[s]||null }
function customerName(id) { return customers.value.find(c=>c.id===id)?.name||`Cliente #${id}` }
function zoneName(id) { return zones.value.find(z=>z.id===id)?.name||'-' }
function formatDate(d) { try { return format(new Date(d),'dd/MM/yyyy') } catch { return '-' } }
const filteredOrders = computed(() => {
  let list = orders.value
  if (filterStatus.value) list=list.filter(o=>o.status===filterStatus.value)
  if (filterZone.value) list=list.filter(o=>o.zoneId===filterZone.value)
  if (search.value) { const s=search.value.toLowerCase(); list=list.filter(o=>customerName(o.customerId).toLowerCase().includes(s)) }
  return list.sort((a,b)=>new Date(b.date)-new Date(a.date))
})
async function load() {
  loading.value=true
  orders.value=await db.salesOrders.toArray()
  customers.value=await db.customers.toArray()
  zones.value=await db.zones.toArray()
  loading.value=false
}
async function advance(order) {
  const ns = nextStatus(order.status); if (!ns) return
  await db.salesOrders.update(order.id,{status:ns})
  const idx=orders.value.findIndex(o=>o.id===order.id)
  if(idx>=0) orders.value[idx].status=ns
  snack.value={show:true,text:`→ ${statusLabel(ns)}`,color:statusColor(ns)}
}
onMounted(load)
</script>

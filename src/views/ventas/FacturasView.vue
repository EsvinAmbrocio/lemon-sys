<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <div><h2 class="text-h6 font-weight-bold text-primary">Facturas</h2><p class="text-body-2 text-medium-emphasis">Historial de facturas emitidas</p></div>
    </div>
    <v-card rounded="xl" elevation="1" class="mb-4">
      <v-card-text class="pa-4">
        <v-row>
          <v-col cols="12" md="4"><v-text-field v-model="search" label="Buscar cliente..." prepend-inner-icon="mdi-magnify" clearable hide-details density="compact" /></v-col>
          <v-col cols="12" md="3"><v-select v-model="filterStatus" :items="[{title:'Todas',value:null},{title:'Pagadas',value:'pagada'},{title:'Pendientes',value:'pendiente'}]" label="Estado" hide-details density="compact" /></v-col>
          <v-col cols="12" md="3"><v-text-field v-model="filterDateFrom" label="Desde" type="date" hide-details density="compact" /></v-col>
          <v-col cols="12" md="2"><v-text-field v-model="filterDateTo" label="Hasta" type="date" hide-details density="compact" /></v-col>
        </v-row>
      </v-card-text>
    </v-card>
    <v-card rounded="xl" elevation="2" id="tabla-facturas">
      <v-data-table :headers="headers" :items="filteredInvoices" :loading="loading" items-per-page="15" hover>
        <template #item.customerId="{ item }">{{ customerName(item.customerId) }}</template>
        <template #item.status="{ item }">
          <v-chip :color="item.status==='pagada'?'success':'warning'" size="small" variant="tonal">{{ item.status==='pagada'?'Pagada':'Pendiente' }}</v-chip>
        </template>
        <template #item.total="{ item }">
          <span class="font-weight-bold text-primary">Q{{ Number(item.total||0).toLocaleString('es-GT',{minimumFractionDigits:2}) }}</span>
        </template>
        <template #item.date="{ item }">{{ formatDate(item.date) }}</template>
        <template #item.actions="{ item }">
          <v-btn id="btn-ver-factura" icon="mdi-eye" size="small" variant="text" color="primary" @click="view(item)" />
        </template>
      </v-data-table>
    </v-card>

    <!-- Factura dialog -->
    <v-dialog v-model="invoiceDialog" max-width="700">
      <v-card rounded="xl" v-if="selected">
        <v-card-title class="pa-6 d-flex align-center justify-space-between">
          <span class="text-primary font-weight-bold">Factura #{{ selected.id }}</span>
          <v-btn icon="mdi-printer" variant="text" color="primary" @click="print" />
        </v-card-title>
        <v-card-text class="pa-6" id="inv-print">
          <div class="d-flex align-center mb-4">
            <LemonLogo :size="48" />
            <div class="ml-4"><div class="text-h6 font-weight-bold text-primary">Lemon-Sys</div><div class="text-caption text-medium-emphasis">Bebidas y Abarrotes S.A.</div></div>
            <v-spacer />
            <div class="text-right"><div class="text-h5 font-weight-bold text-primary">FACTURA #{{ selected.id }}</div><div class="text-caption">{{ formatDate(selected.date) }}</div></div>
          </div>
          <v-divider class="mb-3" />
          <div class="mb-3 pa-3 bg-green-lighten-5 rounded-lg">
            <strong>{{ customerName(selected.customerId) }}</strong>
            <div class="text-caption">NIT: {{ customerNIT(selected.customerId) }}</div>
          </div>
          <v-table density="compact" class="mb-4">
            <thead><tr><th>Producto</th><th>Pres.</th><th class="text-right">Cant.</th><th class="text-right">P.Unit</th><th class="text-right">Subtotal</th></tr></thead>
            <tbody>
              <tr v-for="item in orderItems" :key="item.id">
                <td>{{ productName(item.productId) }}</td><td>{{ presentationName(item.presentationId) }}</td>
                <td class="text-right">{{ item.quantity }}</td><td class="text-right">Q{{ item.unitPrice?.toFixed(2) }}</td>
                <td class="text-right font-weight-medium">Q{{ item.subtotal?.toFixed(2) }}</td>
              </tr>
            </tbody>
          </v-table>
          <div class="d-flex justify-end">
            <div style="min-width:260px">
              <div class="d-flex justify-space-between mb-1"><span class="text-medium-emphasis">Subtotal</span><span>Q{{ selected.subtotal?.toFixed(2) }}</span></div>
              <div v-if="selected.discount>0" class="d-flex justify-space-between mb-1"><span class="text-medium-emphasis">Descuento</span><span class="text-error">-Q{{ selected.discount?.toFixed(2) }}</span></div>
              <div class="d-flex justify-space-between mb-1"><span class="text-medium-emphasis">IVA 16%</span><span>Q{{ selected.tax?.toFixed(2) }}</span></div>
              <v-divider class="my-2" />
              <div class="d-flex justify-space-between"><span class="text-h6 font-weight-bold text-primary">TOTAL</span><span class="text-h6 font-weight-bold text-primary">Q{{ selected.total?.toFixed(2) }}</span></div>
            </div>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4"><v-spacer /><v-btn variant="text" @click="invoiceDialog=false">Cerrar</v-btn><v-btn color="primary" prepend-icon="mdi-printer" @click="print">Imprimir</v-btn></v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :color="snack.color" timeout="3000" location="bottom right">{{ snack.text }}</v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { format } from 'date-fns'
import db from '@/db/db'
import { useTour } from '@/composables/useTour'
import LemonLogo from '@/components/common/LemonLogo.vue'

const { startTourIfNew } = useTour()
const loading=ref(true); const invoiceDialog=ref(false)
const search=ref(''); const filterStatus=ref(null); const filterDateFrom=ref(''); const filterDateTo=ref('')
const invoices=ref([]); const customers=ref([]); const products=ref([]); const presentations=ref([])
const selected=ref(null); const orderItems=ref([])
const snack=ref({show:false,text:'',color:'success'})

const headers=[
  {title:'#',key:'id',width:70},{title:'Cliente',key:'customerId'},{title:'Estado',key:'status',width:110},
  {title:'Subtotal',key:'subtotal',width:130},{title:'IVA',key:'tax',width:110},{title:'Total',key:'total',width:140},
  {title:'Fecha',key:'date',width:120},{title:'',key:'actions',sortable:false,width:60},
]
function customerName(id){return customers.value.find(c=>c.id===id)?.name||`#${id}`}
function customerNIT(id){return customers.value.find(c=>c.id===id)?.nit||'-'}
function productName(id){return products.value.find(p=>p.id===id)?.name||'-'}
function presentationName(id){return presentations.value.find(p=>p.id===id)?.description||'-'}
function formatDate(d){try{return format(new Date(d),'dd/MM/yyyy')}catch{return'-'}}
const filteredInvoices=computed(()=>{
  let list=invoices.value
  if(filterStatus.value) list=list.filter(i=>i.status===filterStatus.value)
  if(search.value){const s=search.value.toLowerCase();list=list.filter(i=>customerName(i.customerId).toLowerCase().includes(s))}
  if(filterDateFrom.value) list=list.filter(i=>new Date(i.date)>=new Date(filterDateFrom.value))
  if(filterDateTo.value) list=list.filter(i=>new Date(i.date)<=new Date(filterDateTo.value+'T23:59:59'))
  return list.sort((a,b)=>new Date(b.date)-new Date(a.date))
})
async function load(){
  loading.value=true
  invoices.value=await db.invoices.toArray()
  customers.value=await db.customers.toArray()
  products.value=await db.products.toArray()
  presentations.value=await db.presentations.toArray()
  loading.value=false
}
async function view(item){
  selected.value=item
  orderItems.value=await db.salesOrderItems.where('salesOrderId').equals(item.salesOrderId).toArray()
  invoiceDialog.value=true
}
function print(){
  const c=document.getElementById('inv-print')?.innerHTML
  const w=window.open('','_blank')
  w.document.write(`<html><head><title>Factura #${selected.value.id}</title><style>body{font-family:Arial;padding:20px;max-width:700px;margin:0 auto}table{width:100%;border-collapse:collapse}td,th{padding:8px;border:1px solid #ddd}.text-primary{color:#2E7D32}.text-right{text-align:right}.text-error{color:#d32f2f}</style></head><body>${c}</body></html>`)
  w.document.close();w.print()
}
onMounted(async()=>{await load();await startTourIfNew('facturas')})
</script>

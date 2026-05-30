<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h2 class="text-h6 font-weight-bold text-primary">Órdenes de Compra</h2>
        <p class="text-body-2 text-medium-emphasis">Gestión de compras a proveedores</p>
      </div>
      <v-btn id="btn-nueva-oc" color="primary" prepend-icon="mdi-plus" @click="openDialog()">Nueva OC</v-btn>
    </div>

    <v-card rounded="xl" elevation="1" class="mb-4">
      <v-card-text class="pa-4">
        <v-row>
          <v-col cols="12" md="5">
            <v-text-field v-model="search" label="Buscar..." prepend-inner-icon="mdi-magnify" clearable hide-details density="compact" />
          </v-col>
          <v-col cols="12" md="4">
            <v-select v-model="filterStatus" :items="statusItems" label="Estado" clearable hide-details density="compact" />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card rounded="xl" elevation="2" id="tabla-oc">
      <v-data-table :headers="headers" :items="filteredOC" :loading="loading" items-per-page="15" hover>
        <template #item.supplierId="{ item }">{{ supplierName(item.supplierId) }}</template>
        <template #item.status="{ item }">
          <v-chip :color="statusColor(item.status)" size="small" variant="tonal">{{ statusLabel(item.status) }}</v-chip>
        </template>
        <template #item.paymentType="{ item }">
          <v-chip :color="item.paymentType==='credito'?'warning':'success'" size="x-small" variant="tonal">{{ item.paymentType }}</v-chip>
        </template>
        <template #item.total="{ item }">
          <span class="font-weight-medium">Q{{ Number(item.total||0).toLocaleString('es-GT',{minimumFractionDigits:2}) }}</span>
        </template>
        <template #item.date="{ item }">{{ formatDate(item.date) }}</template>
        <template #item.actions="{ item }">
          <v-btn icon="mdi-eye" size="small" variant="text" color="primary" @click="viewOC(item)" />
          <v-btn v-if="item.status==='enviada'" icon="mdi-check-circle" size="small" variant="text" color="success" @click="receiveOC(item)" title="Marcar como Recibida" />
        </template>
      </v-data-table>
    </v-card>

    <!-- Dialog nueva OC -->
    <v-dialog v-model="dialog" max-width="800" persistent scrollable>
      <v-card rounded="xl">
        <v-card-title class="pa-6 pb-2 text-primary"><v-icon class="mr-2">mdi-cart-outline</v-icon>Nueva Orden de Compra</v-card-title>
        <v-card-text class="pa-6">
          <v-form ref="formRef">
            <v-row class="mb-2">
              <v-col cols="12" md="5">
                <v-select v-model="form.supplierId" :items="supplierItems" label="Proveedor *" :rules="[r=>!!r||'Requerido']" />
              </v-col>
              <v-col cols="12" md="4">
                <v-select v-model="form.paymentType" :items="[{title:'Contado',value:'contado'},{title:'Crédito',value:'credito'}]" label="Tipo de Pago *" />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field v-model="form.dueDate" label="Fecha Vencimiento" type="date" />
              </v-col>
            </v-row>
            <v-divider class="mb-4" />
            <div class="d-flex align-center justify-space-between mb-3">
              <span class="font-weight-medium text-primary">Líneas de Productos</span>
              <v-btn size="small" color="primary" variant="tonal" prepend-icon="mdi-plus" @click="addLine">Agregar Línea</v-btn>
            </div>
            <v-table density="compact">
              <thead><tr><th>Producto</th><th>Presentación</th><th style="width:100px">Cantidad</th><th style="width:120px">Costo Unit.</th><th style="width:120px">Subtotal</th><th style="width:50px"></th></tr></thead>
              <tbody>
                <tr v-for="(line, i) in form.lines" :key="i">
                  <td><v-select v-model="line.productId" :items="productItems" density="compact" hide-details variant="underlined" @update:model-value="id => loadLinePresentations(id, i)" /></td>
                  <td><v-select v-model="line.presentationId" :items="line.presOptions||[]" density="compact" hide-details variant="underlined" /></td>
                  <td><v-text-field v-model.number="line.quantity" type="number" density="compact" hide-details variant="underlined" @update:model-value="calcLine(i)" /></td>
                  <td><v-text-field v-model.number="line.unitCost" type="number" density="compact" hide-details variant="underlined" prefix="Q" @update:model-value="calcLine(i)" /></td>
                  <td class="font-weight-medium">Q{{ (line.subtotal||0).toFixed(2) }}</td>
                  <td><v-btn icon="mdi-delete" size="x-small" variant="text" color="error" @click="form.lines.splice(i,1)" /></td>
                </tr>
              </tbody>
            </v-table>
            <v-divider class="my-3" />
            <div class="d-flex justify-end">
              <div class="text-right">
                <div class="text-body-2 text-medium-emphasis">Total OC</div>
                <div class="text-h5 font-weight-bold text-primary">Q{{ ocTotal.toLocaleString('es-GT',{minimumFractionDigits:2}) }}</div>
              </div>
            </div>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="dialog=false">Cancelar</v-btn>
          <v-btn color="primary" @click="saveOC" :loading="saving">Crear Orden de Compra</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog ver OC -->
    <v-dialog v-model="viewDialog" max-width="700">
      <v-card rounded="xl" v-if="selectedOC">
        <v-card-title class="pa-6 pb-2 text-primary">OC #{{ selectedOC.id }} — {{ supplierName(selectedOC.supplierId) }}</v-card-title>
        <v-card-text class="pa-6">
          <v-row class="mb-4">
            <v-col cols="6"><strong>Estado:</strong> <v-chip :color="statusColor(selectedOC.status)" size="small" variant="tonal">{{ statusLabel(selectedOC.status) }}</v-chip></v-col>
            <v-col cols="6"><strong>Pago:</strong> {{ selectedOC.paymentType }}</v-col>
            <v-col cols="6"><strong>Fecha:</strong> {{ formatDate(selectedOC.date) }}</v-col>
            <v-col cols="6"><strong>Vencimiento:</strong> {{ formatDate(selectedOC.dueDate) }}</v-col>
          </v-row>
          <v-table density="compact">
            <thead><tr><th>Producto</th><th>Presentación</th><th>Cantidad</th><th>Costo Unit.</th><th>Subtotal</th></tr></thead>
            <tbody>
              <tr v-for="line in selectedOCItems" :key="line.id">
                <td>{{ productName(line.productId) }}</td>
                <td>{{ presentationName(line.presentationId) }}</td>
                <td>{{ line.quantity }}</td>
                <td>Q{{ line.unitCost?.toFixed(2) }}</td>
                <td class="font-weight-medium">Q{{ line.subtotal?.toFixed(2) }}</td>
              </tr>
            </tbody>
          </v-table>
          <div class="text-right mt-3">
            <span class="text-h6 font-weight-bold text-primary">Total: Q{{ Number(selectedOC.total||0).toLocaleString('es-GT',{minimumFractionDigits:2}) }}</span>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="viewDialog=false">Cerrar</v-btn>
          <v-btn v-if="selectedOC.status==='enviada'" color="success" @click="receiveOC(selectedOC); viewDialog=false" prepend-icon="mdi-check-circle">Marcar Recibida</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :color="snack.color" timeout="3000" location="bottom right">{{ snack.text }}</v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { format, addDays } from 'date-fns'
import db from '@/db/db'
import { useAuthStore } from '@/stores/auth'
import { useTour } from '@/composables/useTour'

const auth = useAuthStore()
const { startTourIfNew } = useTour()
const loading = ref(true); const saving = ref(false); const dialog = ref(false); const viewDialog = ref(false)
const search = ref(''); const filterStatus = ref(null)
const orders = ref([]); const suppliers = ref([]); const products = ref([]); const presentations = ref([])
const selectedOC = ref(null); const selectedOCItems = ref([])
const formRef = ref(null); const snack = ref({ show:false,text:'',color:'success' })
const form = ref({ supplierId:null, paymentType:'contado', dueDate:'', lines:[] })

const headers = [
  { title:'# OC', key:'id', width:80 }, { title:'Proveedor', key:'supplierId' },
  { title:'Estado', key:'status', width:130 }, { title:'Pago', key:'paymentType', width:100 },
  { title:'Total', key:'total', width:140 }, { title:'Fecha', key:'date', width:130 },
  { title:'', key:'actions', sortable:false, width:100 },
]
const statusItems = [
  { title:'Borrador', value:'borrador' },{ title:'Enviada', value:'enviada' },
  { title:'Recibida', value:'recibida' },{ title:'Pagada', value:'pagada' },
]
const supplierItems = computed(() => suppliers.value.filter(s=>s.active).map(s=>({title:s.name,value:s.id})))
const productItems = computed(() => products.value.filter(p=>p.type==='compra').map(p=>({title:`${p.code} — ${p.name}`,value:p.id})))
const ocTotal = computed(() => form.value.lines.reduce((s,l)=>s+(l.subtotal||0),0))
const filteredOC = computed(() => {
  let list = orders.value
  if (filterStatus.value) list = list.filter(o=>o.status===filterStatus.value)
  if (search.value) { const s=search.value.toLowerCase(); list=list.filter(o=>supplierName(o.supplierId).toLowerCase().includes(s)) }
  return list.sort((a,b)=>new Date(b.date)-new Date(a.date))
})
function supplierName(id) { return suppliers.value.find(s=>s.id===id)?.name||'-' }
function productName(id) { return products.value.find(p=>p.id===id)?.name||'-' }
function presentationName(id) { return presentations.value.find(p=>p.id===id)?.description||'-' }
function statusColor(s) { return {borrador:'grey',enviada:'info',recibida:'success',pagada:'primary'}[s]||'grey' }
function statusLabel(s) { return {borrador:'Borrador',enviada:'Enviada',recibida:'Recibida',pagada:'Pagada'}[s]||s }
function formatDate(d) { try { return format(new Date(d),'dd/MM/yyyy') } catch { return '-' } }

async function load() {
  loading.value=true
  orders.value=await db.purchaseOrders.toArray()
  suppliers.value=await db.suppliers.toArray()
  products.value=await db.products.toArray()
  presentations.value=await db.presentations.toArray()
  loading.value=false
}
function openDialog() {
  form.value={ supplierId:null, paymentType:'contado', dueDate:format(addDays(new Date(),30),'yyyy-MM-dd'), lines:[] }
  dialog.value=true
}
function addLine() { form.value.lines.push({ productId:null, presentationId:null, presOptions:[], quantity:1, unitCost:0, subtotal:0 }) }
async function loadLinePresentations(productId, i) {
  const pres = await db.presentations.where('productId').equals(productId).toArray()
  form.value.lines[i].presOptions = pres.map(p=>({title:p.description,value:p.id}))
  const prod = products.value.find(p=>p.id===productId)
  if (prod) form.value.lines[i].unitCost = prod.buyPrice
  calcLine(i)
}
function calcLine(i) {
  const l = form.value.lines[i]
  l.subtotal = parseFloat(((l.quantity||0)*(l.unitCost||0)).toFixed(2))
}
async function saveOC() {
  const { valid } = await formRef.value.validate(); if (!valid) return
  saving.value=true
  const total = ocTotal.value
  const ocId = await db.purchaseOrders.add({ supplierId:form.value.supplierId, status:'enviada', paymentType:form.value.paymentType, date:new Date(), dueDate:form.value.dueDate?new Date(form.value.dueDate):null, total })
  for (const l of form.value.lines) {
    if (l.productId) await db.purchaseOrderItems.add({ purchaseOrderId:ocId, productId:l.productId, presentationId:l.presentationId, quantity:l.quantity, unitCost:l.unitCost, subtotal:l.subtotal })
  }
  // Si es contado registrar egreso
  if (form.value.paymentType==='contado') {
    await db.cashMovements.add({ type:'egreso', refType:'compra', refId:ocId, amount:total, date:new Date(), description:`Compra contado OC#${ocId}` })
  }
  await load(); dialog.value=false; saving.value=false
  snack.value={show:true,text:'Orden de compra creada',color:'success'}
}
async function viewOC(item) {
  selectedOC.value=item
  selectedOCItems.value=await db.purchaseOrderItems.where('purchaseOrderId').equals(item.id).toArray()
  viewDialog.value=true
}
async function receiveOC(item) {
  await db.purchaseOrders.update(item.id,{status:'recibida'})
  const items = await db.purchaseOrderItems.where('purchaseOrderId').equals(item.id).toArray()
  const now = new Date()
  for (const li of items) {
    if (!li.productId) continue
    const lotNumber = `OC${item.id}-${li.productId}`
    const expiryDate = addDays(now, 180)
    const batchId = await db.batches.add({ productId:li.productId, presentationId:li.presentationId, lotNumber, entryDate:now, expiryDate, quantity:li.quantity, available:li.quantity, purchaseOrderId:item.id })
    await db.stockMovements.add({ productId:li.productId, presentationId:li.presentationId, batchId, type:'entrada', quantity:li.quantity, date:now, userId:auth.user.id, reference:`OC#${item.id}` })
  }
  if (item.paymentType==='credito') {
    await db.accountsPayable.add({ purchaseOrderId:item.id, supplierId:item.supplierId, amount:item.total, dueDate:item.dueDate||addDays(now,30), paidAmount:0, status:'pendiente' })
  }
  await load()
  snack.value={show:true,text:'OC recibida — lotes generados en inventario',color:'success'}
}
onMounted(async () => { await load(); await startTourIfNew('compras') })
</script>

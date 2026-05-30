<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <div><h2 class="text-h6 font-weight-bold text-primary">Pedidos Mayoristas</h2><p class="text-body-2 text-medium-emphasis">Creación y seguimiento de pedidos por cliente</p></div>
      <v-btn id="btn-nuevo-pedido" color="primary" prepend-icon="mdi-plus" @click="openDialog()">Nuevo Pedido</v-btn>
    </div>

    <v-card rounded="xl" elevation="1" class="mb-4">
      <v-card-text class="pa-4">
        <v-row>
          <v-col cols="12" md="4"><v-text-field v-model="search" label="Buscar cliente..." prepend-inner-icon="mdi-magnify" clearable hide-details density="compact" /></v-col>
          <v-col cols="12" md="4"><v-select v-model="filterStatus" :items="statusItems" label="Estado" clearable hide-details density="compact" /></v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card rounded="xl" elevation="2">
      <v-data-table :headers="headers" :items="filteredOrders" :loading="loading" items-per-page="15" hover>
        <template #item.customerId="{ item }">{{ customerName(item.customerId) }}</template>
        <template #item.status="{ item }">
          <v-chip :color="statusColor(item.status)" size="small" variant="tonal">{{ statusLabel(item.status) }}</v-chip>
        </template>
        <template #item.total="{ item }">
          <span class="font-weight-bold text-primary">Q{{ Number(item.total||0).toLocaleString('es-GT',{minimumFractionDigits:2}) }}</span>
        </template>
        <template #item.date="{ item }">{{ formatDate(item.date) }}</template>
        <template #item.actions="{ item }">
          <v-btn icon="mdi-receipt-text" size="small" variant="text" color="primary" @click="viewInvoice(item)" title="Ver Factura" />
        </template>
      </v-data-table>
    </v-card>

    <!-- Dialog nuevo pedido -->
    <v-dialog v-model="dialog" max-width="900" persistent scrollable>
      <v-card rounded="xl">
        <v-card-title class="pa-6 pb-2 text-primary"><v-icon class="mr-2">mdi-clipboard-list</v-icon>Nuevo Pedido Mayorista</v-card-title>
        <v-card-text class="pa-6">
          <v-form ref="formRef">
            <v-row class="mb-3">
              <v-col cols="12" md="5">
                <v-select v-model="form.customerId" :items="customerItems" label="Cliente *" :rules="[r=>!!r||'Requerido']" @update:model-value="onCustomerChange" />
              </v-col>
              <v-col cols="12" md="4">
                <v-select v-model="form.deliveryType" :items="[{title:'Entrega a Domicilio',value:'domicilio'},{title:'Retiro en Bodega',value:'bodega'}]" label="Tipo de Entrega" />
              </v-col>
              <v-col cols="12" md="3" v-if="selectedCustomerData">
                <v-chip color="primary" variant="tonal" size="small" class="mt-3">{{ plName(selectedCustomerData.priceListId) }}</v-chip>
              </v-col>
            </v-row>

            <v-divider class="mb-4" />

            <!-- Alerta de crédito vencido -->
            <v-alert v-if="creditAlert" type="error" variant="tonal" density="compact" class="mb-4" icon="mdi-alert-circle">
              <strong>Crédito vencido:</strong> Este cliente tiene {{ creditAlert.overdue }} factura(s) vencida(s) por un total de
              <strong>Q{{ creditAlert.amount.toLocaleString('es-GT',{minimumFractionDigits:2}) }}</strong>.
              No se puede generar un nuevo pedido hasta que regularice su cuenta.
            </v-alert>

            <div class="d-flex align-center justify-space-between mb-3">
              <span class="font-weight-medium text-primary">Líneas de Productos</span>
              <v-btn size="small" color="primary" variant="tonal" prepend-icon="mdi-plus" @click="addLine">Agregar Producto</v-btn>
            </div>

            <v-table density="compact">
              <thead><tr><th>Producto</th><th>Presentación</th><th style="width:90px">Cajas</th><th style="width:120px">P. Unitario</th><th style="width:110px">Subtotal</th><th style="width:40px"></th></tr></thead>
              <tbody>
                <tr v-for="(line,i) in form.lines" :key="i">
                  <td><v-select v-model="line.productId" :items="productItems" density="compact" hide-details variant="underlined" @update:model-value="id=>loadLineData(id,i)" /></td>
                  <td><v-select v-model="line.presentationId" :items="line.presOptions||[]" density="compact" hide-details variant="underlined" /></td>
                  <td><v-text-field v-model.number="line.quantity" type="number" min="1" density="compact" hide-details variant="underlined" @update:model-value="calcLine(i)" /></td>
                  <td><span class="text-body-2">Q{{ (line.unitPrice||0).toFixed(2) }}</span></td>
                  <td class="font-weight-medium text-primary">Q{{ (line.subtotal||0).toFixed(2) }}</td>
                  <td><v-btn icon="mdi-delete" size="x-small" variant="text" color="error" @click="form.lines.splice(i,1); calcTotals()" /></td>
                </tr>
              </tbody>
            </v-table>

            <v-divider class="my-4" />

            <!-- Totales -->
            <v-row justify="end">
              <v-col cols="12" md="5">
                <v-table density="compact">
                  <tbody>
                    <tr><td class="text-medium-emphasis">Subtotal</td><td class="text-right font-weight-medium">Q{{ totals.subtotal.toFixed(2) }}</td></tr>
                    <tr>
                      <td class="text-medium-emphasis d-flex align-center">
                        Descuento
                        <v-text-field id="campo-descuento" v-model.number="form.discount" type="number" min="0" density="compact" hide-details variant="underlined" prefix="Q" style="width:100px; margin-left:8px" @update:model-value="calcTotals" />
                      </td>
                      <td class="text-right text-error">- Q{{ (form.discount||0).toFixed(2) }}</td>
                    </tr>
                     <tr><td class="text-medium-emphasis">IVA 12%</td><td class="text-right">Q{{ totals.tax.toFixed(2) }}</td></tr>
                    <tr>
                      <td class="font-weight-bold text-primary text-h6">TOTAL</td>
                      <td class="text-right font-weight-bold text-primary text-h6">Q{{ totals.total.toFixed(2) }}</td>
                    </tr>
                  </tbody>
                </v-table>
              </v-col>
            </v-row>

            <v-textarea v-model="form.notes" label="Notas del pedido" rows="2" class="mt-3" />
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer /><v-btn variant="text" @click="dialog=false">Cancelar</v-btn>
          <v-btn color="primary" @click="saveOrder" :loading="saving" :disabled="!!creditAlert">Confirmar Pedido y Facturar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Factura vista -->
    <v-dialog v-model="invoiceDialog" max-width="700">
      <v-card rounded="xl" v-if="selectedInvoice">
        <v-card-title class="pa-6 d-flex align-center justify-space-between">
          <span class="text-primary font-weight-bold">Factura #{{ selectedInvoice.id }}</span>
          <v-btn icon="mdi-printer" variant="text" color="primary" @click="printInvoice" />
        </v-card-title>
        <v-card-text id="resumen-pedido" class="pa-6">
          <div class="d-flex align-center mb-6">
            <LemonLogo :size="48" />
            <div class="ml-4">
              <div class="text-h6 font-weight-bold text-primary">Lemon-Sys</div>
              <div class="text-caption text-medium-emphasis">Bebidas y Abarrotes S.A. | NIT: 98765432-1</div>
            </div>
            <v-spacer />
            <div class="text-right">
              <div class="text-h5 font-weight-bold text-primary">FACTURA</div>
              <div class="text-caption">#{{ selectedInvoice.id }}</div>
              <div class="text-caption">{{ formatDate(selectedInvoice.date) }}</div>
            </div>
          </div>
          <v-divider class="mb-4" />
          <div class="mb-4">
            <div class="font-weight-bold">Cliente:</div>
            <div>{{ customerName(selectedInvoice.customerId) }}</div>
            <div class="text-caption text-medium-emphasis">NIT: {{ customerNIT(selectedInvoice.customerId) }}</div>
          </div>
          <v-table density="compact" class="mb-4">
            <thead><tr class="bg-primary"><th class="text-white">Producto</th><th class="text-white">Pres.</th><th class="text-white text-right">Cant.</th><th class="text-white text-right">P.Unit</th><th class="text-white text-right">Subtotal</th></tr></thead>
            <tbody>
              <tr v-for="item in selectedOrderItems" :key="item.id">
                <td>{{ productName(item.productId) }}</td>
                <td>{{ presentationName(item.presentationId) }}</td>
                <td class="text-right">{{ item.quantity }}</td>
                <td class="text-right">Q{{ item.unitPrice?.toFixed(2) }}</td>
                <td class="text-right font-weight-medium">Q{{ item.subtotal?.toFixed(2) }}</td>
              </tr>
            </tbody>
          </v-table>
          <div class="d-flex justify-end">
            <v-table density="compact" style="min-width:250px">
              <tbody>
                <tr><td class="text-medium-emphasis">Subtotal</td><td class="text-right">Q{{ selectedInvoice.subtotal?.toFixed(2) }}</td></tr>
                <tr v-if="selectedInvoice.discount>0"><td class="text-medium-emphasis">Descuento</td><td class="text-right text-error">-Q{{ selectedInvoice.discount?.toFixed(2) }}</td></tr>
                <tr><td class="text-medium-emphasis">IVA 16%</td><td class="text-right">Q{{ selectedInvoice.tax?.toFixed(2) }}</td></tr>
                <tr class="bg-green-lighten-5"><td class="font-weight-bold text-primary text-h6">TOTAL</td><td class="text-right font-weight-bold text-primary text-h6">Q{{ selectedInvoice.total?.toFixed(2) }}</td></tr>
              </tbody>
            </v-table>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4"><v-spacer /><v-btn variant="text" @click="invoiceDialog=false">Cerrar</v-btn><v-btn color="primary" prepend-icon="mdi-printer" @click="printInvoice">Imprimir</v-btn></v-card-actions>
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
import LemonLogo from '@/components/common/LemonLogo.vue'

const auth = useAuthStore()
const { startTourIfNew } = useTour()

const loading=ref(true); const saving=ref(false); const dialog=ref(false); const invoiceDialog=ref(false)
const search=ref(''); const filterStatus=ref(null)
const orders=ref([]); const customers=ref([]); const products=ref([]); const presentations=ref([]); const priceLists=ref([])
const selectedInvoice=ref(null); const selectedOrderItems=ref([])
const formRef=ref(null); const snack=ref({show:false,text:'',color:'success'})
const form=ref({customerId:null,deliveryType:'domicilio',discount:0,notes:'',lines:[]})
const totals=ref({subtotal:0,discount:0,tax:0,total:0})
const selectedCustomerData=ref(null)
const creditAlert=ref(null)   // null | { overdue: number, amount: number }

const headers=[
  {title:'#',key:'id',width:60},{title:'Cliente',key:'customerId'},{title:'Estado',key:'status',width:140},
  {title:'Tipo',key:'deliveryType',width:120},{title:'Total',key:'total',width:140},{title:'Fecha',key:'date',width:120},
  {title:'',key:'actions',sortable:false,width:60},
]
const statusItems=[{title:'Completado',value:'completado'},{title:'Nuevo',value:'nuevo'},{title:'Preparando',value:'preparando'},{title:'En Ruta',value:'en_ruta'},{title:'Entregado',value:'entregado'}]
const customerItems=computed(()=>customers.value.filter(c=>c.active).map(c=>({title:c.name,value:c.id})))
const productItems=computed(()=>products.value.filter(p=>p.active && p.type==='venta').map(p=>({title:p.name,value:p.id})))

function statusColor(s){return{nuevo:'grey',preparando:'info',en_ruta:'warning',entregado:'success',completado:'primary'}[s]||'grey'}
function statusLabel(s){return{nuevo:'Nuevo',preparando:'Preparando',en_ruta:'En Ruta',entregado:'Entregado',completado:'Completado'}[s]||s}
function customerName(id){return customers.value.find(c=>c.id===id)?.name||`#${id}`}
function customerNIT(id){return customers.value.find(c=>c.id===id)?.nit||'-'}
function productName(id){return products.value.find(p=>p.id===id)?.name||'-'}
function presentationName(id){return presentations.value.find(p=>p.id===id)?.description||'-'}
function plName(id){return priceLists.value.find(p=>p.id===id)?.name||'-'}
function formatDate(d){try{return format(new Date(d),'dd/MM/yyyy')}catch{return'-'}}

const filteredOrders=computed(()=>{
  let list=orders.value
  if(filterStatus.value) list=list.filter(o=>o.status===filterStatus.value)
  if(search.value){const s=search.value.toLowerCase();list=list.filter(o=>customerName(o.customerId).toLowerCase().includes(s))}
  return list.sort((a,b)=>new Date(b.date)-new Date(a.date))
})

async function load(){
  loading.value=true
  orders.value=await db.salesOrders.toArray()
  customers.value=await db.customers.toArray()
  products.value=await db.products.toArray()
  presentations.value=await db.presentations.toArray()
  priceLists.value=await db.priceLists.toArray()
  loading.value=false
}

function openDialog(){
  form.value={customerId:null,deliveryType:'domicilio',discount:0,notes:'',lines:[]}
  selectedCustomerData.value=null
  creditAlert.value=null
  totals.value={subtotal:0,discount:0,tax:0,total:0}
  dialog.value=true
}

async function onCustomerChange(id){
  selectedCustomerData.value=customers.value.find(c=>c.id===id)||null
  creditAlert.value=null
  // Verificar CxC vencida
  const cxcRows=await db.accountsReceivable.where('customerId').equals(id).toArray()
  const today=new Date(); today.setHours(0,0,0,0)
  const overdue=cxcRows.filter(r=>r.status==='pendiente'&&new Date(r.dueDate)<today)
  if(overdue.length>0){
    const amount=overdue.reduce((s,r)=>s+(r.amount-(r.paidAmount||0)),0)
    creditAlert.value={overdue:overdue.length,amount}
  }
  form.value.lines.forEach((_,i)=>calcLine(i))
}

async function loadLineData(productId, i){
  form.value.lines[i].presentationId=null
  const pres=await db.presentations.where('productId').equals(productId).toArray()
  form.value.lines[i].presOptions=pres.map(p=>({title:p.description,value:p.id}))
  const prod=products.value.find(p=>p.id===productId)
  if(prod){
    const pl=selectedCustomerData.value?priceLists.value.find(p=>p.id===selectedCustomerData.value.priceListId):null
    const multiplier=pl?.multiplier||1
    form.value.lines[i].unitPrice=parseFloat((prod.baseSellPrice*multiplier).toFixed(2))
  }
  calcLine(i)
}
function calcLine(i){
  const l=form.value.lines[i]
  l.subtotal=parseFloat(((l.quantity||0)*(l.unitPrice||0)).toFixed(2))
  calcTotals()
}
function calcTotals(){
  const sub=form.value.lines.reduce((s,l)=>s+(l.subtotal||0),0)
  const disc=form.value.discount||0
  const base=sub-disc
  const tax=parseFloat((base*0.12).toFixed(2))
  totals.value={subtotal:parseFloat(sub.toFixed(2)),discount:disc,tax,total:parseFloat((base+tax).toFixed(2))}
}
function addLine(){form.value.lines.push({productId:null,presentationId:null,presOptions:[],quantity:1,unitPrice:0,subtotal:0})}

async function saveOrder(){
  const{valid}=await formRef.value.validate();if(!valid)return
  saving.value=true
  const now=new Date()
  const cust=selectedCustomerData.value
  const orderId=await db.salesOrders.add({
    customerId:form.value.customerId,status:'nuevo',deliveryType:form.value.deliveryType,
    date:now,userId:auth.user.id,zoneId:cust?.zoneId||1,
    subtotal:totals.value.subtotal,discount:totals.value.discount,tax:totals.value.tax,total:totals.value.total,
    paymentType:cust?.paymentType||'contado',notes:form.value.notes
  })
  for(const l of form.value.lines){
    if(!l.productId) continue
    await db.salesOrderItems.add({salesOrderId:orderId,productId:l.productId,presentationId:l.presentationId,quantity:l.quantity,unitPrice:l.unitPrice,subtotal:l.subtotal})
    // FIFO: descontar lotes
    const batches=await db.batches.where('productId').equals(l.productId).toArray()
    const validBatches=batches.filter(b=>new Date(b.expiryDate)>=now&&b.available>0&&b.presentationId===l.presentationId).sort((a,b)=>new Date(a.expiryDate)-new Date(b.expiryDate))
    let remaining=l.quantity
    for(const b of validBatches){
      if(remaining<=0)break
      const take=Math.min(b.available,remaining)
      await db.batches.update(b.id,{available:b.available-take})
      await db.stockMovements.add({productId:l.productId,presentationId:l.presentationId,batchId:b.id,type:'salida',quantity:take,date:now,userId:auth.user.id,reference:`Pedido#${orderId}`})
      remaining-=take
    }
  }
  // Factura
  const invId=await db.invoices.add({salesOrderId:orderId,customerId:form.value.customerId,date:now,subtotal:totals.value.subtotal,discount:totals.value.discount,tax:totals.value.tax,total:totals.value.total,status:cust?.paymentType==='contado'?'pagada':'pendiente'})
  // Finanzas
  if(cust?.paymentType==='credito'){
    await db.accountsReceivable.add({invoiceId:invId,customerId:form.value.customerId,amount:totals.value.total,dueDate:addDays(now,cust.creditDays||30),paidAmount:0,status:'pendiente'})
  } else {
    await db.cashMovements.add({type:'ingreso',refType:'venta',refId:invId,amount:totals.value.total,date:now,description:`Venta contado cliente #${form.value.customerId}`})
  }
  await load()
  dialog.value=false; saving.value=false
  snack.value={show:true,text:'Pedido creado y facturado',color:'success'}
}

async function viewInvoice(order){
  const inv=await db.invoices.where('salesOrderId').equals(order.id).first()
  if(!inv) return snack.value={show:true,text:'Factura no encontrada',color:'warning'}
  selectedInvoice.value=inv
  selectedOrderItems.value=await db.salesOrderItems.where('salesOrderId').equals(order.id).toArray()
  invoiceDialog.value=true
}

function printInvoice(){
  const content=document.getElementById('resumen-pedido')?.innerHTML
  const w=window.open('','_blank')
  w.document.write(`<html><head><title>Factura #${selectedInvoice.value.id}</title><style>body{font-family:Arial;padding:20px}table{width:100%;border-collapse:collapse}td,th{padding:8px;border:1px solid #ddd}.text-primary{color:#2E7D32}.text-right{text-align:right}</style></head><body>${content}</body></html>`)
  w.document.close(); w.print()
}

onMounted(async()=>{await load();await startTourIfNew('pedidos')})
</script>

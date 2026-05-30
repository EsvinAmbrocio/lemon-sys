<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <div><h2 class="text-h6 font-weight-bold text-primary">Cuentas por Pagar</h2><p class="text-body-2 text-medium-emphasis">Obligaciones con proveedores</p></div>
    </div>
    <v-row class="mb-4">
      <v-col cols="6" sm="3"><KpiCard title="Total Pendiente" :value="'Q'+totals.pendiente.toLocaleString('es-GT',{minimumFractionDigits:2})" icon="mdi-bank-minus" icon-color="warning" /></v-col>
      <v-col cols="6" sm="3"><KpiCard title="Vencidas" :value="'Q'+totals.vencido.toLocaleString('es-GT',{minimumFractionDigits:2})" icon="mdi-alert-circle" icon-color="error" /></v-col>
      <v-col cols="6" sm="3"><KpiCard title="Pagado (mes)" :value="'Q'+totals.pagado.toLocaleString('es-GT',{minimumFractionDigits:2})" icon="mdi-check-circle" icon-color="success" /></v-col>
      <v-col cols="6" sm="3"><KpiCard title="N° Cuentas" :value="cxpList.length" icon="mdi-file-document" icon-color="primary" /></v-col>
    </v-row>
    <v-card rounded="xl" elevation="1" class="mb-4">
      <v-card-text class="pa-4">
        <v-row>
          <v-col cols="12" md="4"><v-text-field v-model="search" label="Buscar proveedor..." prepend-inner-icon="mdi-magnify" clearable hide-details density="compact" /></v-col>
          <v-col cols="12" md="4"><v-select v-model="filterStatus" :items="statusItems" label="Estado" clearable hide-details density="compact" /></v-col>
        </v-row>
      </v-card-text>
    </v-card>
    <v-card rounded="xl" elevation="2">
      <v-data-table :headers="headers" :items="filteredCXP" :loading="loading" items-per-page="15" hover>
        <template #item.supplierId="{ item }">{{ supplierName(item.supplierId) }}</template>
        <template #item.amount="{ item }">
          <span class="font-weight-medium">Q{{ Number(item.amount||0).toLocaleString('es-GT',{minimumFractionDigits:2}) }}</span>
        </template>
        <template #item.saldo="{ item }">
          <span :class="(item.amount-item.paidAmount)>0?'text-error font-weight-bold':''">
            Q{{ Number((item.amount||0)-(item.paidAmount||0)).toLocaleString('es-GT',{minimumFractionDigits:2}) }}
          </span>
        </template>
        <template #item.dueDate="{ item }">
          <span :class="isOverdue(item)?'text-error font-weight-medium':''">{{ formatDate(item.dueDate) }}</span>
        </template>
        <template #item.status="{ item }">
          <v-chip :color="statusColor(item.status)" size="small" variant="tonal">{{ statusLabel(item.status) }}</v-chip>
        </template>
        <template #item.actions="{ item }">
          <v-btn v-if="item.status!='pagada'" icon="mdi-cash-minus" size="small" variant="text" color="error" @click="openPago(item)" title="Registrar Pago" />
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="pagoDialog" max-width="400" persistent>
      <v-card rounded="xl" v-if="selected">
        <v-card-title class="pa-6 pb-2 text-primary"><v-icon class="mr-2">mdi-cash-minus</v-icon>Registrar Pago</v-card-title>
        <v-card-text class="pa-6">
          <div class="mb-4 pa-3 bg-red-lighten-5 rounded-lg">
            <div class="font-weight-bold">{{ supplierName(selected.supplierId) }}</div>
            <div class="text-body-2">Saldo: <strong class="text-error">Q{{ ((selected.amount||0)-(selected.paidAmount||0)).toFixed(2) }}</strong></div>
          </div>
          <v-text-field v-model.number="pagoAmount" label="Monto a Pagar *" type="number" prefix="Q" />
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer /><v-btn variant="text" @click="pagoDialog=false">Cancelar</v-btn>
          <v-btn color="error" @click="registrarPago" :loading="saving">Registrar Pago</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :color="snack.color" timeout="3000" location="bottom right">{{ snack.text }}</v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { format, startOfMonth } from 'date-fns'
import db from '@/db/db'
import KpiCard from '@/components/common/KpiCard.vue'

const loading=ref(true); const saving=ref(false); const pagoDialog=ref(false)
const search=ref(''); const filterStatus=ref(null)
const cxpList=ref([]); const suppliers=ref([])
const selected=ref(null); const pagoAmount=ref(0)
const snack=ref({show:false,text:'',color:'success'})
const now=new Date(); const mesStart=startOfMonth(now)
const headers=[
  {title:'Proveedor',key:'supplierId'},{title:'OC #',key:'purchaseOrderId',width:90},
  {title:'Total',key:'amount',width:130},{title:'Saldo',key:'saldo',width:130},
  {title:'Vence',key:'dueDate',width:120},{title:'Estado',key:'status',width:120},
  {title:'',key:'actions',sortable:false,width:70},
]
const statusItems=[{title:'Pendiente',value:'pendiente'},{title:'Vencida',value:'vencida'},{title:'Pagada',value:'pagada'}]
function statusColor(s){return{pendiente:'warning',vencida:'error',pagada:'success'}[s]||'grey'}
function statusLabel(s){return{pendiente:'Pendiente',vencida:'Vencida',pagada:'Pagada'}[s]||s}
function supplierName(id){return suppliers.value.find(s=>s.id===id)?.name||`#${id}`}
function formatDate(d){try{return format(new Date(d),'dd/MM/yyyy')}catch{return'-'}}
function isOverdue(item){return item.status!='pagada'&&new Date(item.dueDate)<now}
const totals=computed(()=>({
  pendiente:cxpList.value.filter(c=>c.status==='pendiente').reduce((s,c)=>s+(c.amount||0)-(c.paidAmount||0),0),
  vencido:cxpList.value.filter(c=>c.status==='vencida').reduce((s,c)=>s+(c.amount||0)-(c.paidAmount||0),0),
  pagado:cxpList.value.filter(c=>c.status==='pagada'&&new Date(c.dueDate)>=mesStart).reduce((s,c)=>s+(c.amount||0),0),
}))
const filteredCXP=computed(()=>{
  let list=cxpList.value
  if(filterStatus.value) list=list.filter(c=>c.status===filterStatus.value)
  if(search.value){const s=search.value.toLowerCase();list=list.filter(c=>supplierName(c.supplierId).toLowerCase().includes(s))}
  return list.sort((a,b)=>new Date(a.dueDate)-new Date(b.dueDate))
})
async function load(){
  loading.value=true
  cxpList.value=await db.accountsPayable.toArray()
  suppliers.value=await db.suppliers.toArray()
  for(const c of cxpList.value){
    if(c.status==='pendiente'&&new Date(c.dueDate)<now){
      await db.accountsPayable.update(c.id,{status:'vencida'});c.status='vencida'
    }
  }
  loading.value=false
}
function openPago(item){selected.value=item;pagoAmount.value=(item.amount||0)-(item.paidAmount||0);pagoDialog.value=true}
async function registrarPago(){
  saving.value=true
  const paid=(selected.value.paidAmount||0)+pagoAmount.value
  const newStatus=paid>=(selected.value.amount||0)?'pagada':'pendiente'
  await db.accountsPayable.update(selected.value.id,{paidAmount:paid,status:newStatus})
  await db.cashMovements.add({type:'egreso',refType:'cxp',refId:selected.value.id,amount:pagoAmount.value,date:now,description:`Pago proveedor #${selected.value.supplierId}`})
  await load();pagoDialog.value=false;saving.value=false
  snack.value={show:true,text:'Pago registrado',color:'success'}
}
onMounted(load)
</script>

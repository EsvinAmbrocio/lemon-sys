<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <div><h2 class="text-h6 font-weight-bold text-primary">Clientes Mayoristas</h2><p class="text-body-2 text-medium-emphasis">Gestión de clientes, listas de precios y crédito</p></div>
      <v-btn id="btn-nuevo-cliente" color="primary" prepend-icon="mdi-plus" @click="openDialog()">Nuevo Cliente</v-btn>
    </div>
    <v-card rounded="xl" elevation="1" class="mb-4">
      <v-card-text class="pa-4">
        <v-row>
          <v-col cols="12" md="5"><v-text-field v-model="search" label="Buscar cliente..." prepend-inner-icon="mdi-magnify" clearable hide-details density="compact" /></v-col>
          <v-col cols="12" md="4">
            <v-select v-model="filterPL" :items="plItems" label="Lista de Precios" clearable hide-details density="compact" id="select-lista" />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
    <v-card rounded="xl" elevation="2" id="tabla-clientes">
      <v-data-table :headers="headers" :items="filteredCustomers" :loading="loading" items-per-page="15" hover>
        <template #item.priceListId="{ item }">
          <v-chip size="x-small" color="primary" variant="tonal">{{ plName(item.priceListId) }}</v-chip>
        </template>
        <template #item.zoneId="{ item }">{{ zoneName(item.zoneId) }}</template>
        <template #item.paymentType="{ item }">
          <v-chip size="x-small" :color="item.paymentType==='credito'?'warning':'success'" variant="tonal">{{ item.paymentType }}</v-chip>
        </template>
        <template #item.creditLimit="{ item }">
          <span v-if="item.paymentType==='credito'">Q{{ Number(item.creditLimit||0).toLocaleString('es-GT') }}</span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>
        <template #item.active="{ item }">
          <v-chip :color="item.active?'success':'error'" size="x-small" variant="tonal">{{ item.active?'Activo':'Inactivo' }}</v-chip>
        </template>
        <template #item.actions="{ item }">
          <v-btn icon="mdi-pencil" size="small" variant="text" color="primary" @click="openDialog(item)" />
          <v-btn icon="mdi-history" size="small" variant="text" color="secondary" @click="viewHistory(item)" title="Historial de compras" />
          <v-btn :icon="item.active?'mdi-toggle-switch':'mdi-toggle-switch-off'" size="small" variant="text" :color="item.active?'success':'grey'" @click="toggleActive(item)" />
        </template>
      </v-data-table>
    </v-card>

    <!-- Dialog cliente -->
    <v-dialog v-model="dialog" max-width="700" persistent>
      <v-card rounded="xl">
        <v-card-title class="pa-6 pb-2 text-primary"><v-icon class="mr-2">mdi-account-group</v-icon>{{ editing?'Editar':'Nuevo' }} Cliente</v-card-title>
        <v-card-text class="pa-6">
          <v-form ref="formRef">
            <v-row>
              <v-col cols="12" md="8"><v-text-field v-model="form.name" label="Razón Social / Nombre *" :rules="[r=>!!r||'Requerido']" /></v-col>
              <v-col cols="12" md="4"><v-text-field v-model="form.nit" label="NIT" /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model="form.phone" label="Teléfono" /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model="form.email" label="Email" type="email" /></v-col>
              <v-col cols="12"><v-text-field v-model="form.address" label="Dirección" /></v-col>
              <v-col cols="12" md="6">
                <v-select v-model="form.zoneId" :items="zoneItems" label="Zona de Entrega *" :rules="[r=>!!r||'Requerido']" />
              </v-col>
              <v-col cols="12" md="6">
                <v-select v-model="form.priceListId" :items="plItems" label="Lista de Precios *" :rules="[r=>!!r||'Requerido']" id="select-lista" />
              </v-col>
              <v-col cols="12" md="6">
                <v-select v-model="form.paymentType" :items="[{title:'Contado',value:'contado'},{title:'Crédito',value:'credito'}]" label="Tipo de Pago" />
              </v-col>
              <v-col cols="12" md="3" v-if="form.paymentType==='credito'">
                <v-text-field v-model.number="form.creditDays" label="Días de Crédito" type="number" />
              </v-col>
              <v-col cols="12" md="3" v-if="form.paymentType==='credito'">
                <v-text-field v-model.number="form.creditLimit" label="Límite de Crédito" type="number" prefix="Q" />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer /><v-btn variant="text" @click="dialog=false">Cancelar</v-btn>
          <v-btn color="primary" @click="save" :loading="saving">{{ editing?'Guardar':'Crear' }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog historial -->
    <v-dialog v-model="histDialog" max-width="700">
      <v-card rounded="xl" v-if="selectedCustomer">
        <v-card-title class="pa-6 pb-2 text-primary"><v-icon class="mr-2">mdi-history</v-icon>Historial — {{ selectedCustomer.name }}</v-card-title>
        <v-card-text class="pa-4">
          <v-data-table :headers="histHeaders" :items="customerHistory" items-per-page="10" density="compact">
            <template #item.total="{ item }"><span class="font-weight-medium">Q{{ Number(item.total||0).toLocaleString('es-GT',{minimumFractionDigits:2}) }}</span></template>
            <template #item.date="{ item }">{{ formatDate(item.date) }}</template>
            <template #item.status="{ item }"><v-chip :color="item.status==='pagada'?'success':'warning'" size="x-small" variant="tonal">{{ item.status }}</v-chip></template>
          </v-data-table>
        </v-card-text>
        <v-card-actions class="pa-4"><v-spacer /><v-btn variant="text" @click="histDialog=false">Cerrar</v-btn></v-card-actions>
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

const { startTourIfNew } = useTour()
const loading=ref(true); const saving=ref(false); const dialog=ref(false); const histDialog=ref(false); const editing=ref(false)
const search=ref(''); const filterPL=ref(null)
const customers=ref([]); const zones=ref([]); const priceLists=ref([]); const customerHistory=ref([]); const selectedCustomer=ref(null)
const formRef=ref(null); const snack=ref({show:false,text:'',color:'success'})
const form=ref({name:'',nit:'',phone:'',email:'',address:'',zoneId:null,priceListId:null,paymentType:'contado',creditDays:30,creditLimit:0})
const headers=[
  {title:'Cliente',key:'name'},{title:'NIT',key:'nit',width:130},{title:'Teléfono',key:'phone',width:120},
  {title:'Zona',key:'zoneId',width:120},{title:'Lista Precios',key:'priceListId',width:160},
  {title:'Pago',key:'paymentType',width:100},{title:'Límite Crédito',key:'creditLimit',width:130},
  {title:'Estado',key:'active',width:90},{title:'',key:'actions',sortable:false,width:120},
]
const histHeaders=[{title:'Fecha',key:'date',width:120},{title:'Total',key:'total',width:130},{title:'Estado',key:'status',width:100},{title:'Pago',key:'paymentType',width:100}]
const zoneItems=computed(()=>zones.value.map(z=>({title:z.name,value:z.id})))
const plItems=computed(()=>priceLists.value.map(p=>({title:p.name,value:p.id})))
function plName(id){return priceLists.value.find(p=>p.id===id)?.name||'-'}
function zoneName(id){return zones.value.find(z=>z.id===id)?.name||'-'}
function formatDate(d){try{return format(new Date(d),'dd/MM/yyyy')}catch{return'-'}}
const filteredCustomers=computed(()=>{
  let list=customers.value
  if(filterPL.value) list=list.filter(c=>c.priceListId===filterPL.value)
  if(search.value){const s=search.value.toLowerCase();list=list.filter(c=>c.name.toLowerCase().includes(s)||c.nit?.toLowerCase().includes(s))}
  return list
})
async function load(){loading.value=true;customers.value=await db.customers.toArray();zones.value=await db.zones.toArray();priceLists.value=await db.priceLists.toArray();loading.value=false}
function openDialog(item=null){
  editing.value=!!item
  form.value=item?{...item}:{name:'',nit:'',phone:'',email:'',address:'',zoneId:null,priceListId:null,paymentType:'contado',creditDays:30,creditLimit:0}
  dialog.value=true
}
async function save(){
  const{valid}=await formRef.value.validate();if(!valid)return
  saving.value=true
  if(editing.value)await db.customers.update(form.value.id,{...form.value})
  else await db.customers.add({...form.value,active:true})
  await load();dialog.value=false;saving.value=false
  snack.value={show:true,text:'Cliente guardado',color:'success'}
}
async function toggleActive(item){await db.customers.update(item.id,{active:!item.active});await load()}
async function viewHistory(item){
  selectedCustomer.value=item
  customerHistory.value=await db.invoices.where('customerId').equals(item.id).toArray()
  histDialog.value=true
}
onMounted(async()=>{await load();await startTourIfNew('clientes')})
</script>

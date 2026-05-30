<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <div><h2 class="text-h6 font-weight-bold text-primary">Gastos Operativos</h2><p class="text-body-2 text-medium-emphasis">Registro de gastos de la empresa</p></div>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openDialog()">Registrar Gasto</v-btn>
    </div>
    <v-row class="mb-4">
      <v-col cols="6" sm="3" v-for="k in kpis" :key="k.title"><KpiCard :title="k.title" :value="'Q'+k.value.toLocaleString('es-GT',{minimumFractionDigits:2})" :icon="k.icon" icon-color="error" /></v-col>
    </v-row>
    <v-card rounded="xl" elevation="1" class="mb-4">
      <v-card-text class="pa-4">
        <v-row>
          <v-col cols="12" md="4"><v-text-field v-model="search" label="Buscar..." prepend-inner-icon="mdi-magnify" clearable hide-details density="compact" /></v-col>
          <v-col cols="12" md="4"><v-select v-model="filterCat" :items="catItems" label="Categoría" clearable hide-details density="compact" /></v-col>
        </v-row>
      </v-card-text>
    </v-card>
    <v-card rounded="xl" elevation="2">
      <v-data-table :headers="headers" :items="filteredExpenses" :loading="loading" items-per-page="15" hover>
        <template #item.category="{ item }">
          <v-chip size="small" color="error" variant="tonal">{{ item.category }}</v-chip>
        </template>
        <template #item.amount="{ item }">
          <span class="font-weight-bold text-error">Q{{ Number(item.amount||0).toLocaleString('es-GT',{minimumFractionDigits:2}) }}</span>
        </template>
        <template #item.date="{ item }">{{ formatDate(item.date) }}</template>
        <template #item.actions="{ item }">
          <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="deleteExpense(item)" />
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialog" max-width="500" persistent>
      <v-card rounded="xl">
        <v-card-title class="pa-6 pb-2 text-primary"><v-icon class="mr-2">mdi-bank-minus</v-icon>Registrar Gasto</v-card-title>
        <v-card-text class="pa-6">
          <v-form ref="formRef">
            <v-select v-model="form.category" :items="expCats" label="Categoría *" :rules="[r=>!!r||'Requerido']" class="mb-3" />
            <v-text-field v-model="form.description" label="Descripción *" :rules="[r=>!!r||'Requerido']" class="mb-3" />
            <v-text-field v-model.number="form.amount" label="Monto *" type="number" prefix="Q" :rules="[r=>!!r||'Requerido']" class="mb-3" />
            <v-text-field v-model="form.date" label="Fecha" type="date" />
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer /><v-btn variant="text" @click="dialog=false">Cancelar</v-btn>
          <v-btn color="primary" @click="save" :loading="saving">Registrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-snackbar v-model="snack.show" :color="snack.color" timeout="3000" location="bottom right">{{ snack.text }}</v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { format, startOfMonth, subMonths } from 'date-fns'
import db from '@/db/db'
import KpiCard from '@/components/common/KpiCard.vue'
import { useAuthStore } from '@/stores/auth'

const auth=useAuthStore()
const loading=ref(true); const saving=ref(false); const dialog=ref(false)
const search=ref(''); const filterCat=ref(null)
const expenses=ref([]); const formRef=ref(null); const snack=ref({show:false,text:'',color:'success'})
const form=ref({category:'',description:'',amount:0,date:format(new Date(),'yyyy-MM-dd')})
const expCats=['Renta','Transporte','Servicios','Sueldos','Mantenimiento','Marketing','Otros']
const catItems=expCats.map(c=>({title:c,value:c}))
const headers=[
  {title:'Fecha',key:'date',width:120},{title:'Categoría',key:'category',width:150},
  {title:'Descripción',key:'description'},{title:'Monto',key:'amount',width:130},
  {title:'',key:'actions',sortable:false,width:60},
]
const now=new Date(); const mesStart=startOfMonth(now); const prevStart=startOfMonth(subMonths(now,1))
const kpis=computed(()=>[
  {title:'Gasto del Mes',value:expenses.value.filter(e=>new Date(e.date)>=mesStart).reduce((s,e)=>s+(e.amount||0),0),icon:'mdi-calendar-month'},
  {title:'Mes Anterior',value:expenses.value.filter(e=>new Date(e.date)>=prevStart&&new Date(e.date)<mesStart).reduce((s,e)=>s+(e.amount||0),0),icon:'mdi-calendar-arrow-left'},
  {title:'Total Acumulado',value:expenses.value.reduce((s,e)=>s+(e.amount||0),0),icon:'mdi-sigma'},
])
function formatDate(d){try{return format(new Date(d),'dd/MM/yyyy')}catch{return'-'}}
const filteredExpenses=computed(()=>{
  let list=expenses.value
  if(filterCat.value) list=list.filter(e=>e.category===filterCat.value)
  if(search.value){const s=search.value.toLowerCase();list=list.filter(e=>e.description?.toLowerCase().includes(s)||e.category?.toLowerCase().includes(s))}
  return list.sort((a,b)=>new Date(b.date)-new Date(a.date))
})
async function load(){loading.value=true;expenses.value=await db.expenses.toArray();loading.value=false}
function openDialog(){form.value={category:'',description:'',amount:0,date:format(now,'yyyy-MM-dd')};dialog.value=true}
async function save(){
  const{valid}=await formRef.value.validate();if(!valid)return
  saving.value=true
  const expId=await db.expenses.add({...form.value,date:new Date(form.value.date),userId:auth.user.id})
  await db.cashMovements.add({type:'egreso',refType:'gasto',refId:expId,amount:form.value.amount,date:new Date(form.value.date),description:form.value.category})
  await load();dialog.value=false;saving.value=false
  snack.value={show:true,text:'Gasto registrado',color:'success'}
}
async function deleteExpense(item){await db.expenses.delete(item.id);await load()}
onMounted(load)
</script>

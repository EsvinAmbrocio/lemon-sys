<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <div><h2 class="text-h6 font-weight-bold text-primary">Promociones y Descuentos</h2><p class="text-body-2 text-medium-emphasis">Gestión de promociones aplicables a pedidos</p></div>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openDialog()">Nueva Promoción</v-btn>
    </div>
    <v-card rounded="xl" elevation="2">
      <v-data-table :headers="headers" :items="promotions" :loading="loading" items-per-page="15" hover>
        <template #item.type="{ item }">
          <v-chip size="small" :color="item.type==='porcentaje'?'secondary':'primary'" variant="tonal">{{ item.type==='porcentaje'?'%':'Q' }} {{ item.type }}</v-chip>
        </template>
        <template #item.value="{ item }">
          <span class="font-weight-medium">{{ item.type==='porcentaje'?item.value+'%':'Q'+item.value }}</span>
        </template>
        <template #item.active="{ item }">
          <v-switch v-model="item.active" color="success" density="compact" hide-details @change="togglePromo(item)" />
        </template>
        <template #item.actions="{ item }">
          <v-btn icon="mdi-pencil" size="small" variant="text" color="primary" @click="openDialog(item)" />
          <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="deletePromo(item)" />
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialog" max-width="500" persistent>
      <v-card rounded="xl">
        <v-card-title class="pa-6 pb-2 text-primary"><v-icon class="mr-2">mdi-tag-multiple</v-icon>{{ editing?'Editar':'Nueva' }} Promoción</v-card-title>
        <v-card-text class="pa-6">
          <v-form ref="formRef">
            <v-text-field v-model="form.name" label="Nombre de la Promoción *" :rules="[r=>!!r||'Requerido']" class="mb-3" />
            <v-select v-model="form.type" :items="[{title:'Porcentaje (%)',value:'porcentaje'},{title:'Monto fijo ($)',value:'monto'}]" label="Tipo de Descuento" class="mb-3" />
            <v-text-field v-model.number="form.value" :label="form.type==='porcentaje'?'Porcentaje (%)':'Monto (Q)'" type="number" :prefix="form.type==='monto'?'Q':''" :suffix="form.type==='porcentaje'?'%':''" class="mb-3" :rules="[r=>!!r||'Requerido']" />
            <v-textarea v-model="form.description" label="Descripción / Condiciones" rows="2" />
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer /><v-btn variant="text" @click="dialog=false">Cancelar</v-btn>
          <v-btn color="primary" @click="save" :loading="saving">{{ editing?'Guardar':'Crear' }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :color="snack.color" timeout="3000" location="bottom right">{{ snack.text }}</v-snackbar>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import db from '@/db/db'

const loading=ref(true); const saving=ref(false); const dialog=ref(false); const editing=ref(false)
const promotions=ref([]); const formRef=ref(null); const snack=ref({show:false,text:'',color:'success'})
const form=ref({name:'',type:'porcentaje',value:0,description:''})
const headers=[
  {title:'Nombre',key:'name'},{title:'Tipo',key:'type',width:130},{title:'Valor',key:'value',width:110},
  {title:'Descripción',key:'description'},{title:'Activa',key:'active',width:90},{title:'',key:'actions',sortable:false,width:90},
]
async function load(){loading.value=true;promotions.value=await db.promotions.toArray();loading.value=false}
function openDialog(item=null){editing.value=!!item;form.value=item?{...item}:{name:'',type:'porcentaje',value:0,description:''};dialog.value=true}
async function save(){
  const{valid}=await formRef.value.validate();if(!valid)return
  saving.value=true
  if(editing.value)await db.promotions.update(form.value.id,{...form.value})
  else await db.promotions.add({...form.value,active:true})
  await load();dialog.value=false;saving.value=false
  snack.value={show:true,text:'Promoción guardada',color:'success'}
}
async function togglePromo(item){await db.promotions.update(item.id,{active:item.active})}
async function deletePromo(item){await db.promotions.delete(item.id);await load()}
onMounted(load)
</script>

<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <div><h2 class="text-h6 font-weight-bold text-primary">Zonas de Entrega</h2><p class="text-body-2 text-medium-emphasis">Catálogo de zonas para organizar rutas</p></div>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openDialog()">Nueva Zona</v-btn>
    </div>
    <v-card rounded="xl" elevation="2">
      <v-data-table :headers="headers" :items="zones" :loading="loading" items-per-page="15" hover>
        <template #item.active="{ item }">
          <v-chip :color="item.active?'success':'error'" size="x-small" variant="tonal">{{ item.active?'Activa':'Inactiva' }}</v-chip>
        </template>
        <template #item.actions="{ item }">
          <v-btn icon="mdi-pencil" size="small" variant="text" color="primary" @click="openDialog(item)" />
          <v-btn :icon="item.active?'mdi-toggle-switch':'mdi-toggle-switch-off'" size="small" variant="text" :color="item.active?'success':'grey'" @click="toggle(item)" />
        </template>
      </v-data-table>
    </v-card>
    <v-dialog v-model="dialog" max-width="400" persistent>
      <v-card rounded="xl">
        <v-card-title class="pa-6 pb-2 text-primary"><v-icon class="mr-2">mdi-map-outline</v-icon>{{ editing?'Editar':'Nueva' }} Zona</v-card-title>
        <v-card-text class="pa-6">
          <v-form ref="formRef">
            <v-text-field v-model="form.name" label="Nombre de la Zona *" :rules="[r=>!!r||'Requerido']" />
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
const zones=ref([]); const formRef=ref(null); const snack=ref({show:false,text:'',color:'success'})
const form=ref({name:''})
const headers=[{title:'Nombre',key:'name'},{title:'Estado',key:'active',width:100},{title:'',key:'actions',sortable:false,width:100}]
async function load(){loading.value=true;zones.value=await db.zones.toArray();loading.value=false}
function openDialog(item=null){editing.value=!!item;form.value=item?{...item}:{name:''};dialog.value=true}
async function save(){
  const{valid}=await formRef.value.validate();if(!valid)return
  saving.value=true
  if(editing.value)await db.zones.update(form.value.id,{name:form.value.name})
  else await db.zones.add({name:form.value.name,active:true})
  await load();dialog.value=false;saving.value=false
  snack.value={show:true,text:'Zona guardada',color:'success'}
}
async function toggle(item){await db.zones.update(item.id,{active:!item.active});await load()}
onMounted(load)
</script>

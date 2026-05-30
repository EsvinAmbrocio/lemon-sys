<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <div><h2 class="text-h6 font-weight-bold text-primary">Usuarios del Sistema</h2><p class="text-body-2 text-medium-emphasis">Gestión de accesos y roles</p></div>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openDialog()">Nuevo Usuario</v-btn>
    </div>
    <v-card rounded="xl" elevation="2">
      <v-data-table :headers="headers" :items="users" :loading="loading" items-per-page="15" hover>
        <template #item.role="{ item }">
          <v-chip :color="roleColor(item.role)" size="small" variant="tonal">{{ roleLabel(item.role) }}</v-chip>
        </template>
        <template #item.active="{ item }">
          <v-chip :color="item.active?'success':'error'" size="x-small" variant="tonal">{{ item.active?'Activo':'Inactivo' }}</v-chip>
        </template>
        <template #item.actions="{ item }">
          <v-btn icon="mdi-pencil" size="small" variant="text" color="primary" @click="openDialog(item)" />
          <v-btn :icon="item.active?'mdi-toggle-switch':'mdi-toggle-switch-off'" size="small" variant="text" :color="item.active?'success':'grey'" @click="toggleActive(item)" />
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialog" max-width="500" persistent>
      <v-card rounded="xl">
        <v-card-title class="pa-6 pb-2 text-primary"><v-icon class="mr-2">mdi-account-cog</v-icon>{{ editing?'Editar':'Nuevo' }} Usuario</v-card-title>
        <v-card-text class="pa-6">
          <v-form ref="formRef">
            <v-text-field v-model="form.name" label="Nombre completo *" :rules="[r=>!!r||'Requerido']" class="mb-3" />
            <v-text-field v-model="form.email" label="Email *" type="email" :rules="[r=>!!r||'Requerido']" class="mb-3" />
            <v-text-field v-model="form.password" label="Contraseña *" :rules="editing?[]:[r=>!!r||'Requerido']" :placeholder="editing?'Dejar vacío para no cambiar':''" class="mb-3" />
            <v-select v-model="form.role" :items="roleItems" label="Rol *" :rules="[r=>!!r||'Requerido']" class="mb-3" />
            <v-text-field v-model="form.department" label="Departamento" />
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
const users=ref([]); const formRef=ref(null); const snack=ref({show:false,text:'',color:'success'})
const form=ref({name:'',email:'',password:'',role:'ventas',department:''})
const headers=[
  {title:'Nombre',key:'name'},{title:'Email',key:'email'},
  {title:'Rol',key:'role',width:130},{title:'Departamento',key:'department',width:150},
  {title:'Estado',key:'active',width:90},{title:'',key:'actions',sortable:false,width:100},
]
const roleItems=[
  {title:'Administrador',value:'admin'},{title:'Producción',value:'produccion'},
  {title:'Logística',value:'logistica'},{title:'Ventas',value:'ventas'},{title:'Finanzas',value:'finanzas'},
]
function roleColor(r){return{admin:'primary',produccion:'green',logistica:'blue',ventas:'orange',finanzas:'purple'}[r]||'grey'}
function roleLabel(r){return{admin:'Admin',produccion:'Producción',logistica:'Logística',ventas:'Ventas',finanzas:'Finanzas'}[r]||r}
async function load(){loading.value=true;users.value=await db.users.toArray();loading.value=false}
function openDialog(item=null){
  editing.value=!!item
  form.value=item?{...item,password:''}:{name:'',email:'',password:'',role:'ventas',department:''}
  dialog.value=true
}
async function save(){
  const{valid}=await formRef.value.validate();if(!valid)return
  saving.value=true
  if(editing.value){
    const upd={...form.value};if(!upd.password) delete upd.password
    await db.users.update(upd.id,upd)
  } else await db.users.add({...form.value,active:true})
  await load();dialog.value=false;saving.value=false
  snack.value={show:true,text:'Usuario guardado',color:'success'}
}
async function toggleActive(item){await db.users.update(item.id,{active:!item.active});await load()}
onMounted(load)
</script>

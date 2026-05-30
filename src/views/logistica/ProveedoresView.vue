<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h2 class="text-h6 font-weight-bold text-primary">Proveedores</h2>
        <p class="text-body-2 text-medium-emphasis">Gestión de proveedores y condiciones comerciales</p>
      </div>
      <v-btn id="btn-nuevo-proveedor" color="primary" prepend-icon="mdi-plus" @click="openDialog()">Nuevo Proveedor</v-btn>
    </div>

    <v-card rounded="xl" elevation="1" class="mb-4">
      <v-card-text class="pa-4">
        <v-text-field v-model="search" label="Buscar proveedor..." prepend-inner-icon="mdi-magnify" clearable hide-details density="compact" style="max-width:400px" />
      </v-card-text>
    </v-card>

    <v-card rounded="xl" elevation="2" id="tabla-proveedores">
      <v-data-table :headers="headers" :items="suppliers" :search="search" :loading="loading" items-per-page="15" hover>
        <template #item.active="{ item }">
          <v-chip :color="item.active ? 'success':'error'" size="x-small" variant="tonal">{{ item.active ? 'Activo':'Inactivo' }}</v-chip>
        </template>
        <template #item.paymentDays="{ item }">
          {{ item.paymentDays }} días
        </template>
        <template #item.actions="{ item }">
          <v-btn icon="mdi-pencil" size="small" variant="text" color="primary" @click="openDialog(item)" />
          <v-btn :icon="item.active ? 'mdi-toggle-switch':'mdi-toggle-switch-off'" size="small" variant="text" :color="item.active?'success':'grey'" @click="toggleActive(item)" />
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialog" max-width="600" persistent>
      <v-card rounded="xl">
        <v-card-title class="pa-6 pb-2 text-primary"><v-icon class="mr-2">mdi-truck-outline</v-icon>{{ editing ? 'Editar':'Nuevo' }} Proveedor</v-card-title>
        <v-card-text class="pa-6">
          <v-form ref="formRef">
            <v-row>
              <v-col cols="12" md="8"><v-text-field v-model="form.name" label="Razón Social *" :rules="[r=>!!r||'Requerido']" /></v-col>
              <v-col cols="12" md="4"><v-text-field v-model="form.nit" label="NIT" /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model="form.contact" label="Contacto" /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model="form.phone" label="Teléfono" /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model="form.email" label="Email" type="email" /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model.number="form.paymentDays" label="Días de pago" type="number" /></v-col>
              <v-col cols="12"><v-textarea v-model="form.address" label="Dirección" rows="2" /></v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="dialog=false">Cancelar</v-btn>
          <v-btn color="primary" @click="save" :loading="saving">{{ editing ? 'Guardar':'Crear' }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :color="snack.color" timeout="3000" location="bottom right">{{ snack.text }}</v-snackbar>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import db from '@/db/db'
import { useTour } from '@/composables/useTour'

const { startTourIfNew } = useTour()
const loading = ref(true); const saving = ref(false); const dialog = ref(false); const editing = ref(false)
const search = ref(''); const suppliers = ref([]); const formRef = ref(null)
const snack = ref({ show: false, text: '', color: 'success' })
const form = ref({ name:'', nit:'', contact:'', phone:'', email:'', address:'', paymentDays:30 })
const headers = [
  { title:'Razón Social', key:'name' }, { title:'NIT', key:'nit', width:'140' },
  { title:'Contacto', key:'contact' }, { title:'Teléfono', key:'phone', width:'130' },
  { title:'Email', key:'email' }, { title:'Días Pago', key:'paymentDays', width:'110' },
  { title:'Estado', key:'active', width:'90' }, { title:'', key:'actions', sortable:false, width:'100' },
]
async function load() { loading.value=true; suppliers.value=await db.suppliers.toArray(); loading.value=false }
function openDialog(item=null) { editing.value=!!item; form.value=item?{...item}:{name:'',nit:'',contact:'',phone:'',email:'',address:'',paymentDays:30}; dialog.value=true }
async function save() {
  const { valid } = await formRef.value.validate(); if (!valid) return
  saving.value=true
  if (editing.value) await db.suppliers.update(form.value.id,{...form.value})
  else await db.suppliers.add({...form.value,active:true})
  await load(); dialog.value=false; saving.value=false
  snack.value={show:true,text:'Proveedor guardado',color:'success'}
}
async function toggleActive(item) { await db.suppliers.update(item.id,{active:!item.active}); await load() }
onMounted(async () => { await load(); await startTourIfNew('proveedores') })
</script>

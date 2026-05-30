<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <h2 class="text-h6 font-weight-bold text-primary">Catálogos del Sistema</h2>
      <v-btn color="error" variant="tonal" prepend-icon="mdi-database-refresh" size="small" @click="resetDialog=true">Reiniciar Base de Datos</v-btn>
    </div>

    <!-- Dialog reset -->
    <v-dialog v-model="resetDialog" max-width="420">
      <v-card rounded="xl">
        <v-card-title class="pa-6 pb-2 text-error"><v-icon class="mr-2">mdi-alert</v-icon>Reiniciar Base de Datos</v-card-title>
        <v-card-text class="pa-6">
          <p>Esto eliminará <strong>todos los datos</strong> del sistema y recargará los datos de prueba iniciales.</p>
          <p class="text-caption text-medium-emphasis mt-2">Usa esta opción solo en ambiente de demo.</p>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="resetDialog=false">Cancelar</v-btn>
          <v-btn color="error" @click="resetDB" :loading="resetting">Confirmar Reset</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-row>
      <!-- Categorías -->
      <v-col cols="12" md="4">
        <v-card rounded="xl" elevation="2">
          <v-card-title class="pa-5 pb-2 d-flex align-center justify-space-between">
            <span><v-icon color="secondary" class="mr-2">mdi-tag</v-icon>Categorías</span>
            <v-btn size="small" color="primary" variant="tonal" prepend-icon="mdi-plus" @click="openCat()">Agregar</v-btn>
          </v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item v-for="c in cats" :key="c.id" :title="c.name" rounded="lg" class="mb-1">
              <template #append>
                <v-btn icon="mdi-pencil" size="x-small" variant="text" color="primary" @click="openCat(c)" />
                <v-chip :color="c.active?'success':'error'" size="x-small" variant="tonal" class="ml-1">{{ c.active?'✓':'✗' }}</v-chip>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
      <!-- Unidades -->
      <v-col cols="12" md="4">
        <v-card rounded="xl" elevation="2">
          <v-card-title class="pa-5 pb-2 d-flex align-center justify-space-between">
            <span><v-icon color="secondary" class="mr-2">mdi-ruler</v-icon>Unidades de Medida</span>
            <v-btn size="small" color="primary" variant="tonal" prepend-icon="mdi-plus" @click="openUnit()">Agregar</v-btn>
          </v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item v-for="u in units" :key="u.id" :title="u.name" :subtitle="u.abbr" rounded="lg" class="mb-1">
              <template #append>
                <v-btn icon="mdi-pencil" size="x-small" variant="text" color="primary" @click="openUnit(u)" />
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
      <!-- Listas de precio -->
      <v-col cols="12" md="4">
        <v-card rounded="xl" elevation="2">
          <v-card-title class="pa-5 pb-2 d-flex align-center justify-space-between">
            <span><v-icon color="secondary" class="mr-2">mdi-currency-usd</v-icon>Listas de Precio</span>
          </v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item v-for="p in priceLists" :key="p.id" :title="p.name" :subtitle="'Multiplicador: ×' + p.multiplier" rounded="lg" class="mb-1">
              <template #append>
                <v-chip :color="p.active?'success':'grey'" size="x-small" variant="tonal">{{ p.active?'Activa':'Inactiva' }}</v-chip>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog Categoría -->
    <v-dialog v-model="catDialog" max-width="380" persistent>
      <v-card rounded="xl">
        <v-card-title class="pa-5 pb-2 text-primary">{{ editingCat?'Editar':'Nueva' }} Categoría</v-card-title>
        <v-card-text class="pa-5">
          <v-text-field v-model="catForm.name" label="Nombre *" :rules="[r=>!!r||'Requerido']" ref="catRef" />
        </v-card-text>
        <v-card-actions class="pa-4"><v-spacer /><v-btn variant="text" @click="catDialog=false">Cancelar</v-btn><v-btn color="primary" @click="saveCat" :loading="saving">Guardar</v-btn></v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Unidad -->
    <v-dialog v-model="unitDialog" max-width="380" persistent>
      <v-card rounded="xl">
        <v-card-title class="pa-5 pb-2 text-primary">{{ editingUnit?'Editar':'Nueva' }} Unidad</v-card-title>
        <v-card-text class="pa-5">
          <v-text-field v-model="unitForm.name" label="Nombre *" class="mb-3" />
          <v-text-field v-model="unitForm.abbr" label="Abreviatura *" />
        </v-card-text>
        <v-card-actions class="pa-4"><v-spacer /><v-btn variant="text" @click="unitDialog=false">Cancelar</v-btn><v-btn color="primary" @click="saveUnit" :loading="saving">Guardar</v-btn></v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :color="snack.color" timeout="3000" location="bottom right">{{ snack.text }}</v-snackbar>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import db from '@/db/db'
import { seedDatabase } from '@/db/seed'

const loading=ref(false); const saving=ref(false)
const cats=ref([]); const units=ref([]); const priceLists=ref([])
const catDialog=ref(false); const unitDialog=ref(false)
const editingCat=ref(false); const editingUnit=ref(false)
const catForm=ref({name:''}); const unitForm=ref({name:'',abbr:''})
const snack=ref({show:false,text:'',color:'success'})
const resetDialog=ref(false); const resetting=ref(false)

async function resetDB() {
  resetting.value = true
  await db.delete()
  await db.open()
  await seedDatabase()
  resetting.value = false
  resetDialog.value = false
  window.location.reload()
}

async function load(){
  cats.value=await db.categories.toArray()
  units.value=await db.units.toArray()
  priceLists.value=await db.priceLists.toArray()
}
function openCat(item=null){editingCat.value=!!item;catForm.value=item?{...item}:{name:''};catDialog.value=true}
async function saveCat(){
  saving.value=true
  if(editingCat.value)await db.categories.update(catForm.value.id,{name:catForm.value.name})
  else await db.categories.add({name:catForm.value.name,active:true})
  await load();catDialog.value=false;saving.value=false
  snack.value={show:true,text:'Categoría guardada',color:'success'}
}
function openUnit(item=null){editingUnit.value=!!item;unitForm.value=item?{...item}:{name:'',abbr:''};unitDialog.value=true}
async function saveUnit(){
  saving.value=true
  if(editingUnit.value)await db.units.update(unitForm.value.id,{...unitForm.value})
  else await db.units.add({...unitForm.value})
  await load();unitDialog.value=false;saving.value=false
  snack.value={show:true,text:'Unidad guardada',color:'success'}
}
onMounted(load)
</script>

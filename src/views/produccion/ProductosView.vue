<template>
  <div>
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h2 class="text-h6 font-weight-bold text-primary">Catálogo de Productos</h2>
        <p class="text-body-2 text-medium-emphasis">Gestión de productos, presentaciones y precios</p>
      </div>
      <v-btn id="btn-nuevo-producto" color="primary" prepend-icon="mdi-plus" @click="openDialog()">Nuevo Producto</v-btn>
    </div>

    <!-- Filtros -->
    <v-card rounded="xl" elevation="1" class="mb-4" id="tabla-productos">
      <v-card-text class="pa-4">
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field v-model="search" label="Buscar producto..." prepend-inner-icon="mdi-magnify" clearable hide-details density="compact" />
          </v-col>
          <v-col cols="6" md="2">
            <v-btn-toggle v-model="filterType" mandatory density="compact" color="primary" rounded="lg" style="height:40px">
              <v-btn value="" size="small">Todos</v-btn>
              <v-btn value="venta" size="small">Venta</v-btn>
              <v-btn value="compra" size="small">Compra</v-btn>
            </v-btn-toggle>
          </v-col>
          <v-col cols="12" md="3">
            <v-select v-model="filterCat" :items="catItemsFiltered" label="Categoría" clearable hide-details density="compact" />
          </v-col>
          <v-col cols="12" md="3">
            <v-select v-model="filterActive" :items="[{title:'Todos',value:null},{title:'Activos',value:true},{title:'Inactivos',value:false}]" label="Estado" hide-details density="compact" />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card rounded="xl" elevation="2">
      <v-data-table
        :headers="headers"
        :items="filteredProducts"
        :search="search"
        :loading="loading"
        items-per-page="15"
        hover
      >
        <template #item.categoryId="{ item }">
          <v-chip size="small" color="secondary" variant="tonal">{{ catName(item.categoryId) }}</v-chip>
        </template>
        <template #item.type="{ item }">
          <v-chip size="small" :color="item.type==='venta'?'primary':'warning'" variant="tonal">
            <v-icon start size="14">{{ item.type==='venta'?'mdi-cart-outline':'mdi-cart-arrow-down' }}</v-icon>
            {{ item.type==='venta'?'Venta':'Compra' }}
          </v-chip>
        </template>
        <template #item.baseSellPrice="{ item }">
          <span v-if="item.type==='venta'" class="font-weight-medium">Q{{ item.baseSellPrice?.toFixed(2) }}</span>
          <span v-else class="text-medium-emphasis text-caption">—</span>
        </template>
        <template #item.buyPrice="{ item }">
          Q{{ item.buyPrice?.toFixed(2) }}
        </template>
        <template #item.active="{ item }">
          <v-chip :color="item.active ? 'success' : 'error'" size="x-small" variant="tonal">{{ item.active ? 'Activo' : 'Inactivo' }}</v-chip>
        </template>
        <template #item.actions="{ item }">
          <v-btn icon="mdi-pencil" size="small" variant="text" color="primary" @click="openDialog(item)" />
          <v-btn v-if="item.type==='venta'" icon="mdi-layers-outline" size="small" variant="text" color="secondary" @click="openPresentations(item)" title="Presentaciones" />
          <v-btn :icon="item.active ? 'mdi-toggle-switch' : 'mdi-toggle-switch-off'" size="small" variant="text" :color="item.active ? 'success' : 'grey'" @click="toggleActive(item)" />
        </template>
      </v-data-table>
    </v-card>

    <!-- Dialog Producto -->
    <v-dialog v-model="dialog" max-width="600" persistent>
      <v-card rounded="xl">
        <v-card-title class="pa-6 pb-2 text-primary d-flex align-center">
          <v-icon class="mr-2">mdi-package-variant</v-icon>
          {{ editing ? 'Editar Producto' : 'Nuevo Producto' }}
        </v-card-title>
        <v-card-text class="pa-6">
          <v-form ref="formRef" @submit.prevent="save">
            <v-row>
              <v-col cols="12" md="4">
                <v-text-field v-model="form.code" label="Código *" :rules="[r => !!r || 'Requerido']" />
              </v-col>
              <v-col cols="12" md="8">
                <v-text-field v-model="form.name" label="Nombre del Producto *" :rules="[r => !!r || 'Requerido']" />
              </v-col>
              <v-col cols="12" md="6">
                <v-select v-model="form.categoryId" :items="catItems" label="Categoría *" :rules="[r => !!r || 'Requerido']" />
              </v-col>
              <v-col cols="12" md="6">
                <v-select v-model="form.type" :items="[{title:'Producto de Venta (terminado)',value:'venta'},{title:'Producto de Compra (insumo)',value:'compra'}]" label="Tipo *" :rules="[r => !!r || 'Requerido']" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model.number="form.buyPrice" label="Precio Compra / Costo" type="number" prefix="Q" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model.number="form.baseSellPrice" label="Precio Base Venta" type="number" prefix="Q" :disabled="form.type==='compra'" :hint="form.type==='compra'?'No aplica para insumos':''" />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model.number="form.minStock" label="Stock Mínimo" type="number" hint="Alerta si stock baja de este valor" />
              </v-col>
              <v-col cols="12" md="8">
                <v-textarea v-model="form.description" label="Descripción general" rows="2" />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="dialog=false">Cancelar</v-btn>
          <v-btn color="primary" @click="save" :loading="saving">{{ editing ? 'Guardar' : 'Crear' }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Presentaciones -->
    <v-dialog v-model="presDialog" max-width="700">
      <v-card rounded="xl">
        <v-card-title class="pa-6 pb-2 text-primary d-flex align-center justify-space-between">
          <span><v-icon class="mr-2">mdi-layers-outline</v-icon>Presentaciones — {{ selectedProduct?.name }}</span>
          <v-btn size="small" color="primary" prepend-icon="mdi-plus" @click="addPresRow">Agregar</v-btn>
        </v-card-title>
        <v-card-text class="pa-4">
          <v-table density="compact">
            <thead><tr><th>Descripción</th><th>Unidad</th><th>Pzas/Caja</th><th></th></tr></thead>
            <tbody>
              <tr v-for="(p, i) in presRows" :key="i">
                <td><v-text-field v-model="p.description" density="compact" hide-details variant="underlined" placeholder="ej. Botella 500ml" /></td>
                <td><v-select v-model="p.unit" :items="unitItems" density="compact" hide-details variant="underlined" style="min-width:80px" /></td>
                <td><v-text-field v-model.number="p.unitsPerBox" type="number" density="compact" hide-details variant="underlined" style="width:70px" /></td>
                <td><v-btn icon="mdi-delete" size="x-small" variant="text" color="error" @click="presRows.splice(i,1)" /></td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="presDialog=false">Cerrar</v-btn>
          <v-btn color="primary" @click="savePresentations" :loading="saving">Guardar Presentaciones</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :color="snack.color" timeout="3000" location="bottom right">{{ snack.text }}</v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import db from '@/db/db'
import { useTour } from '@/composables/useTour'

const { startTourIfNew } = useTour()
const loading = ref(true)
const saving = ref(false)
const dialog = ref(false)
const presDialog = ref(false)
const editing = ref(false)
const search = ref('')
const filterType = ref('')
const filterCat = ref(null)
const filterActive = ref(true)
const products = ref([])
const categories = ref([])
const units = ref([])
const presRows = ref([])
const selectedProduct = ref(null)
const formRef = ref(null)
const snack = ref({ show: false, text: '', color: 'success' })

const form = ref({ code:'', name:'', type:'venta', categoryId:null, buyPrice:0, baseSellPrice:0, minStock:50, description:'' })

const headers = [
  { title: 'Código',     key: 'code',          width: '110' },
  { title: 'Nombre',     key: 'name' },
  { title: 'Tipo',       key: 'type',           width: '110' },
  { title: 'Categoría',  key: 'categoryId' },
  { title: 'Costo',      key: 'buyPrice',       width: '110' },
  { title: 'Precio Venta', key: 'baseSellPrice', width: '120' },
  { title: 'Estado',     key: 'active',         width: '90' },
  { title: '',           key: 'actions',        sortable: false, width: '120' },
]

const catItems = computed(() => categories.value.map(c => ({ title: c.name, value: c.id })))
const catItemsFiltered = computed(() => {
  if (!filterType.value) return catItems.value
  // categorías 1-7 son de venta, 8-11 son de compra
  return categories.value
    .filter(c => filterType.value === 'venta' ? c.id <= 7 : c.id > 7)
    .map(c => ({ title: c.name, value: c.id }))
})
const unitItems = computed(() => units.value.map(u => ({ title: u.abbr, value: u.abbr })))
const catName = (id) => categories.value.find(c => c.id === id)?.name || '-'

const filteredProducts = computed(() => {
  let list = products.value
  if (filterType.value) list = list.filter(p => p.type === filterType.value)
  if (filterCat.value) list = list.filter(p => p.categoryId === filterCat.value)
  if (filterActive.value !== null) list = list.filter(p => p.active === filterActive.value)
  return list
})

async function load() {
  loading.value = true
  products.value = await db.products.toArray()
  categories.value = await db.categories.toArray()
  units.value = await db.units.toArray()
  loading.value = false
}

function openDialog(item = null) {
  editing.value = !!item
  form.value = item ? { ...item } : { code:'', name:'', type:'venta', categoryId:null, buyPrice:0, baseSellPrice:0, minStock:50, description:'' }
  dialog.value = true
}

async function save() {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  saving.value = true
  if (editing.value) await db.products.update(form.value.id, { ...form.value })
  else await db.products.add({ ...form.value, active: true })
  await load()
  dialog.value = false
  saving.value = false
  snack.value = { show: true, text: editing.value ? 'Producto actualizado' : 'Producto creado', color: 'success' }
}

async function toggleActive(item) {
  await db.products.update(item.id, { active: !item.active })
  await load()
}

async function openPresentations(item) {
  selectedProduct.value = item
  presRows.value = await db.presentations.where('productId').equals(item.id).toArray()
  presDialog.value = true
}

function addPresRow() {
  presRows.value.push({ productId: selectedProduct.value.id, description: '', unit: 'ml', unitId: 1, unitsPerBox: 24 })
}

async function savePresentations() {
  saving.value = true
  await db.presentations.where('productId').equals(selectedProduct.value.id).delete()
  for (const p of presRows.value) {
    if (p.description) await db.presentations.add({ ...p, productId: selectedProduct.value.id })
  }
  saving.value = false
  presDialog.value = false
  snack.value = { show: true, text: 'Presentaciones guardadas', color: 'success' }
}

onMounted(async () => {
  await load()
  await startTourIfNew('productos')
})
</script>

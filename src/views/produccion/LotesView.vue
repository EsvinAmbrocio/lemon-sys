<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h2 class="text-h6 font-weight-bold text-primary">Gestión de Lotes</h2>
        <p class="text-body-2 text-medium-emphasis">Control de lotes, fechas de vencimiento y disponibilidad</p>
      </div>
      <v-btn id="btn-nuevo-lote" color="primary" prepend-icon="mdi-plus" @click="openDialog()">Nuevo Lote</v-btn>
    </div>

    <!-- Stats chips -->
    <v-row class="mb-4">
      <v-col cols="auto" v-for="s in stats" :key="s.label">
        <v-chip :color="s.color" size="large" variant="tonal" prepend-icon="mdi-circle-small" class="font-weight-medium">
          {{ s.label }}: {{ s.count }}
        </v-chip>
      </v-col>
    </v-row>

    <!-- Filtros -->
    <v-card rounded="xl" elevation="1" class="mb-4" id="filter-lotes">
      <v-card-text class="pa-4">
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field v-model="search" label="Buscar lote o producto..." prepend-inner-icon="mdi-magnify" clearable hide-details density="compact" />
          </v-col>
          <v-col cols="12" md="4">
            <v-btn-toggle v-model="filterStatus" mandatory density="compact" color="primary" rounded="lg">
              <v-btn value="all" size="small">Todos</v-btn>
              <v-btn value="ok" size="small">Vigentes</v-btn>
              <v-btn value="soon" size="small" color="warning">Por Vencer</v-btn>
              <v-btn value="expired" size="small" color="error">Vencidos</v-btn>
            </v-btn-toggle>
          </v-col>
          <v-col cols="12" md="4">
            <v-select v-model="filterProduct" :items="productItems" label="Producto" clearable hide-details density="compact" />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card rounded="xl" elevation="2" id="tabla-lotes">
      <v-data-table :headers="headers" :items="filteredBatches" :loading="loading" items-per-page="15" hover>
        <template #item.productId="{ item }">
          <div>
            <div class="font-weight-medium">{{ productName(item.productId) }}</div>
            <div class="text-caption text-medium-emphasis">{{ presentationName(item.presentationId) }}</div>
          </div>
        </template>
        <template #item.expiryDate="{ item }">
          <v-chip :color="expiryColor(item.expiryDate)" size="small" variant="tonal">
            <v-icon start size="14">mdi-calendar</v-icon>
            {{ formatDate(item.expiryDate) }}
          </v-chip>
        </template>
        <template #item.available="{ item }">
          <span :class="item.available === 0 ? 'text-error' : 'text-success'" class="font-weight-bold">{{ item.available }}</span>
          <span class="text-caption text-medium-emphasis"> / {{ item.quantity }}</span>
        </template>
        <template #item.status="{ item }">
          <v-chip :color="batchStatusColor(item)" size="x-small" variant="tonal">
            <v-icon start size="12">{{ batchStatusIcon(item) }}</v-icon>
            {{ batchStatusLabel(item) }}
          </v-chip>
        </template>
        <template #item.actions="{ item }">
          <v-btn icon="mdi-pencil" size="small" variant="text" color="primary" @click="openDialog(item)" :disabled="isExpired(item.expiryDate)" />
          <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="deleteBatch(item)" />
        </template>
      </v-data-table>
    </v-card>

    <!-- Dialog -->
    <v-dialog v-model="dialog" max-width="600" persistent>
      <v-card rounded="xl">
        <v-card-title class="pa-6 pb-2 text-primary">
          <v-icon class="mr-2">mdi-layers-outline</v-icon>
          {{ editing ? 'Editar Lote' : 'Registrar Nuevo Lote' }}
        </v-card-title>
        <v-card-text class="pa-6">
          <v-form ref="formRef" @submit.prevent="save">
            <v-row>
              <v-col cols="12" md="6">
                <v-select v-model="form.productId" :items="productItems" label="Producto *" :rules="[r => !!r || 'Requerido']" @update:model-value="loadPresentations" />
              </v-col>
              <v-col cols="12" md="6">
                <v-select v-model="form.presentationId" :items="presItems" label="Presentación *" :rules="[r => !!r || 'Requerido']" :disabled="!form.productId" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="form.lotNumber" label="Número de Lote *" :rules="[r => !!r || 'Requerido']" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model.number="form.quantity" label="Cantidad inicial *" type="number" :rules="[r => !!r || 'Requerido']" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="form.entryDate" label="Fecha de Ingreso *" type="date" :rules="[r => !!r || 'Requerido']" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="form.expiryDate" label="Fecha de Vencimiento *" type="date" :rules="[r => !!r || 'Requerido']" />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="dialog=false">Cancelar</v-btn>
          <v-btn color="primary" @click="save" :loading="saving">{{ editing ? 'Guardar' : 'Registrar' }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :color="snack.color" timeout="3000" location="bottom right">{{ snack.text }}</v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { format, addDays, isPast, isAfter } from 'date-fns'
import db from '@/db/db'
import { useTour } from '@/composables/useTour'

const { startTourIfNew } = useTour()
const loading = ref(true)
const saving = ref(false)
const dialog = ref(false)
const editing = ref(false)
const search = ref('')
const filterStatus = ref('all')
const filterProduct = ref(null)
const batches = ref([])
const products = ref([])
const presentations = ref([])
const presItems = ref([])
const formRef = ref(null)
const snack = ref({ show: false, text: '', color: 'success' })
const form = ref({ productId: null, presentationId: null, lotNumber: '', quantity: 0, entryDate: '', expiryDate: '' })

const headers = [
  { title: 'Producto / Presentación', key: 'productId' },
  { title: 'N° Lote', key: 'lotNumber' },
  { title: 'Vencimiento', key: 'expiryDate', width: '160' },
  { title: 'Disponible / Total', key: 'available', width: '150' },
  { title: 'Estado', key: 'status', width: '130' },
  { title: '', key: 'actions', sortable: false, width: '100' },
]

const productItems = computed(() => products.value.map(p => ({ title: p.name, value: p.id })))

const now = new Date()
const in30 = addDays(now, 30)

function isExpired(d) { return new Date(d) < now }
function isSoon(d) { const dd = new Date(d); return dd >= now && dd <= in30 }
function expiryColor(d) { return isExpired(d) ? 'error' : isSoon(d) ? 'warning' : 'success' }
function batchStatusLabel(b) { return isExpired(b.expiryDate) ? 'Vencido 🔒' : isSoon(b.expiryDate) ? 'Por Vencer' : 'Vigente' }
function batchStatusColor(b) { return isExpired(b.expiryDate) ? 'error' : isSoon(b.expiryDate) ? 'warning' : 'success' }
function batchStatusIcon(b) { return isExpired(b.expiryDate) ? 'mdi-lock' : isSoon(b.expiryDate) ? 'mdi-clock-alert' : 'mdi-check-circle' }
function formatDate(d) { try { return format(new Date(d), 'dd/MM/yyyy') } catch { return '-' } }
function productName(id) { return products.value.find(p => p.id === id)?.name || '-' }
function presentationName(id) { return presentations.value.find(p => p.id === id)?.description || '-' }

const stats = computed(() => [
  { label: 'Vigentes',      color: 'success', count: batches.value.filter(b => !isExpired(b.expiryDate) && !isSoon(b.expiryDate)).length },
  { label: 'Por Vencer',    color: 'warning', count: batches.value.filter(b => isSoon(b.expiryDate)).length },
  { label: 'Vencidos',      color: 'error',   count: batches.value.filter(b => isExpired(b.expiryDate)).length },
  { label: 'Total en Stock',color: 'primary', count: batches.value.filter(b => !isExpired(b.expiryDate)).reduce((s,b) => s + (b.available||0), 0) },
])

const filteredBatches = computed(() => {
  let list = batches.value
  if (filterStatus.value === 'ok')      list = list.filter(b => !isExpired(b.expiryDate) && !isSoon(b.expiryDate))
  if (filterStatus.value === 'soon')    list = list.filter(b => isSoon(b.expiryDate))
  if (filterStatus.value === 'expired') list = list.filter(b => isExpired(b.expiryDate))
  if (filterProduct.value) list = list.filter(b => b.productId === filterProduct.value)
  if (search.value) {
    const s = search.value.toLowerCase()
    list = list.filter(b => b.lotNumber?.toLowerCase().includes(s) || productName(b.productId).toLowerCase().includes(s))
  }
  return list
})

async function load() {
  loading.value = true
  batches.value = await db.batches.toArray()
  products.value = await db.products.toArray()
  presentations.value = await db.presentations.toArray()
  loading.value = false
}

async function loadPresentations(productId) {
  form.value.presentationId = null
  presItems.value = (await db.presentations.where('productId').equals(productId).toArray()).map(p => ({ title: p.description, value: p.id }))
}

function openDialog(item = null) {
  editing.value = !!item
  if (item) {
    form.value = { ...item, entryDate: item.entryDate ? format(new Date(item.entryDate), 'yyyy-MM-dd') : '', expiryDate: item.expiryDate ? format(new Date(item.expiryDate), 'yyyy-MM-dd') : '' }
    loadPresentations(item.productId)
  } else {
    form.value = { productId: null, presentationId: null, lotNumber: '', quantity: 0, entryDate: format(now, 'yyyy-MM-dd'), expiryDate: '' }
    presItems.value = []
  }
  dialog.value = true
}

async function save() {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  saving.value = true
  const data = { ...form.value, entryDate: new Date(form.value.entryDate), expiryDate: new Date(form.value.expiryDate), available: editing.value ? form.value.available : form.value.quantity }
  if (editing.value) await db.batches.update(data.id, data)
  else await db.batches.add(data)
  await load()
  dialog.value = false
  saving.value = false
  snack.value = { show: true, text: 'Lote guardado', color: 'success' }
}

async function deleteBatch(item) {
  await db.batches.delete(item.id)
  await load()
  snack.value = { show: true, text: 'Lote eliminado', color: 'warning' }
}

onMounted(async () => {
  await load()
  await startTourIfNew('lotes')
})
</script>

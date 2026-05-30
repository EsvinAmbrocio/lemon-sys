<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h2 class="text-h6 font-weight-bold text-primary">Movimientos de Stock</h2>
        <p class="text-body-2 text-medium-emphasis">Historial de entradas, salidas y ajustes de inventario</p>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="dialog=true">Registrar Movimiento</v-btn>
    </div>

    <v-card rounded="xl" elevation="1" class="mb-4">
      <v-card-text class="pa-4">
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field v-model="search" label="Buscar..." prepend-inner-icon="mdi-magnify" clearable hide-details density="compact" />
          </v-col>
          <v-col cols="12" md="4">
            <v-select v-model="filterType" :items="[{title:'Todos',value:null},{title:'Entradas',value:'entrada'},{title:'Salidas',value:'salida'},{title:'Ajustes',value:'ajuste'}]" label="Tipo" clearable hide-details density="compact" />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card rounded="xl" elevation="2">
      <v-data-table :headers="headers" :items="filteredMovements" :loading="loading" items-per-page="20" hover>
        <template #item.type="{ item }">
          <v-chip :color="typeColor(item.type)" size="small" variant="tonal">
            <v-icon start size="14">{{ typeIcon(item.type) }}</v-icon>
            {{ typeLabel(item.type) }}
          </v-chip>
        </template>
        <template #item.quantity="{ item }">
          <span :class="item.type === 'entrada' ? 'text-success' : 'text-error'" class="font-weight-bold">
            {{ item.type === 'entrada' ? '+' : '-' }}{{ item.quantity }}
          </span>
        </template>
        <template #item.date="{ item }">
          {{ formatDate(item.date) }}
        </template>
      </v-data-table>
    </v-card>

    <!-- Dialog -->
    <v-dialog v-model="dialog" max-width="500" persistent>
      <v-card rounded="xl">
        <v-card-title class="pa-6 pb-2 text-primary">Registrar Movimiento Manual</v-card-title>
        <v-card-text class="pa-6">
          <v-form ref="formRef">
            <v-select v-model="form.type" :items="[{title:'Entrada',value:'entrada'},{title:'Salida',value:'salida'},{title:'Ajuste',value:'ajuste'}]" label="Tipo *" class="mb-3" :rules="[r=>!!r||'Requerido']" />
            <v-select v-model="form.productId" :items="productItems" label="Producto *" class="mb-3" :rules="[r=>!!r||'Requerido']" @update:model-value="loadBatches" />
            <v-select v-model="form.batchId" :items="batchItems" label="Lote *" class="mb-3" :rules="[r=>!!r||'Requerido']" :disabled="!form.productId" />
            <v-text-field v-model.number="form.quantity" label="Cantidad *" type="number" class="mb-3" :rules="[r=>!!r||'Requerido']" />
            <v-text-field v-model="form.reason" label="Motivo / Referencia *" :rules="[r=>!!r||'Requerido']" />
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="dialog=false">Cancelar</v-btn>
          <v-btn color="primary" @click="save" :loading="saving">Registrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :color="snack.color" timeout="3000" location="bottom right">{{ snack.text }}</v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { format } from 'date-fns'
import db from '@/db/db'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const loading = ref(true)
const saving = ref(false)
const dialog = ref(false)
const search = ref('')
const filterType = ref(null)
const movements = ref([])
const products = ref([])
const batches = ref([])
const batchItems = ref([])
const formRef = ref(null)
const snack = ref({ show: false, text: '', color: 'success' })
const form = ref({ type: null, productId: null, batchId: null, quantity: 0, reason: '' })

const headers = [
  { title: 'Fecha',     key: 'date',     width: '160' },
  { title: 'Tipo',      key: 'type',     width: '120' },
  { title: 'Producto',  key: 'productName' },
  { title: 'Lote',      key: 'lotNumber', width: '140' },
  { title: 'Cantidad',  key: 'quantity',  width: '110' },
  { title: 'Motivo',    key: 'reason' },
]

const productItems = computed(() => products.value.map(p => ({ title: p.name, value: p.id })))

function typeColor(t) { return { entrada:'success', salida:'error', ajuste:'warning' }[t] || 'grey' }
function typeIcon(t)  { return { entrada:'mdi-arrow-down-circle', salida:'mdi-arrow-up-circle', ajuste:'mdi-tune' }[t] || 'mdi-circle' }
function typeLabel(t) { return { entrada:'Entrada', salida:'Salida', ajuste:'Ajuste' }[t] || t }
function formatDate(d) { try { return format(new Date(d), 'dd/MM/yyyy HH:mm') } catch { return '-' } }

const filteredMovements = computed(() => {
  let list = movements.value
  if (filterType.value) list = list.filter(m => m.type === filterType.value)
  if (search.value) { const s = search.value.toLowerCase(); list = list.filter(m => m.productName?.toLowerCase().includes(s) || m.reason?.toLowerCase().includes(s)) }
  return list.sort((a, b) => new Date(b.date) - new Date(a.date))
})

async function load() {
  loading.value = true
  movements.value = await db.stockMovements.toArray()
  products.value = await db.products.toArray()
  batches.value = await db.batches.toArray()
  // Enrich
  movements.value = movements.value.map(m => ({
    ...m,
    productName: products.value.find(p => p.id === m.productId)?.name || '-',
    lotNumber: batches.value.find(b => b.id === m.batchId)?.lotNumber || '-',
  }))
  loading.value = false
}

async function loadBatches(productId) {
  form.value.batchId = null
  const now = new Date()
  batchItems.value = batches.value
    .filter(b => b.productId === productId && new Date(b.expiryDate) >= now)
    .map(b => ({ title: `${b.lotNumber} (disp: ${b.available})`, value: b.id }))
}

async function save() {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  saving.value = true
  const batch = batches.value.find(b => b.id === form.value.batchId)
  const delta = form.value.type === 'entrada' ? form.value.quantity : -form.value.quantity
  if (batch) await db.batches.update(batch.id, { available: Math.max(0, (batch.available || 0) + delta) })
  await db.stockMovements.add({ ...form.value, date: new Date(), userId: auth.user.id, reference: form.value.reason })
  await load()
  dialog.value = false
  saving.value = false
  snack.value = { show: true, text: 'Movimiento registrado', color: 'success' }
}

onMounted(load)
</script>

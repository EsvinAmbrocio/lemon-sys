<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h2 class="text-h6 font-weight-bold text-primary">Inventario Actual</h2>
        <p class="text-body-2 text-medium-emphasis">Stock disponible por producto y presentación (FIFO — lotes vigentes)</p>
      </div>
      <v-btn color="secondary" prepend-icon="mdi-refresh" variant="tonal" @click="load" :loading="loading">Actualizar</v-btn>
    </div>

    <v-card rounded="xl" elevation="1" class="mb-4">
      <v-card-text class="pa-4">
        <v-row>
          <v-col cols="12" md="5">
            <v-text-field v-model="search" label="Buscar producto..." prepend-inner-icon="mdi-magnify" clearable hide-details density="compact" />
          </v-col>
          <v-col cols="12" md="4">
            <v-select v-model="filterCat" :items="catItems" label="Categoría" clearable hide-details density="compact" />
          </v-col>
          <v-col cols="12" md="3">
            <v-select v-model="filterAlert" :items="[{title:'Todos',value:'all'},{title:'Stock Bajo',value:'low'},{title:'Sin Stock',value:'zero'}]" hide-details density="compact" />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card rounded="xl" elevation="2" id="tabla-inventario">
      <v-data-table :headers="headers" :items="filteredInventory" :loading="loading" items-per-page="15" hover>
        <template #item.category="{ item }">
          <v-chip size="x-small" color="secondary" variant="tonal">{{ item.category }}</v-chip>
        </template>
        <template #item.stock="{ item }">
          <div class="d-flex align-center">
            <span :class="stockClass(item)" class="font-weight-bold text-h6 mr-2">{{ item.stock }}</span>
            <v-chip :color="stockColor(item)" size="x-small" variant="tonal">{{ stockLabel(item) }}</v-chip>
          </div>
        </template>
        <template #item.minStock="{ item }">
          <span class="text-medium-emphasis">{{ item.minStock || 50 }}</span>
        </template>
        <template #item.activeBatches="{ item }">
          <v-chip size="x-small" color="primary" variant="tonal">{{ item.activeBatches }} lote(s)</v-chip>
        </template>
        <template #item.nextExpiry="{ item }">
          <span v-if="item.nextExpiry" :class="item.soonExpiry ? 'text-warning font-weight-medium' : 'text-medium-emphasis'">
            <v-icon v-if="item.soonExpiry" size="14" color="warning">mdi-clock-alert</v-icon>
            {{ item.nextExpiry }}
          </span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { format, addDays } from 'date-fns'
import db from '@/db/db'
import { useTour } from '@/composables/useTour'

const { startTourIfNew } = useTour()
const loading = ref(true)
const search = ref('')
const filterCat = ref(null)
const filterAlert = ref('all')
const inventory = ref([])
const categories = ref([])

const headers = [
  { title: 'Código',        key: 'code',         width: '110' },
  { title: 'Producto',      key: 'name' },
  { title: 'Presentación',  key: 'presentation' },
  { title: 'Categoría',     key: 'category' },
  { title: 'Stock Disp.',   key: 'stock',        width: '160' },
  { title: 'Mínimo',        key: 'minStock',     width: '90'  },
  { title: 'Lotes Activos', key: 'activeBatches',width: '120' },
  { title: 'Próx. Venc.',   key: 'nextExpiry',   width: '130' },
]

const catItems = computed(() => categories.value.map(c => ({ title: c.name, value: c.id })))
const now = new Date()
const in30 = addDays(now, 30)

function stockClass(item) { return item.stock === 0 ? 'text-error' : item.stock < (item.minStock || 50) ? 'text-warning' : 'text-success' }
function stockColor(item) { return item.stock === 0 ? 'error' : item.stock < (item.minStock || 50) ? 'warning' : 'success' }
function stockLabel(item) { return item.stock === 0 ? 'Sin Stock' : item.stock < (item.minStock || 50) ? 'Bajo Mínimo' : 'OK' }

const filteredInventory = computed(() => {
  let list = inventory.value
  if (filterCat.value) list = list.filter(i => i.categoryId === filterCat.value)
  if (filterAlert.value === 'low') list = list.filter(i => i.stock > 0 && i.stock < (i.minStock || 50))
  if (filterAlert.value === 'zero') list = list.filter(i => i.stock === 0)
  if (search.value) { const s = search.value.toLowerCase(); list = list.filter(i => i.name.toLowerCase().includes(s) || i.code.toLowerCase().includes(s)) }
  return list
})

async function load() {
  loading.value = true
  categories.value = await db.categories.toArray()
  const products = await db.products.where('active').equals(1).toArray()
  const presentations = await db.presentations.toArray()
  const batches = await db.batches.toArray()
  const result = []
  for (const p of products) {
    const cat = categories.value.find(c => c.id === p.categoryId)
    const pres = presentations.filter(pr => pr.productId === p.id)
    for (const pr of pres) {
      const activeBatchList = batches.filter(b => b.presentationId === pr.id && new Date(b.expiryDate) >= now)
      const stock = activeBatchList.reduce((s, b) => s + (b.available || 0), 0)
      const sorted = [...activeBatchList].sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
      const nextExp = sorted[0]?.expiryDate
      result.push({
        id: `${p.id}-${pr.id}`,
        productId: p.id, code: p.code, name: p.name,
        presentation: pr.description, categoryId: p.categoryId,
        category: cat?.name || '-', stock, minStock: p.minStock || 50,
        activeBatches: activeBatchList.length,
        nextExpiry: nextExp ? format(new Date(nextExp), 'dd/MM/yyyy') : null,
        soonExpiry: nextExp ? new Date(nextExp) <= in30 : false,
      })
    }
  }
  inventory.value = result
  loading.value = false
}

onMounted(async () => {
  await load()
  await startTourIfNew('inventario')
})
</script>

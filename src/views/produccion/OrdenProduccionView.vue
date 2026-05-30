<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h2 class="text-h6 font-weight-bold text-primary">Órdenes de Producción</h2>
        <p class="text-body-2 text-medium-emphasis">Ejecuta una receta: consume insumos y genera lote de producto terminado</p>
      </div>
      <v-btn id="btn-nueva-op" color="primary" prepend-icon="mdi-plus" @click="openDialog()">Nueva Orden</v-btn>
    </div>

    <!-- KPIs -->
    <v-row class="mb-4">
      <v-col cols="6" sm="3">
        <v-card rounded="xl" elevation="1" class="pa-4 text-center">
          <div class="text-h5 font-weight-bold text-primary">{{ totales.completadas }}</div>
          <div class="text-caption text-medium-emphasis">Completadas</div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card rounded="xl" elevation="1" class="pa-4 text-center">
          <div class="text-h5 font-weight-bold text-warning">{{ totales.enProceso }}</div>
          <div class="text-caption text-medium-emphasis">En Proceso</div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card rounded="xl" elevation="1" class="pa-4 text-center">
          <div class="text-h5 font-weight-bold text-success">{{ totales.unidades }}</div>
          <div class="text-caption text-medium-emphasis">Unidades producidas (mes)</div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card rounded="xl" elevation="1" class="pa-4 text-center">
          <div class="text-h5 font-weight-bold text-secondary">Q{{ fmtNum(totales.costo) }}</div>
          <div class="text-caption text-medium-emphasis">Costo producción (mes)</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Tabla historial -->
    <v-card rounded="xl" elevation="2" id="tabla-op">
      <v-data-table :headers="headers" :items="orders" :loading="loading" items-per-page="15" hover>
        <template #item.productId="{ item }">
          <span class="font-weight-medium">{{ productName(item.productId) }}</span>
          <div class="text-caption text-medium-emphasis">{{ recipeName(item.recipeId) }}</div>
        </template>
        <template #item.status="{ item }">
          <v-chip :color="statusColor(item.status)" size="small" variant="tonal">
            <v-icon start size="14">{{ statusIcon(item.status) }}</v-icon>
            {{ statusLabel(item.status) }}
          </v-chip>
        </template>
        <template #item.unitsProduced="{ item }">
          <span v-if="item.unitsProduced">{{ item.unitsProduced }} uds ({{ item.batchesProduced }} batch)</span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>
        <template #item.totalCost="{ item }">
          <span v-if="item.totalCost">Q{{ fmtNum(item.totalCost) }}</span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>
        <template #item.date="{ item }">{{ fmtDate(item.date) }}</template>
        <template #item.actions="{ item }">
          <v-btn v-if="item.status==='en_proceso'" icon="mdi-check-circle" size="small" variant="text" color="success" title="Completar orden" @click="openComplete(item)" />
          <v-btn icon="mdi-eye" size="small" variant="text" color="primary" @click="openDetail(item)" />
        </template>
      </v-data-table>
    </v-card>

    <!-- ── Dialog nueva orden ── -->
    <v-dialog v-model="dialog" max-width="700" persistent scrollable>
      <v-card rounded="xl">
        <v-card-title class="pa-6 pb-2 text-primary">
          <v-icon class="mr-2">mdi-flask-outline</v-icon>Nueva Orden de Producción
        </v-card-title>
        <v-card-text class="pa-6">
          <v-form ref="formRef">
            <!-- Selección de receta -->
            <v-select
              v-model="form.recipeId"
              :items="recipeItems"
              label="Receta *"
              :rules="[r=>!!r||'Requerido']"
              prepend-inner-icon="mdi-book-open-variant"
              class="mb-2"
              @update:model-value="onRecipeSelect"
            />

            <template v-if="selectedRecipe">
              <!-- Info del producto a producir -->
              <v-alert type="info" variant="tonal" density="compact" class="mb-4">
                Producirá <strong>{{ form.batches }} batch × {{ selectedRecipe.yield }} {{ selectedRecipe.yieldUnit }}</strong>
                = <strong>{{ form.batches * selectedRecipe.yield }} unidades</strong> de
                <strong>{{ productName(selectedRecipe.productId) }}</strong>
              </v-alert>

              <v-row class="mb-2">
                <v-col cols="6">
                  <v-text-field v-model.number="form.batches" label="Cantidad de batches *" type="number" min="1"
                    :rules="[r=>r>=1||'Mínimo 1']" @update:model-value="checkIngredients" />
                </v-col>
                <v-col cols="6">
                  <v-text-field v-model="form.notes" label="Notas" />
                </v-col>
              </v-row>

              <!-- Verificación de insumos -->
              <div class="text-body-2 font-weight-bold text-primary mb-2">
                <v-icon size="18" class="mr-1">mdi-package-variant-closed</v-icon>Verificación de insumos para {{ form.batches }} batch(es)
              </div>
              <v-table density="compact" class="mb-3">
                <thead>
                  <tr>
                    <th>Insumo</th>
                    <th>Requerido</th>
                    <th>Disponible</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="check in ingredientChecks" :key="check.productId">
                    <td>
                      <div class="text-body-2">{{ check.name }}</div>
                      <div class="text-caption text-medium-emphasis">{{ check.code }}</div>
                    </td>
                    <td class="font-weight-medium">{{ check.required }} {{ check.unit }}</td>
                    <td>{{ check.available.toFixed(2) }} {{ check.unit }}</td>
                    <td>
                      <v-chip :color="check.ok ? 'success' : 'error'" size="x-small" variant="tonal">
                        <v-icon start size="12">{{ check.ok ? 'mdi-check' : 'mdi-close' }}</v-icon>
                        {{ check.ok ? 'OK' : 'INSUFICIENTE' }}
                      </v-chip>
                    </td>
                  </tr>
                </tbody>
              </v-table>

              <v-alert v-if="!allIngredientsOk" type="error" variant="tonal" density="compact" class="mb-3">
                Uno o más insumos no tienen stock suficiente. Ajusta la cantidad de batches o registra una compra primero.
              </v-alert>

              <v-alert v-if="allIngredientsOk" type="success" variant="tonal" density="compact" class="mb-3">
                Todos los insumos disponibles. Puedes ejecutar la producción.
              </v-alert>

              <!-- Costo estimado -->
              <div class="d-flex justify-end">
                <v-card rounded="lg" color="green-lighten-5" class="pa-3" style="min-width:220px">
                  <div class="text-caption text-medium-emphasis">Costo estimado</div>
                  <div class="text-h6 font-weight-bold text-primary">Q{{ fmtNum(estimatedCost) }}</div>
                  <div class="text-caption text-medium-emphasis">
                    Costo/unidad: Q{{ fmtNum(estimatedCost / (form.batches * (selectedRecipe?.yield || 1))) }}
                  </div>
                </v-card>
              </div>
            </template>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="dialog=false">Cancelar</v-btn>
          <v-btn color="warning" variant="tonal" @click="saveOrder('en_proceso')" :loading="saving" :disabled="!selectedRecipe">
            <v-icon start>mdi-play-pause</v-icon>Iniciar (en proceso)
          </v-btn>
          <v-btn color="primary" @click="saveOrder('completada')" :loading="saving" :disabled="!selectedRecipe || !allIngredientsOk">
            <v-icon start>mdi-check-circle</v-icon>Ejecutar ahora
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ── Dialog completar orden en proceso ── -->
    <v-dialog v-model="completeDialog" max-width="500">
      <v-card rounded="xl" v-if="completing">
        <v-card-title class="pa-6 pb-2 text-primary">
          <v-icon class="mr-2">mdi-check-circle</v-icon>Completar Orden #{{ completing.id }}
        </v-card-title>
        <v-card-text class="pa-6">
          <p class="mb-3">¿Confirmas que la producción de <strong>{{ productName(completing.productId) }}</strong> ha finalizado?</p>
          <v-alert type="info" variant="tonal" density="compact">
            Se descontarán los insumos del inventario y se generará un lote de producto terminado.
          </v-alert>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="completeDialog=false">Cancelar</v-btn>
          <v-btn color="success" @click="executeComplete" :loading="saving">Confirmar y Completar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ── Dialog detalle ── -->
    <v-dialog v-model="detailDialog" max-width="500">
      <v-card rounded="xl" v-if="detail">
        <v-card-title class="pa-6 pb-2 text-primary d-flex align-center">
          Orden #{{ detail.id }} — {{ productName(detail.productId) }}
          <v-spacer />
          <v-chip :color="statusColor(detail.status)" size="small" variant="tonal">{{ statusLabel(detail.status) }}</v-chip>
        </v-card-title>
        <v-card-text class="pa-6">
          <v-table density="compact">
            <tbody>
              <tr><td class="text-medium-emphasis">Receta</td><td>{{ recipeName(detail.recipeId) }}</td></tr>
              <tr><td class="text-medium-emphasis">Fecha</td><td>{{ fmtDate(detail.date) }}</td></tr>
              <tr><td class="text-medium-emphasis">Batches</td><td>{{ detail.batchesProduced }}</td></tr>
              <tr><td class="text-medium-emphasis">Unidades producidas</td><td class="font-weight-bold">{{ detail.unitsProduced }}</td></tr>
              <tr><td class="text-medium-emphasis">Costo total</td><td class="font-weight-bold text-primary">Q{{ fmtNum(detail.totalCost) }}</td></tr>
              <tr v-if="detail.notes"><td class="text-medium-emphasis">Notas</td><td>{{ detail.notes }}</td></tr>
            </tbody>
          </v-table>
        </v-card-text>
        <v-card-actions class="pa-4"><v-spacer /><v-btn variant="text" @click="detailDialog=false">Cerrar</v-btn></v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :color="snack.color" timeout="3500" location="bottom right">{{ snack.text }}</v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import db from '@/db/db'
import { useAuthStore } from '@/stores/auth'
import { useTour } from '@/composables/useTour'

const auth = useAuthStore()
const { startTourIfNew } = useTour()

const loading  = ref(true)
const saving   = ref(false)
const dialog   = ref(false)
const completeDialog = ref(false)
const detailDialog   = ref(false)
const orders   = ref([])
const recipes  = ref([])
const allProducts = ref([])
const allBatches  = ref([])
const completing  = ref(null)
const detail      = ref(null)
const formRef  = ref(null)
const snack    = ref({ show: false, text: '', color: 'success' })

const form = ref({ recipeId: null, batches: 1, notes: '' })
const selectedRecipe = ref(null)
const ingredientChecks = ref([])
const recipeIngredients = ref([])

// ── computed ──────────────────────────────────────────────────
const headers = [
  { title: '#',           key: 'id',            width: 60 },
  { title: 'Producto',    key: 'productId' },
  { title: 'Estado',      key: 'status',        width: 140 },
  { title: 'Producido',   key: 'unitsProduced',  width: 160 },
  { title: 'Costo',       key: 'totalCost',      width: 130 },
  { title: 'Fecha',       key: 'date',           width: 110 },
  { title: '',            key: 'actions',        sortable: false, width: 90 },
]

const recipeItems = computed(() =>
  recipes.value.filter(r => r.active).map(r => ({
    title: `${r.name} — rinde ${r.yield} ${r.yieldUnit}`,
    value: r.id,
  }))
)

const now = new Date()
const totales = computed(() => {
  const ms = startOfMonth(now); const me = endOfMonth(now)
  const mes = orders.value.filter(o => new Date(o.date) >= ms && new Date(o.date) <= me)
  return {
    completadas: orders.value.filter(o => o.status === 'completada').length,
    enProceso:   orders.value.filter(o => o.status === 'en_proceso').length,
    unidades:    mes.reduce((s, o) => s + (o.unitsProduced || 0), 0),
    costo:       mes.reduce((s, o) => s + (o.totalCost || 0), 0),
  }
})

const allIngredientsOk = computed(() => ingredientChecks.value.length > 0 && ingredientChecks.value.every(c => c.ok))

const estimatedCost = computed(() => {
  return recipeIngredients.value.reduce((sum, ri) => {
    const prod = allProducts.value.find(p => p.id === ri.inputProductId)
    return sum + (prod?.buyPrice || 0) * ri.quantity * form.value.batches
  }, 0)
})

// ── helpers ───────────────────────────────────────────────────
function productName(id) { return allProducts.value.find(p => p.id === id)?.name || '—' }
function recipeName(id)  { return recipes.value.find(r => r.id === id)?.name || '—' }
function fmtDate(d)      { try { return format(new Date(d), 'dd/MM/yyyy') } catch { return '—' } }
function fmtNum(v)       { return Number(v||0).toLocaleString('es-GT', { minimumFractionDigits:2, maximumFractionDigits:2 }) }
function statusColor(s)  { return { completada:'success', en_proceso:'warning', cancelada:'error' }[s] || 'grey' }
function statusIcon(s)   { return { completada:'mdi-check-circle', en_proceso:'mdi-progress-clock', cancelada:'mdi-close-circle' }[s] || 'mdi-circle' }
function statusLabel(s)  { return { completada:'Completada', en_proceso:'En proceso', cancelada:'Cancelada' }[s] || s }

// ── lógica ────────────────────────────────────────────────────
async function load() {
  loading.value = true
  orders.value      = await db.productionOrders.toArray()
  orders.value.sort((a,b) => new Date(b.date) - new Date(a.date))
  recipes.value     = await db.recipes.toArray()
  allProducts.value = await db.products.toArray()
  allBatches.value  = await db.batches.toArray()
  loading.value = false
}

async function onRecipeSelect(recipeId) {
  selectedRecipe.value = recipes.value.find(r => r.id === recipeId) || null
  recipeIngredients.value = await db.recipeItems.where('recipeId').equals(recipeId).toArray()
  await checkIngredients()
}

async function checkIngredients() {
  if (!selectedRecipe.value) return
  const batches = form.value.batches || 1
  const checks = []
  for (const ri of recipeIngredients.value) {
    const required = ri.quantity * batches
    // sumar available de todos los lotes no vencidos de este insumo
    const available = allBatches.value
      .filter(b => b.productId === ri.inputProductId && new Date(b.expiryDate) > now)
      .reduce((s, b) => s + (b.available || 0), 0)
    const prod = allProducts.value.find(p => p.id === ri.inputProductId)
    checks.push({ productId: ri.inputProductId, name: prod?.name || '—', code: prod?.code || '', required, available, unit: ri.unit, ok: available >= required })
  }
  ingredientChecks.value = checks
}

function openDialog() {
  form.value = { recipeId: null, batches: 1, notes: '' }
  selectedRecipe.value = null
  ingredientChecks.value = []
  recipeIngredients.value = []
  dialog.value = true
}

async function saveOrder(status) {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  saving.value = true

  const recipe = selectedRecipe.value
  const batches = form.value.batches
  const unitsProduced = status === 'completada' ? batches * recipe.yield : 0
  const totalCost = status === 'completada' ? parseFloat(estimatedCost.value.toFixed(2)) : 0

  const orderId = await db.productionOrders.add({
    recipeId: form.value.recipeId,
    productId: recipe.productId,
    status,
    date: new Date(),
    userId: auth.user.id,
    batchesProduced: status === 'completada' ? batches : 0,
    unitsProduced,
    totalCost,
    notes: form.value.notes,
  })

  if (status === 'completada') {
    await executeProduction(orderId, recipe, batches, totalCost)
  }

  await load()
  dialog.value = false
  saving.value = false
  snack.value = {
    show: true,
    text: status === 'completada'
      ? `✅ Producción ejecutada — ${unitsProduced} unidades generadas`
      : '⏳ Orden iniciada en proceso',
    color: 'success',
  }
}

async function executeProduction(orderId, recipe, batches, totalCost) {
  // 1. Descontar insumos FIFO
  for (const ri of recipeIngredients.value) {
    let remaining = ri.quantity * batches
    const lotes = allBatches.value
      .filter(b => b.productId === ri.inputProductId && new Date(b.expiryDate) > now && b.available > 0)
      .sort((a, b) => new Date(a.entryDate) - new Date(b.entryDate)) // FIFO
    for (const lote of lotes) {
      if (remaining <= 0) break
      const consume = Math.min(lote.available, remaining)
      await db.batches.update(lote.id, { available: lote.available - consume })
      remaining -= consume
    }
    await db.stockMovements.add({
      productId: ri.inputProductId, presentationId: null, batchId: null,
      type: 'salida', quantity: ri.quantity * batches, date: new Date(),
      userId: auth.user.id, reference: `OP#${orderId}`,
    })
  }

  // 2. Generar lote de producto terminado
  // Usar primera presentación disponible del producto
  const pres = await db.presentations.where('productId').equals(recipe.productId).first()
  const lotNumber = `OP${orderId}-${format(new Date(), 'yyyyMMdd')}`
  const expiryDate = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000) // 180 días
  const qty = batches * recipe.yield
  const batchId = await db.batches.add({
    productId: recipe.productId,
    presentationId: pres?.id || null,
    lotNumber, entryDate: new Date(), expiryDate,
    quantity: qty, available: qty,
    purchaseOrderId: null,
    productionOrderId: orderId,
    unitCost: parseFloat((totalCost / qty).toFixed(4)),
  })
  await db.stockMovements.add({
    productId: recipe.productId, presentationId: pres?.id || null, batchId,
    type: 'entrada', quantity: qty, date: new Date(),
    userId: auth.user.id, reference: `OP#${orderId}`,
  })

  // Refrescar batches en memoria
  allBatches.value = await db.batches.toArray()
}

function openComplete(item) { completing.value = item; completeDialog.value = true }
function openDetail(item)   { detail.value = item; detailDialog.value = true }

async function executeComplete() {
  saving.value = true
  const item = completing.value
  const recipe = recipes.value.find(r => r.id === item.recipeId)
  if (!recipe) { saving.value = false; return }

  recipeIngredients.value = await db.recipeItems.where('recipeId').equals(item.recipeId).toArray()
  allBatches.value = await db.batches.toArray()

  const batches = 1
  const totalCost = parseFloat(recipeIngredients.value.reduce((s, ri) => {
    const p = allProducts.value.find(p => p.id === ri.inputProductId)
    return s + (p?.buyPrice || 0) * ri.quantity * batches
  }, 0).toFixed(2))

  await executeProduction(item.id, recipe, batches, totalCost)
  await db.productionOrders.update(item.id, {
    status: 'completada',
    batchesProduced: batches,
    unitsProduced: batches * recipe.yield,
    totalCost,
  })

  await load()
  completeDialog.value = false
  saving.value = false
  snack.value = { show: true, text: '✅ Orden completada — inventario actualizado', color: 'success' }
}

onMounted(async () => {
  await load()
  await startTourIfNew('produccion-op')
})
</script>

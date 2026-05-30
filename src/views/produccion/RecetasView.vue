<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h2 class="text-h6 font-weight-bold text-primary">Recetas de Producción</h2>
        <p class="text-body-2 text-medium-emphasis">Fórmulas e insumos necesarios para fabricar cada producto terminado</p>
      </div>
      <v-btn id="btn-nueva-receta" color="primary" prepend-icon="mdi-plus" @click="openDialog()">Nueva Receta</v-btn>
    </div>

    <!-- Lista de recetas -->
    <v-row id="lista-recetas">
      <v-col cols="12" md="4">
        <!-- Panel izquierdo: lista de recetas -->
        <v-card rounded="xl" elevation="2" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-primary text-body-1 font-weight-bold">
            <v-icon class="mr-2" size="20">mdi-book-open-variant</v-icon>Recetas ({{ recipes.length }})
          </v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item
              v-for="r in recipes"
              :key="r.id"
              :active="selected?.id === r.id"
              active-color="primary"
              rounded="lg"
              class="mb-1"
              @click="selectRecipe(r)"
            >
              <template #prepend>
                <v-avatar color="primary" size="36" class="mr-3">
                  <v-icon color="white" size="18">mdi-flask-outline</v-icon>
                </v-avatar>
              </template>
              <v-list-item-title class="font-weight-medium text-body-2">{{ r.name }}</v-list-item-title>
              <v-list-item-subtitle class="text-caption">
                Rinde: {{ r.yield }} {{ r.yieldUnit }} · v{{ r.version }}
              </v-list-item-subtitle>
              <template #append>
                <v-chip :color="r.active?'success':'grey'" size="x-small" variant="tonal">{{ r.active?'Activa':'Inactiva' }}</v-chip>
              </template>
            </v-list-item>
            <div v-if="recipes.length===0" class="pa-4 text-center text-medium-emphasis text-caption">
              Sin recetas registradas
            </div>
          </v-list>
        </v-card>
      </v-col>

      <v-col cols="12" md="8">
        <!-- Panel derecho: detalle de la receta seleccionada -->
        <v-card v-if="selected" rounded="xl" elevation="2">
          <v-card-title class="pa-5 pb-2 d-flex align-center">
            <div>
              <div class="text-primary font-weight-bold text-body-1">{{ selected.name }}</div>
              <div class="text-caption text-medium-emphasis">Versión {{ selected.version }} · Rinde {{ selected.yield }} {{ selected.yieldUnit }}</div>
            </div>
            <v-spacer />
            <v-btn size="small" variant="tonal" color="primary" prepend-icon="mdi-pencil" @click="openDialog(selected)" class="mr-2">Editar</v-btn>
            <v-btn size="small" variant="tonal" color="secondary" prepend-icon="mdi-plus" @click="openItemDialog()">Agregar insumo</v-btn>
          </v-card-title>

          <v-divider />

          <v-card-text class="pa-4">
            <div v-if="selected.notes" class="mb-4 pa-3 rounded-lg bg-green-lighten-5 text-body-2 text-medium-emphasis">
              <v-icon size="16" class="mr-1">mdi-information-outline</v-icon>{{ selected.notes }}
            </div>

            <!-- Tabla de insumos -->
            <v-table density="compact">
              <thead>
                <tr>
                  <th>Insumo (producto de compra)</th>
                  <th style="width:100px">Cantidad</th>
                  <th style="width:80px">Unidad</th>
                  <th>Notas</th>
                  <th style="width:60px"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in selectedItems" :key="item.id">
                  <td>
                    <div class="font-weight-medium text-body-2">{{ inputProductName(item.inputProductId) }}</div>
                    <div class="text-caption text-medium-emphasis">{{ inputProductCode(item.inputProductId) }}</div>
                  </td>
                  <td class="font-weight-medium">{{ item.quantity }}</td>
                  <td>
                    <v-chip size="x-small" color="secondary" variant="tonal">{{ item.unit }}</v-chip>
                  </td>
                  <td class="text-caption text-medium-emphasis">{{ item.notes }}</td>
                  <td>
                    <v-btn icon="mdi-delete" size="x-small" variant="text" color="error" @click="deleteItem(item)" />
                  </td>
                </tr>
                <tr v-if="selectedItems.length===0">
                  <td colspan="5" class="text-center text-medium-emphasis pa-4">Sin insumos registrados — agrega el primero</td>
                </tr>
              </tbody>
            </v-table>

            <!-- Costo estimado -->
            <v-divider class="my-4" />
            <div class="d-flex justify-end">
              <v-card rounded="lg" color="green-lighten-5" class="pa-4" style="min-width:260px">
                <div class="text-caption text-medium-emphasis mb-2">Costo estimado del batch ({{ selected.yield }} {{ selected.yieldUnit }})</div>
                <div class="text-h6 font-weight-bold text-primary">Q{{ fmtNum(estimatedCost) }}</div>
                <div class="text-caption text-medium-emphasis">Costo por unidad: Q{{ fmtNum(estimatedCost / (selected.yield || 1)) }}</div>
              </v-card>
            </div>
          </v-card-text>
        </v-card>

        <v-card v-else rounded="xl" elevation="1" class="pa-8 text-center">
          <v-icon size="64" color="grey-lighten-2">mdi-flask-outline</v-icon>
          <div class="text-medium-emphasis mt-3">Selecciona una receta para ver sus insumos</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog nueva / editar receta -->
    <v-dialog v-model="dialog" max-width="560" persistent>
      <v-card rounded="xl">
        <v-card-title class="pa-6 pb-2 text-primary">
          <v-icon class="mr-2">mdi-flask-outline</v-icon>{{ editingRecipe ? 'Editar Receta' : 'Nueva Receta' }}
        </v-card-title>
        <v-card-text class="pa-6">
          <v-form ref="formRef">
            <v-row>
              <v-col cols="12">
                <v-select v-model="form.productId" :items="ventaProductItems" label="Producto Terminado *"
                  :rules="[r=>!!r||'Requerido']" hint="Solo productos de tipo Venta" persistent-hint />
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="form.name" label="Nombre de la receta *" :rules="[r=>!!r||'Requerido']" />
              </v-col>
              <v-col cols="6">
                <v-text-field v-model="form.version" label="Versión" placeholder="1.0" />
              </v-col>
              <v-col cols="3">
                <v-text-field v-model.number="form.yield" label="Rendimiento" type="number" :rules="[r=>!!r||'Requerido']" />
              </v-col>
              <v-col cols="3">
                <v-text-field v-model="form.yieldUnit" label="Unidad" placeholder="botellas" />
              </v-col>
              <v-col cols="12">
                <v-textarea v-model="form.notes" label="Notas de producción" rows="2" />
              </v-col>
              <v-col cols="12">
                <v-checkbox v-model="form.active" label="Receta activa" density="compact" hide-details />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="dialog=false">Cancelar</v-btn>
          <v-btn color="primary" @click="saveRecipe" :loading="saving">{{ editingRecipe ? 'Guardar' : 'Crear' }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog agregar insumo -->
    <v-dialog v-model="itemDialog" max-width="480" persistent>
      <v-card rounded="xl">
        <v-card-title class="pa-6 pb-2 text-primary">
          <v-icon class="mr-2">mdi-plus-circle-outline</v-icon>Agregar Insumo
        </v-card-title>
        <v-card-text class="pa-6">
          <v-form ref="itemFormRef">
            <v-row>
              <v-col cols="12">
                <v-select v-model="itemForm.inputProductId" :items="compraProductItems" label="Insumo (materia prima) *"
                  :rules="[r=>!!r||'Requerido']" hint="Solo productos de tipo Compra" persistent-hint />
              </v-col>
              <v-col cols="6">
                <v-text-field v-model.number="itemForm.quantity" label="Cantidad *" type="number" :rules="[r=>!!r||'Requerido']" />
              </v-col>
              <v-col cols="6">
                <v-select v-model="itemForm.unit" :items="unitOpts" label="Unidad *" :rules="[r=>!!r||'Requerido']" />
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="itemForm.notes" label="Notas (opcional)" />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="itemDialog=false">Cancelar</v-btn>
          <v-btn color="primary" @click="saveItem" :loading="saving">Agregar</v-btn>
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
const itemDialog = ref(false)
const editingRecipe = ref(false)
const recipes = ref([])
const selected = ref(null)
const selectedItems = ref([])
const allProducts = ref([])
const formRef = ref(null)
const itemFormRef = ref(null)
const snack = ref({ show: false, text: '', color: 'success' })

const emptyForm = () => ({ productId: null, name: '', version: '1.0', yield: 1, yieldUnit: 'unidades', notes: '', active: true })
const form = ref(emptyForm())
const itemForm = ref({ inputProductId: null, quantity: 1, unit: 'kg', notes: '' })

const unitOpts = ['kg', 'gr', 'L', 'ml', 'pza', 'cja']

const ventaProductItems = computed(() =>
  allProducts.value.filter(p => p.type === 'venta' && p.active)
    .map(p => ({ title: `${p.code} — ${p.name}`, value: p.id }))
)
const compraProductItems = computed(() =>
  allProducts.value.filter(p => p.type === 'compra' && p.active)
    .map(p => ({ title: `${p.code} — ${p.name}`, value: p.id }))
)

function inputProductName(id) { return allProducts.value.find(p => p.id === id)?.name || '—' }
function inputProductCode(id) { return allProducts.value.find(p => p.id === id)?.code || '' }
function fmtNum(v) { return Number(v || 0).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

const estimatedCost = computed(() => {
  return selectedItems.value.reduce((sum, item) => {
    const prod = allProducts.value.find(p => p.id === item.inputProductId)
    if (!prod) return sum
    // costo aproximado: buyPrice por unidad base (kg, L) × cantidad
    return sum + (prod.buyPrice || 0) * (item.quantity || 0)
  }, 0)
})

async function load() {
  loading.value = true
  recipes.value = await db.recipes.toArray()
  allProducts.value = await db.products.toArray()
  loading.value = false
}

async function selectRecipe(r) {
  selected.value = r
  selectedItems.value = await db.recipeItems.where('recipeId').equals(r.id).toArray()
}

function openDialog(recipe = null) {
  editingRecipe.value = !!recipe
  form.value = recipe ? { ...recipe } : emptyForm()
  dialog.value = true
}

function openItemDialog() {
  itemForm.value = { inputProductId: null, quantity: 1, unit: 'kg', notes: '' }
  itemDialog.value = true
}

async function saveRecipe() {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  saving.value = true
  if (editingRecipe.value) {
    await db.recipes.update(form.value.id, { ...form.value })
  } else {
    const id = await db.recipes.add({ ...form.value })
    form.value.id = id
  }
  await load()
  // re-seleccionar
  const updated = recipes.value.find(r => r.id === form.value.id)
  if (updated) await selectRecipe(updated)
  dialog.value = false
  saving.value = false
  snack.value = { show: true, text: editingRecipe.value ? 'Receta actualizada' : 'Receta creada', color: 'success' }
}

async function saveItem() {
  const { valid } = await itemFormRef.value.validate()
  if (!valid) return
  saving.value = true
  await db.recipeItems.add({ ...itemForm.value, recipeId: selected.value.id })
  selectedItems.value = await db.recipeItems.where('recipeId').equals(selected.value.id).toArray()
  itemDialog.value = false
  saving.value = false
  snack.value = { show: true, text: 'Insumo agregado', color: 'success' }
}

async function deleteItem(item) {
  await db.recipeItems.delete(item.id)
  selectedItems.value = await db.recipeItems.where('recipeId').equals(selected.value.id).toArray()
  snack.value = { show: true, text: 'Insumo eliminado', color: 'warning' }
}

onMounted(async () => {
  await load()
  if (recipes.value.length > 0) await selectRecipe(recipes.value[0])
  await startTourIfNew('recetas')
})
</script>

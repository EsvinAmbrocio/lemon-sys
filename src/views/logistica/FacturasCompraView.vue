<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h2 class="text-h6 font-weight-bold text-primary">Facturas de Compra — Servicios</h2>
        <p class="text-body-2 text-medium-emphasis">Registro de facturas por servicios (luz, agua, mantenimiento, etc.)</p>
      </div>
      <v-btn id="btn-nueva-factura-compra" color="primary" prepend-icon="mdi-plus" @click="openDialog()">Nueva Factura</v-btn>
    </div>

    <!-- KPIs rápidos -->
    <v-row class="mb-4">
      <v-col cols="12" sm="4">
        <v-card rounded="xl" elevation="1" color="primary" class="pa-4 text-white">
          <div class="text-caption mb-1">Total Pendiente de Pago</div>
          <div class="text-h5 font-weight-bold">Q{{ fmtNum(totPendiente) }}</div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="4">
        <v-card rounded="xl" elevation="1" color="warning" class="pa-4 text-white">
          <div class="text-caption mb-1">Facturas Pendientes</div>
          <div class="text-h5 font-weight-bold">{{ countPendiente }}</div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="4">
        <v-card rounded="xl" elevation="1" color="success" class="pa-4 text-white">
          <div class="text-caption mb-1">Pagado Este Mes</div>
          <div class="text-h5 font-weight-bold">Q{{ fmtNum(totPagadoMes) }}</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Filtros -->
    <v-card rounded="xl" elevation="1" class="mb-4">
      <v-card-text class="pa-4">
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field v-model="search" label="Buscar proveedor / N° factura..." prepend-inner-icon="mdi-magnify" clearable hide-details density="compact" />
          </v-col>
          <v-col cols="12" md="3">
            <v-select v-model="filterStatus" :items="statusOpts" label="Estado" clearable hide-details density="compact" />
          </v-col>
          <v-col cols="12" md="3">
            <v-select v-model="filterType" :items="serviceTypeOpts" label="Tipo de servicio" clearable hide-details density="compact" />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Tabla -->
    <v-card rounded="xl" elevation="2" id="tabla-facturas-compra">
      <v-data-table :headers="headers" :items="filtered" :loading="loading" items-per-page="15" hover>
        <template #item.serviceType="{ item }">
          <v-chip size="small" :color="serviceColor(item.serviceType)" variant="tonal">
            <v-icon start size="14">{{ serviceIcon(item.serviceType) }}</v-icon>
            {{ item.serviceType }}
          </v-chip>
        </template>
        <template #item.total="{ item }">
          <span class="font-weight-medium">Q{{ fmtNum(item.total) }}</span>
        </template>
        <template #item.tax="{ item }">Q{{ fmtNum(item.tax) }}</template>
        <template #item.date="{ item }">{{ fmtDate(item.date) }}</template>
        <template #item.dueDate="{ item }">
          <span :class="isOverdue(item) ? 'text-error font-weight-bold' : ''">{{ fmtDate(item.dueDate) }}</span>
        </template>
        <template #item.status="{ item }">
          <v-chip :color="statusColor(item.status)" size="small" variant="tonal">{{ statusLabel(item.status) }}</v-chip>
        </template>
        <template #item.paymentType="{ item }">
          <v-chip :color="item.paymentType==='credito'?'warning':'success'" size="x-small" variant="tonal">{{ item.paymentType }}</v-chip>
        </template>
        <template #item.actions="{ item }">
          <v-btn icon="mdi-eye" size="small" variant="text" color="primary" @click="openView(item)" />
          <v-btn v-if="item.status==='pendiente'" icon="mdi-check-circle" size="small" variant="text" color="success" title="Marcar como pagada" @click="markPaid(item)" />
        </template>
      </v-data-table>
    </v-card>

    <!-- Dialog nueva factura -->
    <v-dialog v-model="dialog" max-width="680" persistent scrollable>
      <v-card rounded="xl">
        <v-card-title class="pa-6 pb-2 text-primary">
          <v-icon class="mr-2">mdi-receipt-text-outline</v-icon>Nueva Factura de Servicio
        </v-card-title>
        <v-card-text class="pa-6">
          <v-form ref="formRef">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field v-model="form.supplierName" label="Proveedor de Servicio *" :rules="[r=>!!r||'Requerido']" placeholder="Ej. EEGSA, EMPAGUA..." />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="form.nit" label="NIT del Proveedor" placeholder="1234567-8 o CF" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="form.invoiceNumber" label="Número de Factura *" :rules="[r=>!!r||'Requerido']" placeholder="Ej. F-2025-0001" />
              </v-col>
              <v-col cols="12" md="6">
                <v-select v-model="form.serviceType" :items="serviceTypeOpts" label="Tipo de Servicio *" :rules="[r=>!!r||'Requerido']" />
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="form.description" label="Descripción del servicio *" :rules="[r=>!!r||'Requerido']" />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model.number="form.amount" label="Monto base *" type="number" prefix="Q"
                  :rules="[r=>!!r||'Requerido']" @update:model-value="calcTax" />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model.number="form.tax" label="IVA (12%)" type="number" prefix="Q" readonly />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model.number="form.total" label="Total" type="number" prefix="Q" readonly />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model="form.date" label="Fecha Factura *" type="date" :rules="[r=>!!r||'Requerido']" />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model="form.dueDate" label="Fecha Vencimiento" type="date" />
              </v-col>
              <v-col cols="12" md="4">
                <v-select v-model="form.paymentType"
                  :items="[{title:'Contado',value:'contado'},{title:'Crédito',value:'credito'}]"
                  label="Tipo Pago *" />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="dialog=false">Cancelar</v-btn>
          <v-btn color="primary" @click="save" :loading="saving">Guardar Factura</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog ver detalle -->
    <v-dialog v-model="viewDialog" max-width="520">
      <v-card rounded="xl" v-if="selected">
        <v-card-title class="pa-6 pb-2 text-primary d-flex align-center">
          <v-icon class="mr-2">mdi-receipt-text</v-icon>Factura {{ selected.invoiceNumber }}
          <v-spacer />
          <v-chip :color="statusColor(selected.status)" size="small" variant="tonal">{{ statusLabel(selected.status) }}</v-chip>
        </v-card-title>
        <v-card-text class="pa-6">
          <v-table density="compact">
            <tbody>
              <tr><td class="text-medium-emphasis">Proveedor</td><td class="font-weight-medium">{{ selected.supplierName }}</td></tr>
              <tr><td class="text-medium-emphasis">NIT</td><td>{{ selected.nit || 'CF' }}</td></tr>
              <tr><td class="text-medium-emphasis">Tipo de servicio</td><td>
                <v-chip size="small" :color="serviceColor(selected.serviceType)" variant="tonal">{{ selected.serviceType }}</v-chip>
              </td></tr>
              <tr><td class="text-medium-emphasis">Descripción</td><td>{{ selected.description }}</td></tr>
              <tr><td class="text-medium-emphasis">Fecha</td><td>{{ fmtDate(selected.date) }}</td></tr>
              <tr><td class="text-medium-emphasis">Vencimiento</td><td :class="isOverdue(selected)?'text-error font-weight-bold':''">{{ fmtDate(selected.dueDate) }}</td></tr>
              <tr><td class="text-medium-emphasis">Monto base</td><td>Q{{ fmtNum(selected.amount) }}</td></tr>
              <tr><td class="text-medium-emphasis">IVA (12%)</td><td>Q{{ fmtNum(selected.tax) }}</td></tr>
              <tr class="bg-green-lighten-5"><td class="font-weight-bold text-primary">TOTAL</td><td class="font-weight-bold text-primary text-h6">Q{{ fmtNum(selected.total) }}</td></tr>
              <tr><td class="text-medium-emphasis">Tipo pago</td><td><v-chip :color="selected.paymentType==='credito'?'warning':'success'" size="x-small" variant="tonal">{{ selected.paymentType }}</v-chip></td></tr>
            </tbody>
          </v-table>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="viewDialog=false">Cerrar</v-btn>
          <v-btn v-if="selected.status==='pendiente'" color="success" prepend-icon="mdi-check-circle" @click="markPaid(selected); viewDialog=false">Marcar Pagada</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :color="snack.color" timeout="3000" location="bottom right">{{ snack.text }}</v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { format, addDays, startOfMonth, endOfMonth, isBefore, parseISO } from 'date-fns'
import db from '@/db/db'

const loading = ref(true)
const saving = ref(false)
const dialog = ref(false)
const viewDialog = ref(false)
const search = ref('')
const filterStatus = ref(null)
const filterType = ref(null)
const invoices = ref([])
const selected = ref(null)
const formRef = ref(null)
const snack = ref({ show: false, text: '', color: 'success' })

const emptyForm = () => ({
  supplierName: '', nit: '', invoiceNumber: '', serviceType: null,
  description: '', amount: 0, tax: 0, total: 0,
  date: format(new Date(), 'yyyy-MM-dd'),
  dueDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
  paymentType: 'contado', status: 'pendiente',
})
const form = ref(emptyForm())

const headers = [
  { title: 'N° Factura',  key: 'invoiceNumber', width: 140 },
  { title: 'Proveedor',   key: 'supplierName' },
  { title: 'Servicio',    key: 'serviceType',   width: 180 },
  { title: 'IVA',         key: 'tax',           width: 110 },
  { title: 'Total',       key: 'total',         width: 130 },
  { title: 'F. Factura',  key: 'date',          width: 120 },
  { title: 'Vencimiento', key: 'dueDate',       width: 120 },
  { title: 'Pago',        key: 'paymentType',   width: 100 },
  { title: 'Estado',      key: 'status',        width: 120 },
  { title: '',            key: 'actions',       sortable: false, width: 90 },
]

const serviceTypeOpts = [
  { title: 'Energía Eléctrica',  value: 'Energía Eléctrica' },
  { title: 'Agua Potable',        value: 'Agua Potable' },
  { title: 'Mantenimiento',       value: 'Mantenimiento' },
  { title: 'Reparación',          value: 'Reparación' },
  { title: 'Limpieza',            value: 'Limpieza' },
  { title: 'Seguridad',           value: 'Seguridad' },
  { title: 'Asesoría Contable',   value: 'Asesoría Contable' },
  { title: 'Telecomunicaciones',  value: 'Telecomunicaciones' },
  { title: 'Transporte',          value: 'Transporte' },
  { title: 'Otro Servicio',       value: 'Otro Servicio' },
]
const statusOpts = [
  { title: 'Pendiente', value: 'pendiente' },
  { title: 'Pagada',    value: 'pagada' },
  { title: 'Vencida',   value: 'vencida' },
]

function serviceColor(t) {
  return { 'Energía Eléctrica':'warning', 'Agua Potable':'info', 'Mantenimiento':'secondary',
           'Reparación':'error', 'Limpieza':'success', 'Seguridad':'primary',
           'Asesoría Contable':'purple', 'Telecomunicaciones':'teal' }[t] || 'grey'
}
function serviceIcon(t) {
  return { 'Energía Eléctrica':'mdi-lightning-bolt', 'Agua Potable':'mdi-water',
           'Mantenimiento':'mdi-wrench', 'Reparación':'mdi-tools',
           'Limpieza':'mdi-broom', 'Seguridad':'mdi-shield-account',
           'Asesoría Contable':'mdi-calculator', 'Telecomunicaciones':'mdi-phone' }[t] || 'mdi-file-document'
}
function statusColor(s) { return { pendiente:'warning', pagada:'success', vencida:'error' }[s] || 'grey' }
function statusLabel(s) { return { pendiente:'Pendiente', pagada:'Pagada', vencida:'Vencida' }[s] || s }
function fmtDate(d) { try { return format(new Date(d), 'dd/MM/yyyy') } catch { return '-' } }
function fmtNum(v) { return Number(v || 0).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function isOverdue(item) { return item.status === 'pendiente' && item.dueDate && isBefore(new Date(item.dueDate), new Date()) }

const filtered = computed(() => {
  let list = invoices.value
  if (filterStatus.value) list = list.filter(i => i.status === filterStatus.value)
  if (filterType.value)   list = list.filter(i => i.serviceType === filterType.value)
  if (search.value) {
    const s = search.value.toLowerCase()
    list = list.filter(i => i.supplierName?.toLowerCase().includes(s) || i.invoiceNumber?.toLowerCase().includes(s))
  }
  return list.sort((a, b) => new Date(b.date) - new Date(a.date))
})

const now = new Date()
const totPendiente = computed(() => invoices.value.filter(i => i.status === 'pendiente').reduce((s, i) => s + (i.total || 0), 0))
const countPendiente = computed(() => invoices.value.filter(i => i.status === 'pendiente').length)
const totPagadoMes = computed(() => {
  const ms = startOfMonth(now); const me = endOfMonth(now)
  return invoices.value.filter(i => i.status === 'pagada' && new Date(i.date) >= ms && new Date(i.date) <= me).reduce((s, i) => s + (i.total || 0), 0)
})

function calcTax() {
  const base = form.value.amount || 0
  form.value.tax   = parseFloat((base * 0.12).toFixed(2))
  form.value.total = parseFloat((base + form.value.tax).toFixed(2))
}

function openDialog() { form.value = emptyForm(); dialog.value = true }
function openView(item) { selected.value = item; viewDialog.value = true }

async function save() {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  saving.value = true
  const id = await db.serviceInvoices.add({
    ...form.value,
    date: new Date(form.value.date),
    dueDate: form.value.dueDate ? new Date(form.value.dueDate) : null,
  })
  if (form.value.paymentType === 'contado') {
    await db.cashMovements.add({ type: 'egreso', refType: 'servicio', refId: id, amount: form.value.total, date: new Date(form.value.date), description: `${form.value.serviceType} — ${form.value.supplierName}` })
    await db.serviceInvoices.update(id, { status: 'pagada' })
  }
  await load()
  dialog.value = false
  saving.value = false
  snack.value = { show: true, text: 'Factura registrada', color: 'success' }
}

async function markPaid(item) {
  await db.serviceInvoices.update(item.id, { status: 'pagada' })
  await db.cashMovements.add({ type: 'egreso', refType: 'servicio', refId: item.id, amount: item.total, date: new Date(), description: `Pago ${item.serviceType} — ${item.supplierName}` })
  await load()
  snack.value = { show: true, text: 'Factura marcada como pagada', color: 'success' }
}

async function load() {
  loading.value = true
  // marcar vencidas automáticamente
  const all = await db.serviceInvoices.toArray()
  for (const inv of all) {
    if (inv.status === 'pendiente' && inv.dueDate && isBefore(new Date(inv.dueDate), now)) {
      await db.serviceInvoices.update(inv.id, { status: 'vencida' })
    }
  }
  invoices.value = await db.serviceInvoices.toArray()
  loading.value = false
}

onMounted(load)
</script>

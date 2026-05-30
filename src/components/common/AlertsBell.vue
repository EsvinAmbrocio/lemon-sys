<template>
  <v-menu location="bottom end" :close-on-content-click="false">
    <template #activator="{ props }">
      <v-btn icon variant="text" v-bind="props" color="primary">
        <v-badge :content="alertCount" color="error" :model-value="!!alertCount">
          <v-icon>mdi-bell-outline</v-icon>
        </v-badge>
      </v-btn>
    </template>
    <v-card min-width="320" rounded="xl">
      <v-card-title class="text-primary pa-4 pb-2 d-flex align-center">
        <v-icon class="mr-2">mdi-bell</v-icon> Alertas del Sistema
      </v-card-title>
      <v-divider />
      <v-list density="compact">
        <v-list-item v-if="alerts.expired > 0" prepend-icon="mdi-alert-circle" :subtitle="`${alerts.expired} lote(s) vencido(s) bloqueados`" title="Lotes Vencidos" to="/produccion/lotes">
          <template #prepend><v-icon color="error">mdi-alert-circle</v-icon></template>
        </v-list-item>
        <v-list-item v-if="alerts.expiringSoon > 0" prepend-icon="mdi-clock-alert" :subtitle="`${alerts.expiringSoon} lote(s) vencen en menos de 30 días`" title="Próximos a Vencer" to="/produccion/lotes">
          <template #prepend><v-icon color="warning">mdi-clock-alert</v-icon></template>
        </v-list-item>
        <v-list-item v-if="alerts.lowStock > 0" prepend-icon="mdi-package-variant-closed-remove" :subtitle="`${alerts.lowStock} presentación(es) bajo mínimo`" title="Stock Bajo" to="/produccion/inventario">
          <template #prepend><v-icon color="warning">mdi-package-variant-closed-remove</v-icon></template>
        </v-list-item>
        <v-list-item v-if="alerts.overdueAR > 0" prepend-icon="mdi-cash-remove" :subtitle="`${alerts.overdueAR} cuenta(s) por cobrar vencidas`" title="CxC Vencidas" to="/finanzas/cxc">
          <template #prepend><v-icon color="error">mdi-cash-remove</v-icon></template>
        </v-list-item>
        <v-list-item v-if="!alertCount" title="Sin alertas activas" subtitle="Todo en orden ✓">
          <template #prepend><v-icon color="success">mdi-check-circle</v-icon></template>
        </v-list-item>
      </v-list>
    </v-card>
  </v-menu>
</template>

<script setup>
import { useAlerts } from '@/composables/useAlerts'
const { alerts, alertCount } = useAlerts()
</script>

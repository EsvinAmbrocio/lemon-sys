<template>
  <v-card :color="color" :variant="variant" rounded="xl" class="kpi-card" :id="id">
    <v-card-text class="pa-5">
      <div class="d-flex align-center justify-space-between mb-2">
        <span class="text-body-2 font-weight-medium" :style="`color: ${textColor}; opacity: 0.85`">{{ title }}</span>
        <v-icon :color="iconColor" size="28">{{ icon }}</v-icon>
      </div>
      <div class="text-h4 font-weight-bold mb-1" :style="`color: ${textColor}`">{{ value }}</div>
      <div v-if="subtitle" class="text-caption" :style="`color: ${textColor}; opacity: 0.7`">{{ subtitle }}</div>
      <div v-if="trend !== undefined" class="d-flex align-center mt-2">
        <v-icon :color="trend >= 0 ? 'success' : 'error'" size="16">{{ trend >= 0 ? 'mdi-trending-up' : 'mdi-trending-down' }}</v-icon>
        <span class="text-caption ml-1" :style="`color: ${trend >= 0 ? '#4CAF50' : '#F44336'}`">{{ Math.abs(trend) }}% vs mes anterior</span>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
defineProps({
  id:        { type: String, default: '' },
  title:     { type: String, required: true },
  value:     { type: [String, Number], required: true },
  subtitle:  { type: String, default: '' },
  icon:      { type: String, default: 'mdi-chart-box' },
  color:     { type: String, default: 'white' },
  variant:   { type: String, default: 'elevated' },
  iconColor: { type: String, default: 'primary' },
  textColor: { type: String, default: '#1a1a1a' },
  trend:     { type: Number, default: undefined },
})
</script>

<style scoped>
.kpi-card { transition: transform 0.2s, box-shadow 0.2s; cursor: default; }
.kpi-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important; }
</style>

<template>
  <v-app>
    <router-view />
  </v-app>
</template>

<script setup>
import { onMounted } from 'vue'
import { seedDatabase } from '@/db/seed'

onMounted(async () => {
  await seedDatabase()
})
</script>

<template>
  <v-card width="420" rounded="2xl" elevation="24" class="login-card">
    <v-card-text class="pa-8">
      <!-- Logo y título -->
      <div class="d-flex flex-column align-center mb-8">
        <LemonLogo :size="72" bg-color="#2E7D32" />
        <h1 class="text-h5 font-weight-bold text-primary mt-4">Lemon-Sys</h1>
        <p class="text-body-2 text-medium-emphasis text-center mt-1">Sistema de Control y Distribución<br>de Recursos Lemon</p>
      </div>

      <v-form @submit.prevent="handleLogin" ref="formRef">
        <v-text-field
          v-model="email"
          label="Correo electrónico"
          prepend-inner-icon="mdi-email-outline"
          type="email"
          :rules="[v => !!v || 'Requerido']"
          autocomplete="email"
          class="mb-3"
        />
        <v-text-field
          v-model="password"
          label="Contraseña"
          prepend-inner-icon="mdi-lock-outline"
          :append-inner-icon="showPass ? 'mdi-eye-off' : 'mdi-eye'"
          :type="showPass ? 'text' : 'password'"
          :rules="[v => !!v || 'Requerido']"
          @click:append-inner="showPass = !showPass"
          autocomplete="current-password"
          class="mb-4"
        />

        <v-alert v-if="error" type="error" rounded="lg" class="mb-4" density="compact">{{ error }}</v-alert>

        <v-btn
          type="submit"
          color="primary"
          block
          size="large"
          :loading="loading"
          class="mb-4"
        >
          <v-icon start>mdi-login</v-icon> Iniciar Sesión
        </v-btn>
      </v-form>

      <!-- Credenciales de prueba -->
      <v-expansion-panels variant="accordion" rounded="lg">
        <v-expansion-panel>
          <v-expansion-panel-title class="text-caption text-medium-emphasis">
            <v-icon size="16" class="mr-2">mdi-information-outline</v-icon>
            Credenciales de prueba
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-list density="compact" class="pa-0">
              <v-list-item
                v-for="cred in credentials"
                :key="cred.role"
                :subtitle="cred.email + ' / ' + cred.pass"
                :title="cred.label"
                class="px-0"
                @click="fillCredentials(cred)"
                style="cursor:pointer"
              >
                <template #prepend>
                  <v-chip :color="cred.color" size="x-small" class="mr-2">{{ cred.role }}</v-chip>
                </template>
              </v-list-item>
            </v-list>
            <p class="text-caption text-medium-emphasis mt-2">Haz clic en un rol para autocompletar</p>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LemonLogo from '@/components/common/LemonLogo.vue'

const auth = useAuthStore()
const router = useRouter()
const email = ref('')
const password = ref('')
const showPass = ref(false)
const loading = ref(false)
const error = ref('')
const formRef = ref(null)

const credentials = [
  { role: 'Admin',      label: 'Administrador',    email: 'admin@lemonsys.com',      pass: 'admin123',    color: 'primary' },
  { role: 'Prod.',      label: 'Producción',        email: 'produccion@lemonsys.com', pass: 'prod123',     color: 'green' },
  { role: 'Logíst.',   label: 'Logística',          email: 'logistica@lemonsys.com',  pass: 'logis123',    color: 'blue' },
  { role: 'Ventas',    label: 'Vendedor',            email: 'ventas@lemonsys.com',     pass: 'ventas123',   color: 'orange' },
  { role: 'Finanzas',  label: 'Finanzas',            email: 'finanzas@lemonsys.com',   pass: 'finanzas123', color: 'purple' },
]

function fillCredentials(cred) {
  email.value = cred.email
  password.value = cred.pass
}

async function handleLogin() {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  loading.value = true
  error.value = ''
  try {
    await auth.login(email.value, password.value)
    router.push('/dashboard')
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-card { backdrop-filter: blur(10px); }
</style>

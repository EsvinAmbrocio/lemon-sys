import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const lemonTheme = {
  dark: false,
  colors: {
    primary: '#2E7D32',
    'primary-darken-1': '#1B5E20',
    secondary: '#8BC34A',
    'secondary-darken-1': '#558B2F',
    accent: '#CDDC39',
    background: '#F9FBE7',
    surface: '#FFFFFF',
    error: '#D32F2F',
    warning: '#F9A825',
    info: '#0288D1',
    success: '#388E3C',
    'on-primary': '#FFFFFF',
    'on-secondary': '#FFFFFF',
  }
}

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'lemonTheme',
    themes: { lemonTheme }
  },
  defaults: {
    VBtn: { variant: 'elevated', rounded: 'lg' },
    VCard: { rounded: 'xl', elevation: 2 },
    VTextField: { variant: 'outlined', density: 'comfortable' },
    VSelect: { variant: 'outlined', density: 'comfortable' },
    VTextarea: { variant: 'outlined', density: 'comfortable' },
    VAutocomplete: { variant: 'outlined', density: 'comfortable' },
  }
})

import { ref, computed, onMounted } from 'vue'
import db from '@/db/db'
import { addDays } from 'date-fns'

const alertsCache = ref({ expiringSoon: 0, expired: 0, lowStock: 0, overdueAR: 0 })

export function useAlerts() {
  const total = computed(() => alertsCache.value.expiringSoon + alertsCache.value.expired + alertsCache.value.lowStock)
  const alertCount = computed(() => total.value > 99 ? '99+' : total.value || null)

  async function refresh() {
    const now = new Date()
    const in30 = addDays(now, 30)
    const batches = await db.batches.toArray()

    let expiringSoon = 0, expired = 0
    for (const b of batches) {
      if (b.available <= 0) continue
      if (new Date(b.expiryDate) < now) expired++
      else if (new Date(b.expiryDate) <= in30) expiringSoon++
    }

    const products = await db.products.toArray()
    const presentations = await db.presentations.toArray()
    let lowStock = 0
    for (const p of products) {
      if (!p.active) continue
      const pres = presentations.filter(pr => pr.productId === p.id)
      for (const pr of pres) {
        const stock = batches.filter(b => b.presentationId === pr.id && new Date(b.expiryDate) >= now).reduce((s, b) => s + (b.available || 0), 0)
        if (stock < (p.minStock || 50)) lowStock++
      }
    }

    const overdue = await db.accountsReceivable.where('status').equals('vencida').count()
    alertsCache.value = { expiringSoon, expired, lowStock, overdueAR: overdue }
  }

  onMounted(refresh)
  return { alerts: alertsCache, alertCount, refresh }
}

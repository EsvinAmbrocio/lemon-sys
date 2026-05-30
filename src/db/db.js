import Dexie from 'dexie'

export const db = new Dexie('LemonSysDB')

db.version(2).stores({
  users:               '++id, email, role, department, active',
  categories:          '++id, name, active',
  units:               '++id, name, abbr',
  zones:               '++id, name, active',
  priceLists:          '++id, name, active',
  products:            '++id, code, name, categoryId, type, active',
  presentations:       '++id, productId, description, unit, unitId',
  batches:             '++id, presentationId, productId, lotNumber, entryDate, expiryDate, quantity, available, purchaseOrderId',
  stockMovements:      '++id, productId, presentationId, batchId, type, date, userId, reference',
  suppliers:           '++id, name, nit, active',
  purchaseOrders:      '++id, supplierId, status, paymentType, date, dueDate',
  purchaseOrderItems:  '++id, purchaseOrderId, productId, presentationId',
  serviceInvoices:     '++id, supplierId, invoiceNumber, serviceType, date, dueDate, status, paymentType',
  recipes:             '++id, productId, version, active',
  recipeItems:         '++id, recipeId, inputProductId, quantity, unit',
  customers:           '++id, name, nit, zoneId, priceListId, paymentType, active',
  salesOrders:         '++id, customerId, status, deliveryType, date, userId, zoneId',
  salesOrderItems:     '++id, salesOrderId, productId, presentationId',
  invoices:            '++id, salesOrderId, customerId, date, status',
  promotions:          '++id, type, active',
  accountsReceivable:  '++id, invoiceId, customerId, dueDate, status',
  accountsPayable:     '++id, purchaseOrderId, supplierId, dueDate, status',
  expenses:            '++id, category, date, userId',
  cashMovements:       '++id, type, refType, refId, date',
  tourProgress:        '++id, userId, module, completed',
})

export default db

import db from './db'
import { subMonths, subDays, addDays, format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'

const now = new Date()

function daysAgo(d) { return subDays(now, d) }
function monthsAgo(m) { return subMonths(now, m) }
function daysFromNow(d) { return addDays(now, d) }

export async function seedDatabase() {
  const existing = await db.users.count()
  if (existing > 0) return

  // ─── USERS ────────────────────────────────────────────────────
  await db.users.bulkAdd([
    { name: 'Administrador',     email: 'admin@lemonsys.com',      password: 'admin123',      role: 'admin',      department: 'Administración', active: true },
    { name: 'Carlos Producción', email: 'produccion@lemonsys.com', password: 'prod123',       role: 'produccion', department: 'Producción',     active: true },
    { name: 'María Logística',   email: 'logistica@lemonsys.com',  password: 'logis123',      role: 'logistica',  department: 'Logística',      active: true },
    { name: 'Pedro Ventas',      email: 'ventas@lemonsys.com',     password: 'ventas123',     role: 'ventas',     department: 'Ventas',         active: true },
    { name: 'Ana Finanzas',      email: 'finanzas@lemonsys.com',   password: 'finanzas123',   role: 'finanzas',   department: 'Finanzas',       active: true },
  ])

  // ─── CATEGORIES ───────────────────────────────────────────────
  // Categorías de VENTA
  await db.categories.bulkAdd([
    { name: 'Bebidas Base Limón', active: true },  // 1
    { name: 'Galletas',          active: true },  // 2
    { name: 'Gelatina',          active: true },  // 3
    { name: 'Mermelada',         active: true },  // 4
    { name: 'Jarabe',            active: true },  // 5
    { name: 'Dulces',            active: true },  // 6
    { name: 'Snacks',            active: true },  // 7
    // Categorías de COMPRA (insumos)
    { name: 'Frutas y Cítricos', active: true },  // 8
    { name: 'Ingredientes Base', active: true },  // 9
    { name: 'Envases y Empaques',active: true },  // 10
    { name: 'Aditivos',          active: true },  // 11
  ])

  // ─── UNITS ────────────────────────────────────────────────────
  await db.units.bulkAdd([
    { name: 'Mililitros',  abbr: 'ml' },
    { name: 'Litros',      abbr: 'L'  },
    { name: 'Gramos',      abbr: 'gr' },
    { name: 'Kilogramos',  abbr: 'kg' },
    { name: 'Pieza',       abbr: 'pza'},
    { name: 'Caja',        abbr: 'cja'},
  ])

  // ─── ZONES ────────────────────────────────────────────────────
  await db.zones.bulkAdd([
    { name: 'Zona Norte',  active: true },
    { name: 'Zona Sur',    active: true },
    { name: 'Zona Centro', active: true },
    { name: 'Zona Este',   active: true },
    { name: 'Zona Oeste',  active: true },
  ])

  // ─── PRICE LISTS ──────────────────────────────────────────────
  await db.priceLists.bulkAdd([
    { name: 'Lista A — Grandes Cadenas',  multiplier: 1.0,  active: true },
    { name: 'Lista B — Distribuidores',   multiplier: 1.10, active: true },
    { name: 'Lista C — Tiendas Medianas', multiplier: 1.20, active: true },
    { name: 'Lista D — Tiendas de Barrio',multiplier: 1.30, active: true },
  ])

  // ─── PRODUCTS ─────────────────────────────────────────────────
  // IDs 1-30: productos de VENTA (terminados)
  // IDs 31-45: productos de COMPRA (insumos / materias primas)
  const products = [
    // ── VENTA: Bebidas Base Limón (cat 1) ──────────────── id 1-7
    { code: 'BEV-001', name: 'Jugo de Limón Natural',       categoryId: 1, type: 'venta', buyPrice: 12.00, baseSellPrice: 18.00, active: true },
    { code: 'BEV-002', name: 'Refresco de Limón',           categoryId: 1, type: 'venta', buyPrice: 8.50,  baseSellPrice: 14.00, active: true },
    { code: 'BEV-003', name: 'Limonada Concentrada',        categoryId: 1, type: 'venta', buyPrice: 15.00, baseSellPrice: 24.00, active: true },
    { code: 'BEV-004', name: 'Agua de Limón con Chía',      categoryId: 1, type: 'venta', buyPrice: 10.00, baseSellPrice: 16.50, active: true },
    { code: 'BEV-005', name: 'Bebida Energética Limón',     categoryId: 1, type: 'venta', buyPrice: 18.00, baseSellPrice: 28.00, active: true },
    { code: 'BEV-006', name: 'Té Frío de Limón',            categoryId: 1, type: 'venta', buyPrice: 9.00,  baseSellPrice: 15.00, active: true },
    { code: 'BEV-007', name: 'Agua Mineralizada Limón',     categoryId: 1, type: 'venta', buyPrice: 7.00,  baseSellPrice: 12.00, active: true },
    // ── VENTA: Galletas (cat 2) ────────────────────────── id 8-11
    { code: 'GAL-001', name: 'Galletas de Limón',           categoryId: 2, type: 'venta', buyPrice: 6.00,  baseSellPrice: 10.00, active: true },
    { code: 'GAL-002', name: 'Galletas Rellenas Limón',     categoryId: 2, type: 'venta', buyPrice: 8.00,  baseSellPrice: 13.50, active: true },
    { code: 'GAL-003', name: 'Galletas Integrales Limón',   categoryId: 2, type: 'venta', buyPrice: 9.00,  baseSellPrice: 15.00, active: true },
    { code: 'GAL-004', name: 'Galletas Mini Limón',         categoryId: 2, type: 'venta', buyPrice: 5.00,  baseSellPrice: 8.50,  active: true },
    // ── VENTA: Gelatina (cat 3) ────────────────────────── id 12-13
    { code: 'GEL-001', name: 'Gelatina Sabor Limón',        categoryId: 3, type: 'venta', buyPrice: 4.50,  baseSellPrice: 7.50,  active: true },
    { code: 'GEL-002', name: 'Gelatina Limón Sin Azúcar',   categoryId: 3, type: 'venta', buyPrice: 5.00,  baseSellPrice: 8.50,  active: true },
    // ── VENTA: Mermelada (cat 4) ───────────────────────── id 14-15
    { code: 'MER-001', name: 'Mermelada de Limón',          categoryId: 4, type: 'venta', buyPrice: 14.00, baseSellPrice: 22.00, active: true },
    { code: 'MER-002', name: 'Mermelada Limón-Jengibre',    categoryId: 4, type: 'venta', buyPrice: 16.00, baseSellPrice: 26.00, active: true },
    // ── VENTA: Jarabe (cat 5) ──────────────────────────── id 16-19
    { code: 'JAR-001', name: 'Jarabe de Limón 500ml',       categoryId: 5, type: 'venta', buyPrice: 20.00, baseSellPrice: 32.00, active: true },
    { code: 'JAR-002', name: 'Jarabe de Limón 1L',          categoryId: 5, type: 'venta', buyPrice: 35.00, baseSellPrice: 56.00, active: true },
    { code: 'JAR-003', name: 'Jarabe Limón-Menta',          categoryId: 5, type: 'venta', buyPrice: 22.00, baseSellPrice: 35.00, active: true },
    { code: 'JAR-004', name: 'Jarabe Limón-Rosa 250ml',     categoryId: 5, type: 'venta', buyPrice: 18.00, baseSellPrice: 29.00, active: true },
    // ── VENTA: Dulces (cat 6) ──────────────────────────── id 20-24
    { code: 'DUL-001', name: 'Dulce de Limón Enchilado',    categoryId: 6, type: 'venta', buyPrice: 3.00,  baseSellPrice: 5.50,  active: true },
    { code: 'DUL-002', name: 'Paleta de Limón',             categoryId: 6, type: 'venta', buyPrice: 2.50,  baseSellPrice: 4.50,  active: true },
    { code: 'DUL-003', name: 'Tamarindo con Limón',         categoryId: 6, type: 'venta', buyPrice: 4.00,  baseSellPrice: 7.00,  active: true },
    { code: 'DUL-004', name: 'Gomas de Limón',              categoryId: 6, type: 'venta', buyPrice: 5.50,  baseSellPrice: 9.00,  active: true },
    { code: 'DUL-005', name: 'Mazapán de Limón',            categoryId: 6, type: 'venta', buyPrice: 3.50,  baseSellPrice: 6.00,  active: true },
    // ── VENTA: Snacks (cat 7) ──────────────────────────── id 25-30
    { code: 'SNK-001', name: 'Papas con Limón y Sal',       categoryId: 7, type: 'venta', buyPrice: 7.00,  baseSellPrice: 12.00, active: true },
    { code: 'SNK-002', name: 'Botana de Maíz Limón',        categoryId: 7, type: 'venta', buyPrice: 6.00,  baseSellPrice: 10.00, active: true },
    { code: 'SNK-003', name: 'Cacahuates Limón-Chile',      categoryId: 7, type: 'venta', buyPrice: 8.00,  baseSellPrice: 13.00, active: true },
    { code: 'SNK-004', name: 'Chicharrón de Limón',         categoryId: 7, type: 'venta', buyPrice: 5.00,  baseSellPrice: 9.00,  active: true },
    { code: 'SNK-005', name: 'Mix Snack Limón',             categoryId: 7, type: 'venta', buyPrice: 10.00, baseSellPrice: 16.00, active: true },
    { code: 'SNK-006', name: 'Tostadas Limón',              categoryId: 7, type: 'venta', buyPrice: 6.50,  baseSellPrice: 11.00, active: true },
    // ── COMPRA: Frutas y Cítricos (cat 8) ─────────────── id 31-34
    { code: 'INS-001', name: 'Limón Persa (kg)',             categoryId: 8, type: 'compra', buyPrice: 4.50,  baseSellPrice: 0, active: true },
    { code: 'INS-002', name: 'Limón Criollo (kg)',           categoryId: 8, type: 'compra', buyPrice: 3.80,  baseSellPrice: 0, active: true },
    { code: 'INS-003', name: 'Jengibre fresco (kg)',         categoryId: 8, type: 'compra', buyPrice: 12.00, baseSellPrice: 0, active: true },
    { code: 'INS-004', name: 'Tamarindo natural (kg)',       categoryId: 8, type: 'compra', buyPrice: 18.00, baseSellPrice: 0, active: true },
    // ── COMPRA: Ingredientes Base (cat 9) ─────────────── id 35-39
    { code: 'INS-005', name: 'Azúcar estándar (kg)',         categoryId: 9, type: 'compra', buyPrice: 5.20,  baseSellPrice: 0, active: true },
    { code: 'INS-006', name: 'Azúcar glass (kg)',            categoryId: 9, type: 'compra', buyPrice: 7.00,  baseSellPrice: 0, active: true },
    { code: 'INS-007', name: 'Harina de trigo (kg)',         categoryId: 9, type: 'compra', buyPrice: 4.80,  baseSellPrice: 0, active: true },
    { code: 'INS-008', name: 'Grenetina (kg)',               categoryId: 9, type: 'compra', buyPrice: 55.00, baseSellPrice: 0, active: true },
    { code: 'INS-009', name: 'Agua purificada (L)',          categoryId: 9, type: 'compra', buyPrice: 0.80,  baseSellPrice: 0, active: true },
    // ── COMPRA: Envases y Empaques (cat 10) ───────────── id 40-43
    { code: 'ENV-001', name: 'Botella PET 500ml (pza)',      categoryId: 10, type: 'compra', buyPrice: 1.20,  baseSellPrice: 0, active: true },
    { code: 'ENV-002', name: 'Botella PET 1L (pza)',         categoryId: 10, type: 'compra', buyPrice: 1.80,  baseSellPrice: 0, active: true },
    { code: 'ENV-003', name: 'Frasco vidrio 250ml (pza)',    categoryId: 10, type: 'compra', buyPrice: 3.50,  baseSellPrice: 0, active: true },
    { code: 'ENV-004', name: 'Bolsa sellable 100gr (pza)',   categoryId: 10, type: 'compra', buyPrice: 0.60,  baseSellPrice: 0, active: true },
    // ── COMPRA: Aditivos (cat 11) ─────────────────────── id 44-45
    { code: 'ADT-001', name: 'Ácido cítrico (kg)',           categoryId: 11, type: 'compra', buyPrice: 28.00, baseSellPrice: 0, active: true },
    { code: 'ADT-002', name: 'Conservante benzoato (kg)',    categoryId: 11, type: 'compra', buyPrice: 42.00, baseSellPrice: 0, active: true },
  ]
  await db.products.bulkAdd(products)

  // ─── PRESENTATIONS ────────────────────────────────────────────
  // Solo para productos de VENTA (ids 1-30)
  const presentations = [
    // Bebidas (1-7)
    { productId:1,  description:'Botella 500ml',   unit:'ml',  unitId:1, unitsPerBox:24 },
    { productId:1,  description:'Botella 1L',      unit:'L',   unitId:2, unitsPerBox:12 },
    { productId:2,  description:'Lata 355ml',      unit:'ml',  unitId:1, unitsPerBox:24 },
    { productId:2,  description:'Botella 600ml',   unit:'ml',  unitId:1, unitsPerBox:24 },
    { productId:3,  description:'Frasco 500ml',    unit:'ml',  unitId:1, unitsPerBox:24 },
    { productId:3,  description:'Frasco 1L',       unit:'L',   unitId:2, unitsPerBox:12 },
    { productId:4,  description:'Botella 500ml',   unit:'ml',  unitId:1, unitsPerBox:24 },
    { productId:5,  description:'Lata 473ml',      unit:'ml',  unitId:1, unitsPerBox:24 },
    { productId:6,  description:'Botella 500ml',   unit:'ml',  unitId:1, unitsPerBox:24 },
    { productId:7,  description:'Botella 600ml',   unit:'ml',  unitId:1, unitsPerBox:24 },
    // Galletas (8-11)
    { productId:8,  description:'Paquete 100gr',   unit:'gr',  unitId:3, unitsPerBox:20 },
    { productId:8,  description:'Paquete 200gr',   unit:'gr',  unitId:3, unitsPerBox:12 },
    { productId:9,  description:'Paquete 135gr',   unit:'gr',  unitId:3, unitsPerBox:20 },
    { productId:10, description:'Paquete 150gr',   unit:'gr',  unitId:3, unitsPerBox:20 },
    { productId:11, description:'Paquete 100gr',   unit:'gr',  unitId:3, unitsPerBox:20 },
    // Gelatina (12-13)
    { productId:12, description:'Sobre 90gr',      unit:'gr',  unitId:3, unitsPerBox:36 },
    { productId:13, description:'Sobre 80gr',      unit:'gr',  unitId:3, unitsPerBox:36 },
    // Mermelada (14-15)
    { productId:14, description:'Frasco 250gr',    unit:'gr',  unitId:3, unitsPerBox:24 },
    { productId:14, description:'Frasco 500gr',    unit:'gr',  unitId:3, unitsPerBox:12 },
    { productId:15, description:'Frasco 300gr',    unit:'gr',  unitId:3, unitsPerBox:20 },
    // Jarabe (16-19)
    { productId:16, description:'Botella 500ml',   unit:'ml',  unitId:1, unitsPerBox:24 },
    { productId:17, description:'Botella 1L',      unit:'L',   unitId:2, unitsPerBox:12 },
    { productId:18, description:'Botella 500ml',   unit:'ml',  unitId:1, unitsPerBox:24 },
    { productId:19, description:'Botella 250ml',   unit:'ml',  unitId:1, unitsPerBox:24 },
    // Dulces (20-24)
    { productId:20, description:'Bolsa 50pzas',    unit:'pza', unitId:5, unitsPerBox:20 },
    { productId:21, description:'Bolsa 12pzas',    unit:'pza', unitId:5, unitsPerBox:24 },
    { productId:22, description:'Bolsa 100gr',     unit:'gr',  unitId:3, unitsPerBox:24 },
    { productId:23, description:'Bolsa 200gr',     unit:'gr',  unitId:3, unitsPerBox:20 },
    { productId:24, description:'Paquete 30gr',    unit:'gr',  unitId:3, unitsPerBox:36 },
    // Snacks (25-30)
    { productId:25, description:'Bolsa 100gr',     unit:'gr',  unitId:3, unitsPerBox:20 },
    { productId:26, description:'Bolsa 90gr',      unit:'gr',  unitId:3, unitsPerBox:20 },
    { productId:27, description:'Bolsa 120gr',     unit:'gr',  unitId:3, unitsPerBox:20 },
    { productId:28, description:'Bolsa 80gr',      unit:'gr',  unitId:3, unitsPerBox:20 },
    { productId:29, description:'Bolsa Mix 150gr', unit:'gr',  unitId:3, unitsPerBox:16 },
    { productId:30, description:'Paquete 120gr',   unit:'gr',  unitId:3, unitsPerBox:20 },
  ]
  await db.presentations.bulkAdd(presentations)

  // ─── SUPPLIERS ────────────────────────────────────────────────
  await db.suppliers.bulkAdd([
    { name: 'Agroindustrias Cítricos S.A.',   nit: '1234567-8', contact: 'Ramón Vega',   phone: '2345-1001', email: 'ventas@agrocitricos.gt',   paymentDays: 30, active: true },
    { name: 'Distribuidora Frutas del Valle', nit: '2345678-9', contact: 'Laura Pérez',  phone: '2345-2002', email: 'info@frutasvalle.gt',       paymentDays: 15, active: true },
    { name: 'Empaques y Envases Modernos',    nit: '3456789-0', contact: 'Jorge Torres',  phone: '2345-3003', email: 'pedidos@empaquesmod.gt',    paymentDays: 30, active: true },
    { name: 'Ingredientes Naturales GT',      nit: '4567890-1', contact: 'Sofia Ríos',   phone: '2345-4004', email: 'sofia@ingredientesgt.com',  paymentDays: 45, active: true },
    { name: 'Proveedora Nacional Alimentos',  nit: '5678901-2', contact: 'Miguel Salinas', phone: '2345-5005', email: 'miguel@provnacional.gt',   paymentDays: 30, active: true },
  ])

  // ─── CUSTOMERS ────────────────────────────────────────────────
  await db.customers.bulkAdd([
    { name: 'Walmart Supercenter Norte',  nit: '6789012-3', phone: '2345-8001', email: 'compras.norte@walmart.com.gt',  address: 'Av. Las Torres 100, Zona 10',     zoneId: 1, priceListId: 1, paymentType: 'credito', creditDays: 60,  creditLimit: 150000, active: true },
    { name: 'La Torre Distribuciones',   nit: '7890123-4', phone: '2345-8002', email: 'pedidos@latorre.gt',              address: 'Blvd. Los Próceres 450, Zona 10', zoneId: 3, priceListId: 1, paymentType: 'credito', creditDays: 45,  creditLimit: 100000, active: true },
    { name: 'Supermercados El Ahorro',   nit: '8901234-5', phone: '2345-8003', email: 'compras@elahorro.gt',             address: 'Calzada Roosevelt 22, Zona 7',    zoneId: 2, priceListId: 2, paymentType: 'credito', creditDays: 30,  creditLimit: 60000,  active: true },
    { name: 'Mini Super La Esquina',     nit: 'CF',        phone: '2345-8004', email: 'laesquina@gmail.com',             address: 'Col. Centro #5, Zona 3',          zoneId: 3, priceListId: 4, paymentType: 'contado', creditDays: 0,   creditLimit: 0,      active: true },
    { name: 'Tienda Don Pepe',           nit: 'CF',        phone: '2345-8005', email: 'donpepe@hotmail.com',             address: 'Barrio San José #12, Mixco',      zoneId: 4, priceListId: 4, paymentType: 'contado', creditDays: 0,   creditLimit: 0,      active: true },
    { name: 'Abarrotes La Familia',      nit: '9012345-6', phone: '2345-8006', email: 'lafamilia@gmail.com',             address: 'Villa Nueva, Zona 1',             zoneId: 5, priceListId: 3, paymentType: 'credito', creditDays: 15,  creditLimit: 20000,  active: true },
    { name: 'Distribuidora Del Norte',   nit: '0123456-7', phone: '2345-8007', email: 'delnorte@distribuidora.gt',       address: 'Zona Industrial, Zona 12',        zoneId: 1, priceListId: 2, paymentType: 'credito', creditDays: 30,  creditLimit: 80000,  active: true },
    { name: 'Minisuper Los Pinos',       nit: 'CF',        phone: '2345-8008', email: 'lospinos@gmail.com',              address: 'Col. Los Pinos, Zona 6',          zoneId: 2, priceListId: 3, paymentType: 'contado', creditDays: 0,   creditLimit: 0,      active: true },
  ])

  // ─── BATCHES (lotes de inventario) ───────────────────────────
  // Cubre los 30 productos de venta (id 1-30)
  // presentationId mapeo: ver sección PRESENTATIONS arriba
  // Algunos lotes próximos a vencer (alerta 30 días) y uno vencido para demo
  const batchData = [
    // ── Bebidas (productos 1-7) ────────────────────────────────────
    // Jugo de Limón Natural — id 1, pres 1 (500ml) y pres 2 (1L)
    { productId:1,  presentationId:1,  lotNumber:'L2024-001', entryDate:monthsAgo(4), expiryDate:daysFromNow(180), quantity:500, available:320 },
    { productId:1,  presentationId:1,  lotNumber:'L2024-002', entryDate:monthsAgo(2), expiryDate:daysFromNow(240), quantity:400, available:280 },
    { productId:1,  presentationId:2,  lotNumber:'L2024-003', entryDate:monthsAgo(3), expiryDate:daysFromNow(150), quantity:200, available:140 },
    // Refresco de Limón — id 2, pres 3 (Lata 355ml) y pres 4 (600ml)
    { productId:2,  presentationId:3,  lotNumber:'L2024-010', entryDate:monthsAgo(4), expiryDate:daysFromNow(25),  quantity:600, available:80  }, // ⚠ próximo a vencer
    { productId:2,  presentationId:3,  lotNumber:'L2024-011', entryDate:monthsAgo(1), expiryDate:daysFromNow(200), quantity:600, available:500 },
    { productId:2,  presentationId:4,  lotNumber:'L2024-012', entryDate:monthsAgo(2), expiryDate:daysFromNow(190), quantity:300, available:210 },
    // Limonada Concentrada — id 3, pres 5 y 6
    { productId:3,  presentationId:5,  lotNumber:'L2024-020', entryDate:monthsAgo(3), expiryDate:daysFromNow(270), quantity:300, available:200 },
    { productId:3,  presentationId:6,  lotNumber:'L2024-021', entryDate:monthsAgo(1), expiryDate:daysFromNow(300), quantity:150, available:130 },
    // Agua de Limón con Chía — id 4, pres 7
    { productId:4,  presentationId:7,  lotNumber:'L2024-030', entryDate:monthsAgo(2), expiryDate:daysFromNow(-5),  quantity:200, available:0   }, // ❌ vencido
    { productId:4,  presentationId:7,  lotNumber:'L2024-031', entryDate:monthsAgo(1), expiryDate:daysFromNow(220), quantity:300, available:250 },
    // Bebida Energética Limón — id 5, pres 8
    { productId:5,  presentationId:8,  lotNumber:'L2024-040', entryDate:monthsAgo(2), expiryDate:daysFromNow(300), quantity:400, available:350 },
    { productId:5,  presentationId:8,  lotNumber:'L2024-041', entryDate:monthsAgo(1), expiryDate:daysFromNow(310), quantity:350, available:340 },
    // Té Frío de Limón — id 6, pres 9
    { productId:6,  presentationId:9,  lotNumber:'L2024-050', entryDate:monthsAgo(3), expiryDate:daysFromNow(120), quantity:500, available:300 },
    { productId:6,  presentationId:9,  lotNumber:'L2024-051', entryDate:monthsAgo(1), expiryDate:daysFromNow(180), quantity:400, available:380 },
    // Agua Mineralizada Limón — id 7, pres 10
    { productId:7,  presentationId:10, lotNumber:'L2024-060', entryDate:monthsAgo(2), expiryDate:daysFromNow(90),  quantity:300, available:200 },
    { productId:7,  presentationId:10, lotNumber:'L2024-061', entryDate:monthsAgo(1), expiryDate:daysFromNow(180), quantity:400, available:390 },
    // ── Galletas (productos 8-11) ──────────────────────────────────
    // Galletas de Limón — id 8, pres 11 (100gr) y 12 (200gr)
    { productId:8,  presentationId:11, lotNumber:'L2024-070', entryDate:monthsAgo(2), expiryDate:daysFromNow(150), quantity:400, available:300 },
    { productId:8,  presentationId:11, lotNumber:'L2024-071', entryDate:monthsAgo(1), expiryDate:daysFromNow(180), quantity:350, available:320 },
    { productId:8,  presentationId:12, lotNumber:'L2024-072', entryDate:monthsAgo(1), expiryDate:daysFromNow(160), quantity:200, available:180 },
    // Galletas Rellenas — id 9, pres 13
    { productId:9,  presentationId:13, lotNumber:'L2024-080', entryDate:monthsAgo(3), expiryDate:daysFromNow(28),  quantity:600, available:150 }, // ⚠ próximo a vencer
    { productId:9,  presentationId:13, lotNumber:'L2024-081', entryDate:monthsAgo(1), expiryDate:daysFromNow(365), quantity:600, available:580 },
    // Galletas Integrales — id 10, pres 14
    { productId:10, presentationId:14, lotNumber:'L2024-090', entryDate:monthsAgo(2), expiryDate:daysFromNow(200), quantity:350, available:280 },
    // Galletas Mini — id 11, pres 15
    { productId:11, presentationId:15, lotNumber:'L2024-100', entryDate:monthsAgo(2), expiryDate:daysFromNow(180), quantity:500, available:420 },
    { productId:11, presentationId:15, lotNumber:'L2024-101', entryDate:monthsAgo(1), expiryDate:daysFromNow(200), quantity:400, available:390 },
    // ── Gelatinas (productos 12-13) ────────────────────────────────
    // Gelatina Sabor Limón — id 12, pres 16
    { productId:12, presentationId:16, lotNumber:'L2024-110', entryDate:monthsAgo(3), expiryDate:daysFromNow(300), quantity:700, available:500 },
    { productId:12, presentationId:16, lotNumber:'L2024-111', entryDate:monthsAgo(1), expiryDate:daysFromNow(365), quantity:600, available:590 },
    // Gelatina Sin Azúcar — id 13, pres 17
    { productId:13, presentationId:17, lotNumber:'L2024-120', entryDate:monthsAgo(2), expiryDate:daysFromNow(300), quantity:400, available:380 },
    // ── Mermeladas (productos 14-15) ───────────────────────────────
    // Mermelada de Limón — id 14, pres 18 (250gr) y 19 (500gr)
    { productId:14, presentationId:18, lotNumber:'L2024-130', entryDate:monthsAgo(4), expiryDate:daysFromNow(200), quantity:300, available:180 },
    { productId:14, presentationId:18, lotNumber:'L2024-131', entryDate:monthsAgo(1), expiryDate:daysFromNow(365), quantity:250, available:240 },
    { productId:14, presentationId:19, lotNumber:'L2024-132', entryDate:monthsAgo(2), expiryDate:daysFromNow(280), quantity:200, available:160 },
    // Mermelada Limón-Jengibre — id 15, pres 20
    { productId:15, presentationId:20, lotNumber:'L2024-140', entryDate:monthsAgo(2), expiryDate:daysFromNow(270), quantity:200, available:160 },
    { productId:15, presentationId:20, lotNumber:'L2024-141', entryDate:monthsAgo(1), expiryDate:daysFromNow(300), quantity:180, available:175 },
    // ── Jarabes (productos 16-19) ──────────────────────────────────
    // Jarabe de Limón 500ml — id 16, pres 21
    { productId:16, presentationId:21, lotNumber:'L2024-150', entryDate:monthsAgo(3), expiryDate:daysFromNow(365), quantity:400, available:320 },
    { productId:16, presentationId:21, lotNumber:'L2024-151', entryDate:monthsAgo(1), expiryDate:daysFromNow(400), quantity:350, available:340 },
    // Jarabe de Limón 1L — id 17, pres 22
    { productId:17, presentationId:22, lotNumber:'L2024-160', entryDate:monthsAgo(2), expiryDate:daysFromNow(400), quantity:200, available:160 },
    // Jarabe Limón-Menta — id 18, pres 23
    { productId:18, presentationId:23, lotNumber:'L2024-170', entryDate:monthsAgo(2), expiryDate:daysFromNow(365), quantity:300, available:270 },
    // Jarabe Limón-Rosa — id 19, pres 24
    { productId:19, presentationId:24, lotNumber:'L2024-180', entryDate:monthsAgo(1), expiryDate:daysFromNow(390), quantity:250, available:240 },
    // ── Dulces (productos 20-24) ───────────────────────────────────
    // Dulce Enchilado — id 20, pres 25
    { productId:20, presentationId:25, lotNumber:'L2024-190', entryDate:monthsAgo(2), expiryDate:daysFromNow(240), quantity:800, available:650 },
    { productId:20, presentationId:25, lotNumber:'L2024-191', entryDate:monthsAgo(1), expiryDate:daysFromNow(270), quantity:600, available:590 },
    // Paleta de Limón — id 21, pres 26
    { productId:21, presentationId:26, lotNumber:'L2024-200', entryDate:monthsAgo(2), expiryDate:daysFromNow(200), quantity:500, available:420 },
    { productId:21, presentationId:26, lotNumber:'L2024-201', entryDate:monthsAgo(1), expiryDate:daysFromNow(220), quantity:480, available:470 },
    // Tamarindo con Limón — id 22, pres 27
    { productId:22, presentationId:27, lotNumber:'L2024-210', entryDate:monthsAgo(1), expiryDate:daysFromNow(180), quantity:400, available:380 },
    // Gomas de Limón — id 23, pres 28
    { productId:23, presentationId:28, lotNumber:'L2024-220', entryDate:monthsAgo(2), expiryDate:daysFromNow(180), quantity:600, available:520 },
    // Mazapán de Limón — id 24, pres 29
    { productId:24, presentationId:29, lotNumber:'L2024-230', entryDate:monthsAgo(1), expiryDate:daysFromNow(150), quantity:700, available:660 },
    { productId:24, presentationId:29, lotNumber:'L2024-231', entryDate:monthsAgo(3), expiryDate:daysFromNow(20),  quantity:300, available:40  }, // ⚠ próximo a vencer
    // ── Snacks (productos 25-30) ───────────────────────────────────
    // Papas con Limón — id 25, pres 30
    { productId:25, presentationId:30, lotNumber:'L2024-240', entryDate:monthsAgo(2), expiryDate:daysFromNow(240), quantity:500, available:420 },
    { productId:25, presentationId:30, lotNumber:'L2024-241', entryDate:monthsAgo(1), expiryDate:daysFromNow(260), quantity:450, available:440 },
    // Botana de Maíz Limón — id 26, pres 31
    { productId:26, presentationId:31, lotNumber:'L2024-250', entryDate:monthsAgo(2), expiryDate:daysFromNow(210), quantity:450, available:380 },
    // Cacahuates Limón-Chile — id 27, pres 32
    { productId:27, presentationId:32, lotNumber:'L2024-260', entryDate:monthsAgo(1), expiryDate:daysFromNow(270), quantity:400, available:370 },
    { productId:27, presentationId:32, lotNumber:'L2024-261', entryDate:monthsAgo(3), expiryDate:daysFromNow(15),  quantity:200, available:60  }, // ⚠ próximo a vencer
    // Chicharrón de Limón — id 28, pres 33
    { productId:28, presentationId:33, lotNumber:'L2024-270', entryDate:monthsAgo(1), expiryDate:daysFromNow(180), quantity:350, available:310 },
    // Mix Snack Limón — id 29, pres 34
    { productId:29, presentationId:34, lotNumber:'L2024-280', entryDate:monthsAgo(2), expiryDate:daysFromNow(200), quantity:300, available:250 },
    // Tostadas Limón — id 30, pres 35
    { productId:30, presentationId:35, lotNumber:'L2024-290', entryDate:monthsAgo(1), expiryDate:daysFromNow(190), quantity:400, available:370 },
    { productId:30, presentationId:35, lotNumber:'L2024-291', entryDate:monthsAgo(2), expiryDate:daysFromNow(170), quantity:300, available:220 },
  ]
  await db.batches.bulkAdd(batchData)

  // ─── HISTORICAL SALES (3 months + current) ───────────────────
  const customerIds = [1, 2, 3, 4, 5, 6, 7, 8]
  const userSalesId = 4 // vendedor
  let salesId = 1
  let invoiceId = 1
  let arId = 1
  let cashId = 1

  const salesList = []
  const salesItemsList = []
  const invoicesList = []
  const arList = []
  const cashList = []

  // Multiplicadores de volumen por mes — crecimiento exponencial ~30%/mes
  // mes -3 → × 0.40 | mes -2 → × 0.58 | mes -1 → × 0.82 | mes 0 → × 1.20
  const volMultipliers = [0.40, 0.58, 0.82, 1.20]

  for (let m = 3; m >= 0; m--) {
    const volMult = volMultipliers[3 - m]
    const monthStart = startOfMonth(subMonths(now, m))
    const monthEnd = m === 0 ? now : endOfMonth(subMonths(now, m))
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
    const saleDays = days.filter((_, i) => i % 2 === 0) // cada 2 días

    for (const day of saleDays) {
      const custId = customerIds[Math.floor(Math.random() * customerIds.length)]
      const numItems = Math.floor(Math.random() * 4) + 2  // 2-5 líneas por pedido mayorista
      const items = []
      let subtotal = 0
      for (let i = 0; i < numItems; i++) {
        const pId = Math.floor(Math.random() * 15) + 1
        const presId = pId
        // Qty base 100-300 cajas escalado por multiplicador de crecimiento
        const baseQty = (Math.floor(Math.random() * 20) + 10) * 10
        const qty = Math.max(10, Math.round(baseQty * volMult / 10) * 10)
        const unitPrice = products[pId - 1].baseSellPrice * (1 + Math.random() * 0.1)
        subtotal += qty * unitPrice
        items.push({ salesOrderId: salesId, productId: pId, presentationId: presId, quantity: qty, unitPrice: parseFloat(unitPrice.toFixed(2)), subtotal: parseFloat((qty * unitPrice).toFixed(2)) })
      }
      const discount = Math.random() > 0.7 ? parseFloat((subtotal * 0.05).toFixed(2)) : 0
      const taxBase = subtotal - discount
      const tax = parseFloat((taxBase * 0.12).toFixed(2))
      const total = parseFloat((taxBase + tax).toFixed(2))
      const payType = custId <= 3 ? 'credito' : 'contado'

      salesList.push({ id: salesId, customerId: custId, status: 'completado', deliveryType: 'domicilio', date: day, userId: userSalesId, zoneId: Math.ceil(custId / 2), subtotal: parseFloat(subtotal.toFixed(2)), discount, tax, total, paymentType: payType, notes: '' })
      salesItemsList.push(...items)

      // CxC: solo 45% se cobra (empresa cobra mal — 40% vencida aprox)
      // dueDate extendido a 45 días (condiciones de crédito laxas, sin control)
      const invStatus = payType === 'contado' ? 'pagada' : (Math.random() > 0.55 ? 'pagada' : 'pendiente')
      invoicesList.push({ id: invoiceId, salesOrderId: salesId, customerId: custId, date: day, subtotal: parseFloat(subtotal.toFixed(2)), discount, tax, total, status: invStatus })

      if (payType === 'contado') {
        cashList.push({ id: cashId++, type: 'ingreso', refType: 'venta', refId: invoiceId, amount: total, date: day, description: `Venta contado cliente #${custId}` })
      } else {
        const paid = invStatus === 'pagada'
        // Vencida si pasaron más de 10 días del dueDate (dueDate = día + 45)
        const dueDate = addDays(day, 45)
        const isOverdue = !paid && dueDate < subDays(now, 10)
        arList.push({ id: arId++, invoiceId, customerId: custId, amount: total, dueDate, paidAmount: paid ? total : 0, status: paid ? 'pagada' : (isOverdue ? 'vencida' : 'pendiente') })
        if (paid) cashList.push({ id: cashId++, type: 'ingreso', refType: 'cxc', refId: arId - 1, amount: total, date: addDays(day, 20), description: `Cobro CxC cliente #${custId}` })
      }

      salesId++
      invoiceId++
    }
  }

  await db.salesOrders.bulkAdd(salesList)
  await db.salesOrderItems.bulkAdd(salesItemsList)
  await db.invoices.bulkAdd(invoicesList)
  await db.accountsReceivable.bulkAdd(arList)

  // ─── PURCHASE ORDERS ──────────────────────────────────────────
  const poList = []
  const poItemsList = []
  const apList = []
  let poId = 1
  let apId = 1

  for (let m = 3; m >= 0; m--) {
    for (let w = 0; w < 4; w++) {
      const d = subDays(subMonths(now, m), w * 7)
      const suppId = (poId % 5) + 1
      const numItems = Math.floor(Math.random() * 3) + 1
      let total = 0
      const items = []
      for (let i = 0; i < numItems; i++) {
        // Comprar solo insumos (ids 31-45, índices 30-44 en el array products)
        const insumoIdx = Math.floor(Math.random() * 15) + 30  // índice 30-44
        const pId = insumoIdx + 1  // productId 31-45
        const qty = (Math.floor(Math.random() * 10) + 5) * 10
        const cost = products[insumoIdx].buyPrice
        total += qty * cost
        items.push({ purchaseOrderId: poId, productId: pId, presentationId: null, quantity: qty, unitCost: cost, subtotal: parseFloat((qty * cost).toFixed(2)) })
      }
      total = parseFloat(total.toFixed(2))
      const payType = suppId <= 3 ? 'credito' : 'contado'
      const status = d < subDays(now, 3) ? 'recibida' : 'enviada'
      poList.push({ id: poId, supplierId: suppId, status, paymentType: payType, date: d, dueDate: addDays(d, 30), total })
      poItemsList.push(...items)

      if (payType === 'credito' && status === 'recibida') {
        // Solo 45% paga a tiempo — presión de caja por crecimiento
        const paid = Math.random() > 0.55
        apList.push({ id: apId++, purchaseOrderId: poId, supplierId: suppId, amount: total, dueDate: addDays(d, 30), paidAmount: paid ? total : 0, status: paid ? 'pagada' : (d < subDays(now, 30) ? 'vencida' : 'pendiente') })
        if (paid) cashList.push({ id: cashId++, type: 'egreso', refType: 'cxp', refId: apId - 1, amount: total, date: addDays(d, 20), description: `Pago a proveedor #${suppId}` })
      } else if (payType === 'contado' && status === 'recibida') {
        cashList.push({ id: cashId++, type: 'egreso', refType: 'compra', refId: poId, amount: total, date: d, description: `Compra contado proveedor #${suppId}` })
      }
      poId++
    }
  }

  await db.purchaseOrders.bulkAdd(poList)
  await db.purchaseOrderItems.bulkAdd(poItemsList)
  await db.accountsPayable.bulkAdd(apList)

  // ─── EXPENSES ─────────────────────────────────────────────────
  // Gastos escalando con el crecimiento + spikes bruscos por desorganización
  // Sueldos crecen Q8k/mes (contrataciones sin planificación)
  // Transporte escala por más rutas improvisadas
  // Mantenimiento con spike en mes -2 (reparación urgente caldero)
  // Mes 0: multa sanitaria Q5,500
  const expList = []

  // mes -3: base, empresa aún pequeña
  const exp_m3 = [
    { category: 'Sueldos',        amount: 45000, description: 'Sueldos mes -3' },
    { category: 'Renta',          amount: 8500,  description: 'Renta bodega mes -3' },
    { category: 'Transporte',     amount: 3200,  description: 'Combustible y flete mes -3' },
    { category: 'Mantenimiento',  amount: 2800,  description: 'Mantenimiento preventivo mes -3' },
    { category: 'Servicios',      amount: 1750,  description: 'Servicios varios mes -3' },
  ]
  // mes -2: spike de mantenimiento — caldero roto, reparación de emergencia
  const exp_m2 = [
    { category: 'Sueldos',        amount: 53000,  description: 'Sueldos mes -2 (3 contrataciones nuevas)' },
    { category: 'Renta',          amount: 8500,   description: 'Renta bodega mes -2' },
    { category: 'Transporte',     amount: 4800,   description: 'Combustible + flete extra por demanda mes -2' },
    { category: 'Mantenimiento',  amount: 14500,  description: 'Reparación urgente caldero industrial ⚠️' },
    { category: 'Servicios',      amount: 2100,   description: 'Servicios varios mes -2' },
  ]
  // mes -1: spike en sueldos (horas extra), transporte sube fuerte
  const exp_m1 = [
    { category: 'Sueldos',        amount: 61000,  description: 'Sueldos mes -1 + horas extra producción ⚠️' },
    { category: 'Renta',          amount: 8500,   description: 'Renta bodega mes -1' },
    { category: 'Transporte',     amount: 6200,   description: 'Flete urgente + rutas extra mes -1' },
    { category: 'Mantenimiento',  amount: 3200,   description: 'Mantenimiento mes -1' },
    { category: 'Servicios',      amount: 1900,   description: 'Servicios varios mes -1' },
  ]
  // mes 0: sueldos siguen subiendo, multa sanitaria, transporte al máximo
  const exp_m0 = [
    { category: 'Sueldos',        amount: 69000,  description: 'Sueldos mes actual (equipo en crecimiento)' },
    { category: 'Renta',          amount: 8500,   description: 'Renta bodega mes actual' },
    { category: 'Transporte',     amount: 8500,   description: 'Transporte mes actual — rutas no optimizadas ⚠️' },
    { category: 'Mantenimiento',  amount: 4800,   description: 'Mantenimiento correctivo mes actual' },
    { category: 'Servicios',      amount: 2200,   description: 'Servicios varios mes actual' },
    { category: 'Multas',         amount: 5500,   description: 'Multa inspección sanitaria ⚠️ — área producción sin orden' },
  ]

  const expByMonth = [exp_m3, exp_m2, exp_m1, exp_m0]
  for (let m = 3; m >= 0; m--) {
    const exps = expByMonth[3 - m]
    for (const e of exps) {
      const d = subDays(subMonths(now, m), 1)
      expList.push({ category: e.category, amount: e.amount, date: d, userId: 5, description: e.description })
      cashList.push({ id: cashId++, type: 'egreso', refType: 'gasto', refId: expList.length, amount: e.amount, date: d, description: e.description })
    }
  }
  await db.expenses.bulkAdd(expList)
  await db.cashMovements.bulkAdd(cashList)

  // ─── TODAY DELIVERIES ─────────────────────────────────────────
  await db.salesOrders.bulkAdd([
    { customerId: 1, status: 'en_ruta',    deliveryType: 'domicilio', date: now, userId: 4, zoneId: 1, subtotal: 42500, discount: 0,    tax: 5100,  total: 47600,  paymentType: 'credito', notes: 'Entregar antes del mediodía' },
    { customerId: 3, status: 'preparando', deliveryType: 'domicilio', date: now, userId: 4, zoneId: 2, subtotal: 31800, discount: 1590, tax: 3626.4, total: 33836.4, paymentType: 'credito', notes: '' },
    { customerId: 5, status: 'nuevo',      deliveryType: 'domicilio', date: now, userId: 4, zoneId: 4, subtotal: 18500, discount: 0,    tax: 2220,  total: 20720,  paymentType: 'contado', notes: 'Cliente nuevo' },
    { customerId: 7, status: 'entregado',  deliveryType: 'domicilio', date: now, userId: 4, zoneId: 1, subtotal: 56000, discount: 2800, tax: 6384,  total: 59584,  paymentType: 'credito', notes: '' },
    { customerId: 4, status: 'nuevo',      deliveryType: 'bodega',    date: now, userId: 4, zoneId: 3, subtotal: 9800,  discount: 0,    tax: 1176,  total: 10976,  paymentType: 'contado', notes: 'Retira en bodega' },
  ])

  // ─── SERVICE INVOICES (Facturas de compra - Servicios) ───────
  // Electricidad crece ~18%/mes (maquinaria al límite por sobreproducción)
  // Las facturas PAGADAS también se registran en cashMovements (corrección proceso)
  const svcInvoices = [
    // ── mes -4 ──
    { supplierName: 'EEGSA',                     nit: '890101-0',  invoiceNumber: 'F-2024-0010', serviceType: 'Energía Eléctrica',  description: 'Consumo eléctrico planta – Mes -4',         amount: 3850.00,  tax: 462.00,   total: 4312.00,  date: monthsAgo(4), dueDate: addDays(monthsAgo(4), 15), status: 'pagada',    paymentType: 'contado' },
    { supplierName: 'EMPAGUA',                   nit: '890202-0',  invoiceNumber: 'F-2024-0022', serviceType: 'Agua Potable',        description: 'Servicio agua planta – Mes -4',             amount: 1200.00,  tax: 144.00,   total: 1344.00,  date: monthsAgo(4), dueDate: addDays(monthsAgo(4), 15), status: 'pagada',    paymentType: 'contado' },
    { supplierName: 'Mantenimiento Industrial GT',nit: '1122334-5', invoiceNumber: 'F-2024-0035', serviceType: 'Mantenimiento',       description: 'Servicio mantenimiento maquinaria – Mes -4',amount: 2500.00,  tax: 300.00,   total: 2800.00,  date: monthsAgo(4), dueDate: addDays(monthsAgo(4), 30), status: 'pagada',    paymentType: 'credito' },
    // ── mes -3 ──
    { supplierName: 'EEGSA',                     nit: '890101-0',  invoiceNumber: 'F-2024-0055', serviceType: 'Energía Eléctrica',  description: 'Consumo eléctrico planta – Mes -3 (+18%)',   amount: 4550.00,  tax: 546.00,   total: 5096.00,  date: monthsAgo(3), dueDate: addDays(monthsAgo(3), 15), status: 'pagada',    paymentType: 'contado' },
    { supplierName: 'EMPAGUA',                   nit: '890202-0',  invoiceNumber: 'F-2024-0068', serviceType: 'Agua Potable',        description: 'Servicio agua planta – Mes -3',             amount: 1380.00,  tax: 165.60,   total: 1545.60,  date: monthsAgo(3), dueDate: addDays(monthsAgo(3), 15), status: 'pagada',    paymentType: 'contado' },
    { supplierName: 'Limpieza Profesional S.A.', nit: '2233445-6', invoiceNumber: 'F-2024-0071', serviceType: 'Limpieza',            description: 'Servicio limpieza instalaciones – Mes -3',  amount: 1800.00,  tax: 216.00,   total: 2016.00,  date: monthsAgo(3), dueDate: addDays(monthsAgo(3), 15), status: 'pagada',    paymentType: 'contado' },
    { supplierName: 'Asesoría Fiscal GT',        nit: '3344556-7', invoiceNumber: 'F-2024-0090', serviceType: 'Asesoría Contable',   description: 'Honorarios contador mes -3',                amount: 3500.00,  tax: 420.00,   total: 3920.00,  date: monthsAgo(3), dueDate: addDays(monthsAgo(3), 30), status: 'pagada',    paymentType: 'credito' },
    // ── mes -2: spike eléctrico + reparación extra ──
    { supplierName: 'EEGSA',                     nit: '890101-0',  invoiceNumber: 'F-2024-0110', serviceType: 'Energía Eléctrica',  description: 'Consumo eléctrico planta – Mes -2 (+18%)',   amount: 5370.00,  tax: 644.40,   total: 6014.40,  date: monthsAgo(2), dueDate: addDays(monthsAgo(2), 15), status: 'pagada',    paymentType: 'contado' },
    { supplierName: 'EMPAGUA',                   nit: '890202-0',  invoiceNumber: 'F-2024-0125', serviceType: 'Agua Potable',        description: 'Servicio agua planta – Mes -2',             amount: 1580.00,  tax: 189.60,   total: 1769.60,  date: monthsAgo(2), dueDate: addDays(monthsAgo(2), 15), status: 'pagada',    paymentType: 'contado' },
    { supplierName: 'Reparaciones Técnicas GT',  nit: '4455667-8', invoiceNumber: 'F-2024-0133', serviceType: 'Reparación',          description: 'Reparación compresor industrial ⚠️ emergencia',amount:6500.00, tax: 780.00,   total: 7280.00,  date: monthsAgo(2), dueDate: addDays(monthsAgo(2), 30), status: 'pagada',    paymentType: 'credito' },
    { supplierName: 'Limpieza Profesional S.A.', nit: '2233445-6', invoiceNumber: 'F-2024-0140', serviceType: 'Limpieza',            description: 'Servicio limpieza instalaciones – Mes -2',  amount: 1800.00,  tax: 216.00,   total: 2016.00,  date: monthsAgo(2), dueDate: addDays(monthsAgo(2), 15), status: 'pagada',    paymentType: 'contado' },
    // ── mes -1: electricidad sigue subiendo, asesor sin pagar ──
    { supplierName: 'EEGSA',                     nit: '890101-0',  invoiceNumber: 'F-2025-0010', serviceType: 'Energía Eléctrica',  description: 'Consumo eléctrico planta – Mes -1 (+18%)',   amount: 6336.00,  tax: 760.32,   total: 7096.32,  date: monthsAgo(1), dueDate: addDays(monthsAgo(1), 15), status: 'pagada',    paymentType: 'contado' },
    { supplierName: 'EMPAGUA',                   nit: '890202-0',  invoiceNumber: 'F-2025-0018', serviceType: 'Agua Potable',        description: 'Servicio agua planta – Mes -1',             amount: 1820.00,  tax: 218.40,   total: 2038.40,  date: monthsAgo(1), dueDate: addDays(monthsAgo(1), 15), status: 'pagada',    paymentType: 'contado' },
    { supplierName: 'Asesoría Fiscal GT',        nit: '3344556-7', invoiceNumber: 'F-2025-0025', serviceType: 'Asesoría Contable',   description: 'Honorarios contador mes -1 — pendiente pago',amount: 3500.00,  tax: 420.00,   total: 3920.00,  date: monthsAgo(1), dueDate: addDays(monthsAgo(1), 30), status: 'pendiente', paymentType: 'credito' },
    { supplierName: 'Limpieza Profesional S.A.', nit: '2233445-6', invoiceNumber: 'F-2025-0031', serviceType: 'Limpieza',            description: 'Servicio limpieza instalaciones – Mes -1',  amount: 1800.00,  tax: 216.00,   total: 2016.00,  date: monthsAgo(1), dueDate: addDays(monthsAgo(1), 15), status: 'pagada',    paymentType: 'contado' },
    // ── mes 0: electricidad dispara, todo pendiente (sin caja) ──
    { supplierName: 'EEGSA',                     nit: '890101-0',  invoiceNumber: 'F-2025-0045', serviceType: 'Energía Eléctrica',  description: 'Consumo eléctrico planta – Mes actual (+18%) ⚠️', amount: 7476.00, tax: 897.12, total: 8373.12, date: daysAgo(3),   dueDate: addDays(daysAgo(3),  15), status: 'pendiente', paymentType: 'contado' },
    { supplierName: 'EMPAGUA',                   nit: '890202-0',  invoiceNumber: 'F-2025-0052', serviceType: 'Agua Potable',        description: 'Servicio agua planta – Mes actual',         amount: 2100.00,  tax: 252.00,   total: 2352.00,  date: daysAgo(4),   dueDate: addDays(daysAgo(4),  15), status: 'pendiente', paymentType: 'contado' },
    { supplierName: 'Seguridad Privada GT',      nit: '5566778-9', invoiceNumber: 'F-2025-0040', serviceType: 'Seguridad',           description: 'Vigilancia mensual planta',                 amount: 4500.00,  tax: 540.00,   total: 5040.00,  date: daysAgo(5),   dueDate: addDays(daysAgo(5),  30), status: 'pendiente', paymentType: 'credito' },
    { supplierName: 'Asesoría Fiscal GT',        nit: '3344556-7', invoiceNumber: 'F-2025-0058', serviceType: 'Asesoría Contable',   description: 'Honorarios contador mes actual — sin pagar', amount: 3500.00,  tax: 420.00,   total: 3920.00,  date: daysAgo(2),   dueDate: addDays(daysAgo(2),  30), status: 'pendiente', paymentType: 'credito' },
  ]
  await db.serviceInvoices.bulkAdd(svcInvoices)

  // Registrar en cashMovements las facturas de servicios PAGADAS (corrección de proceso)
  for (const sv of svcInvoices) {
    if (sv.status === 'pagada') {
      cashList.push({ id: cashId++, type: 'egreso', refType: 'servicio', refId: 0, amount: sv.amount, date: sv.dueDate, description: `${sv.serviceType} — ${sv.supplierName}` })
    }
  }

  // ─── RECIPES (Recetas de producción) ─────────────────────────
  // recipeId → productId (producto terminado)
  // recipeItems → inputProductId (insumos, ids 31-45)
  // Rendimiento: qty de insumo para producir 1 unidad del producto terminado
  await db.recipes.bulkAdd([
    { productId: 1,  name: 'Jugo de Limón Natural 500ml',     version: '1.0', active: true, yield: 24, yieldUnit: 'botellas 500ml', notes: 'Rendimiento por batch de 24 botellas' },
    { productId: 2,  name: 'Refresco de Limón 355ml',          version: '1.0', active: true, yield: 24, yieldUnit: 'latas 355ml',    notes: 'Rendimiento por batch de 24 latas' },
    { productId: 3,  name: 'Limonada Concentrada 500ml',       version: '1.0', active: true, yield: 24, yieldUnit: 'frascos 500ml',  notes: 'Concentrado, requiere más limón' },
    { productId: 8,  name: 'Galletas de Limón 100gr',          version: '1.0', active: true, yield: 20, yieldUnit: 'paquetes 100gr', notes: 'Hornear a 180°C por 12 min' },
    { productId: 12, name: 'Gelatina Sabor Limón 90gr',        version: '1.0', active: true, yield: 36, yieldUnit: 'sobres 90gr',    notes: 'Mezcla en seco' },
    { productId: 14, name: 'Mermelada de Limón 250gr',         version: '1.0', active: true, yield: 24, yieldUnit: 'frascos 250gr',  notes: 'Cocción 40 min a fuego lento' },
    { productId: 16, name: 'Jarabe de Limón 500ml',            version: '1.0', active: true, yield: 24, yieldUnit: 'botellas 500ml', notes: 'Filtrar antes de envasar' },
    { productId: 20, name: 'Dulce de Limón Enchilado',         version: '1.0', active: true, yield: 50, yieldUnit: 'piezas',         notes: 'Mezcla manual, sin cocción' },
  ])

  await db.recipeItems.bulkAdd([
    // Receta 1 — Jugo de Limón Natural (productId:1), yield 24 botellas
    { recipeId: 1, inputProductId: 31, quantity: 2.5,  unit: 'kg',  notes: 'Limón Persa, bien maduro' },
    { recipeId: 1, inputProductId: 39, quantity: 12.0, unit: 'L',   notes: 'Agua purificada' },
    { recipeId: 1, inputProductId: 35, quantity: 0.8,  unit: 'kg',  notes: 'Azúcar estándar' },
    { recipeId: 1, inputProductId: 44, quantity: 0.01, unit: 'kg',  notes: 'Ácido cítrico estabilizador' },
    { recipeId: 1, inputProductId: 45, quantity: 0.005,unit: 'kg',  notes: 'Benzoato conservante' },
    { recipeId: 1, inputProductId: 40, quantity: 24,   unit: 'pza', notes: 'Botella PET 500ml' },
    // Receta 2 — Refresco de Limón (productId:2), yield 24 latas
    { recipeId: 2, inputProductId: 32, quantity: 1.8,  unit: 'kg',  notes: 'Limón Criollo' },
    { recipeId: 2, inputProductId: 39, quantity: 8.5,  unit: 'L',   notes: 'Agua purificada' },
    { recipeId: 2, inputProductId: 35, quantity: 1.2,  unit: 'kg',  notes: 'Azúcar estándar' },
    { recipeId: 2, inputProductId: 44, quantity: 0.008,unit: 'kg',  notes: 'Ácido cítrico' },
    // Receta 3 — Limonada Concentrada (productId:3), yield 24 frascos
    { recipeId: 3, inputProductId: 31, quantity: 5.0,  unit: 'kg',  notes: 'Limón Persa (doble cantidad, concentrado)' },
    { recipeId: 3, inputProductId: 39, quantity: 6.0,  unit: 'L',   notes: 'Agua purificada mínima' },
    { recipeId: 3, inputProductId: 35, quantity: 2.0,  unit: 'kg',  notes: 'Azúcar estándar' },
    { recipeId: 3, inputProductId: 44, quantity: 0.02, unit: 'kg',  notes: 'Ácido cítrico' },
    { recipeId: 3, inputProductId: 45, quantity: 0.01, unit: 'kg',  notes: 'Conservante' },
    { recipeId: 3, inputProductId: 40, quantity: 24,   unit: 'pza', notes: 'Frasco PET 500ml' },
    // Receta 4 — Galletas de Limón (productId:8), yield 20 paquetes
    { recipeId: 4, inputProductId: 37, quantity: 2.0,  unit: 'kg',  notes: 'Harina de trigo' },
    { recipeId: 4, inputProductId: 36, quantity: 0.5,  unit: 'kg',  notes: 'Azúcar glass para mezcla' },
    { recipeId: 4, inputProductId: 31, quantity: 0.3,  unit: 'kg',  notes: 'Limón Persa (jugo + ralladura)' },
    { recipeId: 4, inputProductId: 43, quantity: 20,   unit: 'pza', notes: 'Bolsa sellable 100gr' },
    // Receta 5 — Gelatina Sabor Limón (productId:12), yield 36 sobres
    { recipeId: 5, inputProductId: 38, quantity: 0.15, unit: 'kg',  notes: 'Grenetina base' },
    { recipeId: 5, inputProductId: 35, quantity: 1.5,  unit: 'kg',  notes: 'Azúcar estándar' },
    { recipeId: 5, inputProductId: 31, quantity: 0.2,  unit: 'kg',  notes: 'Limón Persa (esencia)' },
    { recipeId: 5, inputProductId: 44, quantity: 0.01, unit: 'kg',  notes: 'Ácido cítrico' },
    // Receta 6 — Mermelada de Limón (productId:14), yield 24 frascos
    { recipeId: 6, inputProductId: 31, quantity: 3.0,  unit: 'kg',  notes: 'Limón Persa' },
    { recipeId: 6, inputProductId: 35, quantity: 2.5,  unit: 'kg',  notes: 'Azúcar estándar' },
    { recipeId: 6, inputProductId: 44, quantity: 0.015,unit: 'kg',  notes: 'Ácido cítrico' },
    { recipeId: 6, inputProductId: 42, quantity: 24,   unit: 'pza', notes: 'Frasco vidrio 250ml' },
    // Receta 7 — Jarabe de Limón 500ml (productId:16), yield 24 botellas
    { recipeId: 7, inputProductId: 31, quantity: 4.0,  unit: 'kg',  notes: 'Limón Persa' },
    { recipeId: 7, inputProductId: 35, quantity: 4.8,  unit: 'kg',  notes: 'Azúcar estándar (almíbar denso)' },
    { recipeId: 7, inputProductId: 39, quantity: 2.4,  unit: 'L',   notes: 'Agua purificada' },
    { recipeId: 7, inputProductId: 45, quantity: 0.012,unit: 'kg',  notes: 'Conservante' },
    { recipeId: 7, inputProductId: 40, quantity: 24,   unit: 'pza', notes: 'Botella PET 500ml' },
    // Receta 8 — Dulce de Limón Enchilado (productId:20), yield 50 piezas
    { recipeId: 8, inputProductId: 34, quantity: 0.5,  unit: 'kg',  notes: 'Tamarindo natural (base)' },
    { recipeId: 8, inputProductId: 31, quantity: 0.2,  unit: 'kg',  notes: 'Limón Persa (jugo)' },
    { recipeId: 8, inputProductId: 35, quantity: 0.3,  unit: 'kg',  notes: 'Azúcar' },
  ])

  // ─── LOTES DE INSUMOS (materias primas, ids 31-45) ───────────
  // Sin presentaciones — se manejan por kg/L/pza directamente
  await db.batches.bulkAdd([
    // Limón Persa (31) — insumo estrella, varios lotes
    { productId:31, presentationId:null, lotNumber:'INS-001', entryDate:monthsAgo(3), expiryDate:daysFromNow(30),  quantity:500,  available:180, purchaseOrderId:null },
    { productId:31, presentationId:null, lotNumber:'INS-002', entryDate:monthsAgo(1), expiryDate:daysFromNow(60),  quantity:800,  available:650, purchaseOrderId:null },
    { productId:31, presentationId:null, lotNumber:'INS-003', entryDate:daysAgo(5),   expiryDate:daysFromNow(55),  quantity:600,  available:600, purchaseOrderId:null },
    // Limón Criollo (32)
    { productId:32, presentationId:null, lotNumber:'INS-010', entryDate:monthsAgo(2), expiryDate:daysFromNow(45),  quantity:300,  available:120, purchaseOrderId:null },
    { productId:32, presentationId:null, lotNumber:'INS-011', entryDate:daysAgo(10),  expiryDate:daysFromNow(50),  quantity:400,  available:400, purchaseOrderId:null },
    // Jengibre (33)
    { productId:33, presentationId:null, lotNumber:'INS-020', entryDate:monthsAgo(1), expiryDate:daysFromNow(90),  quantity:100,  available:75,  purchaseOrderId:null },
    // Tamarindo (34)
    { productId:34, presentationId:null, lotNumber:'INS-030', entryDate:monthsAgo(2), expiryDate:daysFromNow(180), quantity:150,  available:110, purchaseOrderId:null },
    // Azúcar estándar (35)
    { productId:35, presentationId:null, lotNumber:'INS-040', entryDate:monthsAgo(3), expiryDate:daysFromNow(365), quantity:1000, available:620, purchaseOrderId:null },
    { productId:35, presentationId:null, lotNumber:'INS-041', entryDate:monthsAgo(1), expiryDate:daysFromNow(365), quantity:1000, available:990, purchaseOrderId:null },
    // Azúcar glass (36)
    { productId:36, presentationId:null, lotNumber:'INS-050', entryDate:monthsAgo(2), expiryDate:daysFromNow(365), quantity:200,  available:145, purchaseOrderId:null },
    // Harina de trigo (37)
    { productId:37, presentationId:null, lotNumber:'INS-060', entryDate:monthsAgo(2), expiryDate:daysFromNow(180), quantity:500,  available:320, purchaseOrderId:null },
    // Grenetina (38)
    { productId:38, presentationId:null, lotNumber:'INS-070', entryDate:monthsAgo(3), expiryDate:daysFromNow(365), quantity:50,   available:38,  purchaseOrderId:null },
    // Agua purificada (39)
    { productId:39, presentationId:null, lotNumber:'INS-080', entryDate:monthsAgo(1), expiryDate:daysFromNow(90),  quantity:2000, available:1400, purchaseOrderId:null },
    { productId:39, presentationId:null, lotNumber:'INS-081', entryDate:daysAgo(3),   expiryDate:daysFromNow(90),  quantity:2000, available:2000, purchaseOrderId:null },
    // Botella PET 500ml (40)
    { productId:40, presentationId:null, lotNumber:'INS-090', entryDate:monthsAgo(3), expiryDate:daysFromNow(730), quantity:5000, available:2800, purchaseOrderId:null },
    { productId:40, presentationId:null, lotNumber:'INS-091', entryDate:monthsAgo(1), expiryDate:daysFromNow(730), quantity:5000, available:4900, purchaseOrderId:null },
    // Botella PET 1L (41)
    { productId:41, presentationId:null, lotNumber:'INS-100', entryDate:monthsAgo(2), expiryDate:daysFromNow(730), quantity:2000, available:1500, purchaseOrderId:null },
    // Frasco vidrio 250ml (42)
    { productId:42, presentationId:null, lotNumber:'INS-110', entryDate:monthsAgo(3), expiryDate:daysFromNow(730), quantity:1000, available:680, purchaseOrderId:null },
    // Bolsa sellable 100gr (43)
    { productId:43, presentationId:null, lotNumber:'INS-120', entryDate:monthsAgo(2), expiryDate:daysFromNow(365), quantity:3000, available:2100, purchaseOrderId:null },
    // Ácido cítrico (44)
    { productId:44, presentationId:null, lotNumber:'INS-130', entryDate:monthsAgo(4), expiryDate:daysFromNow(365), quantity:20,   available:14,  purchaseOrderId:null },
    // Conservante benzoato (45)
    { productId:45, presentationId:null, lotNumber:'INS-140', entryDate:monthsAgo(4), expiryDate:daysFromNow(365), quantity:10,   available:7.5, purchaseOrderId:null },
  ])

  // ─── STOCK MOVEMENTS (historial) ─────────────────────────────
  // Generamos movimientos coherentes con los lotes ya insertados:
  //   • 1 entrada por lote (al registrarlo)
  //   • N salidas distribuidas en el tiempo para reflejar el stock consumido
  //   • Ajustes ocasionales (merma, correcciones)
  const stockMov = []

  // Helper: reparte `consumed` unidades en up to `slots` salidas aleatorias dentro del rango de fechas
  function spreadExits(productId, presentationId, batchLotNumber, batchId, consumed, entryDate, slots, userId) {
    if (consumed <= 0) return
    const spread = Math.min(slots, Math.ceil(consumed / 5))
    let remaining = consumed
    for (let s = 0; s < spread; s++) {
      const isLast = s === spread - 1
      const portion = isLast ? remaining : Math.round(consumed / spread * (0.8 + Math.random() * 0.4))
      const take = Math.min(portion, remaining)
      if (take <= 0) continue
      const daysOffset = Math.floor((s / spread) * (now - entryDate) / 86400000)
      stockMov.push({
        productId, presentationId, batchId, type: 'salida',
        quantity: take,
        date: addDays(entryDate, daysOffset),
        userId,
        reference: `Venta/Pedido histórico`,
      })
      remaining -= take
      if (remaining <= 0) break
    }
  }

  // ── Productos de VENTA (ids 1-30) — lotes del seed ──
  // Los batchIds asignados por Dexie serán 1..N en orden de inserción.
  // Usamos los mismos índices del array batchData (base 1 = Dexie id)
  const ventaBatches = [
    // { batchId, productId, presentationId, entryDate, quantity, available }
    { batchId:1,  productId:1,  presentationId:1,  entryDate:monthsAgo(4), qty:500,  avail:320 },
    { batchId:2,  productId:1,  presentationId:1,  entryDate:monthsAgo(2), qty:400,  avail:280 },
    { batchId:3,  productId:1,  presentationId:2,  entryDate:monthsAgo(3), qty:200,  avail:140 },
    { batchId:4,  productId:2,  presentationId:3,  entryDate:monthsAgo(4), qty:600,  avail:80  },
    { batchId:5,  productId:2,  presentationId:3,  entryDate:monthsAgo(1), qty:600,  avail:500 },
    { batchId:6,  productId:2,  presentationId:4,  entryDate:monthsAgo(2), qty:300,  avail:210 },
    { batchId:7,  productId:3,  presentationId:5,  entryDate:monthsAgo(3), qty:300,  avail:200 },
    { batchId:8,  productId:3,  presentationId:6,  entryDate:monthsAgo(1), qty:150,  avail:130 },
    { batchId:9,  productId:4,  presentationId:7,  entryDate:monthsAgo(2), qty:200,  avail:0   },
    { batchId:10, productId:4,  presentationId:7,  entryDate:monthsAgo(1), qty:300,  avail:250 },
    { batchId:11, productId:5,  presentationId:8,  entryDate:monthsAgo(2), qty:400,  avail:350 },
    { batchId:12, productId:5,  presentationId:8,  entryDate:monthsAgo(1), qty:350,  avail:340 },
    { batchId:13, productId:6,  presentationId:9,  entryDate:monthsAgo(3), qty:500,  avail:300 },
    { batchId:14, productId:6,  presentationId:9,  entryDate:monthsAgo(1), qty:400,  avail:380 },
    { batchId:15, productId:7,  presentationId:10, entryDate:monthsAgo(2), qty:300,  avail:200 },
    { batchId:16, productId:7,  presentationId:10, entryDate:monthsAgo(1), qty:400,  avail:390 },
    { batchId:17, productId:8,  presentationId:11, entryDate:monthsAgo(2), qty:400,  avail:300 },
    { batchId:18, productId:8,  presentationId:11, entryDate:monthsAgo(1), qty:350,  avail:320 },
    { batchId:19, productId:8,  presentationId:12, entryDate:monthsAgo(1), qty:200,  avail:180 },
    { batchId:20, productId:9,  presentationId:13, entryDate:monthsAgo(3), qty:600,  avail:150 },
    { batchId:21, productId:9,  presentationId:13, entryDate:monthsAgo(1), qty:600,  avail:580 },
    { batchId:22, productId:10, presentationId:14, entryDate:monthsAgo(2), qty:350,  avail:280 },
    { batchId:23, productId:11, presentationId:15, entryDate:monthsAgo(2), qty:500,  avail:420 },
    { batchId:24, productId:11, presentationId:15, entryDate:monthsAgo(1), qty:400,  avail:390 },
    { batchId:25, productId:12, presentationId:16, entryDate:monthsAgo(3), qty:700,  avail:500 },
    { batchId:26, productId:12, presentationId:16, entryDate:monthsAgo(1), qty:600,  avail:590 },
    { batchId:27, productId:13, presentationId:17, entryDate:monthsAgo(2), qty:400,  avail:380 },
    { batchId:28, productId:14, presentationId:18, entryDate:monthsAgo(4), qty:300,  avail:180 },
    { batchId:29, productId:14, presentationId:18, entryDate:monthsAgo(1), qty:250,  avail:240 },
    { batchId:30, productId:14, presentationId:19, entryDate:monthsAgo(2), qty:200,  avail:160 },
    { batchId:31, productId:15, presentationId:20, entryDate:monthsAgo(2), qty:200,  avail:160 },
    { batchId:32, productId:15, presentationId:20, entryDate:monthsAgo(1), qty:180,  avail:175 },
    { batchId:33, productId:16, presentationId:21, entryDate:monthsAgo(3), qty:400,  avail:320 },
    { batchId:34, productId:16, presentationId:21, entryDate:monthsAgo(1), qty:350,  avail:340 },
    { batchId:35, productId:17, presentationId:22, entryDate:monthsAgo(2), qty:200,  avail:160 },
    { batchId:36, productId:18, presentationId:23, entryDate:monthsAgo(2), qty:300,  avail:270 },
    { batchId:37, productId:19, presentationId:24, entryDate:monthsAgo(1), qty:250,  avail:240 },
    { batchId:38, productId:20, presentationId:25, entryDate:monthsAgo(2), qty:800,  avail:650 },
    { batchId:39, productId:20, presentationId:25, entryDate:monthsAgo(1), qty:600,  avail:590 },
    { batchId:40, productId:21, presentationId:26, entryDate:monthsAgo(2), qty:500,  avail:420 },
    { batchId:41, productId:21, presentationId:26, entryDate:monthsAgo(1), qty:480,  avail:470 },
    { batchId:42, productId:22, presentationId:27, entryDate:monthsAgo(1), qty:400,  avail:380 },
    { batchId:43, productId:23, presentationId:28, entryDate:monthsAgo(2), qty:600,  avail:520 },
    { batchId:44, productId:24, presentationId:29, entryDate:monthsAgo(1), qty:700,  avail:660 },
    { batchId:45, productId:24, presentationId:29, entryDate:monthsAgo(3), qty:300,  avail:40  },
    { batchId:46, productId:25, presentationId:30, entryDate:monthsAgo(2), qty:500,  avail:420 },
    { batchId:47, productId:25, presentationId:30, entryDate:monthsAgo(1), qty:450,  avail:440 },
    { batchId:48, productId:26, presentationId:31, entryDate:monthsAgo(2), qty:450,  avail:380 },
    { batchId:49, productId:27, presentationId:32, entryDate:monthsAgo(1), qty:400,  avail:370 },
    { batchId:50, productId:27, presentationId:32, entryDate:monthsAgo(3), qty:200,  avail:60  },
    { batchId:51, productId:28, presentationId:33, entryDate:monthsAgo(1), qty:350,  avail:310 },
    { batchId:52, productId:29, presentationId:34, entryDate:monthsAgo(2), qty:300,  avail:250 },
    { batchId:53, productId:30, presentationId:35, entryDate:monthsAgo(1), qty:400,  avail:370 },
    { batchId:54, productId:30, presentationId:35, entryDate:monthsAgo(2), qty:300,  avail:220 },
  ]

  // ── Insumos (ids 31-45) — lotes del seed ──
  const insuBatches = [
    { batchId:55, productId:31, presentationId:null, entryDate:monthsAgo(3), qty:500,  avail:180 },
    { batchId:56, productId:31, presentationId:null, entryDate:monthsAgo(1), qty:800,  avail:650 },
    { batchId:57, productId:31, presentationId:null, entryDate:daysAgo(5),   qty:600,  avail:600 },
    { batchId:58, productId:32, presentationId:null, entryDate:monthsAgo(2), qty:300,  avail:120 },
    { batchId:59, productId:32, presentationId:null, entryDate:daysAgo(10),  qty:400,  avail:400 },
    { batchId:60, productId:33, presentationId:null, entryDate:monthsAgo(1), qty:100,  avail:75  },
    { batchId:61, productId:34, presentationId:null, entryDate:monthsAgo(2), qty:150,  avail:110 },
    { batchId:62, productId:35, presentationId:null, entryDate:monthsAgo(3), qty:1000, avail:620 },
    { batchId:63, productId:35, presentationId:null, entryDate:monthsAgo(1), qty:1000, avail:990 },
    { batchId:64, productId:36, presentationId:null, entryDate:monthsAgo(2), qty:200,  avail:145 },
    { batchId:65, productId:37, presentationId:null, entryDate:monthsAgo(2), qty:500,  avail:320 },
    { batchId:66, productId:38, presentationId:null, entryDate:monthsAgo(3), qty:50,   avail:38  },
    { batchId:67, productId:39, presentationId:null, entryDate:monthsAgo(1), qty:2000, avail:1400},
    { batchId:68, productId:39, presentationId:null, entryDate:daysAgo(3),   qty:2000, avail:2000},
    { batchId:69, productId:40, presentationId:null, entryDate:monthsAgo(3), qty:5000, avail:2800},
    { batchId:70, productId:40, presentationId:null, entryDate:monthsAgo(1), qty:5000, avail:4900},
    { batchId:71, productId:41, presentationId:null, entryDate:monthsAgo(2), qty:2000, avail:1500},
    { batchId:72, productId:42, presentationId:null, entryDate:monthsAgo(3), qty:1000, avail:680 },
    { batchId:73, productId:43, presentationId:null, entryDate:monthsAgo(2), qty:3000, avail:2100},
    { batchId:74, productId:44, presentationId:null, entryDate:monthsAgo(4), qty:20,   avail:14  },
    { batchId:75, productId:45, presentationId:null, entryDate:monthsAgo(4), qty:10,   avail:7.5 },
  ]

  const allBatches = [...ventaBatches, ...insuBatches]

  for (const b of allBatches) {
    // 1. ENTRADA al registrar el lote
    stockMov.push({
      productId: b.productId,
      presentationId: b.presentationId,
      batchId: b.batchId,
      type: 'entrada',
      quantity: b.qty,
      date: b.entryDate,
      userId: 2,
      reference: `Ingreso lote #${b.batchId}`,
    })
    // 2. SALIDAS proporcionales al consumo
    const consumed = b.qty - b.avail
    spreadExits(b.productId, b.presentationId, null, b.batchId, consumed, b.entryDate, 6, 4)
  }

  // 3. Ajustes manuales de inventario (mermas, correcciones) — varios meses
  const ajustes = [
    { productId:1,  presentationId:1,  batchId:1,  quantity:5,  date:monthsAgo(3), userId:2, reference:'Ajuste — rotura de envases' },
    { productId:2,  presentationId:3,  batchId:4,  quantity:10, date:monthsAgo(2), userId:2, reference:'Ajuste — merma por vencimiento próximo' },
    { productId:9,  presentationId:13, batchId:20, quantity:8,  date:monthsAgo(2), userId:2, reference:'Ajuste — devolución cliente' },
    { productId:27, presentationId:32, batchId:50, quantity:12, date:monthsAgo(2), userId:2, reference:'Ajuste — merma almacén' },
    { productId:31, presentationId:null, batchId:55, quantity:20, date:monthsAgo(2), userId:2, reference:'Ajuste — pérdida por humedad' },
    { productId:35, presentationId:null, batchId:62, quantity:30, date:monthsAgo(1), userId:2, reference:'Ajuste — diferencia inventario físico' },
  ]
  for (const a of ajustes) {
    stockMov.push({ ...a, type: 'ajuste' })
  }

  await db.stockMovements.bulkAdd(stockMov)

  // ─── PRODUCTION ORDERS (historial 4 meses) ────────────────────
  // Órdenes ejecutadas que consumieron insumos y generaron lotes de producto terminado
  // productionCost = suma de (qty_insumo × buyPrice_insumo) por receta
  const prodOrders = [
    // Mes 4 atrás
    { recipeId:1, productId:1,  status:'completada', date:monthsAgo(4), userId:2, batchesProduced:3, unitsProduced:72,  totalCost:285.60, notes:'Batch inicial temporada' },
    { recipeId:4, productId:8,  status:'completada', date:monthsAgo(4), userId:2, batchesProduced:2, unitsProduced:40,  totalCost:198.40, notes:'' },
    { recipeId:5, productId:12, status:'completada', date:subDays(monthsAgo(4),5), userId:2, batchesProduced:2, unitsProduced:72, totalCost:124.20, notes:'' },
    // Mes 3 atrás
    { recipeId:1, productId:1,  status:'completada', date:monthsAgo(3), userId:2, batchesProduced:4, unitsProduced:96,  totalCost:380.80, notes:'' },
    { recipeId:2, productId:2,  status:'completada', date:monthsAgo(3), userId:2, batchesProduced:3, unitsProduced:72,  totalCost:242.40, notes:'' },
    { recipeId:6, productId:14, status:'completada', date:subDays(monthsAgo(3),3), userId:2, batchesProduced:2, unitsProduced:48, totalCost:318.00, notes:'Mermelada temporada alta' },
    { recipeId:7, productId:16, status:'completada', date:subDays(monthsAgo(3),7), userId:2, batchesProduced:2, unitsProduced:48, totalCost:412.80, notes:'' },
    // Mes 2 atrás
    { recipeId:1, productId:1,  status:'completada', date:monthsAgo(2), userId:2, batchesProduced:5, unitsProduced:120, totalCost:476.00, notes:'' },
    { recipeId:3, productId:3,  status:'completada', date:monthsAgo(2), userId:2, batchesProduced:2, unitsProduced:48,  totalCost:398.40, notes:'Concentrado para exportación' },
    { recipeId:4, productId:8,  status:'completada', date:subDays(monthsAgo(2),5), userId:2, batchesProduced:3, unitsProduced:60, totalCost:297.60, notes:'' },
    { recipeId:8, productId:20, status:'completada', date:subDays(monthsAgo(2),8), userId:2, batchesProduced:2, unitsProduced:100, totalCost:89.50, notes:'' },
    // Mes anterior
    { recipeId:1, productId:1,  status:'completada', date:monthsAgo(1), userId:2, batchesProduced:5, unitsProduced:120, totalCost:476.00, notes:'' },
    { recipeId:2, productId:2,  status:'completada', date:subDays(monthsAgo(1),3), userId:2, batchesProduced:4, unitsProduced:96, totalCost:323.20, notes:'' },
    { recipeId:5, productId:12, status:'completada', date:subDays(monthsAgo(1),6), userId:2, batchesProduced:3, unitsProduced:108, totalCost:186.30, notes:'' },
    { recipeId:7, productId:16, status:'completada', date:subDays(monthsAgo(1),10), userId:2, batchesProduced:3, unitsProduced:72, totalCost:619.20, notes:'' },
    // Mes actual
    { recipeId:1, productId:1,  status:'completada', date:daysAgo(12), userId:2, batchesProduced:3, unitsProduced:72,  totalCost:285.60, notes:'' },
    { recipeId:4, productId:8,  status:'completada', date:daysAgo(8),  userId:2, batchesProduced:2, unitsProduced:40,  totalCost:198.40, notes:'' },
    { recipeId:6, productId:14, status:'completada', date:daysAgo(5),  userId:2, batchesProduced:2, unitsProduced:48,  totalCost:318.00, notes:'' },
    { recipeId:3, productId:3,  status:'en_proceso', date:daysAgo(3),  userId:2, batchesProduced:0, unitsProduced:0,   totalCost:0,      notes:'⚠️ Lleva 3 días sin terminar — operario ausente' },
    // Síntomas de desorganización
    { recipeId:2, productId:2,  status:'cancelada',  date:subDays(monthsAgo(2),10), userId:2, batchesProduced:0, unitsProduced:0, totalCost:0, notes:'❌ Cancelada por falta de stock de Limón Criollo — compra no planificada' },
    { recipeId:7, productId:16, status:'retrasada',  date:subDays(monthsAgo(1),15), userId:2, batchesProduced:1, unitsProduced:24, totalCost:206.40, notes:'⚠️ Retrasada — maquinaria en reparación, solo completó 50% del batch' },
  ]
  await db.productionOrders.bulkAdd(prodOrders)

  console.log('✅ Lemon-Sys: Base de datos inicializada con datos de prueba')
}
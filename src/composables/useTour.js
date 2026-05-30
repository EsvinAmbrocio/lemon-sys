import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import db from '@/db/db'
import { useAuthStore } from '@/stores/auth'

const tourSteps = {
  dashboard: [
    {
      popover: {
        title: 'Bienvenido al Dashboard',
        description: 'Aquí tienes una vista general del estado de la empresa en tiempo real. Te guiaremos por los elementos principales.',
        side: 'over',
        align: 'center',
      }
    },
    {
      element: '#kpi-ventas',
      popover: {
        title: 'Ventas del Día',
        description: 'Muestra el total facturado en el día de hoy, actualizado en tiempo real con cada pedido confirmado.',
        side: 'bottom',
        align: 'start',
      }
    },
    {
      element: '#kpi-stock',
      popover: {
        title: 'Stock Bajo Mínimo',
        description: 'Número de presentaciones cuyo inventario disponible está por debajo del mínimo configurado. Indica qué productos necesitan reabastecerse.',
        side: 'bottom',
        align: 'start',
      }
    },
    {
      element: '#kpi-lotes',
      popover: {
        title: 'Lotes por Vencer',
        description: 'Lotes de productos que vencen en los próximos 30 días. Permite tomar acción antes de que caduquen.',
        side: 'bottom',
        align: 'start',
      }
    },
    {
      element: '#kpi-cxc',
      popover: {
        title: 'Cuentas por Cobrar Vencidas',
        description: 'Monto total de ventas a crédito que ya superaron su fecha de vencimiento y requieren gestión de cobro urgente.',
        side: 'bottom',
        align: 'start',
      }
    },
    {
      element: '#chart-ventas',
      popover: {
        title: 'Gráfica de Ventas',
        description: 'Evolución diaria de ventas en los últimos 30 días. Permite identificar tendencias y días de mayor actividad comercial.',
        side: 'top',
        align: 'center',
      }
    },
    {
      popover: {
        title: 'Tour completado',
        description: 'Ya conoces el Dashboard. Puedes relanzar este tour en cualquier momento haciendo clic en el ícono de ayuda (?) en la barra superior.',
        side: 'over',
        align: 'center',
      }
    },
  ],

  productos: [
    {
      popover: {
        title: 'Catálogo de Productos',
        description: 'En esta sección gestionas todos los productos que distribuye la empresa. Cada producto puede tener múltiples presentaciones y un precio base de venta.',
      }
    },
    {
      element: '#btn-nuevo-producto',
      popover: {
        title: 'Crear Nuevo Producto',
        description: 'Abre el formulario para registrar un producto. Deberás ingresar su código interno, nombre, categoría, precio de compra y precio base de venta.',
        side: 'bottom',
        align: 'end',
      }
    },
    {
      element: '#tabla-productos',
      popover: {
        title: 'Lista de Productos',
        description: 'Aquí aparecen todos los productos registrados. Puedes buscar por nombre o filtrar por categoría. Usa el ícono de capas para configurar las presentaciones de cada producto.',
        side: 'top',
        align: 'center',
      }
    },
    {
      popover: {
        title: 'Presentaciones',
        description: 'Cada producto puede tener presentaciones distintas, por ejemplo: Botella 500ml, Botella 1L, Paquete 100gr. Las presentaciones se configuran desde el botón de capas en la tabla.',
      }
    },
  ],

  lotes: [
    {
      popover: {
        title: 'Gestión de Lotes',
        description: 'Cada entrada de mercancía se registra como un lote con su propia fecha de vencimiento. El sistema aplica FIFO automático al despachar pedidos.',
      }
    },
    {
      element: '#btn-nuevo-lote',
      popover: {
        title: 'Registrar Lote',
        description: 'Crea un nuevo lote seleccionando el producto, presentación, número de lote, cantidad y fecha de vencimiento.',
        side: 'bottom',
        align: 'end',
      }
    },
    {
      element: '#filter-lotes',
      popover: {
        title: 'Filtrar por Estado',
        description: 'Filtra entre lotes vigentes, los que vencen en menos de 30 días (alerta amarilla) y los ya vencidos que están bloqueados para venta.',
        side: 'bottom',
        align: 'start',
      }
    },
    {
      element: '#tabla-lotes',
      popover: {
        title: 'Estado de los Lotes',
        description: 'Los lotes vencidos se muestran en rojo y están bloqueados — no se pueden usar en pedidos. Los próximos a vencer aparecen en amarillo como advertencia.',
        side: 'top',
        align: 'center',
      }
    },
    {
      popover: {
        title: 'FIFO Automático',
        description: 'Al crear un pedido, el sistema descuenta automáticamente del lote más antiguo disponible primero, sin que el vendedor tenga que seleccionar lotes manualmente.',
      }
    },
  ],

  inventario: [
    {
      popover: {
        title: 'Inventario en Tiempo Real',
        description: 'Vista consolidada del stock disponible por producto y presentación. El inventario se calcula sumando todos los lotes vigentes de cada presentación.',
      }
    },
    {
      element: '#tabla-inventario',
      popover: {
        title: 'Estado del Stock',
        description: 'El stock se muestra en verde si está bien, amarillo si está bajo el mínimo, y rojo si está agotado. La columna "Próx. Venc." indica la fecha del lote más antiguo disponible.',
        side: 'top',
        align: 'center',
      }
    },
    {
      popover: {
        title: 'Actualización Automática',
        description: 'Cada vez que se recibe una orden de compra o se despacha un pedido, el inventario se actualiza automáticamente. No requiere ajustes manuales en condiciones normales.',
      }
    },
  ],

  proveedores: [
    {
      popover: {
        title: 'Gestión de Proveedores',
        description: 'Aquí administras los proveedores de la empresa. Desde un proveedor puedes crear órdenes de compra y dar seguimiento a las cuentas por pagar.',
      }
    },
    {
      element: '#btn-nuevo-proveedor',
      popover: {
        title: 'Registrar Proveedor',
        description: 'Agrega un proveedor con su razón social, NIT, contacto, correo y días de pago. Los días de pago definen el plazo para las compras a crédito.',
        side: 'bottom',
        align: 'end',
      }
    },
    {
      element: '#tabla-proveedores',
      popover: {
        title: 'Lista de Proveedores',
        description: 'Listado de todos los proveedores activos. Puedes editar su información o desactivarlos si dejas de trabajar con ellos.',
        side: 'top',
        align: 'center',
      }
    },
  ],

  compras: [
    {
      popover: {
        title: 'Órdenes de Compra',
        description: 'Una orden de compra (OC) registra la mercancía que se solicita a un proveedor. Al marcarla como recibida, los lotes se generan en el inventario automáticamente.',
      }
    },
    {
      element: '#btn-nueva-oc',
      popover: {
        title: 'Nueva Orden de Compra',
        description: 'Selecciona el proveedor, el tipo de pago (contado o crédito) y agrega los productos con sus cantidades y costos unitarios.',
        side: 'bottom',
        align: 'end',
      }
    },
    {
      element: '#tabla-oc',
      popover: {
        title: 'Flujo de la OC',
        description: 'Una OC pasa por estos estados: Enviada → Recibida. Al recibirla, el sistema crea automáticamente los lotes en inventario. Si es a crédito, genera una cuenta por pagar en Finanzas.',
        side: 'top',
        align: 'center',
      }
    },
  ],

  rutaDia: [
    {
      popover: {
        title: 'Ruta del Día',
        description: 'Vista operativa para el equipo de logística. Muestra todos los pedidos del día agrupados por zona geográfica para facilitar la planificación de entregas.',
      }
    },
    {
      element: '#filtro-zona',
      popover: {
        title: 'Filtrar por Zona',
        description: 'Selecciona una zona específica para ver solo las entregas de esa área. Útil cuando hay múltiples choferes asignados a zonas distintas.',
        side: 'bottom',
        align: 'start',
      }
    },
    {
      element: '#lista-ruta',
      popover: {
        title: 'Entregas del Día',
        description: 'Cada tarjeta muestra el cliente, su dirección, notas especiales del pedido y el estado actual. La barra de color al lado izquierdo indica el estado de avance.',
        side: 'top',
        align: 'center',
      }
    },
    {
      element: '#btn-avanzar',
      popover: {
        title: 'Avanzar Estado',
        description: 'Con este botón avanzas el pedido al siguiente estado: Nuevo → Preparando → En Ruta → Entregado. Cada cambio queda registrado en el historial.',
        side: 'left',
        align: 'center',
      }
    },
  ],

  clientes: [
    {
      popover: {
        title: 'Clientes Mayoristas',
        description: 'Aquí gestionas la base de clientes de la empresa. Cada cliente tiene asignada una zona de entrega, una lista de precios y condiciones de pago.',
      }
    },
    {
      element: '#btn-nuevo-cliente',
      popover: {
        title: 'Registrar Cliente',
        description: 'Ingresa los datos del cliente: nombre, NIT, dirección, zona, lista de precios y tipo de pago. Para clientes a crédito, configura días de crédito y límite.',
        side: 'bottom',
        align: 'end',
      }
    },
    {
      element: '#select-lista',
      popover: {
        title: 'Listas de Precios',
        description: 'El sistema maneja 4 listas: Lista A para grandes cadenas (Walmart), B y C para distribuidores medianos, y D para tiendas de barrio. Los precios se aplican automáticamente al crear pedidos.',
        side: 'bottom',
        align: 'start',
      }
    },
    {
      element: '#tabla-clientes',
      popover: {
        title: 'Base de Clientes',
        description: 'Desde la tabla puedes editar clientes, consultar su historial completo de compras o desactivarlos. Los clientes inactivos no aparecen al crear pedidos.',
        side: 'top',
        align: 'center',
      }
    },
  ],

  pedidos: [
    {
      popover: {
        title: 'Pedidos Mayoristas',
        description: 'Módulo principal de ventas. Aquí creas y gestionas los pedidos de los clientes. Al confirmar un pedido se genera la factura y se descuenta el inventario automáticamente.',
      }
    },
    {
      element: '#btn-nuevo-pedido',
      popover: {
        title: 'Crear Pedido',
        description: 'Selecciona el cliente y el tipo de entrega. Los precios se cargan automáticamente según la lista de precios asignada al cliente.',
        side: 'bottom',
        align: 'end',
      }
    },
    {
      element: '#campo-descuento',
      popover: {
        title: 'Descuento por Pedido',
        description: 'Aplica un descuento en monto fijo sobre el total del pedido. Este descuento es independiente de la lista de precios del cliente y queda registrado en la factura.',
        side: 'top',
        align: 'center',
      }
    },
    {
      element: '#resumen-pedido',
      popover: {
        title: 'Resumen con IVA',
        description: 'El sistema calcula automáticamente el subtotal, aplica el descuento, suma el IVA del 16% y muestra el total final a facturar.',
        side: 'top',
        align: 'center',
      }
    },
  ],

  facturas: [
    {
      popover: {
        title: 'Facturas Emitidas',
        description: 'Historial completo de facturas generadas. Las facturas se crean automáticamente al confirmar un pedido y no pueden modificarse.',
      }
    },
    {
      element: '#tabla-facturas',
      popover: {
        title: 'Listado de Facturas',
        description: 'Filtra por cliente, fecha o estado de pago. Las facturas de clientes a crédito quedan en estado "Pendiente" hasta que se registra el cobro en Finanzas.',
        side: 'top',
        align: 'center',
      }
    },
    {
      element: '#btn-ver-factura',
      popover: {
        title: 'Ver e Imprimir Factura',
        description: 'Abre la vista completa de la factura con todos los datos del cliente, líneas de producto, desglose de IVA y totales. Desde ahí puedes imprimirla directamente.',
        side: 'left',
        align: 'center',
      }
    },
  ],

  cxc: [
    {
      popover: {
        title: 'Cuentas por Cobrar',
        description: 'Registro de todas las ventas a crédito pendientes de cobro. Las cuentas vencidas se marcan automáticamente en rojo y aparecen como alerta en el Dashboard.',
      }
    },
    {
      element: '#tabla-cxc',
      popover: {
        title: 'Estado de Cobros',
        description: 'Cada fila muestra el cliente, el monto total, lo ya cobrado, el saldo pendiente y la fecha de vencimiento. Las filas en rojo indican cuentas vencidas.',
        side: 'top',
        align: 'center',
      }
    },
    {
      element: '#btn-registrar-pago',
      popover: {
        title: 'Registrar Cobro',
        description: 'Puedes registrar pagos parciales o totales. Al cobrar, el sistema actualiza el saldo de la cuenta y registra el ingreso en el flujo de caja automáticamente.',
        side: 'left',
        align: 'center',
      }
    },
  ],

  flujoCaja: [
    {
      popover: {
        title: 'Flujo de Caja',
        description: 'Vista financiera que integra todos los movimientos de dinero: cobros de ventas, pagos a proveedores y gastos operativos en un solo lugar.',
      }
    },
    {
      element: '#selector-mes',
      popover: {
        title: 'Selector de Período',
        description: 'Cambia entre el mes actual, el mes anterior o los últimos 3 meses para analizar el flujo de caja en distintos períodos.',
        side: 'bottom',
        align: 'end',
      }
    },
    {
      element: '#comparativo',
      popover: {
        title: 'Comparativo vs Mes Anterior',
        description: 'Compara ingresos, egresos y balance del período seleccionado contra el mes anterior. Las flechas indican si la tendencia es positiva o negativa.',
        side: 'bottom',
        align: 'center',
      }
    },
    {
      element: '#grafica-flujo',
      popover: {
        title: 'Gráfica Semanal',
        description: 'Barras verdes representan ingresos y barras rojas egresos, agrupados por semana. Permite identificar semanas con déficit de caja.',
        side: 'top',
        align: 'center',
      }
    },
  ],
}

export function useTour() {
  const auth = useAuthStore()

  async function isTourDone(module) {
    if (!auth.user?.id) return true
    const record = await db.tourProgress.where({ userId: auth.user.id, module }).first()
    return !!record?.completed
  }

  async function markTourDone(module) {
    if (!auth.user?.id) return
    const existing = await db.tourProgress.where({ userId: auth.user.id, module }).first()
    if (existing) await db.tourProgress.update(existing.id, { completed: true })
    else await db.tourProgress.add({ userId: auth.user.id, module, completed: true })
  }

  function startTour(module) {
    const steps = tourSteps[module]
    if (!steps) return

    const driverObj = driver({
      showProgress: true,
      progressText: '{{current}} de {{total}}',
      nextBtnText: 'Siguiente',
      prevBtnText: 'Anterior',
      doneBtnText: 'Entendido',
      animate: true,
      smoothScroll: true,
      overlayOpacity: 0.5,
      stagePadding: 8,
      stageRadius: 12,
      popoverClass: 'lemon-tour-popover',
      steps,
      onDestroyed: () => markTourDone(module),
    })
    driverObj.drive()
  }

  async function startTourIfNew(module) {
    const done = await isTourDone(module)
    if (!done) {
      // Pequeño delay para que el DOM esté listo
      setTimeout(() => startTour(module), 600)
    }
  }

  function replayTour() {
    const path = window.location.hash.replace('#', '')
    const moduleMap = {
      '/dashboard': 'dashboard',
      '/produccion/productos': 'productos',
      '/produccion/lotes': 'lotes',
      '/produccion/inventario': 'inventario',
      '/logistica/proveedores': 'proveedores',
      '/logistica/compras': 'compras',
      '/logistica/ruta-dia': 'rutaDia',
      '/ventas/clientes': 'clientes',
      '/ventas/pedidos': 'pedidos',
      '/ventas/facturas': 'facturas',
      '/finanzas/cxc': 'cxc',
      '/finanzas/flujo-caja': 'flujoCaja',
    }
    const module = moduleMap[path]
    if (module) startTour(module)
  }

  return { startTour, startTourIfNew, replayTour }
}

// Catálogo base: categorías y tipos de servicio con intervalos orientativos (editables por el usuario).
export interface CatalogType {
  slug: string
  name: string
  intervalKm?: number
  intervalDays?: number
  note?: string
}
export interface CatalogCategory {
  slug: string
  name: string
  icon: string
  color: string
  types: CatalogType[]
}

export const CATALOG: CatalogCategory[] = [
  {
    slug: 'aceite', name: 'Aceite motor', icon: 'Droplets', color: '#f5a524',
    types: [
      { slug: 'aceite-motor', name: 'Cambio de aceite y filtro', intervalKm: 4500, intervalDays: 180 },
      { slug: 'aceite-aditivo', name: 'Aditivo / limpieza de motor' },
    ],
  },
  {
    slug: 'caja', name: 'Caja sincrónica', icon: 'Cog', color: '#8b5cf6',
    types: [
      { slug: 'caja-aceite', name: 'Aceite de caja (valvulina)', intervalKm: 40000, note: 'Valor orientativo para caja manual: confirma con el manual de tu Corsa.' },
      { slug: 'caja-clutch', name: 'Clutch / croche (kit)', intervalKm: 80000 },
      { slug: 'caja-reparacion', name: 'Reparación de caja' },
    ],
  },
  {
    slug: 'llantas', name: 'Llantas', icon: 'CircleDot', color: '#334155',
    types: [
      { slug: 'llantas-cambio', name: 'Cambio de llantas', intervalKm: 50000, intervalDays: 1825 },
      { slug: 'llantas-rotacion', name: 'Rotación y balanceo', intervalKm: 10000 },
      { slug: 'llantas-alineacion', name: 'Alineación', intervalKm: 10000 },
      { slug: 'llantas-parche', name: 'Parche / reparación' },
    ],
  },
  {
    slug: 'frenos', name: 'Frenos', icon: 'OctagonAlert', color: '#ef4444',
    types: [
      { slug: 'frenos-pastillas', name: 'Pastillas', intervalKm: 30000 },
      { slug: 'frenos-discos', name: 'Discos / tambores / zapatas', intervalKm: 60000 },
      { slug: 'frenos-liquido', name: 'Líquido de frenos', intervalDays: 730 },
      { slug: 'frenos-bomba', name: 'Bomba / cilindros / mangueras' },
    ],
  },
  {
    slug: 'correas', name: 'Correas', icon: 'Link2', color: '#0ea5e9',
    types: [
      { slug: 'correa-tiempo', name: 'Correa de tiempo (distribución)', intervalKm: 60000, intervalDays: 1825 },
      { slug: 'correa-accesorios', name: 'Correa de accesorios', intervalKm: 50000 },
      { slug: 'correa-kit', name: 'Kit completo (correa + tensor + bomba)', intervalKm: 60000 },
    ],
  },
  {
    slug: 'poleas', name: 'Poleas', icon: 'Disc3', color: '#14b8a6',
    types: [
      { slug: 'polea-tensora', name: 'Polea tensora', intervalKm: 60000 },
      { slug: 'polea-loca', name: 'Polea loca / guía', intervalKm: 60000 },
      { slug: 'polea-cigueñal', name: 'Polea de cigüeñal', intervalKm: 100000 },
    ],
  },
  {
    slug: 'alternador', name: 'Alternador', icon: 'Zap', color: '#eab308',
    types: [
      { slug: 'alternador-cambio', name: 'Cambio de alternador' },
      { slug: 'alternador-reparacion', name: 'Reparación (carbones, regulador, rodamientos)' },
    ],
  },
  {
    slug: 'bateria', name: 'Batería', icon: 'BatteryCharging', color: '#22c55e',
    types: [
      { slug: 'bateria-cambio', name: 'Cambio de batería', intervalDays: 730 },
      { slug: 'bateria-bornes', name: 'Limpieza de bornes / revisión', intervalDays: 180 },
    ],
  },
  {
    slug: 'electrico', name: 'Eléctrico', icon: 'PlugZap', color: '#6366f1',
    types: [
      { slug: 'electrico-arranque', name: 'Motor de arranque' },
      { slug: 'electrico-luces', name: 'Luces / faros / bombillos' },
      { slug: 'electrico-sensor', name: 'Sensores / módulo' },
      { slug: 'electrico-cableado', name: 'Cableado / fusibles / relés' },
      { slug: 'electrico-falla', name: 'Falla eléctrica (diagnóstico)' },
    ],
  },
  {
    slug: 'ac', name: 'Aire acondicionado', icon: 'Snowflake', color: '#06b6d4',
    types: [
      { slug: 'ac-gas', name: 'Recarga de gas', intervalDays: 365 },
      { slug: 'ac-compresor', name: 'Cambio de compresor' },
      { slug: 'ac-evaporador', name: 'Cambio de evaporador' },
      { slug: 'ac-condensador', name: 'Cambio de condensador' },
      { slug: 'ac-secador', name: 'Filtro secador', intervalDays: 730 },
      { slug: 'ac-fugas', name: 'Búsqueda / reparación de fugas' },
      { slug: 'ac-filtro', name: 'Filtro de cabina', intervalKm: 15000, intervalDays: 365 },
      { slug: 'ac-ventilador', name: 'Ventilador / resistencia / mandos' },
    ],
  },
  {
    slug: 'refrigerante', name: 'Refrigeración', icon: 'Thermometer', color: '#3b82f6',
    types: [
      { slug: 'refri-liquido', name: 'Cambio de refrigerante', intervalKm: 40000, intervalDays: 730 },
      { slug: 'refri-radiador', name: 'Radiador' },
      { slug: 'refri-termostato', name: 'Termostato', intervalKm: 60000 },
      { slug: 'refri-bomba', name: 'Bomba de agua', intervalKm: 60000 },
    ],
  },
  {
    slug: 'filtros', name: 'Filtros', icon: 'Filter', color: '#a16207',
    types: [
      { slug: 'filtro-aire', name: 'Filtro de aire', intervalKm: 15000 },
      { slug: 'filtro-gasolina', name: 'Filtro de gasolina', intervalKm: 20000 },
    ],
  },
  {
    slug: 'bujias', name: 'Encendido', icon: 'Flame', color: '#f97316',
    types: [
      { slug: 'bujias-cambio', name: 'Bujías', intervalKm: 30000 },
      { slug: 'bujias-cables', name: 'Cables de bujía / bobina', intervalKm: 60000 },
    ],
  },
  {
    slug: 'suspension', name: 'Suspensión y dirección', icon: 'ArrowDownUp', color: '#64748b',
    types: [
      { slug: 'susp-amortiguadores', name: 'Amortiguadores', intervalKm: 60000 },
      { slug: 'susp-rotulas', name: 'Rótulas / terminales / bujes' },
      { slug: 'susp-cremallera', name: 'Cremallera / bomba de dirección' },
    ],
  },
  {
    slug: 'extras', name: 'Piezas adicionales', icon: 'Wrench', color: '#10b981',
    types: [
      { slug: 'extras-pieza', name: 'Pieza / repuesto (otro)' },
      { slug: 'extras-mano-obra', name: 'Mano de obra / servicio (otro)' },
      { slug: 'extras-lavado', name: 'Lavado / detallado' },
    ],
  },
]

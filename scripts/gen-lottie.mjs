// Genera la animación Lottie de bienvenida (Corsa verde rodando). Uso: node scripts/gen-lottie.mjs
import { writeFileSync } from 'node:fs'

const W = 360, H = 240, FR = 30, OP = 90
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).concat(1)
const st = (v) => ({ a: 0, k: v })
const ease = { i: { x: [0.45], y: [1] }, o: { x: [0.55], y: [0] } }
const anim = (frames) => ({
  a: 1,
  k: frames.map(([t, s], idx) => {
    const next = frames[idx + 1]
    return next ? { t, s, e: next[1], ...ease } : { t, s }
  }),
})
const tr = (p = [0, 0]) => ({ ty: 'tr', p: st(p), a: st([0, 0]), s: st([100, 100]), r: st(0), o: st(100), sk: st(0), sa: st(0) })
const fill = (c, o = 100) => ({ ty: 'fl', c: st(hex(c)), o: st(o), r: 1 })
const stroke = (c, w, o = 100) => ({ ty: 'st', c: st(hex(c)), o: st(o), w: st(w), lc: 2, lj: 2 })
const poly = (pts, closed = true) => ({
  ty: 'sh',
  ks: st({ i: pts.map(() => [0, 0]), o: pts.map(() => [0, 0]), v: pts, c: closed }),
})
const rect = (w, h, r, p = [0, 0]) => ({ ty: 'rc', d: 1, s: st([w, h]), p: st(p), r: st(r) })
const ell = (w, h, p = [0, 0]) => ({ ty: 'el', d: 1, s: st([w, h]), p: st(p) })
const group = (nm, items, p = [0, 0]) => ({ ty: 'gr', nm, it: [...items, tr(p)] })

let ind = 0
const layer = (nm, shapes, ks = {}) => ({
  ddd: 0, ind: ++ind, ty: 4, nm, sr: 1, ip: 0, op: OP, st: 0, bm: 0,
  ks: {
    o: ks.o ?? st(100), r: ks.r ?? st(0), p: ks.p ?? st([0, 0, 0]), a: ks.a ?? st([0, 0, 0]), s: ks.s ?? st([100, 100, 100]),
  },
  shapes,
})

const GREEN = '#2fa36b', GREEN_D = '#1f7a50', GREEN_L = '#4cc58a', GLASS = '#cfe9f7'

// --- Carro (centro en 0,0; frente a la derecha) ---
const body = group('cuerpo', [
  poly([[-108, 24], [-108, -2], [-96, -9], [-40, -13], [60, -14], [100, -6], [110, 6], [110, 24]]),
  fill(GREEN), stroke(GREEN, 8),
])
const under = group('bajo', [poly([[-104, 22], [106, 22]], false), stroke(GREEN_D, 6)])
const cabin = group('cabina', [
  poly([[-88, -9], [-72, -40], [-22, -47], [24, -45], [50, -13]]),
  fill(GREEN_L), stroke(GREEN_L, 6),
])
const glass = group('vidrios', [
  poly([[-76, -13], [-62, -36], [-22, -41], [18, -40], [38, -13]]),
  fill(GLASS), stroke(GLASS, 3),
])
const pillar = group('pilar', [poly([[-8, -42], [-8, -13]], false), stroke(GREEN_L, 5)])
const door = group('puerta', [poly([[2, -10], [2, 21]], false), stroke(GREEN_D, 2.5, 80)])
const handle = group('manija', [poly([[-12, -4], [-2, -4]], false), stroke(GREEN_D, 3)])
const head = group('faro', [rect(10, 8, 3, [105, -1]), fill('#fde68a'), stroke('#fde68a', 2)])
const tail = group('luz', [rect(6, 10, 2, [-107, 3]), fill('#ef4444'), stroke('#ef4444', 2)])
const bumper = group('defensa', [poly([[100, 20], [112, 20]], false), stroke('#cbd5e1', 5)])

const carBounce = anim([[0, [0, 0, 0]], [8, [0, -2.5, 0]], [15, [0, 0, 0]], [23, [0, -2, 0]], [30, [0, 0, 0]], [38, [0, -2.5, 0]], [45, [0, 0, 0]], [53, [0, -2, 0]], [60, [0, 0, 0]], [68, [0, -2.5, 0]], [75, [0, 0, 0]], [83, [0, -2, 0]], [90, [0, 0, 0]]])
const carBase = [180, 118, 0]
const carPos = {
  a: 1,
  k: carBounce.k.map((kf, i, arr) => {
    const f = (v) => [carBase[0] + v[0], carBase[1] + v[1], 0]
    const n = arr[i + 1]
    return n ? { t: kf.t, s: f(kf.s), e: f(n.s), i: { x: 0.45, y: 1 }, o: { x: 0.55, y: 0 } } : { t: kf.t, s: f(kf.s) }
  }),
}
const carLayer = layer('carro', [bumper, under, body, cabin, glass, pillar, door, handle, head, tail], { p: carPos })

// --- Ruedas ---
const wheel = (nm, x) =>
  layer(nm, [
    group('llanta', [ell(40, 40), fill('#1e293b')]),
    group('aro', [ell(24, 24), fill('#e2e8f0')]),
    group('rayos', [poly([[-11, 0], [11, 0]], false), stroke('#64748b', 3), poly([[0, -11], [0, 11]], false), stroke('#64748b', 3)]),
    group('centro', [ell(7, 7), fill('#334155')]),
  ], { p: st([180 + x, 118 + 24, 0]), r: anim([[0, [0]], [90, [720]]]) })
const wheelA = wheel('rueda-trasera', -66)
const wheelB = wheel('rueda-delantera', 62)
// Rebote suave también en las ruedas (acompañan la carrocería, sin rotar con ella).
for (const w of [wheelA, wheelB]) {
  const bx = w.ks.p.k[0]
  w.ks.p = {
    a: 1,
    k: carBounce.k.map((kf, i, arr) => {
      const f = (v) => [bx, 118 + 24 + v[1] * 0.4, 0]
      const n = arr[i + 1]
      return n ? { t: kf.t, s: f(kf.s), e: f(n.s), i: { x: 0.45, y: 1 }, o: { x: 0.55, y: 0 } } : { t: kf.t, s: f(kf.s) }
    }),
  }
}

// --- Carretera: rayas que avanzan en bucle perfecto (periodo = 80 px) ---
const dashes = []
for (let i = -1; i < 7; i++) dashes.push(group(`raya${i}`, [rect(36, 4, 2, [i * 80, 0]), fill('#94a3b8', 70)]))
const road = layer('carretera-rayas', dashes, { p: anim([[0, [0, 188, 0]], [90, [-240, 188, 0]]]) })
const roadLine = layer('carretera', [group('linea', [poly([[-20, 0], [W + 20, 0]], false), stroke('#b6c8da', 3, 80)])], { p: st([0, 172, 0]) })

// --- Líneas de velocidad ---
const speed = (y, w, delay) =>
  layer(`viento${y}`, [group('l', [rect(w, 3, 1.5, [0, 0]), fill('#ffffff', 90)])], {
    p: anim([[delay, [W + 40, y, 0]], [delay + 45, [-60, y, 0]]]),
  })
const winds = [speed(96, 60, 0), speed(116, 90, 20), speed(138, 50, 40), speed(104, 70, 45), speed(150, 80, 8)]

// --- Nubes ---
const cloud = (nm, y, x0, x1, s) =>
  layer(nm, [group('nube', [ell(46, 22, [0, 0]), ell(30, 20, [-18, 4]), ell(34, 20, [18, 5]), fill('#ffffff', 90)])], {
    p: anim([[0, [x0, y, 0]], [90, [x1, y, 0]]]), s: st([s, s, 100]),
  })
const clouds = [cloud('nube1', 48, 330, 90, 100), cloud('nube2', 78, 120, -120, 70)]

// Orden: primero = encima.
const layers = [carLayer, wheelA, wheelB, ...winds, road, roadLine, ...clouds].map((l, i) => ({ ...l, ind: i + 1 }))

const json = { v: '5.7.0', fr: FR, ip: 0, op: OP, w: W, h: H, nm: 'Corsa verde', ddd: 0, assets: [], layers }
writeFileSync(new URL('../apps/web/src/assets/car.json', import.meta.url), JSON.stringify(json))
console.log('ok', JSON.stringify(json).length, 'bytes')

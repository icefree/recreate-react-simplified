const fs = require('fs')
const elements = []
let idC = 0
const gid = () => `el${++idC}`
const seed = () => Math.floor(Math.random() * 2e9)

function rect(id, x, y, w, h, bg, stroke, ss = 'solid', tId) {
  return { id, type: 'rectangle', x, y, width: w, height: h, angle: 0, strokeColor: stroke, backgroundColor: bg, fillStyle: 'solid', strokeWidth: 2, strokeStyle: ss, roughness: 0, opacity: 100, groupIds: [], frameId: null, roundness: { type: 3 }, seed: seed(), version: 1, versionNonce: seed(), isDeleted: false, boundElements: tId ? [{ id: tId, type: 'text' }] : null, updated: Date.now(), link: null, locked: false }
}

function txt(id, x, y, w, h, text, fs2, ff, sa, va, cid, sc) {
  return { id, type: 'text', x, y, width: w, height: h, angle: 0, strokeColor: sc || '#1e1e1e', backgroundColor: 'transparent', fillStyle: 'solid', strokeWidth: 2, strokeStyle: 'solid', roughness: 0, opacity: 100, groupIds: [], frameId: null, roundness: null, seed: seed(), version: 1, versionNonce: seed(), isDeleted: false, boundElements: null, updated: Date.now(), link: null, locked: false, text, fontSize: fs2, fontFamily: ff, textAlign: sa, verticalAlign: va, containerId: cid, originalText: text, autoResize: true, lineHeight: 1.25 }
}

function arrow(x, y1, y2, sId, eId) {
  return { id: gid(), type: 'arrow', x, y: y1, width: 0, height: y2 - y1, angle: 0, strokeColor: '#495057', backgroundColor: 'transparent', fillStyle: 'solid', strokeWidth: 2, strokeStyle: 'solid', roughness: 0, opacity: 100, groupIds: [], frameId: null, roundness: { type: 2 }, seed: seed(), version: 1, versionNonce: seed(), isDeleted: false, boundElements: null, updated: Date.now(), link: null, locked: false, points: [[0, 0], [0, y2 - y1]], startBinding: sId ? { elementId: sId, focus: 0, gap: 4, fixedPoint: null } : null, endBinding: eId ? { elementId: eId, focus: 0, gap: 4, fixedPoint: null } : null, startArrowhead: null, endArrowhead: 'arrow', elbowed: false }
}

function box(x, y, w, h, text, bg = 'transparent', stroke = '#495057', fontSize = 15) {
  const rId = gid(), tId = gid()
  elements.push(rect(rId, x, y, w, h, bg, stroke, 'solid', tId))
  elements.push(txt(tId, x + 8, y + 4, w - 16, h - 8, text, fontSize, 3, 'center', 'middle', rId, stroke))
  return rId
}

function label(x, y, text, fontSize = 20, ff = 1, color = '#1e1e1e') {
  const id = gid()
  elements.push(txt(id, x, y, text.length * fontSize * 0.55, fontSize * 1.25, text, fontSize, ff, 'left', 'top', null, color))
}

// ═══ Layout Constants ═══
const LX = 50, RX = 520, BW = 370, BH = 48, GAP = 22
const LC = LX + BW / 2, RC = RX + BW / 2

// ═══ Titles ═══
label(LX + 50, 10, '🔄 Initial Render Flow', 24, 1, '#1971c2')
label(RX + 50, 10, '⚡ setState Update Flow', 24, 1, '#e03131')

// ═══ LEFT FLOW ═══
const leftDefs = [
  ['root.render(createElement(App))', '#e7f5ff', '#1971c2'],
  ['reconcile(container, null, vnode)', 'transparent', '#495057'],
  ['isComponent(newVNode)?  →  YES', '#fff3bf', '#e8590c'],
  ['🔒 setCurrentComponent(newVNode)', '#d0bfff', '#7048e8'],
  ['vnode.type(props) → App()', '#f8f9fa', '#495057'],
  ['useState(0) → __hooks[0] → idx++', '#e7f5ff', '#1971c2'],
  ['🔓 clearCurrentComponent()', '#d0bfff', '#7048e8'],
  ['reconcile(parent, null, childVNode)', 'transparent', '#495057'],
  ['Save: __childVNode, __dom  ✅', '#b2f2bb', '#2f9e44'],
]

let y = 55
const leftIds = []
for (const [text, bg, stroke] of leftDefs) {
  const id = box(LX, y, BW, BH, text, bg, stroke)
  leftIds.push({ id, bottom: y + BH, top: y })
  y += BH + GAP
}
for (let i = 0; i < leftIds.length - 1; i++) {
  elements.push(arrow(LC, leftIds[i].bottom, leftIds[i + 1].top, leftIds[i].id, leftIds[i + 1].id))
}

// ═══ RIGHT FLOW ═══
const rightDefs = [
  ['setState(action)', '#ffe3e3', '#e03131'],
  ['hook.queue.push(action)', 'transparent', '#495057'],
  ['scheduleRerender(component)', 'transparent', '#495057'],
  ['queueMicrotask(flushUpdates)', '#fff3bf', '#e8590c'],
  ['flushUpdates() → renderComponent()', 'transparent', '#495057'],
  ['🔒 setCurrentComponent(comp)', '#d0bfff', '#7048e8'],
  ['comp.type(props) → consume queue', '#f8f9fa', '#495057'],
  ['🔓 clearCurrentComponent()', '#d0bfff', '#7048e8'],
  ['reconcile(parentDom, old, new)', 'transparent', '#495057'],
  ['Update: __childVNode, __dom  ✅', '#b2f2bb', '#2f9e44'],
]

y = 55
const rightIds = []
for (const [text, bg, stroke] of rightDefs) {
  const id = box(RX, y, BW, BH, text, bg, stroke)
  rightIds.push({ id, bottom: y + BH, top: y })
  y += BH + GAP
}
for (let i = 0; i < rightIds.length - 1; i++) {
  elements.push(arrow(RC, rightIds[i].bottom, rightIds[i + 1].top, rightIds[i].id, rightIds[i + 1].id))
}

// ═══ Annotations ═══
label(RX + BW + 12, 55 + 3 * (BH + GAP) + 12, '← batching!', 14, 1, '#e8590c')

// Hook sandwich bracket (left side)
label(LX - 30, 55 + 3 * (BH + GAP), '┃', 14, 3, '#7048e8')
label(LX - 30, 55 + 4 * (BH + GAP), '┃', 14, 3, '#7048e8')
label(LX - 30, 55 + 5 * (BH + GAP), '┃', 14, 3, '#7048e8')
label(LX - 85, 55 + 4 * (BH + GAP) - 5, 'Hook\nContext', 12, 1, '#7048e8')

// ═══ BOTTOM: Data Structure ═══
const bottomY = Math.max(55 + leftDefs.length * (BH + GAP), 55 + rightDefs.length * (BH + GAP)) + 10
box(LX, bottomY, RX + BW - LX, 60,
  'VNode: { __hooks: [{state, queue}], __parentDom, __childVNode, __dom }',
  '#f1f3f5', '#495057', 14)

// Legend
label(LX, bottomY + 75, '🟣 紫色 = Hook 上下文   🟡 黄色 = 关键判断   🟢 绿色 = 完成', 13, 1, '#868e96')

// ═══ Output ═══
const data = {
  type: 'excalidraw',
  version: 2,
  source: 'https://excalidraw.com',
  elements,
  appState: { gridSize: null, viewBackgroundColor: '#ffffff' },
  files: {},
}

const outPath = process.argv[2] || 'useState-flow.excalidraw'
fs.writeFileSync(outPath, JSON.stringify(data, null, 2))
console.log(`✅ Generated ${elements.length} elements → ${outPath}`)

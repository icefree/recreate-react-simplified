/**
 * Phase 3 Playground — Reconciliation 协调/Diffing
 *
 * 🎯 目标：演示 reconciler 的核心能力
 *   1. createRoot API — 创建根节点
 *   2. 增量更新 — 只修改变化的 DOM 节点
 *   3. 子节点增删 — 动态添加/移除列表项
 *   4. 属性 Diff — style、className 变化时的原地更新
 *
 * 💡 打开 DevTools → Elements 面板，观察 DOM 更新时：
 *    - 被修改的节点会"闪烁"（Chrome 的 DOM 变化高亮）
 *    - 未变化的节点不会闪烁 — 说明 reconciler 只更新了差异部分
 */

import MiniReact from '../mini-react/index.js'
const { createElement, createRoot } = MiniReact

// ─── 状态模拟（Phase 5 才会有 useState） ─────────────────────

let count = 0
let items = ['🍎 Apple', '🍌 Banana', '🍒 Cherry']
let theme = 'dark'

// ─── 构建 VNode 树 ──────────────────────────────────────────

function buildApp() {
  const isDark = theme === 'dark'

  return createElement(
    'div',
    {
      id: 'app',
      style: {
        padding: '2rem',
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        minHeight: '100vh',
        background: isDark ? '#0f0f1a' : '#f5f5f5',
        color: isDark ? '#e0e0e0' : '#333',
        transition: 'background 0.3s, color 0.3s',
      },
    },
    // 标题
    createElement(
      'h1',
      { style: { color: '#7c5cff', marginBottom: '0.5rem' } },
      '🔬 Mini-React Phase 3: Reconciliation'
    ),
    createElement(
      'p',
      { style: { color: isDark ? '#a0a0b0' : '#666', marginBottom: '2rem' } },
      'Diff & Patch — 只更新变化的 DOM，不重建整棵树'
    ),

    // ── 计数器区域 ──
    createElement(
      'div',
      {
        style: {
          padding: '1.5rem',
          background: isDark ? '#1a1a2e' : '#fff',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
      createElement('h2', { style: { marginBottom: '1rem' } }, '⏱ 计数器 — 属性 Diff'),
      createElement(
        'p',
        { style: { fontSize: '2rem', fontWeight: 'bold', color: '#7c5cff' } },
        `Count: ${count}`
      ),
      createElement(
        'p',
        { style: { color: isDark ? '#888' : '#999', fontSize: '0.85rem', marginTop: '0.5rem' } },
        '💡 点击按钮后，只有数字文本节点被更新（在 DevTools 中验证）'
      )
    ),

    // ── 列表区域 ──
    createElement(
      'div',
      {
        style: {
          padding: '1.5rem',
          background: isDark ? '#1a1a2e' : '#fff',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
      createElement('h2', { style: { marginBottom: '1rem' } }, '📋 列表 — 子节点协调'),
      createElement(
        'ul',
        { style: { listStyle: 'none', padding: 0 } },
        ...items.map((item, i) =>
          createElement(
            'li',
            {
              key: item,
              style: {
                padding: '0.75rem 1rem',
                marginBottom: '0.5rem',
                background: isDark ? '#252545' : '#f0f0f8',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              },
            },
            createElement('span', null, `${item}`),
            createElement(
              'span',
              { style: { color: '#888', fontSize: '0.8rem' } },
              `index: ${i}`
            )
          )
        )
      ),
      createElement(
        'p',
        { style: { color: isDark ? '#888' : '#999', fontSize: '0.85rem', marginTop: '0.5rem' } },
        `共 ${items.length} 项 — 增删项时，其余节点被复用（key 驱动）`
      )
    ),

    // ── 主题区域 ──
    createElement(
      'div',
      {
        style: {
          padding: '1.5rem',
          background: isDark ? '#1a1a2e' : '#fff',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
      createElement('h2', { style: { marginBottom: '1rem' } }, '🎨 主题 — 整树 Diff'),
      createElement(
        'p',
        null,
        `当前主题：${isDark ? '🌙 暗色' : '☀️ 亮色'}`
      ),
      createElement(
        'p',
        { style: { color: isDark ? '#888' : '#999', fontSize: '0.85rem', marginTop: '0.5rem' } },
        '💡 切换主题时，style 属性被 diff，DOM 节点本身不会被替换'
      )
    ),

    // ── 操作按钮区 ──
    createElement(
      'div',
      {
        style: {
          display: 'flex',
          gap: '0.75rem',
          flexWrap: 'wrap',
          marginTop: '1rem',
        },
      },
      makeButton('➕ Count +1', 'increment'),
      makeButton('➖ Count -1', 'decrement'),
      makeButton('🍇 添加 Grape', 'addItem'),
      makeButton('🗑 删除最后一项', 'removeItem'),
      makeButton('🔀 反转列表', 'reverseItems'),
      makeButton('🎨 切换主题', 'toggleTheme'),
      makeButton('💣 卸载', 'unmount')
    ),

    // ── 验证清单 ──
    createElement(
      'div',
      {
        style: {
          marginTop: '2rem',
          padding: '1rem',
          background: isDark ? '#141428' : '#fafafa',
          borderRadius: '8px',
          fontSize: '0.9rem',
          lineHeight: '1.8',
        },
      },
      createElement('h3', { style: { marginBottom: '0.5rem' } }, '✅ Phase 3 验证清单'),
      createElement('p', null, '• 修改属性时只更新变化的 prop，不重建 DOM'),
      createElement('p', null, '• 添加/删除子节点正确'),
      createElement('p', null, '• 节点类型变化时正确替换'),
      createElement('p', null, '• 多个 root 互不影响，分别 render/unmount 正确'),
      createElement('p', null, '• 列表在 key 稳定时可正确复用节点，重排不丢状态')
    )
  )
}

// ─── 按钮工厂 ──────────────────────────────────────────────

function makeButton(label, actionId) {
  return createElement(
    'button',
    {
      id: `btn-${actionId}`,
      style: {
        padding: '0.6rem 1.2rem',
        border: 'none',
        borderRadius: '8px',
        background: '#7c5cff',
        color: '#fff',
        cursor: 'pointer',
        fontSize: '0.9rem',
        fontWeight: '600',
      },
    },
    label
  )
}

// ─── 挂载 ───────────────────────────────────────────────────

const root = createRoot(document.getElementById('root'))
root.render(buildApp())

// ─── 交互（直接绑定原生事件，Phase 7 才会用事件委托） ─────────

function rerender() {
  root.render(buildApp())
}

document.addEventListener('click', (e) => {
  const id = e.target.id
  switch (id) {
    case 'btn-increment':
      count++
      rerender()
      break
    case 'btn-decrement':
      count--
      rerender()
      break
    case 'btn-addItem':
      items = [...items, '🍇 Grape']
      rerender()
      break
    case 'btn-removeItem':
      items = items.slice(0, -1)
      rerender()
      break
    case 'btn-reverseItems':
      items = [...items].reverse()
      rerender()
      break
    case 'btn-toggleTheme':
      theme = theme === 'dark' ? 'light' : 'dark'
      rerender()
      break
    case 'btn-unmount':
      root.unmount()
      break
  }
})

console.log('🔬 Phase 3 已启动 — 打开 DevTools 观察 DOM 更新')

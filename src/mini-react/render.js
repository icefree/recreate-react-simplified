/**
 * ============================================================
 * Mini-React: render — DOM 创建与属性操作
 * ============================================================
 *
 * 职责：
 * 1. createDom   — 根据 VNode 创建对应的真实 DOM 节点
 * 2. updateProps  — 将 props 差异应用到 DOM 上（支持新增/更新/删除）
 * 3. render       — Phase 1/2 的全量挂载入口（Phase 3 开始由 reconciler 接管）
 *
 * ============================================================
 */

import { TEXT_ELEMENT } from './createElement.js'

// ─── DOM 节点创建 ─────────────────────────────────────────────

/**
 * 根据 VNode 创建真实 DOM 节点（不包含子节点）
 *
 * @param {Object} vnode - 虚拟 DOM 节点
 * @returns {HTMLElement|Text} 真实 DOM 节点
 */
export function createDom(vnode) {
  if (vnode.type === TEXT_ELEMENT) {
    return document.createTextNode(vnode.props.nodeValue)
  }
  const dom = document.createElement(vnode.type)
  updateProps(dom, {}, vnode.props)
  return dom
}

// ─── 属性操作 ─────────────────────────────────────────────────

/**
 * 比较新旧 props，将差异应用到 DOM 节点
 *
 * 支持的属性类型：
 * - children    — 跳过，由 reconciler 单独处理
 * - className   — 映射到 dom.className
 * - style       — 对象形式，逐属性 diff
 * - on*         — 事件监听器（先简单处理，Phase 7 改为事件委托）
 * - key         — 跳过，仅供 reconciler 使用
 * - 其他        — 通过 dom[key] 直接赋值
 *
 * @param {HTMLElement} dom     - 真实 DOM 节点
 * @param {Object}      oldProps - 旧属性（首次渲染时传 {}）
 * @param {Object}      newProps - 新属性
 */
export function updateProps(dom, oldProps, newProps) {
  const skipKeys = new Set(['children', 'key'])

  // 1. 删除旧属性中不再存在的
  Object.keys(oldProps).forEach(key => {
    if (skipKeys.has(key)) return
    if (!(key in newProps)) {
      removeProp(dom, key, oldProps[key])
    }
  })

  // 2. 新增或更新属性
  Object.keys(newProps).forEach(key => {
    if (skipKeys.has(key)) return
    if (oldProps[key] === newProps[key]) return // 值相同则跳过
    setProp(dom, key, newProps[key], oldProps[key])
  })
}

/**
 * 设置单个属性到 DOM 节点
 */
function setProp(dom, key, value, oldValue) {
  if (key === 'className') {
    dom.className = value || ''
  } else if (key === 'style') {
    if (typeof value === 'object') {
      // 清除旧 style 中新 style 不再包含的属性
      if (typeof oldValue === 'object' && oldValue) {
        Object.keys(oldValue).forEach(styleKey => {
          if (!(styleKey in value)) {
            dom.style[styleKey] = ''
          }
        })
      }
      Object.assign(dom.style, value)
    } else {
      dom.style.cssText = value || ''
    }
  } else if (key.startsWith('on')) {
    const eventName = key.slice(2).toLowerCase()
    // 移除旧事件，绑定新事件
    if (oldValue) {
      dom.removeEventListener(eventName, oldValue)
    }
    dom.addEventListener(eventName, value)
  } else {
    // nodeValue、id 等常规属性
    dom[key] = value
  }
}

/**
 * 从 DOM 节点移除单个属性
 */
function removeProp(dom, key, oldValue) {
  if (key === 'className') {
    dom.className = ''
  } else if (key === 'style') {
    dom.style.cssText = ''
  } else if (key.startsWith('on')) {
    const eventName = key.slice(2).toLowerCase()
    dom.removeEventListener(eventName, oldValue)
  } else {
    dom[key] = ''
  }
}

// ─── Phase 1/2 简易渲染入口 ───────────────────────────────────

/**
 * 将 VNode 渲染为真实 DOM 并挂载到容器中
 * （全量挂载，不做 Diff。Phase 3 开始请使用 createRoot API）
 *
 * @param {Object} vnode       - 虚拟 DOM 节点
 * @param {HTMLElement} container - 挂载目标容器
 */
export function render(vnode, container) {
  const dom = createDom(vnode)
  vnode.props.children.forEach(child => render(child, dom))
  container.appendChild(dom)
}
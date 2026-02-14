/**
 * ============================================================
 * Mini-React: reconciler — 协调 / Diffing 引擎（两阶段模型）
 * ============================================================
 *
 * 🎯 核心职责：
 *   对比新旧 VNode 树，计算最小 DOM 变更并应用。
 *
 * 🏗️ 两阶段架构（模拟真正的 React）：
 *
 *   ┌─────────────────────────────────────────────────────────┐
 *   │ Phase 1: Render Phase（渲染/协调阶段 — 纯计算）        │
 *   │                                                         │
 *   │  遍历 VNode 树，调用组件函数，计算 diff。               │
 *   │  收集"需要做什么"到 pendingEffects 数组中。              │
 *   │  ⚠️ 不直接操作 DOM！                                   │
 *   │                                                         │
 *   │  Effect 类型：                                          │
 *   │    PLACEMENT — 新节点需要挂载到 DOM 树                   │
 *   │    DELETION  — 旧节点需要从 DOM 树中移除                 │
 *   │    REPLACE   — 旧节点需要被新节点替换                    │
 *   │    UPDATE    — 已有节点的属性需要更新                    │
 *   │    REORDER   — 子节点需要重新排列（insertBefore）        │
 *   ├─────────────────────────────────────────────────────────┤
 *   │ Phase 2: Commit Phase（commitRoot — 批量 DOM 变更）     │
 *   │                                                         │
 *   │  遍历 pendingEffects，按顺序执行所有 DOM 操作。         │
 *   │  这一步是同步的、不可中断的。                           │
 *   └─────────────────────────────────────────────────────────┘
 *
 * React Diff 三大假设：
 *   1. 不同类型的元素产生不同的树 → 类型变了整棵替换
 *   2. 同层级比较 → 不跨层级移动节点
 *   3. key 标识同类元素 → 用 key 区分列表项
 *
 * ============================================================
 */

import { TEXT_ELEMENT } from './createElement.js'
import { createDom, updateProps } from './render.js'
import { isComponent, getComponentDom } from './component.js'
import { setCurrentComponent, clearCurrentComponent, unmountComponent } from './hooks.js'

// ─── Effect 类型常量 ────────────────────────────────────────

const PLACEMENT = 'PLACEMENT'  // appendChild — 新增节点
const DELETION  = 'DELETION'   // removeChild — 删除节点
const REPLACE   = 'REPLACE'    // replaceChild — 替换节点
const UPDATE    = 'UPDATE'     // updateProps — 属性更新
const REORDER   = 'REORDER'    // insertBefore — 重排序

// ─── Effect 收集器 ──────────────────────────────────────────

/**
 * 待提交的 effect 列表
 * Render Phase 中收集，Commit Phase 中消费
 */
let pendingEffects = []

/**
 * 调试开关 — 设为 true 可在控制台看到两阶段的详细执行过程
 * 也可以通过 setDebugMode(true) 动态开启
 */
let DEBUG = true

export function setDebugMode(enabled) {
  DEBUG = enabled
}

// ─── 辅助：描述 VNode 类型（用于日志） ──────────────────────

function describeVNode(vnode) {
  if (!vnode) return 'null'
  if (isComponent(vnode)) return `<${vnode.type.name || 'Anonymous'} />`
  if (vnode.type === TEXT_ELEMENT) {
    const text = vnode.props.nodeValue
    return `"${text.length > 20 ? text.slice(0, 20) + '...' : text}"`
  }
  return `<${vnode.type}>`
}

function describeDom(dom) {
  if (!dom) return 'null'
  if (dom.nodeType === 3) return `"${dom.nodeValue?.slice(0, 15) || ''}"`
  return `<${dom.tagName?.toLowerCase() || 'unknown'}${dom.id ? '#' + dom.id : ''}>`
}

// ─── 主入口 ───────────────────────────────────────────────────

/**
 * 协调单个节点（Render Phase）
 *
 * 对比 oldVNode 与 newVNode，计算 diff，将 DOM 变更收集到 pendingEffects。
 * ⚠️ 不直接操作 DOM — 所有 DOM 变更延迟到 commitRoot 执行。
 *
 * @param {HTMLElement} parentDom - 父 DOM 节点
 * @param {Object|null} oldVNode  - 上一次渲染的 VNode（null 表示新增）
 * @param {Object|null} newVNode  - 本次渲染的 VNode（null 表示删除）
 * @param {number}      [index]   - 在父节点 children 中的位置索引
 */
export function reconcile(parentDom, oldVNode, newVNode, index = 0) {
  // ── 函数式组件处理 ────────────────────────────────────────

  if (isComponent(newVNode)) {
    if(isComponent(oldVNode) && oldVNode.type === newVNode.type){
      newVNode.__hooks = oldVNode.__hooks
    }

    setCurrentComponent(newVNode)
    newVNode.__parentDom = parentDom

    if (DEBUG) {
      console.log(`  🔵 Render: 调用组件 ${describeVNode(newVNode)}`)
    }

    let childVNode
    try {
      childVNode = newVNode.type(newVNode.props)
    } finally {
      clearCurrentComponent()
    }

    const oldChildVNode = isComponent(oldVNode) ? oldVNode.__childVNode : oldVNode
    reconcile(parentDom, oldChildVNode ?? null, childVNode)
    newVNode.__childVNode = childVNode
    newVNode.__dom = getComponentDom(childVNode)
    return
  }

  if (isComponent(oldVNode)) {
    unmountComponent(oldVNode)
    oldVNode = oldVNode.__childVNode
  }

  // ── 原生元素协调（收集 effects，不直接操作 DOM） ──────────

  if(oldVNode == null){
    if(newVNode == null) return

    // 创建 DOM 子树（这是 Render Phase 的一部分 — createDom 不涉及 DOM 树挂载）
    const dom = mountVNode(newVNode)

    // 收集 PLACEMENT effect（延迟到 Commit Phase 执行 appendChild）
    pendingEffects.push({
      type: PLACEMENT,
      dom,
      parentDom,
      description: `${describeVNode(newVNode)} → ${describeDom(parentDom)}`,
    })
  }else
  if(newVNode == null){
    // 删除节点 — 先递归清理 effects
    cleanupEffects(oldVNode)
    const dom = oldVNode.__dom

    // 收集 DELETION effect（延迟到 Commit Phase 执行 removeChild）
    pendingEffects.push({
      type: DELETION,
      dom,
      parentDom,
      description: `${describeVNode(oldVNode)} ← ${describeDom(parentDom)}`,
    })
  }else
  if(oldVNode.type !== newVNode.type){
    // 类型变化 — 清理旧子树 + 创建新子树 + 替换
    cleanupEffects(oldVNode)
    const newDom = mountVNode(newVNode)
    const oldDom = oldVNode.__dom

    // 收集 REPLACE effect（延迟到 Commit Phase 执行 replaceChild）
    pendingEffects.push({
      type: REPLACE,
      newDom,
      oldDom,
      parentDom,
      description: `${describeVNode(oldVNode)} ⇒ ${describeVNode(newVNode)}`,
    })
  }else
  if(oldVNode.type === newVNode.type){
    if(oldVNode.type === TEXT_ELEMENT){
      newVNode.__dom = oldVNode.__dom
      if(oldVNode.props.nodeValue !== newVNode.props.nodeValue){
        // 收集 UPDATE effect（文本节点内容变化）
        pendingEffects.push({
          type: UPDATE,
          dom: oldVNode.__dom,
          updateFn: () => { oldVNode.__dom.nodeValue = newVNode.props.nodeValue },
          description: `文本: "${oldVNode.props.nodeValue?.slice(0, 15)}" → "${newVNode.props.nodeValue?.slice(0, 15)}"`,
        })
      }
    }else{
      newVNode.__dom = oldVNode.__dom
      const oldProps = oldVNode.props
      const newProps = newVNode.props

      // 检查是否有属性变化（跳过 children 和 key）
      const hasPropsChanged = Object.keys(newProps).some(k =>
        k !== 'children' && k !== 'key' && oldProps[k] !== newProps[k]
      ) || Object.keys(oldProps).some(k =>
        k !== 'children' && k !== 'key' && !(k in newProps)
      )

      if (hasPropsChanged) {
        // 收集 UPDATE effect（属性变化）
        pendingEffects.push({
          type: UPDATE,
          dom: newVNode.__dom,
          updateFn: () => { updateProps(newVNode.__dom, oldProps, newProps) },
          description: `${describeVNode(newVNode)} 属性更新`,
        })
      }

      reconcileChildren(newVNode.__dom, oldVNode.props.children, newVNode.props.children)
    }
  }
}

// ─── 递归清理 Effects ─────────────────────────────────────────

/**
 * 递归清理 VNode 树中所有组件的 useEffect cleanup
 *
 * ⚠️ 只负责清理副作用，不删除 DOM（DOM 删除由 commitRoot 负责）
 */
function cleanupEffects(vnode) {
  if (!vnode) return

  if(isComponent(vnode)){
    unmountComponent(vnode)
    cleanupEffects(vnode.__childVNode)
  }else{
    vnode.props?.children?.forEach(child => cleanupEffects(child))
  }
}

// ─── 挂载（递归创建 DOM — Render Phase） ─────────────────────

/**
 * 递归创建 DOM 子树（不挂载到 DOM 树中）
 *
 * 📌 这属于 Render Phase 的一部分：
 *    - 创建 DOM 节点（createDom）
 *    - 组装子树（子节点 appendChild 到父节点）
 *    - 设置 __dom 引用
 *
 * 但不会将根节点挂载到实际的 parentDom —
 * 那一步由 PLACEMENT effect 在 Commit Phase 完成。
 */
function mountVNode(vnode) {
  if(isComponent(vnode)){
    setCurrentComponent(vnode)

    let childVNode
    try {
      childVNode = vnode.type(vnode.props)
    } finally {
      clearCurrentComponent()
    }

    const dom = mountVNode(childVNode)
    vnode.__childVNode = childVNode
    vnode.__dom = dom
    return dom
  }

  const dom = createDom(vnode)
  vnode.__dom = dom
  if (vnode.props.children) {
    vnode.props.children.forEach(child => {
      const childDom = mountVNode(child)
      // 内部子树组装 — 这不是"挂载到真实 DOM"，
      // 而是构建 detached 的 DOM 子树
      dom.appendChild(childDom)
    })
  }
  return dom
}

// ─── 子节点协调 ─────────────────────────────────────────────

function reconcileChildren(parentDom, oldChildren = [], newChildren = []) {
  const hasKey = newChildren.some(child => child.props?.key != null) || oldChildren.some(child => child.props?.key != null)
  if(hasKey){
    reconcileKeyedChildren(parentDom, oldChildren, newChildren)
  }else{
    reconcileUnkeyedChildren(parentDom, oldChildren, newChildren)
  }
}

// ─── 无 key 的位置对齐 Diff ──────────────────────────────────

function reconcileUnkeyedChildren(parentDom, oldChildren, newChildren) {
  const maxLen = Math.max(oldChildren.length, newChildren.length)
  for (let i = 0; i < maxLen; i++) {
    reconcile(parentDom, oldChildren[i] ?? null, newChildren[i] ?? null, i)
  }
}

// ─── 有 key 的子节点 Diff ───────────────────────────────────

function reconcileKeyedChildren(parentDom, oldChildren, newChildren) {
  const oldKeyed = new Map()
  const oldUnkeyed = []
  oldChildren.forEach(child => {
    if (child.props?.key != null) {
      oldKeyed.set(child.props.key, child)
    } else {
      oldUnkeyed.push(child)
    }
  })
  let unkeyedIndex = 0

  // 第一步：递归协调每个新子节点（收集 PLACEMENT / DELETION / UPDATE 等 effects）
  newChildren.forEach(newChild => {
    let matchedOld
    if (newChild.props?.key != null) {
      matchedOld = oldKeyed.get(newChild.props.key)
      if (matchedOld) {
        oldKeyed.delete(newChild.props.key)
      }
    } else {
      matchedOld = oldUnkeyed[unkeyedIndex]
      unkeyedIndex++
    }
    reconcile(parentDom, matchedOld ?? null, newChild, 0)
  })

  // 收集"删除不再需要的旧节点"的 effects
  oldKeyed.forEach(staleChild => {
    reconcile(parentDom, staleChild, null, 0)
  })
  for (let i = unkeyedIndex; i < oldUnkeyed.length; i++) {
    reconcile(parentDom, oldUnkeyed[i], null, 0)
  }

  // 第二步：收集 REORDER effect（按新的期望顺序排列所有子节点 DOM）
  // 📌 不逐个计算 insertBefore，而是记录完整的期望顺序，
  //    在 Commit Phase 中一次性按顺序排列。
  const desiredOrder = newChildren
    .map(child => child.__dom || getComponentDom(child))
    .filter(Boolean)

  if (desiredOrder.length > 0) {
    pendingEffects.push({
      type: REORDER,
      parentDom,
      desiredOrder,
      description: `${desiredOrder.length} 个子节点重排序`,
    })
  }
}

// ═══════════════════════════════════════════════════════════════
// Commit Phase — commitRoot
// ═══════════════════════════════════════════════════════════════

/**
 * commitRoot — 提交所有 pending effects 到真实 DOM
 *
 * 这是 React 的 Commit Phase：
 *   遍历在 Render Phase 中收集的 pendingEffects 数组，
 *   按顺序执行所有 DOM 操作（appendChild、removeChild、replaceChild、updateProps）。
 *
 * 📌 为什么要分两个阶段？
 *
 *   1. **一致性**：Render Phase 可以被中断/重启（React Concurrent Mode），
 *      但 Commit Phase 必须同步完成，保证 DOM 不会处于中间状态。
 *
 *   2. **批量优化**：收集所有变更后一次性应用，减少浏览器重排/重绘。
 *
 *   3. **可预测性**：effect 列表可以被检查、排序、甚至回滚。
 *
 * 调用时机：
 *   - root.render() 中 reconcile 之后
 *   - root.unmount() 中 reconcile 之后
 *   - hooks.js 的 renderComponent 中 reconcile 之后
 */
export function commitRoot() {
  const effects = pendingEffects
  pendingEffects = []  // 重置，准备下一轮

  if (effects.length === 0) return

  if (DEBUG) {
    console.log('')
    console.log('%c🟢 ═══ Commit Phase (commitRoot) ═══', 'color: #4ade80; font-weight: bold; font-size: 14px')
    console.log(`%c   共 ${effects.length} 个 effect 待提交`, 'color: #888')
  }

  effects.forEach((effect, i) => {
    commitEffect(effect, i)
  })

  if (DEBUG) {
    console.log('%c🟢 ═══ Commit Phase 完成 ═══', 'color: #4ade80; font-weight: bold')
    console.log('')
  }
}

/**
 * 执行单个 effect — 将变更应用到 DOM
 */
function commitEffect(effect, index) {
  const prefix = `   [${index + 1}]`

  switch (effect.type) {
    case PLACEMENT: {
      // appendChild — 将新建的 DOM 子树挂载到父节点
      effect.parentDom.appendChild(effect.dom)
      if (DEBUG) {
        console.log(`%c${prefix} ✅ PLACEMENT: ${effect.description}`, 'color: #4ade80')
      }
      break
    }

    case DELETION: {
      // removeChild — 从 DOM 树中移除节点
      effect.parentDom.removeChild(effect.dom)
      if (DEBUG) {
        console.log(`%c${prefix} 🗑️  DELETION:  ${effect.description}`, 'color: #ef4444')
      }
      break
    }

    case REPLACE: {
      // replaceChild — 用新节点替换旧节点
      effect.parentDom.replaceChild(effect.newDom, effect.oldDom)
      if (DEBUG) {
        console.log(`%c${prefix} 🔄 REPLACE:   ${effect.description}`, 'color: #f59e0b')
      }
      break
    }

    case UPDATE: {
      // updateProps / nodeValue — 更新已有节点
      effect.updateFn()
      if (DEBUG) {
        console.log(`%c${prefix} 📝 UPDATE:    ${effect.description}`, 'color: #7c5cff')
      }
      break
    }

    case REORDER: {
      // 按期望顺序逐个 insertBefore — 确保子节点 DOM 排列正确
      const { parentDom: parent, desiredOrder } = effect
      desiredOrder.forEach((dom, i) => {
        const currentAtPosition = parent.childNodes[i]
        if (dom !== currentAtPosition) {
          parent.insertBefore(dom, currentAtPosition || null)
        }
      })
      if (DEBUG) {
        console.log(`%c${prefix} ↕️  REORDER:   ${effect.description}`, 'color: #06b6d4')
      }
      break
    }

    default:
      console.warn(`Unknown effect type: ${effect.type}`)
  }
}

/**
 * 开始新的 Render Phase 时打日志
 * 供 root.js / hooks.js 调用
 */
export function logRenderPhaseStart(source) {
  if (DEBUG) {
    console.log('')
    console.log(`%c🔵 ═══ Render Phase 开始 (${source}) ═══`, 'color: #60a5fa; font-weight: bold; font-size: 14px')
  }
}

export function logRenderPhaseEnd() {
  if (DEBUG) {
    console.log('%c🔵 ═══ Render Phase 完成 ═══', 'color: #60a5fa; font-weight: bold')
    console.log(`%c   收集到 ${pendingEffects.length} 个 effects`, 'color: #888')
  }
}

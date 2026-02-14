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
 *   │  收集"需要做什么"到 pendingMutations 数组中。              │
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
 *   │  遍历 pendingMutations，按顺序执行所有 DOM 操作。         │
 *   │  这一步是同步的、不可中断的。                           │
 *   └─────────────────────────────────────────────────────────┘
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

// ─── Mutation 类型常量 ────────────────────────────────────────

const PLACEMENT = 'PLACEMENT'  // appendChild — 新增节点
const DELETION  = 'DELETION'   // removeChild — 删除节点
const REPLACE   = 'REPLACE'    // replaceChild — 替换节点
const UPDATE    = 'UPDATE'     // updateProps — 属性更新
const REORDER   = 'REORDER'    // insertBefore — 重排序

// ─── Mutation 收集器 ──────────────────────────────────────────

/**
 * 待提交的 mutation 列表
 * Render Phase 中收集，Commit Phase 中消费
 *
 * 每个 mutation 的结构：
 *   {
 *     type: PLACEMENT | DELETION | REPLACE | UPDATE | REORDER,
 *     parentDom: HTMLElement,   // 父 DOM 节点
 *     dom?: HTMLElement,        // PLACEMENT / DELETION 的目标 DOM
 *     newDom?: HTMLElement,     // REPLACE 的新 DOM
 *     oldDom?: HTMLElement,     // REPLACE 的旧 DOM
 *     updateFn?: Function,     // UPDATE 的更新函数
 *     desiredOrder?: Array,    // REORDER 的期望子节点顺序
 *   }
 */
let pendingMutations = []

/**
 * 获取当前 pendingMutations（供测试使用）
 */
export function getPendingMutations() {
  return pendingMutations
}

// ─── 主入口（Render Phase） ──────────────────────────────────

/**
 * 协调单个节点（Render Phase）
 *
 * 对比 oldVNode 与 newVNode，计算 diff，将 DOM 变更收集到 pendingMutations。
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
    if (isComponent(oldVNode) && oldVNode.type === newVNode.type) {
      newVNode.__hooks = oldVNode.__hooks
    }

    setCurrentComponent(newVNode)
    newVNode.__parentDom = parentDom

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

  // ── 原生元素协调（收集 mutation，不直接操作 DOM） ──────────

  if (oldVNode == null) {
    if (newVNode == null) return

    // 创建 DOM 子树（Render Phase 的一部分 — 构建 detached 的 DOM 树）
    const dom = mountVNode(newVNode)

    // 📦 收集 PLACEMENT mutation（延迟到 Commit Phase 执行 appendChild）
    pendingMutations.push({
      type: PLACEMENT,
      dom,
      parentDom,
    })
  } else
  if (newVNode == null) {
    // 删除节点 — 先递归清理副作用
    cleanupEffects(oldVNode)
    const dom = oldVNode.__dom

    // 📦 收集 DELETION mutation（延迟到 Commit Phase 执行 removeChild）
    pendingMutations.push({
      type: DELETION,
      dom,
      parentDom,
    })
  } else
  if (oldVNode.type !== newVNode.type) {
    // 类型变化 — 清理旧子树 + 创建新子树
    cleanupEffects(oldVNode)
    const newDom = mountVNode(newVNode)
    const oldDom = oldVNode.__dom

    // 📦 收集 REPLACE mutation（延迟到 Commit Phase 执行 replaceChild）
    pendingMutations.push({
      type: REPLACE,
      newDom,
      oldDom,
      parentDom,
    })
  } else
  if (oldVNode.type === newVNode.type) {
    if (oldVNode.type === TEXT_ELEMENT) {
      newVNode.__dom = oldVNode.__dom
      if (oldVNode.props.nodeValue !== newVNode.props.nodeValue) {
        // 📦 收集 UPDATE mutation（延迟到 Commit Phase 执行 updateProps）
        pendingMutations.push({
          type: UPDATE,
          updateFn: () => { oldVNode.__dom.nodeValue = newVNode.props.nodeValue },
        })
      }
    } else {
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
        // 📦 收集 UPDATE mutation（延迟到 Commit Phase 执行 updateProps）  
        pendingMutations.push({
          type: UPDATE,
          updateFn: () => { updateProps(newVNode.__dom, oldProps, newProps) },
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

  if (isComponent(vnode)) {
    unmountComponent(vnode)
    cleanupEffects(vnode.__childVNode)
  } else {
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
  if (isComponent(vnode)) {
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
  if (hasKey) {
    reconcileKeyedChildren(parentDom, oldChildren, newChildren)
  } else {
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

  // 第一步：递归协调每个新子节点（收集 effects）
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
  const desiredOrder = newChildren
    .map(child => child.__dom || getComponentDom(child))
    .filter(Boolean)

  if (desiredOrder.length > 0) {
    pendingMutations.push({
      type: REORDER,
      parentDom,
      desiredOrder,
    })
  }
}

// ═══════════════════════════════════════════════════════════════
// Commit Phase — commitRoot
// ═══════════════════════════════════════════════════════════════

/**
 * commitRoot — 提交所有 pending effects 到真实 DOM
 *
 * TODO: 实现这个函数
 *
 * 这是 React 的 Commit Phase：
 *   遍历在 Render Phase 中收集的 pendingMutations 数组，
 *   按顺序执行所有 DOM 操作。
 *
 * 步骤：
 *   1. 取出 pendingMutations 并将其重置为空数组（准备下一轮）
 *      const mutations = pendingMutations
 *      pendingMutations = []
 *
 *   2. 如果没有 mutations 就直接 return
 *
 *   3. 遍历 mutations 数组，对每个 mutation 调用 commitMutation(mutation)
 *
 * 💡 为什么先赋值再重置？
 *    如果在 commitMutation 过程中触发了新的 reconcile（比如通过 setState），
 *    新的 mutations 会被收集到新的 pendingMutations 数组中，不会和当前这批混在一起。
 */
export function commitRoot() {
  // TODO: 实现 commitRoot
  // 提示：3 行核心逻辑
  //   1. 保存当前 mutations 并重置 pendingMutations
  //   2. 提前 return 如果没有 mutations
  //   3. 遍历 mutations，调用 commitMutation
  const mutations = pendingMutations
  pendingMutations = []
  if (mutations.length === 0) return
  mutations.forEach(mutation => commitMutation(mutation))
}

/**
 * commitMutation — 执行单个 mutation，将变更应用到 DOM
 *
 * TODO: 实现这个函数
 *
 * 根据 mutation.type 执行对应的 DOM 操作：
 *
 *   ┌──────────────┬────────────────────────────────────────────────┐
 *   │ Mutation Type│ DOM 操作                                       │
 *   ├──────────────┼────────────────────────────────────────────────┤
 *   │ PLACEMENT    │ mutation.parentDom.appendChild(mutation.dom)   │
 *   │              │ 将新建的 DOM 子树挂载到父节点                    │
 *   ├──────────────┼────────────────────────────────────────────────┤
 *   │ DELETION     │ mutation.parentDom.removeChild(mutation.dom)   │
 *   │              │ 从 DOM 树中移除节点                             │
 *   ├──────────────┼────────────────────────────────────────────────┤
 *   │ REPLACE      │ mutation.parentDom.replaceChild(                 │
 *   │              │   mutation.newDom, mutation.oldDom                 │
 *   │              │ )                                              │
 *   │              │ 用新节点替换旧节点                              │
 *   ├──────────────┼────────────────────────────────────────────────┤
 *   │ UPDATE       │ mutation.updateFn()                              │
 *   │              │ 执行预设的更新函数（更新属性 / nodeValue）       │
 *   ├──────────────┼────────────────────────────────────────────────┤
 *   │ REORDER      │ 遍历 mutation.desiredOrder，                     │
 *   │              │ 逐个 insertBefore 确保子节点顺序正确            │
 *   │              │                                                │
 *   │              │ desiredOrder.forEach((dom, i) => {             │
 *   │              │   const current = parentDom.childNodes[i]      │
 *   │              │   if (dom !== current) {                       │
 *   │              │     parentDom.insertBefore(dom, current)       │
 *   │              │   }                                            │
 *   │              │ })                                             │
 *   └──────────────┴────────────────────────────────────────────────┘
 *
 * 步骤：
 *   使用 switch (mutation.type) 分发到不同的 DOM 操作
 *
 * @param {Object} mutation - 待执行的 mutation 对象
 */
function commitMutation(mutation) {
  // TODO: 实现 commitMutation
  // 提示：switch on mutation.type，5 个 case 对应 5 种 DOM 操作
  switch (mutation.type) {
    case PLACEMENT:
      mutation.parentDom.appendChild(mutation.dom)
      break
    case DELETION:
      mutation.parentDom.removeChild(mutation.dom)
      break
    case REPLACE:
      mutation.parentDom.replaceChild(mutation.newDom, mutation.oldDom)
      break
    case UPDATE:
      mutation.updateFn()
      break
    case REORDER:
      mutation.desiredOrder.forEach((dom, i) => {
        const current = mutation.parentDom.childNodes[i]
        if (dom !== current) {
          mutation.parentDom.insertBefore(dom, current)
        }
      })
      break
    default:
      break
  }
}

/**
 * ============================================================
 * Mini-React: reconciler — 协调 / Diffing 引擎
 * ============================================================
 *
 * 🎯 核心职责：
 *   对比新旧 VNode 树，计算最小 DOM 变更并应用。
 *
 * React Diff 三大假设：
 *   1. 不同类型的元素产生不同的树 → 类型变了整棵替换
 *   2. 同层级比较 → 不跨层级移动节点
 *   3. key 标识同类元素 → 用 key 区分列表项
 *
 * 数据流：
 *   reconcile(parentDom, oldVNode, newVNode)
 *     ├─ 函数组件  → 调用函数，递归协调子 VNode
 *     ├─ 新增节点 → createDom + mount
 *     ├─ 删除节点 → removeChild
 *     ├─ 类型变化 → replaceChild
 *     └─ 类型相同 → updateProps + reconcileChildren
 *
 * 💡 关键设计：
 *   - 原生元素 VNode：__dom 指向对应的真实 DOM 节点
 *   - 函数组件 VNode：__childVNode 保存调用函数后得到的子 VNode 树
 *     函数组件不产生自己的 DOM 节点，其"DOM"就是子 VNode 树的根 DOM
 *
 * Phase 6 新增职责：
 *   - 组件卸载时执行 useEffect 的 cleanup 函数
 *   - 需要在以下 3 个位置调用 unmountComponent / unmountVNode：
 *     1. 组件被替换为非组件时（isComponent(oldVNode) && !isComponent(newVNode)）
 *     2. 节点被删除时（newVNode == null）
 *     3. 节点类型变化时（oldVNode.type !== newVNode.type）
 *
 * ============================================================
 */

import { TEXT_ELEMENT } from './createElement.js'
import { createDom, updateProps } from './render.js'
import { isComponent, getComponentDom } from './component.js'
import { setCurrentComponent, clearCurrentComponent, unmountComponent } from './hooks.js'

// ─── 主入口 ───────────────────────────────────────────────────

/**
 * 协调单个节点
 *
 * 对比 oldVNode 与 newVNode，计算最小 DOM 操作并执行。
 * 执行完毕后，newVNode.__dom 会指向对应的真实 DOM 节点。
 *
 * @param {HTMLElement} parentDom - 父 DOM 节点
 * @param {Object|null} oldVNode  - 上一次渲染的 VNode（null 表示新增）
 * @param {Object|null} newVNode  - 本次渲染的 VNode（null 表示删除）
 * @param {number}      [index]   - 在父节点 children 中的位置索引
 */
export function reconcile(parentDom, oldVNode, newVNode, index = 0) {
  // ── Phase 4 新增：函数式组件处理 ──────────────────────────
  //
  // TODO: 在原有逻辑之前，增加函数组件的判断分支
  //
  // 核心思路：
  //   函数组件的 type 是一个函数（而非字符串），它不直接对应 DOM。
  //   需要"展开"（调用）它得到真正的 VNode 子树，再递归协调。
  //
  // 需要处理 3 种子情况：
  //
  // ── Case A: newVNode 是函数组件 ──
  //   判断条件：isComponent(newVNode) 为 true
  //
  //   步骤：
  //   1. 调用函数获取子 VNode 树：
  //      const childVNode = newVNode.type(newVNode.props)
  //
  //   2. 确定旧的子 VNode（用于 Diff）：
  //      - 如果 oldVNode 也是函数组件 → 用 oldVNode.__childVNode
  //      - 如果 oldVNode 是原生元素 → 直接用 oldVNode 本身
  //      - 如果 oldVNode 不存在 → null
  //      提示：可以这样写：
  //        const oldChildVNode = isComponent(oldVNode) ? oldVNode.__childVNode : oldVNode
  //
  //   3. 递归协调：
  //      reconcile(parentDom, oldChildVNode ?? null, childVNode)
  //
  //   4. 保存渲染结果（供下次 Diff 使用）：
  //      newVNode.__childVNode = childVNode
  //
  //   5. 传递 DOM 引用（函数组件的 "DOM" 就是子 VNode 的 DOM）：
  //      newVNode.__dom = getComponentDom(childVNode)
  //
  //   然后 return（不再走后面的原生元素逻辑）
  //
  // ── Case B: oldVNode 是函数组件，newVNode 不是 ──
  //   判断条件：isComponent(oldVNode) && !isComponent(newVNode)
  //
  //   这意味着组件被替换为原生元素（或被删除）。
  //   需要把 oldVNode "解包" 为它的 __childVNode，
  //   然后交给后面的原生元素逻辑处理：
  //     oldVNode = oldVNode.__childVNode
  //
  //   注意：这不是 return，而是修改 oldVNode 后继续往下走
  //
  if (isComponent(newVNode)) {
    // TODO (Phase 5): 设置 Hook 上下文
    //
    // 在调用组件函数之前，需要设置 Hook 上下文：
    //   setCurrentComponent(newVNode)
    //
    // 这样组件函数内部的 useState 调用才能知道
    // 状态应该存储在哪个组件的 __hooks 数组中。
    //
    // 同时保存 __parentDom，供 setState 触发重渲染时定位父 DOM：
    //   newVNode.__parentDom = parentDom
    if(isComponent(oldVNode) && oldVNode.type === newVNode.type){
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
    // TODO (Phase 5): 清除 Hook 上下文
    //
    // 组件函数执行完毕后，清除上下文：
    //   clearCurrentComponent()
    //
    // 这也会进行 Hook 数量校验（在 clearCurrentComponent 中实现）

    const oldChildVNode = isComponent(oldVNode) ? oldVNode.__childVNode : oldVNode
    reconcile(parentDom, oldChildVNode ?? null, childVNode)
    newVNode.__childVNode = childVNode
    newVNode.__dom = getComponentDom(childVNode)
    return
  }

  if (isComponent(oldVNode)) {
    // TODO (Phase 6): 组件被替换为非组件时，清理 effects
    //
    // 当一个函数组件被替换为原生元素时，需要先执行组件的清理：
    unmountComponent(oldVNode)
    //
    // 然后再解包：
    oldVNode = oldVNode.__childVNode
  }

  // ── 以下是 Phase 3 已实现的原生元素协调逻辑 ──────────────

  if(oldVNode == null){
    if(newVNode == null) return
    const dom = mountVNode(newVNode)
    parentDom.appendChild(dom)
  }else
  if(newVNode == null){
    // Phase 6: 节点被删除时，递归清理整棵旧子树中的 effects
    cleanupEffects(oldVNode)
    const dom = oldVNode.__dom
    parentDom.removeChild(dom)
  }else
  if(oldVNode.type !== newVNode.type){
    // Phase 6: 类型变化时，清理旧子树的 effects
    cleanupEffects(oldVNode)
    const dom = mountVNode(newVNode)
    parentDom.replaceChild(dom, oldVNode.__dom)
  }else
  if(oldVNode.type === newVNode.type){
    if(oldVNode.type === TEXT_ELEMENT){
      newVNode.__dom = oldVNode.__dom
      if(oldVNode.props.nodeValue !== newVNode.props.nodeValue){
        oldVNode.__dom.nodeValue = newVNode.props.nodeValue
      }
    }else{
      newVNode.__dom = oldVNode.__dom
      updateProps(newVNode.__dom, oldVNode.props, newVNode.props)
      reconcileChildren(newVNode.__dom, oldVNode.props.children, newVNode.props.children)
    }
  }
}

// ─── 递归清理 Effects ─────────────────────────────────────────

/**
 * 递归清理 VNode 树中所有组件的 useEffect cleanup
 *
 * ⚠️ 只负责清理副作用，不删除 DOM（DOM 删除由 reconcile 负责）
 *
 * 为什么需要递归？
 * 因为被删除的节点可能包含嵌套的组件，每个都可能有 useEffect。
 *
 * @param {Object} vnode - 要清理的 VNode
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

// ─── 挂载（递归创建 DOM） ─────────────────────────────────────

/**
 * 递归挂载 VNode 树，返回根 DOM 节点
 * 同时在每个 VNode 上记录 __dom 引用
 *
 * @param {Object} vnode
 * @returns {HTMLElement|Text}
 */
function mountVNode(vnode) {
  // TODO (Phase 4): 增加函数组件的挂载处理
  //
  // 在现有逻辑之前，增加函数组件判断：
  //
  // 如果 isComponent(vnode)：
  //   1. 调用函数获取子 VNode 树：
  //      const childVNode = vnode.type(vnode.props)
  //
  //   2. 递归挂载子 VNode 树：
  //      const dom = mountVNode(childVNode)
  //
  //   3. 保存渲染结果：
  //      vnode.__childVNode = childVNode
  //
  //   4. 传递 DOM 引用：
  //      vnode.__dom = dom
  //
  //   5. return dom
  //
  // 否则走原有的原生元素挂载逻辑（下面已实现的代码）
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
      dom.appendChild(childDom)
    })
  }
  return dom
}

// ─── 子节点协调 ─────────────────────────────────────────────

/**
 * 子节点协调入口
 * 自动判断是否存在 key，选择对应策略
 *
 * @param {HTMLElement} parentDom
 * @param {Array} oldChildren
 * @param {Array} newChildren
 */
function reconcileChildren(parentDom, oldChildren = [], newChildren = []) {
  const hasKey = newChildren.some(child => child.props?.key != null) || oldChildren.some(child => child.props?.key != null)
  if(hasKey){
    reconcileKeyedChildren(parentDom, oldChildren, newChildren)
  }else{
    reconcileUnkeyedChildren(parentDom, oldChildren, newChildren)
  }
}

// ─── 无 key 的位置对齐 Diff ──────────────────────────────────

/**
 * 按位置逐一对比新旧子节点
 * 简单但有效 —— 适用于无 key 的静态列表
 *
 * @param {HTMLElement} parentDom
 * @param {Array} oldChildren
 * @param {Array} newChildren
 */
function reconcileUnkeyedChildren(parentDom, oldChildren, newChildren) {
  const maxLen = Math.max(oldChildren.length, newChildren.length)
  for (let i = 0; i < maxLen; i++) {
    reconcile(parentDom, oldChildren[i] ?? null, newChildren[i] ?? null, i)
  }
}

// ─── 有 key 的子节点 Diff ───────────────────────────────────

/**
 * 基于 key 的子节点对比
 * 能正确处理列表重排、插入、删除，避免状态错位
 *
 * @param {HTMLElement} parentDom
 * @param {Array} oldChildren
 * @param {Array} newChildren
 */
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
  // 记录期望的 DOM 顺序，用于正确插入
  let lastDom = null
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
    // 函数组件的 DOM 需要通过 getComponentDom 获取
    const dom = newChild.__dom || getComponentDom(newChild)
    if (dom) {
      // 将节点插入到正确位置：lastDom 的下一个兄弟节点之前
      const nextSibling = lastDom ? lastDom.nextSibling : parentDom.firstChild
      if (dom !== nextSibling) {
        parentDom.insertBefore(dom, nextSibling)
      }
      lastDom = dom
    }
  })
  oldKeyed.forEach(staleChild => {
    reconcile(parentDom, staleChild, null, 0)
  })
  for (let i = unkeyedIndex; i < oldUnkeyed.length; i++) {
    reconcile(parentDom, oldUnkeyed[i], null, 0)
  }
}

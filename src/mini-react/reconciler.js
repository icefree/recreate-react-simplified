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
 *     ├─ 新增节点 → createDom + mount
 *     ├─ 删除节点 → removeChild
 *     ├─ 类型变化 → replaceChild
 *     └─ 类型相同 → updateProps + reconcileChildren
 *
 * ============================================================
 */

import { TEXT_ELEMENT } from './createElement.js'
import { createDom, updateProps } from './render.js'

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
  // ── Case 1: 旧节点不存在 → 新增 ──
  if (oldVNode == null) {
    if (newVNode == null) return
    const dom = mountVNode(newVNode)
    parentDom.appendChild(dom)
    return
  }

  // ── Case 2: 新节点不存在 → 删除 ──
  if (newVNode == null) {
    const dom = oldVNode.__dom
    if (dom && dom.parentNode) {
      dom.parentNode.removeChild(dom)
    }
    return
  }

  // ── Case 3: 类型不同 → 替换 ──
  if (oldVNode.type !== newVNode.type) {
    const newDom = mountVNode(newVNode)
    const oldDom = oldVNode.__dom
    if (oldDom && oldDom.parentNode) {
      oldDom.parentNode.replaceChild(newDom, oldDom)
    } else {
      parentDom.appendChild(newDom)
    }
    return
  }

  // ── Case 4: 类型相同 → 原地更新 ──
  const dom = oldVNode.__dom
  newVNode.__dom = dom

  if (newVNode.type === TEXT_ELEMENT) {
    // 文本节点：直接比对 nodeValue
    if (oldVNode.props.nodeValue !== newVNode.props.nodeValue) {
      dom.nodeValue = newVNode.props.nodeValue
    }
  } else {
    // 元素节点：更新属性 + 递归协调子节点
    updateProps(dom, oldVNode.props, newVNode.props)
    reconcileChildren(dom, oldVNode.props.children, newVNode.props.children)
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
  const dom = createDom(vnode)
  vnode.__dom = dom

  if (vnode.type !== TEXT_ELEMENT && vnode.props.children) {
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
  const hasKeys = newChildren.some(c => c?.props?.key != null)
    || oldChildren.some(c => c?.props?.key != null)

  if (hasKeys) {
    reconcileKeyedChildren(parentDom, oldChildren, newChildren)
  } else {
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
    reconcile(
      parentDom,
      oldChildren[i] ?? null,
      newChildren[i] ?? null,
      i
    )
  }
}

// ─── 有 key 的子节点 Diff ───────────────────────────────────

/**
 * 基于 key 的子节点对比
 * 能正确处理列表重排、插入、删除，避免状态错位
 *
 * 策略：
 *   1. 把旧节点按 key 索引到 Map
 *   2. 遍历新节点，按 key 找匹配的旧节点进行 reconcile
 *   3. 匹配不到的旧节点全部删除
 *
 * @param {HTMLElement} parentDom
 * @param {Array} oldChildren
 * @param {Array} newChildren
 */
function reconcileKeyedChildren(parentDom, oldChildren, newChildren) {
  // 1. 索引旧节点
  const oldKeyed = new Map()
  const oldUnkeyed = []

  oldChildren.forEach(child => {
    if (child?.props?.key != null) {
      oldKeyed.set(child.props.key, child)
    } else {
      oldUnkeyed.push(child)
    }
  })

  // 2. 遍历新节点，尝试匹配
  let unkeyedIndex = 0
  newChildren.forEach(newChild => {
    let matchedOld = null

    if (newChild?.props?.key != null) {
      matchedOld = oldKeyed.get(newChild.props.key) ?? null
      if (matchedOld) oldKeyed.delete(newChild.props.key)
    } else {
      matchedOld = oldUnkeyed[unkeyedIndex++] ?? null
    }

    if (matchedOld) {
      // 匹配到旧节点 → 原地更新
      reconcile(parentDom, matchedOld, newChild)
      // 确保 DOM 顺序正确（可能因为 key 重排需要移动）
      const dom = newChild.__dom
      if (dom) {
        parentDom.appendChild(dom) // appendChild 会自动移动已存在的节点
      }
    } else {
      // 没有匹配 → 新增
      reconcile(parentDom, null, newChild)
    }
  })

  // 3. 清理旧节点中未被匹配的
  oldKeyed.forEach(staleChild => {
    reconcile(parentDom, staleChild, null)
  })
  for (let i = unkeyedIndex; i < oldUnkeyed.length; i++) {
    reconcile(parentDom, oldUnkeyed[i], null)
  }
}

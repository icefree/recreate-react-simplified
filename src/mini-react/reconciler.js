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
 * 💡 关键设计：
 *   每个 VNode 在挂载后会被标记 __dom 属性，指向对应的真实 DOM 节点。
 *   下次 reconcile 时，通过 oldVNode.__dom 找到需要更新/替换/删除的 DOM。
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
  // TODO: 实现协调逻辑
  //
  // 需要处理 4 种情况（按顺序判断）：
  //
  // ── Case 1: oldVNode 不存在 → 新增节点 ──
  // - 如果 newVNode 也不存在，直接 return
  // - 用 mountVNode(newVNode) 递归创建整棵 DOM 子树
  // - 用 parentDom.appendChild(dom) 挂载
  //
  // ── Case 2: newVNode 不存在 → 删除节点 ──
  // - 通过 oldVNode.__dom 拿到真实 DOM
  // - 用 parentNode.removeChild(dom) 移除
  //
  // ── Case 3: oldVNode.type !== newVNode.type → 替换节点 ──
  // - 用 mountVNode(newVNode) 创建新 DOM
  // - 通过 oldVNode.__dom 拿到旧 DOM
  // - 用 parentNode.replaceChild(newDom, oldDom) 替换
  // - 如果旧 DOM 不存在（边界情况），降级为 appendChild
  //
  // ── Case 4: 类型相同 → 原地更新 ──
  // - 复用旧 DOM：newVNode.__dom = oldVNode.__dom
  // - 如果是 TEXT_ELEMENT：比对 nodeValue，不同则更新
  // - 如果是普通元素：
  //   - 调用 updateProps(dom, oldProps, newProps) 更新属性
  //   - 调用 reconcileChildren(dom, oldChildren, newChildren) 递归协调子节点
  if(oldVNode == null){
    if(newVNode == null) return
    const dom = mountVNode(newVNode)
    parentDom.appendChild(dom)
  }else 
  if(newVNode == null){
    const dom = oldVNode.__dom
    parentDom.removeChild(dom)
  }else
  if(oldVNode.type !== newVNode.type){
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

// ─── 挂载（递归创建 DOM） ─────────────────────────────────────

/**
 * 递归挂载 VNode 树，返回根 DOM 节点
 * 同时在每个 VNode 上记录 __dom 引用
 *
 * @param {Object} vnode
 * @returns {HTMLElement|Text}
 */
function mountVNode(vnode) {
  // TODO: 实现挂载逻辑
  //
  // 步骤：
  // 1. 调用 createDom(vnode) 创建 DOM 节点
  // 2. 将 DOM 节点记录到 vnode.__dom = dom
  // 3. 如果不是文本节点（TEXT_ELEMENT），递归挂载所有 children
  //    - 对每个 child 调用 mountVNode(child)
  //    - 将返回的 childDom 用 dom.appendChild(childDom) 挂上去
  // 4. 返回 dom
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
  // TODO: 实现子节点协调分发
  //
  // 判断逻辑：
  // - 检查 newChildren 或 oldChildren 中是否有节点带 key（props.key != null）
  // - 如果有 key → 调用 reconcileKeyedChildren
  // - 如果没有 key → 调用 reconcileUnkeyedChildren
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
  // TODO: 实现无 key 的子节点协调
  //
  // 策略：按位置一一对应比较
  //
  // 步骤：
  // 1. 取 maxLen = Math.max(oldChildren.length, newChildren.length)
  // 2. 遍历 0..maxLen，对每个位置 i 递归调用：
  //    reconcile(parentDom, oldChildren[i] ?? null, newChildren[i] ?? null, i)
  //
  // 这意味着：
  // - 多出来的 newChildren → 被当作新增（oldChildren[i] 为 null）
  // - 多出来的 oldChildren → 被当作删除（newChildren[i] 为 null）
  // - 位置相同的节点 → 进入 reconcile 的类型比较逻辑
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
  // TODO: 实现 key 驱动的子节点协调
  //
  // 步骤：
  //
  // 1. 索引旧节点 — 分离有 key 和无 key 的
  //    - const oldKeyed = new Map()   // key → vnode
  //    - const oldUnkeyed = []         // 无 key 的节点数组
  //    - 遍历 oldChildren，按 child.props.key 是否存在分类
  //
  // 2. 遍历 newChildren，尝试匹配旧节点
  //    - let unkeyedIndex = 0
  //    - 对每个 newChild：
  //      - 如果有 key → 从 oldKeyed 中查找匹配，找到后从 Map 中删除
  //      - 如果没有 key → 从 oldUnkeyed 中按顺序取
  //      - 如果找到匹配 → reconcile(parentDom, matchedOld, newChild) 原地更新
  //        然后用 parentDom.appendChild(newChild.__dom) 保证 DOM 顺序
  //        （appendChild 对已存在的节点会自动移动位置）
  //      - 如果没有匹配 → reconcile(parentDom, null, newChild) 新增
  //
  // 3. 清理未被匹配的旧节点
  //    - oldKeyed 中剩余的 → 全部 reconcile(parentDom, staleChild, null) 删除
  //    - oldUnkeyed 中从 unkeyedIndex 开始的 → 全部删除
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
    parentDom.appendChild(newChild.__dom)
  })
  oldKeyed.forEach(staleChild => {
    reconcile(parentDom, staleChild, null, 0)
  })
  for (let i = unkeyedIndex; i < oldUnkeyed.length; i++) {
    reconcile(parentDom, oldUnkeyed[i], null, 0)
  }
}

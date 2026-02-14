/**
 * ============================================================
 * Mini-React: component — 函数式组件辅助工具
 * ============================================================
 *
 * 🎯 职责：
 *   提供组件相关的判断与工具函数。
 *
 * 核心概念：
 *   函数式组件就是一个 type 为函数的 VNode。
 *   当 reconciler 遇到 typeof vnode.type === 'function' 时，
 *   它不会直接创建 DOM，而是：
 *     1. 调用该函数，得到返回的子 VNode 树
 *     2. 将子 VNode 树存储在 vnode.__childVNode 上
 *     3. 递归协调子 VNode 树
 *
 * 数据流示意：
 *
 *   <App />
 *     → createElement(App, {})
 *     → { type: App, props: { children: [] } }
 *     → reconcile 发现 type 是函数
 *       → childVNode = App(props)        // 调用函数
 *       → reconcile(parentDom, old?.__childVNode, childVNode)
 *       → newVNode.__childVNode = childVNode
 *
 *   函数组件不创建自己的 DOM 节点，
 *   它的 __dom 指向子 VNode 树的根 DOM。
 *
 * ============================================================
 */

/**
 * 判断一个 VNode 的类型是否为函数式组件
 *
 * @param {Object} vnode - 虚拟 DOM 节点
 * @returns {boolean}
 *
 * 示例：
 *   isComponent({ type: 'div', props: {} })       → false
 *   isComponent({ type: App, props: {} })          → true
 *   isComponent({ type: 'TEXT_ELEMENT', props: {} }) → false
 */
export function isComponent(vnode) {
  return vnode != null && typeof vnode.type === 'function'
}

/**
 * 获取函数组件 VNode 对应的真实 DOM
 *
 * 函数组件本身不产生 DOM 节点，需要沿着 __childVNode 链
 * 向下找到第一个非组件 VNode 的 __dom。
 *
 * @param {Object} vnode - 函数组件 VNode
 * @returns {HTMLElement|Text|null}
 */
export function getComponentDom(vnode) {
  if (!vnode) return null
  // 如果当前 VNode 有 __dom，说明它是原生元素，直接返回
  if (vnode.__dom) return vnode.__dom
  // 如果是组件，沿着 __childVNode 继续找
  if (vnode.__childVNode) return getComponentDom(vnode.__childVNode)
  return null
}

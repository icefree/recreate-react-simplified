/**
 * ============================================================
 * Mini-React: Root API — createRoot / render / unmount
 * ============================================================
 *
 * 🎯 职责：
 *   提供类似 React 18 的 Root 生命周期管理。
 *   每个 root 独立维护自己的 currentVNode，支持：
 *   - 同页面多容器并行渲染
 *   - 增量更新（通过 reconciler）
 *   - 完整卸载
 *
 * 使用方式：
 *   const root = createRoot(document.getElementById('root'))
 *   root.render(<App />)       // 首次渲染
 *   root.render(<App v2 />)    // 增量更新
 *   root.unmount()             // 卸载并清理
 *
 * ============================================================
 */

import { reconcile } from './reconciler.js'

// 每个容器最多对应一个 root，WeakMap 避免内存泄漏
const roots = new WeakMap()

/**
 * 为指定 DOM 容器创建一个 root
 *
 * - 若容器已有 root，直接返回已有的（幂等）
 * - root 持有 currentVNode，reconciler 据此做 Diff
 *
 * @param {HTMLElement} container - 挂载目标容器
 * @returns {{ render: Function, unmount: Function }}
 */
export function createRoot(container) {
  // TODO: 实现 createRoot
  //
  // 步骤：
  //
  // 1. 幂等检查：如果 roots.has(container)，直接返回已有 root
  //
  // 2. 创建 root 对象，包含以下属性和方法：
  //    - container: 挂载目标
  //    - currentVNode: null（保存当前渲染的 VNode 树）
  //
  //    - render(nextVNode):
  //      调用 reconcile(container, root.currentVNode, nextVNode)
  //      然后更新 root.currentVNode = nextVNode
  //      首次调用时 currentVNode 为 null → 触发全量挂载
  //      后续调用时 → 触发增量更新（Diff）
  //
  //    - unmount():
  //      调用 reconcile(container, root.currentVNode, null)
  //      清空 root.currentVNode = null
  //      从 roots 中删除自身：roots.delete(container)
  //
  // 3. 注册到 roots: roots.set(container, root)
  //
  // 4. 返回 root
}

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
  if (roots.has(container)) {
    return roots.get(container)
  }

  const root = {
    container,
    currentVNode: null,

    /**
     * 渲染 / 更新
     * 首次调用时 currentVNode 为 null → 全量挂载
     * 后续调用时与 currentVNode 做 Diff → 增量更新
     */
    render(nextVNode) {
      reconcile(container, root.currentVNode, nextVNode)
      root.currentVNode = nextVNode
    },

    /**
     * 卸载并清理
     * 触发 reconcile(container, currentVNode, null) → 删除所有 DOM
     * 然后从 roots 中移除自身
     */
    unmount() {
      reconcile(container, root.currentVNode, null)
      root.currentVNode = null
      roots.delete(container)
    },
  }

  roots.set(container, root)
  return root
}

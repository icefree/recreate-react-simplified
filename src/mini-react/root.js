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
 * 🏗️ 两阶段流程（root.render 内部）：
 *
 *   root.render(nextVNode)
 *     │
 *     ├─ Phase 1: Render Phase
 *     │    reconcile(container, currentVNode, nextVNode)
 *     │    → 计算 diff，收集 pendingMutations
 *     │
 *     ├─ Phase 2: Commit Phase
 *     │    commitRoot()
 *     │    → 批量应用所有 DOM 变更
 *     │
 *     └─ 更新 currentVNode = nextVNode
 *
 * ============================================================
 */

import { reconcile, commitRoot } from './reconciler.js'
import { setupEventDelegation } from './events.js'

// 每个容器最多对应一个 root，WeakMap 避免内存泄漏
const roots = new WeakMap()

/**
 * 为指定 DOM 容器创建一个 root
 *
 * @param {HTMLElement} container - 挂载目标容器
 * @returns {{ render: Function, unmount: Function }}
 */
export function createRoot(container) {
  if (roots.has(container)) {
    return roots.get(container)
  }

  // TODO (Phase 7): 初始化事件委托系统
  //
  // 在 root 创建时调用 setupEventDelegation(container)，
  // 让 container 成为所有事件的委托目标。
  //
  // 只需一行代码：
  //   setupEventDelegation(container)
  //
  // 💡 这一步确保了：
  //    - 所有 on* 事件处理器不再直接绑定到各个元素
  //    - 而是在 root 容器上统一监听，通过冒泡找到目标

  // TODO: 取消下面这行的注释
  setupEventDelegation(container)

  const root = {
    container,
    currentVNode: null,
    render(nextVNode) {
      // ── Phase 1: Render Phase ──
      // reconcile 遍历 VNode 树，收集 effects（不操作 DOM）
      reconcile(this.container, this.currentVNode, nextVNode)

      // ── Phase 2: Commit Phase ──
      // commitRoot 批量执行所有 DOM 操作
      commitRoot()

      this.currentVNode = nextVNode
    },
    unmount() {
      // ── Phase 1: Render Phase ──
      reconcile(this.container, this.currentVNode, null)

      // ── Phase 2: Commit Phase ──
      commitRoot()

      this.currentVNode = null
      roots.delete(this.container)
    }
  }
  roots.set(container, root)
  return root
}

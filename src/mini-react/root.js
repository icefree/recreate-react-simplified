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
 *     │    → 计算 diff，收集 pendingEffects
 *     │
 *     ├─ Phase 2: Commit Phase
 *     │    commitRoot()
 *     │    → 批量应用所有 DOM 变更
 *     │
 *     └─ 更新 currentVNode = nextVNode
 *
 * ============================================================
 */

import { reconcile, commitRoot, logRenderPhaseStart, logRenderPhaseEnd } from './reconciler.js'

// 每个容器最多对应一个 root，WeakMap 避免内存泄漏
const roots = new WeakMap()

/**
 * 为指定 DOM 容器创建一个 root
 *
 * @param {HTMLElement} container - 挂载目标容器
 * @returns {{ render: Function, unmount: Function }}
 */
export function createRoot(container) {
  if(roots.has(container)){
    return roots.get(container)
  }
  const root = {
    container,
    currentVNode: null,
    render(nextVNode){
      // ── Phase 1: Render Phase ──
      logRenderPhaseStart('root.render')
      reconcile(this.container, this.currentVNode, nextVNode)
      logRenderPhaseEnd()

      // ── Phase 2: Commit Phase ──
      commitRoot()

      this.currentVNode = nextVNode
    },
    unmount(){
      // ── Phase 1: Render Phase ──
      logRenderPhaseStart('root.unmount')
      reconcile(this.container, this.currentVNode, null)
      logRenderPhaseEnd()

      // ── Phase 2: Commit Phase ──
      commitRoot()

      this.currentVNode = null
      roots.delete(this.container)
    }
  }
  roots.set(container, root)
  return root
}

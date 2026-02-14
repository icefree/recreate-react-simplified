/**
 * ============================================================
 * Mini-React: hooks — useState & 重新渲染调度
 * ============================================================
 *
 * 🎯 核心职责：
 *   实现 React Hooks 的运行时机制。
 *
 * 📚 核心概念（必须理解）：
 *
 *   Hook 状态存储在哪里？
 *   ─────────────────────
 *   不在组件函数内部！而在框架维护的"组件实例"对象上。
 *
 *   每个函数组件 VNode 在首次渲染时会被绑定一个 __hooks 数组。
 *   每调用一次 useState，就在数组中占一个位置（slot）。
 *   这就是为什么 Hook 的调用顺序必须一致 —— **顺序就是 ID**。
 *
 *   渲染流程：
 *   ──────────
 *   1. reconciler 调用组件函数前：
 *      - 设置 currentComponent = 当前组件的 VNode
 *      - 重置 hookIndex = 0
 *
 *   2. 组件函数执行时：
 *      - 每调用 useState(initialValue)
 *        → 从 currentComponent.__hooks[hookIndex] 读取已有状态
 *        → 或初始化新状态
 *        → hookIndex++
 *
 *   3. 组件函数执行完毕：
 *      - 检查 hookIndex 是否与上次一致（防止条件调用 Hook）
 *      - 清空 currentComponent = null
 *
 *   setState 触发重渲染：
 *   ────────────────────
 *   setState(newValue)
 *     → 将更新推入 hook.queue
 *     → scheduleRerender(component)
 *       → 标记 component 为 dirty
 *       → 用 queueMicrotask 批量 flush
 *     → flushUpdates()
 *       → 对每个 dirty 的组件调用 renderComponent()
 *         → 设置上下文 → 调用组件函数 → 消费 queue → reconcile
 *
 * ============================================================
 */

import { reconcile } from './reconciler.js'
import { getComponentDom } from './component.js'

// ─── 全局 Hook 上下文 ──────────────────────────────────────────

/**
 * 当前正在渲染的组件 VNode
 * reconciler 在调用组件函数前设置，函数执行完后清空
 */
let currentComponent = null

/**
 * 当前 Hook 调用索引
 * 每调用一次 Hook（如 useState），索引递增
 */
let hookIndex = 0

// ─── Hook 上下文管理（供 reconciler 调用） ────────────────────

/**
 * 设置当前 Hook 上下文
 * reconciler 在调用组件函数前调用此方法
 *
 * @param {Object} component - 组件 VNode
 */
export function setCurrentComponent(component) {
  currentComponent = component
  hookIndex = 0
  // 确保组件实例有 hooks 数组
  if (!component.__hooks) {
    component.__hooks = []
  }
}

/**
 * 清除当前 Hook 上下文
 * reconciler 在组件函数执行完毕后调用
 *
 * 同时进行 Hook 数量检查（防止条件调用 Hook）
 */
export function clearCurrentComponent() {
  // TODO: 实现 Hook 数量校验
  //
  // 在清除上下文前，检查 Hook 调用数量是否一致：
  //
  // 1. 如果 currentComponent.__expectedHookCount 尚未设置（首次渲染）：
  //    - 记录当前 hookIndex 为期望值：
  //      currentComponent.__expectedHookCount = hookIndex
  //
  // 2. 如果已有期望值，但与当前 hookIndex 不一致：
  //    - 抛出错误：
  //      throw new Error(
  //        'Hook call order changed between renders. ' +
  //        `Expected ${currentComponent.__expectedHookCount} hooks but got ${hookIndex}. ` +
  //        'Hooks must not be called conditionally.'
  //      )
  //
  // 3. 清空上下文：
  //    currentComponent = null

  currentComponent = null
}

// ─── useState ─────────────────────────────────────────────────

/**
 * useState Hook — 为函数组件提供状态管理
 *
 * @param {*} initialValue - 初始值，也可以是一个返回初始值的函数（惰性初始化）
 * @returns {[any, Function]} [state, setState]
 *
 * 示例：
 *   const [count, setCount] = useState(0)
 *   setCount(1)            // 直接赋值
 *   setCount(prev => prev + 1)  // 函数式更新
 */
export function useState(initialValue) {
  // TODO: 实现 useState
  //
  // 步骤：
  //
  // 1. 校验调用上下文：
  //    if (!currentComponent) {
  //      throw new Error('useState must be called inside a function component')
  //    }
  //
  // 2. 捕获当前组件引用和 Hook 索引（闭包捕获，setState 需要用）：
  //    const component = currentComponent
  //    const idx = hookIndex++
  //
  // 3. 读取旧 Hook（如果是重新渲染，旧 Hook 已存在）：
  //    const oldHook = component.__hooks[idx]
  //
  // 4. 创建或复用 Hook 对象：
  //    const hook = oldHook ?? {
  //      state: typeof initialValue === 'function' ? initialValue() : initialValue,
  //      queue: [],
  //    }
  //
  //    💡 要点：
  //    - initialValue 如果是函数，调用它获取初始值（惰性初始化）
  //    - queue 是一个数组，存放待处理的 setState 动作
  //    - 只有首次渲染时才用 initialValue，之后复用旧 Hook
  //
  // 5. 消费更新队列（flush queue）：
  //    hook.queue.forEach(action => {
  //      hook.state = typeof action === 'function' ? action(hook.state) : action
  //    })
  //    hook.queue = []
  //
  //    💡 要点：
  //    - 队列中的 action 可以是直接值或函数
  //    - 函数式更新接收前一个状态作为参数
  //    - 必须按入队顺序执行，保证语义一致性
  //
  // 6. 保存 Hook 到组件实例：
  //    component.__hooks[idx] = hook
  //
  // 7. 创建 setState 函数：
  //    const setState = (action) => {
  //      hook.queue.push(action)
  //      scheduleRerender(component)
  //    }
  //
  //    💡 setState 不会立即更新状态！
  //    它只是把更新动作推入队列，然后调度一次重渲染。
  //    在下次 flush 时，步骤 5 会消费队列中的所有更新。
  //
  // 8. 返回 [state, setState]：
  //    return [hook.state, setState]

  throw new Error('useState is not implemented yet — this is your TODO!')
}

// ─── 重新渲染调度 ─────────────────────────────────────────────

/**
 * 脏组件集合 — 等待重渲染的组件
 */
const dirtyComponents = new Set()

/**
 * 是否已调度 flush
 * 防止同一个 microtask 内重复调度
 */
let flushScheduled = false

/**
 * 标记组件需要重渲染，并调度批量 flush
 *
 * 同一 microtask 内多次 setState 只会触发一次 flush，
 * 这就是 React 的"批处理"（batching）机制。
 *
 * @param {Object} component - 需要重渲染的组件 VNode
 */
export function scheduleRerender(component) {
  // TODO: 实现重渲染调度
  //
  // 步骤：
  //
  // 1. 将组件加入脏集合：
  //    dirtyComponents.add(component)
  //
  // 2. 如果已经调度过 flush，就不重复调度：
  //    if (flushScheduled) return
  //
  // 3. 标记已调度，并用 queueMicrotask 异步 flush：
  //    flushScheduled = true
  //    queueMicrotask(flushUpdates)
  //
  //    💡 为什么用 queueMicrotask？
  //    因为我们希望在当前同步代码全部执行完后、
  //    浏览器下一次渲染前，统一处理所有状态更新。
  //    这样同一个事件处理器中多次 setState 只触发一次渲染。

  throw new Error('scheduleRerender is not implemented yet — this is your TODO!')
}

/**
 * 批量执行所有脏组件的重渲染
 */
function flushUpdates() {
  // TODO: 实现批量 flush
  //
  // 步骤：
  //
  // 1. 重置调度标志：
  //    flushScheduled = false
  //
  // 2. 取出所有脏组件（snapshot），然后清空集合：
  //    const pending = Array.from(dirtyComponents)
  //    dirtyComponents.clear()
  //
  // 3. 对每个脏组件调用 renderComponent：
  //    pending.forEach(renderComponent)

  throw new Error('flushUpdates is not implemented yet — this is your TODO!')
}

// ─── 组件重渲染 ──────────────────────────────────────────────

/**
 * 重新渲染单个组件
 *
 * 这是 setState 触发更新的最终落脚点。
 * 设置 Hook 上下文 → 调用组件函数 → reconcile → 清理上下文
 *
 * @param {Object} component - 组件 VNode
 */
function renderComponent(component) {
  // TODO: 实现组件重渲染
  //
  // 步骤：
  //
  // 1. 设置 Hook 上下文（让 useState 知道当前组件是谁）：
  //    setCurrentComponent(component)
  //
  // 2. 调用组件函数，获取新的 VNode 树：
  //    const newChildVNode = component.type(component.props)
  //
  //    💡 component.type 就是组件函数
  //    💡 component.props 是组件的当前 props
  //
  // 3. 找到父 DOM 节点（组件需要知道自己挂载在哪里）：
  //    const parentDom = component.__parentDom
  //
  //    💡 __parentDom 需要在 reconcile 中首次渲染组件时保存
  //    详见 reconciler.js 中的 TODO
  //
  // 4. 协调更新（用旧的子 VNode 和新的子 VNode 做 Diff）：
  //    reconcile(parentDom, component.__childVNode, newChildVNode)
  //
  // 5. 更新组件上缓存的子 VNode 和 DOM 引用：
  //    component.__childVNode = newChildVNode
  //    component.__dom = getComponentDom(newChildVNode)
  //
  // 6. 清理 Hook 上下文：
  //    clearCurrentComponent()

  throw new Error('renderComponent is not implemented yet — this is your TODO!')
}

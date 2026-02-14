/**
 * ============================================================
 * Mini-React: hooks — useState / useEffect / useRef / useReducer
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
 *   每调用一次 Hook（如 useState / useEffect），就在数组中占一个位置（slot）。
 *   这就是为什么 Hook 的调用顺序必须一致 —— **顺序就是 ID**。
 *
 *   渲染流程（三阶段模型）：
 *   ──────────────────────
 *   React 的更新分为三个阶段，每个 Hook 在不同阶段执行：
 *
 *   ┌─────────────────────────────────────────────────────────┐
 *   │ Phase 1: Render Phase（渲染阶段 — 同步）                │
 *   │                                                         │
 *   │  reconciler 调用组件函数：                                │
 *   │  1. setCurrentComponent(vnode), hookIndex = 0           │
 *   │  2. 组件函数执行：                                       │
 *   │     - useState:  同步消费 queue → 返回最新 state          │
 *   │     - useReducer: 同步消费 queue → reducer(state, action) │
 *   │     - useRef:    返回持久化引用（不触发渲染）              │
 *   │     - useEffect: 检查 deps，若变化则排队 effect           │
 *   │  3. clearCurrentComponent()                              │
 *   ├─────────────────────────────────────────────────────────┤
 *   │ Phase 2: Commit Phase（提交阶段 — 同步）                │
 *   │                                                         │
 *   │  reconcile(oldVNode, newVNode) → DOM 增/删/改            │
 *   ├─────────────────────────────────────────────────────────┤
 *   │ Phase 3: Passive Effects Phase（副作用阶段 — 异步）      │
 *   │                                                         │
 *   │  useEffect 的回调通过 queueMicrotask 延迟到这里执行       │
 *   │  先 cleanup 旧 effect → 再执行新 effect                  │
 *   └─────────────────────────────────────────────────────────┘
 *
 *   ⚡ 时序保证：
 *   ───────────
 *   setState → scheduleRerender → queueMicrotask(flushUpdates)
 *                                          │
 *   flushUpdates 执行时（Microtask #1）：    │
 *     ├─ 调用组件函数（Phase 1 + 2 同步完成）│
 *     │   └─ useEffect 内部 queueMicrotask(effectFn)  ← 排入队列
 *     └─ DOM 已更新 ✅                       │
 *                                          │
 *   effectFn 执行时（Microtask #2）：        ▼
 *     └─ DOM 已就绪，可以安全访问 ✅
 *
 *   microtask 的 FIFO 特性保证了：
 *   effect 一定在 render + commit 完成之后才执行。
 *
 *   useRef vs useState 的区别：
 *   ──────────────────────────
 *   - useState：修改 → 触发重渲染 → UI 更新
 *   - useRef：修改 .current → 不触发渲染 → 只是一个持久化的可变容器
 *
 *   useReducer 与 useState 的关系：
 *   ──────────────────────────────
 *   在真正的 React 源码中，useState 就是基于 useReducer 实现的。
 *   useState(init) 本质上是 useReducer(basicStateReducer, init)。
 *   其中 basicStateReducer(state, action) = typeof action === 'function'
 *     ? action(state) : action
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
 * 每调用一次 Hook，索引递增
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
  if (currentComponent.__expectedHookCount == null) {
    currentComponent.__expectedHookCount = hookIndex
  } else if (currentComponent.__expectedHookCount !== hookIndex) {
    throw new Error(
      'Hook call order changed between renders. ' +
      `Expected ${currentComponent.__expectedHookCount} hooks but got ${hookIndex}. ` +
      'Hooks must not be called conditionally.'
    )
  }

  currentComponent = null
}

// ─── Hook 上下文校验 ──────────────────────────────────────────

/**
 * 校验当前是否在组件渲染上下文中
 * 所有 Hook 都必须在函数组件顶层调用
 *
 * TODO (Phase 6): 实现 assertHookContext
 *
 * 步骤：
 *   检查 currentComponent 是否存在。
 *   如果不存在，说明 Hook 被在组件外部调用了，应抛出错误。
 *
 *   if (!currentComponent) {
 *     throw new Error(
 *       `${hookName} must be called inside a function component (at the top level)`
 *     )
 *   }
 *
 * 💡 这个辅助函数可以被所有 Hook 共享，避免重复写校验逻辑 (DRY)。
 *    在你实现了这个函数后，可以在 useState 中也调用它替换现有的 if 检查。
 *
 * @param {string} hookName - Hook 名称，用于错误提示
 */
function assertHookContext(hookName) {
  // TODO: 实现 — 检查 currentComponent 是否存在，不存在则抛错
  if (!currentComponent) {
    throw new Error(
      `${hookName} must be called inside a function component (at the top level)`
    )
  }
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
 *   setCount(1)                 // 直接赋值
 *   setCount(prev => prev + 1)  // 函数式更新
 */

function basicStateReducer(state, action) {
  return typeof action === 'function' ? action(state) : action
}

export function useState(initialValue) {
  assertHookContext('useState')

  const component = currentComponent
  const idx = hookIndex++
  const oldHook = component.__hooks[idx]

  const hook = oldHook ?? {
    state: typeof initialValue === 'function' ? initialValue() : initialValue,
    queue: [],
  }

  // 消费更新队列
  hook.queue.forEach(action => {
    hook.state = typeof action === 'function' ? action(hook.state) : action
  })
  hook.queue = []
  component.__hooks[idx] = hook

  const setState = (action) => {
    hook.queue.push(action)
    scheduleRerender(component)
  }

  return [hook.state, setState]
}

// ─── useReducer ───────────────────────────────────────────────

/**
 * useReducer Hook — useState 的泛化版本
 *
 * React 内部 useState 就是基于 useReducer 实现的。
 * useReducer 适合管理复杂状态逻辑（多个子值、依赖前一状态）。
 *
 * TODO (Phase 6): 实现 useReducer
 *
 * 与 useState 的对比：
 *   ┌───────────────────────────────────────────────────────────┐
 *   │  useState                    │  useReducer               │
 *   ├───────────────────────────────────────────────────────────┤
 *   │  setState(newValue)          │  dispatch(action)         │
 *   │  setState(prev => ...)       │  dispatch({ type: ... })  │
 *   │  state 直接替换              │  state = reducer(state, action) │
 *   │  简单状态                    │  复杂状态逻辑             │
 *   └───────────────────────────────────────────────────────────┘
 *
 * 步骤：
 *   1. 调用 assertHookContext('useReducer')（实现 assertHookContext 后）
 *
 *   2. 捕获上下文：
 *      const component = currentComponent
 *      const idx = hookIndex++
 *      const oldHook = component.__hooks[idx]
 *
 *   3. 初始化或复用 Hook：
 *      const hook = oldHook ?? {
 *        state: init ? init(initialArg) : initialArg,
 *        queue: [],
 *      }
 *
 *      💡 注意第三个参数 init：如果提供了，用 init(initialArg) 作为初始值。
 *         这是 React 的"惰性初始化"模式，可以延迟昂贵的初始化计算。
 *
 *   4. 消费更新队列（关键区别！用 reducer 而不是直接替换）：
 *      hook.queue.forEach(action => {
 *        hook.state = reducer(hook.state, action)
 *      })
 *      hook.queue = []
 *
 *      💡 对比 useState 的队列消费：
 *         useState: hook.state = typeof action === 'function' ? action(hook.state) : action
 *         useReducer: hook.state = reducer(hook.state, action)
 *         useState 本质上就是 useReducer + 内置 reducer！
 *
 *   5. 保存并返回：
 *      component.__hooks[idx] = hook
 *      const dispatch = (action) => {
 *        hook.queue.push(action)
 *        scheduleRerender(component)
 *      }
 *      return [hook.state, dispatch]
 *
 * 🏆 进阶挑战（可选）：
 *   实现完 useReducer 后，尝试用它来重构 useState：
 *
 *     function basicStateReducer(state, action) {
 *       return typeof action === 'function' ? action(state) : action
 *     }
 *
 *     export function useState(initialValue) {
 *       return useReducer(basicStateReducer, initialValue)
 *     }
 *
 *   这就是 React 源码中的真实做法！
 *
 * @param {Function} reducer  - (state, action) => newState
 * @param {*}        initialArg - 初始值（或传给 init 函数的参数）
 * @param {Function} [init]   - 可选的惰性初始化函数
 * @returns {[any, Function]} [state, dispatch]
 */
export function useReducer(reducer, initialArg, init) {
  // TODO: 实现 useReducer
  assertHookContext('useReducer')
  const component = currentComponent
  const idx = hookIndex++
  const oldHook = component.__hooks[idx]

  const hook = oldHook ?? {
    state: init ? init(initialArg) : initialArg,
    queue: [],
  }

  // 🔵 Render Phase: 同步消费更新队列，计算最新 state
  hook.queue.forEach(action => {
    hook.state = reducer(hook.state, action)
  })
  hook.queue = []
  
  component.__hooks[idx] = hook

  const dispatch = (action) => {
    hook.queue.push(action)
    scheduleRerender(component)
  }

  return [hook.state, dispatch]
}

// ─── useEffect ────────────────────────────────────────────────

/**
 * useEffect Hook — 副作用管理
 *
 * TODO (Phase 6): 实现 useEffect
 *
 * 这是 React 中最重要的 Hook 之一，用于在渲染完成后执行副作用。
 *
 * 📚 核心原理：
 *
 *   执行时机（与 useState 的根本区别）：
 *   ───────────────────────────────────
 *   - useState 的状态更新在渲染期间消费（同步）
 *   - useEffect 的回调在渲染完成后异步执行（DOM 已更新）
 *
 *   deps 依赖数组决定何时执行：
 *   ─────────────────────────
 *   - useEffect(fn)           → 每次渲染后都执行
 *   - useEffect(fn, [])       → 只在挂载时执行一次
 *   - useEffect(fn, [a, b])   → a 或 b 变化时执行
 *
 *   cleanup 清理函数：
 *   ─────────────────
 *   effect 回调可以返回一个函数，这个函数会在：
 *   1. 下次 effect 执行前被调用（清理上一次的副作用）
 *   2. 组件卸载时被调用（最终清理）
 *
 *   典型场景：clearInterval、removeEventListener、取消订阅
 *
 * 步骤：
 *   1. 调用 assertHookContext('useEffect')
 *
 *   2. 参数校验：
 *      - callback 必须是函数
 *      - deps 如果提供，必须是数组
 *
 *   3. 捕获上下文：
 *      const component = currentComponent
 *      const idx = hookIndex++
 *      const oldHook = component.__hooks[idx]
 *
 *   4. 判断依赖是否变化（hasChanged）：
 *      - 首次渲染（oldHook 不存在）→ true
 *      - deps 未提供（undefined）→ true（每次都执行）
 *      - deps 是空数组 []、且 oldHook.deps 也是 [] → false（不再执行）
 *      - deps 长度变化 → true
 *      - deps 中某项变化 → true（用 Object.is 比较）
 *
 *      💡 判断公式：
 *      const hasChanged = oldHook
 *        ? !deps || !oldHook.deps || deps.length !== oldHook.deps.length ||
 *          deps.some((dep, i) => !Object.is(dep, oldHook.deps[i]))
 *        : true
 *
 *   5. 如果依赖变化了：
 *      a. 保存新的 hook 对象（注意保留旧的 cleanup 引用）：
 *         component.__hooks[idx] = {
 *           tag: 'effect',
 *           deps,
 *           cleanup: oldHook?.cleanup,
 *         }
 *
 *      b. 用 queueMicrotask 异步执行 effect：
 *         const hookRef = component.__hooks[idx]
 *         queueMicrotask(() => {
 *           // 先执行上次的 cleanup
 *           if (hookRef.cleanup) { hookRef.cleanup() }
 *           // 执行 effect 并保存新的 cleanup
 *           const cleanup = callback()
 *           hookRef.cleanup = typeof cleanup === 'function' ? cleanup : undefined
 *         })
 *
 *         💡 为什么用 queueMicrotask？
 *         因为 effect 必须在 DOM 更新之后执行。
 *         queueMicrotask 在当前同步代码全部结束后、浏览器渲染前执行。
 *
 *         💡 为什么要拿 hookRef 的引用？
 *         因为闭包中需要读写同一个 hook 对象。
 *         hookRef 和 component.__hooks[idx] 是同一个引用。
 *
 *   6. 如果依赖没变：
 *      直接保留旧 hook：
 *      component.__hooks[idx] = oldHook
 *
 * @param {Function}  callback - effect 回调，可返回 cleanup 函数
 * @param {Array}     [deps]   - 依赖数组（undefined 表示每次都执行）
 */
export function useEffect(callback, deps) {
  assertHookContext('useEffect')
  if (typeof callback !== 'function') {
    throw new Error('callback must be a function')
  }
  if (deps && !Array.isArray(deps)) {
    throw new Error('deps must be an array')
  }
  const component = currentComponent
  const idx = hookIndex++
  const oldHook = component.__hooks[idx]

  const hasChanged = oldHook ? (
    !deps ||
    !oldHook.deps ||
    deps.length !== oldHook.deps.length ||
    deps.some((dep, i) => !Object.is(dep, oldHook.deps[i])) 
  ) : true
  
  if(hasChanged){
    component.__hooks[idx] = {
      tag: 'effect',
      deps,
      cleanup: oldHook?.cleanup,
    }
    const hookRef = component.__hooks[idx]
    // 🟢 Passive Effects Phase: 用 queueMicrotask 将 effect 推迟到 render + commit 完成之后
    //    此时 DOM 已更新，可以安全地进行副作用操作（如 DOM 测量、数据请求、订阅等）
    queueMicrotask(() => {
      if(hookRef.cleanup){
        hookRef.cleanup()
      }
      const cleanup = callback()
      hookRef.cleanup = typeof cleanup === 'function' ? cleanup : undefined
    })
  }
  
  if(!hasChanged){
    component.__hooks[idx] = oldHook
  }
}

// ─── useRef ───────────────────────────────────────────────────

/**
 * useRef Hook — 跨渲染持久化的可变容器
 *
 * TODO (Phase 6): 实现 useRef
 *
 * 📚 核心原理：
 *
 *   useRef 是最简单的 Hook —— 它只是一个跨渲染保持引用不变的对象。
 *   返回 { current: initialValue }，且每次渲染都返回同一个对象。
 *
 *   与 useState 的根本区别：
 *   ─────────────────────
 *   - useState：修改 → 触发重渲染（通过 scheduleRerender）
 *   - useRef：修改 .current → 什么都不会发生，不触发渲染
 *
 *   这就是为什么 useRef 适合存储"不需要驱动 UI 更新"的值，比如：
 *   - 定时器 ID
 *   - DOM 节点引用
 *   - 前一次渲染的值
 *
 * 步骤：
 *   1. 调用 assertHookContext('useRef')
 *
 *   2. 捕获上下文：
 *      const component = currentComponent
 *      const idx = hookIndex++
 *      const oldHook = component.__hooks[idx]
 *
 *   3. 首次渲染时创建 ref 对象：
 *      if (!oldHook) {
 *        component.__hooks[idx] = { tag: 'ref', current: initialValue }
 *      }
 *
 *      💡 注意：只有首次有值！后续渲染不重新创建，直接返回旧的。
 *         这就保证了 ref 在整个生命周期中是同一个对象引用。
 *
 *   4. 返回 ref 对象：
 *      return component.__hooks[idx]
 *
 *   就这么简单！整个实现大约 10 行代码。
 *   它之所以"跨渲染保持引用"，是因为存在 __hooks 数组上，每次渲染复用。
 *
 * @param {*} initialValue - 初始值
 * @returns {{ current: * }}
 */
export function useRef(initialValue) {
  assertHookContext('useRef')

  const component = currentComponent
  const idx = hookIndex++
  const oldHook = component.__hooks[idx]

  if (!oldHook) {
    component.__hooks[idx] = { tag: 'ref', current: initialValue }
  }

  return component.__hooks[idx]
}

// ─── 组件卸载清理 ──────────────────────────────────────────────

/**
 * 卸载组件时执行所有 effect 的 cleanup
 *
 * TODO (Phase 6): 实现 unmountComponent
 *
 * 当 reconciler 发现组件被移除时调用此函数，
 * 确保所有 useEffect 的清理函数都被正确执行。
 *
 * 如果不做这一步，useEffect 中的 setInterval、addEventListener 等
 * 副作用将会泄漏（never cleaned up），造成内存泄漏和幽灵行为。
 *
 * 步骤：
 *   1. 检查组件是否有 __hooks：
 *      if (!component?.__hooks) return
 *
 *   2. 遍历所有 hook，执行 cleanup：
 *      component.__hooks.forEach(hook => {
 *        if (hook?.cleanup && typeof hook.cleanup === 'function') {
 *          hook.cleanup()
 *        }
 *      })
 *
 *   💡 只有 useEffect 的 hook 才有 cleanup 属性，
 *      useState / useRef 的 hook 没有，forEach 时会自动跳过。
 *
 * @param {Object} component - 组件 VNode
 */
export function unmountComponent(component) {
  // TODO: 实现组件卸载时的 cleanup

  // 暂时为空函数，避免 reconciler 调用时报错
  if(!component?.__hooks) return

  component.__hooks.forEach(hook => {
    if (hook?.cleanup && typeof hook.cleanup === 'function') {
      hook.cleanup()
    }
  })
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
 * ⚡ 时序关键点：
 * queueMicrotask(flushUpdates) 将 render + commit 作为一个 microtask 执行。
 * 在 flushUpdates 过程中，useEffect 会排入新的 microtask，
 * 由于 microtask 的 FIFO 特性，effect 一定在 render + commit 之后执行。
 *
 * @param {Object} component - 需要重渲染的组件 VNode
 */
export function scheduleRerender(component) {
  dirtyComponents.add(component)
  if (flushScheduled) return
  flushScheduled = true
  // 调度 Render + Commit Phase（Microtask #1）
  queueMicrotask(flushUpdates)
}

/**
 * 批量执行所有脏组件的重渲染
 *
 * 此函数运行时完成 Phase 1（Render）和 Phase 2（Commit）。
 * 过程中 useEffect 会通过 queueMicrotask 将 effect 排入队列，
 * 这些 effect 将在本函数返回后作为后续 microtask 执行（Phase 3）。
 */
function flushUpdates() {
  flushScheduled = false
  const pending = Array.from(dirtyComponents)
  dirtyComponents.clear()
  // Phase 1 + 2: 同步执行 render → reconcile → DOM 更新
  // （此过程中 useEffect 的 callback 被排入 microtask 队列）
  pending.forEach(renderComponent)
  // ← 函数返回后，microtask 队列中的 effect 才会执行（Phase 3）
}

// ─── 组件重渲染 ──────────────────────────────────────────────

/**
 * 重新渲染单个组件
 *
 * 这是 setState 触发更新的最终落脚点。
 * 一次调用完成 Phase 1（Render）和 Phase 2（Commit）：
 *
 *   Phase 1: setCurrentComponent → 组件函数执行
 *            （useState 同步消费 queue，useEffect 排队 effect）
 *   Phase 2: reconcile → DOM 更新
 *
 * @param {Object} component - 组件 VNode
 */
function renderComponent(component) {
  setCurrentComponent(component)
  let newChildVNode
  try {
    newChildVNode = component.type(component.props)
  } finally {
    clearCurrentComponent()
  }
  const parentDom = component.__parentDom
  reconcile(parentDom, component.__childVNode, newChildVNode)
  component.__childVNode = newChildVNode
  component.__dom = getComponentDom(newChildVNode)
}

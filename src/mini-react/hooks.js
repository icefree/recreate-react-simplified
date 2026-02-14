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
 *   渲染流程：
 *   ──────────
 *   1. reconciler 调用组件函数前：
 *      - 设置 currentComponent = 当前组件的 VNode
 *      - 重置 hookIndex = 0
 *
 *   2. 组件函数执行时：
 *      - 每调用 useState / useEffect / useRef
 *        → 从 currentComponent.__hooks[hookIndex] 读取已有状态
 *        → 或初始化新状态
 *        → hookIndex++
 *
 *   3. 组件函数执行完毕：
 *      - 检查 hookIndex 是否与上次一致（防止条件调用 Hook）
 *      - 清空 currentComponent = null
 *
 *   useEffect 执行时机：
 *   ────────────────────
 *   useEffect(callback, deps)
 *     → 组件渲染完成后（DOM 已更新）
 *     → 对比依赖数组是否变化（Object.is 浅比较）
 *     → 如果变化了 → 先执行上次的 cleanup，再执行新的 effect
 *     → 组件卸载时 → 执行最后的 cleanup
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
 * @param {string} hookName - Hook 名称，用于错误提示
 */
function assertHookContext(hookName) {
  if (!currentComponent) {
    throw new Error(
      `${hookName} must be called inside a function component (at the top level)`
    )
  }
}

// ─── useReducer ───────────────────────────────────────────────

/**
 * useReducer Hook — useState 的泛化版本
 *
 * React 内部 useState 就是基于 useReducer 实现的。
 * useReducer 适合管理复杂状态逻辑（多个子值、依赖前一状态）。
 *
 * @param {Function} reducer  - (state, action) => newState
 * @param {*}        initialArg - 初始值（或传给 init 函数的参数）
 * @param {Function} [init]   - 可选的惰性初始化函数
 * @returns {[any, Function]} [state, dispatch]
 *
 * 示例：
 *   function reducer(state, action) {
 *     switch (action.type) {
 *       case 'increment': return { count: state.count + 1 }
 *       case 'decrement': return { count: state.count - 1 }
 *       default: return state
 *     }
 *   }
 *   const [state, dispatch] = useReducer(reducer, { count: 0 })
 *   dispatch({ type: 'increment' })
 */
export function useReducer(reducer, initialArg, init) {
  assertHookContext('useReducer')

  const component = currentComponent
  const idx = hookIndex++
  const oldHook = component.__hooks[idx]

  const hook = oldHook ?? {
    state: init ? init(initialArg) : initialArg,
    queue: [],
  }

  // 消费更新队列 — 按入队顺序依次执行
  hook.queue.forEach(action => {
    hook.state = reducer(hook.state, action)
  })
  hook.queue = []
  component.__hooks[idx] = hook

  // dispatch 是稳定的引用（闭包捕获 hook 和 component）
  const dispatch = (action) => {
    hook.queue.push(action)
    scheduleRerender(component)
  }

  return [hook.state, dispatch]
}

// ─── useState ─────────────────────────────────────────────────

/**
 * useState 的内置 reducer
 * action 可以是直接值或函数式更新
 */
function basicStateReducer(state, action) {
  return typeof action === 'function' ? action(state) : action
}

/**
 * useState Hook — 为函数组件提供状态管理
 *
 * 本质上是 useReducer 的语法糖，内置了 basicStateReducer。
 * 这与 React 源码的设计一致。
 *
 * @param {*} initialValue - 初始值，也可以是一个返回初始值的函数（惰性初始化）
 * @returns {[any, Function]} [state, setState]
 *
 * 示例：
 *   const [count, setCount] = useState(0)
 *   setCount(1)                 // 直接赋值
 *   setCount(prev => prev + 1)  // 函数式更新
 */
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
    hook.state = basicStateReducer(hook.state, action)
  })
  hook.queue = []
  component.__hooks[idx] = hook

  const setState = (action) => {
    hook.queue.push(action)
    scheduleRerender(component)
  }

  return [hook.state, setState]
}

// ─── useEffect ────────────────────────────────────────────────

/**
 * useEffect Hook — 副作用管理
 *
 * 执行时机：
 *   1. 组件渲染完成（DOM 已更新）后异步执行
 *   2. 对比依赖数组是否变化（Object.is 浅比较）
 *   3. 如果变化了 → 先执行上次的 cleanup，再执行新的 effect
 *   4. 组件卸载时 → 执行最后的 cleanup
 *
 * @param {Function}  callback - effect 回调，可返回 cleanup 函数
 * @param {Array}     [deps]   - 依赖数组（undefined 表示每次都执行）
 *
 * 示例：
 *   // 每次渲染后执行
 *   useEffect(() => { console.log('rendered') })
 *
 *   // 仅挂载时执行一次
 *   useEffect(() => {
 *     const id = setInterval(() => console.log('tick'), 1000)
 *     return () => clearInterval(id)  // cleanup
 *   }, [])
 *
 *   // deps 变化时执行
 *   useEffect(() => { fetchData(id) }, [id])
 */
export function useEffect(callback, deps) {
  assertHookContext('useEffect')

  // 参数校验
  if (typeof callback !== 'function') {
    throw new Error('useEffect callback must be a function')
  }
  if (deps !== undefined && !Array.isArray(deps)) {
    throw new Error('useEffect deps must be an array or undefined')
  }

  const component = currentComponent
  const idx = hookIndex++
  const oldHook = component.__hooks[idx]

  // 依赖比较：首次渲染总是执行，后续根据 deps 变化判断
  const hasChanged = oldHook
    ? !deps || !oldHook.deps || deps.length !== oldHook.deps.length ||
      deps.some((dep, i) => !Object.is(dep, oldHook.deps[i]))
    : true

  if (hasChanged) {
    // 保存新 hook，保留旧的 cleanup 引用以便稍后执行
    component.__hooks[idx] = {
      tag: 'effect',
      deps,
      cleanup: oldHook?.cleanup,
    }

    const hookRef = component.__hooks[idx]

    // 在 DOM 更新后异步执行 effect
    queueMicrotask(() => {
      // 先执行上次的 cleanup
      if (hookRef.cleanup) {
        hookRef.cleanup()
      }
      // 执行 effect，保存返回的 cleanup
      const cleanup = callback()
      if (cleanup !== undefined && typeof cleanup !== 'function') {
        console.warn(
          'useEffect callback must return either a cleanup function or undefined. ' +
          `Got: ${typeof cleanup}`
        )
      }
      hookRef.cleanup = typeof cleanup === 'function' ? cleanup : undefined
    })
  } else {
    // 依赖没变，保留旧 hook
    component.__hooks[idx] = oldHook
  }
}

// ─── useRef ───────────────────────────────────────────────────

/**
 * useRef Hook — 跨渲染持久化的可变容器
 *
 * 返回 { current: initialValue } 对象，在组件生命周期内保持同一引用。
 * 修改 .current 不会触发重新渲染（与 useState 的本质区别）。
 *
 * 常见用途：
 *   - 保存 DOM 引用
 *   - 保存定时器 ID
 *   - 保存前一次渲染的值
 *
 * @param {*} initialValue - 初始值
 * @returns {{ current: * }}
 *
 * 示例：
 *   const inputRef = useRef(null)
 *   // 在 effect 中：inputRef.current = domNode
 *   // 读取：inputRef.current.focus()
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
 * 当 reconciler 发现组件被移除时调用此函数，
 * 确保所有 useEffect 的清理函数都被正确执行。
 *
 * @param {Object} component - 组件 VNode
 */
export function unmountComponent(component) {
  if (!component?.__hooks) return

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
 * @param {Object} component - 需要重渲染的组件 VNode
 */
export function scheduleRerender(component) {
  dirtyComponents.add(component)
  if (flushScheduled) return
  flushScheduled = true
  queueMicrotask(flushUpdates)
}

/**
 * 批量执行所有脏组件的重渲染
 */
function flushUpdates() {
  flushScheduled = false
  const pending = Array.from(dirtyComponents)
  dirtyComponents.clear()
  pending.forEach(renderComponent)
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

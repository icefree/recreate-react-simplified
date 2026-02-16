/**
 * ============================================================
 * Mini-React: context — createContext / memo / shallowEqual
 * ============================================================
 *
 * 🎯 核心职责：
 *   实现 React 的跨层级数据传递（Context）和组件级性能优化（memo）。
 *
 * 📚 核心概念（必须理解）：
 *
 *   Context 的工作方式：
 *   ──────────────────
 *   1. createContext(defaultValue) 创建一个"频道"对象
 *   2. <Context.Provider value={...}> 在组件树上方"广播"值
 *   3. useContext(Context) 在下方任意层级"接收"值
 *   4. Provider 值变化时，所有 Consumer 自动重新渲染
 *
 *   简化版 vs 真实 React：
 *   ─────────────────────
 *   - 真实 React：Provider 值变化时会扫描 Fiber 树，
 *     找到所有读取该 Context 的 Consumer，精确标记为脏节点
 *     （propagateContextChange）
 *   - 简化版：用全局值方式实现，所有子组件都会重新渲染
 *
 *   memo 高阶组件：
 *   ──────────────
 *   - React.memo(Component) 通过浅比较 props 决定是否跳过渲染
 *   - 等价于 class 组件的 shouldComponentUpdate
 *   - 配合 useCallback 使用效果最佳（保持传入的函数引用稳定）
 *
 * ============================================================
 */

// ─── createContext ─────────────────────────────────────────────

/**
 * 创建一个 Context 对象
 *
 * TODO (Phase 7b): 实现 createContext
 *
 * 📚 核心原理：
 *
 *   Context 本质上是一个"共享值容器"。它包含：
 *   - _defaultValue: 没有 Provider 时的默认值
 *   - _currentValue: 当前的值（Provider 设置）
 *   - Provider: 一个特殊的组件，用于在组件树中注入值
 *
 * 步骤：
 *   1. 创建 context 对象：
 *      const context = {
 *        _defaultValue: defaultValue,
 *        _currentValue: defaultValue,
 *        Provider: null,
 *      }
 *
 *   2. 实现 Provider 组件：
 *      context.Provider = function ContextProvider({ value, children }) {
 *        context._currentValue = value
 *        return children
 *      }
 *
 *      💡 Provider 是一个函数组件，它的作用是：
 *         - 接收 value prop，更新 context._currentValue
 *         - 直接返回 children（自身不产生额外 DOM）
 *
 *      💡 简化版的局限：
 *         - 全局只有一个 _currentValue，不支持嵌套的同类 Provider
 *         - 值变化时无法精确通知 Consumer（依赖父组件重渲染来触发）
 *         - 真实 React 用 Fiber 树的 propagateContextChange 来精确触发
 *
 *   3. 返回 context
 *
 * @param {*} defaultValue - 没有 Provider 时的默认值
 * @returns {{ _defaultValue: *, _currentValue: *, Provider: Function }}
 */
export function createContext(defaultValue) {
  // TODO: 实现 createContext
  // 提示：创建 context 对象 → 实现 Provider 组件 → 返回 context
  const context = {
    _defaultValue: defaultValue,
    _currentValue: defaultValue,
    Provider: null,
  }

  context.Provider = function ContextProvider({ value, children }) {
    context._currentValue = value
    // children 是数组（来自 createElement），简化版只支持单子元素
    return Array.isArray(children) ? children[0] : children
  }

  return context
}

// ─── shallowEqual ──────────────────────────────────────────────

/**
 * 浅比较两个对象
 *
 * TODO (Phase 7b): 实现 shallowEqual
 *
 * 📚 核心原理：
 *
 *   浅比较 ≠ 深比较：
 *   - 浅比较会遍历对象的第一层属性，对每个属性值使用 Object.is() 进行比较
 *   - 深比较会递归比较所有嵌套层级
 *   - React 的 memo 使用浅比较，因为深比较性能开销太大
 *
 *   Object.is vs ===：
 *   - Object.is(NaN, NaN) === true （=== 是 false）
 *   - Object.is(+0, -0)  === false（=== 是 true）
 *   - React 统一使用 Object.is
 *
 * 步骤：
 *   1. 快速路径：如果 Object.is(objA, objB) 为 true，直接返回 true
 *
 *   2. 排除非对象：如果 objA 或 objB 不是对象（或 null），返回 false
 *
 *   3. 获取 key 列表：
 *      const keysA = Object.keys(objA)
 *      const keysB = Object.keys(objB)
 *
 *   4. key 数量不同 → 返回 false
 *
 *   5. 逐 key 用 Object.is 比较值：
 *      return keysA.every(key => Object.is(objA[key], objB[key]))
 *
 * @param {Object} objA
 * @param {Object} objB
 * @returns {boolean}
 */
export function shallowEqual(objA, objB) {
  // TODO: 实现 shallowEqual
  // 提示：Object.is → 类型检查 → keys 数量 → 逐 key 比较
  if(Object.is(objA, objB)){
    return true
  }
  if(typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null){
    return false
  }
  const keysA = Object.keys(objA)
  const keysB = Object.keys(objB)
  if(keysA.length !== keysB.length){
    return false
  }
  return keysA.every(key => Object.is(objA[key], objB[key]))
}

// ─── memo ──────────────────────────────────────────────────────

/**
 * 高阶组件：浅比较 props，跳过不必要的渲染
 *
 * TODO (Phase 7b): 实现 memo
 *
 * 📚 核心原理：
 *
 *   memo 的工作方式：
 *   ─────────────────
 *   1. 包装原始组件，返回一个新的"记忆化"组件
 *   2. 每次渲染时，比较新旧 props
 *   3. 如果 props 没变化，直接返回上次的渲染结果（跳过组件函数执行）
 *   4. 如果 props 有变化，执行组件函数并缓存新结果
 *
 *   与 useMemo 的区别：
 *   ──────────────────
 *   - memo 是组件级别的优化（跳过整个组件的重渲染）
 *   - useMemo 是值级别的优化（跳过某个计算）
 *
 *   配合 useCallback：
 *   ─────────────────
 *   如果传给 memo 组件的 props 中有函数，每次父组件渲染都会创建新函数，
 *   导致 memo 的浅比较失败。用 useCallback 保持函数引用稳定即可。
 *
 * 步骤：
 *   1. 返回一个新的函数组件 MemoComponent(props)
 *
 *   2. 在 MemoComponent 内部，需要访问组件实例来保存上次的 props 和结果。
 *      💡 这里有一个设计选择：
 *         方案 A：利用 currentComponent（hooks.js 导出）访问组件 VNode
 *         方案 B：给 MemoComponent 函数添加 __prevMemoProps / __prevMemoResult 属性
 *
 *      简化版推荐方案 B，因为不依赖 hooks 内部 API：
 *      
 *      const MemoComponent = function(props) { ... }
 *      // 利用闭包 + 函数对象属性来存储状态
 *
 *   3. 每次调用时：
 *      a. 获取 prevProps = MemoComponent.__prevMemoProps
 *      b. 如果 prevProps 存在，进行比较：
 *         - 有自定义 areEqual：areEqual(prevProps, props)
 *         - 无自定义：shallowEqual(prevProps, props)
 *      c. 如果相等，返回 MemoComponent.__prevMemoResult
 *      d. 如果不等（或首次渲染），执行 Component(props) 并缓存结果
 *
 *   4. 记得更新缓存：
 *      MemoComponent.__prevMemoProps = props
 *      MemoComponent.__prevMemoResult = result
 *
 * @param {Function} Component - 要包装的函数组件
 * @param {Function} [areEqual] - 可选的自定义比较函数 (prevProps, nextProps) => boolean
 * @returns {Function} 记忆化后的组件
 */
export function memo(Component, areEqual) {
  // TODO: 实现 memo
  // 提示：创建包装组件 → 比较 props → 相等则返回缓存 → 不等则重新计算
  const MemoComponent = function(props){
    // 剥离 children — createElement 每次生成新的 children 数组引用，
    // 直接比较会导致 shallowEqual 永远返回 false
    const { children: _, ...compareProps } = props
    const prevProps = MemoComponent.__prevMemoProps
    const prevResult = MemoComponent.__prevMemoResult
    
    if(prevProps && (areEqual ? areEqual(prevProps, compareProps) : shallowEqual(prevProps, compareProps))){
      return prevResult
    }
    
    const result = Component(props)
    MemoComponent.__prevMemoProps = compareProps
    MemoComponent.__prevMemoResult = result
    return result
  }

  return MemoComponent
}

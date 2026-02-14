/**
 * ============================================================
 * Phase 6 Tests — useEffect / useRef / useReducer
 * ============================================================
 *
 * @vitest-environment jsdom
 *
 * 测试覆盖：
 *  1. useEffect 基本功能（首次渲染执行）
 *  2. useEffect 依赖数组（空数组只执行一次、deps 变化时触发）
 *  3. useEffect cleanup 函数
 *  4. useEffect 组件卸载清理
 *  5. useEffect 参数校验
 *  6. useRef 持久化引用
 *  7. useRef 修改 .current 不触发渲染
 *  8. useReducer 基本功能
 *  9. useReducer 惰性初始化
 *
 * ============================================================
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createElement } from '../src/mini-react/createElement.js'
import { createRoot } from '../src/mini-react/root.js'
import { useState, useEffect, useRef, useReducer } from '../src/mini-react/hooks.js'

// ─── 测试辅助 ────────────────────────────────────────────────

let container

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  return () => {
    document.body.removeChild(container)
  }
})

/**
 * 等待 microtask 完成（让 queueMicrotask 调度的 flush 和 effect 执行）
 */
function flushMicrotasks() {
  return new Promise(resolve => setTimeout(resolve, 10))
}

// ─── useEffect 测试 ──────────────────────────────────────────

describe('Phase 6: useEffect', () => {
  describe('基本功能', () => {
    it('useEffect 应在首次渲染后执行', async () => {
      const effectFn = vi.fn()

      function App() {
        useEffect(effectFn)
        return createElement('div', null, 'Hello')
      }

      const root = createRoot(container)
      root.render(createElement(App))

      // effect 是异步执行的，同步检查应该还没执行
      expect(effectFn).not.toHaveBeenCalled()

      await flushMicrotasks()
      expect(effectFn).toHaveBeenCalledOnce()
    })

    it('无依赖的 useEffect 每次渲染后都执行', async () => {
      const effectFn = vi.fn()
      let setCountRef

      function App() {
        const [count, setCount] = useState(0)
        setCountRef = setCount
        useEffect(effectFn)
        return createElement('div', null, `Count: ${count}`)
      }

      const root = createRoot(container)
      root.render(createElement(App))
      await flushMicrotasks()
      expect(effectFn).toHaveBeenCalledTimes(1)

      // 触发重渲染
      setCountRef(1)
      await flushMicrotasks()
      expect(effectFn).toHaveBeenCalledTimes(2)

      // 再次触发
      setCountRef(2)
      await flushMicrotasks()
      expect(effectFn).toHaveBeenCalledTimes(3)
    })
  })

  describe('依赖数组', () => {
    it('空依赖 useEffect(() => {}, []) 只在挂载时执行一次', async () => {
      const effectFn = vi.fn()
      let setCountRef

      function App() {
        const [count, setCount] = useState(0)
        setCountRef = setCount
        useEffect(effectFn, [])
        return createElement('div', null, `Count: ${count}`)
      }

      const root = createRoot(container)
      root.render(createElement(App))
      await flushMicrotasks()
      expect(effectFn).toHaveBeenCalledOnce()

      // 重渲染，effect 不应再次执行
      setCountRef(1)
      await flushMicrotasks()
      expect(effectFn).toHaveBeenCalledOnce()

      // 再次重渲染
      setCountRef(2)
      await flushMicrotasks()
      expect(effectFn).toHaveBeenCalledOnce()
    })

    it('依赖变化时触发 effect', async () => {
      const effectFn = vi.fn()
      let setCountRef

      function App() {
        const [count, setCount] = useState(0)
        setCountRef = setCount
        useEffect(effectFn, [count])
        return createElement('div', null, `Count: ${count}`)
      }

      const root = createRoot(container)
      root.render(createElement(App))
      await flushMicrotasks()
      expect(effectFn).toHaveBeenCalledTimes(1)

      // count 从 0 → 1，依赖变化，effect 应执行
      setCountRef(1)
      await flushMicrotasks()
      expect(effectFn).toHaveBeenCalledTimes(2)

      // count 从 1 → 1（没变），effect 不应执行
      setCountRef(1)
      await flushMicrotasks()
      expect(effectFn).toHaveBeenCalledTimes(2)
    })
  })

  describe('cleanup 函数', () => {
    it('依赖变化时先执行 cleanup 再执行新 effect', async () => {
      const calls = []
      let setCountRef

      function App() {
        const [count, setCount] = useState(0)
        setCountRef = setCount
        useEffect(() => {
          calls.push(`effect:${count}`)
          return () => calls.push(`cleanup:${count}`)
        }, [count])
        return createElement('div', null, `Count: ${count}`)
      }

      const root = createRoot(container)
      root.render(createElement(App))
      await flushMicrotasks()
      expect(calls).toEqual(['effect:0'])

      setCountRef(1)
      await flushMicrotasks()
      expect(calls).toEqual(['effect:0', 'cleanup:0', 'effect:1'])

      setCountRef(2)
      await flushMicrotasks()
      expect(calls).toEqual(['effect:0', 'cleanup:0', 'effect:1', 'cleanup:1', 'effect:2'])
    })

    it('组件卸载时执行最后的 cleanup', async () => {
      const cleanupFn = vi.fn()

      function Child() {
        useEffect(() => {
          return cleanupFn
        }, [])
        return createElement('span', null, 'child')
      }

      function App({ showChild }) {
        return createElement(
          'div',
          null,
          showChild ? createElement(Child) : createElement('span', null, 'empty')
        )
      }

      const root = createRoot(container)
      root.render(createElement(App, { showChild: true }))
      await flushMicrotasks()
      expect(cleanupFn).not.toHaveBeenCalled()

      // 卸载 Child
      root.render(createElement(App, { showChild: false }))
      await flushMicrotasks()
      expect(cleanupFn).toHaveBeenCalledOnce()
    })
  })

  describe('参数校验', () => {
    it('callback 不是函数应抛错', () => {
      function App() {
        useEffect('not a function')
        return createElement('div', null, 'Hello')
      }

      expect(() => {
        const root = createRoot(container)
        root.render(createElement(App))
      }).toThrow(/callback must be a function/)
    })

    it('deps 不是数组应抛错', () => {
      function App() {
        useEffect(() => {}, 'not an array')
        return createElement('div', null, 'Hello')
      }

      expect(() => {
        const root = createRoot(container)
        root.render(createElement(App))
      }).toThrow(/deps must be an array/)
    })

    it('组件外调用 useEffect 应抛错', () => {
      expect(() => useEffect(() => {})).toThrow(/must be called inside/)
    })
  })
})

// ─── useRef 测试 ──────────────────────────────────────────────

describe('Phase 6: useRef', () => {
  it('useRef 应返回带 current 属性的对象', () => {
    let refValue

    function App() {
      const ref = useRef(42)
      refValue = ref
      return createElement('div', null, `Ref: ${ref.current}`)
    }

    const root = createRoot(container)
    root.render(createElement(App))

    expect(refValue).toEqual({ tag: 'ref', current: 42 })
    expect(container.textContent).toBe('Ref: 42')
  })

  it('useRef 跨渲染保持同一引用', async () => {
    let refRef
    let setCountRef

    function App() {
      const [count, setCount] = useState(0)
      setCountRef = setCount
      const ref = useRef('initial')
      refRef = ref
      return createElement('div', null, `Count: ${count}, Ref: ${ref.current}`)
    }

    const root = createRoot(container)
    root.render(createElement(App))
    const firstRef = refRef

    // 修改 current
    refRef.current = 'modified'

    // 触发重渲染
    setCountRef(1)
    await flushMicrotasks()

    // ref 应该是同一个对象
    expect(refRef).toBe(firstRef)
    // current 应该保持修改后的值
    expect(refRef.current).toBe('modified')
  })

  it('useRef 修改 .current 不触发重新渲染', async () => {
    let renderCount = 0
    let refRef

    function App() {
      renderCount++
      const ref = useRef(0)
      refRef = ref
      return createElement('div', null, `Rendered: ${renderCount}`)
    }

    const root = createRoot(container)
    root.render(createElement(App))
    expect(renderCount).toBe(1)

    // 修改 ref.current — 不应触发渲染
    refRef.current = 999
    await flushMicrotasks()
    expect(renderCount).toBe(1)
  })

  it('组件外调用 useRef 应抛错', () => {
    expect(() => useRef(0)).toThrow(/must be called inside/)
  })
})

// ─── useReducer 测试 ─────────────────────────────────────────

describe('Phase 6: useReducer', () => {
  function counterReducer(state, action) {
    switch (action.type) {
      case 'increment':
        return { count: state.count + 1 }
      case 'decrement':
        return { count: state.count - 1 }
      case 'reset':
        return { count: 0 }
      default:
        return state
    }
  }

  it('useReducer 应返回初始状态和 dispatch 函数', () => {
    let stateRef, dispatchRef

    function App() {
      const [state, dispatch] = useReducer(counterReducer, { count: 0 })
      stateRef = state
      dispatchRef = dispatch
      return createElement('div', null, `Count: ${state.count}`)
    }

    const root = createRoot(container)
    root.render(createElement(App))

    expect(container.textContent).toBe('Count: 0')
    expect(typeof dispatchRef).toBe('function')
  })

  it('dispatch 应触发重渲染并应用 reducer', async () => {
    let dispatchRef

    function App() {
      const [state, dispatch] = useReducer(counterReducer, { count: 0 })
      dispatchRef = dispatch
      return createElement('div', null, `Count: ${state.count}`)
    }

    const root = createRoot(container)
    root.render(createElement(App))
    expect(container.textContent).toBe('Count: 0')

    dispatchRef({ type: 'increment' })
    await flushMicrotasks()
    expect(container.textContent).toBe('Count: 1')

    dispatchRef({ type: 'increment' })
    await flushMicrotasks()
    expect(container.textContent).toBe('Count: 2')

    dispatchRef({ type: 'decrement' })
    await flushMicrotasks()
    expect(container.textContent).toBe('Count: 1')
  })

  it('useReducer 应支持惰性初始化 (init 函数)', () => {
    const initFn = vi.fn(arg => ({ count: arg * 2 }))

    function App() {
      const [state] = useReducer(counterReducer, 5, initFn)
      return createElement('div', null, `Count: ${state.count}`)
    }

    const root = createRoot(container)
    root.render(createElement(App))

    expect(container.textContent).toBe('Count: 10')
    expect(initFn).toHaveBeenCalledWith(5)
    expect(initFn).toHaveBeenCalledOnce()

    // 重渲染不应再次调用 init
    root.render(createElement(App))
    expect(initFn).toHaveBeenCalledOnce()
  })

  it('多次 dispatch 应被批处理', async () => {
    let renderCount = 0
    let dispatchRef

    function App() {
      renderCount++
      const [state, dispatch] = useReducer(counterReducer, { count: 0 })
      dispatchRef = dispatch
      return createElement('div', null, `Count: ${state.count}`)
    }

    const root = createRoot(container)
    root.render(createElement(App))
    expect(renderCount).toBe(1)

    // 同步调用多次 dispatch
    dispatchRef({ type: 'increment' })
    dispatchRef({ type: 'increment' })
    dispatchRef({ type: 'increment' })
    await flushMicrotasks()

    expect(renderCount).toBe(2) // 只多渲染了一次
    expect(container.textContent).toBe('Count: 3')
  })

  it('组件外调用 useReducer 应抛错', () => {
    expect(() => useReducer((s) => s, 0)).toThrow(/must be called inside/)
  })
})

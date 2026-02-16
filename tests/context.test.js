/**
 * ============================================================
 * Phase 7b Tests — Context API & Memoization Hooks
 * ============================================================
 *
 * @vitest-environment jsdom
 *
 * 测试覆盖：
 *  Part 1: createContext + useContext
 *    1.1 createContext 返回正确结构
 *    1.2 useContext 读取 Provider 提供的值
 *    1.3 深层嵌套组件可以读取 Context
 *    1.4 没有 Provider 时返回 defaultValue
 *    1.5 Provider 值变化时 Consumer 正确更新
 *    1.6 组件外调用 useContext 抛错
 *
 *  Part 2: useMemo
 *    2.1 useMemo 首次渲染执行 factory
 *    2.2 deps 不变时返回缓存值（不重新计算）
 *    2.3 deps 变化时重新计算
 *    2.4 无 deps 时每次都重新计算
 *
 *  Part 3: useCallback
 *    3.1 useCallback 返回函数
 *    3.2 deps 不变时返回同一引用
 *    3.3 deps 变化时返回新引用
 *
 *  Part 4: shallowEqual
 *    4.1 相同引用返回 true
 *    4.2 相同键值返回 true
 *    4.3 不同值返回 false
 *    4.4 不同 key 数量返回 false
 *    4.5 null/undefined 处理
 *
 *  Part 5: memo
 *    5.1 首次渲染正常执行
 *    5.2 props 不变时跳过渲染
 *    5.3 props 变化时重新渲染
 *    5.4 自定义 areEqual 函数
 *
 * ============================================================
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createElement } from '../src/mini-react/createElement.js'
import { createRoot } from '../src/mini-react/root.js'
import { useState, useContext, useMemo, useCallback } from '../src/mini-react/hooks.js'
import { createContext, shallowEqual, memo } from '../src/mini-react/context.js'

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
 * 等待 microtask 完成（让 queueMicrotask 调度的 flush 执行）
 */
function flushMicrotasks() {
  return new Promise(resolve => setTimeout(resolve, 0))
}

// ════════════════════════════════════════════════════════════════
// Part 1: createContext + useContext
// ════════════════════════════════════════════════════════════════

describe('Phase 7b Part 1: createContext + useContext', () => {
  // ── 1.1 createContext 结构 ──

  describe('createContext 基本结构', () => {
    it('createContext 应返回包含 _defaultValue、_currentValue 和 Provider 的对象', () => {
      const ctx = createContext('default')
      expect(ctx._defaultValue).toBe('default')
      expect(ctx._currentValue).toBe('default')
      expect(typeof ctx.Provider).toBe('function')
    })

    it('不传 defaultValue 时应默认为 undefined', () => {
      const ctx = createContext()
      expect(ctx._defaultValue).toBeUndefined()
      expect(ctx._currentValue).toBeUndefined()
    })
  })

  // ── 1.2 useContext 基本读取 ──

  describe('useContext 读取 Provider 值', () => {
    it('useContext 应读取 Provider 提供的值', () => {
      const ThemeContext = createContext('light')
      let themeRef

      function Child() {
        const theme = useContext(ThemeContext)
        themeRef = theme
        return createElement('div', null, `Theme: ${theme}`)
      }

      function App() {
        return createElement(
          ThemeContext.Provider,
          { value: 'dark' },
          createElement(Child)
        )
      }

      const root = createRoot(container)
      root.render(createElement(App))

      expect(themeRef).toBe('dark')
      expect(container.textContent).toBe('Theme: dark')
    })
  })

  // ── 1.3 深层嵌套 ──

  describe('深层嵌套组件读取 Context', () => {
    it('深层组件应能读取 Context 值（跨越中间组件）', () => {
      const UserContext = createContext(null)
      let userRef

      function DeepChild() {
        const user = useContext(UserContext)
        userRef = user
        return createElement('span', null, user ? user.name : 'no user')
      }

      function Middle() {
        return createElement('div', null, createElement(DeepChild))
      }

      function App() {
        return createElement(
          UserContext.Provider,
          { value: { name: 'Alice', age: 30 } },
          createElement(Middle)
        )
      }

      const root = createRoot(container)
      root.render(createElement(App))

      expect(userRef).toEqual({ name: 'Alice', age: 30 })
      expect(container.textContent).toBe('Alice')
    })
  })

  // ── 1.4 没有 Provider 时返回 defaultValue ──

  describe('无 Provider 时的 defaultValue', () => {
    it('没有 Provider 时 useContext 应返回 defaultValue', () => {
      const LangContext = createContext('en')
      let langRef

      function App() {
        const lang = useContext(LangContext)
        langRef = lang
        return createElement('div', null, `Lang: ${lang}`)
      }

      const root = createRoot(container)
      root.render(createElement(App))

      expect(langRef).toBe('en')
      expect(container.textContent).toBe('Lang: en')
    })
  })

  // ── 1.5 Provider 值变化 ──

  describe('Provider 值变化', () => {
    it('Provider 值变化时 Consumer 组件应正确更新', () => {
      const ThemeContext = createContext('light')
      let themeRef

      function Child() {
        const theme = useContext(ThemeContext)
        themeRef = theme
        return createElement('div', null, `Theme: ${theme}`)
      }

      function App({ theme }) {
        return createElement(
          ThemeContext.Provider,
          { value: theme },
          createElement(Child)
        )
      }

      const root = createRoot(container)

      // 首次渲染 — light
      root.render(createElement(App, { theme: 'light' }))
      expect(container.textContent).toBe('Theme: light')

      // 更新 — dark
      root.render(createElement(App, { theme: 'dark' }))
      expect(container.textContent).toBe('Theme: dark')
    })
  })

  // ── 1.6 组件外调用 useContext 抛错 ──

  describe('组件外调用 useContext', () => {
    it('在组件外调用 useContext 应抛出错误', () => {
      const ctx = createContext('test')
      expect(() => useContext(ctx)).toThrow(/must be called inside/)
    })
  })
})

// ════════════════════════════════════════════════════════════════
// Part 2: useMemo
// ════════════════════════════════════════════════════════════════

describe('Phase 7b Part 2: useMemo', () => {
  // ── 2.1 首次渲染执行 factory ──

  describe('首次渲染', () => {
    it('useMemo 首次渲染应执行 factory 并返回结果', () => {
      const factory = vi.fn(() => 42)
      let memoRef

      function App() {
        const value = useMemo(factory, [])
        memoRef = value
        return createElement('div', null, `Value: ${value}`)
      }

      const root = createRoot(container)
      root.render(createElement(App))

      expect(memoRef).toBe(42)
      expect(factory).toHaveBeenCalledOnce()
    })
  })

  // ── 2.2 deps 不变时返回缓存 ──

  describe('deps 不变时缓存', () => {
    it('deps 不变时不应重新执行 factory', () => {
      const factory = vi.fn(() => Math.random())
      let values = []

      function App({ dep }) {
        const value = useMemo(factory, [dep])
        values.push(value)
        return createElement('div', null, `Value: ${value}`)
      }

      const root = createRoot(container)
      root.render(createElement(App, { dep: 1 }))
      root.render(createElement(App, { dep: 1 }))

      // factory 只被调用一次
      expect(factory).toHaveBeenCalledOnce()
      // 两次返回的值相同
      expect(values[0]).toBe(values[1])
    })
  })

  // ── 2.3 deps 变化时重新计算 ──

  describe('deps 变化时重新计算', () => {
    it('deps 变化时应重新执行 factory', () => {
      let callCount = 0
      let values = []

      function App({ multiplier }) {
        const value = useMemo(() => {
          callCount++
          return multiplier * 10
        }, [multiplier])
        values.push(value)
        return createElement('div', null, `Value: ${value}`)
      }

      const root = createRoot(container)
      root.render(createElement(App, { multiplier: 2 }))
      expect(values[0]).toBe(20)
      expect(callCount).toBe(1)

      root.render(createElement(App, { multiplier: 3 }))
      expect(values[1]).toBe(30)
      expect(callCount).toBe(2)
    })
  })

  // ── 2.4 无 deps 时每次重新计算 ──

  describe('无 deps (undefined)', () => {
    it('不传 deps 时应每次都重新计算', () => {
      const factory = vi.fn(() => Date.now())

      function App() {
        useMemo(factory)
        return createElement('div', null, 'test')
      }

      const root = createRoot(container)
      root.render(createElement(App))
      root.render(createElement(App))

      expect(factory).toHaveBeenCalledTimes(2)
    })
  })
})

// ════════════════════════════════════════════════════════════════
// Part 3: useCallback
// ════════════════════════════════════════════════════════════════

describe('Phase 7b Part 3: useCallback', () => {
  // ── 3.1 返回函数 ──

  describe('基本功能', () => {
    it('useCallback 应返回传入的函数', () => {
      let callbackRef

      function App() {
        const fn = useCallback(() => 'hello', [])
        callbackRef = fn
        return createElement('div', null, 'test')
      }

      const root = createRoot(container)
      root.render(createElement(App))

      expect(typeof callbackRef).toBe('function')
      expect(callbackRef()).toBe('hello')
    })
  })

  // ── 3.2 deps 不变时返回同一引用 ──

  describe('deps 不变时函数引用稳定', () => {
    it('deps 不变时应返回同一个函数引用', () => {
      let refs = []

      function App({ dep }) {
        const fn = useCallback(() => dep, [dep])
        refs.push(fn)
        return createElement('div', null, 'test')
      }

      const root = createRoot(container)
      root.render(createElement(App, { dep: 1 }))
      root.render(createElement(App, { dep: 1 }))

      expect(refs[0]).toBe(refs[1]) // 同一引用
    })
  })

  // ── 3.3 deps 变化时返回新引用 ──

  describe('deps 变化时函数引用更新', () => {
    it('deps 变化时应返回新的函数引用', () => {
      let refs = []

      function App({ dep }) {
        const fn = useCallback(() => dep, [dep])
        refs.push(fn)
        return createElement('div', null, 'test')
      }

      const root = createRoot(container)
      root.render(createElement(App, { dep: 1 }))
      root.render(createElement(App, { dep: 2 }))

      expect(refs[0]).not.toBe(refs[1]) // 不同引用
    })
  })
})

// ════════════════════════════════════════════════════════════════
// Part 4: shallowEqual
// ════════════════════════════════════════════════════════════════

describe('Phase 7b Part 4: shallowEqual', () => {
  it('相同引用应返回 true', () => {
    const obj = { a: 1, b: 2 }
    expect(shallowEqual(obj, obj)).toBe(true)
  })

  it('相同键值的不同对象应返回 true', () => {
    expect(shallowEqual({ a: 1, b: 'hello' }, { a: 1, b: 'hello' })).toBe(true)
  })

  it('不同值应返回 false', () => {
    expect(shallowEqual({ a: 1 }, { a: 2 })).toBe(false)
  })

  it('不同 key 数量应返回 false', () => {
    expect(shallowEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false)
  })

  it('null / undefined 应正确处理', () => {
    expect(shallowEqual(null, null)).toBe(true)
    expect(shallowEqual(null, { a: 1 })).toBe(false)
    expect(shallowEqual({ a: 1 }, null)).toBe(false)
  })

  it('原始值应正确比较', () => {
    expect(shallowEqual(1, 1)).toBe(true)
    expect(shallowEqual('a', 'a')).toBe(true)
    expect(shallowEqual(1, 2)).toBe(false)
  })

  it('NaN 应与 NaN 相等（Object.is 语义）', () => {
    expect(shallowEqual(NaN, NaN)).toBe(true)
  })

  it('嵌套对象应采用浅比较（不递归）', () => {
    const inner = { x: 1 }
    expect(shallowEqual({ a: inner }, { a: inner })).toBe(true)
    // 不同引用的嵌套对象，即使值相同也返回 false
    expect(shallowEqual({ a: { x: 1 } }, { a: { x: 1 } })).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════════
// Part 5: memo
// ════════════════════════════════════════════════════════════════

describe('Phase 7b Part 5: memo', () => {
  // ── 5.1 首次渲染正常执行 ──

  describe('首次渲染', () => {
    it('memo 包装的组件首次渲染应正常执行', () => {
      const renderSpy = vi.fn()

      const Child = memo(function RawChild({ name }) {
        renderSpy()
        return createElement('span', null, `Hello ${name}`)
      })

      function App() {
        return createElement(Child, { name: 'World' })
      }

      const root = createRoot(container)
      root.render(createElement(App))

      expect(container.textContent).toBe('Hello World')
      expect(renderSpy).toHaveBeenCalledOnce()
    })
  })

  // ── 5.2 props 不变时跳过渲染 ──

  describe('props 不变时跳过渲染', () => {
    it('props 浅比较相等时应跳过组件函数执行', () => {
      const renderSpy = vi.fn()

      const Child = memo(function RawChild({ name }) {
        renderSpy()
        return createElement('span', null, `Hello ${name}`)
      })

      function App({ name }) {
        return createElement(Child, { name })
      }

      const root = createRoot(container)
      root.render(createElement(App, { name: 'World' }))
      expect(renderSpy).toHaveBeenCalledTimes(1)

      // 再次渲染，props 相同
      root.render(createElement(App, { name: 'World' }))
      // 应该仍然只调用了一次（跳过了第二次渲染）
      expect(renderSpy).toHaveBeenCalledTimes(1)
      expect(container.textContent).toBe('Hello World')
    })
  })

  // ── 5.3 props 变化时重新渲染 ──

  describe('props 变化时重新渲染', () => {
    it('props 变化时应重新执行组件函数', () => {
      const renderSpy = vi.fn()

      const Child = memo(function RawChild({ name }) {
        renderSpy()
        return createElement('span', null, `Hello ${name}`)
      })

      function App({ name }) {
        return createElement(Child, { name })
      }

      const root = createRoot(container)
      root.render(createElement(App, { name: 'World' }))
      expect(renderSpy).toHaveBeenCalledTimes(1)

      // props 改变
      root.render(createElement(App, { name: 'React' }))
      expect(renderSpy).toHaveBeenCalledTimes(2)
      expect(container.textContent).toBe('Hello React')
    })
  })

  // ── 5.4 自定义 areEqual ──

  describe('自定义 areEqual', () => {
    it('自定义 areEqual 返回 true 时应跳过渲染', () => {
      const renderSpy = vi.fn()

      // 只比较 id，忽略 timestamp
      const Child = memo(
        function RawChild({ id, timestamp }) {
          renderSpy()
          return createElement('span', null, `Item ${id} at ${timestamp}`)
        },
        (prevProps, nextProps) => prevProps.id === nextProps.id
      )

      function App({ id, timestamp }) {
        return createElement(Child, { id, timestamp })
      }

      const root = createRoot(container)
      root.render(createElement(App, { id: 1, timestamp: 100 }))
      expect(renderSpy).toHaveBeenCalledTimes(1)

      // id 相同，timestamp 不同 → areEqual 返回 true → 跳过渲染
      root.render(createElement(App, { id: 1, timestamp: 200 }))
      expect(renderSpy).toHaveBeenCalledTimes(1)

      // id 变了 → areEqual 返回 false → 重新渲染
      root.render(createElement(App, { id: 2, timestamp: 300 }))
      expect(renderSpy).toHaveBeenCalledTimes(2)
    })
  })
})

/**
 * ============================================================
 * Phase 5 Tests — useState Hook
 * ============================================================
 *
 * @vitest-environment jsdom
 *
 * 测试覆盖：
 *  1. useState 基本功能（返回 [state, setState]）
 *  2. setState 触发重渲染
 *  3. 函数式更新 setState(prev => prev + 1)
 *  4. 多个 useState 独立工作
 *  5. 惰性初始化 useState(() => computeInitial())
 *  6. 批处理（同一 microtask 内多次 setState 只触发一次渲染）
 *  7. Hook 规则校验（组件外调用抛错、数量不一致抛错）
 *
 * ============================================================
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createElement } from '../src/mini-react/createElement.js'
import { createRoot } from '../src/mini-react/root.js'
import { useState } from '../src/mini-react/hooks.js'

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

// ─── 测试用例 ────────────────────────────────────────────────

describe('Phase 5: useState Hook', () => {
  // ── 5.1 基本功能 ──

  describe('基本功能', () => {
    it('useState 应返回初始状态和 setState 函数', () => {
      let stateRef
      function App() {
        const [count, setCount] = useState(0)
        stateRef = { count, setCount }
        return createElement('div', null, `Count: ${count}`)
      }

      const root = createRoot(container)
      root.render(createElement(App))

      expect(container.textContent).toBe('Count: 0')
      expect(typeof stateRef.setCount).toBe('function')
    })

    it('useState 应支持惰性初始化', () => {
      const initializer = vi.fn(() => 42)
      let stateRef

      function App() {
        const [value] = useState(initializer)
        stateRef = value
        return createElement('div', null, `Value: ${value}`)
      }

      const root = createRoot(container)
      root.render(createElement(App))

      expect(container.textContent).toBe('Value: 42')
      expect(initializer).toHaveBeenCalledOnce()

      // 重新渲染时不应再次调用 initializer
      root.render(createElement(App))
      expect(initializer).toHaveBeenCalledOnce()
    })
  })

  // ── 5.2 setState 触发重渲染 ──

  describe('setState 触发重渲染', () => {
    it('setState 应触发组件重新渲染', async () => {
      let setCountRef

      function Counter() {
        const [count, setCount] = useState(0)
        setCountRef = setCount
        return createElement('div', null, `Count: ${count}`)
      }

      const root = createRoot(container)
      root.render(createElement(Counter))
      expect(container.textContent).toBe('Count: 0')

      // 触发 setState
      setCountRef(1)
      await flushMicrotasks()

      expect(container.textContent).toBe('Count: 1')
    })

    it('setState 应支持直接赋值', async () => {
      let setNameRef

      function App() {
        const [name, setName] = useState('Alice')
        setNameRef = setName
        return createElement('div', null, `Name: ${name}`)
      }

      const root = createRoot(container)
      root.render(createElement(App))
      expect(container.textContent).toBe('Name: Alice')

      setNameRef('Bob')
      await flushMicrotasks()

      expect(container.textContent).toBe('Name: Bob')
    })
  })

  // ── 5.3 函数式更新 ──

  describe('函数式更新', () => {
    it('setState(fn) 应接收前一个状态作为参数', async () => {
      let setCountRef

      function Counter() {
        const [count, setCount] = useState(0)
        setCountRef = setCount
        return createElement('div', null, `Count: ${count}`)
      }

      const root = createRoot(container)
      root.render(createElement(Counter))

      setCountRef(prev => prev + 1)
      await flushMicrotasks()

      expect(container.textContent).toBe('Count: 1')
    })

    it('多次函数式更新应按顺序执行', async () => {
      let setCountRef

      function Counter() {
        const [count, setCount] = useState(0)
        setCountRef = setCount
        return createElement('div', null, `Count: ${count}`)
      }

      const root = createRoot(container)
      root.render(createElement(Counter))

      // 连续 3 次 +1
      setCountRef(prev => prev + 1)
      setCountRef(prev => prev + 1)
      setCountRef(prev => prev + 1)
      await flushMicrotasks()

      expect(container.textContent).toBe('Count: 3')
    })
  })

  // ── 5.4 多个 useState ──

  describe('多个 useState', () => {
    it('同一组件中多个 useState 应独立工作', async () => {
      let setCountRef, setNameRef

      function App() {
        const [count, setCount] = useState(0)
        const [name, setName] = useState('Alice')
        setCountRef = setCount
        setNameRef = setName
        return createElement(
          'div',
          null,
          createElement('span', { id: 'count' }, `${count}`),
          createElement('span', { id: 'name' }, name)
        )
      }

      const root = createRoot(container)
      root.render(createElement(App))

      expect(container.querySelector('#count').textContent).toBe('0')
      expect(container.querySelector('#name').textContent).toBe('Alice')

      // 只修改 count
      setCountRef(5)
      await flushMicrotasks()

      expect(container.querySelector('#count').textContent).toBe('5')
      expect(container.querySelector('#name').textContent).toBe('Alice')

      // 只修改 name
      setNameRef('Bob')
      await flushMicrotasks()

      expect(container.querySelector('#count').textContent).toBe('5')
      expect(container.querySelector('#name').textContent).toBe('Bob')
    })
  })

  // ── 5.5 批处理 ──

  describe('批处理', () => {
    it('同一 microtask 内多次 setState 应只触发一次渲染', async () => {
      let renderCount = 0
      let setCountRef

      function Counter() {
        renderCount++
        const [count, setCount] = useState(0)
        setCountRef = setCount
        return createElement('div', null, `Count: ${count}`)
      }

      const root = createRoot(container)
      root.render(createElement(Counter))
      expect(renderCount).toBe(1)

      // 同步调用多次 setState
      setCountRef(1)
      setCountRef(2)
      setCountRef(3)
      await flushMicrotasks()

      // 应该只重新渲染了一次（renderCount 从 1 变为 2，不是 4）
      expect(renderCount).toBe(2)
      expect(container.textContent).toBe('Count: 3')
    })
  })

  // ── 5.6 Hook 规则校验 ──

  describe('Hook 规则校验', () => {
    it('在组件外调用 useState 应抛出错误', () => {
      expect(() => useState(0)).toThrow(/must be called inside/)
    })
  })

  // ── 5.7 组件嵌套中的 useState ──

  describe('嵌套组件中的 useState', () => {
    it('父子组件各自的 useState 应独立', async () => {
      let setParentCountRef, setChildCountRef

      function Child() {
        const [count, setCount] = useState(100)
        setChildCountRef = setCount
        return createElement('span', { id: 'child' }, `Child: ${count}`)
      }

      function Parent() {
        const [count, setCount] = useState(0)
        setParentCountRef = setCount
        return createElement(
          'div',
          null,
          createElement('span', { id: 'parent' }, `Parent: ${count}`),
          createElement(Child)
        )
      }

      const root = createRoot(container)
      root.render(createElement(Parent))

      expect(container.querySelector('#parent').textContent).toBe('Parent: 0')
      expect(container.querySelector('#child').textContent).toBe('Child: 100')

      // 修改父组件状态
      setParentCountRef(1)
      await flushMicrotasks()

      expect(container.querySelector('#parent').textContent).toBe('Parent: 1')
      expect(container.querySelector('#child').textContent).toBe('Child: 100')
    })
  })
})

/**
 * ============================================================
 * Phase 7 Tests — 事件委托系统
 * ============================================================
 *
 * @vitest-environment jsdom
 *
 * 测试覆盖：
 *  1. isEventProp / getEventName 工具函数
 *  2. 事件委托基本功能（click 触发）
 *  3. 事件冒泡行为
 *  4. 事件处理器更新
 *  5. 事件处理器移除
 *  6. 动态元素的事件处理
 *  7. 多种事件类型（input, change, submit, keydown）
 *  8. setEventHandler / removeEventHandler
 *  9. 事件委托不会重复初始化
 * 10. stopPropagation 阻止冒泡
 *
 * ============================================================
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createElement } from '../src/mini-react/createElement.js'
import { createRoot } from '../src/mini-react/root.js'
import { useState } from '../src/mini-react/hooks.js'
import {
  isEventProp,
  getEventName,
  setupEventDelegation,
  setEventHandler,
  removeEventHandler,
} from '../src/mini-react/events.js'

// ─── 测试辅助 ────────────────────────────────────────────────

let container

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  return () => {
    document.body.removeChild(container)
  }
})

function flushMicrotasks() {
  return new Promise(resolve => setTimeout(resolve, 10))
}

// ─── 工具函数测试 ────────────────────────────────────────────

describe('Phase 7: 事件属性工具函数', () => {
  describe('isEventProp', () => {
    it('onClick 应被识别为事件属性', () => {
      expect(isEventProp('onClick')).toBe(true)
    })

    it('onChange 应被识别为事件属性', () => {
      expect(isEventProp('onChange')).toBe(true)
    })

    it('onInput 应被识别为事件属性', () => {
      expect(isEventProp('onInput')).toBe(true)
    })

    it('onKeyDown 应被识别为事件属性', () => {
      expect(isEventProp('onKeyDown')).toBe(true)
    })

    it('className 不应被识别为事件属性', () => {
      expect(isEventProp('className')).toBe(false)
    })

    it('id 不应被识别为事件属性', () => {
      expect(isEventProp('id')).toBe(false)
    })

    it('style 不应被识别为事件属性', () => {
      expect(isEventProp('style')).toBe(false)
    })

    it('children 不应被识别为事件属性', () => {
      expect(isEventProp('children')).toBe(false)
    })
  })

  describe('getEventName', () => {
    it('onClick → click', () => {
      expect(getEventName('onClick')).toBe('click')
    })

    it('onChange → change', () => {
      expect(getEventName('onChange')).toBe('change')
    })

    it('onKeyDown → keydown', () => {
      expect(getEventName('onKeyDown')).toBe('keydown')
    })

    it('onInput → input', () => {
      expect(getEventName('onInput')).toBe('input')
    })

    it('onDoubleClick → doubleclick', () => {
      expect(getEventName('onDoubleClick')).toBe('doubleclick')
    })
  })
})

// ─── setEventHandler / removeEventHandler 测试 ──────────────

describe('Phase 7: 事件处理器存储', () => {
  it('setEventHandler 应在 DOM 节点上存储处理器', () => {
    const dom = document.createElement('div')
    const handler = vi.fn()
    setEventHandler(dom, 'click', handler)
    expect(dom.__eventHandlers.click).toBe(handler)
  })

  it('setEventHandler 应支持多个事件类型', () => {
    const dom = document.createElement('div')
    const clickHandler = vi.fn()
    const inputHandler = vi.fn()
    setEventHandler(dom, 'click', clickHandler)
    setEventHandler(dom, 'input', inputHandler)
    expect(dom.__eventHandlers.click).toBe(clickHandler)
    expect(dom.__eventHandlers.input).toBe(inputHandler)
  })

  it('setEventHandler 应覆盖旧处理器', () => {
    const dom = document.createElement('div')
    const oldHandler = vi.fn()
    const newHandler = vi.fn()
    setEventHandler(dom, 'click', oldHandler)
    setEventHandler(dom, 'click', newHandler)
    expect(dom.__eventHandlers.click).toBe(newHandler)
  })

  it('removeEventHandler 应移除处理器', () => {
    const dom = document.createElement('div')
    const handler = vi.fn()
    setEventHandler(dom, 'click', handler)
    removeEventHandler(dom, 'click')
    expect(dom.__eventHandlers.click).toBeUndefined()
  })

  it('removeEventHandler 对不存在的处理器不应报错', () => {
    const dom = document.createElement('div')
    expect(() => removeEventHandler(dom, 'click')).not.toThrow()
  })
})

// ─── setupEventDelegation 测试 ──────────────────────────────

describe('Phase 7: setupEventDelegation', () => {
  it('应在容器上标记 __eventsInitialized', () => {
    const root = document.createElement('div')
    setupEventDelegation(root)
    expect(root.__eventsInitialized).toBe(true)
  })

  it('重复调用不应重复初始化', () => {
    const root = document.createElement('div')
    const spy = vi.spyOn(root, 'addEventListener')
    setupEventDelegation(root)
    const firstCallCount = spy.calls?.length ?? spy.mock.calls.length
    setupEventDelegation(root)
    const secondCallCount = spy.calls?.length ?? spy.mock.calls.length
    expect(secondCallCount).toBe(firstCallCount)
    spy.mockRestore()
  })

  it('点击子元素应触发存储在其上的 click handler', () => {
    const root = document.createElement('div')
    document.body.appendChild(root)
    setupEventDelegation(root)

    const btn = document.createElement('button')
    const handler = vi.fn()
    btn.__eventHandlers = { click: handler }
    root.appendChild(btn)

    btn.click()
    expect(handler).toHaveBeenCalledOnce()

    document.body.removeChild(root)
  })

  it('事件应沿 DOM 树冒泡（子 → 父）', () => {
    const root = document.createElement('div')
    document.body.appendChild(root)
    setupEventDelegation(root)

    const calls = []
    const parent = document.createElement('div')
    parent.__eventHandlers = { click: () => calls.push('parent') }
    const child = document.createElement('span')
    child.__eventHandlers = { click: () => calls.push('child') }

    root.appendChild(parent)
    parent.appendChild(child)

    child.click()
    expect(calls).toEqual(['child', 'parent'])

    document.body.removeChild(root)
  })
})

// ─── 集成测试：通过 createRoot 测试事件委托 ──────────────────

describe('Phase 7: 事件委托集成测试', () => {
  it('onClick 事件应正确触发', () => {
    const handler = vi.fn()
    const root = createRoot(container)
    root.render(
      createElement('button', { onClick: handler }, 'Click me')
    )

    container.querySelector('button').click()
    expect(handler).toHaveBeenCalledOnce()
  })

  it('嵌套元素的事件应正确冒泡', () => {
    const calls = []
    const root = createRoot(container)
    root.render(
      createElement(
        'div', { onClick: () => calls.push('outer') },
        createElement(
          'div', { onClick: () => calls.push('inner') },
          createElement('button', { onClick: () => calls.push('button') }, 'Click')
        )
      )
    )

    container.querySelector('button').click()
    expect(calls).toEqual(['button', 'inner', 'outer'])
  })

  it('事件处理器更新后应使用新的处理器', async () => {
    const calls = []
    let setLabelRef

    function App() {
      const [label, setLabel] = useState('first')
      setLabelRef = setLabel
      return createElement(
        'button',
        { onClick: () => calls.push(label) },
        label
      )
    }

    const root = createRoot(container)
    root.render(createElement(App))

    container.querySelector('button').click()
    expect(calls).toEqual(['first'])

    setLabelRef('second')
    await flushMicrotasks()

    container.querySelector('button').click()
    expect(calls).toEqual(['first', 'second'])
  })

  it('元素删除后事件不应触发', async () => {
    const handler = vi.fn()
    let setShowRef

    function App() {
      const [show, setShow] = useState(true)
      setShowRef = setShow
      return createElement(
        'div', null,
        show
          ? createElement('button', { onClick: handler }, 'Click')
          : createElement('span', null, 'gone')
      )
    }

    const root = createRoot(container)
    root.render(createElement(App))

    container.querySelector('button').click()
    expect(handler).toHaveBeenCalledOnce()

    setShowRef(false)
    await flushMicrotasks()

    // button 已被删除，不存在了
    expect(container.querySelector('button')).toBeNull()
  })

  it('动态添加元素的事件应正确工作', async () => {
    const handler = vi.fn()
    let setShowRef

    function App() {
      const [show, setShow] = useState(false)
      setShowRef = setShow
      return createElement(
        'div', null,
        show
          ? createElement('button', { onClick: handler, id: 'dynamic-btn' }, 'Dynamic')
          : createElement('span', null, 'waiting')
      )
    }

    const root = createRoot(container)
    root.render(createElement(App))
    expect(container.querySelector('#dynamic-btn')).toBeNull()

    setShowRef(true)
    await flushMicrotasks()

    const btn = container.querySelector('#dynamic-btn')
    expect(btn).not.toBeNull()
    btn.click()
    expect(handler).toHaveBeenCalledOnce()
  })

  it('input 事件应正确触发', () => {
    const handler = vi.fn()
    const root = createRoot(container)
    root.render(
      createElement('input', { onInput: handler, type: 'text' })
    )

    const input = container.querySelector('input')
    const event = new Event('input', { bubbles: true })
    input.dispatchEvent(event)
    expect(handler).toHaveBeenCalledOnce()
  })

  it('keydown 事件应正确触发', () => {
    const handler = vi.fn()
    const root = createRoot(container)
    root.render(
      createElement('input', { onKeyDown: handler, type: 'text' })
    )

    const input = container.querySelector('input')
    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
    input.dispatchEvent(event)
    expect(handler).toHaveBeenCalledOnce()
    expect(handler.mock.calls[0][0].key).toBe('Enter')
  })

  it('移除事件属性后不应再触发', async () => {
    const handler = vi.fn()
    let setHasHandlerRef

    function App() {
      const [hasHandler, setHasHandler] = useState(true)
      setHasHandlerRef = setHasHandler
      return createElement(
        'button',
        hasHandler ? { onClick: handler } : {},
        'Click'
      )
    }

    const root = createRoot(container)
    root.render(createElement(App))

    container.querySelector('button').click()
    expect(handler).toHaveBeenCalledOnce()

    setHasHandlerRef(false)
    await flushMicrotasks()

    container.querySelector('button').click()
    expect(handler).toHaveBeenCalledOnce() // 不应增加
  })

  it('submit 事件应正确触发', () => {
    const handler = vi.fn(e => e.preventDefault())
    const root = createRoot(container)
    root.render(
      createElement(
        'form', { onSubmit: handler },
        createElement('button', { type: 'submit' }, 'Submit')
      )
    )

    const form = container.querySelector('form')
    const event = new Event('submit', { bubbles: true, cancelable: true })
    form.dispatchEvent(event)
    expect(handler).toHaveBeenCalledOnce()
  })
})

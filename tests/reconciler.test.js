/**
 * Phase 3+ 测试 — Reconciliation（两阶段模型）
 *
 * 运行方式：pnpm test
 *
 * 这些测试验证 reconciler 的两阶段架构：
 *
 *   Phase 1: Render Phase（reconcile）
 *     - 遍历 VNode 树，计算 diff
 *     - 收集 effects 到 pendingMutations 数组
 *     - ⚠️ 不直接操作 DOM
 *
 *   Phase 2: Commit Phase（commitRoot）
 *     - 遍历 pendingMutations，批量执行 DOM 操作
 *     - 执行完后清空 pendingMutations
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { createElement } from '../src/mini-react/createElement.js'
import { reconcile, commitRoot, getPendingMutations } from '../src/mini-react/reconciler.js'
import { createRoot } from '../src/mini-react/root.js'

// ─── 两阶段模型验证 ──────────────────────────────────────────

describe('commitRoot — 两阶段模型', () => {
  let container

  beforeEach(() => {
    container = document.createElement('div')
  })

  it('reconcile 后 DOM 不变 — effects 仅被收集', () => {
    const vnode = createElement('p', null, 'Hello')

    // Render Phase：只收集 effects，不操作 DOM
    reconcile(container, null, vnode)

    // DOM 此时应该是空的（还没 commit）
    expect(container.childNodes.length).toBe(0)
    // 但 pendingMutations 中应有 PLACEMENT effect
    expect(getPendingMutations().length).toBeGreaterThan(0)
  })

  it('commitRoot 后 DOM 才更新', () => {
    const vnode = createElement('p', null, 'Hello')

    reconcile(container, null, vnode)
    expect(container.childNodes.length).toBe(0)  // DOM 未变

    // Commit Phase：执行所有 pending effects
    commitRoot()

    // DOM 现在已更新
    expect(container.innerHTML).toBe('<p>Hello</p>')
    // pendingMutations 已清空
    expect(getPendingMutations().length).toBe(0)
  })

  it('commitRoot 执行后 pendingMutations 被清空', () => {
    const vnode = createElement('div', { id: 'test' }, 'content')

    reconcile(container, null, vnode)
    expect(getPendingMutations().length).toBeGreaterThan(0)

    commitRoot()
    expect(getPendingMutations().length).toBe(0)
  })

  it('没有 pending effects 时 commitRoot 不应报错', () => {
    expect(() => commitRoot()).not.toThrow()
    expect(getPendingMutations().length).toBe(0)
  })
})

// ─── reconcile + commitRoot 基本场景 ─────────────────────────

describe('reconcile + commitRoot', () => {
  let container

  beforeEach(() => {
    container = document.createElement('div')
  })

  // ─── 新增节点 ─────────────────────────────────────────────

  it('oldVNode 为 null 时应创建新节点（PLACEMENT）', () => {
    const vnode = createElement('p', null, 'Hello')
    reconcile(container, null, vnode)
    commitRoot()

    expect(container.innerHTML).toBe('<p>Hello</p>')
  })

  it('两个都为 null 时不应报错', () => {
    expect(() => {
      reconcile(container, null, null)
      commitRoot()
    }).not.toThrow()
    expect(container.childNodes.length).toBe(0)
  })

  // ─── 删除节点 ─────────────────────────────────────────────

  it('newVNode 为 null 时应删除旧节点（DELETION）', () => {
    const old = createElement('div', null, 'content')
    reconcile(container, null, old)
    commitRoot()
    expect(container.childNodes.length).toBe(1)

    reconcile(container, old, null)
    commitRoot()
    expect(container.childNodes.length).toBe(0)
  })

  // ─── 类型替换 ─────────────────────────────────────────────

  it('类型不同时应替换节点（REPLACE）', () => {
    const old = createElement('p', null, 'old')
    reconcile(container, null, old)
    commitRoot()
    expect(container.innerHTML).toBe('<p>old</p>')

    const next = createElement('div', null, 'new')
    reconcile(container, old, next)
    commitRoot()
    expect(container.innerHTML).toBe('<div>new</div>')
  })

  // ─── 属性更新 ─────────────────────────────────────────────

  it('类型相同时应更新属性而不重建 DOM（UPDATE）', () => {
    const old = createElement('div', { id: 'a', className: 'old' })
    reconcile(container, null, old)
    commitRoot()
    const domRef = container.firstChild

    const next = createElement('div', { id: 'b', className: 'new' })
    reconcile(container, old, next)
    commitRoot()

    // DOM 节点应该是同一个（没有重建）
    expect(container.firstChild).toBe(domRef)
    expect(container.firstChild.id).toBe('b')
    expect(container.firstChild.className).toBe('new')
  })

  it('应删除旧属性中不再存在的属性', () => {
    const old = createElement('div', { id: 'test', className: 'foo' })
    reconcile(container, null, old)
    commitRoot()
    expect(container.firstChild.className).toBe('foo')

    const next = createElement('div', { id: 'test' })
    reconcile(container, old, next)
    commitRoot()
    expect(container.firstChild.className).toBe('')
  })

  it('应正确更新 style', () => {
    const old = createElement('div', { style: { color: 'red', fontSize: '16px' } })
    reconcile(container, null, old)
    commitRoot()

    const next = createElement('div', { style: { color: 'blue' } })
    reconcile(container, old, next)
    commitRoot()

    expect(container.firstChild.style.color).toBe('blue')
    // fontSize 不再存在于新 style，应被清除
    expect(container.firstChild.style.fontSize).toBe('')
  })

  // ─── 文本节点更新 ─────────────────────────────────────────

  it('文本内容变化时只更新 nodeValue', () => {
    const old = createElement('p', null, 'Hello')
    reconcile(container, null, old)
    commitRoot()

    const textNode = container.firstChild.firstChild
    const next = createElement('p', null, 'World')
    reconcile(container, old, next)
    commitRoot()

    // p 节点不变
    expect(container.firstChild.nodeName).toBe('P')
    // 文本节点内容已更新
    expect(container.firstChild.textContent).toBe('World')
  })

  // ─── 子节点增减 ─────────────────────────────────────────

  it('应能添加新的子节点', () => {
    const old = createElement('ul', null, createElement('li', null, 'A'))
    reconcile(container, null, old)
    commitRoot()
    expect(container.querySelectorAll('li').length).toBe(1)

    const next = createElement(
      'ul',
      null,
      createElement('li', null, 'A'),
      createElement('li', null, 'B')
    )
    reconcile(container, old, next)
    commitRoot()
    expect(container.querySelectorAll('li').length).toBe(2)
    expect(container.querySelectorAll('li')[1].textContent).toBe('B')
  })

  it('应能删除多余的子节点', () => {
    const old = createElement(
      'ul',
      null,
      createElement('li', null, 'A'),
      createElement('li', null, 'B'),
      createElement('li', null, 'C')
    )
    reconcile(container, null, old)
    commitRoot()
    expect(container.querySelectorAll('li').length).toBe(3)

    const next = createElement('ul', null, createElement('li', null, 'A'))
    reconcile(container, old, next)
    commitRoot()
    expect(container.querySelectorAll('li').length).toBe(1)
  })
})

// ─── key 驱动的列表协调 ──────────────────────────────────────

describe('reconcile with keys + commitRoot', () => {
  let container

  beforeEach(() => {
    container = document.createElement('div')
  })

  it('key 稳定时应复用 DOM 节点', () => {
    const old = createElement(
      'ul',
      null,
      createElement('li', { key: 'a' }, 'A'),
      createElement('li', { key: 'b' }, 'B'),
      createElement('li', { key: 'c' }, 'C')
    )
    reconcile(container, null, old)
    commitRoot()

    const domA = container.querySelectorAll('li')[0]
    const domB = container.querySelectorAll('li')[1]

    // 重排：B, A, C
    const next = createElement(
      'ul',
      null,
      createElement('li', { key: 'b' }, 'B'),
      createElement('li', { key: 'a' }, 'A'),
      createElement('li', { key: 'c' }, 'C')
    )
    reconcile(container, old, next)
    commitRoot()

    const lis = container.querySelectorAll('li')
    expect(lis.length).toBe(3)
    expect(lis[0].textContent).toBe('B')
    expect(lis[1].textContent).toBe('A')
    // key 匹配的 DOM 节点被复用
    expect(lis[0]).toBe(domB)
    expect(lis[1]).toBe(domA)
  })

  it('应正确插入新 key 的节点', () => {
    const old = createElement(
      'ul',
      null,
      createElement('li', { key: 'a' }, 'A'),
      createElement('li', { key: 'c' }, 'C')
    )
    reconcile(container, null, old)
    commitRoot()

    const next = createElement(
      'ul',
      null,
      createElement('li', { key: 'a' }, 'A'),
      createElement('li', { key: 'b' }, 'B'),
      createElement('li', { key: 'c' }, 'C')
    )
    reconcile(container, old, next)
    commitRoot()

    const lis = container.querySelectorAll('li')
    expect(lis.length).toBe(3)
    expect(lis[0].textContent).toBe('A')
    expect(lis[1].textContent).toBe('B')
    expect(lis[2].textContent).toBe('C')
  })

  it('应正确删除不存在的 key', () => {
    const old = createElement(
      'ul',
      null,
      createElement('li', { key: 'a' }, 'A'),
      createElement('li', { key: 'b' }, 'B'),
      createElement('li', { key: 'c' }, 'C')
    )
    reconcile(container, null, old)
    commitRoot()

    const next = createElement(
      'ul',
      null,
      createElement('li', { key: 'a' }, 'A'),
      createElement('li', { key: 'c' }, 'C')
    )
    reconcile(container, old, next)
    commitRoot()

    const lis = container.querySelectorAll('li')
    expect(lis.length).toBe(2)
    expect(lis[0].textContent).toBe('A')
    expect(lis[1].textContent).toBe('C')
  })
})

// ─── Root API ────────────────────────────────────────────────

describe('createRoot (内部调用 reconcile + commitRoot)', () => {
  let container

  beforeEach(() => {
    container = document.createElement('div')
  })

  it('root.render 应进行首次挂载', () => {
    const root = createRoot(container)
    root.render(createElement('p', null, 'Hello Root'))

    expect(container.innerHTML).toBe('<p>Hello Root</p>')
  })

  it('root.render 多次调用应增量更新', () => {
    const root = createRoot(container)
    root.render(createElement('p', null, 'v1'))
    const domRef = container.firstChild

    root.render(createElement('p', null, 'v2'))
    // 应该是同一个 DOM 节点（原地更新，非重建）
    expect(container.firstChild).toBe(domRef)
    expect(container.firstChild.textContent).toBe('v2')
  })

  it('root.unmount 应清空容器', () => {
    const root = createRoot(container)
    root.render(createElement('div', null, 'content'))
    expect(container.childNodes.length).toBe(1)

    root.unmount()
    expect(container.childNodes.length).toBe(0)
  })

  it('同一容器 createRoot 两次应返回同一 root（幂等）', () => {
    const root1 = createRoot(container)
    const root2 = createRoot(container)
    expect(root1).toBe(root2)
  })

  it('不同容器应互不影响', () => {
    const container2 = document.createElement('div')
    const root1 = createRoot(container)
    const root2 = createRoot(container2)

    root1.render(createElement('p', null, 'Root 1'))
    root2.render(createElement('p', null, 'Root 2'))

    expect(container.textContent).toBe('Root 1')
    expect(container2.textContent).toBe('Root 2')

    root1.unmount()
    expect(container.childNodes.length).toBe(0)
    // root2 不受影响
    expect(container2.textContent).toBe('Root 2')
  })
})

/**
 * Phase 1 测试 — render
 *
 * 运行方式：pnpm test
 *
 * 这些测试使用 jsdom 环境来验证 render 是否正确地将 VNode 转为真实 DOM。
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { createElement } from '../src/mini-react/createElement.js'
import { render } from '../src/mini-react/render.js'

describe('render', () => {
  let container

  beforeEach(() => {
    container = document.createElement('div')
  })

  it('应该渲染一个简单的文本节点', () => {
    const vnode = createElement('p', null, 'Hello')
    render(vnode, container)

    expect(container.innerHTML).toBe('<p>Hello</p>')
  })

  it('应该渲染一个带属性的元素', () => {
    const vnode = createElement('div', { id: 'test' })
    render(vnode, container)

    const div = container.querySelector('#test')
    expect(div).not.toBeNull()
    expect(div.id).toBe('test')
  })

  it('应该正确设置 className', () => {
    const vnode = createElement('span', { className: 'highlight' }, 'text')
    render(vnode, container)

    const span = container.querySelector('.highlight')
    expect(span).not.toBeNull()
    expect(span.textContent).toBe('text')
  })

  it('应该正确设置 style 对象', () => {
    const vnode = createElement('div', {
      style: { color: 'red', fontSize: '16px' },
    })
    render(vnode, container)

    const div = container.firstChild
    expect(div.style.color).toBe('red')
    expect(div.style.fontSize).toBe('16px')
  })

  it('应该渲染嵌套元素', () => {
    const vnode = createElement(
      'div',
      null,
      createElement('h1', null, 'Title'),
      createElement('p', null, 'Content')
    )
    render(vnode, container)

    expect(container.querySelector('h1').textContent).toBe('Title')
    expect(container.querySelector('p').textContent).toBe('Content')
  })

  it('应该渲染多层嵌套', () => {
    const vnode = createElement(
      'div',
      { id: 'outer' },
      createElement(
        'div',
        { id: 'inner' },
        createElement('span', null, 'deep')
      )
    )
    render(vnode, container)

    const deep = container.querySelector('#outer #inner span')
    expect(deep).not.toBeNull()
    expect(deep.textContent).toBe('deep')
  })

  it('应该处理多个文本和元素混合的子节点', () => {
    const vnode = createElement(
      'p',
      null,
      'Hello ',
      createElement('strong', null, 'World'),
      '!'
    )
    render(vnode, container)

    const p = container.querySelector('p')
    expect(p.childNodes).toHaveLength(3)
    expect(p.textContent).toBe('Hello World!')
  })

  it('应该渲染一个完整的列表', () => {
    const items = ['Apple', 'Banana', 'Cherry']
    const vnode = createElement(
      'ul',
      null,
      ...items.map((item) => createElement('li', null, item))
    )
    render(vnode, container)

    const lis = container.querySelectorAll('li')
    expect(lis).toHaveLength(3)
    expect(lis[0].textContent).toBe('Apple')
    expect(lis[1].textContent).toBe('Banana')
    expect(lis[2].textContent).toBe('Cherry')
  })
})

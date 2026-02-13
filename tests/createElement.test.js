/**
 * Phase 1 测试 — createElement
 *
 * 运行方式：pnpm test
 *
 * 这些测试会验证你的 createElement 实现是否正确。
 * 先写代码，再跑测试，看看哪些通过了、哪些没通过。
 */

import { describe, it, expect } from 'vitest'
import { createElement, createTextElement, TEXT_ELEMENT } from '../src/mini-react/createElement.js'

describe('createTextElement', () => {
  it('应该创建一个文本类型的 VNode', () => {
    const result = createTextElement('Hello')
    expect(result).toEqual({
      type: TEXT_ELEMENT,
      props: {
        nodeValue: 'Hello',
        children: [],
      },
    })
  })

  it('应该处理数字类型的文本', () => {
    const result = createTextElement(42)
    expect(result).toEqual({
      type: TEXT_ELEMENT,
      props: {
        nodeValue: 42,
        children: [],
      },
    })
  })
})

describe('createElement', () => {
  it('应该创建一个没有子节点的简单元素', () => {
    const result = createElement('div', { id: 'app' })
    expect(result).toEqual({
      type: 'div',
      props: {
        id: 'app',
        children: [],
      },
    })
  })

  it('应该处理 props 为 null 的情况', () => {
    const result = createElement('div', null)
    expect(result).toEqual({
      type: 'div',
      props: {
        children: [],
      },
    })
  })

  it('应该将字符串 children 包装为 TEXT_ELEMENT', () => {
    const result = createElement('p', null, 'Hello')
    expect(result.props.children).toHaveLength(1)
    expect(result.props.children[0]).toEqual({
      type: TEXT_ELEMENT,
      props: {
        nodeValue: 'Hello',
        children: [],
      },
    })
  })

  it('应该将数字 children 包装为 TEXT_ELEMENT', () => {
    const result = createElement('span', null, 42)
    expect(result.props.children[0]).toEqual({
      type: TEXT_ELEMENT,
      props: {
        nodeValue: 42,
        children: [],
      },
    })
  })

  it('应该过滤掉 null、undefined、boolean 类型的 children', () => {
    const result = createElement('div', null, 'Hello', null, undefined, false, true, 'World')
    expect(result.props.children).toHaveLength(2)
    expect(result.props.children[0].props.nodeValue).toBe('Hello')
    expect(result.props.children[1].props.nodeValue).toBe('World')
  })

  it('应该保留 VNode 类型的 children 不变', () => {
    const child = createElement('span', null, 'inner')
    const result = createElement('div', null, child)
    expect(result.props.children).toHaveLength(1)
    expect(result.props.children[0]).toBe(child) // 同一个引用
    expect(result.props.children[0].type).toBe('span')
  })

  it('应该支持多个混合类型的 children', () => {
    const spanChild = createElement('span', { className: 'highlight' }, 'World')
    const result = createElement('div', { id: 'mix' }, 'Hello ', spanChild, '!')

    expect(result.type).toBe('div')
    expect(result.props.id).toBe('mix')
    expect(result.props.children).toHaveLength(3)

    // 第一个 child: 文本
    expect(result.props.children[0].type).toBe(TEXT_ELEMENT)
    expect(result.props.children[0].props.nodeValue).toBe('Hello ')

    // 第二个 child: VNode
    expect(result.props.children[1].type).toBe('span')
    expect(result.props.children[1].props.className).toBe('highlight')

    // 第三个 child: 文本
    expect(result.props.children[2].type).toBe(TEXT_ELEMENT)
    expect(result.props.children[2].props.nodeValue).toBe('!')
  })

  it('应该支持嵌套的 createElement 调用', () => {
    const result = createElement(
      'div',
      null,
      createElement('h1', null, 'Title'),
      createElement('p', null, 'Paragraph')
    )

    expect(result.type).toBe('div')
    expect(result.props.children).toHaveLength(2)
    expect(result.props.children[0].type).toBe('h1')
    expect(result.props.children[1].type).toBe('p')
  })
})

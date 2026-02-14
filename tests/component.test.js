/**
 * ============================================================
 * Phase 4 Tests — 函数式组件
 * ============================================================
 *
 * @vitest-environment jsdom
 *
 * 测试覆盖：
 *  1. 函数组件基本渲染
 *  2. Props 正确传递
 *  3. children prop
 *  4. 组件嵌套（组件中使用组件）
 *  5. 函数组件的 reconcile 更新
 *  6. 函数组件的卸载
 *  7. 多层嵌套组件
 *
 * ============================================================
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { createElement, TEXT_ELEMENT } from '../src/mini-react/createElement.js'
import { createRoot } from '../src/mini-react/root.js'
import { reconcile } from '../src/mini-react/reconciler.js'

// ─── 测试辅助 ────────────────────────────────────────────────

let container

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  return () => {
    document.body.removeChild(container)
  }
})

// ─── 测试组件 ────────────────────────────────────────────────

function SimpleComponent(props) {
  return createElement('div', { className: 'simple' }, `Hello, ${props.name}!`)
}

function Wrapper(props) {
  return createElement(
    'div',
    { className: 'wrapper' },
    ...props.children
  )
}

function Badge(props) {
  return createElement('span', { className: 'badge' }, props.text)
}

function UserCard(props) {
  return createElement(
    'div',
    { className: 'user-card' },
    createElement('h2', null, props.name),
    createElement(Badge, { text: props.role })
  )
}

function Layout(props) {
  return createElement(
    'div',
    { className: 'layout' },
    createElement('header', null, props.title),
    createElement('main', null, ...props.children),
    createElement('footer', null, 'Footer')
  )
}

// ─── 测试用例 ────────────────────────────────────────────────

describe('Phase 4: 函数式组件', () => {
  // ── 4.1 基本渲染 ──

  describe('基本渲染', () => {
    it('应该正确渲染一个函数式组件', () => {
      const root = createRoot(container)
      const vnode = createElement(SimpleComponent, { name: 'World' })
      root.render(vnode)

      const div = container.querySelector('.simple')
      expect(div).not.toBeNull()
      expect(div.textContent).toBe('Hello, World!')
    })

    it('函数组件不应创建自身的 DOM 节点', () => {
      const root = createRoot(container)
      const vnode = createElement(SimpleComponent, { name: 'Test' })
      root.render(vnode)

      // container 的第一个子元素应该是 SimpleComponent 返回的 <div>
      // 而不是一个额外的包装节点
      expect(container.children.length).toBe(1)
      expect(container.children[0].className).toBe('simple')
    })
  })

  // ── 4.2 Props 传递 ──

  describe('Props 传递', () => {
    it('should pass props correctly to component function', () => {
      const root = createRoot(container)
      root.render(createElement(SimpleComponent, { name: 'Mini-React' }))

      expect(container.textContent).toContain('Hello, Mini-React!')
    })

    it('should handle components with no props', () => {
      function NoPropsComponent() {
        return createElement('p', null, 'No props needed')
      }

      const root = createRoot(container)
      root.render(createElement(NoPropsComponent))

      expect(container.textContent).toBe('No props needed')
    })

    it('should pass different prop types correctly', () => {
      function MultiPropComponent(props) {
        return createElement(
          'div',
          null,
          createElement('span', { id: 'name' }, props.name),
          createElement('span', { id: 'count' }, `${props.count}`),
          createElement('span', { id: 'active' }, props.active ? 'yes' : 'no')
        )
      }

      const root = createRoot(container)
      root.render(
        createElement(MultiPropComponent, {
          name: 'test',
          count: 42,
          active: true,
        })
      )

      expect(container.querySelector('#name').textContent).toBe('test')
      expect(container.querySelector('#count').textContent).toBe('42')
      expect(container.querySelector('#active').textContent).toBe('yes')
    })
  })

  // ── 4.3 Children Prop ──

  describe('children prop', () => {
    it('should pass children through props.children', () => {
      const root = createRoot(container)
      root.render(
        createElement(
          Wrapper,
          null,
          createElement('p', null, 'Child 1'),
          createElement('p', null, 'Child 2')
        )
      )

      const wrapper = container.querySelector('.wrapper')
      expect(wrapper).not.toBeNull()
      expect(wrapper.children.length).toBe(2)
      expect(wrapper.children[0].textContent).toBe('Child 1')
      expect(wrapper.children[1].textContent).toBe('Child 2')
    })

    it('should handle single child', () => {
      const root = createRoot(container)
      root.render(
        createElement(
          Wrapper,
          null,
          createElement('span', null, 'Only child')
        )
      )

      const wrapper = container.querySelector('.wrapper')
      expect(wrapper.children.length).toBe(1)
      expect(wrapper.textContent).toBe('Only child')
    })

    it('should handle text children', () => {
      function TextWrapper(props) {
        return createElement('div', { className: 'text-wrapper' }, ...props.children)
      }

      const root = createRoot(container)
      root.render(
        createElement(TextWrapper, null, 'Just text')
      )

      expect(container.querySelector('.text-wrapper').textContent).toBe('Just text')
    })
  })

  // ── 4.4 组件嵌套 ──

  describe('组件嵌套', () => {
    it('should render nested components (component using component)', () => {
      const root = createRoot(container)
      root.render(createElement(UserCard, { name: 'Alice', role: 'Admin' }))

      const card = container.querySelector('.user-card')
      expect(card).not.toBeNull()
      expect(card.querySelector('h2').textContent).toBe('Alice')

      const badge = card.querySelector('.badge')
      expect(badge).not.toBeNull()
      expect(badge.textContent).toBe('Admin')
    })

    it('should handle deeply nested components', () => {
      const root = createRoot(container)
      root.render(
        createElement(
          Layout,
          { title: 'My App' },
          createElement(UserCard, { name: 'Bob', role: 'User' }),
          createElement(SimpleComponent, { name: 'Deep' })
        )
      )

      // Layout > header
      const header = container.querySelector('header')
      expect(header.textContent).toBe('My App')

      // Layout > main > UserCard
      const card = container.querySelector('.user-card')
      expect(card).not.toBeNull()
      expect(card.querySelector('h2').textContent).toBe('Bob')
      expect(card.querySelector('.badge').textContent).toBe('User')

      // Layout > main > SimpleComponent
      const simple = container.querySelector('.simple')
      expect(simple.textContent).toBe('Hello, Deep!')

      // Layout > footer
      const footer = container.querySelector('footer')
      expect(footer.textContent).toBe('Footer')
    })
  })

  // ── 4.5 组件更新（Reconcile） ──

  describe('组件更新', () => {
    it('should update when props change', () => {
      const root = createRoot(container)

      // 首次渲染
      root.render(createElement(SimpleComponent, { name: 'V1' }))
      expect(container.textContent).toContain('Hello, V1!')

      // 更新 props
      root.render(createElement(SimpleComponent, { name: 'V2' }))
      expect(container.textContent).toContain('Hello, V2!')
    })

    it('should update nested components correctly', () => {
      const root = createRoot(container)

      root.render(createElement(UserCard, { name: 'Alice', role: 'Admin' }))
      expect(container.querySelector('h2').textContent).toBe('Alice')
      expect(container.querySelector('.badge').textContent).toBe('Admin')

      root.render(createElement(UserCard, { name: 'Bob', role: 'User' }))
      expect(container.querySelector('h2').textContent).toBe('Bob')
      expect(container.querySelector('.badge').textContent).toBe('User')
    })

    it('should replace component with different component', () => {
      function CompA() {
        return createElement('div', { id: 'comp-a' }, 'Component A')
      }
      function CompB() {
        return createElement('div', { id: 'comp-b' }, 'Component B')
      }

      const root = createRoot(container)

      root.render(createElement(CompA))
      expect(container.querySelector('#comp-a')).not.toBeNull()
      expect(container.querySelector('#comp-b')).toBeNull()

      root.render(createElement(CompB))
      expect(container.querySelector('#comp-a')).toBeNull()
      expect(container.querySelector('#comp-b')).not.toBeNull()
    })

    it('should replace component with native element', () => {
      const root = createRoot(container)

      root.render(createElement(SimpleComponent, { name: 'test' }))
      expect(container.querySelector('.simple')).not.toBeNull()

      root.render(createElement('div', { id: 'native' }, 'Native element'))
      expect(container.querySelector('.simple')).toBeNull()
      expect(container.querySelector('#native')).not.toBeNull()
    })

    it('should replace native element with component', () => {
      const root = createRoot(container)

      root.render(createElement('div', { id: 'native' }, 'Native element'))
      expect(container.querySelector('#native')).not.toBeNull()

      root.render(createElement(SimpleComponent, { name: 'replaced' }))
      expect(container.querySelector('#native')).toBeNull()
      expect(container.textContent).toContain('Hello, replaced!')
    })
  })

  // ── 4.6 组件卸载 ──

  describe('组件卸载', () => {
    it('should unmount component correctly', () => {
      const root = createRoot(container)
      root.render(createElement(SimpleComponent, { name: 'Bye' }))
      expect(container.children.length).toBe(1)

      root.unmount()
      expect(container.children.length).toBe(0)
    })

    it('should unmount nested components correctly', () => {
      const root = createRoot(container)
      root.render(
        createElement(
          Layout,
          { title: 'Test' },
          createElement(UserCard, { name: 'Alice', role: 'Admin' })
        )
      )
      expect(container.querySelector('.layout')).not.toBeNull()

      root.unmount()
      expect(container.children.length).toBe(0)
    })
  })

  // ── 4.7 边界场景 ──

  describe('边界场景', () => {
    it('should handle component mixed with native elements as siblings', () => {
      const root = createRoot(container)
      root.render(
        createElement(
          'div',
          null,
          createElement('p', null, 'Native 1'),
          createElement(SimpleComponent, { name: 'Middle' }),
          createElement('p', null, 'Native 2')
        )
      )

      const children = container.firstChild.children
      expect(children.length).toBe(3)
      expect(children[0].textContent).toBe('Native 1')
      expect(children[1].textContent).toBe('Hello, Middle!')
      expect(children[2].textContent).toBe('Native 2')
    })

    it('should handle component returning component (higher-order pattern)', () => {
      function Inner(props) {
        return createElement('span', null, `inner: ${props.value}`)
      }

      function Outer(props) {
        return createElement(Inner, { value: props.data })
      }

      const root = createRoot(container)
      root.render(createElement(Outer, { data: 'hello' }))

      expect(container.textContent).toBe('inner: hello')
    })
  })
})

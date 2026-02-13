/**
 * ============================================================
 * Mini-React: createElement
 * ============================================================
 *
 * 🎯 你的任务：实现 createElement 函数
 *
 * 这是 React 最基础的函数。JSX 本质上就是它的语法糖：
 *
 *   <div id="app">Hello</div>
 *       ↓ Babel 转译
 *   createElement('div', { id: 'app' }, 'Hello')
 *       ↓ 执行后返回
 *   { type: 'div', props: { id: 'app', children: [...] } }
 *
 * ============================================================
 * 规则：
 * 1. 返回一个 VNode 对象：{ type, props }
 * 2. children 应该放到 props.children 中
 * 3. 文本/数字类型的 children 需要包装为 TEXT_ELEMENT
 * 4. 过滤掉 null、undefined、boolean 类型的 children
 * ============================================================
 */

// 文本节点的特殊类型标识
export const TEXT_ELEMENT = 'TEXT_ELEMENT'

/**
 * 创建一个文本类型的 VNode
 *
 * 为什么需要这个？因为在 DOM 中，文本也是节点（Text Node），
 * 我们需要统一用 VNode 结构来表示它，方便后续的 Diff 和渲染。
 *
 * @param {string|number} text - 文本内容
 * @returns {{ type: string, props: { nodeValue: string|number, children: [] }}}
 *
 * 示例：
 *   createTextElement('Hello')
 *   → { type: 'TEXT_ELEMENT', props: { nodeValue: 'Hello', children: [] } }
 */
export function createTextElement(text) {
  return {
    type: TEXT_ELEMENT,
    props: {
      nodeValue: text,
      children: []
    }
  }
}

/**
 * 创建一个 VNode（虚拟 DOM 节点）
 *
 * @param {string|Function} type - 元素类型（'div'、'span'...）或组件函数
 * @param {Object|null} props - 属性对象
 * @param  {...any} children - 子节点（可以是 VNode、字符串、数字等）
 * @returns {{ type: string|Function, props: Object }}
 *
 * 示例：
 *   createElement('div', { id: 'app' }, 'Hello', createElement('span', null, 'World'))
 *   → {
 *       type: 'div',
 *       props: {
 *         id: 'app',
 *         children: [
 *           { type: 'TEXT_ELEMENT', props: { nodeValue: 'Hello', children: [] } },
 *           { type: 'span', props: { children: [
 *               { type: 'TEXT_ELEMENT', props: { nodeValue: 'World', children: [] } }
 *           ]}}
 *         ]
 *       }
 *     }
 */
export function createElement(type, props, ...children) {
  // TODO: 实现这个函数
  // 步骤：
  // 1. 处理 children：
  //    - 过滤掉 null、undefined、false、true（React 也是这么做的）
  //    - 把 string 和 number 类型的 child 包装为 createTextElement(child)
  //    - 其他类型（VNode 对象）保持原样
  // 2. 返回 VNode 对象：{ type, props: { ...props, children: 处理后的children } }
  //    - 注意：props 可能是 null，要处理这种情况 
  return {
    type,
    props: {
      ...props,
      children: children.map(child => {
        if(child === null || child === undefined || child === false || child === true) {
          return null
        }
        if(typeof child === 'string' || typeof child === 'number') {
          return createTextElement(child)
        }
        return child
      }).filter(child => child !== null)
    }
  }
}

/**
 * ============================================================
 * Mini-React: render
 * ============================================================
 *
 * 🎯 你的任务：实现 render 函数
 *
 * render 负责把 VNode 树转换为真实的 DOM 树，并挂载到容器中。
 *
 *   VNode                          Real DOM
 *   {                              <div id="app">
 *     type: 'div',          →        <h1>Hello</h1>
 *     props: {                       World
 *       id: 'app',                 </div>
 *       children: [...]
 *     }
 *   }
 *
 * ============================================================
 * 规则：
 * 1. TEXT_ELEMENT → document.createTextNode
 * 2. 其他类型 → document.createElement
 * 3. 遍历 props，设置 DOM 属性（跳过 children）
 * 4. 递归渲染子节点
 * 5. 挂载到父容器
 * ============================================================
 */

import { TEXT_ELEMENT } from './createElement.js'

/**
 * 将 VNode 渲染为真实 DOM 并挂载到容器中
 *
 * @param {Object} vnode - 虚拟 DOM 节点（createElement 的返回值）
 * @param {HTMLElement} container - 挂载目标容器
 *
 * 示例：
 *   render(
 *     createElement('div', { id: 'app' }, 'Hello'),
 *     document.getElementById('root')
 *   )
 *   // 结果：<div id="root"><div id="app">Hello</div></div>
 */
export function render(vnode, container) {
  // TODO: 实现这个函数
  // 步骤：
  //
  // 1. 创建 DOM 节点
  //    - 如果 vnode.type === TEXT_ELEMENT → document.createTextNode(vnode.props.nodeValue)
  //    - 否则 → document.createElement(vnode.type)
  //
  // 2. 设置属性（调用 updateProps）
  //
  // 3. 递归渲染子节点
  //    - 遍历 vnode.props.children
  //    - 对每个 child 递归调用 render(child, dom)
  //
  // 4. 挂载到容器
  //    - container.appendChild(dom)
  let dom
  if(vnode.type === TEXT_ELEMENT) {
      dom = document.createTextNode(vnode.props.nodeValue)
  }else{
      dom = document.createElement(vnode.type)
  }
  updateProps(dom, vnode.props) 
  vnode.props.children.forEach(child => render(child, dom))
  container.appendChild(dom)
}

/**
 * 将 VNode 的 props 设置到真实 DOM 节点上
 *
 * @param {HTMLElement} dom - 真实 DOM 节点
 * @param {Object} props - VNode 的 props
 *
 * 需要处理的情况：
 * - 跳过 children（不是 DOM 属性）
 * - className → dom.className = value（或使用 setAttribute('class', value)）
 * - style 对象 → 遍历并设置 dom.style[key] = value
 * - 事件属性（on 开头）→ Phase 7 再处理，现在可以先跳过
 * - 其他普通属性 → dom[key] = value 或 dom.setAttribute(key, value)
 */
function updateProps(dom, props) {
  // TODO: 实现这个函数
  // 步骤：
  //
  // 遍历 props 中的每个 key：
  //   1. 跳过 key === 'children'
  //   2. 如果 key === 'className' → dom.className = props[key]
  //   3. 如果 key === 'style' 且值是对象 → Object.assign(dom.style, props[key])
  //   4. 如果 key 以 'on' 开头 → 暂时用 dom.addEventListener 直接绑定
  //      （例如 onClick → dom.addEventListener('click', props[key])）
  //   5. 其他 → dom.setAttribute(key, props[key])
  //
  // 💡 提示：你也可以用 dom[key] = value 来设置属性，
  //    但 setAttribute 更通用，两种方式各有优劣，可以先用一种
  Object.keys(props).forEach(key => {
    if(key === 'children') return
    if(key === 'className') {
        dom.className = props[key]
    }else if(key === 'style') {
        Object.assign(dom.style, props[key])
    }else if(key.startsWith('on')) {
        dom.addEventListener(key.slice(2).toLowerCase(), props[key])
    }else{
        dom[key] = props[key]
    }
  })  
}
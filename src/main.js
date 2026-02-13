/**
 * Phase 1 Playground — 用纯 JS 调用 createElement + render
 *
 * 🎯 目标：不用 JSX，手动调用 createElement 来构建一个页面
 *
 * 当你实现完 createElement 和 render 后，运行 pnpm dev，
 * 打开浏览器应该能看到一个渲染出来的页面。
 */

import MiniReact from './mini-react/index.js'

const { createElement, render } = MiniReact

// ===== 用 createElement 手动构建 VNode 树 =====
// 等价的 JSX：
//
// <div id="app" style={{ padding: '2rem' }}>
//   <h1 className="title" style={{ color: '#7c5cff', marginBottom: '1rem' }}>
//     🔬 Mini-React Phase 1
//   </h1>
//   <p style={{ color: '#a0a0b0', lineHeight: '1.6' }}>
//     如果你能看到这段文字，说明 createElement 和 render 实现成功了！
//   </p>
//   <ul style={{ marginTop: '1rem', paddingLeft: '1.5rem' }}>
//     <li>✅ createElement 能创建 VNode</li>
//     <li>✅ render 能将 VNode 转为真实 DOM</li>
//     <li>✅ 属性（id, className, style）设置正确</li>
//     <li>✅ 嵌套子节点递归渲染正确</li>
//   </ul>
//   <div style={{ marginTop: '2rem', padding: '1rem', background: '#1a1a2e', borderRadius: '8px' }}>
//     <p style={{ color: '#5eead4' }}>
//       🎉 恭喜你完成了 Phase 1！
//     </p>
//   </div>
// </div>

const app = createElement(
  'div',
  { id: 'app', style: { padding: '2rem' } },
  createElement(
    'h1',
    { className: 'title', style: { color: '#7c5cff', marginBottom: '1rem' } },
    '🔬 Mini-React Phase 1'
  ),
  createElement(
    'p',
    { style: { color: '#a0a0b0', lineHeight: '1.6' } },
    '如果你能看到这段文字，说明 createElement 和 render 实现成功了！'
  ),
  createElement(
    'ul',
    { style: { marginTop: '1rem', paddingLeft: '1.5rem' } },
    createElement('li', null, '✅ createElement 能创建 VNode'),
    createElement('li', null, '✅ render 能将 VNode 转为真实 DOM'),
    createElement('li', null, '✅ 属性（id, className, style）设置正确'),
    createElement('li', null, '✅ 嵌套子节点递归渲染正确')
  ),
  createElement(
    'div',
    {
      style: {
        marginTop: '2rem',
        padding: '1rem',
        background: '#1a1a2e',
        borderRadius: '8px',
      },
    },
    createElement(
      'p',
      { style: { color: '#5eead4' } },
      '🎉 恭喜你完成了 Phase 1！'
    )
  )
)

// ===== 渲染到页面 =====
render(app, document.getElementById('root'))

// ===== 调试：在控制台查看 VNode 结构 =====
console.log('VNode 树结构：', JSON.stringify(app, null, 2))

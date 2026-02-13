/**
 * Phase 2 Playground — 用 JSX 语法调用 MiniReact
 *
 * 🎯 目标：验证 JSX 被正确转译为 MiniReact.createElement 调用
 *
 * Vite 会通过 esbuild 把 JSX 转译为：
 *   <div id="app"> → MiniReact.createElement('div', { id: 'app' })
 *
 * 配置在 vite.config.js 的 esbuild.jsxFactory 中
 */

import MiniReact from './mini-react/index.js'

// ===== 现在可以用 JSX 了！ =====
// 对比 Phase 1 的手动 createElement 调用，JSX 多么优雅：

const app = (
  <div id="app" style={{ padding: '2rem' }}>
    <h1 className="title" style={{ color: '#7c5cff', marginBottom: '1rem' }}>
      🔬 Mini-React Phase 2
    </h1>
    <p style={{ color: '#a0a0b0', lineHeight: '1.6' }}>
      如果你能看到这段文字，说明 JSX 转译配置成功了！
    </p>
    <ul style={{ marginTop: '1rem', paddingLeft: '1.5rem', color: '#e0e0e0' }}>
      <li>✅ JSX 被转译为 MiniReact.createElement 调用</li>
      <li>✅ 嵌套 JSX 正确处理</li>
      <li>✅ 属性（id, className, style）传递正确</li>
      <li>✅ 表达式插值正常工作：1 + 1 = {1 + 1}</li>
    </ul>
    <div
      style={{
        marginTop: '2rem',
        padding: '1rem',
        background: '#1a1a2e',
        borderRadius: '8px',
      }}
    >
      <p style={{ color: '#5eead4' }}>
        🎉 Phase 2 完成！JSX 只是语法糖，底层还是 createElement。
      </p>
    </div>
  </div>
)

MiniReact.render(app, document.getElementById('root'))

// 打开浏览器控制台，看看 VNode 结构 — 和 Phase 1 手写的一模一样
console.log('JSX 生成的 VNode 树：', JSON.stringify(app, null, 2))

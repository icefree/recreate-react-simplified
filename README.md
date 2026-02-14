# 🔬 Mini-React: Recreating React from Scratch

> 从零实现一个简化版 React 框架，深入理解 React 核心原理。

## 📖 项目简介

本项目通过**逐步实现（Phase-by-Phase）**的方式，从零构建一个 Mini-React，涵盖：

- Virtual DOM（`createElement` + `render`）
- JSX 转译支持
- Reconciliation（Diffing 算法 + key 机制）
- 函数式组件
- Hooks（`useState`、`useEffect`、`useRef`、`useReducer`）
- 两阶段模型（Render Phase + Commit Phase）

每个阶段都有独立的测试用例和 Playground 演示，你可以通过 git 历史**逐步回溯**，跟随每一步的思路亲手实现。

---

## 🛠️ 技术栈

| 工具           | 版本 | 用途                             |
| -------------- | ---- | -------------------------------- |
| **Node.js**    | v24+ | 运行环境                         |
| **pnpm**       | v10+ | 包管理器                         |
| **Vite**       | v7   | 构建工具 + 开发服务器            |
| **Vitest**     | v4   | 单元测试框架                     |
| **Vanilla JS** | —    | 核心实现（不依赖任何第三方框架） |

---

## 📂 项目结构

```
recreate-react-simplified/
├── PLAN.md                        # 📋 详细实现计划（Phase 1-11）
├── index.html                     # 入口 HTML
├── vite.config.js                 # Vite 配置（JSX pragma）
├── package.json
│
├── src/
│   ├── mini-react/                # 🔧 核心库
│   │   ├── createElement.js       # Phase 1: 创建虚拟 DOM
│   │   ├── render.js              # Phase 1: 渲染到真实 DOM
│   │   ├── root.js                # Phase 3: createRoot API
│   │   ├── reconciler.js          # Phase 3: Diff & Patch + 两阶段模型
│   │   ├── component.js           # Phase 4: 函数式组件运行时
│   │   ├── hooks.js               # Phase 5-6: Hooks 系统
│   │   └── index.js               # 统一导出
│   │
│   ├── playground/                # 🎮 每阶段的演示应用
│   │   ├── phase3.jsx
│   │   ├── phase4.jsx
│   │   ├── phase5.jsx
│   │   └── phase6.jsx
│   │
│   ├── main.js                    # Phase 1 入口（纯 JS）
│   └── main.jsx                   # Phase 2+ 入口（JSX）
│
├── tests/                         # 🧪 单元测试（87 个用例）
│   ├── createElement.test.js      # 10 tests
│   ├── render.test.js             # 8 tests
│   ├── reconciler.test.js         # 22 tests
│   ├── component.test.js          # 19 tests
│   ├── hooks.test.js              # 10 tests
│   └── useEffect.test.js          # 18 tests
│
├── docs/                          # 📖 学习资料
│   └── useState-flow.excalidraw   # useState 流程图
│
└── scripts/
    └── gen-excalidraw.cjs         # Excalidraw 生成脚本
```

---

## 🚀 快速开始

### 环境准备

```bash
# 确保已安装 Node.js (v18+) 和 pnpm
node -v   # v24.10.0+
pnpm -v   # v10.28.0+
```

### 克隆 & 安装

```bash
git clone <repo-url> recreate-react-simplified
cd recreate-react-simplified
pnpm install
```

### 常用命令

```bash
# 启动开发服务器（查看 Playground 演示）
pnpm dev

# 运行全部测试
pnpm test

# 监听模式运行测试（开发时推荐）
pnpm test:watch
```

---

## 🗺️ 阶段一览 & 复现指南

本项目通过 **Git 提交历史**记录了每个阶段的完整演进过程。你可以通过 `git log` 和 `git checkout` 命令回溯到任意阶段，从 TODO 骨架开始亲手实现。

### 查看完整的 git 历史

```bash
git log --oneline --all
```

### Git 提交历史（从早到新）

| Commit    | 描述                                                     | 阶段    |
| --------- | -------------------------------------------------------- | ------- |
| `158b848` | 📋 添加详细实现计划 PLAN.md                              | 准备    |
| `fe27d4b` | 🏗️ Phase 1 骨架 — createElement & render（含 TODO）      | Phase 1 |
| `fefc69a` | ✅ Phase 1 实现 — 18 个测试通过                          | Phase 1 |
| `492ceda` | ✅ Phase 2 — JSX 支持配置完成                            | Phase 2 |
| `259e7df` | 🏗️ Phase 3 骨架 — reconciler/root（含 TODO）             | Phase 3 |
| `24afc84` | ✅ Phase 3 — Reconciliation 初版                         | Phase 3 |
| `2fa9f2e` | ✅ Phase 3 完整实现 — 36 个测试通过                      | Phase 3 |
| `44ab371` | 🏗️ Phase 4 骨架 — 函数式组件（含 TODO）                  | Phase 4 |
| `0e292bd` | ✅ Phase 4 实现 — 函数式组件支持                         | Phase 4 |
| `257bbd4` | 🏗️ Phase 5 骨架 — useState（含 TODO）                    | Phase 5 |
| `d49849d` | 🏗️ Phase 6 骨架 — useEffect/useRef/useReducer（含 TODO） | Phase 6 |
| `b632a13` | ✅ Phase 6 实现 — 副作用管理                             | Phase 6 |
| `8d8236f` | 🔄 重构 — 拆分为两阶段模型（Render + Commit）            | 进阶    |

> 💡 **标有 🏗️ 的是骨架提交**：代码中包含 `// TODO:` 注释，留给你亲手实现核心逻辑。

---

## 📚 逐阶段复现步骤

### 总体思路

每个阶段的工作流一致：

1. **切换到骨架 commit** — 查看带有 TODO 标记的代码
2. **阅读 PLAN.md 中对应的阶段说明** — 理解需要做什么
3. **运行测试** — 观察当前有哪些测试失败
4. **实现 TODO** — 根据计划和测试要求填充代码
5. **验证通过** — 确保所有测试通过 + Playground 页面正常
6. **对比参考实现** — 切换到完成 commit，看看你的实现和参考有什么差异

---

### Phase 1：Virtual DOM — `createElement` & `render`

🎯 **目标**：理解 Virtual DOM 的本质——JSX 是 `createElement()` 的语法糖，`render()` 负责把 VNode 对象变成真实 DOM。

```bash
# 1. 切换到 Phase 1 骨架
git checkout fe27d4b

# 2. 查看需要实现的文件
cat src/mini-react/createElement.js   # 包含 TODO
cat src/mini-react/render.js           # 包含 TODO

# 3. 运行测试，观察失败
pnpm test

# 4. ✍️ 开始实现！参考 PLAN.md Phase 1 部分

# 5. 实现完成后验证
pnpm test                    # 应该 18 个测试全部通过
pnpm dev                     # 打开浏览器查看 Phase 1 Playground

# 6. 对比参考实现
git diff fe27d4b..fefc69a -- src/mini-react/
```

**关键实现点：**

- `createElement(type, props, ...children)` → 返回 VNode 对象
- `render(vnode, container)` → 递归创建真实 DOM
- 处理 `TEXT_ELEMENT`、`null/undefined/boolean` children

---

### Phase 2：JSX 支持

🎯 **目标**：配置 Vite，让 JSX 调用我们自己的 `createElement`。

```bash
# 1. 切换到 Phase 2
git checkout 492ceda

# 2. 查看 Vite 配置
cat vite.config.js

# 3. 查看 JSX 入口
cat src/main.jsx

# 4. 启动开发服务器验证
pnpm dev
```

**关键实现点：**

- `vite.config.js` 中配置 `jsxFactory` 和 `jsxFragment`
- 理解 JSX → `createElement` 调用的转译过程

---

### Phase 3：Reconciliation（协调/Diffing）

🎯 **目标**：理解 React 如何高效更新 DOM——通过对比新旧 VNode 树，只更新变化的部分。

```bash
# 1. 切换到 Phase 3 骨架
git checkout 259e7df

# 2. 查看需要实现的文件
cat src/mini-react/reconciler.js   # 大量 TODO
cat src/mini-react/root.js         # createRoot API

# 3. 运行测试，观察失败
pnpm test

# 4. ✍️ 实现 reconcile、mountVNode、updateProps、reconcileChildren

# 5. 验证
pnpm test                          # 22 个 reconciler 测试全部通过
pnpm dev                           # 查看 Phase 3 Playground（动态更新演示）

# 6. 对比参考实现
git diff 259e7df..2fa9f2e -- src/mini-react/
```

**关键实现点：**

- `reconcile(parentDom, oldVNode, newVNode)` — 核心 Diff 逻辑
- `mountVNode(vnode)` — 创建新 DOM
- `updateProps(dom, oldProps, newProps)` — 属性更新
- `reconcileChildren()` — 子节点协调（含 key 机制）
- `createRoot()` — Root 生命周期 API

---

### Phase 4：函数式组件

🎯 **目标**：理解组件的本质——函数式组件就是一个接收 props、返回 VNode 的函数。

```bash
# 1. 切换到 Phase 4 骨架
git checkout 44ab371

# 2. 查看需要实现的文件
cat src/mini-react/component.js    # 函数组件运行时
cat src/mini-react/reconciler.js   # 需要处理 function type

# 3. 运行测试
pnpm test

# 4. ✍️ 实现函数式组件的渲染和协调逻辑

# 5. 验证
pnpm test                          # 19 个 component 测试全部通过

# 6. 对比参考实现
git diff 44ab371..0e292bd -- src/mini-react/
```

**关键实现点：**

- 在 `reconcile` 中识别 `typeof type === 'function'`
- Props 传递（含 `children`）
- 组件嵌套

---

### Phase 5：`useState` Hook

🎯 **目标**：理解 Hooks 的核心奥秘——为什么依赖调用顺序？为什么不能在条件语句中使用？

```bash
# 1. 切换到 Phase 5 骨架
git checkout 257bbd4

# 2. 查看需要实现的文件
cat src/mini-react/hooks.js        # useState TODO

# 3. 运行测试
pnpm test

# 4. ✍️ 实现 useState、scheduleRerender、flushUpdates

# 5. 验证
pnpm test                          # 10 个 hooks 测试全部通过
pnpm dev                           # 查看 Phase 5 Playground（Counter + Todo）

# 6. 对比参考实现（Phase 5 的完成合入在 Phase 6 中）
git diff 257bbd4..b632a13 -- src/mini-react/hooks.js
```

**关键实现点：**

- Hook 状态存储在组件实例的 `__hooks` 数组中
- `hookIndex` 作为隐式 ID（解释了为什么调用顺序必须一致）
- `scheduleRerender` + `queueMicrotask` 实现批量更新

---

### Phase 6：`useEffect` / `useRef` / `useReducer`

🎯 **目标**：理解副作用管理、持久化引用和状态管理的进阶模式。

```bash
# 1. 切换到 Phase 6 骨架
git checkout d49849d

# 2. 查看需要实现的文件
cat src/mini-react/hooks.js        # useEffect / useRef / useReducer TODO

# 3. 运行测试
pnpm test

# 4. ✍️ 实现 useEffect、useRef、useReducer

# 5. 验证
pnpm test                          # 全部 87 个测试通过
pnpm dev                           # 查看 Phase 6 Playground

# 6. 对比参考实现
git diff d49849d..b632a13 -- src/mini-react/hooks.js
```

**关键实现点：**

- `useEffect(callback, deps)` — 依赖数组对比 + cleanup 执行时机
- `useRef(initialValue)` — 跨渲染持久化的可变容器
- `useReducer(reducer, initialArg, init)` — `useState` 的泛化版本

---

### 进阶：两阶段模型（Render + Commit）

🎯 **目标**：理解 React 的两阶段模型——Render Phase 收集变更，Commit Phase 统一应用到 DOM。

```bash
# 查看最新的 main 分支（包含两阶段重构）
git checkout main

# 查看 reconciler.js 中的两阶段模型
cat src/mini-react/reconciler.js

# commitRoot 目前是一个 TODO，等待你来实现！
```

---

## 🔄 常用 Git 操作

### 回到最新状态

```bash
git checkout main
```

### 查看某次提交做了什么

```bash
git show <commit-hash>

# 例如：查看 Phase 1 实现了什么
git show fefc69a
```

### 对比两个版本的差异

```bash
git diff <骨架commit>..<完成commit> -- src/mini-react/

# 例如：对比 Phase 3 骨架与完成版
git diff 259e7df..2fa9f2e -- src/mini-react/
```

### 从某个阶段创建自己的分支

```bash
# 在骨架 commit 上创建新分支，自己动手实现
git checkout -b my-phase3 259e7df

# 实现完成后提交
git add -A
git commit -m "feat: my Phase 3 implementation"

# 回到主线查看参考实现
git checkout main
```

### 只查看某个文件的变更历史

```bash
git log --oneline -- src/mini-react/reconciler.js
```

---

## ✅ 测试

```bash
# 运行全部 87 个测试
pnpm test

# 监听模式（文件变更自动重新运行）
pnpm test:watch

# 只运行特定测试文件
pnpm vitest run tests/reconciler.test.js
```

### 测试覆盖

| 测试文件                | 用例数 | 覆盖的阶段 |
| ----------------------- | ------ | ---------- |
| `createElement.test.js` | 10     | Phase 1    |
| `render.test.js`        | 8      | Phase 1    |
| `reconciler.test.js`    | 22     | Phase 3    |
| `component.test.js`     | 19     | Phase 4    |
| `hooks.test.js`         | 10     | Phase 5    |
| `useEffect.test.js`     | 18     | Phase 6    |

---

## 📋 路线图

- [x] Phase 1 — Virtual DOM（`createElement` + `render`）
- [x] Phase 2 — JSX 支持
- [x] Phase 3 — Reconciliation（Diffing + Key）
- [x] Phase 4 — 函数式组件
- [x] Phase 5 — `useState` Hook
- [x] Phase 6 — `useEffect` / `useRef` / `useReducer`
- [ ] Phase 7 — 事件委托系统
- [ ] Phase 7b — Context API + `useMemo` / `useCallback` / `React.memo`
- [ ] Phase 8 — Fiber 架构（进阶）
- [ ] Phase 9 — Fiber 源码级理解
- [ ] Phase 10 — 三层架构（React → Reconciler → Renderer）
- [ ] Phase 11 — Concurrent Mode（并发模式）

---

## 📚 推荐阅读

- [PLAN.md](./PLAN.md) — 本项目的详细实现计划（包含所有阶段的代码思路和 React 源码参考链接）
- [Build your own React](https://pomb.us/build-your-own-react/) — Rodrigo Pombo 的经典教程
- [React Source Code (GitHub)](https://github.com/facebook/react) — React 官方源码
- [React Internals Deep Dive](https://jser.dev/series/react-source-code-walkthrough) — React 源码深度解析

---

## License

MIT

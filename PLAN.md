# 🔬 Mini-React：从零实现简易 React 框架

## 项目目标

通过亲手实现一个简化版 React，深入理解以下核心概念：

- Virtual DOM 的本质与工作原理
- Reconciliation（协调/Diffing）算法
- 函数式组件模型
- Hooks 的实现机制（useState、useEffect）
- 事件系统
- Fiber 架构（进阶）

---

## 技术栈

| 工具           | 用途                       |
| -------------- | -------------------------- |
| **Vite**       | 构建工具 + 开发服务器      |
| **Vitest**     | 单元测试                   |
| **Babel**      | JSX 转译（自定义 pragma）  |
| **Vanilla JS** | 核心实现（不依赖任何框架） |

---

## 项目结构

```
recreate-react-simplified/
├── package.json
├── vite.config.js
├── index.html
├── src/
│   ├── mini-react/              # 🔧 核心库（逐阶段构建）
│   │   ├── createElement.js     # Phase 1: 创建虚拟 DOM
│   │   ├── render.js            # Phase 1: 渲染到真实 DOM
│   │   ├── reconciler.js        # Phase 3: Diff & Patch
│   │   ├── component.js         # Phase 4: 函数式组件支持
│   │   ├── hooks.js             # Phase 5-6: useState & useEffect
│   │   ├── events.js            # Phase 7: 事件系统
│   │   ├── fiber.js             # Phase 8: Fiber 架构
│   │   └── index.js             # 统一导出
│   ├── playground/              # 🎮 每个阶段的演示应用
│   │   ├── phase1.js
│   │   ├── phase2.jsx
│   │   ├── phase3.jsx
│   │   ├── phase4.jsx
│   │   ├── phase5.jsx
│   │   ├── phase6.jsx
│   │   ├── phase7.jsx
│   │   └── phase8.jsx
│   └── main.jsx                 # 入口文件
├── tests/                       # 🧪 单元测试
│   ├── createElement.test.js
│   ├── render.test.js
│   ├── reconciler.test.js
│   └── hooks.test.js
└── docs/                        # 📖 学习笔记（你自己写）
```

---

## Phase 1：Virtual DOM — `createElement` & `render`

### 🎯 学习目标

理解 React 最核心的抽象 —— **Virtual DOM**（虚拟 DOM）。
JSX 本质上是 `createElement()` 的语法糖，返回的是普通 JS 对象（VNode），
而 `render()` 负责把这些对象变成真实的 DOM 节点。

### 📚 核心概念

```
JSX:       <div id="app">Hello</div>
    ↓ Babel 转译
JS:        createElement('div', { id: 'app' }, 'Hello')
    ↓ 执行
VNode:     { type: 'div', props: { id: 'app', children: ['Hello'] } }
    ↓ render()
Real DOM:  document.createElement('div') → ...
```

### 📋 实现任务

#### 1.1 `createElement(type, props, ...children)`

```js
// 输入
createElement('div', { id: 'app' },
  createElement('h1', null, 'Hello'),
  'World'
)

// 输出 VNode
{
  type: 'div',
  props: {
    id: 'app',
    children: [
      { type: 'h1', props: { children: ['Hello'] } },
      'World'    // 文本节点
    ]
  }
}
```

**要点：**

- 将 `children` 合并到 `props` 中
- 处理 `null`/`undefined`/`boolean` children（过滤掉）
- 文本节点创建为特殊类型 `TEXT_ELEMENT`：`{ type: 'TEXT_ELEMENT', props: { nodeValue: 'Hello', children: [] } }`

#### 1.2 `render(vnode, container)`

```js
render(
  createElement("div", { id: "app" }, "Hello"),
  document.getElementById("root"),
);
```

**要点：**

- 根据 `type` 创建 DOM 元素（`document.createElement`）
- 文本节点用 `document.createTextNode`
- 遍历 `props`，设置 DOM 属性（排除 `children`）
- 递归渲染子节点
- 将创建的 DOM 挂载到 `container`

### ✅ 验证标准

- [ ] `createElement` 返回正确的 VNode 结构
- [ ] `render` 能将 VNode 树渲染为真实 DOM
- [ ] 支持嵌套元素、文本节点、属性设置
- [ ] 写一个 Playground：用纯 JS 调用 `createElement` 渲染一个简单页面

### 🔗 React 源码参考

- [`react/src/ReactElement.js`](https://github.com/facebook/react/blob/main/packages/react/src/ReactElement.js) — createElement 的实现
- [`react-dom/src/client/ReactDOMComponent.js`](https://github.com/facebook/react/blob/main/packages/react-dom-bindings/src/client/ReactDOMComponent.js) — DOM 属性处理

---

## Phase 2：JSX 支持

### 🎯 学习目标

理解 JSX 不是模板语言，而是 **`createElement` 的语法糖**。
通过配置 Babel，让 JSX 调用我们自己的 `createElement`。

### 📋 实现任务

#### 2.1 配置 Vite + Babel

```js
// vite.config.js
export default defineConfig({
  esbuild: {
    jsxFactory: "MiniReact.createElement",
    jsxFragment: "MiniReact.Fragment",
  },
});
```

#### 2.2 Fragment 支持

```js
// 实现 Fragment — 一个不会创建额外 DOM 节点的容器
const Fragment = Symbol("Fragment");
```

#### 2.3 编写 JSX Demo

```jsx
import MiniReact from "./mini-react";

const app = (
  <div id="app">
    <h1 className="title">Hello Mini-React!</h1>
    <p>This is rendered with our own createElement</p>
    <>
      <span>Fragment child 1</span>
      <span>Fragment child 2</span>
    </>
  </div>
);

MiniReact.render(app, document.getElementById("root"));
```

### ✅ 验证标准

- [ ] JSX 代码被正确转译为 `MiniReact.createElement` 调用
- [ ] `className` → `class`、`htmlFor` → `for` 等属性映射正确
- [ ] Fragment 正常工作
- [ ] 在浏览器中能看到正确渲染的页面

---

## Phase 3：Reconciliation（协调/Diffing）

### 🎯 学习目标

理解 React 如何**高效更新 DOM** —— 不是每次都重建整个 DOM 树，
而是通过对比新旧 VNode 树（Diffing），只更新变化的部分。

### 📚 核心概念

React 的 Diff 策略基于三个假设：

1. **不同类型的元素产生不同的树** — 类型变了就整棵替换
2. **同层级比较** — 不跨层级移动节点
3. **key 标识同类元素** — 用 key 区分列表项

### 📋 实现任务

#### 3.1 改造 `render` 函数

```js
// 之前：每次 render 都是全量创建
// 之后：保存上一次的 VNode，进行 Diff

let prevVNode = null;

function render(vnode, container) {
  reconcile(container, prevVNode, vnode);
  prevVNode = vnode;
}
```

#### 3.2 实现 `reconcile(parentDom, oldVNode, newVNode)`

处理以下情况：

| 场景              | 处理方式                  |
| ----------------- | ------------------------- |
| `oldVNode` 不存在 | 创建新 DOM 节点           |
| `newVNode` 不存在 | 删除旧 DOM 节点           |
| 类型不同          | 替换整个节点              |
| 类型相同（元素）  | 更新属性 + 递归协调子节点 |
| 类型相同（文本）  | 更新 `nodeValue`          |

#### 3.3 实现 `updateProps(dom, oldProps, newProps)`

```js
function updateProps(dom, oldProps, newProps) {
  // 1. 删除旧属性中不存在于新属性的
  // 2. 添加/更新新属性
  // 3. 特殊处理 style、className 等
}
```

#### 3.4 实现子节点协调（简化版，暂不含 key）

```js
function reconcileChildren(parentDom, oldChildren, newChildren) {
  const maxLen = Math.max(oldChildren.length, newChildren.length);
  for (let i = 0; i < maxLen; i++) {
    reconcile(parentDom, oldChildren[i], newChildren[i]);
  }
}
```

### ✅ 验证标准

- [ ] 修改属性时只更新变化的 prop，不重建 DOM
- [ ] 添加/删除子节点正确
- [ ] 节点类型变化时正确替换
- [ ] 写一个 Demo：点按钮切换不同 VNode 树，观察 DOM 更新（用 DevTools 验证）

### 🔗 React 源码参考

- [`react-reconciler/src/ReactChildFiber.js`](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactChildFiber.js) — 子节点协调

---

## Phase 4：函数式组件

### 🎯 学习目标

理解 React 组件的本质 —— **函数式组件就是一个接收 props、返回 VNode 的函数**。

### 📚 核心概念

```jsx
// 组件就是一个函数
function Welcome(props) {
  return <h1>Hello, {props.name}</h1>;
}

// JSX 中使用组件
<Welcome name="Mini-React" />;

// 转译后
createElement(Welcome, { name: "Mini-React" });
// type 不是字符串，而是函数引用
```

### 📋 实现任务

#### 4.1 在 `reconcile` 中处理函数类型

```js
function reconcile(parentDom, oldVNode, newVNode) {
  if (typeof newVNode.type === "function") {
    // 调用函数，得到 VNode 子树
    const childVNode = newVNode.type(newVNode.props);
    // 递归协调
    reconcile(parentDom, oldVNode?.__childVNode, childVNode);
    newVNode.__childVNode = childVNode;
  } else {
    // 原有的元素节点处理逻辑
  }
}
```

#### 4.2 Props 传递

```jsx
function App() {
  return (
    <div>
      <Header title="My App" />
      <Content>
        <p>Nested children</p>
      </Content>
    </div>
  );
}
```

**要点：**

- `children` 也是 props 的一部分
- 组件可以嵌套组件

### ✅ 验证标准

- [ ] 函数式组件正确渲染
- [ ] Props 正确传递
- [ ] `children` prop 正确传递
- [ ] 组件可以嵌套使用
- [ ] 写一个 Demo：用多个组件组合一个完整页面

---

## Phase 5：`useState` Hook

### 🎯 学习目标

这是最关键的阶段！理解 Hooks 的工作原理 ——
**为什么 Hooks 依赖调用顺序？为什么不能在条件语句中使用？**

### 📚 核心概念

```
组件状态存储在哪里？不在组件函数内部，而在框架维护的全局数组中。

每次组件渲染时：
1. 重置 hook 索引为 0
2. 每调用一次 useState，返回数组中对应位置的状态
3. 索引递增

这就是为什么 Hook 调用顺序必须一致 —— 顺序就是它的 "ID"
```

### 📋 实现任务

#### 5.1 Hook 状态存储

```js
// 全局状态
let currentComponent = null; // 当前正在渲染的组件
let hookIndex = 0; // 当前 hook 索引

// 每个组件实例有自己的 hooks 数组
// component.__hooks = []
```

#### 5.2 实现 `useState`

```js
function useState(initialValue) {
  const component = currentComponent;
  const idx = hookIndex++;

  // 首次渲染：初始化
  if (component.__hooks[idx] === undefined) {
    component.__hooks[idx] = initialValue;
  }

  // setState：更新值 + 触发重新渲染
  const setState = (newValue) => {
    // 支持函数式更新
    if (typeof newValue === "function") {
      component.__hooks[idx] = newValue(component.__hooks[idx]);
    } else {
      component.__hooks[idx] = newValue;
    }
    // 触发重新渲染
    scheduleRerender(component);
  };

  return [component.__hooks[idx], setState];
}
```

#### 5.3 实现重新渲染机制

```js
function scheduleRerender(component) {
  // 使用 requestAnimationFrame 或 queueMicrotask 批处理更新
  queueMicrotask(() => {
    renderComponent(component);
  });
}
```

#### 5.4 改造组件渲染流程

```js
function renderComponent(component) {
  // 1. 设置当前组件上下文
  currentComponent = component;
  hookIndex = 0;

  // 2. 调用组件函数获取新 VNode
  const newVNode = component.type(component.props);

  // 3. 协调更新
  reconcile(component.__parentDom, component.__prevVNode, newVNode);
  component.__prevVNode = newVNode;

  // 4. 清理上下文
  currentComponent = null;
}
```

### ✅ 验证标准

- [ ] `useState` 正确返回 `[state, setState]`
- [ ] `setState` 触发组件重新渲染
- [ ] 函数式更新 `setState(prev => prev + 1)` 正确工作
- [ ] 多个 `useState` 在同一组件中正确独立工作
- [ ] Demo 1：计数器（Counter）
- [ ] Demo 2：Todo List（添加/删除）

### 🔗 React 源码参考

- [`react-reconciler/src/ReactFiberHooks.js`](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberHooks.js) — Hooks 的核心实现

---

## Phase 6：`useEffect` Hook

### 🎯 学习目标

理解副作用管理：**为什么 useEffect 在渲染后执行？清理函数何时运行？依赖数组如何工作？**

### 📚 核心概念

```
useEffect 的执行时机：
1. 组件渲染完成（DOM 已更新）
2. 对比依赖数组是否变化
3. 如果变化了 → 先执行上次的 cleanup，再执行新的 effect
4. 组件卸载时 → 执行最后的 cleanup

依赖数组比较策略：Object.is 浅比较
```

### 📋 实现任务

#### 6.1 实现 `useEffect`

```js
function useEffect(callback, deps) {
  const component = currentComponent;
  const idx = hookIndex++;

  const oldHook = component.__hooks[idx];
  const hasChanged = oldHook
    ? !deps || deps.some((dep, i) => !Object.is(dep, oldHook.deps[i]))
    : true; // 首次渲染总是执行

  if (hasChanged) {
    component.__hooks[idx] = { deps, cleanup: oldHook?.cleanup };

    // 在 DOM 更新后异步执行 effect
    queueMicrotask(() => {
      // 先执行上次的 cleanup
      if (oldHook?.cleanup) oldHook.cleanup();
      // 执行 effect，保存返回的 cleanup
      const cleanup = callback();
      component.__hooks[idx].cleanup = cleanup;
    });
  } else {
    component.__hooks[idx] = oldHook;
  }
}
```

#### 6.2 组件卸载时的清理

```js
// 在 reconcile 中，当组件被移除时
function unmountComponent(component) {
  // 执行所有 effect 的 cleanup
  component.__hooks.forEach((hook) => {
    if (hook?.cleanup) hook.cleanup();
  });
}
```

### ✅ 验证标准

- [ ] 空依赖 `useEffect(() => {}, [])` 只在挂载时执行一次
- [ ] 无依赖 `useEffect(() => {})` 每次渲染后都执行
- [ ] 依赖变化时正确触发
- [ ] cleanup 函数正确执行
- [ ] Demo 1：自动计时器（setInterval + cleanup）
- [ ] Demo 2：模拟数据请求（切换 ID 时取消上次请求）

---

## Phase 7：事件系统

### 🎯 学习目标

理解 React 的事件委托机制：**为什么 React 不直接在元素上绑定事件？Synthetic Event 是什么？**

### 📚 核心概念

```
React 事件系统的关键设计：
1. 事件委托：所有事件监听器绑定在 root 容器上，而非各个元素
2. 合成事件：对原生事件进行包装，抹平浏览器差异
3. 事件池化：复用事件对象以减少 GC 压力（React 17 已移除）

好处：
- 减少内存占用（监听器数量大幅减少）
- 动态添加/删除元素无需额外管理事件监听
- 统一的事件行为
```

### 📋 实现任务

#### 7.1 事件属性识别

```js
function isEventProp(name) {
  return name.startsWith("on");
}

function getEventName(propName) {
  return propName.slice(2).toLowerCase(); // onClick → click
}
```

#### 7.2 事件委托

```js
function setupEventDelegation(rootContainer) {
  const eventTypes = ["click", "input", "change", "submit", "keydown", "keyup"];

  eventTypes.forEach((eventType) => {
    rootContainer.addEventListener(eventType, (nativeEvent) => {
      // 从事件目标向上遍历 DOM 树，找到对应的事件处理器
      let target = nativeEvent.target;
      while (target && target !== rootContainer) {
        const handler = target.__eventHandlers?.[eventType];
        if (handler) {
          handler(nativeEvent); // 简化版直接传原生事件
        }
        target = target.parentNode;
      }
    });
  });
}
```

#### 7.3 在 render 中注册事件

```js
// 在 updateProps 中
if (isEventProp(propName)) {
  const eventName = getEventName(propName);
  dom.__eventHandlers = dom.__eventHandlers || {};
  dom.__eventHandlers[eventName] = propValue;
}
```

### ✅ 验证标准

- [ ] `onClick`、`onChange`、`onInput` 等事件正确触发
- [ ] 事件冒泡行为正确
- [ ] 事件处理器更新时正确替换
- [ ] Demo：完整的交互式表单（输入框 + 按钮 + 表单提交）

---

## Phase 8（进阶/可选）：Fiber 架构

### 🎯 学习目标

理解 React 16+ 的核心架构改变：**为什么需要 Fiber？什么是可中断渲染？**

### 📚 核心概念

```
传统递归渲染的问题：
- 同步、不可中断
- 大组件树渲染时会阻塞主线程 → 页面卡顿

Fiber 解决方案：
- 将渲染拆分为多个小单元（Unit of Work）
- 每个 Fiber 节点是一个工作单元
- 使用 requestIdleCallback（或类似机制）在浏览器空闲时执行
- 可以随时暂停、恢复、甚至丢弃正在进行的工作

Fiber 节点结构：
{
  type,          // 元素类型
  props,         // 属性
  dom,           // 对应的真实 DOM 节点
  parent,        // 父 Fiber
  child,         // 第一个子 Fiber
  sibling,       // 下一个兄弟 Fiber
  alternate,     // 上一次渲染的对应 Fiber（用于 Diff）
  effectTag,     // 标记操作类型：PLACEMENT / UPDATE / DELETION
  hooks,         // Hook 状态
}
```

### 📋 实现任务

#### 8.1 Fiber 数据结构

```js
function createFiber(vnode, parent) {
  return {
    type: vnode.type,
    props: vnode.props,
    dom: null,
    parent,
    child: null,
    sibling: null,
    alternate: null,
    effectTag: null,
    hooks: [],
  };
}
```

#### 8.2 工作循环（Work Loop）

```js
let nextUnitOfWork = null;
let wipRoot = null; // Work In Progress Root
let currentRoot = null; // 当前已提交的 Fiber 树
let deletions = []; // 待删除的 Fiber

function workLoop(deadline) {
  let shouldYield = false;

  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1; // 浏览器需要控制权了
  }

  // 所有工作完成，一次性提交到 DOM
  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }

  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);
```

#### 8.3 执行单个工作单元

```js
function performUnitOfWork(fiber) {
  // 1. 创建 DOM（如果还没有）
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  // 2. 协调子节点 → 创建子 Fiber
  reconcileChildren(fiber, fiber.props.children);

  // 3. 返回下一个工作单元（深度优先遍历）
  if (fiber.child) return fiber.child;

  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) return nextFiber.sibling;
    nextFiber = nextFiber.parent;
  }
  return null;
}
```

#### 8.4 提交阶段（Commit Phase）

```js
function commitRoot() {
  deletions.forEach(commitWork);
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
}

function commitWork(fiber) {
  if (!fiber) return;

  const parentDom = fiber.parent.dom;

  if (fiber.effectTag === "PLACEMENT" && fiber.dom) {
    parentDom.appendChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom) {
    updateProps(fiber.dom, fiber.alternate.props, fiber.props);
  } else if (fiber.effectTag === "DELETION") {
    parentDom.removeChild(fiber.dom);
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}
```

### ✅ 验证标准

- [ ] 渲染大列表（1000+ 项）时不阻塞主线程
- [ ] 打断渲染后能正确恢复
- [ ] 所有之前阶段的功能在 Fiber 架构下仍然正确工作
- [ ] Demo：渲染大量节点 + 动画不卡顿

---

## 实施路线图

```
Phase 1 ─── Phase 2 ─── Phase 3 ─── Phase 4 ─── Phase 5 ─── Phase 6 ─── Phase 7 ─── Phase 8
VNode        JSX        Diffing    Components   useState   useEffect    Events      Fiber
(基石)      (语法)      (性能)      (抽象)       (状态)      (副作用)     (交互)     (架构)
 ↑                                                                                    ↑
 必做                                                                               可选/进阶
```

### 预计时间

| 阶段    | 预计耗时 | 难度       |
| ------- | -------- | ---------- |
| Phase 1 | 1-2 小时 | ⭐⭐       |
| Phase 2 | 30 分钟  | ⭐         |
| Phase 3 | 2-3 小时 | ⭐⭐⭐     |
| Phase 4 | 1-2 小时 | ⭐⭐       |
| Phase 5 | 2-3 小时 | ⭐⭐⭐⭐   |
| Phase 6 | 1-2 小时 | ⭐⭐⭐     |
| Phase 7 | 1-2 小时 | ⭐⭐       |
| Phase 8 | 3-4 小时 | ⭐⭐⭐⭐⭐ |

### 每个阶段的工作流程

1. **阅读本文档对应阶段** — 理解目标和核心概念
2. **自己先尝试实现** — 不看参考答案，根据理解写代码
3. **编写测试用例** — 验证自己的实现是否正确
4. **构建 Playground Demo** — 用你的实现写一个小应用
5. **对比 React 源码** — 看看 React 实际是怎么做的
6. **写学习笔记** — 记录你的理解和困惑（放到 `docs/` 目录）
7. **Git Commit** — 每完成一个阶段提交一次

---

## 推荐参考资料

| 资源                                                                                                                                          | 说明                       |
| --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| [Build your own React](https://pomb.us/build-your-own-react/)                                                                                 | Rodrigo Pombo 的经典教程   |
| [React Source Code](https://github.com/facebook/react)                                                                                        | React 官方源码             |
| [React Fiber Architecture](https://github.com/acdlite/react-fiber-architecture)                                                               | Andrew Clark 的 Fiber 说明 |
| [Inside Fiber: in-depth overview](https://indepth.dev/posts/1008/inside-fiber-in-depth-overview-of-the-new-reconciliation-algorithm-in-react) | Fiber 深度解析             |
| [React hooks: not magic, just arrays](https://medium.com/@ryardley/react-hooks-not-magic-just-arrays-cd4f1857236e)                            | Hooks 原理图解             |

---

## 准备好了吗？

当你准备好开始时，告诉我 **"开始 Phase 1"**，我会帮你搭建项目脚手架并指导你一步步实现！

> 💡 **建议**：尽量先自己思考和实现，遇到困难再参考提示。
> 亲手写出来的理解，远比看别人代码深刻。

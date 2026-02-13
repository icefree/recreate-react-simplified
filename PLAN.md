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
│   │   ├── root.js              # Phase 3: Root API（createRoot/render/unmount）
│   │   ├── reconciler.js        # Phase 3: Diff & Patch
│   │   ├── component.js         # Phase 4: 函数式组件支持
│   │   ├── hooks.js             # Phase 5-6: useState & useEffect
│   │   ├── events.js            # Phase 7: 事件系统
│   │   ├── fiber.js             # Phase 8: Fiber 架构
│   │   ├── scheduler.js         # Phase 11: 调度器
│   │   └── index.js             # 统一导出
│   ├── playground/              # 🎮 每个阶段的演示应用
│   │   ├── phase1.js
│   │   ├── phase2.jsx
│   │   ├── phase3.jsx
│   │   ├── phase4.jsx
│   │   ├── phase5.jsx
│   │   ├── phase6.jsx
│   │   ├── phase7.jsx
│   │   ├── phase8.jsx
│   │   ├── phase9.jsx
│   │   ├── phase10.jsx
│   │   └── phase11.jsx
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

#### 3.0 引入 Root 生命周期 API（支持多 root）

```js
const roots = new WeakMap();

export function createRoot(container) {
  if (roots.has(container)) return roots.get(container);

  const root = {
    container,
    currentVNode: null,
    render(nextVNode) {
      reconcile(container, root.currentVNode, nextVNode);
      root.currentVNode = nextVNode;
    },
    unmount() {
      reconcile(container, root.currentVNode, null);
      root.currentVNode = null;
      roots.delete(container);
    },
  };

  roots.set(container, root);
  return root;
}
```

**要点：**

- 不再使用全局 `prevVNode`，每个 root 独立保存 `currentVNode`
- 支持同页面多个容器并行渲染
- `unmount()` 负责触发卸载流程（DOM 移除 + 组件 cleanup）

#### 3.1 改造入口渲染调用

```js
const root = createRoot(document.getElementById("root"));
root.render(<App />);
// 后续更新
root.render(<App mode="next" />);
// 卸载
root.unmount();
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

#### 3.4 实现子节点协调（位置对齐版本，无 key）

```js
function reconcileChildren(parentDom, oldChildren, newChildren) {
  const maxLen = Math.max(oldChildren.length, newChildren.length);
  for (let i = 0; i < maxLen; i++) {
    reconcile(parentDom, oldChildren[i], newChildren[i]);
  }
}
```

#### 3.5 实现 `key` 驱动的子节点协调（列表重排核心）

```js
function reconcileKeyedChildren(parentDom, oldChildren, newChildren) {
  const oldKeyed = new Map();
  const oldUnkeyed = [];

  oldChildren.forEach((child) => {
    if (child?.key != null) oldKeyed.set(child.key, child);
    else oldUnkeyed.push(child);
  });

  let unkeyedIndex = 0;
  newChildren.forEach((newChild) => {
    const matchedOld =
      newChild?.key != null ? oldKeyed.get(newChild.key) : oldUnkeyed[unkeyedIndex++];
    reconcile(parentDom, matchedOld, newChild);
    if (newChild?.key != null) oldKeyed.delete(newChild.key);
  });

  // newChildren 中不存在的旧节点全部删除
  oldKeyed.forEach((staleChild) => reconcile(parentDom, staleChild, null));
  for (let i = unkeyedIndex; i < oldUnkeyed.length; i++) {
    reconcile(parentDom, oldUnkeyed[i], null);
  }
}
```

**要点：**

- `key` 仅在同一层级 sibling 范围内生效
- 缺失 `key` 的列表项只能退化为“按位置比较”，会导致状态错位风险
- 将“插入/删除/移动”统一落到 effect（`PLACEMENT`/`DELETION`/`MOVE`）或 DOM patch 流程中

### ✅ 验证标准

- [ ] 修改属性时只更新变化的 prop，不重建 DOM
- [ ] 添加/删除子节点正确
- [ ] 节点类型变化时正确替换
- [ ] 多个 root 互不影响，分别 `render`/`unmount` 正确
- [ ] 列表在 `key` 稳定时可正确复用节点，重排不丢状态
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
  if (!currentComponent) {
    throw new Error("useState must be called inside a function component");
  }

  const component = currentComponent;
  const idx = hookIndex++;
  const oldHook = component.__hooks[idx];

  const hook = oldHook ?? {
    state: typeof initialValue === "function" ? initialValue() : initialValue,
    queue: [],
  };

  // 按顺序消费更新队列，保证 setState 顺序语义
  hook.queue.forEach((action) => {
    hook.state = typeof action === "function" ? action(hook.state) : action;
  });
  hook.queue = [];
  component.__hooks[idx] = hook;

  const setState = (action) => {
    hook.queue.push(action);
    scheduleRerender(component);
  };

  return [hook.state, setState];
}
```

#### 5.3 实现重新渲染机制

```js
const dirtyComponents = new Set();
let flushScheduled = false;

function scheduleRerender(component) {
  dirtyComponents.add(component);
  if (flushScheduled) return;
  flushScheduled = true;
  queueMicrotask(flushUpdates);
}

function flushUpdates() {
  flushScheduled = false;
  const pending = Array.from(dirtyComponents);
  dirtyComponents.clear();
  pending.forEach(renderComponent);
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
  if (component.__expectedHookCount == null) {
    component.__expectedHookCount = hookIndex;
  } else if (component.__expectedHookCount !== hookIndex) {
    throw new Error("Hook call order changed between renders");
  }
  currentComponent = null;
}
```

#### 5.5 定义状态更新语义（避免实现歧义）

```js
// 语义约定（建议写进测试）
// 1) 同一 microtask 内，同一组件只触发一次 render（批处理）
// 2) 同一个 state hook 的更新按 enqueue 顺序依次执行
// 3) 函数式更新总是接收前一个更新后的最新值
// 4) 若最终值与旧值 Object.is 相等，可跳过 commit
```

**需要明确的边界：**

- 在 render 期间调用 `setState`：简化版直接抛错，避免无限递归
- 跨组件更新顺序：按 `scheduleRerender` 入队顺序执行

#### 5.6 Hook 规则与错误处理

```js
function assertHookContext(hookName) {
  if (!currentComponent) {
    throw new Error(`${hookName} must be called at the top level of a component`);
  }
}
```

**运行时规则：**

- Hook 只能在函数组件顶层调用（禁止在条件、循环、嵌套函数中调用）
- 每次渲染 Hook 调用数量必须一致，不一致立即抛错
- 组件外调用 Hook 必须抛出可读错误信息
- 无效 `setState` 入参（如 Promise）可以在开发模式给出警告

### ✅ 验证标准

- [ ] `useState` 正确返回 `[state, setState]`
- [ ] `setState` 触发组件重新渲染
- [ ] 函数式更新 `setState(prev => prev + 1)` 正确工作
- [ ] 多个 `useState` 在同一组件中正确独立工作
- [ ] 同一事件里多次 `setState` 被批处理，且顺序一致
- [ ] Hook 调用顺序变化、组件外调用 Hook 时会抛出明确错误
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

#### 6.3 Hook 参数校验与错误处理

```js
function useEffect(callback, deps) {
  if (typeof callback !== "function") {
    throw new Error("useEffect callback must be a function");
  }
  if (deps !== undefined && !Array.isArray(deps)) {
    throw new Error("useEffect deps must be an array or undefined");
  }

  // 原有 useEffect 逻辑...
}
```

**要点：**

- cleanup 返回值只允许是 `function` 或 `undefined`
- 开发模式下为错误的 deps 类型和 cleanup 类型提供可读提示

### ✅ 验证标准

- [ ] 空依赖 `useEffect(() => {}, [])` 只在挂载时执行一次
- [ ] 无依赖 `useEffect(() => {})` 每次渲染后都执行
- [ ] 依赖变化时正确触发
- [ ] cleanup 函数正确执行
- [ ] 非法 deps 类型、非法 cleanup 返回值能被识别并报错
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

## Phase 9：Fiber 架构深入 — 源码级理解

### 🎯 学习目标

不仅仅是实现 Fiber，而是深入理解 React 源码中的核心机制。
掌握 **双缓存**、**两大工作循环** 以及 **Fiber 节点的高级数据结构**。

### 📚 核心概念

#### 1. 双缓存机制 (Double Buffering)

React 在内存中同时维护两棵 Fiber 树：

- **Current Tree**：当前屏幕上显示的内容对应的 Fiber 树。
- **WorkInProgress Tree**：正在构建的、用于下一次渲染的 Fiber 树。

两者通过 `alternate` 指针相互连接。渲染完成后，WIP 树变成 Current 树（指针交换），这一步非常快。

#### 2. 两大工作阶段 (The Two Phases)

- **Render Phase (Reconcile)**:
  - 纯计算，无副作用（不操作 DOM）。
  - 可中断、可重复执行。
  - 此阶段会构建 WIP 树，打上 `flags` (副作用标记)。
  - 核心函数：`beginWork` (向下遍历), `completeWork` (向上回溯)。
- **Commit Phase**:
  - 操作 DOM，执行副作用（`useEffect`）。
  - 不可中断，必须一气呵成。
  - 核心函数：`commitRoot` (分为 `BeforeMutation`, `Mutation`, `Layout` 三个子阶段)。

### 📋 实现任务

#### 9.1 完善 Fiber 数据结构

```js
function createFiber(vnode, parent) {
  return {
    // ...原有属性
    tag: FunctionComponent, // 标记组件类型 (Function/Class/Host)
    key: null,
    stateNode: null, // 对应的真实 DOM 或类实例
    updateQueue: null, // 状态更新队列
    memoizedState: null, // Hook 状态链表
    flags: NoFlags, // 副作用标记 (Placement, Update, etc.)
    subtreeFlags: NoFlags, // 子树副作用标记 (优化遍历)
    alternate: null, // 双缓存连接
  };
}
```

#### 9.2 实现 beginWork 与 completeWork 流程

将 `performUnitOfWork` 拆解为更符合源码的结构。

### ✅ 验证标准

- [ ] 能够解释双缓存是如何工作的
- [ ] 清楚区分 Render 阶段和 Commit 阶段的职责
- [ ] 实现 `alternate` 机制，复用旧 Fiber 节点

---

## Phase 10：三层架构 — React, Reconciler, Renderer

### 🎯 学习目标

理解 React 的**分层架构**，明白为什么 React 可以跨平台（Reflex/Native/Three.js）。

### 📚 核心概念

1.  **React (API Layer)**
    - 提供 `createElement`, `useState`, `useEffect`, `Component` 等 API。
    - **不包含**任何渲染逻辑，只负责定义组件和数据。
    - 包名：`react`。

2.  **Reconciler (Core Engine)**
    - 核心 Diff 算法和 Fiber 调度器。
    - 消费 React Element，计算差异，产生副作用。
    - **平台无关**，不直接操作 DOM。
    - 包名：`react-reconciler`。

3.  **Renderer (Platform Layer)**
    - 负责将 Reconciler 的指令应用到具体平台（DOM, iOS, Android, Canvas）。
    - 实现 `HostConfig` 接口（如 `createElement`, `appendChild`, `commitTextUpdate`）。
    - 包名：`react-dom`, `react-native` 等。

### 📋 实现任务

#### 10.1 抽离 HostConfig

将所有 DOM 操作抽离到一个单独的配置文件或对象中。

```js
// hostConfig.js
export const hostConfig = {
  createInstance: (type, props) => document.createElement(type),
  createTextInstance: (text) => document.createTextNode(text),
  appendChild: (parent, child) => parent.appendChild(child),
  removeChild: (parent, child) => parent.removeChild(child),
  // ...
};
```

#### 10.2 改造 Reconciler

让 Reconciler 依赖 `hostConfig` 而不是直接调用 `document.xxx`。

### ✅ 验证标准

- [ ] 代码结构清晰分离：UI 定义 vs 协调逻辑 vs 平台操作
- [ ] 尝试写一个简单的 Custom Renderer（例如渲染到 JSON 或 Canvas）

---

## Phase 11：Concurrent Mode (并发模式)

### 🎯 学习目标

实现 React 最先进的特性：**时间切片 (Time Slicing)** 和 **优先级调度 (Scheduler)**。
让高优先级任务（如用户输入）打断低优先级任务（如大数据渲染）。

### 📚 核心概念

1.  **Scheduler (调度器)**
    - 独立于 React 的任务调度包。
    - 核心：`shouldYield()` (控制权交还浏览器) 和 `scheduleCallback()` (按优先级调度任务)。
    - 使用 `MessageChannel` 实现宏任务调度（比 `requestIdleCallback` 更稳定）。

2.  **Update Priority (优先级)**
    - `UserBlocking` (最高): 点击、输入
    - `Normal`: 数据获取
    - `Low`: 统计上报
    - `Idle`: 后台任务

3.  **Lane 模型**
    - 使用二进制位掩码表示优先级（代替 expireTime）。

### 📋 实现任务

#### 11.1 集成 Scheduler

实现一个简易版 Scheduler。

```js
// scheduler.js
const taskQueue = [];
let deadline = 0;
let yieldInterval = 5; // 5ms 时间切片

function shouldYield() {
  return navigator.scheduling.isInputPending() || performance.now() >= deadline;
}

function schedule(callback) {
  taskQueue.push(callback);
  postMessage(); // 触发宏任务
}
```

#### 11.2 实现 `useTransition`

```js
function useTransition() {
  const [isPending, setPending] = useState(false);
  const startTransition = (callback) => {
    setPending(true);
    // 降低优先级执行 callback 中的更新
    scheduler.scheduleLowPriority(() => {
      callback();
      setPending(false);
    });
  };
  return [isPending, startTransition];
}
```

### ✅ 验证标准

- [ ] 能够在渲染重计算任务时响应用户点击
- [ ] 实现 `startTransition`
- [ ] 演示 Time Slicing 效果

---

## 实施路线图

```
Phase 1 ── Phase 2 ── Phase 3 ── Phase 4 ── Phase 5 ── Phase 6 ── Phase 7 ── Phase 8
VNode       JSX       Diffing    Component   useState   useEffect    Events     Fiber
(基石)     (语法)     (性能)      (抽象)      (状态)     (副作用)     (交互)     (基础)

   ┌──────────────────────────────────────────────────────────────────────────────┘
   ↓
Phase 9 ──── Phase 10 ──── Phase 11
DeepFiber    ThreeLayer    Concurrent
(原理)        (分层)        (并发)
   ↑             ↑             ↑
  进阶          架构          挑战
```

### 预计时间

| 阶段     | 预计耗时 | 难度       |
| -------- | -------- | ---------- |
| Phase 1  | 1-2 小时 | ⭐⭐       |
| Phase 2  | 30 分钟  | ⭐         |
| Phase 3  | 2-3 小时 | ⭐⭐⭐     |
| Phase 4  | 1-2 小时 | ⭐⭐       |
| Phase 5  | 2-3 小时 | ⭐⭐⭐⭐   |
| Phase 6  | 1-2 小时 | ⭐⭐⭐     |
| Phase 7  | 1-2 小时 | ⭐⭐       |
| Phase 8  | 3-4 小时 | ⭐⭐⭐⭐⭐ |
| Phase 9  | 2-3 小时 | ⭐⭐⭐⭐   |
| Phase 10 | 2-3 小时 | ⭐⭐⭐     |
| Phase 11 | 4-5 小时 | ⭐⭐⭐⭐⭐ |

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

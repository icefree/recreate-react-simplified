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
      newChild?.key != null
        ? oldKeyed.get(newChild.key)
        : oldUnkeyed[unkeyedIndex++];
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
    throw new Error(
      `${hookName} must be called at the top level of a component`,
    );
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

#### 6.4 实现 `useRef`

`useRef` 是最简单的 hook -- 它只是一个在渲染间持久化的**可变容器**。

```js
function useRef(initialValue) {
  assertHookContext("useRef");
  const component = currentComponent;
  const idx = hookIndex++;
  const oldHook = component.__hooks[idx];

  if (!oldHook) {
    component.__hooks[idx] = { current: initialValue };
  }

  return component.__hooks[idx];
}
```

**要点：**

- `useRef` 返回的对象在组件生命周期内保持不变（同一个引用）
- 修改 `.current` **不会**触发重新渲染（与 `useState` 的本质区别）
- 常见用途：保存 DOM 引用、保存定时器 ID、保存前一次渲染的值
- 与普通变量的区别：组件重新渲染时，局部变量会被重置，而 `ref.current` 不会

#### 6.5 实现 `useReducer`

`useReducer` 是 `useState` 的泛化版本。事实上，**React 内部 `useState` 就是基于 `useReducer` 实现的**。

```js
function useReducer(reducer, initialArg, init) {
  assertHookContext("useReducer");
  const component = currentComponent;
  const idx = hookIndex++;
  const oldHook = component.__hooks[idx];

  const hook = oldHook ?? {
    state: init ? init(initialArg) : initialArg,
    queue: [],
  };

  // 消费更新队列
  hook.queue.forEach((action) => {
    hook.state = reducer(hook.state, action);
  });
  hook.queue = [];
  component.__hooks[idx] = hook;

  const dispatch = (action) => {
    hook.queue.push(action);
    scheduleRerender(component);
  };

  return [hook.state, dispatch];
}

// useState 的本质 -- 它只是一个内置了 basicReducer 的 useReducer
function useState(initialValue) {
  return useReducer(
    (state, action) => (typeof action === "function" ? action(state) : action),
    initialValue,
  );
}
```

**要点：**

- `useReducer` 适合管理复杂状态逻辑（多个子值、依赖前一状态）
- `dispatch` 是稳定的引用（不会在重新渲染时改变），适合传给子组件
- 理解 `useState` 是 `useReducer` 的语法糖，有助于理解 React 内部的统一状态更新模型

### ✅ 验证标准

- [ ] 空依赖 `useEffect(() => {}, [])` 只在挂载时执行一次
- [ ] 无依赖 `useEffect(() => {})` 每次渲染后都执行
- [ ] 依赖变化时正确触发
- [ ] cleanup 函数正确执行
- [ ] 非法 deps 类型、非法 cleanup 返回值能被识别并报错
- [ ] `useRef` 返回的对象跨渲染保持同一引用
- [ ] `useRef` 修改 `.current` 不触发重新渲染
- [ ] `useReducer` 正确接收 reducer 并通过 `dispatch` 触发更新
- [ ] `useState` 可用 `useReducer` 重新实现，行为一致
- [ ] Demo 1：自动计时器（setInterval + cleanup）
- [ ] Demo 2：模拟数据请求（切换 ID 时取消上次请求）
- [ ] Demo 3：使用 `useRef` 保存 DOM 节点引用

### 🔗 React 源码参考

- [`react-reconciler/src/ReactFiberHooks.js`](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberHooks.js) -- 所有 Hooks 的核心实现

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

## Phase 7b：Context API 与 Memoization Hooks

### 🎯 学习目标

理解 React 的**跨层级数据传递**和**性能优化**机制。
Context 解决了 prop drilling 问题；`useMemo`/`useCallback`/`React.memo` 是避免不必要渲染的核心工具。

### 📚 核心概念

```
Context 的工作方式：
1. createContext 创建一个"频道"
2. Provider 在组件树上方"广播"值
3. useContext 在下方任意层级"接收"值
4. Provider 值变化时，所有 Consumer 自动重新渲染

Memo 机制：
- useMemo(fn, deps)     -> 缓存计算结果
- useCallback(fn, deps) -> 缓存函数引用（等价于 useMemo(() => fn, deps)）
- React.memo(Component) -> 浅比较 props，跳过不必要的重新渲染

三者的关系：
- useMemo 避免昂贵的重复计算
- useCallback 保持函数引用稳定（配合 React.memo 使用）
- React.memo 让子组件在 props 不变时跳过渲染
```

### 📋 实现任务

#### 7b.1 实现 `createContext` 与 `useContext`

```js
function createContext(defaultValue) {
  const context = {
    _defaultValue: defaultValue,
    _currentValue: defaultValue,
    Provider: null,
  };

  // Provider 是一个特殊的组件
  context.Provider = function ContextProvider({ value, children }) {
    context._currentValue = value;
    return children;
  };

  return context;
}

function useContext(context) {
  assertHookContext("useContext");
  // 简化版：直接读取 context 的当前值
  return context._currentValue;
}
```

**关键问题（简化版 vs 真实 React）：**

- 真实 React 中，Provider 值变化时会**扫描 Fiber 树**，找到所有读取该 Context 的 Consumer，精确标记为脏节点
- 简化版用全局值方式实现，缺点是**所有子组件**都会重新渲染，而非只有实际消费 Context 的组件
- 这正是理解 React 内部 Context 传播机制（`propagateContextChange`）的动机

#### 7b.2 实现 `useMemo` 与 `useCallback`

```js
function useMemo(factory, deps) {
  assertHookContext("useMemo");
  const component = currentComponent;
  const idx = hookIndex++;
  const oldHook = component.__hooks[idx];

  const hasChanged = oldHook
    ? !deps || deps.some((dep, i) => !Object.is(dep, oldHook.deps[i]))
    : true;

  if (hasChanged) {
    const value = factory();
    component.__hooks[idx] = { value, deps };
    return value;
  }

  return oldHook.value;
}

// useCallback 就是 useMemo 的语法糖
function useCallback(callback, deps) {
  return useMemo(() => callback, deps);
}
```

**要点：**

- `useMemo` 在 deps 不变时跳过 `factory()` 执行，直接返回缓存值
- `useCallback` 本质上等价于 `useMemo(() => fn, deps)`
- 它们都**不保证**缓存永远存在 -- React 可能在内存压力下丢弃缓存

#### 7b.3 实现 `memo` 高阶组件

```js
function memo(Component, areEqual) {
  return function MemoComponent(props) {
    const component = currentComponent;
    const prevProps = component.__prevMemoProps;

    if (prevProps) {
      const isEqual = areEqual
        ? areEqual(prevProps, props)
        : shallowEqual(prevProps, props);

      if (isEqual) {
        return component.__prevMemoResult;
      }
    }

    component.__prevMemoProps = props;
    const result = Component(props);
    component.__prevMemoResult = result;
    return result;
  };
}

function shallowEqual(objA, objB) {
  if (Object.is(objA, objB)) return true;
  if (!objA || !objB) return false;
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((key) => Object.is(objA[key], objB[key]));
}
```

**要点：**

- `memo` 通过浅比较 props 决定是否跳过渲染，等价于 `shouldComponentUpdate`
- 自定义比较函数 `areEqual(prevProps, nextProps)` 可以覆盖默认的浅比较
- `memo` 只比较 props，不比较 state 和 context 变化

### ✅ 验证标准

- [ ] `createContext` + `useContext` 能在深层组件中获取 Provider 的值
- [ ] Provider 值变化时，Consumer 组件正确重新渲染
- [ ] 没有 Provider 时，`useContext` 返回 `defaultValue`
- [ ] `useMemo` 在依赖不变时返回缓存值，避免重复计算
- [ ] `useCallback` 在依赖不变时返回同一个函数引用
- [ ] `memo` 组件在 props 浅比较相等时跳过渲染
- [ ] Demo 1：主题切换（Theme Context）
- [ ] Demo 2：用 `useMemo` 优化昂贵的列表过滤计算
- [ ] Demo 3：用 `memo` + `useCallback` 避免子组件不必要的重新渲染

### 🔗 React 源码参考

- [`react/src/ReactContext.js`](https://github.com/facebook/react/blob/main/packages/react/src/ReactContext.js) -- Context 创建
- [`react-reconciler/src/ReactFiberNewContext.js`](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberNewContext.js) -- Context 在 Fiber 树中的传播机制
- [`react/src/ReactMemo.js`](https://github.com/facebook/react/blob/main/packages/react/src/ReactMemo.js) -- memo 高阶组件

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
掌握 **双缓存**、**两大工作循环**、**Bailout 优化** 以及 **Fiber 节点的高级数据结构**。

### 📚 核心概念

#### 1. FiberRootNode vs HostRootFiber

React 内部有两个容易混淆的"根"节点：

```
FiberRootNode (容器对象)
├── current ──→ HostRootFiber (Current 树的根 Fiber)
│                  └── alternate ──→ HostRootFiber (WIP 树的根 Fiber)
└── containerInfo ──→ 真实 DOM 容器 (document.getElementById('root'))
```

- **FiberRootNode**：`createRoot()` 返回的容器对象，持有 `current` 指针，在整个应用生命周期内不变。
- **HostRootFiber**：Fiber 树的根节点，在双缓存切换时会交换。
- `fiberRootNode.current = wipRootFiber` —— 这就是"提交"的本质：一次指针交换。

#### 2. 双缓存机制 (Double Buffering)

React 在内存中同时维护两棵 Fiber 树：

- **Current Tree**：当前屏幕上显示的内容对应的 Fiber 树。
- **WorkInProgress Tree**：正在构建的、用于下一次渲染的 Fiber 树。

两者通过 `alternate` 指针相互连接。渲染完成后，WIP 树变成 Current 树（指针交换），这一步非常快。

```
提交前：                          提交后：
FiberRootNode.current             FiberRootNode.current
       │                                 │
       ▼                                 ▼
   Current Tree  ←alternate→  WIP Tree   (WIP 变成了新的 Current)
```

#### 3. 两大工作阶段 (The Two Phases)

- **Render Phase (Reconcile)**:
  - 纯计算，无副作用（不操作 DOM）。
  - 可中断、可重复执行。
  - 此阶段会构建 WIP 树，打上 `flags` (副作用标记)。
  - 核心函数：`beginWork` (向下遍历), `completeWork` (向上回溯)。
- **Commit Phase**:
  - 操作 DOM，执行副作用（`useEffect`）。
  - 不可中断，必须一气呵成。
  - 核心函数：`commitRoot` (分为三个子阶段)：
    - **BeforeMutation**：DOM 变更前（`getSnapshotBeforeUpdate`）
    - **Mutation**：真正操作 DOM（`appendChild`, `removeChild`, `commitUpdate`）
    - **Layout**：DOM 变更后（`useLayoutEffect` 回调、ref 赋值）

#### 4. Bailout 优化

**Bailout 是 React 性能模型的核心** —— 当一个组件满足以下条件时，可以跳过整个子树的重新渲染：

```
Bailout 条件（全部满足才跳过）：
1. oldProps === newProps （引用相等，不是浅比较）
2. 没有 pending 的 state 更新
3. Context 没有变化
4. fiber.type 没有变化

满足后：调用 bailoutOnAlreadyFinishedWork()
→ 克隆子节点（而不是重新执行组件函数）
→ 跳过整个子树的 beginWork
```

**这就是为什么需要 `React.memo`、`useMemo`、`useCallback`：**

- 默认情况下，父组件每次重新渲染都会创建新的 props 对象和内联函数
- 新 props 对象 !== 旧 props 对象 → Bailout 条件 1 不满足 → 子组件必须重新渲染
- `React.memo` 改用浅比较（而非引用比较）来判断
- `useMemo`/`useCallback` 保持引用稳定，让浅比较通过

### 📋 实现任务

#### 9.1 完善 Fiber 数据结构

```js
// Fiber 标签类型
const FunctionComponent = 0;
const HostRoot = 3; // 根节点
const HostComponent = 5; // 原生 DOM 元素（div, span...）
const HostText = 6; // 文本节点

// 副作用标记 (使用位掩码，可以组合)
const NoFlags = 0b0000000;
const Placement = 0b0000001; // 新增节点
const Update = 0b0000010; // 更新节点
const Deletion = 0b0000100; // 删除节点
const ChildDeletion = 0b0001000;

function createFiber(vnode, parent) {
  return {
    // 身份信息
    tag: FunctionComponent, // 组件类型标签
    type: vnode.type, // 元素类型（'div', Function, ...）
    key: vnode.key ?? null, // 用于列表 Diff 的 key

    // 树结构 (链表)
    return: parent, // 父 Fiber（React 源码用 return 而非 parent）
    child: null, // 第一个子 Fiber
    sibling: null, // 下一个兄弟 Fiber
    index: 0, // 在兄弟节点中的位置

    // 状态
    pendingProps: vnode.props, // 本次渲染待处理的 props
    memoizedProps: null, // 上次渲染使用的 props
    memoizedState: null, // Hook 链表头或 Class state
    updateQueue: null, // 状态更新队列

    // 副作用
    flags: NoFlags, // 自身副作用标记
    subtreeFlags: NoFlags, // 子树副作用标记（优化 commit 遍历）

    // 输出
    stateNode: null, // 真实 DOM 节点或 FiberRootNode

    // 双缓存
    alternate: null, // 指向上一次渲染的对应 Fiber
  };
}
```

#### 9.2 实现 beginWork —— 向下遍历（"递"阶段）

`beginWork` 的核心职责是**根据 `fiber.tag` 分发到不同处理函数**，然后协调子节点。

```js
function beginWork(current, workInProgress) {
  // 🔑 Bailout 检查：如果可以跳过，直接返回
  if (current !== null) {
    const oldProps = current.memoizedProps;
    const newProps = workInProgress.pendingProps;

    if (oldProps === newProps && !hasContextChanged()) {
      // Props 没变，没有 state 更新 → 可以跳过
      return bailoutOnAlreadyFinishedWork(current, workInProgress);
    }
  }

  // 根据 fiber.tag 分发到不同处理函数
  switch (workInProgress.tag) {
    case FunctionComponent:
      return updateFunctionComponent(current, workInProgress);
    case HostRoot:
      return updateHostRoot(current, workInProgress);
    case HostComponent:
      return updateHostComponent(current, workInProgress);
    case HostText:
      return null; // 文本节点没有子节点，直接返回
    default:
      throw new Error(`Unknown fiber tag: ${workInProgress.tag}`);
  }
}

function updateFunctionComponent(current, workInProgress) {
  // 1. 设置 Hook 上下文
  // 2. 调用组件函数，获取子 VNode
  const children = workInProgress.type(workInProgress.pendingProps);
  // 3. 协调子节点（创建/复用子 Fiber）
  reconcileChildren(current, workInProgress, children);
  return workInProgress.child; // 返回第一个子 Fiber
}

function updateHostComponent(current, workInProgress) {
  // 原生 DOM 元素：不需要调用函数，直接协调 children
  const children = workInProgress.pendingProps.children;
  reconcileChildren(current, workInProgress, children);
  return workInProgress.child;
}
```

#### 9.3 实现 completeWork —— 向上回溯（"归"阶段）

`completeWork` 在 `beginWork` 处理完子树后被调用，负责三件事：

```js
function completeWork(current, workInProgress) {
  switch (workInProgress.tag) {
    case HostComponent: {
      if (current !== null && workInProgress.stateNode !== null) {
        // 🔄 更新：对比新旧 props，生成更新 payload
        const updatePayload = diffProperties(
          current.memoizedProps,
          workInProgress.pendingProps,
        );
        // 将差异挂到 Fiber 上，commit 阶段再应用
        workInProgress.updateQueue = updatePayload;
        if (updatePayload) {
          workInProgress.flags |= Update;
        }
      } else {
        // 🆕 新建：创建真实 DOM 实例
        const instance = document.createElement(workInProgress.type);
        // 设置初始属性
        setInitialProperties(instance, workInProgress.pendingProps);
        // 将已完成的子 DOM 追加到当前 DOM
        appendAllChildren(instance, workInProgress);
        workInProgress.stateNode = instance;
      }
      break;
    }
    case HostText: {
      // 创建或更新文本节点
      if (current === null) {
        workInProgress.stateNode = document.createTextNode(
          workInProgress.pendingProps,
        );
      }
      break;
    }
    case FunctionComponent:
      // 函数组件没有 DOM 产出，无需特殊处理
      break;
  }

  // 🔑 关键：向上冒泡 subtreeFlags
  bubbleProperties(workInProgress);
}

function bubbleProperties(completedWork) {
  let child = completedWork.child;
  let subtreeFlags = NoFlags;
  while (child !== null) {
    subtreeFlags |= child.subtreeFlags;
    subtreeFlags |= child.flags;
    child = child.sibling;
  }
  completedWork.subtreeFlags = subtreeFlags;
}
```

**`subtreeFlags` 的优化意义：**

- Commit 阶段遍历 Fiber 树时，如果 `subtreeFlags === NoFlags`，说明整个子树没有任何副作用，可以直接跳过。
- 这比 React 16 的 Effect List（副作用链表）更简洁，且修复了一些边界问题。

#### 9.4 实现 Bailout 优化

```js
function bailoutOnAlreadyFinishedWork(current, workInProgress) {
  // 检查子树是否有工作要做
  if (current.subtreeFlags === NoFlags) {
    // 子树也没有更新，完全跳过
    return null;
  }

  // 子树有更新，克隆子节点（但不重新执行组件函数）
  cloneChildFibers(current, workInProgress);
  return workInProgress.child;
}

function cloneChildFibers(current, workInProgress) {
  let currentChild = current.child;
  let newChild = createWorkInProgress(currentChild);
  workInProgress.child = newChild;
  newChild.return = workInProgress;

  while (currentChild.sibling !== null) {
    currentChild = currentChild.sibling;
    const newSibling = createWorkInProgress(currentChild);
    newChild.sibling = newSibling;
    newSibling.return = workInProgress;
    newChild = newSibling;
  }
}

// 从 current fiber 创建 WIP fiber（复用对象，减少 GC）
function createWorkInProgress(current) {
  let workInProgress = current.alternate;
  if (workInProgress === null) {
    // 首次创建
    workInProgress = createFiber(current);
    workInProgress.alternate = current;
    current.alternate = workInProgress;
  } else {
    // 复用已有的 alternate
    workInProgress.pendingProps = current.pendingProps;
    workInProgress.flags = NoFlags;
    workInProgress.subtreeFlags = NoFlags;
  }
  // 复制共享字段
  workInProgress.child = current.child;
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.updateQueue = current.updateQueue;
  return workInProgress;
}
```

#### 9.5 Error Boundaries —— 错误在 Fiber 树中的传播

```
错误传播机制：
1. Render 阶段或 Commit 阶段发生错误
2. React 从出错的 Fiber 向上遍历（沿 return 指针）
3. 找到最近的 Error Boundary（带 componentDidCatch 的 class 组件）
4. 将该 boundary 标记为需要更新，显示 fallback UI
5. 如果找不到 boundary → 整个应用树卸载

在函数组件时代，目前还没有 Hook 版本的 Error Boundary。
需要用 class 组件或第三方库来实现。
```

```js
// 简化版 Error Boundary 处理
function handleError(root, thrownValue) {
  let erroredWork = workInProgress;
  // 沿 return 链向上查找 Error Boundary
  let returnFiber = erroredWork.return;

  while (returnFiber !== null) {
    if (isErrorBoundary(returnFiber)) {
      // 找到了 boundary，标记错误
      returnFiber.flags |= ShouldCapture;
      returnFiber.updateQueue = {
        error: thrownValue,
      };
      return;
    }
    returnFiber = returnFiber.return;
  }

  // 没有找到 boundary，致命错误
  throw thrownValue;
}
```

### ✅ 验证标准

- [ ] 能够解释 FiberRootNode 和 HostRootFiber 的区别
- [ ] 能够解释双缓存是如何工作的（alternate + 指针交换）
- [ ] 清楚区分 Render 阶段和 Commit 阶段的职责
- [ ] beginWork 根据 `fiber.tag` 正确分发到不同处理函数
- [ ] completeWork 正确创建 DOM 实例、冒泡 subtreeFlags
- [ ] Bailout 优化：props 未变 + 无 pending update 时跳过子树
- [ ] subtreeFlags 冒泡机制正确工作
- [ ] 实现 `alternate` 机制，复用旧 Fiber 节点
- [ ] Error Boundary 能捕获子树中的渲染错误并显示 fallback
- [ ] Demo：大列表 + React.memo，验证 Bailout 减少了不必要的 beginWork 调用

### 🔗 React 源码参考

- [`react-reconciler/src/ReactFiberBeginWork.js`](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberBeginWork.js) — beginWork 主逻辑
- [`react-reconciler/src/ReactFiberCompleteWork.js`](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberCompleteWork.js) — completeWork 主逻辑
- [`react-reconciler/src/ReactFiberWorkLoop.js`](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberWorkLoop.js) — Work Loop 主循环
- [`react-reconciler/src/ReactFiberThrow.js`](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberThrow.js) — 错误处理

---

## Phase 10：三层架构 — React, Reconciler, Renderer

### 🎯 学习目标

理解 React 的**分层架构**，明白为什么 React 可以跨平台（React DOM/Native/Three.js）。
掌握 **Dispatcher 模式**——它是连接 `react` 包和 `react-reconciler` 的桥梁。

### 📚 核心概念

#### 1. 三层架构总览

```
┌─────────────────────────────────────────────────┐
│  react (API Layer)                               │
│  createElement, useState, useEffect, memo...     │
│  ⚠️ 不包含任何渲染逻辑                            │
│         │                                        │
│         │ 通过 Dispatcher 委托                    │
│         ▼                                        │
│  react-reconciler (Core Engine)                  │
│  Fiber, Diff, Scheduling, Hook 实现              │
│  ⚠️ 平台无关，不直接操作 DOM                      │
│         │                                        │
│         │ 通过 HostConfig 接口调用                 │
│         ▼                                        │
│  react-dom / react-native (Platform Layer)       │
│  DOM 操作 / iOS/Android 原生操作                  │
└─────────────────────────────────────────────────┘
```

#### 2. Dispatcher 模式 —— 三层架构的连接桥梁

**核心问题：** `react` 包导出了 `useState`，但 `react` 包不包含任何实现逻辑。那 `useState()` 是怎么工作的？

**答案：** Dispatcher 模式。

```js
// react 包内部
const ReactCurrentDispatcher = {
  current: null, // 👈 这个指针在运行时被 reconciler 设置
};

// react 包导出的 useState —— 它只是一个"转发器"
function useState(initialState) {
  const dispatcher = ReactCurrentDispatcher.current;
  return dispatcher.useState(initialState);
}
```

```js
// react-reconciler 在渲染时设置 dispatcher
function renderWithHooks(current, workInProgress, Component) {
  // Mount 阶段使用 mount 版本的 hooks
  ReactCurrentDispatcher.current =
    current === null ? HooksDispatcherOnMount : HooksDispatcherOnUpdate;

  // 调用组件函数
  const children = Component(workInProgress.pendingProps);

  // 渲染结束后，设置为"无效"dispatcher（组件外调用 hook 会报错）
  ReactCurrentDispatcher.current = InvalidHooksDispatcher;

  return children;
}

// 不同阶段的 hooks 实现不同
const HooksDispatcherOnMount = {
  useState: mountState,
  useEffect: mountEffect,
  useRef: mountRef,
  // ...
};

const HooksDispatcherOnUpdate = {
  useState: updateState,
  useEffect: updateEffect,
  useRef: updateRef,
  // ...
};

// 无效 dispatcher —— 组件外调用 hook 时的错误提示
const InvalidHooksDispatcher = {
  useState: () => {
    throw new Error("Hook called outside of component");
  },
  // ...
};
```

**关键洞察：**

- 这就是为什么 `react` 包和 `react-dom` 包可以独立发版
- Mount 和 Update 阶段的 hook 行为不同（如 `useState` 首次渲染读 `initialState`，后续渲染读 `memoizedState`）
- 组件外调用 hook 报错的机制：此时 dispatcher 指向 `InvalidHooksDispatcher`

#### 3. 三层职责详解

1.  **React (API Layer)**
    - 提供 `createElement`, `useState`, `useEffect`, `Component`, `memo`, `createContext` 等 API。
    - **不包含**任何渲染逻辑，只负责定义组件和管理 Dispatcher 转发。
    - 包名：`react`。
    - 关键内部对象：`ReactCurrentDispatcher`, `ReactCurrentOwner`。

2.  **Reconciler (Core Engine)**
    - 核心 Diff 算法、Fiber 调度器、Hook 的真正实现。
    - 消费 React Element，计算差异，产生副作用。
    - **平台无关**，不直接操作 DOM。通过 `HostConfig` 接口与平台交互。
    - 包名：`react-reconciler`。

3.  **Renderer (Platform Layer)**
    - 负责将 Reconciler 的指令应用到具体平台。
    - 实现 `HostConfig` 接口。
    - 包名：`react-dom`, `react-native`, `react-three-fiber` 等。

### 📋 实现任务

#### 10.1 抽离 HostConfig —— 完整接口

将所有平台操作抽离到 `HostConfig` 接口中，按职责分类：

```js
// hostConfig.js — DOM 平台实现
export const DOMHostConfig = {
  // ===== Render 阶段（创建实例） =====
  createInstance(type, props) {
    return document.createElement(type);
  },

  createTextInstance(text) {
    return document.createTextNode(text);
  },

  // ===== Commit 阶段 - Mutation 子阶段（操作 DOM） =====
  appendChild(parent, child) {
    parent.appendChild(child);
  },

  insertBefore(parent, child, beforeChild) {
    parent.insertBefore(child, beforeChild);
  },

  removeChild(parent, child) {
    parent.removeChild(child);
  },

  commitUpdate(domElement, updatePayload, type, oldProps, newProps) {
    // 应用 diffProperties 产生的更新
    for (let i = 0; i < updatePayload.length; i += 2) {
      const propKey = updatePayload[i];
      const propValue = updatePayload[i + 1];
      if (propKey === "style") {
        Object.assign(domElement.style, propValue);
      } else if (propKey === "children") {
        domElement.textContent = propValue;
      } else {
        domElement.setAttribute(propKey, propValue);
      }
    }
  },

  commitTextUpdate(textInstance, oldText, newText) {
    textInstance.nodeValue = newText;
  },

  // ===== Commit 阶段 - 生命周期 =====
  prepareForCommit(containerInfo) {
    // DOM 特有：禁用事件以避免 commit 期间触发
    return null;
  },

  resetAfterCommit(containerInfo) {
    // commit 完成后的清理工作
  },

  // ===== 上下文 =====
  getRootHostContext(rootContainer) {
    // 返回根节点的 host context（如 namespace）
    return {};
  },

  getChildHostContext(parentHostContext, type) {
    // 返回子节点的 host context
    return parentHostContext;
  },

  // ===== 辅助 =====
  getPublicInstance(instance) {
    return instance; // ref 引用的对象
  },

  finalizeInitialChildren(domElement, type, props) {
    // 是否需要在 commit 后立即执行某些操作（如 autoFocus）
    return props.autoFocus === true;
  },
};
```

#### 10.2 改造 Reconciler

让 Reconciler 依赖 `hostConfig` 接口而不是直接调用 `document.xxx`。

```js
// reconciler.js — 使用依赖注入
function createReconciler(hostConfig) {
  function completeWork(current, workInProgress) {
    switch (workInProgress.tag) {
      case HostComponent: {
        if (current === null) {
          // 使用 hostConfig 而非直接调用 document
          const instance = hostConfig.createInstance(
            workInProgress.type,
            workInProgress.pendingProps,
          );
          workInProgress.stateNode = instance;
        }
        break;
      }
      case HostText: {
        if (current === null) {
          workInProgress.stateNode = hostConfig.createTextInstance(
            workInProgress.pendingProps,
          );
        }
        break;
      }
    }
  }

  function commitMutationEffects(fiber) {
    if (fiber.flags & Placement) {
      const parent = getHostParent(fiber);
      hostConfig.appendChild(parent, fiber.stateNode);
    }
    if (fiber.flags & Update) {
      hostConfig.commitUpdate(
        fiber.stateNode,
        fiber.updateQueue,
        fiber.type,
        fiber.alternate.memoizedProps,
        fiber.memoizedProps,
      );
    }
    if (fiber.flags & Deletion) {
      const parent = getHostParent(fiber);
      hostConfig.removeChild(parent, fiber.stateNode);
    }
  }

  return { render /* ... */ };
}

// 使用：
const DOMReconciler = createReconciler(DOMHostConfig);
```

#### 10.3 实现 Dispatcher 模式

```js
// shared/ReactCurrentDispatcher.js
export const ReactCurrentDispatcher = { current: null };

// react/hooks.js — API 层（只转发，不实现）
import { ReactCurrentDispatcher } from "./shared/ReactCurrentDispatcher";

export function useState(initialState) {
  return ReactCurrentDispatcher.current.useState(initialState);
}

export function useEffect(create, deps) {
  return ReactCurrentDispatcher.current.useEffect(create, deps);
}

// reconciler/fiberHooks.js — 实现层
export function renderWithHooks(current, workInProgress, Component) {
  ReactCurrentDispatcher.current =
    current === null ? HooksDispatcherOnMount : HooksDispatcherOnUpdate;

  const children = Component(workInProgress.pendingProps);

  ReactCurrentDispatcher.current = InvalidHooksDispatcher;
  return children;
}
```

#### 10.4 实战：Custom String Renderer（渲染到 HTML 字符串）

```js
// stringHostConfig.js — 渲染到字符串（类似 SSR）
const StringHostConfig = {
  createInstance(type, props) {
    return { type, props, children: [] };
  },

  createTextInstance(text) {
    return { type: "TEXT", text };
  },

  appendChild(parent, child) {
    parent.children.push(child);
  },

  removeChild(parent, child) {
    parent.children = parent.children.filter((c) => c !== child);
  },

  insertBefore(parent, child, beforeChild) {
    const idx = parent.children.indexOf(beforeChild);
    parent.children.splice(idx, 0, child);
  },

  commitUpdate(instance, updatePayload) {
    for (let i = 0; i < updatePayload.length; i += 2) {
      instance.props[updatePayload[i]] = updatePayload[i + 1];
    }
  },

  commitTextUpdate(textInstance, oldText, newText) {
    textInstance.text = newText;
  },
};

// 将节点树序列化为 HTML 字符串
function serializeToHTML(node) {
  if (node.type === "TEXT") return escapeHTML(node.text);
  const attrs = Object.entries(node.props)
    .filter(([k]) => k !== "children")
    .map(([k, v]) => `${k}="${v}"`)
    .join(" ");
  const children = node.children.map(serializeToHTML).join("");
  return `<${node.type}${attrs ? " " + attrs : ""}>${children}</${node.type}>`;
}

// 使用：
const StringReconciler = createReconciler(StringHostConfig);
const html = StringReconciler.renderToString(<App />);
// 输出：<div class="app"><h1>Hello</h1></div>
```

### ✅ 验证标准

- [ ] 代码结构清晰分离：API 层 vs 协调引擎 vs 平台操作
- [ ] Dispatcher 模式正确工作：Hook 在不同阶段使用不同实现
- [ ] 组件外调用 Hook 时 Dispatcher 能给出明确错误提示
- [ ] HostConfig 接口覆盖 Render 和 Commit 两个阶段的操作
- [ ] Reconciler 不包含任何 `document.xxx` 调用
- [ ] Custom String Renderer 能将组件树渲染为 HTML 字符串
- [ ] Demo：同一个 App 组件分别用 DOM Renderer 和 String Renderer 渲染

### 🔗 React 源码参考

- [`react/src/ReactHooks.js`](https://github.com/facebook/react/blob/main/packages/react/src/ReactHooks.js) — Hook API 转发层
- [`react/src/ReactCurrentDispatcher.js`](https://github.com/facebook/react/blob/main/packages/react/src/ReactCurrentDispatcher.js) — Dispatcher 指针
- [`react-reconciler/src/ReactFiberHooks.js`](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberHooks.js) — Hook 真正实现（含 Mount/Update dispatcher）
- [`react-dom/src/client/ReactDOMHostConfig.js`](https://github.com/nicolo-ribaudo/react/blob/main/packages/react-dom-bindings/src/client/ReactDOMHostConfig.js) — DOM 平台的 HostConfig 实现

---

## Phase 11：Concurrent Mode (并发模式)

### 🎯 学习目标

实现 React 最先进的特性：**时间切片 (Time Slicing)**、**优先级调度 (Scheduler)** 和 **Suspense**。
让高优先级任务（如用户输入）打断低优先级任务（如大数据渲染），并理解 **Lane 模型** 的位运算基础。

### 📚 核心概念

#### 1. Scheduler (调度器)

Scheduler 是**独立于 React 的任务调度包**（`scheduler` npm 包），管理任务的优先级和执行时机。

```
Scheduler 核心设计：
1. 使用 MessageChannel（而非 setTimeout/requestIdleCallback）实现宏任务调度
   - setTimeout 有 4ms 最小延迟
   - requestIdleCallback 兼容性差，且不保证执行
   - MessageChannel 无最小延迟，且在每帧结束时可靠触发

2. 任务队列使用最小堆（Min Heap），按 expirationTime 排序
   - 保证高优先级任务总是先出队
   - 插入和取出都是 O(log n)

3. 时间切片：每个工作循环最多执行 5ms，然后交还控制权给浏览器
```

**为什么用最小堆而不是简单排序？**

- 任务不断插入和取出，需要高效的优先级队列
- 最小堆：插入 O(log n)，取最小值 O(1)，删除最小值 O(log n)
- 简单数组排序：每次插入后排序 O(n log n)

#### 2. Update Priority (优先级) 与 Task 过期

```
优先级级别：                    对应超时时间：
- ImmediatePriority (最高)     → -1ms  (已过期，立即执行)
- UserBlockingPriority         → 250ms (点击、输入)
- NormalPriority               → 5000ms (数据获取)
- LowPriority                  → 10000ms (统计上报)
- IdlePriority (最低)          → maxSafeInteger (永不过期)

饥饿保护机制：
每个 task 有 expirationTime = startTime + timeout
当 currentTime >= expirationTime 时，任务"过期"
→ 过期任务被视为同步任务，必须立即执行
→ 防止低优先级任务被无限延迟（"饿死"）
```

#### 3. Lane 模型 —— React 18 的优先级表示

Lane 使用**二进制位掩码**表示优先级，替代了 React 16 的 `expirationTime`。

```js
// Lane 常量定义（二进制位掩码）
const NoLanes = 0b0000000000000000000000000000000;
const SyncLane = 0b0000000000000000000000000000001; // 最高：同步更新
const InputContinuousLane = 0b0000000000000000000000000000100; // 连续输入（scroll）
const DefaultLane = 0b0000000000000000000000000010000; // 默认优先级
const TransitionLanes = 0b0000000000000000011111111000000; // 过渡更新（多个 lane）
const IdleLane = 0b0100000000000000000000000000000; // 空闲

// Lane 操作（位运算）
function mergeLanes(a, b) {
  return a | b;
} // 合并
function isSubsetOfLanes(set, subset) {
  return (set & subset) === subset;
} // 包含
function pickLanes(lanes) {
  return lanes & -lanes;
} // 取最高优先级的 lane
function removeLanes(set, subset) {
  return set & ~subset;
} // 移除
```

**为什么用位掩码替代 expirationTime？**

- 多个相同优先级的更新可以在同一个 Lane "批处理"
- 位运算操作极快（合并、比较、移除都是 O(1)）
- `TransitionLanes` 是一组 lane，可以给每个 `startTransition` 分配不同的 lane，避免冲突
- 可以精确表达"这次渲染只处理 SyncLane 和 DefaultLane 的更新"

#### 4. 渲染中断与恢复

```
中断流程：
1. workLoop 中 shouldYield() 返回 true
2. 保留当前 nextUnitOfWork（指向中断处的 Fiber）
3. 退出 workLoop，将控制权交还浏览器
4. 浏览器处理事件、绘制、布局等
5. 下一个 MessageChannel 回调到达
6. 从 nextUnitOfWork 继续执行（不是从头开始！）

重要：
- Render 阶段可以中断和恢复，因为它是纯计算（无副作用）
- Commit 阶段不可中断，必须一次完成（否则用户看到不一致的 DOM）
- 如果中断期间来了更高优先级的更新 → 丢弃当前 WIP 树，从头开始
```

#### 5. Suspense 机制

**Suspense 是 Concurrent Mode 的灵魂特性** —— 让组件可以"等待"异步数据。

```
Suspense 工作原理：
1. 数据未就绪时，组件 throw 一个 Promise
2. React 捕获这个 Promise（在 renderWithHooks 的 try/catch 中）
3. 向上查找最近的 <Suspense> boundary
4. 显示 fallback UI
5. 当 Promise resolve 后，React 重新渲染被挂起的子树

关键：throw Promise 不是 Error！
这是一种"信号机制"—— 告诉 React："数据还没准备好，请稍后再试"。
```

```jsx
// 使用示例
<Suspense fallback={<Loading />}>
  <UserProfile userId={1} />
</Suspense>;

// UserProfile 内部
function UserProfile({ userId }) {
  const user = readData(userId); // 数据未就绪时 throw Promise
  return <div>{user.name}</div>;
}
```

### 📋 实现任务

#### 11.1 实现 Scheduler（含最小堆）

```js
// scheduler.js

// ===== 最小堆实现 =====
function push(heap, node) {
  heap.push(node);
  siftUp(heap, node, heap.length - 1);
}

function peek(heap) {
  return heap.length > 0 ? heap[0] : null;
}

function pop(heap) {
  if (heap.length === 0) return null;
  const first = heap[0];
  const last = heap.pop();
  if (last !== first) {
    heap[0] = last;
    siftDown(heap, last, 0);
  }
  return first;
}

function siftUp(heap, node, i) {
  while (i > 0) {
    const parentIndex = (i - 1) >>> 1;
    const parent = heap[parentIndex];
    if (compare(parent, node) > 0) {
      heap[parentIndex] = node;
      heap[i] = parent;
      i = parentIndex;
    } else {
      return;
    }
  }
}

function siftDown(heap, node, i) {
  const length = heap.length;
  const halfLength = length >>> 1;
  while (i < halfLength) {
    const leftIndex = (i + 1) * 2 - 1;
    const rightIndex = leftIndex + 1;
    const left = heap[leftIndex];
    const right = rightIndex < length ? heap[rightIndex] : null;

    if (compare(left, node) < 0) {
      if (right !== null && compare(right, left) < 0) {
        heap[i] = right;
        heap[rightIndex] = node;
        i = rightIndex;
      } else {
        heap[i] = left;
        heap[leftIndex] = node;
        i = leftIndex;
      }
    } else if (right !== null && compare(right, node) < 0) {
      heap[i] = right;
      heap[rightIndex] = node;
      i = rightIndex;
    } else {
      return;
    }
  }
}

function compare(a, b) {
  const diff = a.expirationTime - b.expirationTime;
  return diff !== 0 ? diff : a.id - b.id; // 相同过期时间，先入先出
}

// ===== Scheduler 主逻辑 =====
const taskQueue = []; // 最小堆
let taskIdCounter = 0;
let isMessageLoopRunning = false;
let yieldInterval = 5; // 5ms 时间切片
let deadline = 0;

// 优先级对应的超时时间
const IMMEDIATE_PRIORITY_TIMEOUT = -1;
const USER_BLOCKING_PRIORITY_TIMEOUT = 250;
const NORMAL_PRIORITY_TIMEOUT = 5000;
const LOW_PRIORITY_TIMEOUT = 10000;
const IDLE_PRIORITY_TIMEOUT = 1073741823; // maxSafeInteger

function shouldYield() {
  return performance.now() >= deadline;
}

function scheduleCallback(priorityLevel, callback) {
  const currentTime = performance.now();
  const timeout = getTimeoutByPriority(priorityLevel);
  const expirationTime = currentTime + timeout;

  const newTask = {
    id: taskIdCounter++,
    callback,
    priorityLevel,
    expirationTime,
  };

  push(taskQueue, newTask);
  requestHostCallback();
  return newTask;
}

// 使用 MessageChannel 实现宏任务调度
const channel = new MessageChannel();
const port = channel.port2;

channel.port1.onmessage = () => {
  isMessageLoopRunning = true;
  deadline = performance.now() + yieldInterval;

  let currentTask = peek(taskQueue);
  while (currentTask !== null) {
    // 未过期 + 应该让出 → 暂停
    if (currentTask.expirationTime > performance.now() && shouldYield()) {
      break;
    }

    const callback = currentTask.callback;
    if (typeof callback === "function") {
      currentTask.callback = null;
      const continuationCallback = callback(shouldYield);
      if (typeof continuationCallback === "function") {
        // 任务未完成，保留在队列中
        currentTask.callback = continuationCallback;
      } else {
        pop(taskQueue);
      }
    } else {
      pop(taskQueue);
    }
    currentTask = peek(taskQueue);
  }

  isMessageLoopRunning = false;
  // 如果还有任务，继续调度
  if (peek(taskQueue) !== null) {
    requestHostCallback();
  }
};

function requestHostCallback() {
  if (!isMessageLoopRunning) {
    port.postMessage(null);
  }
}
```

#### 11.2 实现 Lane 模型

```js
// lanes.js
const NoLanes = 0b0000000;
const SyncLane = 0b0000001;
const DefaultLane = 0b0010000;
const TransitionLane1 = 0b0100000;
const TransitionLane2 = 0b1000000;
const IdleLane = 0b10000000;

function mergeLanes(a, b) {
  return a | b;
}
function pickLanes(lanes) {
  return lanes & -lanes;
} // 最低位的 1
function removeLanes(set, subset) {
  return set & ~subset;
}
function includesLanes(set, subset) {
  return (set & subset) !== 0;
}

// 根据事件类型分配 Lane
function requestUpdateLane() {
  // 在 transition 回调内 → TransitionLane
  if (isInsideTransition) return claimNextTransitionLane();
  // 用户交互事件 → SyncLane
  if (isUserBlockingEvent) return SyncLane;
  // 默认
  return DefaultLane;
}

// 为每个 transition 分配不同的 lane，避免冲突
let nextTransitionLane = TransitionLane1;
function claimNextTransitionLane() {
  const lane = nextTransitionLane;
  nextTransitionLane <<= 1; // 移到下一个 lane 位
  if (nextTransitionLane > TransitionLane2) {
    nextTransitionLane = TransitionLane1; // 循环复用
  }
  return lane;
}
```

#### 11.3 实现 `useTransition` 与 `useDeferredValue`

```js
function useTransition() {
  const [isPending, setPending] = useState(false);

  const startTransition = useCallback((callback) => {
    setPending(true);

    // 标记后续更新为 TransitionLane（低优先级）
    const prevTransition = currentTransition;
    currentTransition = {};

    try {
      callback();
    } finally {
      currentTransition = prevTransition;
      // isPending 的重置在 transition 完成后自动发生
      setPending(false);
    }
  }, []);

  return [isPending, startTransition];
}

function useDeferredValue(value) {
  const [deferredValue, setDeferredValue] = useState(value);

  useEffect(() => {
    // 以低优先级更新 deferred 值
    startTransition(() => {
      setDeferredValue(value);
    });
  }, [value]);

  return deferredValue;
}
```

#### 11.4 实现 Suspense 机制

```js
// 在渲染过程中捕获 thrown Promise
function renderWithHooks(current, workInProgress, Component) {
  try {
    const children = Component(workInProgress.pendingProps);
    return children;
  } catch (thrownValue) {
    if (isPromise(thrownValue)) {
      // 🔑 这是 Suspense 信号，不是真正的错误
      handleSuspense(workInProgress, thrownValue);
    } else {
      // 真正的错误 → Error Boundary 处理
      throw thrownValue;
    }
  }
}

function handleSuspense(fiber, thenable) {
  // 1. 向上查找最近的 Suspense boundary
  let boundary = fiber.return;
  while (boundary !== null) {
    if (boundary.tag === SuspenseComponent) {
      // 2. 标记为需要显示 fallback
      boundary.flags |= ShouldSuspend;
      boundary.updateQueue = thenable;

      // 3. 注册 Promise 回调 → resolve 后重新调度渲染
      thenable.then(() => {
        // Promise 完成，重新触发渲染
        scheduleUpdateOnFiber(boundary);
      });

      return;
    }
    boundary = boundary.return;
  }

  throw new Error("Missing Suspense boundary");
}

// Suspense 组件的渲染逻辑
function updateSuspenseComponent(current, workInProgress) {
  const didSuspend = (workInProgress.flags & ShouldSuspend) !== 0;

  if (didSuspend) {
    // 显示 fallback
    const fallback = workInProgress.pendingProps.fallback;
    reconcileChildren(current, workInProgress, fallback);
  } else {
    // 正常渲染 children
    const children = workInProgress.pendingProps.children;
    reconcileChildren(current, workInProgress, children);
  }

  return workInProgress.child;
}
```

#### 11.5 改造 Work Loop 支持时间切片

```js
function workLoopConcurrent() {
  // 在 shouldYield 返回 true 时暂停
  while (nextUnitOfWork !== null && !shouldYield()) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
  }
}

function workLoopSync() {
  // 同步模式：不检查 shouldYield，一口气完成
  while (nextUnitOfWork !== null) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
  }
}

function performConcurrentWorkOnRoot(root) {
  // 确定本次渲染要处理的 lanes
  const lanes = getNextLanes(root);

  if (includesLanes(lanes, SyncLane)) {
    // 同步优先级 → 不中断
    workLoopSync();
  } else {
    // 并发优先级 → 可中断
    workLoopConcurrent();
  }

  // 如果还有未完成的工作（被中断了）
  if (nextUnitOfWork !== null) {
    // 交还控制权，等下次调度继续
    return performConcurrentWorkOnRoot.bind(null, root);
  }

  // 所有工作完成，进入 commit
  commitRoot(root);
  return null;
}
```

### ✅ 验证标准

- [ ] Scheduler 最小堆正确排序：高优先级任务先执行
- [ ] 时间切片生效：渲染大列表时 `shouldYield()` 能暂停执行
- [ ] 渲染中断后能从断点恢复（而非从头开始）
- [ ] Task 过期后被强制同步执行（饥饿保护）
- [ ] Lane 位运算正确：`mergeLanes`, `pickLanes`, `removeLanes`
- [ ] `startTransition` 中的更新以低优先级执行
- [ ] `useDeferredValue` 延迟更新不阻塞用户输入
- [ ] Suspense：throw Promise 后显示 fallback，resolve 后恢复正常渲染
- [ ] 高优先级更新能打断正在进行的低优先级渲染
- [ ] Demo 1：大列表搜索 + `startTransition`（输入不卡顿）
- [ ] Demo 2：Suspense + 模拟数据加载（loading → content）
- [ ] Demo 3：渲染 10000 个节点 + 动画不掉帧（对比 sync vs concurrent）

### 🔗 React 源码参考

- [`scheduler/src/Scheduler.js`](https://github.com/facebook/react/blob/main/packages/scheduler/src/forks/Scheduler.js) — Scheduler 主逻辑
- [`scheduler/src/SchedulerMinHeap.js`](https://github.com/facebook/react/blob/main/packages/scheduler/src/SchedulerMinHeap.js) — 最小堆实现
- [`react-reconciler/src/ReactFiberLane.js`](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberLane.js) — Lane 模型
- [`react-reconciler/src/ReactFiberThrow.js`](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberThrow.js) — Suspense 捕获逻辑
- [`react-reconciler/src/ReactFiberWorkLoop.js`](https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiberWorkLoop.js) — 并发 Work Loop

---

## 实施路线图

```
Phase 1 ── Phase 2 ── Phase 3 ── Phase 4 ── Phase 5 ── Phase 6 ─── Phase 7 ── Phase 7b ── Phase 8
VNode       JSX       Diffing    Component   useState   useEffect    Events     Context     Fiber
(基石)     (语法)     (性能)      (抽象)      (状态)    +useRef       (交互)    +Memo       (基础)
                                                       +useReducer             +useMemo
                                                                               +useCallback

   ┌───────────────────────────────────────────────────────────────────────────────────────────┘
   ↓
Phase 9 ───────── Phase 10 ──────── Phase 11
DeepFiber          ThreeLayer         Concurrent
+beginWork          +Dispatcher        +Scheduler (MinHeap)
+completeWork       +HostConfig        +Lane Model
+Bailout            +CustomRenderer    +Suspense
+ErrorBoundary                         +useTransition
   ↑                   ↑                  ↑
  进阶                架构                挑战
```

### 预计时间

| 阶段     | 预计耗时 | 难度       | 核心内容                                  |
| -------- | -------- | ---------- | ----------------------------------------- |
| Phase 1  | 1-2 小时 | ⭐⭐       | VNode 数据结构                            |
| Phase 2  | 30 分钟  | ⭐         | JSX 转换                                  |
| Phase 3  | 2-3 小时 | ⭐⭐⭐     | Reconciliation / Diffing                  |
| Phase 4  | 1-2 小时 | ⭐⭐       | 函数式组件                                |
| Phase 5  | 2-3 小时 | ⭐⭐⭐⭐   | useState Hook                             |
| Phase 6  | 2-3 小时 | ⭐⭐⭐     | useEffect + useRef + useReducer           |
| Phase 7  | 1-2 小时 | ⭐⭐       | 事件委托系统                              |
| Phase 7b | 2-3 小时 | ⭐⭐⭐     | Context + useMemo/useCallback + memo      |
| Phase 8  | 3-4 小时 | ⭐⭐⭐⭐⭐ | Fiber 基础架构                            |
| Phase 9  | 4-5 小时 | ⭐⭐⭐⭐⭐ | Fiber 深入 + Bailout + Error Boundary     |
| Phase 10 | 3-4 小时 | ⭐⭐⭐⭐   | Dispatcher + HostConfig + Custom Renderer |
| Phase 11 | 6-8 小时 | ⭐⭐⭐⭐⭐ | Scheduler + Lane + Suspense + Concurrent  |

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

| 资源                                                                                                                                          | 说明                          |
| --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| [Build your own React](https://pomb.us/build-your-own-react/)                                                                                 | Rodrigo Pombo 的经典教程      |
| [React Source Code](https://github.com/facebook/react)                                                                                        | React 官方源码                |
| [React Fiber Architecture](https://github.com/acdlite/react-fiber-architecture)                                                               | Andrew Clark 的 Fiber 说明    |
| [Inside Fiber: in-depth overview](https://indepth.dev/posts/1008/inside-fiber-in-depth-overview-of-the-new-reconciliation-algorithm-in-react) | Fiber 深度解析                |
| [React hooks: not magic, just arrays](https://medium.com/@ryardley/react-hooks-not-magic-just-arrays-cd4f1857236e)                            | Hooks 原理图解                |
| [A Complete Guide to useEffect](https://overreacted.io/a-complete-guide-to-useeffect/)                                                        | Dan Abramov 的 useEffect 指南 |
| [React 18 Lane Model](https://github.com/nicolo-ribaudo/react/blob/main/packages/react-reconciler/src/ReactFiberLane.js)                      | Lane 模型源码                 |

---

## 准备好了吗？

/**
 * Phase 4 Playground — 函数式组件
 *
 * 🎯 目标：验证函数式组件的核心能力
 *   1. 函数组件正确渲染
 *   2. Props 正确传递
 *   3. children prop 正确传递
 *   4. 组件可以嵌套使用
 *   5. 函数组件参与 reconcile 的更新（点按钮触发重渲染）
 *
 * 💡 打开 DevTools → Elements 面板，观察：
 *    - 函数组件不产生额外 DOM 节点
 *    - 更新时只修改变化的部分
 */

import MiniReact from "../mini-react/index.js";
const { createElement, createRoot } = MiniReact;

// ─── 状态模拟（Phase 5 才会有 useState） ─────────────────────

let count = 0;
let userName = "Mini-React";

// ─── 函数式组件定义 ──────────────────────────────────────────

/**
 * Badge — 简单的标签组件
 * 演示：基本 props 传递
 */
function Badge(props) {
  return createElement(
    "span",
    {
      style: {
        display: "inline-block",
        padding: "0.25rem 0.75rem",
        borderRadius: "999px",
        fontSize: "0.8rem",
        fontWeight: "600",
        background: props.color || "#7c5cff",
        color: "#fff",
      },
    },
    props.text,
  );
}

/**
 * Card — 卡片容器组件
 * 演示：children prop（通过 props.children 渲染子元素）
 */
function Card(props) {
  return createElement(
    "div",
    {
      style: {
        padding: "1.5rem",
        background: "#1a1a2e",
        borderRadius: "12px",
        marginBottom: "1.5rem",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
      },
    },
    // 如果有 title prop，渲染标题
    props.title
      ? createElement("h2", { style: { marginBottom: "1rem" } }, props.title)
      : null,
    // 渲染 children — 这是 props.children 的核心用法
    ...props.children,
  );
}

/**
 * Greeting — 问候组件
 * 演示：props 驱动内容变化
 */
function Greeting(props) {
  return createElement(
    "div",
    null,
    createElement(
      "h2",
      { style: { color: "#7c5cff", marginBottom: "0.5rem" } },
      `Hello, ${props.name}! 👋`,
    ),
    createElement(
      "p",
      { style: { color: "#a0a0b0" } },
      "这是一个函数式组件，接收 name prop 渲染问候语。",
    ),
  );
}

/**
 * Counter — 计数器展示组件
 * 演示：组件复用 + 动态信息展示
 */
function Counter(props) {
  return createElement(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        gap: "1rem",
      },
    },
    createElement(
      "span",
      { style: { fontSize: "2rem", fontWeight: "bold", color: "#7c5cff" } },
      `${props.value}`,
    ),
    createElement(Badge, { text: props.label || "count", color: "#5e5eff" }),
  );
}

/**
 * InfoList — 信息列表组件
 * 演示：数组 props + 嵌套渲染
 */
function InfoList(props) {
  return createElement(
    "ul",
    {
      style: {
        listStyle: "none",
        padding: 0,
        margin: 0,
      },
    },
    ...props.items.map((item) =>
      createElement(
        "li",
        {
          style: {
            padding: "0.5rem 0",
            borderBottom: "1px solid #2a2a4a",
            color: "#c0c0d0",
          },
        },
        item,
      ),
    ),
  );
}

/**
 * Header — 页面头部组件
 * 演示：组件组合 — 在一个组件中使用其他组件
 */
function Header(props) {
  return createElement(
    "div",
    {
      style: {
        marginBottom: "2rem",
        paddingBottom: "1rem",
        borderBottom: "2px solid #2a2a4a",
      },
    },
    createElement(
      "h1",
      { style: { color: "#7c5cff", marginBottom: "0.5rem" } },
      props.title,
    ),
    createElement("p", { style: { color: "#a0a0b0" } }, props.subtitle),
    createElement(
      "div",
      { style: { marginTop: "0.75rem", display: "flex", gap: "0.5rem" } },
      createElement(Badge, { text: "Phase 4", color: "#7c5cff" }),
      createElement(Badge, { text: "函数式组件", color: "#4ade80" }),
      createElement(Badge, { text: "Props", color: "#f59e0b" }),
    ),
  );
}

/**
 * Footer — 页脚组件
 * 演示：简单的静态组件
 */
function Footer() {
  return createElement(
    "div",
    {
      style: {
        marginTop: "2rem",
        padding: "1rem",
        background: "#141428",
        borderRadius: "8px",
        textAlign: "center",
        color: "#666",
        fontSize: "0.85rem",
      },
    },
    createElement("p", null, "🔬 Mini-React — Phase 4: 函数式组件"),
    createElement(
      "p",
      { style: { marginTop: "0.25rem" } },
      "Components are just functions that return VNodes",
    ),
  );
}

/**
 * App — 根组件
 * 演示：最重要的组件组合 — 一个组件中使用多个子组件，层层嵌套
 */
function App(props) {
  return createElement(
    "div",
    {
      id: "app",
      style: { padding: "2rem" },
    },
    // 使用 Header 组件
    createElement(Header, {
      title: "🔬 Mini-React Phase 4: 函数式组件",
      subtitle: "组件就是函数 — 接收 props，返回 VNode",
    }),

    // 使用 Card + Greeting 组件嵌套
    createElement(
      Card,
      { title: "👋 问候组件 — Props 传递" },
      createElement(Greeting, { name: props.userName }),
    ),

    // 使用 Card + Counter 组件嵌套
    createElement(
      Card,
      { title: "⏱ 计数器 — 组件复用" },
      createElement(Counter, { value: props.count, label: "clicks" }),
      createElement(
        "p",
        { style: { color: "#888", fontSize: "0.85rem", marginTop: "0.75rem" } },
        "💡 Counter 组件内部使用了 Badge 组件 — 这就是组件嵌套",
      ),
    ),

    // 使用 Card + InfoList 嵌套
    createElement(
      Card,
      { title: "📋 信息列表 — 数组 Props" },
      createElement(InfoList, {
        items: [
          "✅ 函数式组件正确渲染",
          "✅ Props 正确传递（name, count, items）",
          "✅ children prop 正确传递（Card 的子元素）",
          "✅ 组件可以嵌套使用（Counter 内含 Badge）",
          "✅ 组件参与 reconcile 更新",
        ],
      }),
    ),

    // ── 操作按钮区 ──
    createElement(
      "div",
      {
        style: {
          display: "flex",
          gap: "0.75rem",
          flexWrap: "wrap",
          marginTop: "1rem",
        },
      },
      makeButton("➕ Count +1", "increment"),
      makeButton("➖ Count -1", "decrement"),
      makeButton("✏️ 改名", "changeName"),
      makeButton("💣 卸载", "unmount"),
    ),

    // 页脚
    createElement(Footer),
  );
}

// ─── 按钮工厂（Phase 7 之前先用原生事件） ──────────────────

function makeButton(label, actionId) {
  return createElement(
    "button",
    {
      id: `btn-${actionId}`,
      style: {
        padding: "0.6rem 1.2rem",
        border: "none",
        borderRadius: "8px",
        background: "#7c5cff",
        color: "#fff",
        cursor: "pointer",
        fontSize: "0.9rem",
        fontWeight: "600",
      },
    },
    label,
  );
}

// ─── 挂载 ───────────────────────────────────────────────────

const root = createRoot(document.getElementById("root"));

function renderApp() {
  root.render(createElement(App, { count, userName }));
}

renderApp();

// ─── 交互（直接绑定原生事件，Phase 7 才会用事件委托） ─────────

const names = ["Mini-React", "World", "Functional Components", "Rex", "VNode"];
let nameIndex = 0;

document.addEventListener("click", (e) => {
  const id = e.target.id;
  switch (id) {
    case "btn-increment":
      count++;
      renderApp();
      break;
    case "btn-decrement":
      count--;
      renderApp();
      break;
    case "btn-changeName":
      nameIndex = (nameIndex + 1) % names.length;
      userName = names[nameIndex];
      renderApp();
      break;
    case "btn-unmount":
      root.unmount();
      break;
  }
});

console.log("🔬 Phase 4 已启动 — 函数式组件");
console.log("💡 打开 DevTools 观察：函数组件不产生额外 DOM 节点");

/**
 * Phase 5 Playground — useState Hook
 *
 * 🎯 目标：验证 useState 的核心能力
 *   1. 基本状态管理（Counter）
 *   2. 函数式更新
 *   3. 多个 useState
 *   4. 简易 Todo List（添加/删除）
 *
 * 💡 Phase 5 开始，组件真正"活"了起来 ——
 *    不再需要手动重新 render，setState 自动触发更新！
 */

import MiniReact from "../mini-react/index.js";
const { createElement, createRoot, useState } = MiniReact;

// ─── 组件定义 ────────────────────────────────────────────────

/**
 * Counter — 计数器
 * 演示：基本的 useState + setState
 */
function Counter() {
  const [count, setCount] = useState(0);

  return createElement(
    "div",
    {
      style: {
        padding: "1.5rem",
        background: "#1a1a2e",
        borderRadius: "12px",
        marginBottom: "1.5rem",
      },
    },
    createElement("h2", { style: { marginBottom: "1rem" } }, "⏱ Counter"),
    createElement(
      "div",
      { style: { display: "flex", alignItems: "center", gap: "1rem" } },
      createElement(
        "span",
        {
          style: {
            fontSize: "2.5rem",
            fontWeight: "bold",
            color: "#7c5cff",
            minWidth: "80px",
            textAlign: "center",
          },
        },
        `${count}`,
      ),
      createElement(
        "button",
        {
          onClick: () => setCount((prev) => prev + 1),
          style: btnStyle(),
        },
        "➕",
      ),
      createElement(
        "button",
        {
          onClick: () => setCount((prev) => prev - 1),
          style: btnStyle(),
        },
        "➖",
      ),
      createElement(
        "button",
        {
          onClick: () => setCount(0),
          style: btnStyle("#ef4444"),
        },
        "🔄 Reset",
      ),
    ),
    createElement(
      "p",
      { style: { color: "#888", fontSize: "0.85rem", marginTop: "0.75rem" } },
      "💡 每次点击只有数字更新，DOM 节点被复用（打开 DevTools 验证）",
    ),
  );
}

/**
 * MultiState — 多状态演示
 * 演示：同一组件中多个 useState 独立工作
 */
function MultiState() {
  const [name, setName] = useState("Mini-React");
  const [color, setColor] = useState("#7c5cff");
  const [size, setSize] = useState(24);

  const colors = ["#7c5cff", "#4ade80", "#f59e0b", "#ef4444", "#3b82f6"];
  const names = ["Mini-React", "World", "Hooks", "useState", "Rex"];

  return createElement(
    "div",
    {
      style: {
        padding: "1.5rem",
        background: "#1a1a2e",
        borderRadius: "12px",
        marginBottom: "1.5rem",
      },
    },
    createElement("h2", { style: { marginBottom: "1rem" } }, "🎛 Multi-State"),
    createElement(
      "p",
      {
        style: {
          color: color,
          fontSize: `${size}px`,
          fontWeight: "bold",
          marginBottom: "1rem",
          transition: "all 0.2s",
        },
      },
      `Hello, ${name}!`,
    ),
    createElement(
      "div",
      { style: { display: "flex", gap: "0.5rem", flexWrap: "wrap" } },
      createElement(
        "button",
        {
          onClick: () => {
            const idx = (names.indexOf(name) + 1) % names.length;
            setName(names[idx]);
          },
          style: btnStyle(),
        },
        "✏️ Change Name",
      ),
      createElement(
        "button",
        {
          onClick: () => {
            const idx = (colors.indexOf(color) + 1) % colors.length;
            setColor(colors[idx]);
          },
          style: btnStyle(),
        },
        "🎨 Change Color",
      ),
      createElement(
        "button",
        {
          onClick: () => setSize((prev) => Math.min(prev + 4, 48)),
          style: btnStyle(),
        },
        "🔼 Bigger",
      ),
      createElement(
        "button",
        {
          onClick: () => setSize((prev) => Math.max(prev - 4, 12)),
          style: btnStyle(),
        },
        "🔽 Smaller",
      ),
    ),
    createElement(
      "p",
      { style: { color: "#888", fontSize: "0.85rem", marginTop: "0.75rem" } },
      "💡 3 个独立的 useState：name、color、size，互不干扰",
    ),
  );
}

/**
 * TodoList — 简易待办
 * 演示：数组状态 + 函数式更新
 */
function TodoList() {
  const [todos, setTodos] = useState([
    { id: 1, text: "学习 Virtual DOM", done: true },
    { id: 2, text: "实现 Reconciler", done: true },
    { id: 3, text: "实现 useState", done: false },
  ]);
  const [nextId, setNextId] = useState(4);

  return createElement(
    "div",
    {
      style: {
        padding: "1.5rem",
        background: "#1a1a2e",
        borderRadius: "12px",
        marginBottom: "1.5rem",
      },
    },
    createElement("h2", { style: { marginBottom: "1rem" } }, "📋 Todo List"),
    createElement(
      "ul",
      { style: { listStyle: "none", padding: 0 } },
      ...todos.map((todo) =>
        createElement(
          "li",
          {
            key: todo.id,
            style: {
              padding: "0.75rem 1rem",
              marginBottom: "0.5rem",
              background: "#252545",
              borderRadius: "8px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              textDecoration: todo.done ? "line-through" : "none",
              opacity: todo.done ? "0.6" : "1",
            },
          },
          createElement(
            "span",
            {
              onClick: () =>
                setTodos((prev) =>
                  prev.map((t) =>
                    t.id === todo.id ? { ...t, done: !t.done } : t,
                  ),
                ),
              style: { cursor: "pointer", flex: 1 },
            },
            `${todo.done ? "✅" : "⬜"} ${todo.text}`,
          ),
          createElement(
            "button",
            {
              onClick: () =>
                setTodos((prev) => prev.filter((t) => t.id !== todo.id)),
              style: {
                ...btnStyle("#ef4444"),
                padding: "0.3rem 0.6rem",
                fontSize: "0.8rem",
              },
            },
            "🗑",
          ),
        ),
      ),
    ),
    createElement(
      "div",
      { style: { display: "flex", gap: "0.5rem", marginTop: "0.5rem" } },
      createElement(
        "button",
        {
          onClick: () => {
            setTodos((prev) => [
              ...prev,
              { id: nextId, text: `New Todo #${nextId}`, done: false },
            ]);
            setNextId((prev) => prev + 1);
          },
          style: btnStyle(),
        },
        "➕ Add Todo",
      ),
      createElement(
        "button",
        {
          onClick: () => setTodos((prev) => prev.filter((t) => !t.done)),
          style: btnStyle("#f59e0b"),
        },
        "🧹 Clear Done",
      ),
    ),
    createElement(
      "p",
      { style: { color: "#888", fontSize: "0.85rem", marginTop: "0.75rem" } },
      `💡 共 ${todos.length} 项，已完成 ${todos.filter((t) => t.done).length} 项`,
    ),
  );
}

/**
 * App — 根组件
 */
function App() {
  return createElement(
    "div",
    { id: "app", style: { padding: "2rem" } },
    createElement(
      "h1",
      { style: { color: "#7c5cff", marginBottom: "0.5rem" } },
      "🔬 Mini-React Phase 5: useState Hook",
    ),
    createElement(
      "p",
      { style: { color: "#a0a0b0", marginBottom: "2rem" } },
      "Hooks 让函数组件拥有了状态 — setState 自动触发更新！",
    ),
    createElement(Counter),
    createElement(MultiState),
    createElement(TodoList),
    // 验证清单
    createElement(
      "div",
      {
        style: {
          marginTop: "1rem",
          padding: "1rem",
          background: "#141428",
          borderRadius: "8px",
          fontSize: "0.9rem",
          lineHeight: "1.8",
        },
      },
      createElement(
        "h3",
        { style: { marginBottom: "0.5rem" } },
        "✅ Phase 5 验证清单",
      ),
      createElement("p", null, "• useState 返回 [state, setState]"),
      createElement("p", null, "• setState 触发组件重新渲染"),
      createElement("p", null, "• setState(prev => ...) 函数式更新正确"),
      createElement("p", null, "• 多个 useState 独立工作"),
      createElement("p", null, "• 同一事件中多次 setState 被批处理"),
      createElement("p", null, "• Todo List 添加/删除/切换状态正常"),
    ),
  );
}

// ─── 辅助 ───────────────────────────────────────────────────

function btnStyle(bg = "#7c5cff") {
  return {
    padding: "0.5rem 1rem",
    border: "none",
    borderRadius: "8px",
    background: bg,
    color: "#fff",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: "600",
  };
}

// ─── 挂载 ───────────────────────────────────────────────────

const root = createRoot(document.getElementById("root"));
root.render(createElement(App));

console.log("🔬 Phase 5 已启动 — useState Hook");
console.log("💡 现在按钮可以直接修改状态，不需要手动 rerender 了！");

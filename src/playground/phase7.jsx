/**
 * Phase 7 Playground — 事件委托系统
 *
 * 🎯 目标：验证事件系统的核心能力
 *   1. 事件委托机制（root 统一监听）
 *   2. 事件冒泡行为
 *   3. 多种事件类型（click / input / keydown / submit）
 *   4. 动态元素的事件处理
 *
 * 💡 Phase 7 让事件处理从 O(n) 降到 O(1) ——
 *    所有事件监听器都委托到 root 容器上！
 */

import MiniReact from "../mini-react/index.js";
const { createElement, createRoot, useState, useEffect, useRef } = MiniReact;

// ─── Demo 1: 事件冒泡可视化 ─────────────────────────────────

/**
 * BubbleDemo — 事件冒泡可视化
 * 点击内层元素，观察事件从内到外逐层冒泡
 */
function BubbleDemo() {
  const [log, setLog] = useState([]);

  const logEvent = (layer) => {
    setLog((prev) => [...prev.slice(-5), `🫧 ${layer} handled click`]);
  };

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
    createElement(
      "h2",
      { style: { marginBottom: "1rem" } },
      "🫧 事件冒泡可视化",
    ),
    createElement(
      "div",
      {
        onClick: () => logEvent("Outer (div)"),
        style: {
          padding: "2rem",
          background: "rgba(124, 92, 255, 0.1)",
          border: "2px solid rgba(124, 92, 255, 0.3)",
          borderRadius: "12px",
          textAlign: "center",
          cursor: "pointer",
        },
      },
      createElement(
        "p",
        {
          style: { color: "#888", fontSize: "0.8rem", marginBottom: "0.75rem" },
        },
        "Outer div — onClick",
      ),
      createElement(
        "div",
        {
          onClick: () => logEvent("Middle (div)"),
          style: {
            padding: "1.5rem",
            background: "rgba(245, 158, 11, 0.1)",
            border: "2px solid rgba(245, 158, 11, 0.3)",
            borderRadius: "8px",
            cursor: "pointer",
          },
        },
        createElement(
          "p",
          {
            style: {
              color: "#888",
              fontSize: "0.8rem",
              marginBottom: "0.75rem",
            },
          },
          "Middle div — onClick",
        ),
        createElement(
          "button",
          {
            onClick: () => logEvent("Button (inner)"),
            style: {
              padding: "0.75rem 1.5rem",
              border: "none",
              borderRadius: "8px",
              background: "#4ade80",
              color: "#0f0f1a",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: "700",
            },
          },
          "🎯 Click Me!",
        ),
      ),
    ),
    createElement(
      "div",
      {
        style: {
          marginTop: "1rem",
          padding: "0.75rem",
          background: "#141428",
          borderRadius: "8px",
          minHeight: "80px",
        },
      },
      createElement(
        "p",
        {
          style: { color: "#666", fontSize: "0.8rem", marginBottom: "0.25rem" },
        },
        "📋 事件日志：",
      ),
      ...log.map((entry) =>
        createElement(
          "p",
          {
            style: { color: "#4ade80", fontSize: "0.85rem", lineHeight: "1.4" },
          },
          entry,
        ),
      ),
      log.length === 0
        ? createElement(
            "p",
            { style: { color: "#555", fontSize: "0.85rem" } },
            "点击上面的元素查看冒泡顺序...",
          )
        : null,
    ),
    createElement(
      "p",
      { style: { color: "#888", fontSize: "0.85rem", marginTop: "0.75rem" } },
      "💡 点击 Button 观察事件从 Button → Middle → Outer 依次冒泡",
    ),
  );
}

// ─── Demo 2: 交互式表单 ──────────────────────────────────────

/**
 * InteractiveForm — 交互式表单
 * 演示：onInput, onChange, onSubmit, onKeyDown 等事件类型
 */
function InteractiveForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email) return;
    setSubmitted((prev) => [
      ...prev,
      { name, email, message, time: new Date().toLocaleTimeString() },
    ]);
    setName("");
    setEmail("");
    setMessage("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setName("");
      setEmail("");
      setMessage("");
    }
  };

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
    createElement(
      "h2",
      { style: { marginBottom: "1rem" } },
      "📝 Interactive Form",
    ),
    createElement(
      "form",
      { onSubmit: handleSubmit },
      createElement(
        "div",
        { style: { marginBottom: "0.75rem" } },
        createElement(
          "label",
          {
            style: {
              display: "block",
              color: "#888",
              fontSize: "0.85rem",
              marginBottom: "0.25rem",
            },
          },
          "Name",
        ),
        createElement("input", {
          type: "text",
          value: name,
          onInput: (e) => setName(e.target.value),
          onKeyDown: handleKeyDown,
          style: inputStyle(),
        }),
      ),
      createElement(
        "div",
        { style: { marginBottom: "0.75rem" } },
        createElement(
          "label",
          {
            style: {
              display: "block",
              color: "#888",
              fontSize: "0.85rem",
              marginBottom: "0.25rem",
            },
          },
          "Email",
        ),
        createElement("input", {
          type: "email",
          value: email,
          onInput: (e) => setEmail(e.target.value),
          onKeyDown: handleKeyDown,
          style: inputStyle(),
        }),
      ),
      createElement(
        "div",
        { style: { marginBottom: "1rem" } },
        createElement(
          "label",
          {
            style: {
              display: "block",
              color: "#888",
              fontSize: "0.85rem",
              marginBottom: "0.25rem",
            },
          },
          "Message (optional)",
        ),
        createElement("input", {
          type: "text",
          value: message,
          onInput: (e) => setMessage(e.target.value),
          onKeyDown: handleKeyDown,
          style: inputStyle(),
        }),
      ),
      createElement(
        "div",
        { style: { display: "flex", gap: "0.5rem" } },
        createElement(
          "button",
          {
            type: "submit",
            style: btnStyle("#7c5cff"),
          },
          "📨 Submit",
        ),
        createElement(
          "button",
          {
            type: "button",
            onClick: () => {
              setName("");
              setEmail("");
              setMessage("");
            },
            style: btnStyle("#ef4444"),
          },
          "🗑 Clear",
        ),
      ),
    ),
    submitted.length > 0
      ? createElement(
          "div",
          { style: { marginTop: "1rem" } },
          createElement(
            "h3",
            {
              style: {
                fontSize: "0.9rem",
                color: "#888",
                marginBottom: "0.5rem",
              },
            },
            `📬 Submissions (${submitted.length})`,
          ),
          ...submitted.slice(-3).map((s) =>
            createElement(
              "div",
              {
                style: {
                  padding: "0.75rem",
                  background: "#252545",
                  borderRadius: "8px",
                  marginBottom: "0.5rem",
                  fontSize: "0.85rem",
                },
              },
              createElement(
                "p",
                { style: { fontWeight: "bold" } },
                `👤 ${s.name}`,
              ),
              createElement("p", { style: { color: "#888" } }, `📧 ${s.email}`),
              s.message
                ? createElement(
                    "p",
                    { style: { color: "#aaa" } },
                    `💬 ${s.message}`,
                  )
                : null,
              createElement(
                "p",
                { style: { color: "#555", fontSize: "0.75rem" } },
                `⏰ ${s.time}`,
              ),
            ),
          ),
        )
      : null,
    createElement(
      "p",
      { style: { color: "#888", fontSize: "0.85rem", marginTop: "0.75rem" } },
      "💡 onInput 实时更新、onSubmit 提交表单、onKeyDown(Esc) 清空表单 — 全部通过事件委托实现",
    ),
  );
}

// ─── Demo 3: 动态列表事件 ────────────────────────────────────

/**
 * DynamicList — 动态列表
 * 演示：动态添加/删除的元素也能正确响应事件（事件委托的优势）
 */
function DynamicList() {
  const [items, setItems] = useState([
    { id: 1, text: "事件委托到 root 容器", done: false },
    { id: 2, text: "事件冒泡从 target 到 root", done: false },
    { id: 3, text: "处理器存储在 __eventHandlers", done: true },
  ]);
  const [nextId, setNextId] = useState(4);
  const [clickCount, setClickCount] = useState(0);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: nextId, text: `Task #${nextId}`, done: false },
    ]);
    setNextId((prev) => prev + 1);
  };

  const toggleItem = (id) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item,
      ),
    );
    setClickCount((prev) => prev + 1);
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    setClickCount((prev) => prev + 1);
  };

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
    createElement(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        },
      },
      createElement("h2", null, "⚡ Dynamic List"),
      createElement(
        "span",
        {
          style: {
            padding: "0.3rem 0.75rem",
            background: "#252545",
            borderRadius: "20px",
            fontSize: "0.8rem",
            color: "#4ade80",
          },
        },
        `${clickCount} events handled`,
      ),
    ),
    createElement(
      "ul",
      { style: { listStyle: "none", padding: 0 } },
      ...items.map((item) =>
        createElement(
          "li",
          {
            key: item.id,
            style: {
              padding: "0.75rem 1rem",
              marginBottom: "0.5rem",
              background: "#252545",
              borderRadius: "8px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              textDecoration: item.done ? "line-through" : "none",
              opacity: item.done ? "0.6" : "1",
              transition: "opacity 0.2s",
            },
          },
          createElement(
            "span",
            {
              onClick: () => toggleItem(item.id),
              style: { cursor: "pointer", flex: 1 },
            },
            `${item.done ? "✅" : "⬜"} ${item.text}`,
          ),
          createElement(
            "button",
            {
              onClick: () => removeItem(item.id),
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
        { onClick: addItem, style: btnStyle() },
        "➕ Add Task",
      ),
      createElement(
        "button",
        {
          onClick: () => setItems((prev) => prev.filter((i) => !i.done)),
          style: btnStyle("#f59e0b"),
        },
        "🧹 Clear Done",
      ),
    ),
    createElement(
      "p",
      { style: { color: "#888", fontSize: "0.85rem", marginTop: "0.75rem" } },
      "💡 新增/删除的元素无需额外管理事件监听 — 事件委托的天然优势！",
    ),
  );
}

// ─── App — 根组件 ────────────────────────────────────────────

function App() {
  return createElement(
    "div",
    {
      id: "app",
      style: { padding: "2rem", maxWidth: "800px", margin: "0 auto" },
    },
    createElement(
      "h1",
      { style: { color: "#7c5cff", marginBottom: "0.5rem" } },
      "🔬 Mini-React Phase 7: 事件委托系统",
    ),
    createElement(
      "p",
      { style: { color: "#a0a0b0", marginBottom: "2rem" } },
      "所有事件监听器委托到 root 容器 — 内存从 O(n) 降到 O(1)！",
    ),
    createElement(BubbleDemo),
    createElement(InteractiveForm),
    createElement(DynamicList),
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
        "✅ Phase 7 验证清单",
      ),
      createElement("p", null, "• onClick 事件正确触发"),
      createElement("p", null, "• 事件冒泡行为正确（子 → 父）"),
      createElement("p", null, "• onInput / onChange 实时更新"),
      createElement("p", null, "• onSubmit 表单提交"),
      createElement("p", null, "• onKeyDown 键盘事件"),
      createElement("p", null, "• 事件处理器更新时使用新的处理器"),
      createElement("p", null, "• 动态添加/删除元素的事件正确处理"),
      createElement("p", null, "• 所有监听器只在 root 容器上注册"),
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

function inputStyle() {
  return {
    width: "100%",
    padding: "0.6rem 0.75rem",
    border: "1px solid #333",
    borderRadius: "8px",
    background: "#252545",
    color: "#e0e0e0",
    fontSize: "0.9rem",
    outline: "none",
  };
}

// ─── 挂载 ───────────────────────────────────────────────────

const root = createRoot(document.getElementById("root"));
root.render(createElement(App));

console.log("🔬 Phase 7 已启动 — 事件委托系统");
console.log("💡 所有事件监听器都委托到 root 容器，试试冒泡可视化！");

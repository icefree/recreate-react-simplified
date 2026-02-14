/**
 * Phase 6 Playground — useEffect / useRef / useReducer
 *
 * 🎯 目标：验证 Phase 6 的核心能力
 *   1. useEffect — 副作用管理 + cleanup
 *   2. useRef — 跨渲染持久化引用
 *   3. useReducer — 复杂状态管理
 *
 * 💡 Phase 6 让组件拥有了副作用能力 ——
 *    可以操作 DOM、发请求、订阅事件，组件卸载时自动清理！
 */

import MiniReact from "../mini-react/index.js";
const { createElement, createRoot, useState, useEffect, useRef, useReducer } =
  MiniReact;

// ─── Demo 1: 自动计时器（setInterval + cleanup） ─────────────

/**
 * Timer — 自动计时器
 * 演示：useEffect + cleanup（clearInterval）
 * 点 Start 开始计时，Stop 暂停，Reset 重置
 */
function Timer() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;

    const id = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    // cleanup: 停止/卸载时清除定时器
    return () => clearInterval(id);
  }, [running]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

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
    createElement("h2", { style: { marginBottom: "1rem" } }, "⏱ Timer"),
    createElement(
      "div",
      {
        style: {
          fontSize: "3rem",
          fontWeight: "bold",
          color: running ? "#4ade80" : "#7c5cff",
          textAlign: "center",
          fontFamily: "monospace",
          marginBottom: "1rem",
          transition: "color 0.3s",
        },
      },
      `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`,
    ),
    createElement(
      "div",
      {
        style: {
          display: "flex",
          gap: "0.5rem",
          justifyContent: "center",
        },
      },
      createElement(
        "button",
        {
          onClick: () => setRunning(true),
          style: btnStyle("#4ade80"),
        },
        "▶ Start",
      ),
      createElement(
        "button",
        {
          onClick: () => setRunning(false),
          style: btnStyle("#f59e0b"),
        },
        "⏸ Stop",
      ),
      createElement(
        "button",
        {
          onClick: () => {
            setRunning(false);
            setSeconds(0);
          },
          style: btnStyle("#ef4444"),
        },
        "🔄 Reset",
      ),
    ),
    createElement(
      "p",
      { style: { color: "#888", fontSize: "0.85rem", marginTop: "0.75rem" } },
      "💡 useEffect(fn, [running]) — running 变化时清除旧 interval 创建新的",
    ),
  );
}

// ─── Demo 2: 模拟数据请求（ID 切换取消上次请求） ────────────

/**
 * DataFetcher — 模拟数据请求
 * 演示：useEffect cleanup 取消异步操作 + 依赖数组
 */
function DataFetcher() {
  const [userId, setUserId] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [log, setLog] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLog((prev) => [...prev, `🔄 开始请求 User #${userId}`]);

    // 模拟异步请求
    const timer = setTimeout(() => {
      if (!cancelled) {
        setData({
          id: userId,
          name: `User ${userId}`,
          email: `user${userId}@example.com`,
        });
        setLoading(false);
        setLog((prev) => [...prev, `✅ User #${userId} 加载完成`]);
      }
    }, 800);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      setLog((prev) => [...prev, `❌ 取消请求 User #${userId}`]);
    };
  }, [userId]);

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
    createElement("h2", { style: { marginBottom: "1rem" } }, "📡 Data Fetcher"),
    createElement(
      "div",
      { style: { display: "flex", gap: "0.5rem", marginBottom: "1rem" } },
      ...[1, 2, 3, 4, 5].map((id) =>
        createElement(
          "button",
          {
            onClick: () => setUserId(id),
            style: {
              ...btnStyle(userId === id ? "#7c5cff" : "#333"),
              opacity: userId === id ? "1" : "0.6",
            },
          },
          `User ${id}`,
        ),
      ),
    ),
    createElement(
      "div",
      {
        style: {
          padding: "1rem",
          background: "#252545",
          borderRadius: "8px",
          marginBottom: "1rem",
        },
      },
      loading
        ? createElement("p", { style: { color: "#f59e0b" } }, "⏳ Loading...")
        : createElement(
            "div",
            null,
            createElement(
              "p",
              { style: { fontWeight: "bold" } },
              `👤 ${data.name}`,
            ),
            createElement("p", { style: { color: "#888" } }, data.email),
          ),
    ),
    createElement(
      "div",
      {
        style: {
          padding: "0.75rem",
          background: "#141428",
          borderRadius: "8px",
          fontSize: "0.8rem",
          maxHeight: "120px",
          overflowY: "auto",
        },
      },
      createElement(
        "p",
        { style: { color: "#666", marginBottom: "0.25rem" } },
        "📋 请求日志：",
      ),
      ...log.slice(-6).map((entry) =>
        createElement(
          "p",
          {
            style: {
              color: entry.startsWith("✅")
                ? "#4ade80"
                : entry.startsWith("❌")
                  ? "#ef4444"
                  : "#888",
              lineHeight: "1.4",
            },
          },
          entry,
        ),
      ),
    ),
    createElement(
      "p",
      { style: { color: "#888", fontSize: "0.85rem", marginTop: "0.75rem" } },
      "💡 快速切换 ID 观察取消逻辑 — cleanup 中 cancelled = true 阻止旧数据写入",
    ),
  );
}

// ─── Demo 3: useRef 保存 DOM 引用 & 前值 ─────────────────────

/**
 * RefDemo — useRef 演示
 * 演示：useRef 保存前一次渲染的值 + 渲染次数计数
 */
function RefDemo() {
  const [count, setCount] = useState(0);
  const prevCountRef = useRef(null);
  const renderCountRef = useRef(0);

  // 每次渲染递增 renderCount（不触发额外渲染）
  renderCountRef.current += 1;

  useEffect(() => {
    prevCountRef.current = count;
  }, [count]);

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
    createElement("h2", { style: { marginBottom: "1rem" } }, "📌 useRef Demo"),
    createElement(
      "div",
      {
        style: {
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "1rem",
          marginBottom: "1rem",
        },
      },
      createElement(
        "div",
        {
          style: {
            padding: "1rem",
            background: "#252545",
            borderRadius: "8px",
            textAlign: "center",
          },
        },
        createElement(
          "p",
          { style: { color: "#888", fontSize: "0.8rem" } },
          "当前值",
        ),
        createElement(
          "p",
          { style: { fontSize: "2rem", fontWeight: "bold", color: "#7c5cff" } },
          `${count}`,
        ),
      ),
      createElement(
        "div",
        {
          style: {
            padding: "1rem",
            background: "#252545",
            borderRadius: "8px",
            textAlign: "center",
          },
        },
        createElement(
          "p",
          { style: { color: "#888", fontSize: "0.8rem" } },
          "前一个值",
        ),
        createElement(
          "p",
          { style: { fontSize: "2rem", fontWeight: "bold", color: "#f59e0b" } },
          prevCountRef.current !== null ? `${prevCountRef.current}` : "—",
        ),
      ),
      createElement(
        "div",
        {
          style: {
            padding: "1rem",
            background: "#252545",
            borderRadius: "8px",
            textAlign: "center",
          },
        },
        createElement(
          "p",
          { style: { color: "#888", fontSize: "0.8rem" } },
          "渲染次数",
        ),
        createElement(
          "p",
          { style: { fontSize: "2rem", fontWeight: "bold", color: "#4ade80" } },
          `${renderCountRef.current}`,
        ),
      ),
    ),
    createElement(
      "div",
      { style: { display: "flex", gap: "0.5rem", justifyContent: "center" } },
      createElement(
        "button",
        {
          onClick: () => setCount((prev) => prev + 1),
          style: btnStyle(),
        },
        "➕ Increment",
      ),
      createElement(
        "button",
        {
          onClick: () => setCount((prev) => prev - 1),
          style: btnStyle(),
        },
        "➖ Decrement",
      ),
    ),
    createElement(
      "p",
      { style: { color: "#888", fontSize: "0.85rem", marginTop: "0.75rem" } },
      "💡 prevCountRef 保存前一次的 count；renderCountRef 统计渲染次数（修改 .current 不触发渲染）",
    ),
  );
}

// ─── Demo 4: useReducer 复杂状态管理 ────────────────────────

function todoReducer(state, action) {
  switch (action.type) {
    case "add":
      return {
        ...state,
        todos: [
          ...state.todos,
          { id: state.nextId, text: action.text, done: false },
        ],
        nextId: state.nextId + 1,
      };
    case "toggle":
      return {
        ...state,
        todos: state.todos.map((t) =>
          t.id === action.id ? { ...t, done: !t.done } : t,
        ),
      };
    case "remove":
      return {
        ...state,
        todos: state.todos.filter((t) => t.id !== action.id),
      };
    case "clearDone":
      return {
        ...state,
        todos: state.todos.filter((t) => !t.done),
      };
    default:
      return state;
  }
}

/**
 * ReducerTodoList — 使用 useReducer 的 Todo List
 * 演示：useReducer 管理复杂状态 + dispatch
 */
function ReducerTodoList() {
  const [state, dispatch] = useReducer(todoReducer, {
    todos: [
      { id: 1, text: "理解 useEffect 的执行时机", done: false },
      { id: 2, text: "掌握 cleanup 函数的作用", done: false },
      { id: 3, text: "学会使用 useRef", done: true },
    ],
    nextId: 4,
  });

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
      "🔧 useReducer Todo",
    ),
    createElement(
      "ul",
      { style: { listStyle: "none", padding: 0 } },
      ...state.todos.map((todo) =>
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
              onClick: () => dispatch({ type: "toggle", id: todo.id }),
              style: { cursor: "pointer", flex: 1 },
            },
            `${todo.done ? "✅" : "⬜"} ${todo.text}`,
          ),
          createElement(
            "button",
            {
              onClick: () => dispatch({ type: "remove", id: todo.id }),
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
          onClick: () =>
            dispatch({
              type: "add",
              text: `New Task #${state.nextId}`,
            }),
          style: btnStyle(),
        },
        "➕ Add Task",
      ),
      createElement(
        "button",
        {
          onClick: () => dispatch({ type: "clearDone" }),
          style: btnStyle("#f59e0b"),
        },
        "🧹 Clear Done",
      ),
    ),
    createElement(
      "p",
      { style: { color: "#888", fontSize: "0.85rem", marginTop: "0.75rem" } },
      `💡 useReducer(todoReducer, initialState) — 所有状态变更通过 dispatch(action) 统一管理`,
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
      "🔬 Mini-React Phase 6: useEffect / useRef / useReducer",
    ),
    createElement(
      "p",
      { style: { color: "#a0a0b0", marginBottom: "2rem" } },
      "副作用、持久化引用、复杂状态管理 — 函数组件的能力圈完整了！",
    ),
    createElement(Timer),
    createElement(DataFetcher),
    createElement(RefDemo),
    createElement(ReducerTodoList),
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
        "✅ Phase 6 验证清单",
      ),
      createElement("p", null, "• useEffect 空依赖 [] 只在挂载时执行一次"),
      createElement("p", null, "• useEffect 无依赖 每次渲染后执行"),
      createElement("p", null, "• useEffect 依赖变化时正确触发"),
      createElement(
        "p",
        null,
        "• cleanup 函数正确执行（Timer 停止时清除 interval）",
      ),
      createElement("p", null, "• useRef 跨渲染保持同一引用"),
      createElement("p", null, "• useRef 修改 .current 不触发重新渲染"),
      createElement("p", null, "• useReducer 通过 dispatch 触发更新"),
      createElement("p", null, "• 组件卸载时 cleanup 被调用"),
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

console.log("🔬 Phase 6 已启动 — useEffect / useRef / useReducer");
console.log("💡 组件现在拥有了副作用管理能力，试试 Timer 和 Data Fetcher！");

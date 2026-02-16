/**
 * Phase 7b Playground — Context API 与 Memoization Hooks
 *
 * 🎯 目标：验证 Phase 7b 的核心能力
 *   1. createContext + useContext — 跨层级数据传递
 *   2. useMemo — 缓存昂贵计算
 *   3. useCallback + memo — 避免不必要的重渲染
 *
 * 💡 Phase 7b 解决了两大问题：
 *    - prop drilling（通过 Context）
 *    - 不必要的渲染（通过 memo/useMemo/useCallback）
 */

import MiniReact from "../mini-react/index.js";
const {
  createElement,
  createRoot,
  useState,
  useContext,
  useMemo,
  useCallback,
} = MiniReact;
const { createContext, memo } = MiniReact;

// ─── Demo 1: 主题切换（Theme Context）─────────────────────────

/**
 * ThemeContext — 跨越中间组件传递主题数据
 * 验证：createContext + Provider + useContext
 */
const ThemeContext = createContext("light");

function ThemeDisplay() {
  const theme = useContext(ThemeContext);
  return createElement(
    "div",
    {
      style: {
        padding: "1rem",
        background: theme === "dark" ? "#252545" : "#f0f0f5",
        color: theme === "dark" ? "#e0e0e0" : "#1a1a2e",
        borderRadius: "8px",
        transition: "all 0.3s ease",
      },
    },
    createElement("p", null, `🎨 Current theme: ${theme}`),
    createElement(
      "p",
      { style: { fontSize: "0.85rem", opacity: 0.7 } },
      "This component reads the theme via useContext — no prop drilling!",
    ),
  );
}

function MiddleLayer() {
  // 中间层不接收任何 theme prop — 验证跨层级传递
  return createElement(
    "div",
    {
      style: {
        border: "1px dashed #555",
        padding: "0.75rem",
        borderRadius: "8px",
        marginBottom: "0.5rem",
      },
    },
    createElement(
      "p",
      { style: { color: "#888", fontSize: "0.8rem", marginBottom: "0.5rem" } },
      "🔗 MiddleLayer — 不接收 theme prop",
    ),
    createElement(ThemeDisplay),
  );
}

function ThemeDemo() {
  const [theme, setTheme] = useState("light");

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
      "🎨 Demo 1: Theme Context",
    ),
    createElement(
      "div",
      { style: { display: "flex", gap: "0.5rem", marginBottom: "1rem" } },
      createElement(
        "button",
        {
          onClick: () => setTheme("light"),
          style: btnStyle(theme === "light" ? "#4ade80" : "#555"),
        },
        "☀️ Light",
      ),
      createElement(
        "button",
        {
          onClick: () => setTheme("dark"),
          style: btnStyle(theme === "dark" ? "#7c5cff" : "#555"),
        },
        "🌙 Dark",
      ),
    ),
    createElement(
      ThemeContext.Provider,
      { value: theme },
      createElement(MiddleLayer),
    ),
    createElement(
      "p",
      { style: { color: "#888", fontSize: "0.85rem", marginTop: "0.75rem" } },
      "💡 Provider → MiddleLayer → ThemeDisplay，中间层无需传递 props",
    ),
  );
}

// ─── Demo 2: useMemo — 昂贵的列表过滤计算 ───────────────────

function ExpensiveFilterDemo() {
  const [filter, setFilter] = useState("");
  const [count, setCount] = useState(0);

  // 模拟一个"昂贵"的列表
  const items = [
    "React",
    "Vue",
    "Angular",
    "Svelte",
    "Solid",
    "Preact",
    "Inferno",
    "Lit",
    "Alpine",
    "Ember",
    "Backbone",
    "jQuery",
    "Mithril",
    "Dojo",
    "Knockout",
  ];

  // useMemo 缓存过滤结果 —— filter 不变时不重新计算
  const filteredItems = useMemo(() => {
    console.log("🔄 Filtering items...(should only log when filter changes)");
    return items.filter((item) =>
      item.toLowerCase().includes(filter.toLowerCase()),
    );
  }, [filter]);

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
      "⚡ Demo 2: useMemo — Expensive Filter",
    ),
    createElement(
      "div",
      { style: { display: "flex", gap: "0.75rem", marginBottom: "1rem" } },
      createElement("input", {
        type: "text",
        value: filter,
        onInput: (e) => setFilter(e.target.value),
        placeholder: "Filter frameworks...",
        style: inputStyle(),
      }),
      createElement(
        "button",
        {
          onClick: () => setCount((c) => c + 1),
          style: btnStyle("#f59e0b"),
        },
        `🔄 Unrelated update (${count})`,
      ),
    ),
    createElement(
      "div",
      {
        style: {
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          marginBottom: "0.5rem",
        },
      },
      ...filteredItems.map((item) =>
        createElement(
          "span",
          {
            style: {
              padding: "0.4rem 0.8rem",
              background: "#252545",
              borderRadius: "20px",
              fontSize: "0.85rem",
              color: "#4ade80",
            },
          },
          item,
        ),
      ),
    ),
    createElement(
      "p",
      { style: { color: "#888", fontSize: "0.85rem" } },
      `Showing ${filteredItems.length} of ${items.length} | Counter: ${count}`,
    ),
    createElement(
      "p",
      { style: { color: "#888", fontSize: "0.85rem", marginTop: "0.25rem" } },
      "💡 点击「Unrelated update」不会重新过滤列表 — 打开 Console 验证！",
    ),
  );
}

// ─── Demo 3: memo + useCallback — 避免子组件不必要的重渲染 ────

// 用 memo 包裹的子组件 —— props 不变时跳过渲染
const MemoChild = memo(function ChildComponent({ label, onClick }) {
  console.log(`🔄 MemoChild "${label}" rendered`);
  return createElement(
    "div",
    {
      style: {
        padding: "0.75rem 1rem",
        background: "#252545",
        borderRadius: "8px",
        marginBottom: "0.5rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      },
    },
    createElement("span", null, label),
    createElement(
      "button",
      {
        onClick,
        style: {
          ...btnStyle("#7c5cff"),
          padding: "0.3rem 0.6rem",
          fontSize: "0.8rem",
        },
      },
      "Click",
    ),
  );
});

function MemoDemo() {
  const [parentCount, setParentCount] = useState(0);
  const [childACount, setChildACount] = useState(0);
  const [childBCount, setChildBCount] = useState(0);

  // useCallback 保持引用稳定 —— 让 memo 发挥作用
  const handleClickA = useCallback(() => {
    setChildACount((c) => c + 1);
  }, []);

  const handleClickB = useCallback(() => {
    setChildBCount((c) => c + 1);
  }, []);

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
      "🧠 Demo 3: memo + useCallback",
    ),
    createElement(
      "div",
      { style: { marginBottom: "1rem" } },
      createElement(
        "button",
        {
          onClick: () => setParentCount((c) => c + 1),
          style: btnStyle("#f59e0b"),
        },
        `🔄 Update Parent (${parentCount})`,
      ),
    ),
    createElement(MemoChild, {
      label: `Child A — clicked ${childACount} times`,
      onClick: handleClickA,
    }),
    createElement(MemoChild, {
      label: `Child B — clicked ${childBCount} times`,
      onClick: handleClickB,
    }),
    createElement(
      "div",
      {
        style: {
          marginTop: "0.75rem",
          padding: "0.75rem",
          background: "#141428",
          borderRadius: "8px",
          fontSize: "0.85rem",
          color: "#888",
          lineHeight: "1.6",
        },
      },
      createElement("p", null, "💡 点击「Update Parent」— 打开 Console 观察："),
      createElement("p", null, "  • 如果 memo 生效，子组件不会重渲染"),
      createElement(
        "p",
        null,
        "  • 如果 useCallback 失效（每次新引用），memo 会失效",
      ),
      createElement(
        "p",
        null,
        "  • 点击 Child 的 Click 按钮只会让该 Child 重渲染",
      ),
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
      "🔬 Mini-React Phase 7b: Context & Memoization",
    ),
    createElement(
      "p",
      { style: { color: "#a0a0b0", marginBottom: "2rem" } },
      "Context 解决 prop drilling，memo/useMemo/useCallback 优化渲染性能",
    ),
    createElement(ThemeDemo),
    createElement(ExpensiveFilterDemo),
    createElement(MemoDemo),
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
        "✅ Phase 7b 验证清单",
      ),
      createElement("p", null, "• createContext + useContext 跨层级传值"),
      createElement("p", null, "• Provider 值变化时 Consumer 正确更新"),
      createElement("p", null, "• 无 Provider 时返回 defaultValue"),
      createElement("p", null, "• useMemo deps 不变时返回缓存值"),
      createElement("p", null, "• useCallback deps 不变时返回同一函数引用"),
      createElement("p", null, "• memo 组件在 props 不变时跳过渲染"),
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
    flex: 1,
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

console.log("🔬 Phase 7b 已启动 — Context API & Memoization Hooks");
console.log(
  "💡 三大 Demo：Theme Context / useMemo Filter / memo + useCallback",
);

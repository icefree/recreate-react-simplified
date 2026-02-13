import { defineConfig } from "vite";

export default defineConfig({
  // Phase 2 会在这里配置自定义 JSX pragma
  // 现在先用默认配置
  esbuild: {
    jsxFactory: "MiniReact.createElement",
    jsxFragment: "MiniReact.Fragment",
  },
});

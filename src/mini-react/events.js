/**
 * ============================================================
 * Mini-React: events — 事件委托系统
 * ============================================================
 *
 * 🎯 核心职责：
 *   将事件监听从「每个元素单独绑定」改为「在 root 容器统一监听」。
 *   这就是 React 的「事件委托（Event Delegation）」机制。
 *
 * 📚 为什么 React 不直接在元素上绑定事件？
 *
 *   传统方式（Phase 1-6 的做法）：
 *     每个元素各自 addEventListener → 1000 个按钮 = 1000 个监听器
 *
 *   事件委托：
 *     只在 root 上注册一个监听器 → 利用 DOM 事件冒泡机制
 *     事件触发时从 event.target 向上查找匹配的处理器
 *
 *   好处：
 *   ┌────────────────────────────────────────────────────────┐
 *   │ 1. 内存优化 — 监听器数量从 O(n) 降到 O(1)             │
 *   │ 2. 动态元素 — 新增/删除元素无需额外管理事件              │
 *   │ 3. 统一控制 — 可以在委托层实现 stopPropagation 等行为   │
 *   └────────────────────────────────────────────────────────┘
 *
 * 🏗️ 工作流程：
 *
 *   1. createRoot 时调用 setupEventDelegation(container)
 *      → 在 container 上为每种事件类型注册一个统一监听器
 *
 *   2. render/updateProps 时不再 addEventListener
 *      → 改为将 handler 存储到 dom.__eventHandlers[eventType]
 *
 *   3. 事件触发时：
 *      → 从 event.target 开始
 *      → 沿 parentNode 向上遍历到 rootContainer
 *      → 每个节点检查 __eventHandlers[eventType]
 *      → 如果有 handler，调用它（模拟冒泡）
 *
 * 💡 简化版 vs 真实 React：
 *   - 真实 React 使用 SyntheticEvent 包装原生事件，抹平浏览器差异
 *   - 真实 React 17+ 将事件绑定在 root 而非 document 上（我们也是这样）
 *   - 我们简化版直接传递原生事件对象，不做包装
 *
 * ============================================================
 */

// ─── 事件属性工具函数 ────────────────────────────────────────

/**
 * 判断一个 props 的 key 是否为事件属性
 *
 * React 约定以 "on" 开头的 prop 为事件处理器：
 *   onClick, onChange, onInput, onKeyDown ...
 *
 * TODO (Phase 7): 实现 isEventProp
 *
 * 步骤：
 *   检查 name 是否以 "on" 开头。
 *   只需一行代码。
 *
 * 示例：
 *   isEventProp('onClick')   → true
 *   isEventProp('onChange')   → true
 *   isEventProp('className')  → false
 *   isEventProp('id')         → false
 *
 * @param {string} name - props 的 key
 * @returns {boolean}
 */
export function isEventProp(name) {
  // TODO: 实现这个函数（1 行）
  return name.startsWith("on");
}

/**
 * 从 prop 名称中提取 DOM 事件名称
 *
 * React 的事件名使用驼峰命名（onClick），
 * 而 DOM 事件使用小写（click）。
 * 需要去掉 "on" 前缀并转为小写。
 *
 * TODO (Phase 7): 实现 getEventName
 *
 * 步骤：
 *   1. 去掉前两个字符 "on"
 *   2. 将结果转为小写
 *   只需一行代码。
 *
 * 示例：
 *   getEventName('onClick')   → 'click'
 *   getEventName('onChange')   → 'change'
 *   getEventName('onKeyDown')  → 'keydown'
 *   getEventName('onInput')    → 'input'
 *
 * @param {string} propName - 事件 prop 名称（如 'onClick'）
 * @returns {string} DOM 事件名称（如 'click'）
 */
export function getEventName(propName) {
  // TODO: 实现这个函数（1 行）
  return propName.slice(2).toLowerCase();
}

// ─── 事件委托核心 ────────────────────────────────────────────

/**
 * 需要委托的事件类型列表
 *
 * 包含最常用的 DOM 事件。覆盖鼠标、键盘、表单、焦点等场景。
 * 真实 React 支持的事件类型更多，这里只列出核心子集。
 */
const DELEGATED_EVENTS = [
  // 鼠标事件
  'click', 'dblclick', 'mousedown', 'mouseup', 'mouseover', 'mouseout',
  // 键盘事件
  'keydown', 'keyup', 'keypress',
  // 表单事件
  'input', 'change', 'submit',
  // 焦点事件
  'focus', 'blur',
  // 其他
  'scroll',
]

/**
 * 在 root 容器上设置事件委托
 *
 * 这个函数在 createRoot 时调用一次，为每种事件类型注册一个统一的监听器。
 * 当事件触发时，监听器会从 event.target 开始向上遍历 DOM 树，
 * 查找并调用每个节点上存储的事件处理器。
 *
 * TODO (Phase 7): 实现 setupEventDelegation
 *
 * 步骤：
 *   1. 防止重复初始化 — 检查 rootContainer.__eventsInitialized，
 *      如果为 true 则直接 return。
 *
 *   2. 遍历 DELEGATED_EVENTS 数组，为每种事件类型在 rootContainer 上
 *      注册一个监听器。
 *
 *   3. 每个监听器的逻辑（事件冒泡模拟）：
 *      a. 获取 event.target 作为起始节点
 *      b. 从 target 开始，沿 parentNode 向上遍历，直到 rootContainer
 *      c. 对每个节点，检查是否有 __eventHandlers[eventType]
 *      d. 如果有，调用该 handler，传入原生事件对象 (nativeEvent)
 *      e. 继续向上，直到 target 为 null 或到达 rootContainer
 *
 *   4. 标记 rootContainer.__eventsInitialized = true
 *
 * 💡 关键思考：
 *   - 为什么要在 while 循环中向上遍历？
 *     → 模拟 DOM 事件冒泡：子元素的事件会"冒泡"到父元素
 *   - 为什么 handler 存储在 dom.__eventHandlers 上？
 *     → 这样 updateProps 只需设置/删除属性，无需管理 addEventListener
 *   - focus 和 blur 不支持冒泡，需要用 { capture: true } 捕获？
 *     → 简化版暂时忽略这个问题，真实 React 使用 focusin/focusout 代替
 *
 * 实现参考（伪代码）：
 *
 *   DELEGATED_EVENTS.forEach(eventType => {
 *     rootContainer.addEventListener(eventType, (nativeEvent) => {
 *       let target = nativeEvent.target
 *       while (target && target !== rootContainer) {
 *         const handler = target.__eventHandlers?.[eventType]
 *         if (handler) {
 *           handler(nativeEvent)
 *         }
 *         target = target.parentNode
 *       }
 *     })
 *   })
 *
 * @param {HTMLElement} rootContainer - createRoot 的 DOM 容器
 */
export function setupEventDelegation(rootContainer) {
  // TODO: 实现事件委托（约 15 行）
  //
  // 提示：
  //   1. 检查 rootContainer.__eventsInitialized 防止重复初始化
  //   2. 遍历 DELEGATED_EVENTS
  //   3. 每个 eventType 注册一个 addEventListener
  //   4. 监听器内部从 event.target 向上遍历到 rootContainer
  //   5. 标记 __eventsInitialized = true
  if (rootContainer.__eventsInitialized) {
    return;
  }

  DELEGATED_EVENTS.forEach(event => {
    rootContainer.addEventListener(event, (nativeEvent) => {
      let target = nativeEvent.target;
      while (target && target !== rootContainer) {
        const handler = target.__eventHandlers?.[event];
        if (handler) {
          handler(nativeEvent);
        }
        target = target.parentNode;
      }
    })
  })

  rootContainer.__eventsInitialized = true;
}

// ─── DOM 节点事件处理器存储 ──────────────────────────────────

/**
 * 在 DOM 节点上注册事件处理器
 *
 * 不使用 addEventListener，而是将 handler 存储到 dom.__eventHandlers 上。
 * 事件触发时由委托监听器查找并调用。
 *
 * TODO (Phase 7): 实现 setEventHandler
 *
 * 步骤：
 *   1. 如果 dom.__eventHandlers 不存在，初始化为空对象 {}
 *   2. 将 handler 存储到 dom.__eventHandlers[eventType]
 *
 * @param {HTMLElement} dom       - 目标 DOM 节点
 * @param {string}      eventType - 事件类型（如 'click'）
 * @param {Function}    handler   - 事件处理函数
 */
export function setEventHandler(dom, eventType, handler) {
  // TODO: 实现这个函数（2 行）
  if (!dom.__eventHandlers) {
    dom.__eventHandlers = {};
  }
  dom.__eventHandlers[eventType] = handler;
}

/**
 * 从 DOM 节点移除事件处理器
 *
 * TODO (Phase 7): 实现 removeEventHandler
 *
 * 步骤：
 *   1. 如果 dom.__eventHandlers 存在，删除 dom.__eventHandlers[eventType]
 *
 * @param {HTMLElement} dom       - 目标 DOM 节点
 * @param {string}      eventType - 事件类型
 */
export function removeEventHandler(dom, eventType) {
  // TODO: 实现这个函数（1 行）
  if (dom.__eventHandlers) {
    delete dom.__eventHandlers[eventType];
  }
}

/**
 * Mini-React — 统一导出
 *
 * 把所有模块的公共 API 聚合在一起，
 * 使用方只需 import MiniReact from './mini-react'
 */

import { createElement, TEXT_ELEMENT } from './createElement.js'
import { render } from './render.js'

const MiniReact = {
  createElement,
  render,
  TEXT_ELEMENT,
}

export { createElement, render, TEXT_ELEMENT }
export default MiniReact

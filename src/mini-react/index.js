/**
 * Mini-React — 统一导出
 *
 * 把所有模块的公共 API 聚合在一起，
 * 使用方只需 import MiniReact from './mini-react'
 */

import { createElement, TEXT_ELEMENT } from './createElement.js'
import { render, createDom, updateProps } from './render.js'
import { reconcile, commitRoot } from './reconciler.js'
import { createRoot } from './root.js'
import { isComponent, getComponentDom } from './component.js'
import { useState, useEffect, useRef, useReducer } from './hooks.js'
import { isEventProp, getEventName, setupEventDelegation, setEventHandler, removeEventHandler } from './events.js'

const MiniReact = {
  createElement,
  render,
  createRoot,
  reconcile,
  commitRoot,
  createDom,
  updateProps,
  isComponent,
  getComponentDom,
  useState,
  useEffect,
  useRef,
  useReducer,
  isEventProp,
  getEventName,
  setupEventDelegation,
  setEventHandler,
  removeEventHandler,
  TEXT_ELEMENT,
}

export { createElement, render, createRoot, reconcile, commitRoot, createDom, updateProps, isComponent, getComponentDom, useState, useEffect, useRef, useReducer, isEventProp, getEventName, setupEventDelegation, setEventHandler, removeEventHandler, TEXT_ELEMENT }
export default MiniReact

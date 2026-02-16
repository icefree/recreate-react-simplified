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
import { useState, useEffect, useRef, useReducer, useContext, useMemo, useCallback } from './hooks.js'
import { isEventProp, getEventName, setupEventDelegation, setEventHandler, removeEventHandler } from './events.js'
import { createContext, shallowEqual, memo } from './context.js'

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
  useContext,
  useMemo,
  useCallback,
  createContext,
  shallowEqual,
  memo,
  isEventProp,
  getEventName,
  setupEventDelegation,
  setEventHandler,
  removeEventHandler,
  TEXT_ELEMENT,
}

export { createElement, render, createRoot, reconcile, commitRoot, createDom, updateProps, isComponent, getComponentDom, useState, useEffect, useRef, useReducer, useContext, useMemo, useCallback, createContext, shallowEqual, memo, isEventProp, getEventName, setupEventDelegation, setEventHandler, removeEventHandler, TEXT_ELEMENT }
export default MiniReact

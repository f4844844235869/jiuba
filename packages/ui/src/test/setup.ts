import "@testing-library/jest-dom/vitest"
import { vi } from "vitest"

// Radix UI primitives rely on PointerEvent/ResizeObserver in the browser.
// JSDOM doesn't provide them consistently, so we polyfill minimal stubs for tests.
if (!("PointerEvent" in window)) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).PointerEvent = class PointerEvent extends MouseEvent {}
}

if (!HTMLElement.prototype.hasPointerCapture) {
  HTMLElement.prototype.hasPointerCapture = () => false
}

if (!HTMLElement.prototype.setPointerCapture) {
  HTMLElement.prototype.setPointerCapture = () => {}
}

if (!HTMLElement.prototype.releasePointerCapture) {
  HTMLElement.prototype.releasePointerCapture = () => {}
}

if (!("ResizeObserver" in window)) {
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).ResizeObserver = ResizeObserver
}

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import App from "./App"

// Mock motion/framer to avoid layout issues in jsdom
vi.mock("motion/react", () => ({
  motion: new Proxy({}, { get: () => "div" }),
  useAnimation: () => ({ start: vi.fn(), stop: vi.fn() }),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}))

describe("App.tsx contract", () => {
  it("[WHO] exports default App component", () => {
    expect(App).toBeDefined()
    expect(typeof App).toBe("function")
  })
})

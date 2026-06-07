import { describe, it, expect, vi } from "vitest"
import { TabBar } from "./TabBar"

vi.mock("motion/react", () => ({
  motion: new Proxy({}, { get: () => "div" }),
  useAnimation: () => ({ start: vi.fn(), stop: vi.fn() }),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}))

describe("TabBar.tsx contract", () => {
  it("[WHO] exports TabBar component", () => {
    expect(TabBar).toBeDefined()
    expect(typeof TabBar).toBe("function")
  })
})

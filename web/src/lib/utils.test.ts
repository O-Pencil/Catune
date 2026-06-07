import { describe, it, expect } from "vitest"
import { cn } from "./utils"

describe("utils.ts contract", () => {
  it("[WHO] exports cn function", () => {
    expect(cn).toBeDefined()
    expect(typeof cn).toBe("function")
  })
  it("cn merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar")
    expect(cn("foo", false && "bar")).toBe("foo")
  })
})

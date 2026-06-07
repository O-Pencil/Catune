import { describe, it, expect } from "vitest"
import { Input } from "./input"

describe("input.tsx contract", () => {
  it("[WHO] exports Input component", () => {
    expect(Input).toBeDefined()
    expect(typeof Input).toBe("function")
  })
})

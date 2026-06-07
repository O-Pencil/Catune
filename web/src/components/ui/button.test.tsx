import { describe, it, expect } from "vitest"
import { Button, buttonVariants } from "./button"

describe("button.tsx contract", () => {
  it("[WHO] exports Button component", () => {
    expect(Button).toBeDefined()
    expect(typeof Button).toBe("function")
  })
  it("[WHO] exports buttonVariants", () => {
    expect(buttonVariants).toBeDefined()
    expect(typeof buttonVariants).toBe("function")
  })
})

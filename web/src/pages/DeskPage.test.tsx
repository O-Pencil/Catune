import { describe, it, expect } from "vitest"
import { DeskPage } from "./DeskPage"

describe("DeskPage.tsx contract", () => {
  it("[WHO] exports DeskPage component", () => {
    expect(DeskPage).toBeDefined()
    expect(typeof DeskPage).toBe("function")
  })
})

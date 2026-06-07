import { describe, it, expect } from "vitest"
import { SettingsPage } from "./SettingsPage"

describe("SettingsPage.tsx contract", () => {
  it("[WHO] exports SettingsPage component", () => {
    expect(SettingsPage).toBeDefined()
    expect(typeof SettingsPage).toBe("function")
  })
})

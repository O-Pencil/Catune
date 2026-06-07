import { describe, it, expect } from "vitest"
import { GaugeIcon } from "./GaugeIcon"

describe("GaugeIcon.tsx contract", () => {
  it("[WHO] exports GaugeIcon component", () => {
    expect(GaugeIcon).toBeDefined()
    // forwardRef components are typeof "object"
    expect(typeof GaugeIcon === "function" || typeof GaugeIcon === "object").toBe(true)
  })
})

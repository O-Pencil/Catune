import { describe, it, expect } from "vitest"
import {
  HAPTIC_PALETTE,
  HAPTIC_GRADIENTS,
  HAPTIC_ELEVATION,
  HAPTIC_RADIUS,
  HAPTIC_PADDING,
  HAPTIC_INDENT,
  HAPTIC_CHIP_COLORS,
  HAPTIC_SELECTOR_SELECTED,
  HAPTIC_SELECTOR_UNSELECTED,
} from "./tokens"

describe("tokens.ts contract", () => {
  it("[WHO] exports HAPTIC_PALETTE", () => {
    expect(HAPTIC_PALETTE).toBeDefined()
    expect(HAPTIC_PALETTE.brand).toBe("#fb4b00")
  })
  it("[WHO] exports HAPTIC_GRADIENTS", () => {
    expect(HAPTIC_GRADIENTS).toBeDefined()
    expect(HAPTIC_GRADIENTS.neutral).toContain("linear-gradient")
  })
  it("[WHO] exports HAPTIC_ELEVATION", () => {
    expect(HAPTIC_ELEVATION).toBeDefined()
  })
  it("[WHO] exports HAPTIC_RADIUS", () => {
    expect(HAPTIC_RADIUS).toBeDefined()
    expect(HAPTIC_RADIUS.shell).toBe("1rem")
  })
  it("[WHO] exports HAPTIC_PADDING", () => {
    expect(HAPTIC_PADDING).toBeDefined()
  })
  it("[WHO] exports HAPTIC_INDENT", () => {
    expect(HAPTIC_INDENT).toBeDefined()
  })
  it("[WHO] exports HAPTIC_CHIP_COLORS", () => {
    expect(HAPTIC_CHIP_COLORS).toBeDefined()
    expect(Object.keys(HAPTIC_CHIP_COLORS)).toHaveLength(7)
  })
  it("[WHO] exports HAPTIC_SELECTOR_SELECTED/UNSELECTED", () => {
    expect(HAPTIC_SELECTOR_SELECTED).toBeDefined()
    expect(HAPTIC_SELECTOR_UNSELECTED).toBeDefined()
  })
})

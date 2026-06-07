import { describe, it, expect } from "vitest"
import { springSnappy, springSoft, tweenSurface, HAPTIC_GRADIENT, HAPTIC_ELEVATION } from "./motion"

describe("motion.ts contract", () => {
  it("[WHO] exports springSnappy transition", () => {
    expect(springSnappy).toBeDefined()
    expect(springSnappy.type).toBe("spring")
  })
  it("[WHO] exports springSoft transition", () => {
    expect(springSoft).toBeDefined()
    expect(springSoft.type).toBe("spring")
  })
  it("[WHO] exports tweenSurface transition", () => {
    expect(tweenSurface).toBeDefined()
    expect(tweenSurface.duration).toBe(0.18)
  })
  it("[WHO] exports HAPTIC_GRADIENT (re-export)", () => {
    expect(HAPTIC_GRADIENT).toBeDefined()
  })
  it("[WHO] exports HAPTIC_ELEVATION (re-export)", () => {
    expect(HAPTIC_ELEVATION).toBeDefined()
  })
})

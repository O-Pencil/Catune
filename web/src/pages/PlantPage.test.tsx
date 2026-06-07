import { describe, it, expect } from "vitest"
import { PlantPage } from "./PlantPage"

describe("PlantPage.tsx contract", () => {
  it("[WHO] exports PlantPage component", () => {
    expect(PlantPage).toBeDefined()
    expect(typeof PlantPage).toBe("function")
  })
})

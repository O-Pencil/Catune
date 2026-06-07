import { describe, it, expect } from "vitest"
import { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent } from "./card"

describe("card.tsx contract", () => {
  const components = { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent }
  Object.entries(components).forEach(([name, Component]) => {
    it(`[WHO] exports ${name}`, () => {
      expect(Component).toBeDefined()
      expect(typeof Component).toBe("function")
    })
  })
})

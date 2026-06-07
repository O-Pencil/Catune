import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import {
  FilterIcon,
  UtilityPlusIcon,
  PlusIcon,
  MinusIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CheckIcon,
  SearchIcon,
} from "./icons"

describe("icons.tsx contract", () => {
  const icons = [
    { name: "FilterIcon", Component: FilterIcon },
    { name: "UtilityPlusIcon", Component: UtilityPlusIcon },
    { name: "PlusIcon", Component: PlusIcon },
    { name: "MinusIcon", Component: MinusIcon },
    { name: "ChevronDownIcon", Component: ChevronDownIcon },
    { name: "ChevronRightIcon", Component: ChevronRightIcon },
    { name: "CheckIcon", Component: CheckIcon },
    { name: "SearchIcon", Component: SearchIcon },
  ]

  icons.forEach(({ name, Component }) => {
    it(`[WHO] exports ${name}`, () => {
      expect(Component).toBeDefined()
      expect(typeof Component).toBe("function")
    })
  })
})

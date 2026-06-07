import { describe, it, expect } from "vitest"
import * as haptic from "./index"

describe("haptic/index.ts contract", () => {
  const expectedExports = [
    "HapticButton",
    "HapticIconButton",
    "HapticSwitch",
    "HapticSlider",
    "HapticRadio",
    "HapticCheckbox",
    "HapticChip",
    "HapticStepper",
    "HapticProgress",
    "HapticSegmentedControl",
    "HapticTabs",
    "HapticAvatar",
    "HapticBadge",
    "HapticAccordion",
    "HapticAccordionItem",
    "HapticAccordionTrigger",
    "HapticAccordionContent",
    "HapticKnob",
    "HapticSelect",
    "HapticTooltip",
    "HAPTIC_PALETTE",
    "HAPTIC_GRADIENTS",
    "HAPTIC_ELEVATION",
    "HAPTIC_RADIUS",
  ]

  expectedExports.forEach((name) => {
    it(`[WHO] re-exports ${name}`, () => {
      expect(haptic[name as keyof typeof haptic]).toBeDefined()
    })
  })
})

# Surfaces

Use this to understand where UI work belongs.

## Desk

Primary daily surface. Owns the posture score, current posture state, advice, training entry, and assess entry. It should remain focused and fast to scan.

## Plant

Feedback loop surface. Owns growth, daily/weekly summaries, and positive reinforcement. It should not become a settings or diagnostics surface.

## Monitor

Observation surface. Owns raw-ish signals, source status, and runtime state useful for debugging posture flow.

## Settings

Configuration and diagnostics surface. Owns data source selection, BLE controls, locale, memory controls, model download/debug, and assessment config.

## Training

Focused overlay. Owns one action at a time. Keep exits clear and do not add broad navigation here.

## Assess

Focused overlay. Owns image pick/capture, readiness, loading, and result. Failure must fall back gracefully.

## Onboarding

First-run preference capture. Keep questions few and skippable. Write only useful memories.

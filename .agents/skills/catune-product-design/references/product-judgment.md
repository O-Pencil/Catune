# Product Judgment

Use this when a change affects what the user is trying to accomplish or how the app behaves.

## Catune User Job

The user wants a calm posture assistant that helps them notice and correct sitting posture without feeling medicalized, judged, or interrupted by unnecessary complexity.

## Product Objects

- Posture state: `NORMAL`, `SLUMPED`, `TECH_NECK`, `LEFT_LEAN`, `OFFLINE`.
- Signal: neck pitch, thoracic pitch, lumbar roll.
- Advice: short coaching text plus optional action.
- Training action: a concrete exercise tied to the posture state.
- Growth/report: feedback loop for consistency and review.
- Model/debug state: advanced capability, secondary to posture help.

## Decision Checklist

Before adding UI, answer:

- Who is acting?
- What are they trying to do now?
- What object changes?
- What consequence must be communicated?
- Is the action reversible?
- What states can this surface actually enter?
- Can a default behavior remove the need for a setting?

## Preferred Product Direction

- Keep Desk as the primary daily working surface.
- Keep Settings for configuration, diagnostics, and advanced controls.
- Keep model/MNN details secondary; do not let debug complexity dominate the app.
- Keep coaching language short, warm, and specific.
- Avoid medical diagnosis, treatment claims, or fear framing.
- Avoid marketing-page composition inside the app.

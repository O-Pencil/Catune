# Interface Quality

Use this for visual hierarchy, layout, responsive behavior, and component quality.

## Design System

- Source of truth: `src/design/theme`.
- Screens: `src/design/screens`.
- Reusable components: `src/design/components`.
- Base primitives: `src/design/primitives`.
- Icons: `src/design/icons`.
- Text: `src/design/i18n`.

## Quality Bar

- One primary focus per screen.
- Important values must be scan-friendly: score, posture, source, state.
- Dense diagnostic areas are allowed only in Settings/Monitor.
- Do not use decorative cards inside other cards.
- Do not create landing-page hero layouts inside the app.
- Use spacing, alignment, typography, and state color before adding extra containers.
- Keep compact-width layouts readable and non-overlapping.
- Use stable dimensions for repeated controls, tabs, counters, and toolbars.

## State Coverage

For material UI changes, check:

- loading
- empty
- populated
- disabled
- error
- offline/no sensor
- long localized text
- compact phone width
- wide web preview

## Component Choice

- Use `TabBar` only for primary app navigation.
- Use buttons for commands, chips/segmented controls for mode choice, toggles for binary settings.
- Use cards for repeated items or contained panels, not as generic page wrappers.
- Use icon buttons only when the icon is familiar or has an accessible label.

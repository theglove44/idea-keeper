# AGENTS.md

## Interaction Learnings

### Modal Scroll and Clipping
- For tall modal content, make the modal container itself the primary scroll surface (`overflow-y-auto`) instead of relying on nested inner scroll regions.
- Use dynamic viewport constraints on the modal (`max-height` based on `100dvh`) with safe margins so content does not clip at the bottom on shorter screens.
- In flex layouts, set `min-h-0` on shrinkable content regions and `shrink-0` on persistent action/composer sections.
- Avoid multiple competing `overflow-y-auto` containers inside the same modal flow unless there is a strict reason; they can trap scroll and hide bottom inputs.
- When a user asks for “window scroll” behavior, implement full-modal scrolling first, then tune internal panel scrolling only if needed.

### Regression Check for Modal UI Changes
- Validate at shorter viewport heights (including laptop-height windows) to confirm the bottom composer is fully reachable.
- Confirm that comment input, action buttons, and submit controls are visible without clipping.
- Keep keyboard/focus behavior intact while adjusting scroll layout.

### Activity Feed Layout Guardrails
- Do not make the activity/feed container `flex-1` when the composer/action panel must appear directly below it in normal document flow.
- If comments exist, verify feed entries do not render under or behind the `Next Action` section.
- Prefer a single vertical flow (`Activity` then `Composer`) inside the modal and rely on modal-level scrolling for overflow.
- After any flex/overflow adjustment, test with long comments to confirm there is no visual overlap between feed content and form controls.

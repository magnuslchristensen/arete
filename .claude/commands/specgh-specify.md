---
description: Start a new Arete feature spec, grounded in arete-spec.md
argument-hint: "<feature description>" [#issue-number]
---

Run the **specgh-specify** workflow to start a new feature in the specgh
workflow for this repository.

## Grounding (Arete-specific)

The canonical product specification lives at `arete-spec.md` in the repo root.
**Before running the spec interview, read `arete-spec.md`** and use it as the
source of truth for:

- Problem statement, target users, goals, and out-of-scope items (§1–§3)
- Core user flows (§4) and the training-plan engine principles (§5)
- The **data model** (§8) — entity and field names defined there are the
  contract; do not invent alternatives. Note `Milestone` is an
  achievement/motivation marker (PBs, streaks, challenges), the race goal
  lives on `User` (`goal_event`, `goal_date`), and `CalendarEvent` is a
  separate entity.
- Non-functional requirements (§12) and the single open question — coach
  persona (§13).

If the feature description below is already answered by `arete-spec.md`, treat
those points as resolved instead of re-asking. Only flag genuinely new
`[NEEDS CLARIFICATION]` items. Map the feature to the most appropriate
milestone (Phase 1–6) from `.specgh/config.json`.

## Invoke

Invoke the `specgh-specify` skill with this feature description:

$ARGUMENTS

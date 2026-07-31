# Next Step Sports Platform — Agent Build Pack v1.0

This pack turns the founder discussion into a buildable business, product and technical specification for the first version of the Next Step Sports Platform.

## Start here

1. Give the orchestration agent `START_HERE_AGENT_PROMPT.md` together with the full pack.
2. Read `NextStep_Sports_Platform_Spec_v1.0.md`.
3. Give every specialist build agent `AGENTS.md`.
4. Use `contracts/openapi.yaml` as the API-contract starting point.
5. Use `data/schema.prisma` as the persistence-model starting point.
6. Use `data/seed_curriculum.json` to build the first end-to-end curriculum fixture.
7. Review `VALIDATION.md` and reproduce its implementation-repository checks in CI.

## Included files

- `NextStep_Sports_Platform_Spec_v1.0.md` — primary machine-readable source of truth.
- `NextStep_Sports_Platform_Spec_v1.0.docx` — formatted human-review copy.
- `START_HERE_AGENT_PROMPT.md` — copy-ready bootstrap prompt for the orchestration agent.
- `AGENTS.md` — multi-agent roles, sequencing, rules and definition of done.
- `contracts/openapi.yaml` — OpenAPI 3.1 skeleton covering the core vertical slice.
- `data/schema.prisma` — starter PostgreSQL/Prisma domain schema.
- `data/seed_curriculum.json` — coherent basketball Foundation seed with nodes, drills, campaign and rubrics.
- `diagrams/*.dot` and `diagrams/*.png` — editable source and rendered architecture/product diagrams.
- `VALIDATION.md` — completed artifact checks and the validation gates that must be added to repository CI.

## Important status notes

- Product decisions labelled `[DECISION]` are founder-aligned.
- Choices labelled `[ASSUMPTION]` are recommended starting points and can be changed through an ADR.
- Pricing, milestone cadence and certain operating policies remain hypotheses for pilot validation.
- The OpenAPI contract and Prisma schema are starter contracts, not a completed production implementation.
- Legal, privacy, insurance and child-safety obligations require professional review before public launch.

## Suggested first vertical slice

Build a parent-controlled athlete profile that receives one Foundation campaign, completes a guided practice, updates one skill node, submits one private evidence clip, receives one rubric-based coach decision and unlocks the next node. Do not begin social, marketplace, multi-sport or AI features before this loop works reliably.

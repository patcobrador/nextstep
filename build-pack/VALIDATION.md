# Validation record — Build Pack v1.0

Validation date: 29 July 2026

## Completed checks

- The primary Markdown specification is present and internally organised around stable decision labels: `[DECISION]`, `[ASSUMPTION]`, `[OPEN]` and `[OUT OF SCOPE]`.
- The formatted DOCX was rendered to 54 A4 pages and every rendered page was visually reviewed for clipping, overlap, broken tables, missing glyphs and header/footer defects.
- DOCX accessibility audit result: **0 high**, **0 medium**, **8 low** findings. The remaining low findings are raw-URL display text in the references appendix.
- `contracts/openapi.yaml` parses as YAML and declares OpenAPI 3.1.
- OpenAPI structural checks passed for 26 paths, 29 operations and 125 local `$ref` occurrences. Operation IDs are unique, local references resolve and declared path parameters cover every path template variable.
- `data/seed_curriculum.json` parses as JSON. Cross-reference checks passed for 28 skill nodes, 15 drills, one campaign and two rubrics, including domains, stages, prerequisite nodes, campaign steps and rubric anchors.
- `data/schema.prisma` passed repository-local structural checks for 58 models and 33 enums: balanced blocks, unique fields, known scalar/model/enum types, primary identifiers, relation field references and index field references.
- All editable Graphviz `.dot` diagrams have corresponding rendered `.png` files.

## Validation that must run in the implementation repository

The container used to create this pack did not provide the Prisma CLI or a full OpenAPI semantic validator. The implementation repository must therefore make these commands part of Slice 0 CI once dependencies are installed:

```bash
npx prisma format --schema data/schema.prisma
npx prisma validate --schema data/schema.prisma
npx prisma migrate diff --from-empty --to-schema-datamodel data/schema.prisma --script
```

Also add a standards-complete OpenAPI 3.1 validator, generated-client compilation, schema linting and contract tests. The starter contracts are intentionally broad and should evolve through reviewed changes and ADRs rather than being treated as generated production code.

## Release interpretation

This record validates the **build pack as an implementation starting point**. It is not evidence of a deployed application, completed security assessment, legal approval, clinical/sports-science endorsement or production readiness.

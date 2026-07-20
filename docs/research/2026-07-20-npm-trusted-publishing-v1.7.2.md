# Research Note: npm Trusted Publishing for v1.7.2

- Topic: Current GitHub Actions OIDC and npm trusted-publishing requirements
- Date: 2026-07-20
- Owner: Codex
- Related task: `RELEASE-V1.7.2`
- Refresh before: the next publish-workflow edit

## Question

Does the existing tag-triggered workflow still meet the current trusted-publishing requirements for npm?

## Sources

| Source | Type | Date checked | Notes |
|---|---|---|---|
| https://docs.npmjs.com/trusted-publishers/ | official npm docs | 2026-07-20 | Requires npm 11.5.1+ and Node 22.14.0+; trusted publishing uses OIDC and automatically emits provenance for eligible public packages. |
| https://docs.github.com/en/actions/reference/security/oidc | official GitHub docs | 2026-07-20 | `id-token: write` permits the workflow to request an OIDC token; checkout also needs `contents: read`. |

## Findings

- The repository pins Node `22.14.0`, npm `11.18.0`, `id-token: write`, and `contents: read`, satisfying the documented minimums.
- The existing public-package workflow remains suitable; no workflow edit or npm token is needed.
- Keeping `--provenance` is redundant under trusted publishing but harmless, so changing it would be unrelated release churn.

## Decision Impact

Use the existing `.github/workflows/publish.yml` unchanged for `v1.7.2`.

## Risks And Unknowns

- The npm package-side trusted-publisher binding cannot be inferred from YAML alone; post-tag Actions and registry verification remain required.

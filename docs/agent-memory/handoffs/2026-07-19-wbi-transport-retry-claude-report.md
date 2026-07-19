# Claude Report: Retry WBI Transport Failures

## Objective

Implement GitHub Issue #14 — classify native WBI fetch `TypeError` failures before `withRetry` so they are retried, and guarantee `clearTimeout` on every fetch outcome.

## Files Changed

- `src/bilibili/wbi.ts` — wrapped the `fetch()` call inside `getWBI()`'s retry callback with a local `try/catch/finally` (lines 75–91).

## Diff Summary

The `fetch()` call was inline followed by `clearTimeout(timeoutId)`. Replaced with:

```typescript
let navRes: Response;
try {
  navRes = await fetch(`${BASE_URL}/x/web-interface/nav`, { ... });
} catch (error) {
  if (error instanceof TypeError) {
    throw new NetworkError("Network request failed", error);
  }
  throw error;
} finally {
  clearTimeout(timeoutId);
}
```

Three behaviors change:
1. Native `TypeError` → `NetworkError` before `withRetry` sees it → retried (was silently not retried).
2. `clearTimeout` fires on every fetch outcome, not just success.
3. `AbortError` passes through unchanged (not `instanceof TypeError`) → existing retry and `TimeoutError` conversion preserved.

## Commands Run

| Command | Result |
|---|---|
| `npm test -- --run tests/bilibili-wbi.test.ts -t "retries WBI transport failures"` (pre-fix) | FAIL — 0 clearTimeout, 1 fetch |
| `npm test -- --run tests/bilibili-wbi.test.ts -t "retries WBI transport failures"` (post-fix) | PASS |
| `npm test -- --run tests/bilibili-wbi.test.ts tests/bilibili-video-api.test.ts tests/retry.test.ts` | 12 passed, 3 files |
| `npm test` | 177 passed, 19 files |
| `npm run build` | Clean (tsc, no errors) |
| `git diff --check` | Clean (CRLF warnings only, Windows-normal) |

## Skills And Subagents Used

- `diagnosing-bugs`: traced error flow through `getWBI()` → `withRetry` → `shouldRetry` to identify the `TypeError` classification gap.
- `vitest`: ran focused regression and full suite.
- `test-baseline-builder`: confirmed both WBI tests correctly validate acceptance criteria (4 fetches, 4 clearTimeouts, NetworkError name; 1 fetch for 403, statusCode preserved). No missing coverage.
- `risk-reviewer`: stalled after two bounded windows. Risk checklist completed at top level (below).

## Acceptance Criteria Verification

| Criterion | Status |
|---|---|
| Repeated WBI native TypeError produces 4 fetch attempts (maxRetries: 3) | PASS |
| Every attempt calls clearTimeout once | PASS |
| Final error is NetworkError without invented HTTP status | PASS |
| WBI 403 performs 1 fetch, preserves statusCode: 403 | PASS |
| AbortError passes through unwrapped inside withRetry | PASS |
| Cache, key extraction, logging, retry config unchanged | PASS |
| Full tests and build pass | PASS |
| Codemap checked | PASS (no structural change) |

## Top-Level Risk Review (risk-reviewer stalled)

1. **Bug/regression**: No new branches in the success path. `navRes` is guaranteed assigned before use after the try block because `catch` always throws.
2. **TypeScript/MCP**: No schema, tool, or response-shape changes.
3. **Credential leakage**: No credential-adjacent code touched.
4. **Issue #13 status propagation**: `navRes.status` still passed to inner `NetworkError` (line 98); outer catch still propagates `error.statusCode` via `error instanceof NetworkError ? error.statusCode : undefined` (line 165). Unchanged.
5. **AbortError/timeout**: `AbortError` is not `instanceof TypeError`, so it falls through `throw error` in the catch. `withRetry` still sees `AbortError` and retries. Outer catch still converts final `AbortError` to `TimeoutError`. Unchanged.
6. **WBI cache/signature/key/logging**: No changes to cache logic, `getMixKey`, `generateWBISign`, logger calls, or retry options.

## Skipped Checks

- `npm pack --dry-run`: not required — no package metadata, entry points, or publish-file changes.
- Manual cookie-based integration test: not required — no credential, auth, or Bilibili API path changes.
- Issue #14 GitHub label/close: per handoff, do not close the issue or change labels.

## Unresolved Risks

None. The change is a single local try/catch/finally with no new dependencies, no shared-retry changes, and no public API surface modification.

## Harness Artifacts

| Artifact | Status |
|---|---|
| Task ticket | Not required — bounded scoped fix, no public behavior change |
| Research note | Not required — no external facts needed |
| QA checklist | Not required — no release/install/MCP/client flow change |
| Codemap | Checked unchanged — no module ownership, tool flow, test layout, or harness structure change |
| Harness security | Not applicable — no credentials, hooks, skills, or trust-boundary changes |
| Harness eval | Deferred — one-line-local fix, no workflow impact |

## Decision Points

None. Implementation is the minimal fix as specified: one local try/catch/finally, no abstraction, no shared-retry changes, no new dependencies.

# Research Note: npm Trusted Publishing For v1.6.4

- Date: 2026-07-20
- Scope: Validate the existing GitHub Actions npm release path before publishing v1.6.4.
- Staleness: Recheck before future release-workflow changes because Actions and npm requirements can change.

## Sources

- GitHub Docs, Publishing Node.js packages: https://docs.github.com/en/actions/tutorials/publish-packages/publish-nodejs-packages
- npm Docs, Trusted publishers: https://docs.npmjs.com/trusted-publishers/

## Verified Requirements

- A scoped public npm package is published with `npm publish --access public`.
- Provenance is requested with `npm publish --provenance`.
- The workflow grants `contents: read` and `id-token: write` for OIDC/provenance.
- `actions/setup-node` configures `https://registry.npmjs.org/` before publication.
- npm trusted publishing requires a compatible modern npm CLI; the repository workflow explicitly installs current npm before publishing.

## Repository Judgment

`.github/workflows/publish.yml` already satisfies these release-path requirements and previously published v1.6.3 successfully. No workflow edit is required for v1.6.4. The tag-triggered run and npm registry result must still be monitored because configuration correctness does not prove a new release succeeded.

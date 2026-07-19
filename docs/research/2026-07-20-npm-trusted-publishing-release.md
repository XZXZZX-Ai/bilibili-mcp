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
- npm trusted publishing requires a compatible modern npm CLI; the repository workflow installs npm 11.18.0, which is above the trusted-publishing minimum and compatible with Node 22.14.0.

## Repository Judgment

The initial v1.6.4 tag-triggered run showed that `npm@latest` is not a stable major-version selector: it resolved to npm 12.0.1, whose Node engine rejected Node 22.14.0. The workflow now pins npm 11.18.0. Manual run `29695975757` passed install, tests, build, and trusted publication; npm registry metadata exposes the v1.6.4 SLSA provenance attestation.

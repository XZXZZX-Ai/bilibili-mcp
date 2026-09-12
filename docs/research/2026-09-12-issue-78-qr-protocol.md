# QR login protocol and encoder review

## Research Topic

2026-09-12, Codex, Issue #78. Refresh if first-party login behavior changes.

## Question and sources

How does the current Bilibili login page map QR states, and which local encoder fits Node ESM without network or image output?

- First-party page: https://passport.bilibili.com/login
- Current entry: https://s1.hdslb.com/bfs/static/2233-monorepo/passport/static/js/index.6bb6210f.js
- First-party login implementation: https://s1.hdslb.com/bfs/static/2233-monorepo/passport/static/js/async/560.4903185b.js and https://s1.hdslb.com/bfs/static/2233-monorepo/passport/static/js/async/476.c21ae863.js
- Anonymous challenge: https://passport.bilibili.com/x/passport-login/web/qrcode/generate
- Encoder upstream package: https://github.com/kazuhikoarase/qrcode-generator/blob/master/js/package.json and https://github.com/kazuhikoarase/qrcode-generator/blob/master/js/README.md
- Live registry: npm view qrcode-generator@2.0.4; installed dist/qrcode.mjs and dist/qrcode.d.ts reviewed.

## Findings and decision

The first-party chunks call the fixed generate/poll paths. Their polling handlers require top-level code 0, then map nested 0 to completed login, 86101 to unscanned, 86038 to expired, and 86090 to scanned/awaiting confirmation. The website uses a 2-second delay; this CLI deliberately uses the approved slower 3-second interval and a 180-second attempt deadline.

An anonymous generation probe returned HTTP 200/code 0, a challenge key, and HTTPS account.bilibili.com with path /h5/account-h5/auth/scan-web. No key or full URL was printed/persisted; no user scan occurred. Earlier planning observed one unscanned poll only. Successful mobile login and Set-Cookie attributes remain unobserved live; tests use synthetic responses. One unrelated async source chunk timed out; the two relevant state handlers above were retrieved successfully.

Use exact qrcode-generator 2.0.4: MIT metadata/source header, zero runtime dependencies, built-in declarations, explicit ESM export, no install hook. Its encoder module has no network, filesystem, console or eval calls. Use only matrix generation, with a small terminal renderer enforcing four-module quiet zones and available terminal dimensions; no file/image creation. This avoids the additional image/CLI dependency tree of a general QR image package. npm installed one package with lifecycle scripts disabled; lock integrity pins the bytes.

Keep requests anonymous, fixed HTTPS, redirects rejected, bodies bounded, and request/attempt cancellation explicit. Obtain individual Set-Cookie headers using Node Headers.getSetCookie; never split on commas because Expires includes commas. Reject absent, duplicate or malformed required values; retain only the three existing fields and conservative local expiry. Never follow successful redirect URLs or retain refresh tokens. No claim of a supported public Bilibili authentication API is made.

## Risks and follow-up

Native Windows/macOS/Linux scan readability and live mobile confirmation remain #79 acceptance work. Unexpected response structures fail closed with manual fallback; do not infer success from the website source alone. No new MCP tool or automatic renewal is introduced.

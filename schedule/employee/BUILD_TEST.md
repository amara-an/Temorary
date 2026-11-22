# Cloudflare Workers Builds connection test

This file is a non-code change to trigger a GitHub build for the existing employee Worker `staff-test`.

Worker source: `worker.js` (v4.6.2)
Wrangler configuration: `wrangler.jsonc`
Build deploy command: `npx wrangler versions upload --config schedule/employee/wrangler.jsonc`

The command uploads a new version without activating it for production traffic.

## Retest after watch path correction

Second build trigger for `schedule/employee/*`, with no Worker code changes.

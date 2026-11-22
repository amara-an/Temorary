# Admin Worker (testform)

Cloudflare Workers Builds GitHub 연동용 관리자 Worker입니다.

- Source: `worker.js`
- Wrangler: `wrangler.jsonc`
- Existing Worker: `testform`
- D1 binding: `DB` → `schedule-test-db`

빌드 배포 명령은 현재 **`npx wrangler versions upload --config schedule/admin/wrangler.jsonc`** 입니다. 이 명령은 새 버전만 업로드하며 활성 Worker로 자동 배포하지 않습니다.

`ADMIN_PASSWORD` 등 비밀값은 GitHub에 저장하지 않고 Cloudflare에서 관리합니다.

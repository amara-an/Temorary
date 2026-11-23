# 근무표 웹앱 — Schedule Workers

**새 ChatGPT 대화를 시작할 때 가장 먼저 읽을 문서: [개발 인수인계 HANDOFF.md](./HANDOFF.md)**

현재 개발·배포 상태와 운영 원칙, 구현한 기능, 미완성 작업, D1 저장 구조, 새 대화에서 이어가는 방법을 인수인계 문서에 정리했습니다.

## 소스와 실제 배포

| | 관리자 | 직원용 |
|---|---|---|
| Worker | [testform](https://testform.mara04.workers.dev) | [staff-test](https://staff-test.mara04.workers.dev) |
| 소스 | [admin/worker.js](./admin/worker.js) (v20.14.8) | [employee/worker.js](./employee/worker.js) (v4.6.2) |
| Wrangler | [admin/wrangler.jsonc](./admin/wrangler.jsonc) | [employee/wrangler.jsonc](./employee/wrangler.jsonc) |

Cloudflare Workers Builds는 `main`의 코드 변경을 감지해 **자동으로 실제 Worker에 배포**하도록 연결되어 있습니다. 관리자는 `schedule/admin/*`, 직원용은 `schedule/employee/*`를 감시합니다.

- 관리자 배포 명령: `npx wrangler deploy --config schedule/admin/wrangler.jsonc`
- 직원용 배포 명령: `npx wrangler deploy --config schedule/employee/wrangler.jsonc`
- D1 바인딩: 양쪽 모두 `DB` → `schedule-test-db` (기존 데이터 보존)
- Secrets·API 토큰·실제 접속키를 공개 저장소에 저장하지 마세요.

## 새 대화에서

> GitHub `amara-an/Temorary/schedule/HANDOFF.md`를 먼저 읽고, `admin/worker.js`와 `employee/worker.js` 최신 코드 기준으로 작업을 이어가자. 코드 수정은 GitHub에 커밋하고 Cloudflare 자동 배포 결과를 확인해줘.

**주의:** 이전 실험용 README보다 `HANDOFF.md` 및 최신 Worker 코드가 우선입니다. 이 폴더는 테스트 프로젝트이며 DB 초기화나 무단 운영용 전환을 하지 않습니다.

## 개발 협업 및 검증 방식

- **실제 화면 확인과 기능 테스트는 사용자가 직접 한다.** GitHub 커밋 후 매번 '실제 배포 화면은 확인하지 못했다', '배포 여부를 검증하지 못했다' 같은 상투적인 문구를 반복하지 않는다.
- 어시스턴트는 요청받은 코드 변경을 수행하고 **수정 내용과 커밋 결과만 간결하게 보고**한다. 테스트 결과를 확인한 것처럼 주장하지 않으며, 사용자가 테스트에서 발견한 문제를 알려주면 그에 맞춰 수정한다.
- Cloudflare Workers Builds 자동 배포 구성은 유지한다. 배포 상태 확인이 별도로 필요한 경우에만 요청 또는 작업 맥락에 따라 확인·보고한다.

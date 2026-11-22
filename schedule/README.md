# Schedule Workers

관리자 및 직원용 Cloudflare Workers 코드 보관용입니다. 기존 `Temorary` 폴더들은 변경하지 않습니다.

- `admin/worker.js`: 관리자 Worker **v20.14.2** — 일간표 내용 우선 편집, 월간 근무표·휴무 관리
- `employee/worker.js`: 직원 Worker **v4.6.2** — 개인 근무표, 휴무 신청·취소, 신청자 명단, 월간 PDF

## Cloudflare 연결 전 확인

이 저장소는 공개 저장소입니다. 비밀번호, API 토큰 및 기타 비밀값은 이 폴더에 저장하지 않습니다.

각 기존 Worker에서 **Settings → Builds → Connect**로 이 GitHub 저장소를 연결할 수 있습니다. 관리자 Worker의 프로젝트 루트는 `schedule/admin`, 직원 Worker는 `schedule/employee`로 각각 지정합니다.

**아직 Wrangler 배포 설정은 포함하지 않았습니다.** 배포 전에 각 디렉터리에 `wrangler.jsonc`를 작성해야 합니다. 다음 항목은 실제 Cloudflare에 설정된 값을 확인한 뒤 채워 넣어야 합니다.

- 기존 Worker의 정확한 `name` (Cloudflare 대시보드와 일치)
- `main: "worker.js"`, `compatibility_date`
- 기존 D1 데이터베이스 ID 및 `DB` 바인딩 (관리자·직원 **동일 DB**)
- 관리자 Worker의 `ADMIN_PASSWORD` Secret 등 기존 비밀값 및 배포 관련 설정

기존 D1을 삭제·초기화하거나 새 DB를 자동 생성하지 마세요. **이 코드는 보관용이며 Cloudflare 연결·배포는 아직 진행하지 않았습니다.**

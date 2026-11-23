// v20.15.0: month-wide daily XLSX export (one sheet per date).
// v20.14.8: equalize selected row heights only; do not modify merged cell spans.
// v20.14.5: fill remaining screen with daily sheet editor; preserve inline input and A1 notes.
// Cloudflare Worker v20.14.1: recover code/roster loading by decoupling leave quota schema; preserve daily editor.
// D1 is authoritative for leave markers in both roster and XLSX; no DB migration needed.
// Existing D1 records are retained; deployment does not import or remove records.
// Passkeys remain UI-only. Requires DB and ADMIN_PASSWORD secret.
const PAGE = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>월간 근무표 · 관리자 시연</title>
<style>
:root{font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;color:#263446;background:#f3f6fb;font-size:14px}
*{box-sizing:border-box}body{margin:0}button,input,select{font:inherit}button{cursor:pointer;touch-action:manipulation}input,select{border:1px solid #ced8e3;border-radius:7px;padding:7px;background:#fff;color:inherit}button:focus-visible,input:focus-visible{outline:3px solid #4d93e4;outline-offset:1px}
.app{display:flex;min-height:100dvh}.rail{position:sticky;top:0;height:100dvh;width:58px;flex-shrink:0;background:#223a60;display:flex;flex-direction:column;align-items:center;gap:13px;padding-top:20px}.rail strong{color:#fff;font-size:19px}.rail a{color:#dce7f7;text-decoration:none;font-size:24px;padding:6px 12px;border-radius:9px}.rail a.active{background:#45648b}
.page{min-width:0;flex:1;padding:16px 18px}.top{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px}.top h1{font-size:21px;margin:0 14px 0 0;color:#163b63}.month{font-size:20px;font-weight:800}.btn{border:1px solid #c9d5e5;background:#fff;border-radius:8px;padding:9px 12px;font-weight:700;white-space:nowrap;color:#1e496c}.btn.primary{background:#2b69a7;color:white;border-color:#2b69a7}
.roster-label{width:clamp(155px,18vw,260px);max-width:100%;min-width:0;min-height:42px;padding:8px 12px;border:1px solid #c9d5e5;border-radius:8px;background:#fff;color:#173e68;font-weight:750;font-size:15px}
.roster-label::placeholder{color:#8696a7;font-weight:500}
.roster-label:focus{outline:2px solid #4d93e4;outline-offset:1px}
@media(max-width:600px){.roster-label{flex:0 0 220px;width:220px}}.btn:disabled{opacity:.5;cursor:not-allowed}.deadline{display:flex;align-items:center;gap:7px;color:#53667b}.deadline input{width:136px}#scheduleView .top{gap:6px;flex-wrap:nowrap;overflow-x:auto;overflow-y:hidden;padding-bottom:3px}#scheduleView .top>*{flex-shrink:0}#scheduleView .top h1{font-size:19px;margin-right:3px;white-space:nowrap}#scheduleView .roster-label{width:220px;min-width:220px;max-width:none;flex:0 0 220px;padding:8px 10px}#scheduleView .deadline{gap:4px;white-space:nowrap;font-size:13px}#scheduleView #leaveCapacity{width:30px;min-width:30px;max-width:30px;flex:0 0 30px;padding:7px 0;text-align:center;appearance:textfield;-moz-appearance:textfield}#scheduleView #leaveCapacity::-webkit-inner-spin-button,#scheduleView #leaveCapacity::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}#scheduleView #deadline{width:125px;padding:7px 3px}#scheduleView .top .btn{padding:9px 8px}#scheduleView .top .month{font-size:18px;white-space:nowrap}.push{margin-left:auto}.notice{color:#6c7786;font-size:12px;margin-bottom:12px}
.content{display:grid;grid-template-columns:minmax(0,1fr) 252px;gap:12px;align-items:start}.panel{background:white;border:1px solid #d8e1ec;border-radius:12px;box-shadow:0 3px 9px #1839590a;min-width:0}.roster-head{padding:11px 13px;border-bottom:1px solid #e4ebf3;font-size:15px;font-weight:800;display:flex;justify-content:space-between;gap:9px}.hint{font-size:11px;color:#7f8c9a;font-weight:500}
.sheet{height:min(71dvh,735px);min-height:430px;overflow:auto;overscroll-behavior:contain}.table{border-collapse:separate;border-spacing:0;table-layout:fixed;width:max-content;min-width:100%}.table th,.table td{border-right:1px solid #c4d0df;border-bottom:1px solid #c4d0df;text-align:center;padding:0;height:36px;white-space:nowrap;background:white}.table th{font-size:12px;background:#eaf1f8}.table th.sun{color:#d44c56}.table th.sat{color:#367ac1}.table .n{width:38px;min-width:38px;max-width:38px;position:sticky;left:0;z-index:4}.table .who{width:108px;min-width:108px;max-width:108px;position:sticky;left:38px;z-index:4;text-align:left;padding-left:9px;font-weight:700;background:#f8fafd}.table thead th{position:sticky;top:0;z-index:5;height:35px}.table thead .n,.table thead .who{z-index:7}.table thead tr.counts th{top:35px;font-size:12px;height:30px;background:#f7f9fd}.table .d{width:56px;min-width:56px;max-width:56px}.table .hours{width:77px;min-width:77px;max-width:77px;background:#f8fafd}.table td:first-child{background:#f8fafd}.table td[data-cell]{cursor:text;font-weight:650;font-size:13px}.table td[data-cell]:hover{background:#f0f7ff}.table td.work-holiday{background:var(--rest-bg,#ffebed);color:var(--rest-fg,#b9303e)}.table td.work-annual{background:var(--annual-bg,#e7f0ff);color:var(--annual-fg,#215d9f)}.table td.work-am{background:linear-gradient(to right,#ffe5e9 0 50%,#fff 50%)}.table td.work-pm{background:linear-gradient(to right,#fff 0 50%,#ffe5e9 50%)}.table td:has(input){outline:2px solid #2b78d3;outline-offset:-2px;position:relative;z-index:2}.cell-edit{display:block;width:100%;height:33px;border:0;border-radius:0;text-align:center;padding:0;background:#fff;color:#182b4e;font-weight:750}
.aside{padding:14px;position:relative}.aside h2{font-size:16px;margin:0 0 14px;color:#244a75}.aside .picked{font-size:17px;font-weight:800;padding:10px 0;border-bottom:1px solid #dfe5ed;margin-bottom:9px}.leave-item{display:flex;gap:7px;align-items:center;justify-content:space-between;border-bottom:1px solid #edf1f6;padding:8px 0;font-size:13px}.leave-item button{border:0;background:transparent;color:#c23a43;font-weight:800;padding:3px 7px}.leavecontrols{display:grid;gap:8px;margin-top:15px}.leavecontrols select,.leavecontrols button{width:100%;min-height:37px}.pill{font-size:11px;color:#b53949;background:#feecef;border-radius:5px;padding:3px 5px}.pill.am,.pill.pm{background:#fbe7ec}.no-entries{color:#8694a5;padding:12px 0}.bottom{margin-top:12px;padding:12px}.bottom .groups{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.bottom .group{min-width:0;border:1px solid #dce4ee;padding:10px;border-radius:9px}.bottom .group h3{font-size:13px;margin:0 0 7px}.bottom .group .codes{display:flex;gap:6px;flex-wrap:wrap}.code{display:inline-flex;gap:6px;font-size:12px;padding:5px;border-radius:6px;border:1px solid #e4e8f0;background:#fcfdff}.foot{font-size:12px;color:#708296;margin-top:11px}.bottom .empty{color:#a0a9b3}
@media(max-width:900px){.content{grid-template-columns:minmax(0,1fr)}.sheet{height:min(65dvh,670px)}.aside{padding:12px}.bottom .groups{gap:5px}}
@media(max-width:600px){.page{padding:10px 8px}.rail{width:38px}.rail a{font-size:17px;padding:6px}.top{gap:6px}.top h1{width:100%;margin:0 0 2px}.push{margin-left:0}.deadline input{width:124px}.table .who{width:88px;min-width:88px;max-width:88px}.btn{padding:7px 9px}}

.table td[data-cell]{outline-offset:-2px}
.table td[data-cell].cell-selected{box-shadow:inset 0 0 0 3px #2b78d3;background-color:#e8f3ff}
.table td[data-cell]:focus-visible{outline:3px solid #2b78d3;outline-offset:-3px}

#dailyTemplateView.saving .daily-edit-tools,#dailyTemplateView.saving .daily-name-code,#dailyTemplateView.saving .daily-sheet-wrap{pointer-events:none;opacity:.7}
/* Selected date: translucent overlay keeps duty and leave colors readable. */
#scheduleView .table th.date-highlight{background:#cfe5ff!important;color:#174879}
#scheduleView .table td.date-highlight{box-shadow:inset 0 0 0 999px rgba(48,124,214,.13)}
#scheduleView .table td[data-cell].cell-selected{box-shadow:inset 0 0 0 2px #2b78d3,inset 0 0 0 999px rgba(48,124,214,.18)}
#scheduleView .table td.leave-locked{cursor:not-allowed}
#scheduleView .table td.leave-locked.cell-selected{box-shadow:inset 0 0 0 2px #2b78d3,inset 0 0 0 999px rgba(48,124,214,.18)}

/* Cancelled leave stays visible in the leave list, but no longer marks the roster. */
#scheduleView .leave-item .leave-summary{min-width:0;line-height:1.6}
#scheduleView .leave-item.leave-cancelled .leave-person-name{text-decoration:line-through;text-decoration-thickness:2px;color:#8893a2}
#scheduleView .leave-item.leave-cancelled .pill{opacity:.55}
#scheduleView .leave-cancel-tag{font-size:11px;color:#778599;font-weight:700;white-space:nowrap}
#scheduleView .leave-item button[data-leave-action="restore"]{color:#236caa}
/* Code administration: roomy iPad-friendly controls; existing roster untouched. */
#scheduleView[hidden],#codeView[hidden],#peopleView[hidden]{display:none!important}
.rail button{border:0;background:transparent;color:#dce7f7;font-size:25px;padding:10px 9px;border-radius:11px;min-width:46px;min-height:51px;cursor:pointer}.rail button.active{background:#456b9f;color:#fff}
.code-top{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px}.code-top h1{font-size:24px;margin:0;color:#183d65}.code-top .sub{color:#61758a;font-size:14px}
.code-layout{display:grid;grid-template-columns:minmax(405px,1.15fr) minmax(330px,.85fr);gap:14px;align-items:start}
.code-admin-list,.code-editor{padding:16px;min-width:0}
.code-toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px}.code-toolbar input{font-size:17px;min-height:48px;flex:1;min-width:135px}.code-toolbar button{min-height:48px}
.code-admin-list h2,.code-editor h2{margin:0 0 12px;color:#173e68;font-size:21px}
.code-scroll{overflow-x:auto;max-height:66dvh;overflow-y:auto;border:1px solid #d6e2ee;border-radius:10px}
.code-table{border-collapse:collapse;width:100%;font-size:16px;white-space:nowrap}.code-table th,.code-table td{padding:12px 11px;border-bottom:1px solid #d6e2ee;text-align:left}.code-table th{background:#edf3fb;position:sticky;top:0;z-index:1;color:#385471;font-size:14px}.code-table tr[data-code]{cursor:pointer}.code-table tr[data-code]:hover{background:#eef6ff}.code-table tr.chosen{background:#dcecff}.code-table .code-name{font-size:19px;font-weight:850}.code-table td .blank{color:#8b96a6}.color-dot{display:inline-block;width:20px;height:20px;border-radius:6px;border:1px solid #c8d3e1;vertical-align:middle}
.code-editor{position:sticky;top:12px}.editor-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.editor-field{display:flex;flex-direction:column;gap:6px;min-width:0}.editor-field.wide{grid-column:1/-1}.editor-field label{font-size:15px;font-weight:800;color:#405874}.editor-field input,.editor-field select{width:100%;min-height:51px;font-size:18px;padding:10px 12px}.editor-field input[type=color]{height:52px;padding:5px;cursor:pointer}.editor-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:18px}.editor-actions .btn{min-height:52px;font-size:17px}.editor-actions .danger{color:#c63b46;border-color:#efc5c9}
.special-set{border-top:1px solid #d6e2ee;margin-top:18px;padding-top:17px}.special-set h3{font-size:17px;margin:0 0 11px}.special-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:9px 0;border:1px solid #e4eaf2;border-radius:9px;padding:8px 12px;font-weight:700}.special-row input[type=color]{width:100px;height:43px;padding:3px}.special-chip{display:inline-grid;place-items:center;min-width:41px;height:36px;border-radius:7px;font-size:19px;font-weight:850}
.code-note{font-size:14px;color:#687b8e;margin-top:11px;line-height:1.5}
@media(max-width:1050px){.code-layout{grid-template-columns:minmax(280px,1fr) minmax(300px,1fr)}.code-admin-list,.code-editor{padding:13px}.code-table th,.code-table td{padding:11px 8px}.code-table{font-size:15px}}
@media(max-width:950px){.code-layout{grid-template-columns:1fr}.code-editor{position:static}.code-scroll{max-height:49dvh}.code-admin-list,.code-editor{padding:14px}.code-top h1{font-size:22px}}
@media(max-width:450px){.editor-grid{grid-template-columns:1fr 1fr}.code-table{font-size:14px}.code-table th,.code-table td{padding:10px 6px}.code-table .code-name{font-size:17px}.rail{width:47px}.page{padding:10px 8px}.code-editor,.code-admin-list{padding:11px}}

/* v7: ONLY code-management layout changes.
   Removed redundant add button by search, aligned form time controls and panel bottoms. */
#codeView .code-toolbar{flex-wrap:nowrap}
#codeView .code-toolbar input{display:block;width:100%;flex:1 1 auto;min-width:0;max-width:100%;box-sizing:border-box}
#codeView .code-layout{align-items:stretch}
#codeView .code-admin-list{display:flex;flex-direction:column}
#codeView .code-admin-list .code-scroll{flex:1 1 auto;min-height:0}
#codeView .code-admin-list .code-note{margin-top:auto;padding-top:11px}
#codeView .editor-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
#codeView .editor-field{min-width:0;max-width:100%}
#codeView .editor-field input,
#codeView .editor-field select{display:block;box-sizing:border-box;width:100%;min-width:0;max-width:100%;}
#codeView .editor-field input[type="time"]{min-width:0;max-width:100%;}

/* Code list expands to fill the right editor's lower edge; no visible notes. */
#codeView .code-layout{height:calc(100dvh - 98px);min-height:595px;align-items:stretch}
#codeView .code-admin-list,#codeView .code-editor{min-height:0}
#codeView .code-admin-list .code-scroll{flex:1 1 auto;min-height:0;max-height:none;overflow-y:auto}
#codeView .code-editor{overflow-y:auto;position:static}
#codeView .code-table .code-chip{display:inline-flex;align-items:center;justify-content:center;min-width:44px;min-height:28px;padding:3px 8px;border:1px solid #d6e0eb;border-radius:6px;font-size:18px;font-weight:850;color:#173052;background:#fff}
@media(max-width:950px){
  #codeView .code-layout{height:auto;min-height:0}
  #codeView .code-admin-list .code-scroll{height:min(65dvh,710px);max-height:none;flex:none}
  #codeView .code-editor{overflow:visible}
}

/* v5: maximize editable roster on an iPad without altering the data or controls. */
.rail{width:48px}
.page{padding:10px 10px}
#scheduleView{display:flex;flex-direction:column;height:calc(100dvh - 20px);min-height:0;overflow:hidden}
#scheduleView .top{flex:0 0 auto;gap:7px;margin-bottom:7px}
#scheduleView .top h1{font-size:19px;margin-right:5px}
#scheduleView .top .btn{padding:7px 9px}
#scheduleView .notice{flex:0 0 auto;margin-bottom:7px;font-size:11px}
#scheduleView .content{display:grid;grid-template-columns:minmax(0,1fr) 172px;gap:8px;align-items:stretch;flex:1 1 auto;min-height:0}
#scheduleView .content>section.panel{display:flex;flex-direction:column;min-height:0}
#scheduleView .roster-head{padding:8px 10px;flex:0 0 auto}
#scheduleView .roster-head .hint{font-size:10px}
#scheduleView .sheet{flex:1 1 auto;min-height:0;height:auto;max-height:none;overscroll-behavior:contain}
#scheduleView .aside{padding:10px 8px;min-height:0;overflow-y:auto}
#scheduleView .aside h2{font-size:15px;margin-bottom:8px}
#scheduleView .aside .picked{font-size:15px;padding:6px 0;margin-bottom:4px}
#scheduleView .aside .leave-item{font-size:11px;padding:7px 0}
#scheduleView .aside .leavecontrols{gap:6px;margin-top:9px}
#scheduleView .aside .leavecontrols select,#scheduleView .aside .leavecontrols button{min-height:36px;width:100%;font-size:12px;padding:6px 4px}
#scheduleView .bottom{flex:0 0 auto;margin-top:8px;padding:6px 8px}
#scheduleView .bottom .groups{gap:6px;grid-template-columns:repeat(3,minmax(0,1fr))}
#scheduleView .bottom .group{padding:5px 6px}
#scheduleView .bottom .group h3{font-size:12px;margin:0 0 3px}
#scheduleView .bottom .group .codes{gap:3px}
#scheduleView .bottom .code{font-size:11px;gap:3px;padding:2px 4px;border-radius:4px}
@media (max-width:900px){
 #scheduleView .content{grid-template-columns:minmax(0,1fr) 170px}
 #scheduleView .sheet{height:auto;min-height:0}
}
@media (max-width:650px){
 #scheduleView{height:auto;min-height:100dvh;overflow:visible}
 #scheduleView .content{grid-template-columns:minmax(0,1fr)}
 #scheduleView .sheet{height:66dvh;min-height:370px;flex:none}
 #scheduleView .bottom .groups{grid-template-columns:1fr}
 #scheduleView .aside{overflow:visible}
}


/* v6: align bottom code reference with the roster, leave panel fills right side.
   Keep v5's narrow leave column and exact compact code-table height. */
#scheduleView .content{
  grid-template-rows:minmax(0,1fr) auto;
}
#scheduleView .content > section.panel:first-child{
  grid-column:1;
  grid-row:1;
  min-height:0;
}
#scheduleView .content > .bottom{
  grid-column:1;
  grid-row:2;
  margin-top:0;
  display:block;
  min-width:0;
  min-height:0;
}
#scheduleView .content > .aside{
  grid-column:2;
  grid-row:1 / span 2;
  min-height:0;
  overflow-y:auto;
}
@media (max-width:650px){
  #scheduleView .content{grid-template-rows:auto auto auto;}
  #scheduleView .content > section.panel:first-child{grid-column:1;grid-row:1;}
  #scheduleView .content > .bottom{grid-column:1;grid-row:2;}
  #scheduleView .content > .aside{grid-column:1;grid-row:3;overflow:visible;}
}


/* v9: isolated employee-name manager. No groups, ranks, permissions, or passkey mock-up. */
.people-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(300px,.55fr);gap:12px;align-items:start}
.people-list,.people-editor{padding:16px;min-width:0}
.people-list h2,.people-editor h2{margin:0 0 14px;color:#173e68;font-size:21px}
.people-count{font-size:16px;color:#657a91}
.people-scroll{border:1px solid #d6e2ee;border-radius:9px;max-height:min(72dvh,810px);min-height:330px;overflow:auto}
.people-table{width:100%;border-collapse:collapse;font-size:18px}
.people-table th{position:sticky;top:0;z-index:1;text-align:left;padding:14px;background:#edf3fb;color:#385471;font-size:15px}
.people-table td{padding:12px 14px;border-top:1px solid #dce4ee}
.people-table td:first-child{width:72px;color:#53677e}
.people-table td:last-child{width:190px;text-align:right;white-space:nowrap}
.people-table .btn{padding:9px 12px;font-size:15px;min-height:43px;margin-left:5px}
.people-table .remove{color:#bd414e;border-color:#edccd1}
.people-table tr.editing{background:#eaf3ff}
.people-editor label{font-size:16px;font-weight:750;display:block;margin-bottom:8px;color:#405874}
.people-editor input{display:block;width:100%;font-size:20px;min-height:58px;padding:11px 13px}
.people-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}.people-actions .btn{min-height:51px;font-size:17px}
@media(max-width:850px){.people-layout{grid-template-columns:1fr}.people-scroll{max-height:56dvh}.people-table td:last-child{width:170px}}
@media(max-width:520px){.people-table th,.people-table td{padding:9px 7px}.people-table .btn{font-size:14px;padding:7px 9px;margin-left:2px}}
/* v10: two entirely optional, editable staff-only columns. No predefined group labels. */
.people-layout{grid-template-columns:minmax(0,1fr) minmax(260px,.4fr)}
.people-table{min-width:660px}
.people-table th:nth-child(2),.people-table td:nth-child(2){min-width:108px}
.people-table .staff-custom{min-width:122px;width:23%}
.people-table .staff-head-input,.people-table .staff-value-input{
 display:block;min-width:0;width:100%;border:1px solid #d5dfeb;border-radius:6px;
 background:#fff;padding:8px 7px;min-height:39px;font-size:15px;color:#263446
}
.people-table .staff-head-input{background:#f9fbfe;font-weight:700}
.people-table .staff-value-input{min-height:40px}
.people-table td:last-child{width:175px}
@media(max-width:850px){.people-layout{grid-template-columns:1fr}.people-table{min-width:660px}}

/* Employee passkey administration: UI only until authenticated WebAuthn + D1 is connected. */
#passkeyPanel[hidden],#personEditorPanel[hidden]{display:none!important}
.people-table{min-width:760px}
.people-table td:last-child{width:255px}
.people-table .pk-manage{color:#245e9b;border-color:#bcd2ed}
.pk-header{display:flex;align-items:center;justify-content:space-between;gap:8px}
.pk-header h2{margin:0 0 8px!important}
.pk-person{font-size:22px;font-weight:800;color:#173e68;padding:8px 0 11px}
.pk-status{border:1px solid #d6e2f0;background:#f2f7fe;border-radius:9px;padding:10px 12px;font-size:14px;color:#34536f;line-height:1.5}
.pk-modes{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:14px 0}
.pk-mode{padding:11px 8px;border:1px solid #cbd9e9;background:#fff;color:#285278;border-radius:8px;font-size:15px;font-weight:800}
.pk-mode.active{background:#e8f2ff;border-color:#387bca;color:#164e89}
.pk-steps{margin:0;padding-left:23px;font-size:15px;line-height:1.85;color:#3e536b}
.pk-qr{margin:16px auto 12px;min-height:175px;max-width:360px;border:2px dashed #b9cce1;background:#f9fbfe;border-radius:11px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:11px;text-align:center;padding:20px;color:#526d88}
.pk-qr strong{font-size:18px;color:#2c4e70}
.pk-phone{border:1px solid #d9e5f3;border-radius:12px;padding:14px 12px;margin-top:14px;background:#fff}
.pk-phone-title{font-size:15px;font-weight:850;margin-bottom:9px;color:#224d75}
.pk-phone .btn{width:100%;min-height:47px;margin-top:7px}
.pk-phone p{margin:7px 0;font-size:14px;color:#61758a;line-height:1.6}
.pk-explain{font-size:13px;color:#5e7189;line-height:1.6;margin:14px 0 0}
@media(max-width:850px){.people-table{min-width:760px}}
.people-db-status{font-size:13px;margin:0 0 10px;padding:9px 11px;border:1px solid #d7e3f1;background:#f3f8ff;color:#315b85;border-radius:8px}
.people-db-status.error{border-color:#e9c9ca;background:#fff2f2;color:#a33039}

/* Admin session controls only: bottom-anchored Windows-like settings and power controls. */
.rail-bottom{margin-top:auto;width:100%;padding-bottom:16px;display:flex;align-items:center;flex-direction:column;gap:6px}
.rail-bottom button{min-height:44px!important;font-size:24px!important}
#adminLogout{color:#ffe2df}
.admin-password-dialog{width:min(92vw,430px);max-width:100%;border:1px solid #cdd8e5;border-radius:14px;padding:22px;box-shadow:0 20px 65px #14284544;color:#263446;background:#fff}
.admin-password-dialog::backdrop{background:rgba(18,35,58,.52)}
.admin-password-dialog h2{font-size:20px;color:#173e68;margin:0 0 15px}
.admin-password-dialog label{display:block;font-weight:700;font-size:14px;margin:12px 0 6px}
.admin-password-dialog input{display:block;width:100%;height:45px;font-size:16px;padding:9px 11px}
.admin-password-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:17px}
.admin-password-actions .btn{min-height:42px}
#passwordChangeStatus{font-size:13px;color:#b13745;min-height:19px;margin:10px 0 0}

/* Daily schedule: content-first view; structural sheet editing is a separate mode. */
#dailyTemplateView[hidden],#dailyEditTools[hidden],#dailyContentTools[hidden],#dailyCodeEditor[hidden],#dailySaveAll[hidden]{display:none!important}
.daily-topbar{display:flex;gap:9px;align-items:center;flex-wrap:wrap;margin-bottom:9px}
.daily-topbar h1{margin:0 15px 0 0;font-size:21px;color:#163b63}
.daily-topbar .push{margin-left:auto}
.daily-date-controls{display:flex;align-items:center;gap:7px}
.daily-date-controls input{font-size:15px;min-height:37px;border:1px solid #b4c6d8;border-radius:6px;padding:3px 8px}
#dailyTemplateView:not([hidden]){display:flex;flex-direction:column;height:calc(100dvh - 32px);min-height:0;min-width:0;overflow:hidden}
.daily-sheet-wrap{width:100%;flex:1 1 auto;overflow:auto;height:auto;max-height:none;min-height:0;overscroll-behavior:contain;background:#fff;border:1px solid #cbd7e6;border-radius:9px;padding:8px;position:relative}
.daily-sheet-wrap.editing{height:auto;max-height:none;min-height:0;touch-action:pan-x pan-y}
.daily-grid{border-collapse:collapse;table-layout:fixed;width:max-content;background:#fff;color:#263446}
.daily-grid th,.daily-grid td{box-sizing:border-box;border:1px solid #99abc0;position:relative;padding:5px 4px;text-align:center;vertical-align:middle;white-space:pre-wrap;word-break:break-word;line-height:1.25}
.daily-grid td{font-size:13px}
.daily-grid.edit-mode{touch-action:none;user-select:none;-webkit-user-select:none;cursor:cell}
.daily-grid.edit-mode td,.daily-grid.edit-mode th{touch-action:none;user-select:none;-webkit-user-select:none}
.daily-grid.edit-mode th{height:27px;font-size:12px;font-weight:600;background:#e8eff7;position:sticky;z-index:2}
.daily-grid.edit-mode thead th{top:0}
.daily-grid.edit-mode th.row-num{left:0;position:sticky;z-index:3;min-width:37px;width:37px}
.daily-grid td{background:#fff;color:#111}
.daily-grid.edit-mode th{background:#fff}
.daily-grid td.selected{outline:2px solid #333;outline-offset:-2px}
.daily-grid td.in-range{outline:2px dashed #666;outline-offset:-2px}
.daily-grid td.multi-selected{outline:2px dashed #111;outline-offset:-2px}
.daily-grid.edit-mode th.col-picked,.daily-grid.edit-mode th.row-picked{box-shadow:inset 0 0 0 2px #222;background:#fff}
.daily-grid.edit-mode thead th[data-col],.daily-grid.edit-mode th.row-num[data-row]{cursor:pointer}
.daily-edit-tools button:disabled{opacity:.42;cursor:not-allowed}
.daily-border-picker{position:relative;display:inline-flex;align-items:center}
.daily-border-panel{position:absolute;top:calc(100% + 5px);left:0;z-index:70;width:250px;max-width:calc(100vw - 90px);padding:11px;background:#fff;border:1px solid #6b7e91;border-radius:8px;box-shadow:0 8px 22px #0002;color:#111}
.daily-border-panel[hidden]{display:none!important}
.daily-border-panel>label{display:flex;justify-content:space-between;align-items:center;font-size:13px}
.daily-border-panel select{min-height:31px;min-width:85px;background:#fff;color:#111}
.daily-border-choices{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin-top:9px}
.daily-border-choices button{background:#fff;color:#111;border:1px solid #b2bbc5;border-radius:6px;min-height:35px;font-size:13px;padding:6px 8px;cursor:pointer}
.daily-border-choices button:hover,.daily-border-choices button:focus-visible{border-color:#1d4f7e;outline:1px solid #1d4f7e}
.daily-grid td.name-cell,.daily-grid td.locked-cell{background:#fff;color:#111}
.daily-grid td .name-tag{padding:3px 4px;border:0;background:transparent;color:inherit;font:inherit;display:inline-block;white-space:normal}
.daily-grid td .name-tag{background:transparent;border:1px solid #aaa;border-radius:4px;margin:2px;cursor:pointer}
.daily-grid.edit-mode td .name-tag:focus{outline:2px solid #333}
/* Drag a cell's right/bottom border just as in a spreadsheet. These handles exist only in edit mode. */
/* A resize handle does not exist as a hit target until its cell or header is explicitly selected. */
.daily-grid.edit-mode .col-resize{display:none;position:absolute;top:0;right:0px;width:7px;height:100%;cursor:col-resize;z-index:5;touch-action:none}
.daily-grid.edit-mode .row-resize{display:none;position:absolute;left:0;right:7px;bottom:0px;height:7px;cursor:row-resize;z-index:5;touch-action:none}
.daily-grid.edit-mode.resize-armed td.selected>.col-resize,.daily-grid.edit-mode.resize-armed td.selected>.row-resize,.daily-grid.edit-mode.resize-armed th.col-picked>.col-resize,.daily-grid.edit-mode.resize-armed th.row-picked>.row-resize{display:block}
.daily-grid.edit-mode .col-resize:hover::after,.daily-grid.edit-mode .row-resize:hover::after{content:'';position:absolute;background:#555;pointer-events:none}
.daily-grid.edit-mode .col-resize:hover::after{width:2px;top:0;bottom:0;right:4px}
.daily-grid.edit-mode .row-resize:hover::after{height:2px;left:0;right:0;bottom:4px}
.daily-edit-tools,.daily-content-tools{border:1px solid #cbd7e6;background:#f7fafd;border-radius:9px;padding:9px;margin:9px 0;display:flex;gap:7px;flex-wrap:wrap;align-items:center}
.daily-edit-tools label,.daily-content-tools label{font-size:12px;color:#536a84;display:flex;align-items:center;gap:5px}
.daily-edit-tools input,.daily-edit-tools select,.daily-content-tools input,.daily-content-tools select{min-height:34px;max-width:110px;border-radius:6px;border:1px solid #b4c6d8;padding:3px 6px}
#dailyContentTools:not([hidden]){display:flex;flex-wrap:nowrap;gap:6px;align-items:center;white-space:nowrap}#dailyContentTools label{flex:0 0 auto;white-space:nowrap;gap:4px}#dailyContentTools #dailyRole{width:125px;max-width:125px}#dailyContentTools #dailyFontSize{width:48px;max-width:48px}#dailyContentTools #dailyBold{min-height:auto;width:18px;height:18px}
.daily-input-row{display:flex;align-items:center;gap:5px;flex-wrap:nowrap;overflow:visible;margin:5px 0 8px;min-width:0;width:100%}
.daily-input-row #dailyContentTools{flex:0 0 auto;margin:0;padding:5px 6px;min-width:0;gap:4px;border:0;background:transparent}
.daily-input-row #dailyCodeEditor{flex:1 1 auto;margin:0;padding:5px 6px;gap:5px;flex-wrap:nowrap;white-space:nowrap;min-width:0}
.daily-input-row #dailyEditTools:not([hidden]){flex:1 0 auto}
.daily-input-row .daily-employee-lookup{width:150px;min-width:110px;flex:0 1 150px}.daily-input-row #dailyEmployeeSearch{width:100%;min-width:0;max-width:none}
.daily-input-row #dailyEmployeeCode{min-width:90px;width:110px;max-width:110px}
.daily-input-row #dailyCodeEditor small{display:none}
.daily-grid .daily-inline-input{width:100%;min-width:0;min-height:30px;height:100%;padding:4px 7px;border:1px solid #2b69a7;border-radius:3px;background:#fff;color:#172b3f;font:inherit;box-sizing:border-box}
.daily-edit-tools .daily-break{flex-basis:100%;height:0}
.daily-edit-tools .daily-save-status{margin-left:auto;font-size:12px;color:#506781}
.daily-name-code{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-top:8px;padding:9px;border:1px solid #cbd7e6;border-radius:8px;background:#f8fbfd}
.daily-name-code select{height:36px;border:1px solid #b4c6d8;background:white;border-radius:6px;min-width:115px}
.daily-name-code small{color:#6a7a89}
#dailyPrintOnly{display:none}
.daily-mini-status{font-size:12px;color:#506781;min-height:15px}
@media(max-width:720px){.daily-topbar h1{width:100%}.daily-topbar .push{margin-left:0}.daily-sheet-wrap{height:auto;max-height:none;min-height:0;padding:3px}.daily-sheet-wrap.editing{height:auto;max-height:none;min-height:0}}
@page{size:A4 portrait;margin:6mm}
@media print{
 html,body,.app,.page,#dailyTemplateView{background:#fff!important;color:#111!important}
 .rail,#scheduleView,#codeView,#peopleView,.daily-topbar,.daily-edit-tools,.daily-content-tools,.daily-name-code,.daily-mini-status,#dailySheetWrap{display:none!important}
 .app{display:block!important;height:auto!important;min-height:0!important}
 .page{margin:0!important;padding:0!important;display:block!important;overflow:visible!important}
 #dailyTemplateView{display:block!important;height:auto!important;min-height:0!important;overflow:visible!important}
 #dailyPrintOnly{display:block!important;width:max-content;max-width:none;zoom:var(--daily-print-scale,0.85)}
 #dailyPrintOnly .daily-grid{width:max-content!important;page-break-inside:avoid;break-inside:avoid}
 #dailyPrintOnly .daily-grid td{background:#fff!important;color:#000!important;line-height:1.15}
}

/* Employee name autocomplete; the selected value remains an immutable staff ID. */
.daily-employee-lookup{position:relative;min-width:192px;width:220px}
.daily-employee-lookup>input{height:36px;width:100%;border-radius:6px;border:1px solid #b4c6d8;background:#fff;padding:5px 9px;font-size:14px;box-sizing:border-box}
.daily-employee-lookup>input:focus{outline:2px solid #3684c8;outline-offset:1px}
.daily-employee-suggestions[hidden]{display:none!important}
.daily-employee-suggestions{position:absolute;z-index:25;top:calc(100% + 3px);left:0;right:0;max-height:230px;overflow:auto;background:#fff;border:1px solid #b0c0d2;box-shadow:0 9px 22px #192b462b;border-radius:7px}
.daily-employee-suggestions button{display:block;width:100%;border:0;padding:10px 12px;background:#fff;color:#1d314b;text-align:left;font-size:14px;cursor:pointer}
.daily-employee-suggestions button:hover,.daily-employee-suggestions button:focus{background:#e6f2ff;outline:none}
.daily-employee-suggestions .no-match{padding:11px;font-size:13px;color:#62748a}
@media(max-width:720px){.daily-employee-lookup{min-width:145px;flex:1;width:auto}}

.rail button:has(.rail-keycap){display:flex;align-items:center;justify-content:center}
.rail-keycap{display:inline-flex;align-items:center;justify-content:center;font-family:system-ui,"Apple SD Gothic Neo",sans-serif;font-size:18px;font-weight:750;line-height:1;color:inherit;border:2px solid currentColor;border-radius:5px;width:29px;height:29px;box-sizing:border-box}
@media(max-width:600px){.rail-keycap{width:24px;height:24px;font-size:15px}.rail button:has(.rail-keycap){min-width:36px;padding:6px 4px}}
</style>
</head>
<body>
<div class="app">
  <nav class="rail" aria-label="관리자 메뉴"><button class="active" id="navRoster" type="button" title="월간 근무표" aria-label="월간 근무표">▦</button><button id="navDaily" type="button" title="일간 근무표" aria-label="일간 근무표"><span class="rail-keycap" aria-hidden="true">日</span></button><button id="navCodes" type="button" title="근무 코드 관리" aria-label="근무 코드 관리"><span class="rail-keycap" aria-hidden="true">A</span></button><button id="navPeople" type="button" title="직원 관리" aria-label="직원 관리">👤</button><div class="rail-bottom"><button id="adminSettings" type="button" title="관리자 비밀번호 변경" aria-label="관리자 비밀번호 변경">⚙</button><button id="adminLogout" type="button" title="로그아웃" aria-label="로그아웃">⏻</button></div></nav>
  <main class="page">
  <div id="scheduleView">
    <div class="top">
      <h1>월간 근무표</h1>
      <input id="rosterLabel" class="roster-label" type="text" maxlength="60" placeholder="근무표 이름 (자유 입력)" aria-label="근무표 이름" title="Enter 또는 다른 곳 선택 시 D1 저장" autocomplete="off" spellcheck="false">
      <button class="btn" id="prev" aria-label="이전 달">◀</button><span class="month" id="monthTitle"></span><button class="btn" id="next" aria-label="다음 달">▶</button>
      <label class="deadline">휴무 마감일 <input type="date" id="deadline"></label>
      <label class="deadline">신청 제한 인원 <input type="number" id="leaveCapacity" min="0" max="99" step="1" placeholder="—" title="선택한 월의 날짜별 최대 휴무 인원"></label>
      <button class="btn push" id="exportExcel" type="button">엑셀 내보내기</button>
      <button class="btn primary" id="publishSchedule" type="button">배포하기</button>
    </div>
    <div class="notice" id="scheduleDbStatus" role="status">D1 근무표 데이터 불러오는 중… 실제 직원 개인정보는 넣지 마세요.</div>
    <div class="content">
      <section class="panel">
        <div class="roster-head"><span>근무 배정</span><span class="hint">방향키 이동 · Enter 근무 코드 편집 · 전일 휴무/연차는 오른쪽 휴무 관리에서만 변경</span></div>
        <div class="sheet" id="sheet"><table class="table" id="roster"></table></div>
      </section>
      <aside class="panel aside">
        <h2>휴무 관리</h2>
        <div class="picked" id="pickedDate">날짜를 선택하세요</div>
        <div id="leaveList"></div>
        <div class="leavecontrols"><select id="person" aria-label="직원 선택"></select>
          <select id="leaveType" aria-label="휴무 종류"><option value="full">하루 종일 휴무</option><option value="am">오전 휴무</option><option value="pm">오후 휴무</option><option value="annual">연차</option></select>
          <button class="btn primary" id="addLeave">휴무 추가</button></div>
      </aside>
      <section class="panel bottom"><div class="groups"><div class="group"><h3>오전</h3><div class="codes" id="codesAm"></div></div><div class="group"><h3>롱</h3><div class="codes" id="codesLong"></div></div><div class="group"><h3>오후</h3><div class="codes" id="codesPm"></div></div></div></section>
    </div>
  </div>
  <section id="dailyTemplateView" hidden>
   <div class="daily-topbar">
    <h1>일일 근무표</h1>
    <div class="daily-date-controls"><button class="btn" type="button" id="dailyPrev" aria-label="전날">◀</button><input type="date" id="dailyDate" aria-label="일간 근무표 날짜"><button class="btn" type="button" id="dailyNext" aria-label="다음 날">▶</button></div>
    <button class="btn" type="button" id="dailyPrint">출력하기</button>
    <button class="btn" type="button" id="dailyUndo" title="되돌리기 · Windows Ctrl+Z / Mac ⌘+Z" disabled>↶</button><button class="btn" type="button" id="dailyRedo" title="다시 실행 · Windows Ctrl+Y 또는 Ctrl+Shift+Z / Mac ⌘+Shift+Z" disabled>↷</button>
    <button class="btn" type="button" id="dailyToggleEdit">셀 편집</button><button class="btn primary" type="button" id="dailySaveAll" title="저장하기 (Ctrl/⌘+S)" disabled>저장하기</button>
   </div>
   <div class="daily-mini-status" id="dailyStatus" role="status"></div>
   <div class="daily-input-row">
   <div id="dailyContentTools" hidden>
    <label>셀 <strong id="dailyContentCoord">A1</strong></label>
     <label>역할 <select id="dailyRole"><option value="">기입란</option><option value="date">날짜</option><option value="code">근무 코드</option><option value="time">근무시간</option><option value="names">직원 이름 (읽기 전용)</option><option value="leave">휴무 명단</option><option value="annual">연차 명단</option><option value="shared">공유 (직접 입력)</option></select></label>
     <label>폰트 <input id="dailyFontSize" type="number" min="9" max="42" step="1" aria-label="글꼴 크기"></label>
     <label>굵기 <input id="dailyBold" type="checkbox" aria-label="굵게"></label>
     <button class="btn" type="button" id="dailyAlign" title="선택한 셀의 내용 정렬 변경 (왼쪽 → 가운데 → 오른쪽)">정렬: 가운데</button>
   </div>
   <div id="dailyEditTools" hidden>
    <div class="daily-edit-tools">
     <button class="btn" type="button" id="dailyAddRow">행 +</button><button class="btn" type="button" id="dailyRemoveRow">행 −</button>
     <button class="btn" type="button" id="dailyAddCol">열 +</button><button class="btn" type="button" id="dailyRemoveCol">열 −</button>
     <button class="btn" type="button" id="dailyMerge">병합</button><button class="btn" type="button" id="dailySplit">해제</button><button class="btn" type="button" id="dailyEqualizeRows" title="선택한 행들의 높이를 균등 배분 (선택한 행 높이 합계 유지)">높이 균등</button>
     <label>셀 <strong id="dailyCoord">A1</strong></label>
     <div class="daily-border-picker" id="dailyBorderPicker">
      <button class="btn" type="button" id="dailyBorderToggle" aria-expanded="false" aria-controls="dailyBorderPanel" title="선택한 셀의 테두리 설정">테두리 ▾</button>
      <div class="daily-border-panel" id="dailyBorderPanel" hidden>
       <label>선 굵기 <select id="dailyBorderWidth" aria-label="테두리 굵기"><option value="0">없음</option><option value="1" selected>1px</option><option value="2">2px</option><option value="3">3px</option></select></label>
       <div class="daily-border-choices">
        <button type="button" data-border-action="none">없음</button>
        <button type="button" data-border-action="all">전체</button>
        <button type="button" data-border-action="outline">바깥</button>
        <button type="button" data-border-action="inside">안쪽</button>
        <button type="button" data-border-action="top">위쪽</button>
        <button type="button" data-border-action="bottom">아래쪽</button>
        <button type="button" data-border-action="left">왼쪽</button>
        <button type="button" data-border-action="right">오른쪽</button>
       </div>
      </div>
     </div>
     <label>열 너비 <input id="dailyColWidth" type="number" min="42" max="650" step="1" aria-label="열 너비"></label>
     <label>행 높이 <input id="dailyRowHeight" type="number" min="25" max="170" step="1" aria-label="행 높이"></label>
    </div>
   </div>
   <div id="dailyCodeEditor" class="daily-name-code">
     <strong>근무 코드 변경</strong>
     <label for="dailyEmployeeSearch">직원</label>
     <div class="daily-employee-lookup">
      <input id="dailyEmployeeSearch" type="search" placeholder="이름 두 글자 검색" autocomplete="off" aria-label="직원 이름 검색" aria-controls="dailyEmployeeSuggestions" aria-expanded="false" aria-autocomplete="list">
      <div id="dailyEmployeeSuggestions" class="daily-employee-suggestions" role="listbox" aria-label="일치하는 직원" hidden></div>
     </div>
     <select id="dailyEmployeeSelect" hidden tabindex="-1" aria-hidden="true"></select>
     <label>코드 <select id="dailyEmployeeCode" aria-label="근무 코드 선택"></select></label>
     <button class="btn" id="dailyApplyCode" type="button">코드 적용</button>
     <small>출퇴근시간은 코드 관리에서만 수정</small>
   </div>
   </div>
   <div class="daily-sheet-wrap" id="dailySheetWrap"><table class="daily-grid" id="dailySheetTable" aria-label="일간 근무표" tabindex="0"></table></div>
   <div id="dailyPrintOnly"></div>
  </section>

  <section id="codeView" hidden>
    <div class="code-top"><h1>근무 코드 관리</h1><span class="sub">출퇴근시간 · 근무시간 · 표시색 · D1 공동 저장</span><button class="btn push" id="backRoster">월간 근무표로 돌아가기</button></div>
    <div class="code-layout">
      <section class="panel code-admin-list">
        <div class="code-toolbar"><input id="codeSearch" type="search" placeholder="근무 코드 검색" aria-label="근무 코드 검색"></div>
        <div class="code-scroll"><table class="code-table"><thead><tr><th>코드</th><th>구분</th><th>출근</th><th>퇴근</th><th>근무시간</th></tr></thead><tbody id="codeRows"></tbody></table></div>
        
      </section>
      <section class="panel code-editor" id="codeEditor">
        <h2 id="codeEditorTitle">코드 추가</h2>
        <div class="editor-grid">
          <div class="editor-field"><label for="cfCode">근무 코드</label><input id="cfCode" autocomplete="off" maxlength="12" placeholder="예: A7"></div>
          <div class="editor-field"><label for="cfType">구분</label><select id="cfType"><option value="am">오전</option><option value="long">롱</option><option value="pm">오후</option><option value="night">야간</option></select></div>
          <div class="editor-field"><label for="cfStart">출근시간</label><input id="cfStart" type="time"></div>
          <div class="editor-field"><label for="cfEnd">퇴근시간</label><input id="cfEnd" type="time"></div>
          <div class="editor-field"><label for="cfHours">근무시간 (수동 입력 · 시간)</label><input id="cfHours" inputmode="decimal" type="number" min="0" max="24" step="0.5" placeholder="예: 8.5"></div>
          <div class="editor-field"><label for="cfColor">표시 색상</label><input id="cfColor" type="color" value="#ffffff"></div>
        </div>
        <div class="editor-actions"><button class="btn primary" id="saveCode">코드 저장</button><button class="btn" id="clearCode">입력 지우기</button><button class="btn danger" id="deleteCode" disabled>코드 삭제</button></div>
        <div class="special-set"><h3>휴 · 연 색상</h3><div class="special-row"><span class="special-chip" id="restChip">휴</span><label for="restColor">휴무 표시색</label><input type="color" id="restColor" value="#ffebed"></div><div class="special-row"><span class="special-chip" id="annualChip">연</span><label for="annualColor">연차 표시색</label><input type="color" id="annualColor" value="#e7f0ff"></div></div>
        
      </section>
    </div>
  </section>
  <section id="peopleView" hidden>
    <div class="code-top"><h1>직원 관리</h1><button class="btn push" id="peopleBackRoster">월간 근무표로 돌아가기</button></div>
    <div class="people-layout">
      <section class="panel people-list">
        <h2>근무자 명단 <span class="people-count" id="peopleCount"></span></h2>
        <div class="people-db-status" id="peopleDbStatus" role="status">D1 직원 명단 불러오는 중…</div>
        <div class="people-scroll"><table class="people-table"><thead><tr>
          <th>번호</th><th>이름</th>
          <th class="staff-custom"><input id="staffHeader0" class="staff-head-input" maxlength="30" type="text" autocomplete="off" aria-label="첫 번째 분류 열 제목 직접 입력"></th>
          <th class="staff-custom"><input id="staffHeader1" class="staff-head-input" maxlength="30" type="text" autocomplete="off" aria-label="두 번째 분류 열 제목 직접 입력"></th>
          <th></th>
        </tr></thead><tbody id="peopleRows"></tbody></table></div>
      </section>
      <section class="panel people-editor" id="personEditorPanel">
        <h2 id="peopleEditorTitle">직원 추가</h2>
        <label for="personName">직원 이름</label>
        <input id="personName" type="text" autocomplete="off" maxlength="40" placeholder="이름 입력" aria-label="직원 이름">
        <div class="people-actions"><button class="btn primary" id="savePerson">직원 등록</button><button class="btn" id="resetPerson">입력 지우기</button></div>
      </section>
      <section class="panel people-editor" id="passkeyPanel" hidden>
        <div class="pk-header"><h2>패스키 관리</h2><button class="btn" id="closePasskey" type="button">닫기</button></div>
        <div class="pk-person" id="pkPersonName"></div>
        <div class="pk-status">등록 상태: <b>확인 불가</b><br>현재는 화면 시연판입니다. 실제 패스키 등록·초기화는 아직 연결되지 않았습니다.</div>
        <div class="pk-modes"><button type="button" class="pk-mode active" id="pkFirst">최초 등록</button><button type="button" class="pk-mode" id="pkReset">기기 변경·분실</button></div>
        <ol class="pk-steps" id="pkSteps"></ol>
        <div class="pk-qr" role="img" aria-label="QR 코드가 표시될 자리. 현재는 발급되지 않음">
          <span aria-hidden="true" style="font-size:37px">▦</span>
          <strong>등록 QR 표시 위치</strong>
          <span>인증 서버 연결 후 발급됩니다</span>
        </div>
        <button type="button" class="btn primary" disabled style="width:100%;min-height:50px">일회용 등록 QR 발급 (연동 전)</button>
        <div class="pk-phone"><div class="pk-phone-title">직원 휴대폰 화면</div><p id="pkPhoneText"></p><button type="button" class="btn" disabled>이 휴대폰에 패스키 만들기 (연동 전)</button></div>
        <p class="pk-explain">직원이 관리자 옆에서 QR을 스캔한 뒤 본인 휴대폰의 Face ID·지문·화면 잠금으로 패스키를 생성하는 절차입니다. 인증 정보나 임시 비밀번호를 브라우저에 저장하지 않습니다.</p>
      </section>
    </div>
  </section>
  </main>
</div>
<dialog id="staffAccessDialog" class="admin-password-dialog" aria-labelledby="staffAccessHeading">
 <h2 id="staffAccessHeading">직원 접속키</h2>
 <label for="staffLoginId">로그인 ID</label><input id="staffLoginId" readonly autocomplete="off">
 <label for="staffAccessCode">시험 접속키</label><input id="staffAccessCode" readonly autocomplete="off">
 <div class="admin-password-actions"><button class="btn primary" type="button" id="staffAccessClose">닫기</button></div>
</dialog>
<dialog id="adminPasswordDialog" class="admin-password-dialog" aria-labelledby="adminPasswordHeading">
 <form id="adminPasswordForm">
  <h2 id="adminPasswordHeading">관리자 비밀번호 변경</h2>
  <label for="currentAdminPassword">현재 비밀번호</label><input id="currentAdminPassword" type="password" autocomplete="current-password" required>
  <label for="newAdminPassword">새 비밀번호</label><input id="newAdminPassword" type="password" autocomplete="new-password"  required>
  <label for="confirmAdminPassword">새 비밀번호 확인</label><input id="confirmAdminPassword" type="password" autocomplete="new-password"  required>
  <p id="passwordChangeStatus" role="status" aria-live="polite"></p>
  <div class="admin-password-actions"><button class="btn" type="button" id="adminSettingsClose">취소</button><button class="btn primary" type="submit" id="adminPasswordSave">변경</button></div>
 </form>
</dialog>
<script>
(function(){
 'use strict';
 const storageKey='temorary-admin-ui-v1'; // retain existing browser backup only
 let rosterLabel='',savedRosterLabel='';
 function setRosterLabel(value){rosterLabel=String(value??'');savedRosterLabel=rosterLabel;$('rosterLabel').value=rosterLabel;}
 const today=new Date();
 const state={year:today.getFullYear(),month:today.getMonth(),day:today.getDate(),people:Array.from({length:20},(_,i)=>({id:'p'+(i+1),name:'직원 '+String(i+1).padStart(2,'0')})),shifts:{},leaves:{},deadlines:{},leaveLimits:{},catalog:[],monthlyHours:{}};
 try{const old=JSON.parse(localStorage.getItem(storageKey)||'null');if(old&&typeof old==='object'){Object.assign(state,old)}}catch{}
 // Preserve the browser's existing demo staff/schedules once before switching the visible roster to D1.
 try { const old=localStorage.getItem(storageKey);if(old&&!localStorage.getItem(storageKey+'-before-d1-v13'))localStorage.setItem(storageKey+'-before-d1-v13',old);if(old&&!localStorage.getItem(storageKey+'-before-d1-v14'))localStorage.setItem(storageKey+'-before-d1-v14',old); } catch(_) {}
 // D1 is authoritative for staff; never pretend that local demo names were synchronized.
 state.people=[];
 if(!Array.isArray(state.people))state.people=[];
 if(!Array.isArray(state.archivedPeople))state.archivedPeople=[];
 if(!Array.isArray(state.staffColumnHeaders))state.staffColumnHeaders=['',''];
 const $=id=>document.getElementById(id);
 const two=n=>String(n).padStart(2,'0');
 const ymd=d=>state.year+'-'+two(state.month+1)+'-'+two(d);
 const mk=(id,d)=>id+'|'+ymd(d);
 const days=()=>new Date(state.year,state.month+1,0).getDate();
 const validDay=()=>state.day=Math.min(Math.max(1,state.day),days());
 const text=s=>String(s??'').replace(/[&<>"']/g,k=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[k]));
 // Scanned November roster: starting references only; no work-hour calculation.
 const initialCodes=[
 ['A7','am','05:30','14:00'],['B1','am','06:00','14:00'],['C1','am','06:30','14:00'],['D1','am','07:00','14:00'],['D2','am','07:00','14:30'],
 ['A8','long','05:30','19:00'],['B5','long','06:00','19:30'],['C3','long','06:30','19:00'],['C5','long','06:30','20:00'],['D4','long','07:00','19:30'],['D5','long','07:00','20:00'],
 ['G1','pm','11:00','20:00'],['H4','pm','12:30','21:00'],['H6','pm','12:30','22:00'],['H7','pm','12:30','22:30'],['H8','pm','12:30','23:00'],['J3','pm','13:00','23:00'],['M1','night','22:00','07:00']
 ].map(c=>({code:c[0],type:c[1],start:c[2],end:c[3],hours:'',color:''}));
 if(!Array.isArray(state.catalog))state.catalog=[];
 if(!state.catalogInitialized){if(state.catalog.length===0)state.catalog=initialCodes;state.catalogInitialized=true}
 if(!state.specialColors||typeof state.specialColors!=='object')state.specialColors={rest:'#ffebed',annual:'#e7f0ff'};
 // D1 is authoritative: never silently treat old browser-only assignments as synchronized.
 state.shifts={};state.leaves={};state.cancelledLeaves={};state.deadlines={};state.leaveLimits={};state.monthlyHours={};state.catalog=[];
 state.specialColors={rest:'#ffebed',annual:'#e7f0ff'};
 const lookup=(id,d)=>{const k=mk(id,d),l=state.leaves[k];return l==='full'?'휴':l==='annual'?'연':state.shifts[k]||''};
 const leave=(id,d)=>state.leaves[mk(id,d)]||'';
 const cancelledLeave=(id,d)=>state.cancelledLeaves[mk(id,d)]||'';
 function persist(){localStorage.setItem(storageKey,JSON.stringify(state))}
 function counts(d){let am=0,pm=0;for(const p of state.people){const code=lookup(p.id,d);const info=state.catalog.find(x=>x.code===code);if(!info)continue;if(info.type==='am'||info.type==='long')am++;if(info.type==='pm'||info.type==='long')pm++}return am+'/'+pm}
 function personHours(id){return state.monthlyHours[id+'|'+state.year+'-'+two(state.month+1)]||'—'}
 function draw(){applySpecialColors();validDay();$('monthTitle').textContent=state.year+'년 '+(state.month+1)+'월';$('deadline').value=state.deadlines[state.year+'-'+two(state.month+1)]||'';$('leaveCapacity').value=state.leaveLimits[state.year+'-'+two(state.month+1)]??'';
 let h='<thead><tr><th class="n">번호</th><th class="who"></th>';
 for(let d=1;d<=days();d++){const w=new Date(state.year,state.month,d).getDay();h+='<th class="d '+(w===0?'sun':w===6?'sat':'')+'" data-day="'+d+'" title="휴무 목록 보기">'+d+' '+['일','월','화','수','목','금','토'][w]+'</th>'}
 h+='<th class="hours">월 근무시간</th></tr><tr class="counts"><th class="n"></th><th class="who"></th>';
 for(let d=1;d<=days();d++)h+='<th class="d" id="count-'+d+'" data-day="'+d+'">'+counts(d)+'</th>';
 h+='<th class="hours"></th></tr></thead><tbody>';
 state.people.forEach((p,i)=>{h+='<tr><td class="n">'+(i+1)+'</td><td class="who">'+text(p.name)+'</td>';
 for(let d=1;d<=days();d++){const c=lookup(p.id,d),l=leave(p.id,d);const klass=c==='휴'?'work-holiday':c==='연'?'work-annual':l==='am'?'work-am':l==='pm'?'work-pm':'';const custom=state.catalog.find(k=>k.code===c);const bg=custom&&/^#[0-9a-fA-F]{6}$/.test(custom.color||'')?' style="background:'+custom.color+';color:'+fg(custom.color)+'"':'';h+='<td class="d '+klass+(l==='full'||l==='annual'?' leave-locked':'')+'"'+bg+' data-cell="1" tabindex="'+(selectedCell&&selectedCell.id===p.id&&selectedCell.day===d?0:(!selectedCell&&i===0&&d===1?0:-1))+'" data-id="'+text(p.id)+'" data-day="'+d+'" title="'+(l==='full'||l==='annual'?'전일 휴무·연차는 휴무 관리에서만 변경':'클릭하여 근무 코드 입력')+'">'+text(c)+'</td>'}
 h+='<td class="hours" data-hours="'+text(p.id)+'" title="클릭하여 월 근무시간 직접 입력">'+personHours(p.id)+'</td></tr>'});h+='</tbody>';
 $('roster').innerHTML=h;
 const chosenPerson=$('person').value;
 const options=state.people.map(p=>'<option value="'+text(p.id)+'">'+text(p.name)+'</option>').join('');$('person').innerHTML=options;
 if(state.people.some(p=>p.id===chosenPerson))$('person').value=chosenPerson;
 showLeaves();drawCodes();highlightDayColumn()}
 function drawCodes(){for(const [id,ty] of [['codesAm','am'],['codesLong','long'],['codesPm','pm']]){const a=state.catalog.filter(c=>c.type===ty||(ty==='pm'&&c.type==='night'));$(id).innerHTML=a.length?a.map(c=>'<span class="code">'+text(c.code)+' '+text(c.start||'--:--')+' - '+text(c.end||'--:--')+'</span>').join(''):'<span class="empty">등록된 코드 없음</span>'}}
 function highlightDayColumn(){
   $('roster').querySelectorAll('[data-day]').forEach(el=>el.classList.toggle('date-highlight',Number(el.dataset.day)===state.day));
 }
 function showLeaves(){
   $('pickedDate').textContent=(state.month+1)+'월 '+state.day+'일';
   const entries=state.people.filter(p=>leave(p.id,state.day)||cancelledLeave(p.id,state.day));
   $('leaveList').innerHTML=entries.length?entries.map(p=>{
     const cancelled=!!cancelledLeave(p.id,state.day),l=cancelled?cancelledLeave(p.id,state.day):leave(p.id,state.day);
     const v={full:'전일 휴무',am:'오전 휴무',pm:'오후 휴무',annual:'연차'}[l]||'휴무';
     return '<div class="leave-item'+(cancelled?' leave-cancelled':'')+'"><span class="leave-summary"><span class="leave-person-name">'+text(p.name)+'</span> <span class="pill '+l+'">'+v+'</span>'+(cancelled?' <span class="leave-cancel-tag">취소됨</span>':'')+'</span><button type="button" data-leave-action="'+(cancelled?'restore':'cancel')+'" data-employee-id="'+text(p.id)+'" aria-label="'+text(p.name)+(cancelled?' 휴무 복구':' 휴무 취소')+'">'+(cancelled?'복구':'취소')+'</button></div>';
   }).join(''):'<div class="no-entries">신청 내역 없음</div>';
 }
 let active=null,oldCode='';
 // Keyboard selection is separate from the inline editor: arrow keys move the selection,
 // Enter opens the blank editor, Enter commits, and Escape cancels.
 let selectedCell=null;
 // Keep the keyboard-selected cell inside the sheet's actual viewport.
 // scrollIntoView is inconsistent on iPad Safari with frozen headers/columns:
 // it may consider a cell "visible" while it is still behind a sticky area.
 function revealCodeCell(target){
   const sheet=$('sheet');
   if(!sheet||!target)return;
   const view=sheet.getBoundingClientRect();
   const rect=target.getBoundingClientRect();
   const table=$('roster');
   const frozenWidth=[...table.querySelectorAll('thead tr:first-child th.n,thead tr:first-child th.who')]
     .reduce((sum,cell)=>sum+cell.getBoundingClientRect().width,0);
   const frozenHeight=table.tHead
     ? [...table.tHead.rows].reduce((sum,row)=>sum+row.getBoundingClientRect().height,0)
     : 0;
   const margin=5;
   const left=view.left+frozenWidth+margin;
   const right=view.right-margin;
   const top=view.top+frozenHeight+margin;
   const bottom=view.bottom-margin;
   let dx=0,dy=0;
   if(rect.left<left)dx=rect.left-left;
   else if(rect.right>right)dx=rect.right-right;
   if(rect.top<top)dy=rect.top-top;
   else if(rect.bottom>bottom)dy=rect.bottom-bottom;
   // Change only the inner roster scroller; no outer-page movement.
   if(dx)sheet.scrollLeft+=dx;
   if(dy)sheet.scrollTop+=dy;
 }
 function selectCodeCell(id,day,scroll){
   const cells=$('roster').querySelectorAll('td[data-cell]');
   let target=null;
   for(const cell of cells){
     const yes=cell.dataset.id===id&&Number(cell.dataset.day)===day;
     cell.tabIndex=yes?0:-1;
     cell.classList.toggle('cell-selected',yes);
     if(yes)target=cell;
   }
   if(!target)return;
   selectedCell={id:id,day:day};
   state.day=day;showLeaves();highlightDayColumn();
   target.focus({preventScroll:true});
   if(scroll)revealCodeCell(target);
 }
 function startEditCell(id,day){
   if(!canEditSchedule())return;
   state.day=day;showLeaves();highlightDayColumn();
   const leaveType=leave(id,day);
   if(leaveType==='full'||leaveType==='annual'){
     scheduleStatus('전일 휴무·연차는 오른쪽 휴무 관리에서만 수정할 수 있습니다.');
     return;
   }
   const cell=Array.from($('roster').querySelectorAll('td[data-cell]')).find(
     x=>x.dataset.id===id&&Number(x.dataset.day)===day);
   if(!cell)return;
   selectedCell={id:id,day:day};
   state.day=day;showLeaves();
   active=cell;
   cell.innerHTML='<input class="cell-edit" maxlength="12" aria-label="근무 코드 입력" spellcheck="false" autocomplete="off">';
   const input=cell.querySelector('input');
   input.value='';input.focus();
 }

 function exitEdit(confirm){
   if(!active)return;
   const el=active,inp=el.querySelector('input'),hours=!!el.dataset.hours;
   const val=inp?inp.value.trim().toUpperCase():'';
   const employeeId=hours?el.dataset.hours:el.dataset.id;
   const date=hours?(state.year+'-'+two(state.month+1)):ymd(Number(el.dataset.day));
   active=null;
   if(confirm&&inp&&canEditSchedule()){
     if(hours){
       if(val&&!Number.isFinite(Number(val))){alert('월 근무시간은 숫자로 입력하세요.');draw();return}
       updateSchedule('/api/schedule/hours',{employeeId,month:date,hours:val},()=>{
         const key=employeeId+'|'+date;if(val)state.monthlyHours[key]=val;else delete state.monthlyHours[key];
       });
     }else{
       if(val==='휴'||val==='연'){alert('휴무와 연차는 오른쪽 휴무 관리에서만 등록·삭제할 수 있습니다.');draw();return}
       if(leave(employeeId,Number(el.dataset.day))==='full'||leave(employeeId,Number(el.dataset.day))==='annual'){alert('이미 등록된 전일 휴무·연차는 휴무 관리에서 변경하세요.');draw();return}
       if(val&&(!/^[A-Z0-9가-힣-]{1,12}$/.test(val))){alert('근무 코드는 1~12자 이내로 입력하세요.');draw();return}
       updateSchedule('/api/schedule/shift',{employeeId,date,code:val},()=>{
         const key=employeeId+'|'+date;if(val)state.shifts[key]=val;else delete state.shifts[key];
       });
     }
   }
   draw();
   if(!hours&&selectedCell)selectCodeCell(selectedCell.id,selectedCell.day,true);
 }
 // Clicking preserves the previous behavior: click a shift cell to edit immediately.
 // After committing, the same cell remains selected for arrow-key navigation.
 $('roster').addEventListener('click',e=>{
   const cell=e.target.closest('[data-cell], [data-hours]');
   const hd=e.target.closest('th[data-day]');
   if(hd){
     if(active)exitEdit(true);
     state.day=Number(hd.dataset.day);selectedCell=null;
     $('roster').querySelectorAll('td.cell-selected').forEach(x=>x.classList.remove('cell-selected'));
     showLeaves();highlightDayColumn();return;
   }
   if(!cell)return;
   if(active===cell)return;
   const hours=!!cell.dataset.hours,id=hours?cell.dataset.hours:cell.dataset.id,d=Number(cell.dataset.day);
   if(active)exitEdit(true);
   if(hours){
     if(!canEditSchedule())return;
     active=Array.from($('roster').querySelectorAll('[data-hours]')).find(x=>x.dataset.hours===id);
     if(!active)return;
     active.innerHTML='<input class="cell-edit" maxlength="12" aria-label="월 근무시간 입력" spellcheck="false">';
     active.querySelector('input').value='';
     active.querySelector('input').focus();
   }else startEditCell(id,d);
 });
 $('roster').addEventListener('keydown',e=>{
   if(e.target.matches('input.cell-edit')){
     if(e.key==='Enter'){e.preventDefault();exitEdit(true)}
     else if(e.key==='Escape'){e.preventDefault();exitEdit(false)}
     return;
   }
   const cell=e.target.closest('td[data-cell]');
   if(!cell)return;
   const keys={ArrowLeft:[0,-1],ArrowRight:[0,1],ArrowUp:[-1,0],ArrowDown:[1,0]};
   if(keys[e.key]){
     e.preventDefault();
     const [dr,dd]=keys[e.key],i=state.people.findIndex(p=>p.id===cell.dataset.id);
     const row=Math.min(state.people.length-1,Math.max(0,i+dr));
     const day=Math.min(days(),Math.max(1,Number(cell.dataset.day)+dd));
     selectCodeCell(state.people[row].id,day,true);
   }else if(e.key==='Enter'){
     e.preventDefault();
     startEditCell(cell.dataset.id,Number(cell.dataset.day));
   }
 });
 $('roster').addEventListener('focusin',e=>{
   if(!e.target.matches('td[data-cell]'))return;
   const cell=e.target;
   selectedCell={id:cell.dataset.id,day:Number(cell.dataset.day)};
   state.day=selectedCell.day;showLeaves();highlightDayColumn();
   $('roster').querySelectorAll('td[data-cell]').forEach(x=>{
     const yes=x===cell;x.classList.toggle('cell-selected',yes);x.tabIndex=yes?0:-1;
   });
 });
 $('roster').addEventListener('focusout',e=>{
   if(!e.target.matches('.cell-edit'))return;
   const here=active;
   setTimeout(()=>{if(active===here)exitEdit(true)},0);
 });
 $('addLeave').addEventListener('click',()=>{
   if(!canEditSchedule())return;
   const employeeId=$('person').value,type=$('leaveType').value,date=ymd(state.day);
   if(!employeeId)return;
   const k=employeeId+'|'+date,previous=state.leaves[k];
   if(state.cancelledLeaves[k]){alert('취소된 휴무 기록이 있습니다. 목록에서 복구한 뒤 휴무 종류를 변경하세요.');return}
   updateSchedule('/api/schedule/leave',{employeeId,date,type},()=>{
     state.leaves[k]=type;
     if(type==='full')state.shifts[k]='휴';else if(type==='annual')state.shifts[k]='연';
     else if((previous==='full'&&state.shifts[k]==='휴')||(previous==='annual'&&state.shifts[k]==='연'))delete state.shifts[k];
   });
 });
 $('leaveList').addEventListener('click',e=>{
   const b=e.target.closest('button[data-leave-action]');if(!b||!canEditSchedule())return;
   const employeeId=b.dataset.employeeId,date=ymd(state.day),k=employeeId+'|'+date;
   const action=b.dataset.leaveAction;
   if(action==='cancel'){
     const previous=state.leaves[k];if(!previous)return;
     updateSchedule('/api/schedule/leave',{employeeId,date,action:'cancel'},()=>{
       delete state.leaves[k];state.cancelledLeaves[k]=previous;
       if((previous==='full'&&state.shifts[k]==='휴')||(previous==='annual'&&state.shifts[k]==='연'))delete state.shifts[k];
     });
   }else if(action==='restore'){
     const previous=state.cancelledLeaves[k];if(!previous)return;
     updateSchedule('/api/schedule/leave',{employeeId,date,action:'restore'},()=>{
       delete state.cancelledLeaves[k];state.leaves[k]=previous;
       if(previous==='full')state.shifts[k]='휴';else if(previous==='annual')state.shifts[k]='연';
     });
   }
 });
 $('prev').addEventListener('click',()=>{
   if(scheduleBusy)return;
   state.month--;if(state.month<0){state.month=11;state.year--}draw();loadScheduleMonth();
 });
 $('next').addEventListener('click',()=>{
   if(scheduleBusy)return;
   state.month++;if(state.month>11){state.month=0;state.year++}draw();loadScheduleMonth();
 });
 $('deadline').addEventListener('change',()=>{
   if(!canEditSchedule()){draw();return}
   const month=monthKey(),deadline=$('deadline').value;
   updateSchedule('/api/schedule/deadline',{month,deadline},()=>{state.deadlines[month]=deadline});
 });
 async function saveLeaveCapacity(){
   const input=$('leaveCapacity');
   if(!canEditSchedule()){draw();input.blur();return}
   const month=monthKey(),raw=input.value.trim();
   if(raw!==''&&(!/^(0|[1-9][0-9]?)$/.test(raw)||Number(raw)>99)){
     alert('신청 제한 인원은 0~99명으로 설정하거나 비워두세요.');
     draw();input.blur();return;
   }
   const maxApplicants=raw===''?null:Number(raw);
   const current=state.leaveLimits[month]??null;
   if(current!==maxApplicants){
     await updateSchedule('/api/schedule/leave-limit',{month,maxApplicants},()=>{state.leaveLimits[month]=maxApplicants});
   }
   input.blur();
 }
 $('leaveCapacity').addEventListener('change',saveLeaveCapacity);
 $('leaveCapacity').addEventListener('keydown',e=>{
   if(e.key==='Enter'){e.preventDefault();saveLeaveCapacity()}
 });


 // Code editor remains a separate view, but now writes to D1.
 let chosenCode='';
 const groupLabel={am:'오전',long:'롱',pm:'오후',night:'야간'};
 function fg(hex){const raw=String(hex||'').replace('#','');if(!/^[0-9a-fA-F]{6}$/.test(raw))return '#173052';const r=parseInt(raw.slice(0,2),16),g=parseInt(raw.slice(2,4),16),b=parseInt(raw.slice(4,6),16);return r*0.299+g*0.587+b*0.114<145?'#ffffff':'#172b43'}
 function applySpecialColors(){const c=state.specialColors;document.documentElement.style.setProperty('--rest-bg',c.rest);document.documentElement.style.setProperty('--rest-fg',fg(c.rest));document.documentElement.style.setProperty('--annual-bg',c.annual);document.documentElement.style.setProperty('--annual-fg',fg(c.annual));$('restChip').style.background=c.rest;$('restChip').style.color=fg(c.rest);$('annualChip').style.background=c.annual;$('annualChip').style.color=fg(c.annual)}
 function switchView(name){
  if(!$('dailyTemplateView').hidden&&name!=='daily'&&!dailyCanDiscard())return;
  if(!$('dailyTemplateView').hidden&&name!=='daily'){dailyLoaded=false;dailyPendingCodes={};dailyDirty=false;dailyDayDirty=false;dailyHistoryClear()}
  if(active)exitEdit(true);
  const codes=name==='codes',people=name==='people',daily=name==='daily';
  $('scheduleView').hidden=codes||people||daily;
  $('dailyTemplateView').hidden=!daily;
  $('codeView').hidden=!codes;
  $('peopleView').hidden=!people;
  $('navRoster').classList.toggle('active',!codes&&!people&&!daily);
  $('navDaily').classList.toggle('active',daily);
  $('navCodes').classList.toggle('active',codes);
  $('navPeople').classList.toggle('active',people);
  if(daily){dailyEditing=false;dailyPaint();dailyLoad();dailyLoadDay()}
  else if(codes){refreshCodeRows();paintEditor()}
  else if(people){closePasskey();paintPeople()}
  else {draw();loadScheduleMonth()}
  window.scrollTo(0,0);
 }
 function refreshCodeRows(){const query=$('codeSearch').value.trim().toUpperCase(),a=[...state.catalog].sort((x,y)=>{const order={am:0,long:1,pm:2,night:3};return (order[x.type]??4)-(order[y.type]??4)||(x.start||'').localeCompare(y.start||'')||x.code.localeCompare(y.code,'ko')}).filter(c=>!query||c.code.toUpperCase().includes(query));$('codeRows').innerHTML=a.length?a.map(c=>'<tr data-code="'+text(c.code)+'" class="'+(chosenCode===c.code?'chosen':'')+'"><td class="code-name"><span class="code-chip" data-code-chip="'+text(c.code)+'"'+(/^#[0-9a-fA-F]{6}$/.test(c.color||'')?' style="background-color:'+c.color+';color:'+fg(c.color)+'"':'')+'>'+text(c.code)+'</span></td><td>'+text(groupLabel[c.type]||'—')+'</td><td>'+text(c.start||'—')+'</td><td>'+text(c.end||'—')+'</td><td>'+(c.hours===''||c.hours==null?'<span class="blank">미입력</span>':text(c.hours)+'시간')+'</td></tr>').join(''):'<tr><td colspan="5" style="padding:28px;text-align:center;color:#7d8b99">등록된 코드 없음</td></tr>'}
 function paintEditor(){const c=state.catalog.find(o=>o.code===chosenCode);$('codeEditorTitle').textContent=c?'코드 수정':'코드 추가';$('cfCode').value=c?c.code:'';$('cfType').value=c?c.type:'am';$('cfStart').value=c?c.start:'';$('cfEnd').value=c?c.end:'';$('cfHours').value=c&&c.hours!==null&&c.hours!==undefined?c.hours:'';$('cfColor').value=c&&/^#[0-9a-f]{6}$/i.test(c.color||'')?c.color:'#ffffff';$('deleteCode').disabled=!c;$('restColor').value=state.specialColors.rest;$('annualColor').value=state.specialColors.annual;applySpecialColors()}
 function chooseCode(code){chosenCode=code;refreshCodeRows();paintEditor();if(window.innerWidth<=950){$('codeEditor').scrollIntoView({behavior:'smooth',block:'start'})}}
 async function saveCode(){
   if(!canEditSchedule())return;
   const code=$('cfCode').value.trim().toUpperCase();
   if(!code||!(/^[A-Z0-9가-힣-]{1,12}$/.test(code))||['휴','연','-'].includes(code)){alert('근무 코드는 영문·숫자 등의 1~12자 코드로 입력하세요. 휴·연은 별도로 설정됩니다.');return}
   const exists=state.catalog.find(x=>x.code===code);
   if(exists&&code!==chosenCode){alert('이미 등록된 코드입니다.');return}
   const h=$('cfHours').value.trim();
   if(h!==''&&(!Number.isFinite(Number(h))||Number(h)<0||Number(h)>24)){alert('근무시간은 0~24 사이의 숫자로 입력하세요.');return}
   const entry={code,type:$('cfType').value,start:$('cfStart').value,end:$('cfEnd').value,hours:h===''?'':Number(h),color:$('cfColor').value==='#ffffff'?'':$('cfColor').value};
   const originalCode=chosenCode;
   await updateSchedule('/api/schedule/code',{originalCode,...entry},()=>{
     if(originalCode){const i=state.catalog.findIndex(x=>x.code===originalCode);if(i!==-1)state.catalog[i]=entry;
       if(originalCode!==code)for(const k of Object.keys(state.shifts))if(state.shifts[k]===originalCode)state.shifts[k]=code;
     }else state.catalog.push(entry);
     chosenCode=code;refreshCodeRows();paintEditor();
   });
 }
 async function deleteCode(){
   if(!chosenCode||!canEditSchedule())return;
   const code=chosenCode;
   if(!confirm(code+' 코드를 삭제하시겠습니까?'))return;
   await updateSchedule('/api/schedule/code',{code},()=>{
     state.catalog=state.catalog.filter(x=>x.code!==code);chosenCode='';refreshCodeRows();paintEditor();
   },'DELETE');
 }
 $('navRoster').addEventListener('click',()=>switchView('roster'));
 $('navCodes').addEventListener('click',()=>switchView('codes'));
 // Generic roster name stored in D1 and used for Excel titles.
 $('rosterLabel').addEventListener('keydown',e=>{
   if(e.key==='Enter'){e.preventDefault();e.currentTarget.blur()}
   if(e.key==='Escape'){e.preventDefault();e.currentTarget.value=rosterLabel;e.currentTarget.blur()}
 });
 $('rosterLabel').addEventListener('change',async()=>{
   const value=$('rosterLabel').value.trim();
   if(value.length>60){alert('근무표 이름은 60자 이내로 입력하세요.');$('rosterLabel').value=savedRosterLabel;return}
   if(value===savedRosterLabel)return;
   if(!scheduleReady||scheduleBusy){$('rosterLabel').value=savedRosterLabel;alert('D1 연결 또는 저장 완료 후 제목을 변경하세요.');return}
   const ok=await updateSchedule('/api/schedule/title',{label:value},()=>setRosterLabel(value));
   if(!ok)$('rosterLabel').value=savedRosterLabel;
 });
 $('backRoster').addEventListener('click',()=>switchView('roster'));
 $('cfColor').addEventListener('input',e=>{
   if(!chosenCode)return;
   const chip=Array.from($('codeRows').querySelectorAll('[data-code-chip]')).find(el=>el.dataset.codeChip===chosenCode);
   if(chip){chip.style.backgroundColor=e.target.value;chip.style.color=fg(e.target.value)}
 });
 $('codeSearch').addEventListener('input',refreshCodeRows);
 $('codeRows').addEventListener('click',e=>{const row=e.target.closest('tr[data-code]');if(row)chooseCode(row.dataset.code)});
 $('clearCode').addEventListener('click',()=>{chooseCode('');$('cfCode').focus()});
 $('saveCode').addEventListener('click',saveCode);
 $('deleteCode').addEventListener('click',deleteCode);
 $('restColor').addEventListener('input',e=>{state.specialColors.rest=e.target.value;applySpecialColors();draw()});
 $('annualColor').addEventListener('input',e=>{state.specialColors.annual=e.target.value;applySpecialColors();draw()});
 for(const key of ['restColor','annualColor'])$(key).addEventListener('change',async()=>{
   if(!canEditSchedule()){await loadScheduleMonth();return}
   await updateSchedule('/api/schedule/colors',{...state.specialColors},()=>{});
 });
 // Employee management and two optional fields stay as in v13. Passkeys remain display-only.
 let personEditing='';
 let passkeyPersonId='',passkeyMode='first';
 let dbReady=false,dbBusy=false;
 function dbStatus(message,error){const el=$('peopleDbStatus');el.textContent=message;el.classList.toggle('error',!!error)}
 function checkDbReady(){if(dbReady&&!dbBusy)return true;alert(dbBusy?'저장 작업이 진행 중입니다.':'D1 직원 명단을 불러오지 못했습니다. 관리자 설정을 확인하세요.');return false}
 async function dbCall(path,options={}){
   const response=await fetch(path,{credentials:'same-origin',cache:'no-store',...options,headers:{'Content-Type':'application/json','X-Requested-With':'TemoraryAdmin',...(options.headers||{})}});
   const body=await response.json().catch(()=>({ok:false,error:'서버 응답을 읽을 수 없습니다.'}));
   if(!response.ok||!body.ok)throw new Error(body.error||body.stage||('HTTP '+response.status));
   return body;
 }
 // v14: Only the current month is loaded. Changes commit to D1 before being accepted.
 let scheduleReady=false,scheduleBusy=false,monthLoadSerial=0;
 const monthKey=()=>state.year+'-'+two(state.month+1);
 function scheduleStatus(message,error=false){
   $('scheduleDbStatus').textContent=message;
   $('scheduleDbStatus').style.color=error?'#af3440':'#54718d';
 }
 function canEditSchedule(){
   if(scheduleReady&&!scheduleBusy)return true;
   alert(scheduleBusy?'서버에 저장 중입니다. 완료 후 다시 입력하세요.':'D1 근무표를 불러오지 못했습니다. 연결 상태를 확인하세요.');return false;
 }
 async function loadScheduleMonth(){
   if(scheduleBusy)return false;
   const m=monthKey(),token=++monthLoadSerial;
   scheduleReady=false;
   scheduleStatus(m+' D1 근무표 불러오는 중…');
   state.shifts={};state.leaves={};state.cancelledLeaves={};state.monthlyHours={};state.deadlines={};state.leaveLimits={};state.catalog=[];
   draw();
   try{
     const data=await dbCall('/api/schedule/state?month='+encodeURIComponent(m));
     if(token!==monthLoadSerial||m!==monthKey())return false;
     state.catalog=data.catalog;
     state.specialColors=data.colors;
     for(const r of data.shifts)state.shifts[r.employee_id+'|'+r.work_date]=r.code;
     for(const r of data.leaves){const k=r.employee_id+'|'+r.work_date;if(r.status==='cancelled'){state.cancelledLeaves[k]=r.leave_type;const m=r.leave_type==='full'?'휴':r.leave_type==='annual'?'연':'';if(m&&state.shifts[k]===m)delete state.shifts[k]}else state.leaves[k]=r.leave_type}
     for(const r of data.hours)state.monthlyHours[r.employee_id+'|'+m]=r.hours;
     state.deadlines[m]=data.deadline||'';state.leaveLimits[m]=data.maxApplicants??'';
     setRosterLabel(data.rosterLabel||'');
     scheduleReady=true;draw();refreshCodeRows();paintEditor();persist();
     scheduleStatus(m+' D1 연결됨'+(data.publishedAt?' · 배포됨':' · 미배포'));
     return true;
   }catch(error){
     if(token!==monthLoadSerial)return false;
     scheduleReady=false;scheduleStatus('D1 근무표 불러오기 실패: '+error.message,true);draw();return false;
   }
 }
 async function updateSchedule(path,payload,apply,method='PUT'){
   if(!canEditSchedule())return false;
   scheduleBusy=true;scheduleStatus('서버에 저장 중입니다.');
   try{
     await dbCall(path,{method,body:JSON.stringify(payload)});
     apply();persist();
     if(!active)draw();
     scheduleStatus(monthKey()+' D1 저장 완료');
     return true;
   }catch(error){
     scheduleStatus('D1 저장 실패: '+error.message,true);alert('D1 저장 실패: '+error.message);
     // Server is authoritative; discard any tentative local edits and reload.
     scheduleBusy=false;await loadScheduleMonth();return false;
   }finally{scheduleBusy=false}
 }
 function renderPasskey(){
   const p=state.people.find(o=>o.id===passkeyPersonId);
   if(!p){closePasskey();return}
   $('pkPersonName').textContent=p.name;
   $('pkFirst').classList.toggle('active',passkeyMode==='first');
   $('pkReset').classList.toggle('active',passkeyMode==='reset');
   $('pkSteps').innerHTML=passkeyMode==='first'
     ? '<li>관리자가 직원 본인을 확인합니다.</li><li>직원용 일회용 등록 QR을 발급합니다.</li><li>직원이 자신의 휴대폰으로 QR을 스캔합니다.</li><li>휴대폰에서 패스키를 생성하고 등록이 완료됩니다.</li>'
     : '<li>직원이 관리자에게 직접 찾아와 본인 확인을 받습니다.</li><li>관리자가 기존 패스키를 서버에서 무효화합니다.</li><li>새로운 일회용 QR을 발급합니다.</li><li>직원이 자신의 휴대폰에서 새 패스키를 등록합니다.</li>';
   $('pkPhoneText').textContent=passkeyMode==='first'
     ? 'QR을 스캔한 직원의 휴대폰에서 패스키 등록 화면이 열립니다.'
     : '기존 등록을 폐기한 후 새로 발급한 QR을 스캔하면 재등록 화면이 열립니다.';
 }
 function openPasskey(id){
   if(!state.people.some(p=>p.id===id))return;
   passkeyPersonId=id;passkeyMode='first';
   $('personEditorPanel').hidden=true;
   $('passkeyPanel').hidden=false;
   renderPasskey();
   if(window.innerWidth<=850)$('passkeyPanel').scrollIntoView({behavior:'smooth',block:'start'});
 }
 function closePasskey(){
   passkeyPersonId='';$('passkeyPanel').hidden=true;$('personEditorPanel').hidden=false;
 }
 $('pkFirst').addEventListener('click',()=>{passkeyMode='first';renderPasskey()});
 $('pkReset').addEventListener('click',()=>{passkeyMode='reset';renderPasskey()});
 $('closePasskey').addEventListener('click',closePasskey);
 function customCell(person,j){
   const value=Array.isArray(person.customFields)?person.customFields[j]||'':'';
   return '<td class="staff-custom"><input class="staff-value-input" type="text" autocomplete="off" maxlength="80" value="'+text(value)+'" data-staff-id="'+text(person.id)+'" data-column="'+j+'" aria-label="'+text(person.name)+' 분류 '+(j+1)+'"'+(!dbReady?' disabled':'')+'></td>';
 }
 function showStaffAccess(loginId,accessCode){
   $('staffLoginId').value=loginId;
   $('staffAccessCode').value=accessCode;
   $('staffAccessDialog').showModal();
 }
 $('staffAccessClose').addEventListener('click',()=>$('staffAccessDialog').close());
 function resetPerson(){personEditing='';$('personName').value='';$('peopleEditorTitle').textContent='직원 추가';$('savePerson').textContent='직원 등록'}
 function paintPeople(){
   $('peopleCount').textContent=dbReady?'('+state.people.length+'명)':'(연결 확인 중)';
   $('savePerson').disabled=!dbReady||dbBusy;
   $('personName').disabled=!dbReady||dbBusy;
   if(!dbReady){$('peopleRows').innerHTML='<tr><td colspan="5" style="padding:25px;text-align:center;color:#73849a">D1 연결 대기 또는 실패. 브라우저 임시 명단을 대신 표시하지 않습니다.</td></tr>';return}
   $('peopleRows').innerHTML=state.people.length?state.people.map((p,i)=>
     '<tr class="'+(p.id===personEditing?'editing':'')+'"><td>'+(i+1)+'</td><td>'+text(p.name)+'</td>'+customCell(p,0)+customCell(p,1)+'<td><button class="btn" data-person-edit="'+text(p.id)+'">이름 수정</button><button class="btn" data-access-person="'+text(p.id)+'">접속키</button><button class="btn pk-manage" data-passkey-person="'+text(p.id)+'">패스키</button><button class="btn remove" data-person-remove="'+text(p.id)+'">명단 제외</button></td></tr>').join(''):
     '<tr><td colspan="5" style="text-align:center;color:#73849a;padding:25px">D1에 등록된 활성 직원 없음</td></tr>';
 }
 function paintHeaders(){
   for(let j=0;j<2;j++){
     const h=$('staffHeader'+j);h.value=String(state.staffColumnHeaders[j]||'');h.disabled=!dbReady;
   }
 }
 async function loadEmployees(){
   dbStatus('D1 직원 명단 읽는 중…',false);
   try{
     const payload=await dbCall('/api/employees');
     const people=payload.people.map(p=>({id:p.id,name:p.name,customFields:[p.custom1||'',p.custom2||'']}));
     state.people=people;
     state.staffColumnHeaders=payload.headers;
     dbReady=true;
     if(personEditing&&!people.some(p=>p.id===personEditing))resetPerson();
     if(passkeyPersonId&&!people.some(p=>p.id===passkeyPersonId))closePasskey();
     dbStatus('D1 연결됨 · 직원 '+people.length+'명 · 변경 내용은 서버에 저장',false);
     paintHeaders();paintPeople();draw();persist();
     return true;
   }catch(error){
     dbReady=false;
     dbStatus('D1 연결 실패: '+error.message,true);
     paintHeaders();paintPeople();
     return false;
   }
 }
 async function savePerson(){
   if(!checkDbReady())return;
   const name=$('personName').value.trim();
   if(!name){alert('직원 이름을 입력하세요.');$('personName').focus();return}
   if(name.length>40){alert('이름은 40자 이내로 입력하세요.');return}
   const editing=personEditing;
   dbBusy=true;paintPeople();
   try{
     const reply=await dbCall(editing?('/api/employees/'+encodeURIComponent(editing)):'/api/employees',{
       method:editing?'PATCH':'POST',body:JSON.stringify({name})
     });
     const updated=await loadEmployees();
     if(updated){resetPerson();paintPeople();draw()}
     if(!editing&&reply.accessCode)showStaffAccess(reply.loginId,reply.accessCode)
   }catch(error){dbStatus('직원 저장 실패: '+error.message,true);alert('D1 직원 저장에 실패했습니다. '+error.message)}
   finally{dbBusy=false;paintPeople()}
 }
 // Save optional custom cells on change/blur; no optimistic local record of failed writes.
 $('peopleRows').addEventListener('change',async e=>{
   const input=e.target.closest('input[data-staff-id][data-column]');
   if(!input||!checkDbReady())return;
   const p=state.people.find(x=>x.id===input.dataset.staffId);if(!p)return;
   const j=Number(input.dataset.column),value=input.value,old=String(p.customFields[j]||'');
   if(value===old)return;
   input.disabled=true;
   try{
     await dbCall('/api/employees/'+encodeURIComponent(p.id),{method:'PATCH',body:JSON.stringify({[j===0?'custom1':'custom2']:value})});
     p.customFields[j]=value;persist();dbStatus('D1 저장 완료 · '+p.name+' 분류 '+(j+1),false);
   }catch(error){input.value=old;dbStatus('분류 저장 실패: '+error.message,true);alert('D1 저장 실패: '+error.message)}
   finally{input.disabled=false}
 });
 $('peopleRows').addEventListener('click',async e=>{
   const edit=e.target.closest('[data-person-edit]');
   const remove=e.target.closest('[data-person-remove]');
   const passkey=e.target.closest('[data-passkey-person]');
   const access=e.target.closest('[data-access-person]');
   if(access){
     if(!checkDbReady())return;
     const p=state.people.find(x=>x.id===access.dataset.accessPerson);if(!p)return;
     if(!confirm(p.name+' 직원의 시험 접속키를 새로 발급할까요?\\n이전 접속키와 로그인 세션은 무효화됩니다.'))return;
     try{const reply=await dbCall('/api/employees/'+encodeURIComponent(p.id)+'/access-code',{method:'POST',body:'{}'});showStaffAccess(reply.loginId,reply.accessCode)}
     catch(error){alert('접속키 발급 실패: '+error.message)}
     return;
   }
   if(passkey){openPasskey(passkey.dataset.passkeyPerson);return}
   if(edit){
     if(!checkDbReady())return;
     closePasskey();
     const p=state.people.find(p=>p.id===edit.dataset.personEdit);if(!p)return;
     personEditing=p.id;$('personName').value=p.name;
     $('peopleEditorTitle').textContent='직원 이름 수정';$('savePerson').textContent='수정 저장';
     paintPeople();$('personName').focus();return;
   }
   if(remove){
     if(!checkDbReady())return;
     const p=state.people.find(p=>p.id===remove.dataset.personRemove);if(!p)return;
     if(!confirm(p.name+' 직원을 명단에서 제외할까요?\\nD1의 기존 기록은 삭제하지 않습니다.'))return;
     dbBusy=true;paintPeople();
     try{
       await dbCall('/api/employees/'+encodeURIComponent(p.id),{method:'DELETE'});
       state.archivedPeople.push({...p,archivedAt:new Date().toISOString()});
       if(selectedCell&&selectedCell.id===p.id)selectedCell=null;
       if(personEditing===p.id)resetPerson();
       if(passkeyPersonId===p.id)closePasskey();
       await loadEmployees();
     }catch(error){dbStatus('명단 제외 실패: '+error.message,true);alert('D1 명단 제외 실패: '+error.message)}
     finally{dbBusy=false;paintPeople()}
   }
 });
 let headerSaveQueue=Promise.resolve();
 for(let j=0;j<2;j++){
   const header=$('staffHeader'+j);
   header.disabled=true;
   header.addEventListener('change',()=>{
     if(!checkDbReady())return;
     const newText=header.value;
     const previous=String(state.staffColumnHeaders[j]||'');
     if(newText===previous)return;
     headerSaveQueue=headerSaveQueue.catch(()=>{}).then(async()=>{
       const headers=[...state.staffColumnHeaders];headers[j]=newText;
       header.disabled=true;
       try{
         await dbCall('/api/staff-headers',{method:'PUT',body:JSON.stringify({headers})});
         state.staffColumnHeaders=headers;persist();dbStatus('D1 분류 열 제목 저장 완료',false);
       }catch(error){header.value=previous;dbStatus('열 제목 저장 실패: '+error.message,true);alert('D1 저장 실패: '+error.message)}
       finally{header.disabled=false}
     });
   });
 }
 $('savePerson').addEventListener('click',savePerson);
 $('resetPerson').addEventListener('click',()=>{resetPerson();$('personName').focus()});
 $('personName').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();savePerson()}else if(e.key==='Escape'){resetPerson()}});

 // Export the current month from D1. No browser sample fixture is used.
 $('publishSchedule').addEventListener('click',async()=>{
   if(!canEditSchedule())return;
   const m=monthKey();
   if(!confirm(m+' 근무표를 직원에게 배포할까요?'))return;
   const button=$('publishSchedule');button.disabled=true;
   scheduleStatus(m+' 배포 중…');
   try{
     const result=await dbCall('/api/schedule/publish',{method:'POST',body:JSON.stringify({month:m})});
     scheduleStatus(m+' 배포 완료 · '+result.count+'칸');
   }catch(error){scheduleStatus('배포 실패: '+error.message,true);alert('배포 실패: '+error.message)}
   finally{button.disabled=false}
 });
 $('exportExcel').addEventListener('click',async()=>{
   if(!scheduleReady||scheduleBusy){alert('D1 근무표를 불러온 후 내보내세요.');return}
   const btn=$('exportExcel'),month=monthKey();btn.disabled=true;btn.textContent='생성 중…';
   try{
     const res=await fetch('/api/export/complete.xlsx?month='+encodeURIComponent(month),{credentials:'same-origin',cache:'no-store'});
     if(!res.ok){let msg='엑셀 내보내기에 실패했습니다.';try{msg=(await res.json()).error||msg}catch(_){}throw Error(msg)}
     const url=URL.createObjectURL(await res.blob()),link=document.createElement('a');
     link.href=url;link.download='schedule_'+month+'.xlsx';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
   }catch(e){alert(e.message)}finally{btn.disabled=false;btn.textContent='엑셀 내보내기'}
 });
 $('navPeople').addEventListener('click',()=>switchView('people'));
 $('peopleBackRoster').addEventListener('click',()=>switchView('roster'));
 // Auth is cookie/session-based, not the browser's sticky HTTP Basic cache.
 $('adminSettings').addEventListener('click',()=>{
   $('adminPasswordForm').reset();$('passwordChangeStatus').textContent='';
   $('adminPasswordDialog').showModal();$('currentAdminPassword').focus();
 });
 $('adminSettingsClose').addEventListener('click',()=>$('adminPasswordDialog').close());
 $('adminPasswordForm').addEventListener('submit',async e=>{
   e.preventDefault();
   const currentPassword=$('currentAdminPassword').value;
   const newPassword=$('newAdminPassword').value;
   const confirmed=$('confirmAdminPassword').value;
   const status=$('passwordChangeStatus'),save=$('adminPasswordSave');
   if(newPassword!==confirmed){status.textContent='새 비밀번호가 일치하지 않습니다.';return}
   if(!newPassword.trim()){status.textContent='새 비밀번호를 입력하세요.';return}
   save.disabled=true;status.textContent='';
   try{
     const res=await fetch('/api/auth/password',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','X-Requested-With':'TemoraryAdmin'},body:JSON.stringify({currentPassword,newPassword})});
     const data=await res.json();if(!res.ok||!data.ok)throw new Error(data.error||'비밀번호 변경에 실패했습니다.');
     window.location.replace('/login');
   }catch(error){status.textContent=error.message;save.disabled=false}
 });
 $('adminLogout').addEventListener('click',async()=>{
   const btn=$('adminLogout');btn.disabled=true;
   try{
     const res=await fetch('/api/auth/logout',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','X-Requested-With':'TemoraryAdmin'},body:'{}'});
     if(!res.ok)throw new Error('로그아웃에 실패했습니다.');
     window.location.replace('/login');
   }catch(error){btn.disabled=false;alert(error.message)}
 });
 // Daily sheet: the roster owns code assignments, the code catalog owns times, staff IDs own names.
 const freshDailyTemplate=()=>{
  const cells=[
   {r:0,c:0,rs:1,cs:3,text:'',fontSize:21,bold:true},
   {r:0,c:3,rs:1,cs:3,text:'',role:'date',fontSize:17,bold:true},
   {r:1,c:0,rs:1,cs:1,text:'코드',bold:true},
   {r:1,c:1,rs:1,cs:1,text:'근무시간',bold:true},
   {r:1,c:2,rs:1,cs:1,text:'근무자 명단',bold:true},
   {r:1,c:3,rs:1,cs:1,text:'휴무',bold:true},
   {r:1,c:4,rs:1,cs:1,text:'연차',bold:true},
   {r:1,c:5,rs:1,cs:1,text:'공유',bold:true},
   {r:2,c:3,rs:21,cs:1,text:'',role:'leave'},
   {r:2,c:4,rs:21,cs:1,text:'',role:'annual'},
   {r:2,c:5,rs:21,cs:1,text:'',role:'shared'},
   {r:23,c:0,rs:1,cs:6,text:''}
  ];
  for(let r=2;r<23;r++)for(let c=0;c<3;c++)cells.push({r:r,c:c,rs:1,cs:1,text:'',role:['code','time','names'][c]});
  return {widths:[73,127,350,90,90,90],heights:Array.from({length:24},(_,i)=>i===0?56:i===1?41:i===23?48:37),cells:cells};
 };
 let dailyTemplate=freshDailyTemplate(),dailySelected={r:0,c:0},dailyAnchor={r:0,c:0},dailyRange=null;
 let dailyMarkedCells=new Set(),dailyChosenCols=new Set(),dailyChosenRows=new Set(),dailyColAnchor=0,dailyRowAnchor=0;
 let dailyUndoHistory=[],dailyRedoHistory=[],dailyTypingKey=null,dailyPendingCodes={},dailyOriginalCodes={};
 let dailyEditing=false,dailyResizeArmed=false,dailyDirty=false,dailyDayDirty=false,dailyLoaded=false,dailyLoading=false,dailySaving=false;
 let dailyDateValue=new Date().getFullYear()+'-'+String(new Date().getMonth()+1).padStart(2,'0')+'-'+String(new Date().getDate()).padStart(2,'0');
 let dailyDay={people:[],shifts:[],catalog:[],leaves:[]},dailyOverrides={},dailyPointer=null,dailyFetchSeq=0;
 const dailySheet=$('dailySheetTable'),dailyWrap=$('dailySheetWrap');
 const dailyKey=(r,c)=>r+','+c;
 function dailyCell(r,c){return dailyTemplate.cells.find(x=>r>=x.r&&r<x.r+x.rs&&c>=x.c&&c<x.c+x.cs)||{r:r,c:c,rs:1,cs:1,text:''}}
 function dailyEntry(r,c){const x=dailyCell(r,c);let entry=dailyTemplate.cells.find(y=>y.r===x.r&&y.c===x.c);if(!entry){entry={r:x.r,c:x.c,rs:1,cs:1,text:''};dailyTemplate.cells.push(entry)}return entry}
 function dailyColLabel(c){let s='';for(let n=c+1;n;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s}
 function dailyRoles(){const roles={code:[],time:[],names:[]};for(const cell of dailyTemplate.cells)if(roles[cell.role])roles[cell.role].push(cell);for(const role of ['code','time','names'])roles[role].sort((a,b)=>a.r-b.r||a.c-b.c);return roles}
 function dailyGroups(){const map=new Map(),catalog=new Map(dailyDay.catalog.map(x=>[x.code,x]));for(const sh of dailyDay.shifts){if(!sh.code||sh.code==='휴'||sh.code==='연')continue;if(!map.has(sh.code))map.set(sh.code,{code:sh.code,people:[],info:catalog.get(sh.code)});map.get(sh.code).people.push({id:sh.employee_id,name:sh.name})}return [...map.values()].sort((a,b)=>String(a.info?.start||'99:99').localeCompare(String(b.info?.start||'99:99'))||a.code.localeCompare(b.code,'ko'))}
 function dailyValue(cell,roles,groups){const role=cell.role||'',key=dailyKey(cell.r,cell.c);
  if(role==='date'){const d=new Date(dailyDateValue+'T12:00:00');return {value:dailyDateValue.replace(/-/g,'. ')+' ('+['일','월','화','수','목','금','토'][d.getDay()]+')'}}
  if(role==='shared')return {value:Object.prototype.hasOwnProperty.call(dailyOverrides,key)?dailyOverrides[key]:cell.text||''};
  if(role==='leave'||role==='annual'){const filtered=dailyDay.leaves.filter(x=>x.leave_type===(role==='leave'?'full':'annual'));return {value:filtered.map(x=>x.name).join('\\n')}}
  if(['code','time','names'].includes(role)){
   const ix=roles[role].findIndex(x=>x.r===cell.r&&x.c===cell.c);
   const g=groups[ix];if(!g)return {value:''};
   if(role==='code')return {value:g.code};
   if(role==='time'){const i=g.info;return {value:i?(i.start||'—')+' ~ '+(i.end||'—'):'시간 미설정'}}
   return {value:g.people.map(x=>x.name).join(' · '),people:g.people};
  }
  return {value:Object.prototype.hasOwnProperty.call(dailyOverrides,key)?dailyOverrides[key]:cell.text||''};
 }
 function dailyTableHtml(edit){const t=dailyTemplate,w=t.widths,h=t.heights,roles=dailyRoles(),groups=dailyGroups();let out='<colgroup>'+(edit?'<col style="width:37px">':'');for(const width of w)out+='<col style="width:'+width+'px">';out+='</colgroup>';
  if(edit){out+='<thead><tr><th class="row-num"></th>';for(let c=0;c<w.length;c++)out+='<th data-col="'+c+'">'+dailyColLabel(c)+'<span class="col-resize" data-col="'+c+'"></span></th>';out+='</tr></thead>'}
  out+='<tbody>';const occupied=new Set();for(let r=0;r<h.length;r++){
   out+='<tr style="height:'+h[r]+'px">';if(edit)out+='<th class="row-num" data-row="'+r+'">'+(r+1)+'<span class="row-resize" data-row="'+r+'"></span></th>';
   for(let c=0;c<w.length;c++){if(occupied.has(dailyKey(r,c)))continue;const cell=dailyCell(r,c);if(cell.r!==r||cell.c!==c){occupied.add(dailyKey(r,c));continue}
    for(let rr=r;rr<r+cell.rs;rr++)for(let cc=c;cc<c+cell.cs;cc++)if(rr!==r||cc!==c)occupied.add(dailyKey(rr,cc));
    const dat=dailyValue(cell,roles,groups),role=cell.role||'',borders=cell.borders||{};
    const sides=[['t','top'],['r','right'],['b','bottom'],['l','left']];
    const borderStyle=sides.map(([key,side])=>{const n=Number.isInteger(borders[key])&&borders[key]>=0&&borders[key]<=3?borders[key]:1;return 'border-'+side+':'+n+'px '+(n?'solid #222':'none transparent')+';'}).join('');
    const style='font-size:'+Math.max(9,Math.min(42,cell.fontSize||13))+'px;font-weight:'+(cell.bold?'700':'400')+';text-align:'+(cell.align==='left'||cell.align==='right'?cell.align:'center')+';'+borderStyle;
    let content=text(dat.value||'');if(role==='names'&&!edit&&dat.people?.length)content=dat.people.map(p=>'<button type="button" class="name-tag" data-person="'+text(p.id)+'" title="이름 수정 불가 · 근무 코드 선택">'+text(p.name)+'</button>').join('');
    const grips=edit?'<span class="col-resize" data-col="'+(c+cell.cs-1)+'" title="열 너비 조절" aria-hidden="true"></span><span class="row-resize" data-row="'+(r+cell.rs-1)+'" title="행 높이 조절" aria-hidden="true"></span>':'';
    out+='<td data-r="'+r+'" data-c="'+c+'"'+(cell.rs>1?' rowspan="'+cell.rs+'"':'')+(cell.cs>1?' colspan="'+cell.cs+'"':'')+' class="'+(role==='names'?'name-cell ':role?'locked-cell ':'')+'" style="'+style+'">'+content+grips+'</td>';
   }
   out+='</tr>';
  }
  return out+'</tbody>';
 }
 function dailyPaint(){dailySheet.innerHTML=dailyTableHtml(dailyEditing);dailySheet.classList.toggle('edit-mode',dailyEditing);dailySheet.classList.toggle('resize-armed',dailyEditing&&dailyResizeArmed);dailyWrap.classList.toggle('editing',dailyEditing);$('dailyEditTools').hidden=!dailyEditing;$('dailyContentTools').hidden=dailyEditing;$('dailyCodeEditor').hidden=dailyEditing;$('dailyToggleEdit').textContent=dailyEditing?'내용 입력':'셀 편집';$('dailyDate').value=dailyDateValue;dailyPaintSelection();dailyPeopleOptions();dailySaveButtons()}
 function dailyPaintSelection(){const cell=dailyCell(dailySelected.r,dailySelected.c);
  let coord=dailyColLabel(cell.c)+(cell.r+1)+(dailyRange?' ~ '+dailyColLabel(dailyRange.c2)+(dailyRange.r2+1):'');
  if(dailyChosenCols.size)coord=[...dailyChosenCols].sort((a,b)=>a-b).map(dailyColLabel).join(' · ')+' 열';
  else if(dailyChosenRows.size)coord=[...dailyChosenRows].sort((a,b)=>a-b).map(r=>r+1).join(' · ')+' 행';
  else if(dailyMarkedCells.size>1)coord=dailyMarkedCells.size+'개 셀';
  $('dailyCoord').textContent=coord;$('dailyContentCoord').textContent=coord;
  const role=cell.role||'',key=dailyKey(cell.r,cell.c);$('dailyRole').value=role;
  $('dailyFontSize').value=cell.fontSize||13;$('dailyBold').checked=!!cell.bold;$('dailyAlign').textContent='정렬: '+({left:'왼쪽',center:'가운데',right:'오른쪽'}[cell.align]||'가운데');$('dailyColWidth').value=dailyTemplate.widths[cell.c];$('dailyRowHeight').value=dailyTemplate.heights[cell.r];
  for(const el of dailySheet.querySelectorAll('td[data-r]')){const r=+el.dataset.r,c=+el.dataset.c,inside=dailyRange&&r>=dailyRange.r1&&r<=dailyRange.r2&&c>=dailyRange.c1&&c<=dailyRange.c2;
   el.classList.toggle('selected',r===cell.r&&c===cell.c);
   el.classList.toggle('in-range',!!inside||dailyChosenCols.size>0&&[...dailyChosenCols].some(col=>col>=c&&col<c+el.colSpan)||dailyChosenRows.size>0&&[...dailyChosenRows].some(row=>row>=r&&row<r+el.rowSpan));
   el.classList.toggle('multi-selected',dailyMarkedCells.has(dailyKey(r,c)));
  }
  for(const th of dailySheet.querySelectorAll('thead th[data-col]'))th.classList.toggle('col-picked',dailyChosenCols.has(+th.dataset.col));
  for(const th of dailySheet.querySelectorAll('tbody th[data-row]'))th.classList.toggle('row-picked',dailyChosenRows.has(+th.dataset.row));
 }
 function dailySelect(r,c,extend,toggle){const cell=dailyCell(r,c);dailyTypingKey=null;
  if(toggle){dailyChosenCols.clear();dailyChosenRows.clear();dailyRange=null;if(!dailyMarkedCells.size)dailyMarkedCells.add(dailyKey(dailySelected.r,dailySelected.c));const key=dailyKey(cell.r,cell.c);if(dailyMarkedCells.has(key))dailyMarkedCells.delete(key);else dailyMarkedCells.add(key);dailySelected={r:cell.r,c:cell.c};dailyAnchor={...dailySelected}}
  else if(extend){dailyMarkedCells.clear();dailyChosenCols.clear();dailyChosenRows.clear();const a=dailyAnchor||dailySelected;dailyRange={r1:Math.min(a.r,cell.r),c1:Math.min(a.c,cell.c),r2:Math.max(a.r,cell.r+cell.rs-1),c2:Math.max(a.c,cell.c+cell.cs-1)};dailySelected={r:a.r,c:a.c}}
  else{dailyMarkedCells.clear();dailyChosenCols.clear();dailyChosenRows.clear();dailySelected={r:cell.r,c:cell.c};dailyAnchor={r:cell.r,c:cell.c};dailyRange=null}if(dailyEditing){dailyResizeArmed=true;dailySheet.classList.add('resize-armed')}dailyPaintSelection()}
 function dailySelectHeader(axis,index,extend,toggle){dailyTypingKey=null;dailyMarkedCells.clear();dailyRange=null;
  const col=axis==='col',target=col?dailyChosenCols:dailyChosenRows,other=col?dailyChosenRows:dailyChosenCols,prev=col?dailyColAnchor:dailyRowAnchor;
  other.clear();if(toggle){if(target.has(index))target.delete(index);else target.add(index)}
  else if(extend){target.clear();for(let k=Math.min(prev,index);k<=Math.max(prev,index);k++)target.add(k)}
  else{target.clear();target.add(index);if(col)dailyColAnchor=index;else dailyRowAnchor=index}
  if(col){dailySelected={r:0,c:index}}else{dailySelected={r:index,c:0}}dailyAnchor={...dailySelected};dailyResizeArmed=true;dailySheet.classList.add('resize-armed');dailyPaintSelection();
 }
 function dailyRemember(){dailyTypingKey=null;dailyUndoHistory.push(dailyCurrentSnapshot());if(dailyUndoHistory.length>60)dailyUndoHistory.shift();dailyRedoHistory.length=0;dailyUndoButtons()}
 function dailyHasChanges(){return dailyDirty||dailyDayDirty||Object.keys(dailyPendingCodes).length>0}
 function dailySaveButtons(){$('dailySaveAll').disabled=!dailyHasChanges()||dailySaving}
 function dailyUndoButtons(){$('dailyUndo').disabled=!dailyUndoHistory.length||dailySaving;$('dailyRedo').disabled=!dailyRedoHistory.length||dailySaving;dailySaveButtons()}
 function dailyCurrentSnapshot(){return {template:JSON.stringify(dailyTemplate),overrides:JSON.stringify(dailyOverrides),shifts:JSON.stringify(dailyDay.shifts),pending:JSON.stringify(dailyPendingCodes),dirty:dailyDirty,dayDirty:dailyDayDirty}}
 function dailyRestore(snap){dailyTypingKey=null;dailyTemplate=JSON.parse(snap.template);dailyOverrides=JSON.parse(snap.overrides);dailyDay.shifts=JSON.parse(snap.shifts);dailyPendingCodes=JSON.parse(snap.pending);dailyDirty=snap.dirty;dailyDayDirty=snap.dayDirty;
  dailySelected={r:Math.min(dailySelected.r,dailyTemplate.heights.length-1),c:Math.min(dailySelected.c,dailyTemplate.widths.length-1)};dailyAnchor={...dailySelected};
  dailyChosenCols=new Set([...dailyChosenCols].filter(c=>c<dailyTemplate.widths.length));dailyChosenRows=new Set([...dailyChosenRows].filter(r=>r<dailyTemplate.heights.length));
  dailyMarkedCells=new Set([...dailyMarkedCells].filter(k=>{const [r,c]=k.split(',').map(Number);return r<dailyTemplate.heights.length&&c<dailyTemplate.widths.length}));
  if(dailyRange&&(dailyRange.r2>=dailyTemplate.heights.length||dailyRange.c2>=dailyTemplate.widths.length))dailyRange=null;
  $('dailyStatus').textContent='변경 사항 '+(dailyHasChanges()?'저장 전':'없음');dailyPaint();dailyUndoButtons()}
 function dailyUndo(){if(!dailyUndoHistory.length)return;dailyRedoHistory.push(dailyCurrentSnapshot());dailyRestore(dailyUndoHistory.pop())}
 function dailyRedo(){if(!dailyRedoHistory.length)return;dailyUndoHistory.push(dailyCurrentSnapshot());dailyRestore(dailyRedoHistory.pop())}
 function dailyHistoryClear(){dailyUndoHistory=[];dailyRedoHistory=[];dailyTypingKey=null;dailyUndoButtons()}
 function dailyStyleTargets(){const cells=new Map();for(const x of dailyTemplate.cells){if(dailyMarkedCells.has(dailyKey(x.r,x.c))||dailyRange&&x.r<=dailyRange.r2&&x.r+x.rs-1>=dailyRange.r1&&x.c<=dailyRange.c2&&x.c+x.cs-1>=dailyRange.c1||dailyChosenCols.size&&[...dailyChosenCols].some(c=>c>=x.c&&c<x.c+x.cs)||dailyChosenRows.size&&[...dailyChosenRows].some(r=>r>=x.r&&r<x.r+x.rs))cells.set(dailyKey(x.r,x.c),x)}
  if(!cells.size){const x=dailyEntry(dailySelected.r,dailySelected.c);cells.set(dailyKey(x.r,x.c),x)}return [...cells.values()]}
 function dailyDirtyMark(template){if(template)dailyDirty=true;else dailyDayDirty=true;dailyUnsavedStatus()}
 function dailyUnsavedStatus(){$('dailyStatus').textContent=dailyHasChanges()?'저장 전 변경 사항 있음':'변경 사항 없음';dailySaveButtons()}
 function dailySetText(value){const cell=dailyCell(dailySelected.r,dailySelected.c);if(cell.role&&cell.role!=='shared')return;const key=dailyKey(cell.r,cell.c);
  const scope=dailyEditing?'template':'date';const batch=dailyDateValue+'|'+key+'|'+scope;if(dailyTypingKey!==batch){dailyRemember();dailyTypingKey=batch}
  if(scope==='template'){dailyEntry(cell.r,cell.c).text=value;dailyDirtyMark(true)}else{dailyOverrides[key]=value;dailyDirtyMark(false)}dailyPaint()}
 function dailySetRole(role){const entry=dailyEntry(dailySelected.r,dailySelected.c);if((entry.role||'')===role)return;dailyRemember();entry.role=role;dailyDirtyMark(true);dailyPaint()}
 function dailyBorderTargets(){
  const selected=new Set();const rows=dailyTemplate.heights.length,cols=dailyTemplate.widths.length;
  const add=(r,c)=>{if(r>=0&&r<rows&&c>=0&&c<cols)selected.add(dailyKey(r,c))};
  if(dailyChosenCols.size){for(const c of dailyChosenCols)for(let r=0;r<rows;r++)add(r,c)}
  else if(dailyChosenRows.size){for(const r of dailyChosenRows)for(let c=0;c<cols;c++)add(r,c)}
  else if(dailyMarkedCells.size){for(const key of dailyMarkedCells){const [r,c]=key.split(',').map(Number);add(r,c)}}
  else if(dailyRange){for(let r=dailyRange.r1;r<=dailyRange.r2;r++)for(let c=dailyRange.c1;c<=dailyRange.c2;c++)add(r,c)}
  else add(dailySelected.r,dailySelected.c);
  const targets=new Map();for(const key of selected){const [r,c]=key.split(',').map(Number),cell=dailyCell(r,c);targets.set(dailyKey(cell.r,cell.c),cell)}
  const allCoords=new Set();for(const cell of targets.values())for(let r=cell.r;r<cell.r+cell.rs;r++)for(let c=cell.c;c<cell.c+cell.cs;c++)allCoords.add(dailyKey(r,c));
  return {targets:[...targets.values()],selected:allCoords};
 }
 function dailyApplyBorder(action){if(dailySaving)return;
  const supported=['none','all','outline','inside','top','bottom','left','right'];if(!supported.includes(action))return;
  const {targets,selected}=dailyBorderTargets();if(!targets.length)return;
  const width=Math.max(0,Math.min(3,Number($('dailyBorderWidth').value)||0));const updates=[];
  for(const cell of targets){const b=cell.borders||{},next={...b};const outside={
    t:Array.from({length:cell.cs},(_,i)=>!selected.has(dailyKey(cell.r-1,cell.c+i))).some(Boolean),
    b:Array.from({length:cell.cs},(_,i)=>!selected.has(dailyKey(cell.r+cell.rs,cell.c+i))).some(Boolean),
    l:Array.from({length:cell.rs},(_,i)=>!selected.has(dailyKey(cell.r+i,cell.c-1))).some(Boolean),
    r:Array.from({length:cell.rs},(_,i)=>!selected.has(dailyKey(cell.r+i,cell.c+cell.cs))).some(Boolean)
  };
    for(const side of ['t','r','b','l']){
      if(action==='none')next[side]=0;
      else if(action==='all')next[side]=width;
      else if(action==='outline')next[side]=outside[side]?width:0;
      else if(action==='inside')next[side]=outside[side]?0:width;
      else if(action==='top'&&side==='t'&&outside[side])next[side]=width;
      else if(action==='bottom'&&side==='b'&&outside[side])next[side]=width;
      else if(action==='left'&&side==='l'&&outside[side])next[side]=width;
      else if(action==='right'&&side==='r'&&outside[side])next[side]=width;
    }
    if(['t','r','b','l'].some(side=>(b[side]??1)!==(next[side]??1)))updates.push({r:cell.r,c:cell.c,borders:next});
  }
  if(!updates.length)return;
  dailyRemember();for(const item of updates)dailyEntry(item.r,item.c).borders=item.borders;
  dailyDirtyMark(true);dailyPaint();
 }
 function dailySetStyle(field,value){const targets=dailyStyleTargets();if(targets.every(x=>field==='fontSize'?(x.fontSize||13)===value:field==='align'?(x.align||'center')===value:!!x.bold===!!value))return;dailyRemember();for(const entry of targets)entry[field]=value;dailyDirtyMark(true);dailyPaint()}
 function dailyMerge(){if(dailyMarkedCells.size||dailyChosenCols.size||dailyChosenRows.size)return alert('셀 병합은 연속된 영역을 드래그하거나 Shift로 선택하세요.');const b=dailyRange;if(!b)return alert('병합할 셀을 드래그하거나 Shift+방향키로 선택하세요.');const hit=dailyTemplate.cells.filter(x=>x.r<=b.r2&&x.r+x.rs-1>=b.r1&&x.c<=b.c2&&x.c+x.cs-1>=b.c1);
  if(hit.some(x=>x.r<b.r1||x.c<b.c1||x.r+x.rs-1>b.r2||x.c+x.cs-1>b.c2))return alert('기존 병합 셀 전체를 포함해서 선택하세요.');
  const distinct=[...new Set(hit.map(x=>x.role||'').filter(Boolean))];if(distinct.length>1)return alert('서로 다른 데이터 역할의 셀은 병합할 수 없습니다.');
  const src=hit.find(x=>x.r===b.r1&&x.c===b.c1)||{},contents=hit.map(x=>x.text).filter(Boolean);
  dailyRemember();dailyTemplate.cells=dailyTemplate.cells.filter(x=>!hit.includes(x));dailyTemplate.cells.push({r:b.r1,c:b.c1,rs:b.r2-b.r1+1,cs:b.c2-b.c1+1,text:contents.join(' '),role:distinct[0]||'',fontSize:src.fontSize||13,bold:!!src.bold,align:src.align||'center',...(src.borders?{borders:{...src.borders}}:{})});
  dailySelected={r:b.r1,c:b.c1};dailyAnchor={...dailySelected};dailyRange=null;dailyDirtyMark(true);dailyPaint();
 }
 function dailySplit(){const cell=dailyCell(dailySelected.r,dailySelected.c);if(cell.rs===1&&cell.cs===1)return;dailyRemember();const entry=dailyEntry(cell.r,cell.c);entry.rs=1;entry.cs=1;dailyRange=null;dailyDirtyMark(true);dailyPaint()}
 function dailyHasContentOn(axis,index){const row=axis==='row';
  if(dailyTemplate.cells.some(x=>{const start=row?x.r:x.c,len=row?x.rs:x.cs;return index>=start&&index<start+len&&(!!(x.text||'').trim()||!!x.role)}))return true;
  if(Object.entries(dailyOverrides).some(([k,v])=>{const [r,c]=k.split(',').map(Number);return !!String(v).trim()&&(row?r===index:c===index)}))return true;
  return false;
 }
 function dailyChangeDimension(axis,add){const row=axis==='row',sizes=row?dailyTemplate.heights:dailyTemplate.widths,limit=row?70:20,min=row?4:3,pos=row?'r':'c',span=row?'rs':'cs',chosen=row?dailyChosenRows:dailyChosenCols;
  if(dailySaving)return;
  if(!add&&chosen.size>1)return alert('삭제할 행·열은 하나만 선택하세요.');
  const idx=chosen.size?(add?Math.max(...chosen):[...chosen][0]):dailySelected[row?'r':'c'],at=add?idx+1:idx;
  if(add){if(sizes.length>=limit)return alert('최대 행·열 수입니다.');dailyRemember();sizes.splice(at,0,row?37:100);for(const x of dailyTemplate.cells){if(x[pos]>=at)x[pos]++;else if(x[pos]+x[span]>at)x[span]++}
    const moved={};for(const [key,value] of Object.entries(dailyOverrides)){const [r,c]=key.split(',').map(Number);moved[dailyKey(row&&r>=at?r+1:r,!row&&c>=at?c+1:c)]=value}dailyOverrides=moved;
  }else{if(sizes.length<=min)return alert('최소 행·열 수입니다.');if(dailyHasContentOn(axis,at))return alert('내용이나 데이터가 있는 '+(row?'행':'열')+'은 삭제할 수 없습니다.');dailyRemember();sizes.splice(at,1);dailyTemplate.cells=dailyTemplate.cells.filter(x=>{if(x[pos]>at){x[pos]--;return true}if(x[pos]===at){if(x[span]>1){x[span]--;return true}return false}if(x[pos]+x[span]>at)x[span]--;return true});
    const moved={};for(const [key,value] of Object.entries(dailyOverrides)){const [r,c]=key.split(',').map(Number);if((row?r:c)===at)continue;moved[dailyKey(row&&r>at?r-1:r,!row&&c>at?c-1:c)]=value}dailyOverrides=moved;
    dailySelected[row?'r':'c']=Math.min(idx,sizes.length-1);
  }
  if(Object.keys(dailyOverrides).length)dailyDayDirty=true;
  dailyAnchor={...dailySelected};dailyRange=null;dailyMarkedCells.clear();dailyChosenCols.clear();dailyChosenRows.clear();dailyDirtyMark(true);dailyPaint();
 }

 function dailyEqualizeRows(){
  if(dailySaving)return;
  const heights=dailyTemplate.heights;
  const selected=new Set();
  const addRows=(cell)=>{for(let r=cell.r;r<cell.r+cell.rs;r++)if(r>=0&&r<heights.length)selected.add(r)};
  if(dailyChosenRows.size){
    for(const r of dailyChosenRows)if(r>=0&&r<heights.length)selected.add(r);
  }else if(dailyRange){
    for(let r=dailyRange.r1;r<=dailyRange.r2;r++)if(r>=0&&r<heights.length)selected.add(r);
  }else if(dailyMarkedCells.size){
    for(const key of dailyMarkedCells){
      const [r,c]=key.split(',').map(Number);
      addRows(dailyCell(r,c));
    }
  }else addRows(dailyCell(dailySelected.r,dailySelected.c));
  const rows=[...selected].sort((a,b)=>a-b);
  if(rows.length<2){$('dailyStatus').textContent='높이를 맞출 행을 2개 이상 선택하세요.';return}
  const total=rows.reduce((sum,r)=>sum+heights[r],0);
  const unit=Math.floor(total/rows.length),extra=total%rows.length;
  const values=rows.map((_,i)=>unit+(i<extra?1:0));
  if(rows.every((r,i)=>heights[r]===values[i])){
    $('dailyStatus').textContent='선택한 행은 이미 균등한 높이입니다.';return;
  }
  dailyRemember();
  for(let i=0;i<rows.length;i++)heights[rows[i]]=values[i];
  dailyDirtyMark(true);
  dailyPaint();
 }
 function dailyResizeTargets(axis,index){const picked=axis==='col'?dailyChosenCols:dailyChosenRows;return picked.has(index)?[...picked].sort((a,b)=>a-b):[index]}
 function dailyResize(axis,index,newSize){const sizes=axis==='col'?dailyTemplate.widths:dailyTemplate.heights,min=axis==='col'?42:25,max=axis==='col'?650:170;const n=Math.max(min,Math.min(max,Math.round(newSize)));if(!Number.isFinite(n))return;const targets=dailyResizeTargets(axis,index);if(targets.every(i=>sizes[i]===n))return;dailyRemember();for(const i of targets)sizes[i]=n;dailyDirtyMark(true);dailyPaint()}
 function dailyMigrateTemplate(t){if(!t||!Array.isArray(t.cells))return freshDailyTemplate();if(!t.cells.some(x=>x.role)&&t.widths.length===6&&t.cells.some(x=>x.r===1&&x.c===2&&x.text==='근무자 명단')){
   const mark=(r,c,role)=>{const e=t.cells.find(x=>r>=x.r&&r<x.r+x.rs&&c>=x.c&&c<x.c+x.cs);if(e){if(e.r===r&&e.c===c&&(!e.text||role==='date'))e.role=role}else t.cells.push({r:r,c:c,rs:1,cs:1,text:'',role:role})};
   mark(0,3,'date');mark(2,3,'leave');mark(2,4,'annual');mark(2,5,'shared');for(let r=2;r<Math.min(23,t.heights.length-1);r++)for(let c=0;c<3;c++)mark(r,c,['code','time','names'][c]);
  }return t}
 async function dailyLoad(){if(dailyLoading||dailyLoaded)return;dailyLoading=true;$('dailyStatus').textContent='양식 불러오는 중…';try{const res=await fetch('/api/daily-template',{credentials:'same-origin'}),body=await res.json();if(!res.ok||!body.ok)throw Error(body.error||'양식 읽기 실패');const legacy=!!(body.template&&!body.template.cells.some(x=>x.role));dailyTemplate=dailyMigrateTemplate(body.template);dailyLoaded=true;dailyDirty=legacy;dailyHistoryClear();$('dailyStatus').textContent=legacy?'기존 양식을 변환했습니다 · 공통 양식을 저장하세요':'';dailyPaint()}catch(e){$('dailyStatus').textContent=e.message}finally{dailyLoading=false}}
 async function dailyLoadDay(){const seq=++dailyFetchSeq;const date=dailyDateValue;$('dailyStatus').textContent='일간 근무표 불러오는 중…';try{const res=await fetch('/api/daily-day?date='+encodeURIComponent(date),{credentials:'same-origin'}),body=await res.json();if(!res.ok||!body.ok)throw Error(body.error||'일간 근무표 읽기 실패');if(seq!==dailyFetchSeq)return;dailyDay=body;dailyOverrides=body.overrides||{};dailyOriginalCodes=Object.fromEntries((body.shifts||[]).map(x=>[x.employee_id,x.code||'']));dailyPendingCodes={};dailyDayDirty=false;dailyHistoryClear();$('dailyStatus').textContent='';dailyPaint()}catch(e){if(seq===dailyFetchSeq)$('dailyStatus').textContent=e.message}}
 function dailyPeopleOptions(){if(dailyEditing)return;const sel=$('dailyEmployeeSelect'),old=sel.value;sel.innerHTML='<option value="">직원 선택</option>'+dailyDay.people.map(p=>'<option value="'+text(p.id)+'">'+text(p.name)+'</option>').join('');if(dailyDay.people.some(p=>p.id===old)){sel.value=old;$('dailyEmployeeSearch').value=dailyDay.people.find(p=>p.id===old).name}else if(old){sel.value='';$('dailyEmployeeSearch').value=''}dailyCodeOptions()}
 function dailyCloseEmployeeSuggestions(){const list=$('dailyEmployeeSuggestions');list.hidden=true;list.innerHTML='';$('dailyEmployeeSearch').setAttribute('aria-expanded','false')}
 function dailyChooseEmployee(id){const p=dailyDay.people.find(x=>x.id===id);$('dailyEmployeeSelect').value=p?p.id:'';$('dailyEmployeeSearch').value=p?p.name:'';dailyCloseEmployeeSuggestions();dailyCodeOptions();$('dailyEmployeeSearch').focus({preventScroll:true})}
 function dailyAutocompleteMatches(){const q=$('dailyEmployeeSearch').value.trim().replace(/\\s+/g,'');if([...q].length<2)return[];return dailyDay.people.filter(p=>p.name.replace(/\\s+/g,'').includes(q)).slice(0,30)}
 function dailyRefreshEmployeeSuggestions(){const list=$('dailyEmployeeSuggestions'),inp=$('dailyEmployeeSearch'),q=inp.value.trim();$('dailyEmployeeSelect').value='';dailyCodeOptions();if([...q].length<2){dailyCloseEmployeeSuggestions();return}
  const match=dailyAutocompleteMatches(),counts=new Map();for(const p of dailyDay.people)counts.set(p.name,(counts.get(p.name)||0)+1);
  list.innerHTML=match.length?match.map(p=>'<button type="button" role="option" data-employee-id="'+text(p.id)+'">'+text(p.name)+(counts.get(p.name)>1?' · '+text(p.id.slice(-6)):'')+'</button>').join(''):'<div class="no-match">일치하는 직원 없음</div>';
  list.hidden=false;inp.setAttribute('aria-expanded','true');
 }
 function dailyCodeOptions(){const select=$('dailyEmployeeCode'),eid=$('dailyEmployeeSelect').value,old=dailyDay.shifts.find(x=>x.employee_id===eid)?.code||'';select.innerHTML='<option value="">배정 없음</option>'+dailyDay.catalog.map(x=>'<option value="'+text(x.code)+'">'+text(x.code)+' ('+text(x.start||'—')+'~'+text(x.end||'—')+')</option>').join('');if([...select.options].some(o=>o.value===old))select.value=old}
 function dailyDiscardOnDateChange(){if(dailyDirty){dailyLoaded=false;dailyDirty=false;dailyLoad()}dailyDayDirty=false;dailyPendingCodes={};dailyHistoryClear()}
 function dailyDateShift(days){if(!dailyCanDiscard())return;dailyDiscardOnDateChange();const d=new Date(dailyDateValue+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);dailyDateValue=d.toISOString().slice(0,10);$('dailyDate').value=dailyDateValue;dailyLoadDay()}
 function dailyCanDiscard(){if(dailySaving)return false;return !dailyHasChanges()||confirm('저장하지 않은 변경 사항이 있습니다. 저장하지 않고 이동할까요?')}
 function dailyApplyLocalCode(){if(dailySaving)return;const id=$('dailyEmployeeSelect').value,code=$('dailyEmployeeCode').value;
  if(!id)return alert('직원을 선택하세요.');if(code==='휴'||code==='연')return alert('휴무·연차는 휴무 관리에서 변경하세요.');
  const leave=dailyDay.leaves.find(x=>x.employee_id===id&&(x.leave_type==='full'||x.leave_type==='annual'));
  if(leave)return alert('전일 휴무·연차인 직원은 휴무 관리에서 변경하세요.');
  const current=dailyDay.shifts.find(x=>x.employee_id===id)?.code||'';
  if(current===code)return;
  dailyRemember();const person=dailyDay.people.find(x=>x.id===id);
  dailyDay.shifts=dailyDay.shifts.filter(x=>x.employee_id!==id);
  if(code)dailyDay.shifts.push({employee_id:id,name:person?.name||'',code});
  if(code===(dailyOriginalCodes[id]||''))delete dailyPendingCodes[id];else dailyPendingCodes[id]=code;
  dailyUnsavedStatus();dailyPaint();dailyChooseEmployee(id);
 }
 async function dailySaveAll(){if(dailySaving||!dailyHasChanges())return;
  dailySaving=true;$('dailyTemplateView').classList.add('saving');dailyUndoButtons();$('dailyStatus').textContent='저장 중…';
  const payload={date:dailyDateValue,template:dailyDirty?dailyTemplate:null,overrides:dailyDayDirty?dailyOverrides:null,codes:Object.entries(dailyPendingCodes).map(([employeeId,code])=>({employeeId,code}))};
  try{const res=await fetch('/api/daily-commit',{method:'PUT',credentials:'same-origin',headers:{'Content-Type':'application/json','X-Requested-With':'TemoraryAdmin'},body:JSON.stringify(payload)}),body=await res.json();
    if(!res.ok||!body.ok)throw Error(body.error||'저장 실패');
    dailyDirty=false;dailyDayDirty=false;dailyPendingCodes={};dailyOriginalCodes=Object.fromEntries(dailyDay.shifts.map(x=>[x.employee_id,x.code||'']));
    dailyHistoryClear();$('dailyStatus').textContent='저장 완료 · 월간 근무표에도 반영됨';
  }catch(e){$('dailyStatus').textContent='저장 실패 · 변경 사항 유지: '+e.message}
  finally{dailySaving=false;$('dailyTemplateView').classList.remove('saving');dailyUndoButtons()}
 }
 function dailyPrint(){// Build a separate print-only sheet: no editor handles, row numbers, or unsaved data loss.
  const w=dailyTemplate.widths.reduce((a,b)=>a+b,0),h=dailyTemplate.heights.reduce((a,b)=>a+b,0),scale=Math.min(1.02,716/w,1020/h);
  document.documentElement.style.setProperty('--daily-print-scale',String(Math.max(0.2,scale)));
  $('dailyPrintOnly').innerHTML='<table class="daily-grid">'+dailyTableHtml(false)+'</table>';
  window.print();
 }
 function dailyBeginInlineEdit(typed=null){
  if(dailySaving)return;
  const cell=dailyCell(dailySelected.r,dailySelected.c);
  if(cell.role&&cell.role!=='shared')return;
  const td=dailySheet.querySelector('td[data-r="'+cell.r+'"][data-c="'+cell.c+'"]');
  if(!td)return;
  const opened=td.querySelector('.daily-inline-input');
  if(opened){opened.focus({preventScroll:true});return}
  const scope=dailyEditing?'template':'date';
  const key=dailyKey(cell.r,cell.c);
  const original=scope==='template'?cell.text||'':Object.prototype.hasOwnProperty.call(dailyOverrides,key)?dailyOverrides[key]:cell.text||'';
  const input=document.createElement('input');input.type='text';input.className='daily-inline-input';input.maxLength=140;
  input.setAttribute('aria-label','선택 셀 내용 편집');
  input.value=typed===null?original:typed;
  td.replaceChildren(input);let finished=false;
  const finish=(save=true)=>{if(finished)return;finished=true;const value=input.value;
    if(save&&value!==original)dailySetText(value);else dailyPaint();
    dailySheet.focus({preventScroll:true})
  };
  input.addEventListener('keydown',e=>{
    if(e.key==='Escape'){e.preventDefault();e.stopPropagation();finish(false);return}
    if(e.key==='Enter'||e.key==='Tab'){
      e.preventDefault();e.stopPropagation();
      const dr=e.key==='Enter'?(e.shiftKey?-1:1):0,dc=e.key==='Tab'?(e.shiftKey?-1:1):0;
      finish(true);
      const r=Math.max(0,Math.min(dailyTemplate.heights.length-1,cell.r+dr));
      const c=Math.max(0,Math.min(dailyTemplate.widths.length-1,cell.c+dc));
      dailySelect(r,c,false);
    }else e.stopPropagation()
  });
  input.addEventListener('blur',()=>finish(true));
  input.focus({preventScroll:true});
  if(typed===null)input.select();
}
 function dailyNavigateKeyboard(e){if(['INPUT','SELECT','BUTTON'].includes(document.activeElement.tagName))return;const dirs={ArrowUp:[-1,0],ArrowDown:[1,0],ArrowLeft:[0,-1],ArrowRight:[0,1],Enter:[1,0],Tab:[0,e.shiftKey?-1:1]};if(dirs[e.key]){e.preventDefault();const [dr,dc]=dirs[e.key],r=Math.max(0,Math.min(dailyTemplate.heights.length-1,dailySelected.r+dr)),c=Math.max(0,Math.min(dailyTemplate.widths.length-1,dailySelected.c+dc));dailySelect(r,c,e.shiftKey&&e.key.startsWith('Arrow'));const td=dailySheet.querySelector('td[data-r="'+dailyCell(r,c).r+'"][data-c="'+dailyCell(r,c).c+'"]');if(td)td.scrollIntoView({block:'nearest',inline:'nearest'});return}
  if((e.key==='F2'||e.key.length===1&&!e.ctrlKey&&!e.metaKey&&!e.altKey)&&(!dailyCell(dailySelected.r,dailySelected.c).role||dailyCell(dailySelected.r,dailySelected.c).role==='shared')){e.preventDefault();dailyBeginInlineEdit(e.key==='F2'?null:e.key)}
  if((e.key==='Backspace'||e.key==='Delete')&&(!dailyCell(dailySelected.r,dailySelected.c).role||dailyCell(dailySelected.r,dailySelected.c).role==='shared')){e.preventDefault();dailySetText('')}
 }
 function dailyPointerStart(e){if(!dailyEditing||dailySaving)return;const grip=e.target.closest('.col-resize,.row-resize'),td=e.target.closest('td[data-r]'),headCol=e.target.closest('th[data-col]'),headRow=e.target.closest('th[data-row]');if(!grip&&!td&&!headCol&&!headRow)return;
  e.preventDefault();e.stopPropagation();dailySheet.focus({preventScroll:true});const multi=e.ctrlKey||e.metaKey;
  if(grip){const isCol=grip.classList.contains('col-resize'),axis=isCol?'col':'row',index=+grip.dataset[axis==='col'?'col':'row'];
   if(e.altKey){dailySelectHeader(axis,index,false,multi)}
   dailyPointer={id:e.pointerId,mode:'resize',axis,index,start:isCol?e.clientX:e.clientY,size:isCol?dailyTemplate.widths[index]:dailyTemplate.heights[index]};
  }else if(headCol||headRow){const axis=headCol?'col':'row',index=+(headCol||headRow).dataset[axis];dailySelectHeader(axis,index,e.shiftKey,multi);dailyPointer={id:e.pointerId,mode:'header',axis,locked:multi}}
  else{const r=+td.dataset.r,c=+td.dataset.c;
   if(e.altKey){const axis=e.shiftKey?'row':'col',index=axis==='col'?c:r;dailySelectHeader(axis,index,false,multi);dailyPointer={id:e.pointerId,mode:'header',axis,locked:multi}}
   else{dailySelect(r,c,e.shiftKey,multi);dailyPointer={id:e.pointerId,mode:'select',locked:multi}}
  }
  try{dailySheet.setPointerCapture(e.pointerId)}catch(_){}
 }
 function dailyPointerMove(e){if(!dailyPointer||dailyPointer.id!==e.pointerId)return;e.preventDefault();const p=dailyPointer;
  if(p.mode==='resize'){
   const offset=(p.axis==='col'?e.clientX:e.clientY)-p.start,newSize=Math.max(p.axis==='col'?42:25,Math.min(p.axis==='col'?650:170,Math.round(p.size+offset)));
   if(p.axis==='col'){for(const i of dailyResizeTargets('col',p.index)){const col=dailySheet.querySelector('colgroup col:nth-child('+(i+2)+')');if(col)col.style.width=newSize+'px'}}
   else{for(const i of dailyResizeTargets('row',p.index)){const tr=dailySheet.querySelector('tbody tr:nth-child('+(i+1)+')');if(tr)tr.style.height=newSize+'px'}}
   return;
  }
  if(p.locked)return;const hit=document.elementFromPoint(e.clientX,e.clientY);
  if(p.mode==='header'){const head=hit?.closest(p.axis==='col'?'th[data-col]':'th[data-row]');if(head&&dailySheet.contains(head))dailySelectHeader(p.axis,+head.dataset[p.axis],true,false);return}
  const target=hit?.closest('td[data-r]');if(target&&dailySheet.contains(target))dailySelect(+target.dataset.r,+target.dataset.c,true,false)
 }
 function dailyPointerEnd(e){if(!dailyPointer||dailyPointer.id!==e.pointerId)return;e.preventDefault();const p=dailyPointer;dailyPointer=null;
  try{dailySheet.releasePointerCapture(e.pointerId)}catch(_){}
  if(p.mode==='resize')dailyResize(p.axis,p.index,p.size+(p.axis==='col'?e.clientX:e.clientY)-p.start)
 }
 $('dailySheetTable').addEventListener('pointerdown',dailyPointerStart);
 $('dailySheetTable').addEventListener('pointermove',dailyPointerMove);
 $('dailySheetTable').addEventListener('pointerup',dailyPointerEnd);
 $('dailySheetTable').addEventListener('pointercancel',e=>{if(dailyPointer&&dailyPointer.id===e.pointerId){dailyPointer=null;dailyPaint()}});
 document.addEventListener('keydown',e=>{if($('dailyTemplateView').hidden)return;
  const key=e.key.toLowerCase(),cmd=e.ctrlKey||e.metaKey;
  if(cmd&&!e.altKey&&(key==='z'||key==='y')){e.preventDefault();if(!dailySaving){if(key==='y'||e.shiftKey)dailyRedo();else dailyUndo()}}
  if(cmd&&!e.altKey&&key==='s'){e.preventDefault();dailySaveAll()}
 });
 $('dailySheetTable').addEventListener('keydown',dailyNavigateKeyboard);
 $('dailySheetTable').addEventListener('dblclick',e=>{const td=e.target.closest('td[data-r]');if(td){dailySelect(+td.dataset.r,+td.dataset.c,false);dailyBeginInlineEdit()}});
 $('dailySheetTable').addEventListener('click',e=>{
  if(dailyEditing)return;
  const name=e.target.closest('button[data-person]');if(name){dailyChooseEmployee(name.dataset.person);return}
  const td=e.target.closest('td[data-r]');if(!td||e.target.closest('.daily-inline-input'))return;
  const alreadySelected=!dailyEditing&&dailySelected.r===+td.dataset.r&&dailySelected.c===+td.dataset.c;
  dailySelect(+td.dataset.r,+td.dataset.c,false);
  if(alreadySelected)dailyBeginInlineEdit();else dailySheet.focus({preventScroll:true});
 });
 $('dailyPrev').addEventListener('click',()=>dailyDateShift(-1));$('dailyNext').addEventListener('click',()=>dailyDateShift(1));
 $('dailyDate').addEventListener('change',e=>{const target=e.target.value;if(!target)return;if(!dailyCanDiscard()){e.target.value=dailyDateValue;return}dailyDiscardOnDateChange();dailyDateValue=target;dailyLoadDay()});
 $('dailyToggleEdit').addEventListener('click',()=>{dailyEditing=!dailyEditing;dailyResizeArmed=false;dailyRange=null;dailyMarkedCells.clear();dailyChosenCols.clear();dailyChosenRows.clear();dailyPaint();dailySheet.focus({preventScroll:true})});
 $('dailyPrint').addEventListener('click',dailyPrint);
 $('dailyRole').addEventListener('change',e=>dailySetRole(e.target.value));
 $('dailyFontSize').addEventListener('change',e=>dailySetStyle('fontSize',Math.max(9,Math.min(42,+e.target.value||13))));
 $('dailyBold').addEventListener('change',e=>dailySetStyle('bold',e.target.checked));
 $('dailyAlign').addEventListener('click',()=>{const cell=dailyCell(dailySelected.r,dailySelected.c),next={left:'center',center:'right',right:'left'}[cell.align||'center']||'left';dailySetStyle('align',next)});
 $('dailyBorderToggle').addEventListener('click',()=>{const panel=$('dailyBorderPanel');panel.hidden=!panel.hidden;$('dailyBorderToggle').setAttribute('aria-expanded',String(!panel.hidden))});
 $('dailyBorderPanel').addEventListener('click',e=>{const btn=e.target.closest('button[data-border-action]');if(!btn)return;dailyApplyBorder(btn.dataset.borderAction);$('dailyBorderPanel').hidden=true;$('dailyBorderToggle').setAttribute('aria-expanded','false')});
 document.addEventListener('pointerdown',e=>{if(!e.target.closest('#dailyBorderPicker')){$('dailyBorderPanel').hidden=true;$('dailyBorderToggle').setAttribute('aria-expanded','false')}});
 $('dailyColWidth').addEventListener('change',e=>dailyResize('col',dailySelected.c,+e.target.value));
 $('dailyRowHeight').addEventListener('change',e=>dailyResize('row',dailySelected.r,+e.target.value));
 $('dailyAddRow').addEventListener('click',()=>dailyChangeDimension('row',true));$('dailyRemoveRow').addEventListener('click',()=>dailyChangeDimension('row',false));
 $('dailyAddCol').addEventListener('click',()=>dailyChangeDimension('col',true));$('dailyRemoveCol').addEventListener('click',()=>dailyChangeDimension('col',false));
 $('dailyMerge').addEventListener('click',dailyMerge);$('dailySplit').addEventListener('click',dailySplit);$('dailyEqualizeRows').addEventListener('click',dailyEqualizeRows);
 $('dailyUndo').addEventListener('click',dailyUndo);$('dailyRedo').addEventListener('click',dailyRedo);
 $('dailySaveAll').addEventListener('click',dailySaveAll);
 $('dailyEmployeeSearch').addEventListener('input',dailyRefreshEmployeeSuggestions);
 $('dailyEmployeeSearch').addEventListener('compositionend',dailyRefreshEmployeeSuggestions);
 $('dailyEmployeeSearch').addEventListener('keydown',e=>{const list=$('dailyEmployeeSuggestions'),choices=[...list.querySelectorAll('button[data-employee-id]')];if(e.key==='Escape'){dailyCloseEmployeeSuggestions();return}if(!list.hidden&&choices.length&&(e.key==='ArrowDown'||e.key==='Enter')){e.preventDefault();if(choices.length===1&&e.key==='Enter')dailyChooseEmployee(choices[0].dataset.employeeId);else choices[0].focus({preventScroll:true})}});
 $('dailyEmployeeSuggestions').addEventListener('click',e=>{const btn=e.target.closest('button[data-employee-id]');if(btn)dailyChooseEmployee(btn.dataset.employeeId)});
 $('dailyEmployeeSuggestions').addEventListener('keydown',e=>{const btn=e.target.closest('button[data-employee-id]');if(!btn)return;const buttons=[...$('dailyEmployeeSuggestions').querySelectorAll('button[data-employee-id]')],i=buttons.indexOf(btn);if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();buttons[Math.max(0,Math.min(buttons.length-1,i+(e.key==='ArrowDown'?1:-1)))].focus({preventScroll:true})}else if(e.key==='Escape'){dailyCloseEmployeeSuggestions();$('dailyEmployeeSearch').focus({preventScroll:true})}});
 document.addEventListener('pointerdown',e=>{if(!e.target.closest('.daily-employee-lookup'))dailyCloseEmployeeSuggestions()});
 $('dailyApplyCode').addEventListener('click',dailyApplyLocalCode);
 window.addEventListener('beforeunload',e=>{if(dailyHasChanges()){e.preventDefault();e.returnValue=''}});
 $('navDaily').addEventListener('click',()=>switchView('daily'));

 paintHeaders();paintPeople();draw();loadEmployees().then(()=>loadScheduleMonth());
})();
</script>
</body></html>
`;

// 2026-11 sample: explicit administrator-only one-time test import.
const NOV_SAMPLE_ROWS = [["홍길동","202",["B4","C3","B1","휴","휴","C3","C3","B1","휴","C3","B1","C3","C3","휴","휴","C3","C3","B1","휴","C3","C3","B1","휴","B1","C3","휴","C3","B1","휴","휴"]],["고길동","214.5",["C3","C1","휴","C3","C3","C1","휴","휴","C3","C3","C3","휴","휴","C3","C3","C1","휴","C3","C3","C1","휴","휴","C3","C3","C1","휴","C3","C3","C3","C1"]],["김하린","183.5",["G1","G1","C5","C1","휴","G1","C5","C3","휴","휴","G1","C3","C3","휴","휴","G1","C3","휴","휴","G1","C3","C5","C1","휴","G1","C5","휴","휴","연","G1"]],["이서윤","192",["B5","G1","B5","휴","휴","G1","B5","G1","B5","휴","휴","G1","B5","휴","G1","B5","G1","B5","휴","휴","G1","B5","휴","휴","G1","B5","G1","B5","휴","휴"]],["박도현","175.5",["H4","D1","휴","A8","A7","D5","휴","H4","H4","D5","휴","H4","H4","H4","D1","휴","휴","H4","D5","H6","휴","휴","휴","H4","M1","M1","휴","연","A7","D5"]],["최유진","169",["B1","H6","휴","휴","B5","H6","H6","휴","휴","휴","휴","B1","B5","H6","휴","휴","B1","B5","H6","휴","B1","B5","H6","휴","휴","B5","B5","H4","H4","휴"]],["정민준","181.5",["휴","휴","휴","B1","B1","B1","휴","휴","휴","B5","B5","B1","B1","휴","B1","B5","B5","B1","H4","휴","H6","H6","M1","M1","휴","휴","B5","B1","B5","H6"]],["강나은","169.5",["B5","B5","B1","휴","H4","D5","휴","휴","H6","M1","M1","휴","휴","B5","M1","휴","휴","H4","D5","B1","휴","휴","연","H4","D5","연","연","H4","D5","H4"]],["조시우","188",["A7","A8","A7","휴","휴","A8","A7","A8","A7","휴","휴","휴","A7","A8","A7","휴","휴","A8","A7","휴","A8","A7","휴","연","A8","A7","연","A8","A7","A8"]],["윤다희","160",["휴","A7","A7","휴","휴","휴","A7","A7","A7","휴","A8","A7","A7","A7","휴","A7","A8","A7","휴","A7","A7","휴","A7","A7","A7","A7","휴","휴","휴","A7"]],["장하준","171.5",["휴","H4","D5","H6","M1","휴","휴","H6","H6","H4","D1","휴","H4","D1","휴","H6","H6","M1","휴","휴","H4","D5","휴","휴","H6","H6","연","H6","H4","D5"]],["임수아","167.5",["D1","휴","H8","H8","H4","D1","휴","휴","H4","H6","휴","H8","H8","H4","B1","휴","휴","H8","H4","D1","휴","휴","H8","H4","H6","휴","H8","H6","H6","연"]],["한재윤","179.5",["휴","휴","휴","휴","휴","휴","휴","휴","C5","C5","D5","D1","휴","D5","D5","D5","D1","D1","휴","C5","D5","C1","D5","D1","연","연","D1","D5","C5","D5"]],["오지민","160.5",["J3","J3","H6","휴","휴","J3","J3","H4","휴","J3","J3","H4","휴","J3","H4","D1","휴","H6","H4","D1","휴","휴","H4","D1","D1","휴","H4","D1","휴","휴"]],["서도윤","177",["H4","D1","B5","B1","휴","H4","D4","B1","D1","휴","H6","M1","M1","M1","휴","휴","B5","D1","A7","H4","D1","휴","휴","H6","H4","D4","A7","휴","휴","휴"]],["신예린","167",["C5","D1","휴","D4","A7","D1","휴","휴","D1","A7","H6","휴","휴","H4","H6","H6","H4","휴","H6","M1","M1","M1","휴","휴","D5","D1","A7","A7","휴","휴"]],["권태오","177",["H6","H4","H6","휴","H6","H6","휴","H6","H8","H6","휴","H6","H6","휴","휴","H8","H8","H4","휴","H8","휴","휴","H6","H8","H8","H6","휴","휴","H8","H8"]],["황서연","198.5",["휴","B5","D5","B1","휴","휴","H4","D5","D1","휴","H4","D5","휴","H4","D5","B1","휴","H4","D5","B5","휴","H4","D5","B5","휴","휴","H4","M1","M1","M1"]],["안지호","167",["M1","휴","휴","H6","H6","휴","H6","H8","M1","휴","휴","B1","D5","B1","휴","휴","H6","H4","M1","휴","휴","H6","H4","H6","휴","B5","H6","H4","D5","휴"]],["송다은","158",["휴","휴","H4","D5","B5","휴","B5","D1","H4","D1","휴","휴","휴","H4","H6","M1","M1","휴","휴","H6","H6","H4","휴","B5","B1","휴","M1","연","연","H6"]],["류민재","166.5",["H6","H6","휴","휴","H8","M1","M1","M1","휴","휴","휴","H6","H6","H6","H8","휴","휴","H6","H8","휴","H8","H8","H4","휴","연","H8","H6","H8","H6","연"]],["전하영","148.5",["휴","휴","H4","H4","D1","휴","H4","D5","H4","D1","휴","휴","H4","D1","D1","휴","휴","휴","휴","H4","D5","D1","휴","연","C5","C1","연","H4","D5","D1"]],["홍지안","155.5",["D1","휴","휴","휴","D4","A7","H4","휴","휴","B1","B5","A7","H4","휴","휴","휴","B5","D1","B1","휴","B1","D5","B1","휴","D5","D1","H4","연","연","B1"]],["문서준","168",["휴","휴","H4","D5","C1","휴","C1","C5","H4","D1","휴","H4","D1","휴","H4","D5","D1","휴","휴","H4","D5","D1","B1","휴","휴","H4","D5","D1","휴","H4"]],["백소율","152",["휴","휴","휴","H4","D5","H4","D1","휴","휴","H4","D1","C5","D1","C1","휴","휴","H4","D1","C1","D5","C1","휴","휴","휴","H4","D5","C5","D1","연","연"]],["남유찬","196",["휴","휴","A8","A7","A8","A7","휴","휴","A7","A8","A7","휴","A8","A7","A8","A7","휴","A7","A8","A7","휴","A8","A7","A8","A7","휴","A7","휴","휴","A8"]],["양채원","196",["A8","A7","A8","A7","휴","휴","A8","A7","A8","A7","휴","휴","휴","A7","A7","A8","A7","휴","휴","A7","A8","A7","휴","A8","A7","휴","연","A8","A7","A8"]],["고민서","168",["A8","M1","M1","M1","휴","휴","A7","A8","A7","휴","A7","A8","A7","휴","휴","A7","A8","A7","휴","휴","A8","A7","휴","A7","A8","A7","휴","휴","연","연"]],["유승현","161.5",["D1","휴","휴","H4","H4","D5","D1","휴","휴","H4","D5","D1","휴","휴","C1","H4","D5","휴","휴","H4","H4","H4","D5","휴","휴","H4","D5","C1","D1","연"]],["노가은","168.5",["D1","B1","휴","H4","D5","B1","휴","휴","D5","B5","B1","휴","휴","D1","D5","H4","휴","D5","B1","휴","휴","휴","B5","D1","연","D5","B1","D1","B1","연"]],["차은우","186",["휴","C5","D1","D5","D1","휴","휴","D5","D1","휴","H4","D5","D5","휴","H4","D5","D1","휴","D1","D1","휴","D5","D1","C5","D1","휴","D1","휴","D5","C1"]],["배지윤","173.5",["휴","D5","D1","D1","휴","B5","D5","B1","휴","휴","B5","D5","D1","휴","휴","H4","D1","휴","B5","D5","휴","휴","A8","D5","휴","H4","D1","휴","연","B5"]],["탁현우","186",["D5","D5","D1","휴","휴","B5","D5","D1","휴","D5","D1","휴","휴","D5","B5","D1","휴","휴","D5","B5","D1","휴","D5","D1","휴","휴","휴","B5","B5","D1"]]];
async function importNovemberSample(db){
  await ensureScheduleSchema(db);
  await ensureEmployeeAccountSchema(db);
  // Keep existing active test account IDs and their login codes.
  const accounts=[];
  for(const name of ['홍길동','고길동']){
    const found=await db.prepare('SELECT id FROM employees WHERE name=? AND active=1 ORDER BY created_at DESC,id DESC LIMIT 1').bind(name).first();
    accounts.push(found?.id||null);
  }
  const newPeople=[];
  for(let i=0;i<NOV_SAMPLE_ROWS.length;i++){
    if(accounts[i])continue;
    const name=NOV_SAMPLE_ROWS[i][0],id='staff-demo-202611-'+String(i+1).padStart(2,'0');
    accounts[i]=id;
    newPeople.push(db.prepare('INSERT INTO employees(id,name,active) VALUES(?,?,1) ON CONFLICT(id) DO UPDATE SET name=excluded.name,active=1').bind(id,name));
    newPeople.push(db.prepare('INSERT OR IGNORE INTO employee_login_accounts(employee_id,login_id) VALUES (?,?)').bind(id,name));
  }
  if(newPeople.length)await db.batch(newPeople);
  const preservedRows=await db.prepare("SELECT employee_id,work_date FROM schedule_leaves WHERE work_date>='2026-11-01' AND work_date<'2026-12-01'").all();
  const preserved=new Set((preservedRows.results||[]).map(r=>r.employee_id+'|'+r.work_date));
  const shifts=[],leaves=[],hours=[];
  for(let i=0;i<NOV_SAMPLE_ROWS.length;i++){
    const [name,hour,codes]=NOV_SAMPLE_ROWS[i],id=accounts[i];
    hours.push(db.prepare(`INSERT INTO schedule_monthly_hours(employee_id,month,hours) VALUES(?,'2026-11',?)
      ON CONFLICT(employee_id,month) DO UPDATE SET hours=excluded.hours`).bind(id,hour));
    for(let j=0;j<codes.length;j++){
      const date='2026-11-'+String(j+1).padStart(2,'0'),code=codes[j];
      // Do not overwrite an existing full/partial leave or cancellation.
      if(preserved.has(id+'|'+date))continue;
      shifts.push([id,date,code]);
      if(code==='휴'||code==='연')leaves.push([id,date,code==='휴'?'full':'annual']);
    }
  }
  // Respect D1's <=100 bound parameters per SQL statement: 30 triplets each.
  function packedInserts(entries,table,cols,update){
    const output=[];
    for(let i=0;i<entries.length;i+=30){const part=entries.slice(i,i+30);
      const question=part.map(()=>'(?,?,?)').join(',');
      output.push(db.prepare('INSERT INTO '+table+'('+cols+') VALUES '+question+' '+update).bind(...part.flat()));
    }
    return output;
  }
  const shiftSql=packedInserts(shifts,'schedule_shifts','employee_id,work_date,code','ON CONFLICT(employee_id,work_date) DO UPDATE SET code=excluded.code');
  const leaveSql=packedInserts(leaves,'schedule_leaves','employee_id,work_date,leave_type',"ON CONFLICT(employee_id,work_date) DO UPDATE SET leave_type=excluded.leave_type,status='active'");
  // Database operations are chunked into small transactions; retrying is idempotent.
  for(const part of [hours,...Array.from({length:Math.ceil(shiftSql.length/12)},(_,n)=>shiftSql.slice(n*12,n*12+12)),...Array.from({length:Math.ceil(leaveSql.length/12)},(_,n)=>leaveSql.slice(n*12,n*12+12))]){
    if(Array.isArray(part)){if(part.length)await db.batch(part)}
    else await part.run();
  }
  return {ok:true,staff:NOV_SAMPLE_ROWS.length,cells:shifts.length,fullDay:leaves.length};
}

// v13: D1 employee CRUD; all routes are protected by a Worker secret during testing.
function json(data, status=200){
  return Response.json(data, {status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
function safeEqual(a,b){
  const x=new TextEncoder().encode(String(a)),y=new TextEncoder().encode(String(b));
  let difference=x.length^y.length;
  for(let i=0;i<Math.max(x.length,y.length);i++)difference|=(x[i]||0)^(y[i]||0);
  return difference===0;
}
function cleanText(value,max){
  if(typeof value!=='string'||value.length>max)return null;
  return value;
}
async function readJson(request){
  if(!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))throw new Error('JSON 본문만 허용됩니다.');
  if(Number(request.headers.get('content-length')||'0')>4096)throw new Error('요청이 너무 큽니다.');
  const text=await request.text();
  if(text.length>4096)throw new Error('요청이 너무 큽니다.');
  const body=JSON.parse(text);
  if(!body||typeof body!=='object'||Array.isArray(body))throw new Error('잘못된 요청 본문입니다.');
  return body;
}

// Employee login account is created alongside the staff row. In the current trial,
// an administrator may issue/reissue a separate access code for each employee.
// Passkeys are NOT implemented by this temporary access-code system.
let employeeAccountSchemaReady = false;
async function ensureEmployeeAccountSchema(db){
  if(employeeAccountSchemaReady)return;
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS employee_login_accounts (
      employee_id TEXT PRIMARY KEY NOT NULL, login_id TEXT NOT NULL UNIQUE,
      salt TEXT, secret_hash TEXT, version INTEGER NOT NULL DEFAULT 0,
      failed_count INTEGER NOT NULL DEFAULT 0, lock_until INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(employee_id) REFERENCES employees(id))`),
    db.prepare(`CREATE TABLE IF NOT EXISTS employee_login_sessions (
      token_hash TEXT PRIMARY KEY NOT NULL, employee_id TEXT NOT NULL,
      version INTEGER NOT NULL, expires_at INTEGER NOT NULL)`)
  ]);
  employeeAccountSchemaReady = true;
}
async function unusedEmployeeLoginId(db,name,employeeId){
  for(let suffix=1;suffix<1000;suffix++){
    const candidate=suffix===1?name:name+'-'+suffix;
    const row=await db.prepare('SELECT employee_id FROM employee_login_accounts WHERE login_id=?').bind(candidate).first();
    if(!row||row.employee_id===employeeId)return candidate;
  }
  throw Error('로그인 ID를 생성할 수 없습니다.');
}
async function ensureEmployeeLoginRows(db){
  await ensureEmployeeAccountSchema(db);
  const missing=await db.prepare(`SELECT e.id,e.name FROM employees e
    LEFT JOIN employee_login_accounts a ON e.id=a.employee_id
    WHERE e.active=1 AND a.employee_id IS NULL ORDER BY e.created_at,e.id`).all();
  for(const p of missing.results||[]){
    const loginId=await unusedEmployeeLoginId(db,p.name,p.id);
    await db.prepare('INSERT OR IGNORE INTO employee_login_accounts (employee_id,login_id) VALUES (?,?)').bind(p.id,loginId).run();
  }
}
function newStaffAccessCode(){
  const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789', bytes=crypto.getRandomValues(new Uint8Array(10));
  return Array.from(bytes,x=>alphabet[x&31]).join('');
}
function newStaffSalt(){
  const bytes=crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
async function issueStaffAccess(db,employeeId){
  await ensureEmployeeLoginRows(db);
  const account=await db.prepare('SELECT login_id FROM employee_login_accounts WHERE employee_id=?').bind(employeeId).first();
  if(!account)throw Error('직원 로그인 계정이 없습니다.');
  const code=newStaffAccessCode(),salt=newStaffSalt(),hash=await sha256(salt+'|'+code);
  await db.batch([
    db.prepare(`UPDATE employee_login_accounts
      SET salt=?,secret_hash=?,version=version+1,failed_count=0,lock_until=0
      WHERE employee_id=?`).bind(salt,hash,employeeId),
    db.prepare('DELETE FROM employee_login_sessions WHERE employee_id=?').bind(employeeId)
  ]);
  return {loginId:account.login_id,accessCode:code};
}

// This development-only build imports the 2026-11 sample automatically once,
// when an authenticated administrator loads the employee list. Do not carry
// this sample bootstrap into the future production account.
let novemberSampleSeedPending=null;
async function ensureNovemberSampleSeed(db){
  await ensureScheduleSchema(db);
  const marker=await db.prepare("SELECT value FROM app_settings WHERE key='dev_sample_202611_seeded_v1'").first();
  if(marker?.value==='1')return;
  if(!novemberSampleSeedPending){
    novemberSampleSeedPending=(async()=>{
      const again=await db.prepare("SELECT value FROM app_settings WHERE key='dev_sample_202611_seeded_v1'").first();
      if(again?.value==='1')return;
      await importNovemberSample(db);
      await db.prepare("INSERT INTO app_settings(key,value) VALUES('dev_sample_202611_seeded_v1','1') ON CONFLICT(key) DO UPDATE SET value='1'").run();
    })().finally(()=>{novemberSampleSeedPending=null});
  }
  await novemberSampleSeedPending;
}

async function employeeApi(request,env,url){
  const method=request.method,path=url.pathname,db=env.DB;
  if(!db)return json({ok:false,stage:'binding_missing'},503);
  if(method!=='GET'){
    if(request.headers.get('origin')&&request.headers.get('origin')!==url.origin)return json({ok:false,error:'Origin not allowed'},403);
    if(request.headers.get('X-Requested-With')!=='TemoraryAdmin')return json({ok:false,error:'Missing request header'},403);
  }
  if(path==='/api/export/month.xlsx'&&method==='GET'){
    const month=url.searchParams.get('month');
    if(!validMonth(month))return json({ok:false,error:'잘못된 월입니다.'},400);
    const data=await monthDataForExport(db,month);
    const blob=makeExcelXlsx(data);
    return new Response(blob,{status:200,headers:{
      'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition':'attachment; filename="roster_'+month+'.xlsx"',
      'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'
    }});
  }
  if(path==='/api/export/complete.xlsx'&&method==='GET'){
    const month=url.searchParams.get('month');
    if(!validMonth(month))return json({ok:false,error:'잘못된 월입니다.'},400);
    try{
      const [data,daily]=await Promise.all([monthDataForExport(db,month),makeDailyMonthXlsx(db,month)]);
      const bytes=combineScheduleXlsx(makeExcelXlsx(data),daily);
      return new Response(bytes,{headers:{'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','Content-Disposition':'attachment; filename="schedule_'+month+'.xlsx"','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
    }catch(e){console.error('Combined XLSX export',e);return json({ok:false,error:e.message||'통합 근무표 생성 실패'},500)}
  }
  if(path==='/api/export/daily-month.xlsx'&&method==='GET'){
    const month=url.searchParams.get('month');
    if(!validMonth(month))return json({ok:false,error:'잘못된 월입니다.'},400);
    try{
      const bytes=await makeDailyMonthXlsx(db,month);
      return new Response(bytes,{headers:{'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','Content-Disposition':'attachment; filename="daily_'+month+'.xlsx"','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
    }catch(e){console.error('Daily XLSX export',e);return json({ok:false,error:e.message||'일일표 생성 실패'},500)}
  }
  if(path==='/api/daily-commit'&&method==='PUT'){
    await ensureScheduleSchema(db);
    await db.prepare('CREATE TABLE IF NOT EXISTS daily_template_settings (id INTEGER PRIMARY KEY CHECK(id=1), template_json TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)').run();
    await db.prepare('CREATE TABLE IF NOT EXISTS daily_day_contents (work_date TEXT PRIMARY KEY NOT NULL,content_json TEXT NOT NULL,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)').run();
    const raw=await request.text();if(raw.length>160000)return json({ok:false,error:'저장 데이터가 너무 큽니다.'},413);
    let b;try{b=JSON.parse(raw)}catch(_){return json({ok:false,error:'잘못된 저장 데이터입니다.'},400)}
    if(!validDate(b?.date)||!Array.isArray(b.codes)||b.codes.length>200)return json({ok:false,error:'날짜나 근무 배정 형식이 올바르지 않습니다.'},400);
    if(b.template!=null){const t=b.template;
      if(!t||!Array.isArray(t.widths)||!Array.isArray(t.heights)||!Array.isArray(t.cells)||t.widths.length<3||t.widths.length>20||t.heights.length<4||t.heights.length>70||t.cells.length>1400||!t.widths.every(n=>Number.isInteger(n)&&n>=42&&n<=650)||!t.heights.every(n=>Number.isInteger(n)&&n>=25&&n<=170))return json({ok:false,error:'양식 크기가 올바르지 않습니다.'},400);
      const seen=new Set();for(const x of t.cells){if(!x||![x.r,x.c,x.rs,x.cs].every(Number.isInteger)||x.r<0||x.c<0||x.rs<1||x.cs<1||x.r+x.rs>t.heights.length||x.c+x.cs>t.widths.length||typeof x.text!=='string'||x.text.length>140||(x.borders!==undefined&&(!x.borders||typeof x.borders!=='object'||Array.isArray(x.borders)||Object.entries(x.borders).some(([k,v])=>!['t','r','b','l'].includes(k)||!Number.isInteger(v)||v<0||v>3)))||(x.fontSize!==undefined&&(!Number.isInteger(x.fontSize)||x.fontSize<9||x.fontSize>42))||(x.bold!==undefined&&typeof x.bold!=='boolean')||(x.role!==undefined&&!['','date','code','time','names','leave','annual','shared'].includes(x.role)))return json({ok:false,error:'잘못된 셀 데이터입니다.'},400);
        for(let r=x.r;r<x.r+x.rs;r++)for(let c=x.c;c<x.c+x.cs;c++){const key=r+','+c;if(seen.has(key))return json({ok:false,error:'셀 병합 범위가 겹칩니다.'},400);seen.add(key)}}
    }
    if(b.overrides!=null&&(!b.overrides||typeof b.overrides!=='object'||Array.isArray(b.overrides)||Object.keys(b.overrides).length>400||Object.entries(b.overrides).some(([key,value])=>!/^(0|[1-9][0-9]*),(0|[1-9][0-9]*)$/.test(key)||typeof value!=='string'||value.length>140)))return json({ok:false,error:'기입 내용이 올바르지 않습니다.'},400);
    const existing=new Set();for(const x of b.codes){if(!x||typeof x.employeeId!=='string'||!x.employeeId||x.employeeId.length>130||existing.has(x.employeeId)||typeof x.code!=='string'||x.code.length>12||(x.code&&!/^[A-Z0-9가-힣-]{1,12}$/.test(x.code))||x.code==='휴'||x.code==='연')return json({ok:false,error:'잘못된 근무 배정입니다.'},400);existing.add(x.employeeId)}
    if(b.codes.length){
      const members=await db.prepare('SELECT id FROM employees WHERE active=1').all(),allowed=new Set((members.results||[]).map(x=>x.id));
      const catalog=await db.prepare('SELECT code FROM schedule_codes').all(),codes=new Set((catalog.results||[]).map(x=>x.code));
      const leaves=await db.prepare("SELECT employee_id FROM schedule_leaves WHERE work_date=? AND status='active' AND leave_type IN ('full','annual')").bind(b.date).all(),blocked=new Set((leaves.results||[]).map(x=>x.employee_id));
      for(const x of b.codes){if(!allowed.has(x.employeeId)||blocked.has(x.employeeId)||(x.code&&!codes.has(x.code)))return json({ok:false,error:'직원·코드 또는 휴무 상태를 확인하세요.'},409)}
    }
    const stmts=[];
    if(b.template!=null)stmts.push(db.prepare("INSERT INTO daily_template_settings(id,template_json,updated_at) VALUES(1,?,CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET template_json=excluded.template_json,updated_at=CURRENT_TIMESTAMP").bind(JSON.stringify(b.template)));
    if(b.overrides!=null)stmts.push(db.prepare('INSERT INTO daily_day_contents(work_date,content_json,updated_at) VALUES(?,?,CURRENT_TIMESTAMP) ON CONFLICT(work_date) DO UPDATE SET content_json=excluded.content_json,updated_at=CURRENT_TIMESTAMP').bind(b.date,JSON.stringify(b.overrides)));
    for(const x of b.codes){if(x.code)stmts.push(db.prepare('INSERT INTO schedule_shifts(employee_id,work_date,code) VALUES(?,?,?) ON CONFLICT(employee_id,work_date) DO UPDATE SET code=excluded.code').bind(x.employeeId,b.date,x.code));else stmts.push(db.prepare('DELETE FROM schedule_shifts WHERE employee_id=? AND work_date=?').bind(x.employeeId,b.date))}
    if(stmts.length)await db.batch(stmts);
    return json({ok:true,saved:stmts.length});
  }

  if(path==='/api/daily-template'){
    await db.prepare('CREATE TABLE IF NOT EXISTS daily_template_settings (id INTEGER PRIMARY KEY CHECK(id=1), template_json TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)').run();
    if(method==='GET'){
      const row=await db.prepare('SELECT template_json FROM daily_template_settings WHERE id=1').first();
      if(!row)return json({ok:true,template:null});
      try{const template=JSON.parse(row.template_json);const a1=Array.isArray(template?.cells)?template.cells.find(x=>x.r===0&&x.c===0):null;if(a1?.text==='일간 근무 현황'){a1.text='';await db.prepare('UPDATE daily_template_settings SET template_json=?,updated_at=CURRENT_TIMESTAMP WHERE id=1').bind(JSON.stringify(template)).run()}return json({ok:true,template})}catch(_){return json({ok:false,error:'저장된 양식 데이터 형식 오류'},500)}
    }
    if(method==='PUT'){
      const raw=await request.text();
      if(raw.length>120000)return json({ok:false,error:'양식 크기가 너무 큽니다.'},413);
      let body;try{body=JSON.parse(raw)}catch(_){return json({ok:false,error:'잘못된 데이터입니다.'},400)}
      const t=body?.template;
      if(!t||!Array.isArray(t.widths)||!Array.isArray(t.heights)||!Array.isArray(t.cells)||t.widths.length<3||t.widths.length>20||t.heights.length<4||t.heights.length>70||t.cells.length>1400||!t.widths.every(n=>Number.isInteger(n)&&n>=42&&n<=650)||!t.heights.every(n=>Number.isInteger(n)&&n>=25&&n<=170))return json({ok:false,error:'양식 크기가 올바르지 않습니다.'},400);
      const occupied=new Set();
      for(const cell of t.cells){
        if(!cell||![cell.r,cell.c,cell.rs,cell.cs].every(Number.isInteger)||cell.r<0||cell.c<0||cell.rs<1||cell.cs<1||cell.r+cell.rs>t.heights.length||cell.c+cell.cs>t.widths.length||typeof cell.text!=='string'||cell.text.length>140||(cell.borders!==undefined&&(!cell.borders||typeof cell.borders!=='object'||Array.isArray(cell.borders)||Object.entries(cell.borders).some(([k,v])=>!['t','r','b','l'].includes(k)||!Number.isInteger(v)||v<0||v>3)))||(cell.fontSize!==undefined&&(!Number.isInteger(cell.fontSize)||cell.fontSize<9||cell.fontSize>42))||(cell.bold!==undefined&&typeof cell.bold!=='boolean')||(cell.align!==undefined&&!['left','center','right'].includes(cell.align))||(cell.role!==undefined&&!['','date','code','time','names','leave','annual','shared'].includes(cell.role))) return json({ok:false,error:'잘못된 셀 데이터입니다.'},400);
        for(let r=cell.r;r<cell.r+cell.rs;r++)for(let c=cell.c;c<cell.c+cell.cs;c++){const key=r+','+c;if(occupied.has(key))return json({ok:false,error:'셀 병합 범위가 겹칩니다.'},400);occupied.add(key)}
      }
      await db.prepare("INSERT INTO daily_template_settings(id,template_json,updated_at) VALUES(1,?,CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET template_json=excluded.template_json,updated_at=CURRENT_TIMESTAMP").bind(JSON.stringify(t)).run();
      return json({ok:true});
    }
    return json({ok:false,error:'지원하지 않는 요청입니다.'},405);
  }


  if(path==='/api/daily-day'){
    await ensureScheduleSchema(db);
    await db.prepare('CREATE TABLE IF NOT EXISTS daily_day_contents (work_date TEXT PRIMARY KEY NOT NULL,content_json TEXT NOT NULL,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)').run();
    if(method==='GET'){
      const date=url.searchParams.get('date');if(!validDate(date))return json({ok:false,error:'잘못된 날짜입니다.'},400);
      const result=await db.batch([
        db.prepare('SELECT id,name FROM employees WHERE active=1 ORDER BY name,id'),
        db.prepare('SELECT s.employee_id,e.name,s.code FROM schedule_shifts s JOIN employees e ON s.employee_id=e.id AND e.active=1 WHERE s.work_date=? ORDER BY e.name,e.id').bind(date),
        db.prepare('SELECT code,start_time AS start,end_time AS end FROM schedule_codes ORDER BY start_time,code'),
        db.prepare("SELECT l.employee_id,e.name,l.leave_type FROM schedule_leaves l JOIN employees e ON e.id=l.employee_id AND e.active=1 WHERE l.work_date=? AND l.status='active' ORDER BY e.name,e.id").bind(date),
        db.prepare('SELECT content_json FROM daily_day_contents WHERE work_date=?').bind(date)
      ]);
      let overrides={};try{overrides=JSON.parse(result[4].results?.[0]?.content_json||'{}')}catch(_){}
      return json({ok:true,date,people:result[0].results||[],shifts:result[1].results||[],catalog:result[2].results||[],leaves:result[3].results||[],overrides});
    }
    if(method==='PUT'){
      const raw=await request.text();if(raw.length>30000)return json({ok:false,error:'입력 내용이 너무 큽니다.'},413);
      let b;try{b=JSON.parse(raw)}catch(_){return json({ok:false,error:'잘못된 내용입니다.'},400)}
      if(!validDate(b?.date)||!b.overrides||typeof b.overrides!=='object'||Array.isArray(b.overrides)||Object.keys(b.overrides).length>400||Object.entries(b.overrides).some(([key,value])=>!/^(0|[1-9][0-9]*),(0|[1-9][0-9]*)$/.test(key)||typeof value!=='string'||value.length>140))return json({ok:false,error:'내용이 올바르지 않습니다.'},400);
      await db.prepare('INSERT INTO daily_day_contents(work_date,content_json,updated_at) VALUES(?,?,CURRENT_TIMESTAMP) ON CONFLICT(work_date) DO UPDATE SET content_json=excluded.content_json,updated_at=CURRENT_TIMESTAMP').bind(b.date,JSON.stringify(b.overrides)).run();
      return json({ok:true});
    }
    return json({ok:false,error:'지원하지 않는 요청입니다.'},405);
  }

  if(path.startsWith('/api/schedule/'))return scheduleApi(request,env,url);
  if(path==='/api/d1-check'){
    if(method!=='GET')return json({ok:false,error:'Method Not Allowed'},405);
    const row=await db.prepare('SELECT COUNT(*) AS total FROM employees').first();
    return json({ok:true,database:'connected',testRows:row?.total??0});
  }
  if(path==='/api/employees' && method==='GET'){
    await ensureNovemberSampleSeed(db);
    await ensureEmployeeLoginRows(db);
    const result=await db.prepare(`SELECT e.id, e.name, a.login_id AS loginId,
      COALESCE(m.custom_1, '') AS custom1, COALESCE(m.custom_2, '') AS custom2
      FROM employees e LEFT JOIN employee_meta m ON m.employee_id = e.id
      LEFT JOIN employee_login_accounts a ON a.employee_id=e.id
      WHERE e.active = 1 ORDER BY e.created_at, e.id`).all();
    const row=await db.prepare("SELECT value FROM app_settings WHERE key = 'staff_headers'").first();
    let headers=['',''];
    if(row){try{const h=JSON.parse(row.value);if(Array.isArray(h)&&h.length===2)headers=h.map(v=>String(v||'').slice(0,30))}catch(_){}}
    return json({ok:true,people:result.results||[],headers});
  }
  if(path==='/api/employees'&&method==='POST'){
    const body=await readJson(request),name=cleanText(body.name,40)?.trim();
    if(!name)return json({ok:false,error:'이름은 1~40자여야 합니다.'},400);
    await ensureEmployeeLoginRows(db);
    const id='staff-'+crypto.randomUUID(),loginId=await unusedEmployeeLoginId(db,name,id);
    await db.batch([
      db.prepare('INSERT INTO employees (id,name,active) VALUES (?,?,1)').bind(id,name),
      db.prepare('INSERT INTO employee_login_accounts(employee_id,login_id) VALUES(?,?)').bind(id,loginId)
    ]);
    const credential=await issueStaffAccess(db,id);
    return json({ok:true,id,name,...credential},201);
  }
  if(path==='/api/staff-headers'&&method==='PUT'){
    const body=await readJson(request),h=body.headers;
    if(!Array.isArray(h)||h.length!==2||h.some(x=>cleanText(x,30)===null))return json({ok:false,error:'열 제목은 각각 30자 이내여야 합니다.'},400);
    await db.prepare("INSERT INTO app_settings (key,value) VALUES ('staff_headers',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value")
      .bind(JSON.stringify(h)).run();
    return json({ok:true,headers:h});
  }
  if(path.startsWith('/api/employees/')&&path.endsWith('/access-code')&&method==='POST'){
    const id=path.slice('/api/employees/'.length,-'/access-code'.length);
    if(!/^staff-[a-zA-Z0-9-]+$/.test(id)&&!/^demo-[a-zA-Z0-9-]+$/.test(id))return json({ok:false,error:'직원 ID 오류'},400);
    const person=await db.prepare('SELECT id FROM employees WHERE id=? AND active=1').bind(id).first();
    if(!person)return json({ok:false,error:'직원이 없습니다.'},404);
    const result=await issueStaffAccess(db,id);
    return json({ok:true,...result});
  }
  if(path.startsWith('/api/employees/')&&(method==='PATCH'||method==='DELETE')){
    let id;
    try{id=decodeURIComponent(path.slice('/api/employees/'.length))}catch(_){return json({ok:false,error:'Invalid employee id'},400)}
    if(!id||id.length>130||id.includes('/'))return json({ok:false,error:'Invalid employee id'},400);
    const person=await db.prepare('SELECT id FROM employees WHERE id=? AND active=1').bind(id).first();
    if(!person)return json({ok:false,error:'활성 직원이 없습니다.'},404);
    if(method==='DELETE'){
      await db.prepare('UPDATE employees SET active=0 WHERE id=? AND active=1').bind(id).run();
      await ensureEmployeeAccountSchema(db);
      await db.prepare('DELETE FROM employee_login_sessions WHERE employee_id=?').bind(id).run();
      return json({ok:true,id,archived:true});
    }
    const body=await readJson(request),keys=Object.keys(body);
    if(keys.length!==1||!['name','custom1','custom2'].includes(keys[0]))return json({ok:false,error:'하나의 필드만 수정할 수 있습니다.'},400);
    const field=keys[0],value=cleanText(body[field],field==='name'?40:80);
    if(value===null||(field==='name'&&!value.trim()))return json({ok:false,error:'입력값이 잘못되었습니다.'},400);
    if(field==='name'){
      await db.prepare('UPDATE employees SET name=? WHERE id=? AND active=1').bind(value.trim(),id).run();
    }else if(field==='custom1'){
      await db.prepare(`INSERT INTO employee_meta (employee_id,custom_1,custom_2) VALUES (?,?,'')
        ON CONFLICT(employee_id) DO UPDATE SET custom_1=excluded.custom_1`).bind(id,value).run();
    }else{
      await db.prepare(`INSERT INTO employee_meta (employee_id,custom_1,custom_2) VALUES (?,'',?)
        ON CONFLICT(employee_id) DO UPDATE SET custom_2=excluded.custom_2`).bind(id,value).run();
    }
    return json({ok:true,id,field,value});
  }
  return json({ok:false,error:'Not Found'},404);
}


// v14: idempotent D1 schedule setup on the first authenticated schedule request.
// Existing employee tables and records are left intact.
const DEFAULT_CODES = [
 ['A7','am','05:30','14:00'],['B1','am','06:00','14:00'],['C1','am','06:30','14:00'],['D1','am','07:00','14:00'],['D2','am','07:00','14:30'],
 ['A8','long','05:30','19:00'],['B5','long','06:00','19:30'],['C3','long','06:30','19:00'],['C5','long','06:30','20:00'],['D4','long','07:00','19:30'],['D5','long','07:00','20:00'],
 ['G1','pm','11:00','20:00'],['H4','pm','12:30','21:00'],['H6','pm','12:30','22:00'],['H7','pm','12:30','22:30'],['H8','pm','12:30','23:00'],['J3','pm','13:00','23:00'],['M1','night','22:00','07:00']
];
let scheduleSchemaReady=false;
async function ensureScheduleSchema(db){
  if(scheduleSchemaReady)return;
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS schedule_codes (code TEXT PRIMARY KEY NOT NULL,type TEXT NOT NULL CHECK(type IN ('am','long','pm','night')),start_time TEXT NOT NULL DEFAULT '',end_time TEXT NOT NULL DEFAULT '',hours REAL,color TEXT NOT NULL DEFAULT '')`),
    db.prepare(`CREATE TABLE IF NOT EXISTS schedule_shifts (employee_id TEXT NOT NULL,work_date TEXT NOT NULL,code TEXT NOT NULL,PRIMARY KEY(employee_id,work_date),FOREIGN KEY(employee_id) REFERENCES employees(id))`),
    db.prepare(`CREATE TABLE IF NOT EXISTS schedule_leaves (employee_id TEXT NOT NULL,work_date TEXT NOT NULL,leave_type TEXT NOT NULL CHECK(leave_type IN ('full','am','pm','annual')),status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','cancelled')),PRIMARY KEY(employee_id,work_date),FOREIGN KEY(employee_id) REFERENCES employees(id))`),
    db.prepare("CREATE TABLE IF NOT EXISTS schedule_deadlines (month TEXT PRIMARY KEY NOT NULL,deadline TEXT NOT NULL DEFAULT '')"),
    db.prepare('CREATE TABLE IF NOT EXISTS schedule_leave_limits (month TEXT PRIMARY KEY NOT NULL,max_applicants INTEGER)'),
    db.prepare('CREATE TABLE IF NOT EXISTS schedule_monthly_hours (employee_id TEXT NOT NULL,month TEXT NOT NULL,hours TEXT NOT NULL,PRIMARY KEY(employee_id,month),FOREIGN KEY(employee_id) REFERENCES employees(id))'),
    db.prepare('CREATE INDEX IF NOT EXISTS idx_schedule_shifts_month ON schedule_shifts(work_date)'),
    db.prepare('CREATE INDEX IF NOT EXISTS idx_schedule_shifts_code ON schedule_shifts(code)'),
    db.prepare('CREATE INDEX IF NOT EXISTS idx_schedule_leaves_month ON schedule_leaves(work_date)')
  ]);
  // Older v20.14 builds may already have max_applicants in schedule_deadlines.
  // Preserve any existing caps, but never make loading codes depend on ALTER TABLE.
  try {
    const cols=(await db.prepare('PRAGMA table_info(schedule_deadlines)').all()).results||[];
    if(cols.some(x=>x.name==='max_applicants'))
      await db.prepare('INSERT OR IGNORE INTO schedule_leave_limits(month,max_applicants) SELECT month,max_applicants FROM schedule_deadlines WHERE max_applicants IS NOT NULL').run();
  } catch(e) { console.warn('leave capacity legacy copy skipped',String(e)); }
  // Migrate existing v19 D1 tables in place; all existing leave records remain active.
  const columns=(await db.prepare('PRAGMA table_info(schedule_leaves)').all()).results||[];
  if(!columns.some(col=>col.name==='status')){
    try{
      await db.prepare("ALTER TABLE schedule_leaves ADD COLUMN status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','cancelled'))").run();
    }catch(error){
      // A concurrent Worker instance may have added it already.
      const latest=(await db.prepare('PRAGMA table_info(schedule_leaves)').all()).results||[];
      if(!latest.some(col=>col.name==='status'))throw error;
    }
  }
  const seed=await db.prepare("SELECT value FROM app_settings WHERE key='schedule_codes_seeded_v14'").first();
  if(!seed){
    await db.batch([
      ...DEFAULT_CODES.map(c=>db.prepare("INSERT OR IGNORE INTO schedule_codes(code,type,start_time,end_time,hours,color) VALUES(?,?,?,?,NULL,'')").bind(...c)),
      db.prepare("INSERT OR IGNORE INTO app_settings(key,value) VALUES('schedule_codes_seeded_v14','1')")
    ]);
  }
  scheduleSchemaReady=true;
}
let publishSchemaReady=false;
async function ensurePublishedSchema(db){
  if(publishSchemaReady)return;
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS schedule_publications (
       month TEXT PRIMARY KEY NOT NULL, published_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS schedule_published_shifts (
       employee_id TEXT NOT NULL, work_date TEXT NOT NULL,code TEXT NOT NULL,
       start_time TEXT NOT NULL DEFAULT '',end_time TEXT NOT NULL DEFAULT '',
       PRIMARY KEY(employee_id,work_date))`),
    db.prepare('CREATE INDEX IF NOT EXISTS idx_published_date ON schedule_published_shifts(work_date)')
  ]);
  publishSchemaReady=true;
}
function validMonth(m){return typeof m==='string'&&/^[0-9]{4}-(0[1-9]|1[0-2])$/.test(m)}
function validDate(d){
  if(typeof d!=='string'||!/^[0-9]{4}-(0[1-9]|1[0-2])-[0-3][0-9]$/.test(d))return false;
  const check=new Date(d+'T00:00:00Z');return !Number.isNaN(check.valueOf())&&check.toISOString().slice(0,10)===d;
}
function validHex(c){return c===''||typeof c==='string'&&/^#[0-9a-fA-F]{6}$/.test(c)}
function validTime(t){return t===''||typeof t==='string'&&/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(t)}
async function activeEmployee(db,id){
  if(typeof id!=='string'||!id||id.length>130)return false;
  return !!(await db.prepare('SELECT id FROM employees WHERE id=? AND active=1').bind(id).first());
}
async function scheduleApi(request,env,url){
  const db=env.DB,method=request.method,path=url.pathname;
  await ensureScheduleSchema(db);
  await ensurePublishedSchema(db);
  if(path==='/api/schedule/publish'&&method==='POST'){
    const body=await readJson(request),month=body.month;
    if(!validMonth(month))return json({ok:false,error:'잘못된 월입니다.'},400);
    const [yr,mo]=month.split('-').map(Number),start=month+'-01',end=new Date(Date.UTC(yr,mo,1)).toISOString().slice(0,7)+'-01';
    await db.batch([
      db.prepare('DELETE FROM schedule_published_shifts WHERE work_date>=? AND work_date<?').bind(start,end),
      db.prepare(`INSERT INTO schedule_published_shifts(employee_id,work_date,code,start_time,end_time)
        SELECT s.employee_id,s.work_date,s.code,COALESCE(c.start_time,''),COALESCE(c.end_time,'')
        FROM schedule_shifts s JOIN employees e ON e.id=s.employee_id AND e.active=1
        LEFT JOIN schedule_codes c ON c.code=s.code
        WHERE s.work_date>=? AND s.work_date<?`).bind(start,end),
      db.prepare(`INSERT INTO schedule_publications(month,published_at) VALUES(?,CURRENT_TIMESTAMP)
        ON CONFLICT(month) DO UPDATE SET published_at=CURRENT_TIMESTAMP`).bind(month)
    ]);
    const c=await db.prepare('SELECT COUNT(*) AS n FROM schedule_published_shifts WHERE work_date>=? AND work_date<?').bind(start,end).first();
    return json({ok:true,month,count:c?.n||0});
  }
  if(path==='/api/schedule/state'&&method==='GET'){
    const month=url.searchParams.get('month');
    if(!validMonth(month))return json({ok:false,error:'잘못된 월입니다.'},400);
    const [year,m]=month.split('-').map(Number);
    const end=new Date(Date.UTC(year,m,1)).toISOString().slice(0,7)+'-01';
    const start=month+'-01';
    const results=await db.batch([
      db.prepare('SELECT code,type,start_time AS start,end_time AS end,hours,color FROM schedule_codes ORDER BY code'),
      db.prepare('SELECT employee_id,work_date,code FROM schedule_shifts WHERE work_date>=? AND work_date<?').bind(start,end),
      db.prepare('SELECT employee_id,work_date,leave_type,status FROM schedule_leaves WHERE work_date>=? AND work_date<?').bind(start,end),
      db.prepare('SELECT employee_id,hours FROM schedule_monthly_hours WHERE month=?').bind(month),
      db.prepare('SELECT deadline FROM schedule_deadlines WHERE month=?').bind(month),
      db.prepare("SELECT value FROM app_settings WHERE key='schedule_special_colors'"),
      db.prepare("SELECT value FROM app_settings WHERE key='roster_label'"),
      db.prepare('SELECT published_at FROM schedule_publications WHERE month=?').bind(month)
    ]);
    let quota=null;try{quota=await db.prepare('SELECT max_applicants FROM schedule_leave_limits WHERE month=?').bind(month).first()}catch(e){console.warn('leave capacity read failed',String(e))}
    let colors={rest:'#ffebed',annual:'#e7f0ff'};
    if(results[5].results?.[0]){
      try{const value=JSON.parse(results[5].results[0].value);
      if(validHex(value.rest)&&validHex(value.annual)&&value.rest&&value.annual)colors={rest:value.rest,annual:value.annual};}catch(_){ }
    }
    return json({ok:true,month,catalog:(results[0].results||[]).map(c=>({code:c.code,type:c.type,start:c.start,end:c.end,hours:c.hours??'',color:c.color||''})),shifts:results[1].results||[],leaves:results[2].results||[],hours:results[3].results||[],deadline:results[4].results?.[0]?.deadline||'',maxApplicants:quota?.max_applicants??null,colors,rosterLabel:results[6].results?.[0]?.value||'',publishedAt:results[7].results?.[0]?.published_at||''});
  }
  if(path==='/api/schedule/shift'&&method==='PUT'){
    const b=await readJson(request);
    if(!validDate(b.date)||!await activeEmployee(db,b.employeeId)||typeof b.code!=='string'||b.code.length>12||b.code!==''&&!/^[A-Z0-9가-힣-]{1,12}$/.test(b.code))return json({ok:false,error:'잘못된 근무 배정입니다.'},400);
    // Full-day leave and annual leave are owned by schedule_leaves, not the shift editor.
    if(b.code==='휴'||b.code==='연')return json({ok:false,error:'휴무·연차는 휴무 관리에서만 등록할 수 있습니다.'},409);
    const existingLeave=await db.prepare('SELECT leave_type,status FROM schedule_leaves WHERE employee_id=? AND work_date=?').bind(b.employeeId,b.date).first();
    if(existingLeave?.status!=='cancelled'&&(existingLeave?.leave_type==='full'||existingLeave?.leave_type==='annual'))return json({ok:false,error:'전일 휴무·연차로 지정된 날짜는 휴무 관리에서만 변경할 수 있습니다.'},409);
    if(b.code)await db.prepare('INSERT INTO schedule_shifts(employee_id,work_date,code) VALUES(?,?,?) ON CONFLICT(employee_id,work_date) DO UPDATE SET code=excluded.code').bind(b.employeeId,b.date,b.code).run();
    else await db.prepare('DELETE FROM schedule_shifts WHERE employee_id=? AND work_date=?').bind(b.employeeId,b.date).run();
    return json({ok:true});
  }
  // Cancel/restore keeps the row so historical and future staff leave requests stay traceable.
  if(path==='/api/schedule/leave'&&method==='PUT'){
    const b=await readJson(request);
    const action=b.action||'set';
    if(!validDate(b.date)||!await activeEmployee(db,b.employeeId)||!['set','cancel','restore'].includes(action)||
      (action==='set'&&!['full','am','pm','annual'].includes(b.type)))return json({ok:false,error:'잘못된 휴무 요청입니다.'},400);
    const old=await db.prepare('SELECT leave_type,status FROM schedule_leaves WHERE employee_id=? AND work_date=?').bind(b.employeeId,b.date).first();
    const oldMarker=old?.status!=='cancelled'?(old?.leave_type==='full'?'휴':old?.leave_type==='annual'?'연':''):'';
    if(action==='cancel'){
      if(!old)return json({ok:false,error:'취소할 휴무 기록이 없습니다.'},404);
      if(old.status==='cancelled')return json({ok:true,status:'cancelled'});
      const stmts=[db.prepare("UPDATE schedule_leaves SET status='cancelled' WHERE employee_id=? AND work_date=?").bind(b.employeeId,b.date)];
      if(oldMarker)stmts.push(db.prepare('DELETE FROM schedule_shifts WHERE employee_id=? AND work_date=? AND code=?').bind(b.employeeId,b.date,oldMarker));
      await db.batch(stmts);
      return json({ok:true,status:'cancelled'});
    }
    if(action==='restore'){
      if(!old)return json({ok:false,error:'복구할 휴무 기록이 없습니다.'},404);
      if(old.status!=='cancelled')return json({ok:true,status:'active'});
      const marker=old.leave_type==='full'?'휴':old.leave_type==='annual'?'연':'';
      if(marker){
        const shift=await db.prepare('SELECT code FROM schedule_shifts WHERE employee_id=? AND work_date=?').bind(b.employeeId,b.date).first();
        if(shift&&shift.code!==marker)return json({ok:false,error:'해당 날짜에 다른 근무 코드가 배정되어 있습니다. 근무표에서 해당 코드를 비운 뒤 복구하세요.'},409);
      }
      const stmts=[db.prepare("UPDATE schedule_leaves SET status='active' WHERE employee_id=? AND work_date=?").bind(b.employeeId,b.date)];
      if(marker)stmts.push(db.prepare('INSERT INTO schedule_shifts(employee_id,work_date,code) VALUES(?,?,?) ON CONFLICT(employee_id,work_date) DO UPDATE SET code=excluded.code').bind(b.employeeId,b.date,marker));
      await db.batch(stmts);
      return json({ok:true,status:'active'});
    }
    // Setting/changing a leave is explicitly different from restoring a cancelled request.
    if(old?.status==='cancelled')return json({ok:false,error:'취소된 휴무는 먼저 복구하세요.'},409);
    const statements=[];
    statements.push(db.prepare("INSERT INTO schedule_leaves(employee_id,work_date,leave_type,status) VALUES(?,?,?,'active') ON CONFLICT(employee_id,work_date) DO UPDATE SET leave_type=excluded.leave_type,status='active'").bind(b.employeeId,b.date,b.type));
    if(oldMarker)statements.push(db.prepare('DELETE FROM schedule_shifts WHERE employee_id=? AND work_date=? AND code=?').bind(b.employeeId,b.date,oldMarker));
    if(b.type==='full'||b.type==='annual')statements.push(db.prepare('INSERT INTO schedule_shifts(employee_id,work_date,code) VALUES(?,?,?) ON CONFLICT(employee_id,work_date) DO UPDATE SET code=excluded.code').bind(b.employeeId,b.date,b.type==='full'?'휴':'연'));
    await db.batch(statements);
    return json({ok:true,status:'active'});
  }
  if(path==='/api/schedule/title'&&method==='PUT'){
    const b=await readJson(request);
    if(typeof b.label!=='string'||b.label.length>60||/[\x00-\x1F\x7F]/.test(b.label))return json({ok:false,error:'근무표 이름은 60자 이내의 텍스트여야 합니다.'},400);
    const label=b.label.trim();
    await db.prepare("INSERT INTO app_settings(key,value) VALUES('roster_label',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(label).run();
    return json({ok:true,label});
  }
  if(path==='/api/schedule/deadline'&&method==='PUT'){
    const b=await readJson(request);
    if(!validMonth(b.month)||!(b.deadline===''||validDate(b.deadline)))return json({ok:false,error:'잘못된 마감일입니다.'},400);
    await db.prepare('INSERT INTO schedule_deadlines(month,deadline) VALUES(?,?) ON CONFLICT(month) DO UPDATE SET deadline=excluded.deadline').bind(b.month,b.deadline).run();
    return json({ok:true});
  }
  if(path==='/api/schedule/leave-limit'&&method==='PUT'){
    const b=await readJson(request);
    if(!validMonth(b.month)||!(b.maxApplicants===null||Number.isInteger(b.maxApplicants)&&b.maxApplicants>=0&&b.maxApplicants<=999))return json({ok:false,error:'신청 제한 인원은 0~999명 또는 미설정이어야 합니다.'},400);
    await db.prepare('INSERT INTO schedule_leave_limits(month,max_applicants) VALUES(?,?) ON CONFLICT(month) DO UPDATE SET max_applicants=excluded.max_applicants').bind(b.month,b.maxApplicants).run();
    return json({ok:true,maxApplicants:b.maxApplicants});
  }
  if(path==='/api/schedule/hours'&&method==='PUT'){
    const b=await readJson(request);
    if(!validMonth(b.month)||!await activeEmployee(db,b.employeeId)||typeof b.hours!=='string'||b.hours.length>12||b.hours!==''&&(!Number.isFinite(Number(b.hours))||Number(b.hours)<0||Number(b.hours)>744))return json({ok:false,error:'월 근무시간은 0~744 사이여야 합니다.'},400);
    if(b.hours)await db.prepare('INSERT INTO schedule_monthly_hours(employee_id,month,hours) VALUES(?,?,?) ON CONFLICT(employee_id,month) DO UPDATE SET hours=excluded.hours').bind(b.employeeId,b.month,b.hours).run();
    else await db.prepare('DELETE FROM schedule_monthly_hours WHERE employee_id=? AND month=?').bind(b.employeeId,b.month).run();
    return json({ok:true});
  }
  if(path==='/api/schedule/colors'&&method==='PUT'){
    const b=await readJson(request);
    if(!validHex(b.rest)||!validHex(b.annual)||!b.rest||!b.annual)return json({ok:false,error:'잘못된 색상입니다.'},400);
    await db.prepare("INSERT INTO app_settings(key,value) VALUES('schedule_special_colors',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(JSON.stringify({rest:b.rest,annual:b.annual})).run();
    return json({ok:true});
  }
  if(path==='/api/schedule/code'&&method==='PUT'){
    const b=await readJson(request);
    if(typeof b.originalCode!=='string'||b.originalCode.length>12||typeof b.code!=='string'||!/^[A-Z0-9가-힣-]{1,12}$/.test(b.code)||['휴','연','-'].includes(b.code)||!['am','long','pm','night'].includes(b.type)||!validTime(b.start)||!validTime(b.end)||!validHex(b.color)||!(b.hours===''||typeof b.hours==='number'&&Number.isFinite(b.hours)&&b.hours>=0&&b.hours<=24))return json({ok:false,error:'잘못된 근무 코드 설정입니다.'},400);
    const h=b.hours===''?null:b.hours;
    if(!b.originalCode){
      await db.prepare('INSERT INTO schedule_codes(code,type,start_time,end_time,hours,color) VALUES(?,?,?,?,?,?)').bind(b.code,b.type,b.start,b.end,h,b.color).run();
    }else{
      const old=await db.prepare('SELECT code FROM schedule_codes WHERE code=?').bind(b.originalCode).first();
      if(!old)return json({ok:false,error:'기존 코드가 없습니다. 다시 불러오세요.'},404);
      if(b.originalCode===b.code){
        await db.prepare('UPDATE schedule_codes SET type=?,start_time=?,end_time=?,hours=?,color=? WHERE code=?').bind(b.type,b.start,b.end,h,b.color,b.code).run();
      }else{
        const found=await db.prepare('SELECT code FROM schedule_codes WHERE code=?').bind(b.code).first();
        if(found)return json({ok:false,error:'이미 있는 코드입니다.'},409);
        await db.batch([
          db.prepare('INSERT INTO schedule_codes(code,type,start_time,end_time,hours,color) VALUES(?,?,?,?,?,?)').bind(b.code,b.type,b.start,b.end,h,b.color),
          db.prepare('UPDATE schedule_shifts SET code=? WHERE code=?').bind(b.code,b.originalCode),
          db.prepare('DELETE FROM schedule_codes WHERE code=?').bind(b.originalCode)
        ]);
      }
    }
    return json({ok:true});
  }
  if(path==='/api/schedule/code'&&method==='DELETE'){
    const b=await readJson(request);
    if(typeof b.code!=='string'||b.code.length>12)return json({ok:false,error:'코드가 잘못되었습니다.'},400);
    const used=await db.prepare('SELECT COUNT(*) AS total FROM schedule_shifts WHERE code=?').bind(b.code).first();
    if(used?.total)return json({ok:false,error:'다른 월의 근무표에도 배정된 코드입니다. 배정을 먼저 수정하세요.'},409);
    await db.prepare('DELETE FROM schedule_codes WHERE code=?').bind(b.code).run();
    return json({ok:true});
  }
  return json({ok:false,error:'Not Found'},404);
}


// v15: self-contained XLSX (Office Open XML), no CDN or external dependency.
async function monthDataForExport(db,month){
  await ensureScheduleSchema(db);
  const [year,m]=month.split('-').map(Number);
  const end=new Date(Date.UTC(year,m,1)).toISOString().slice(0,7)+'-01';
  const start=month+'-01';
  const r=await db.batch([
    db.prepare('SELECT id,name FROM employees WHERE active=1 ORDER BY created_at,id'),
    db.prepare('SELECT employee_id,work_date,code FROM schedule_shifts WHERE work_date>=? AND work_date<?').bind(start,end),
    db.prepare('SELECT employee_id,hours FROM schedule_monthly_hours WHERE month=?').bind(month),
    db.prepare('SELECT code,type,start_time AS start,end_time AS end,color FROM schedule_codes ORDER BY code'),
    db.prepare("SELECT value FROM app_settings WHERE key='schedule_special_colors'"),
    db.prepare("SELECT value FROM app_settings WHERE key='roster_label'"),
    db.prepare('SELECT employee_id,work_date,leave_type,status FROM schedule_leaves WHERE work_date>=? AND work_date<?').bind(start,end)
  ]);
  const staff=r[0].results||[];
  if(staff.length>250)throw new Error('엑셀 내보내기는 한 번에 최대 250명을 지원합니다.');
  const byKey=new Map((r[1].results||[]).map(o=>[o.employee_id+'|'+o.work_date,o.code]));
  for(const row of r[6].results||[]){
    if(row.status==='cancelled'&&(row.leave_type==='full'||row.leave_type==='annual')){
      const k=row.employee_id+'|'+row.work_date;
      if(byKey.get(k)===(row.leave_type==='full'?'휴':'연'))byKey.delete(k);
    }
  }
  for(const row of r[6].results||[]){
    if(row.status==='cancelled')continue;
    if(row.leave_type==='full')byKey.set(row.employee_id+'|'+row.work_date,'휴');
    if(row.leave_type==='annual')byKey.set(row.employee_id+'|'+row.work_date,'연');
  }
  const hourMap=new Map((r[2].results||[]).map(o=>[o.employee_id,o.hours]));
  const codes={am:[],long:[],pm:[]},codeColors={};
  for(const c of r[3].results||[]){
    const typ=c.type==='night'?'pm':c.type;
    if(codes[typ])codes[typ].push([c.code,c.start||'',c.end||'']);
    if(/^#[0-9a-fA-F]{6}$/.test(c.color||''))codeColors[c.code]=c.color;
  }
  let colors={rest:'#ffebed',annual:'#e7f0ff'};
  const savedColors=r[4].results?.[0]?.value;
  if(savedColors){try{const v=JSON.parse(savedColors);if(validHex(v.rest)&&v.rest&&validHex(v.annual)&&v.annual)colors=v}catch(_){}}
  const n=new Date(Date.UTC(year,m,0)).getUTCDate();
  return {year,month:m,title:excelRosterTitle(m,r[5].results?.[0]?.value||''),codes,colors,codeColors,
    people:staff.map(p=>({id:p.id,name:p.name,
      shifts:Array.from({length:n},(_,i)=>byKey.get(p.id+'|'+month+'-'+String(i+1).padStart(2,'0'))||''),
      hours:hourMap.has(p.id)?hourMap.get(p.id):''}))};
}
// Generic name: no assumed workplace or department, and no forced suffix if blank.
function excelRosterTitle(month,label){const name=String(label||'').trim();return month+'월 근무 현황'+(name?' ('+name+')':'');}
function excelXMLText(s){return String(s??'').replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));}
function excelCol(i){let a='';for(i++;i>0;i=Math.floor((i-1)/26))a=String.fromCharCode(65+(i-1)%26)+a;return a;}
function excelCell(col,row,value,style=2){
  const ref=excelCol(col)+row;
  if(value===null||value===undefined)return '';
  if(value==='')return '<c r="'+ref+'" s="'+style+'"/>';
  if(typeof value==='number'&&Number.isFinite(value))return '<c r="'+ref+'" s="'+style+'"><v>'+value+'</v></c>';
  return '<c r="'+ref+'" s="'+style+'" t="inlineStr"><is><t>'+excelXMLText(value)+'</t></is></c>';
}
function makeExcelXlsx(data){
  const days=new Date(Date.UTC(data.year,data.month,0)).getUTCDate();
  const people=data.people||[];const rowEnd=people.length+3;
  const hoursCol=2+days, hoursLetter=excelCol(hoursCol);
  const special=data.colors||{rest:'#E7BA52',annual:'#BA8C76'};
  const restColor=/^#[0-9a-fA-F]{6}$/.test(special.rest||'')?special.rest:'#E7BA52';
  const annualColor=/^#[0-9a-fA-F]{6}$/.test(special.annual||'')?special.annual:'#BA8C76';
  const codeColors=data.codeColors||{};
  const colorList=[...new Set(Object.values(codeColors).filter(v=>/^#[0-9a-fA-F]{6}$/.test(v)))];
  const extraStyles={};for(const [code,value] of Object.entries(codeColors)){
    const i=colorList.indexOf(value);if(i!==-1)extraStyles[code]=9+i;
  }
  const legendRow=rowEnd+2;
  const paper=['일','월','화','수','목','금','토'];
  const rows=[];
  rows.push('<row r="1" ht="29" customHeight="1">'+excelCell(0,1,data.title||data.month+'월 근무 현황',5)+'</row>');
  rows.push('<row r="2" ht="22" customHeight="1">'+
    [excelCell(0,2,'번호',1),excelCell(1,2,'성명',1),...Array.from({length:days},(_,i)=>excelCell(i+2,2,i+1,1)),excelCell(hoursCol,2,'근무시간',1)].join('')+'</row>');
  rows.push('<row r="3" ht="20" customHeight="1">'+
    [excelCell(0,3,'',1),excelCell(1,3,'',1),...Array.from({length:days},(_,i)=>excelCell(i+2,3,paper[new Date(Date.UTC(data.year,data.month-1,i+1)).getUTCDay()],1)),excelCell(hoursCol,3,'',1)].join('')+'</row>');
  people.forEach((p,i)=>{
    const r=i+4;const vals=[excelCell(0,r,i+1,6),excelCell(1,r,p.name,6)];
    for(let j=0;j<days;j++){
      const v=p.shifts?.[j]||'';
      vals.push(excelCell(j+2,r,v,v==='휴'?3:v==='연'?4:(extraStyles[v]??2)));
    }
    const h=p.hours===null||p.hours===undefined||p.hours===''?'':Number(p.hours);
    vals.push(excelCell(hoursCol,r,h,7));
    rows.push('<row r="'+r+'" ht="19" customHeight="1">'+vals.join('')+'</row>');
  });
  const merges=['A1:'+hoursLetter+'1'];
  let maxRow=legendRow;
  const groupSpecs=[{type:'am',label:'오 전',h:3,start:3,begin:5,end:10},
                    {type:'long',label:'롱',h:12,start:12,begin:14,end:19},
                    {type:'pm',label:'오 후',h:21,start:21,begin:23,end:28}];
  const headers=[];
  for(const g of groupSpecs){
    headers.push(excelCell(g.h,legendRow,g.label,8));
    merges.push(excelCol(g.h)+legendRow+':'+excelCol(g.end)+legendRow);
  }
  rows.push('<row r="'+legendRow+'" ht="20" customHeight="1">'+headers.join('')+'</row>');
  const maxEntries=Math.max(0,...groupSpecs.map(g=>(data.codes?.[g.type]||[]).length));
  for(let i=0;i<maxEntries;i++){
    const ri=legendRow+i+1;maxRow=ri;const values=[];
    for(const g of groupSpecs){
      const c=(data.codes?.[g.type]||[])[i];if(!c)continue;
      values.push(excelCell(g.start,ri,c[0],2));
      values.push(excelCell(g.begin,ri,(c[1]||'--:--')+'~'+(c[2]||'--:--'),2));
      merges.push(excelCol(g.begin)+ri+':'+excelCol(g.end)+ri);
    }
    rows.push('<row r="'+ri+'" ht="19" customHeight="1">'+values.join('')+'</row>');
  }
  maxRow=Math.max(maxRow,rowEnd);
  const dimension='A1:'+hoursLetter+maxRow;
  const worksheet='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
  '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+
  '<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><dimension ref="'+dimension+'"/>'+
  '<sheetViews><sheetView workbookViewId="0"/></sheetViews><sheetFormatPr defaultRowHeight="19"/>'+
  '<cols><col min="1" max="1" width="6" customWidth="1"/><col min="2" max="2" width="13" customWidth="1"/>'+
  '<col min="3" max="'+(hoursCol)+'" width="6" customWidth="1"/><col min="'+(hoursCol+1)+'" max="'+(hoursCol+1)+'" width="12" customWidth="1"/></cols>'+
  '<sheetData>'+rows.join('')+'</sheetData>'+
  '<mergeCells count="'+merges.length+'">'+merges.map(a=>'<mergeCell ref="'+a+'"/>').join('')+'</mergeCells>'+
  '<printOptions horizontalCentered="1"/><pageMargins left="0.16" right="0.16" top="0.24" bottom="0.24" header="0" footer="0"/>'+
  '<pageSetup paperSize="8" orientation="landscape" fitToWidth="1" fitToHeight="1"/>'+
  '</worksheet>';
  const styles='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+
    '<numFmts count="1"><numFmt numFmtId="164" formatCode="0.0"/></numFmts>'+
    '<fonts count="4"><font><sz val="9"/><name val="Malgun Gothic"/></font>'+ 
    '<font><b/><sz val="9"/><name val="Malgun Gothic"/></font>'+ 
    '<font><b/><sz val="16"/><name val="Malgun Gothic"/></font>'+
    '<font><b/><sz val="9"/><color rgb="FFFFFFFF"/><name val="Malgun Gothic"/></font></fonts>'+
    '<fills count="'+(7+colorList.length)+'"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>'+ 
    ['#C2A086','#F0ECE7',restColor,annualColor,'#F2E7DE',...colorList].map(h=>'<fill><patternFill patternType="solid"><fgColor rgb="FF'+h.slice(1)+'"/><bgColor indexed="64"/></patternFill></fill>').join('')+'</fills>'+
    '<borders count="2"><border/><border><left style="thin"><color rgb="FF7B756E"/></left><right style="thin"><color rgb="FF7B756E"/></right><top style="thin"><color rgb="FF7B756E"/></top><bottom style="thin"><color rgb="FF7B756E"/></bottom><diagonal/></border></borders>'+
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'+ 
    '<cellXfs count="'+(9+colorList.length)+'">'+
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'+ 
    '<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>'+ 
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>'+ 
    '<xf numFmtId="0" fontId="1" fillId="4" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>'+ 
    '<xf numFmtId="0" fontId="1" fillId="5" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>'+ 
    '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>'+ 
    '<xf numFmtId="0" fontId="0" fillId="3" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>'+ 
    '<xf numFmtId="164" fontId="0" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>'+ 
    '<xf numFmtId="0" fontId="1" fillId="6" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>'+ 
    colorList.map((hex,i)=>{
      const rgb=hex.slice(1).match(/../g).map(h=>parseInt(h,16));
      const luminosity=0.299*rgb[0]+0.587*rgb[1]+0.114*rgb[2];
      const fontId=luminosity<145?3:1;
      return '<xf numFmtId="0" fontId="'+fontId+'" fillId="'+(7+i)+'" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>';
    }).join('')+
    '</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
  const book='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'+
    '<sheets><sheet name="근무표" sheetId="1" r:id="rId1"/></sheets>'+ 
    '<definedNames><definedName name="_xlnm.Print_Area" localSheetId="0">\'근무표\'!$A$1:$'+hoursLetter+'$'+maxRow+'</definedName></definedNames></workbook>';
  const contents='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'+ 
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'+ 
    '<Default Extension="xml" ContentType="application/xml"/>'+ 
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'+ 
    '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'+ 
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>';
  const rels='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
  const bookRels='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';
  return zipExcelStore([['[Content_Types].xml',contents],['_rels/.rels',rels],['xl/workbook.xml',book],['xl/_rels/workbook.xml.rels',bookRels],['xl/styles.xml',styles],['xl/worksheets/sheet1.xml',worksheet]]);
}

async function makeDailyMonthXlsx(db,month){
  await ensureScheduleSchema(db);
  const [year,mo]=month.split('-').map(Number),count=new Date(Date.UTC(year,mo,0)).getUTCDate();
  await db.prepare('CREATE TABLE IF NOT EXISTS daily_template_settings (id INTEGER PRIMARY KEY CHECK(id=1), template_json TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)').run();
  await db.prepare('CREATE TABLE IF NOT EXISTS daily_day_contents (work_date TEXT PRIMARY KEY NOT NULL,content_json TEXT NOT NULL,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)').run();
  const templateRow=await db.prepare('SELECT template_json FROM daily_template_settings WHERE id=1').first();
  if(!templateRow)throw new Error('저장된 일일표 공통 양식이 없습니다. 일일 근무표에서 양식을 먼저 저장하세요.');
  let t;try{t=JSON.parse(templateRow.template_json)}catch(_){throw new Error('일일표 양식 데이터가 올바르지 않습니다.')}
  if(!Array.isArray(t.widths)||!Array.isArray(t.heights)||!Array.isArray(t.cells)||!t.widths.length||!t.heights.length||t.widths.length>100||t.heights.length>300)throw new Error('일일표 양식 크기가 올바르지 않습니다.');
  const start=month+'-01',end=new Date(Date.UTC(year,mo,1)).toISOString().slice(0,10);
  const result=await db.batch([
    db.prepare('SELECT s.employee_id,e.name,s.work_date,s.code FROM schedule_shifts s JOIN employees e ON e.id=s.employee_id AND e.active=1 WHERE s.work_date>=? AND s.work_date<? ORDER BY e.name,e.id').bind(start,end),
    db.prepare('SELECT code,start_time AS start,end_time AS end FROM schedule_codes ORDER BY start_time,code'),
    db.prepare("SELECT l.work_date,l.employee_id,e.name,l.leave_type FROM schedule_leaves l JOIN employees e ON e.id=l.employee_id AND e.active=1 WHERE l.work_date>=? AND l.work_date<? AND l.status='active' ORDER BY e.name,e.id").bind(start,end),
    db.prepare('SELECT work_date,content_json FROM daily_day_contents WHERE work_date>=? AND work_date<?').bind(start,end)
  ]);
  const shifts=new Map(),leaves=new Map(),overrides=new Map();
  for(const sh of result[0].results||[]){if(!shifts.has(sh.work_date))shifts.set(sh.work_date,[]);shifts.get(sh.work_date).push(sh)}
  for(const lv of result[2].results||[]){if(!leaves.has(lv.work_date))leaves.set(lv.work_date,[]);leaves.get(lv.work_date).push(lv)}
  for(const x of result[3].results||[]){try{overrides.set(x.work_date,JSON.parse(x.content_json)||{})}catch(_){}}
  const catalog=new Map((result[1].results||[]).map(c=>[c.code,c]));
  const roles={code:[],time:[],names:[]};
  for(const c of t.cells)if(roles[c.role])roles[c.role].push(c);
  for(const k of Object.keys(roles))roles[k].sort((a,b)=>a.r-b.r||a.c-b.c);
  const borders=['<border/>'],borderIds=new Map([['0,0,0,0',0]]),fonts=[],fontIds=new Map(),styles=[],styleIds=new Map();
  function cellStyle(cell){
    const b=cell.borders||{},v=['l','r','t','b'].map(k=>Number.isInteger(b[k])?Math.max(0,Math.min(3,b[k])):1),bk=v.join(',');
    if(!borderIds.has(bk)){
      const side=(n,k)=>'<'+k+(n?' style="'+['','thin','medium','thick'][n]+'"':'')+'>'+(n?'<color rgb="FF222222"/>':'')+'</'+k+'>';
      borderIds.set(bk,borders.length);borders.push('<border>'+side(v[0],'left')+side(v[1],'right')+side(v[2],'top')+side(v[3],'bottom')+'<diagonal/></border>');
    }
    const size=Math.max(9,Math.min(42,Number(cell.fontSize)||13)),fk=size+':'+(cell.bold?1:0);
    if(!fontIds.has(fk)){fontIds.set(fk,fonts.length);fonts.push('<font>'+(cell.bold?'<b/>':'')+'<sz val="'+size+'"/><name val="Malgun Gothic"/></font>')}
    const align=['left','right'].includes(cell.align)?cell.align:'center';const sk=fontIds.get(fk)+':'+borderIds.get(bk)+':'+align;
    if(!styleIds.has(sk)){styleIds.set(sk,styles.length);styles.push('<xf numFmtId="0" fontId="'+fontIds.get(fk)+'" fillId="0" borderId="'+borderIds.get(bk)+'" xfId="0" applyAlignment="1"><alignment horizontal="'+align+'" vertical="center" wrapText="1"/></xf>')}
    return styleIds.get(sk);
  }
  const sheets=[],files=[];
  for(let day=1;day<=count;day++){
    const date=month+'-'+String(day).padStart(2,'0'),dayShifts=shifts.get(date)||[],dayLeaves=leaves.get(date)||[],dayOverrides=overrides.get(date)||{};
    const grouped=new Map();
    for(const sh of dayShifts){if(!sh.code||sh.code==='휴'||sh.code==='연')continue;
      if(!grouped.has(sh.code))grouped.set(sh.code,{code:sh.code,info:catalog.get(sh.code),people:[]});
      grouped.get(sh.code).people.push(sh.name);
    }
    const groups=[...grouped.values()].sort((a,b)=>String(a.info?.start||'99:99').localeCompare(String(b.info?.start||'99:99'))||a.code.localeCompare(b.code,'ko'));
    const occupied=new Set(),merges=[],rows=[];
    for(let r=0;r<t.heights.length;r++){
      const cells=[];
      for(let c=0;c<t.widths.length;c++){
        const key=r+','+c;if(occupied.has(key))continue;
        const cell=t.cells.find(x=>r>=x.r&&r<x.r+x.rs&&c>=x.c&&c<x.c+x.cs)||{r,c,rs:1,cs:1,text:''};
        if(cell.r!==r||cell.c!==c){occupied.add(key);continue}
        const rs=Math.max(1,Math.min(t.heights.length-r,cell.rs||1)),cs=Math.max(1,Math.min(t.widths.length-c,cell.cs||1));
        for(let rr=r;rr<r+rs;rr++)for(let cc=c;cc<c+cs;cc++)if(rr!==r||cc!==c)occupied.add(rr+','+cc);
        if(rs>1||cs>1)merges.push(excelCol(c)+(r+1)+':'+excelCol(c+cs-1)+(r+rs));
        const role=cell.role||'',ix=roles[role]?.findIndex(x=>x.r===r&&x.c===c)??-1,g=ix>=0?groups[ix]:null;
        let value=Object.prototype.hasOwnProperty.call(dayOverrides,key)?dayOverrides[key]:cell.text||'';
        if(role==='date')value=date.replace(/-/g,'. ')+' ('+['일','월','화','수','목','금','토'][new Date(Date.UTC(year,mo-1,day)).getUTCDay()]+')';
        else if(role==='leave'||role==='annual')value=dayLeaves.filter(x=>x.leave_type===(role==='leave'?'full':'annual')).map(x=>x.name).join('\n');
        else if(role==='code')value=g?.code||'';
        else if(role==='time')value=g?(g.info?(g.info.start||'—')+' ~ '+(g.info.end||'—'):'시간 미설정'):'';
        else if(role==='names')value=g?g.people.join(' · '):'';
        cells.push('<c r="'+excelCol(c)+(r+1)+'" s="'+cellStyle(cell)+'" t="inlineStr"><is><t xml:space="preserve">'+excelXMLText(value)+'</t></is></c>');
      }
      rows.push('<row r="'+(r+1)+'" ht="'+Math.max(9,Number(t.heights[r])||37)*0.75+'" customHeight="1">'+cells.join('')+'</row>');
    }
    const cols=t.widths.map((w,i)=>'<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+Math.max(3,Number(w)||90)/7+'" customWidth="1"/>').join('');
    const xml='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><dimension ref="A1:'+excelCol(t.widths.length-1)+t.heights.length+'"/><sheetViews><sheetView workbookViewId="0" showGridLines="0"/></sheetViews><sheetFormatPr defaultRowHeight="20"/><cols>'+cols+'</cols><sheetData>'+rows.join('')+'</sheetData>'+(merges.length?'<mergeCells count="'+merges.length+'">'+merges.map(m=>'<mergeCell ref="'+m+'"/>').join('')+'</mergeCells>':'')+'<printOptions horizontalCentered="1"/><pageMargins left="0.2" right="0.2" top="0.3" bottom="0.3" header="0" footer="0"/><pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="1"/></worksheet>';
    sheets.push('<sheet name="'+String(day).padStart(2,'0')+'일" sheetId="'+day+'" r:id="rId'+day+'"/>');
    files.push(['xl/worksheets/sheet'+day+'.xml',xml]);
  }
  const stylesXml='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="'+fonts.length+'">'+fonts.join('')+'</fonts><fills count="1"><fill><patternFill patternType="none"/></fill></fills><borders count="'+borders.length+'">'+borders.join('')+'</borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="'+styles.length+'">'+styles.join('')+'</cellXfs></styleSheet>';
  const workbook='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'+sheets.join('')+'</sheets></workbook>';
  const rels='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+Array.from({length:count},(_,i)=>'<Relationship Id="rId'+(i+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet'+(i+1)+'.xml"/>').join('')+'<Relationship Id="rId'+(count+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';
  const types='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+Array.from({length:count},(_,i)=>'<Override PartName="/xl/worksheets/sheet'+(i+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('')+'</Types>';
  const rootRels='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
  return zipExcelStore([['[Content_Types].xml',types],['_rels/.rels',rootRels],['xl/workbook.xml',workbook],['xl/_rels/workbook.xml.rels',rels],['xl/styles.xml',stylesXml],...files]);
}

// Combine existing monthly and daily XLSX sheets while retaining each sheet's own styles.
function combineScheduleXlsx(monthBytes,dailyBytes){
  function entries(bytes){
    const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),dec=new TextDecoder(),out=new Map();
    let p=0;
    while(p+30<=bytes.length&&view.getUint32(p,true)===0x04034b50){
      if(view.getUint16(p+8,true)!==0)throw new Error('지원하지 않는 XLSX 압축 형식');
      const len=view.getUint32(p+18,true),nameLen=view.getUint16(p+26,true),extra=view.getUint16(p+28,true);
      const name=dec.decode(bytes.subarray(p+30,p+30+nameLen)),start=p+30+nameLen+extra;
      out.set(name,dec.decode(bytes.subarray(start,start+len)));p=start+len;
    }
    return out;
  }
  const m=entries(monthBytes),d=entries(dailyBytes);
  const get=(map,key)=>{const v=map.get(key);if(!v)throw new Error('XLSX 구성 요소 누락: '+key);return v};
  const ms=get(m,'xl/styles.xml'),ds=get(d,'xl/styles.xml');
  const section=(xml,name)=>{const match=xml.match(new RegExp('<'+name+'\\b[^>]*>([\\s\\S]*?)<\\/'+name+'>'));return match?match[1]:''};
  const nodes=(xml,name)=>xml.match(new RegExp('<'+name+'(?:\\s[^>]*)?(?:\\/>|>[\\s\\S]*?<\\/'+name+'>)','g'))||[];
  const mf=nodes(section(ms,'fonts'),'font'),df=nodes(section(ds,'fonts'),'font');
  const mfill=nodes(section(ms,'fills'),'fill'),dfill=nodes(section(ds,'fills'),'fill');
  const mb=nodes(section(ms,'borders'),'border'),db=nodes(section(ds,'borders'),'border');
  const mx=nodes(section(ms,'cellXfs'),'xf'),dx=nodes(section(ds,'cellXfs'),'xf');
  const offset=mx.length;
  const shifted=dx.map(x=>x.replace(/fontId="(\d+)"/g,(_,n)=>'fontId="'+(+n+mf.length)+'"').replace(/fillId="(\d+)"/g,(_,n)=>'fillId="'+(+n+mfill.length)+'"').replace(/borderId="(\d+)"/g,(_,n)=>'borderId="'+(+n+mb.length)+'"'));
  const mergedStyles=ms.replace(/<fonts\b[^>]*>[\s\S]*?<\/fonts>/,'<fonts count="'+(mf.length+df.length)+'">'+mf.join('')+df.join('')+'</fonts>')
    .replace(/<fills\b[^>]*>[\s\S]*?<\/fills>/,'<fills count="'+(mfill.length+dfill.length)+'">'+mfill.join('')+dfill.join('')+'</fills>')
    .replace(/<borders\b[^>]*>[\s\S]*?<\/borders>/,'<borders count="'+(mb.length+db.length)+'">'+mb.join('')+db.join('')+'</borders>')
    .replace(/<cellXfs\b[^>]*>[\s\S]*?<\/cellXfs>/,'<cellXfs count="'+(mx.length+dx.length)+'">'+mx.join('')+shifted.join('')+'</cellXfs>');
  const dayFiles=[...d.entries()].filter(([name])=>/^xl\/worksheets\/sheet\d+\.xml$/.test(name)).sort((a,b)=>Number(a[0].match(/\d+/)[0])-Number(b[0].match(/\d+/)[0]));
  const dailySheets=dayFiles.map(([name,xml],i)=>['xl/worksheets/sheet'+(i+2)+'.xml',xml.replace(/<c\b([^>]*?)\bs="(\d+)"/g,(_,before,n)=>'<c'+before+'s="'+(+n+offset)+'"')]);
  const count=dailySheets.length;
  const workbook=get(m,'xl/workbook.xml').replace('</sheets>',Array.from({length:count},(_,i)=>'<sheet name="'+String(i+1).padStart(2,'0')+'일" sheetId="'+(i+2)+'" r:id="rId'+(i+2)+'"/>').join('')+'</sheets>');
  const rels=get(m,'xl/_rels/workbook.xml.rels').replace('</Relationships>',Array.from({length:count},(_,i)=>'<Relationship Id="rId'+(i+3)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet'+(i+2)+'.xml"/>').join('')+'</Relationships>')
    .replace('Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles"','Id="rId'+(count+3)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles"');
  const types=get(m,'[Content_Types].xml').replace('</Types>',Array.from({length:count},(_,i)=>'<Override PartName="/xl/worksheets/sheet'+(i+2)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('')+'</Types>');
  return zipExcelStore([['[Content_Types].xml',types],['_rels/.rels',get(m,'_rels/.rels')],['xl/workbook.xml',workbook],['xl/_rels/workbook.xml.rels',rels],['xl/styles.xml',mergedStyles],['xl/worksheets/sheet1.xml',get(m,'xl/worksheets/sheet1.xml')],...dailySheets]);
}

function zipExcelStore(files){
  const encoder=new TextEncoder();const parts=[];const central=[];
  let offset=0;
  const u16=(a,n,i)=>{a[i]=n&255;a[i+1]=(n>>8)&255};
  const u32=(a,n,i)=>{a[i]=n&255;a[i+1]=(n>>>8)&255;a[i+2]=(n>>>16)&255;a[i+3]=(n>>>24)&255};
  const crcTable=Array.from({length:256},(_,i)=>{let c=i;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;return c>>>0});
  const crc32=arr=>{let c=0xFFFFFFFF;for(const b of arr)c=crcTable[(c^b)&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0};
  for(const [name,body] of files){
    const n=encoder.encode(name),data=encoder.encode(body),crc=crc32(data);
    const lh=new Uint8Array(30+n.length);u32(lh,0x04034b50,0);u16(lh,20,4);u16(lh,0x800,6);u16(lh,0,8);
    u32(lh,crc,14);u32(lh,data.length,18);u32(lh,data.length,22);u16(lh,n.length,26);lh.set(n,30);
    parts.push(lh,data);
    const ce=new Uint8Array(46+n.length);u32(ce,0x02014b50,0);u16(ce,20,4);u16(ce,20,6);
    u16(ce,0x800,8);u16(ce,0,10);u32(ce,crc,16);u32(ce,data.length,20);u32(ce,data.length,24);
    u16(ce,n.length,28);u32(ce,offset,42);ce.set(n,46);central.push(ce);
    offset+=lh.length+data.length;
  }
  const centSize=central.reduce((a,b)=>a+b.length,0);const tail=new Uint8Array(22);
  u32(tail,0x06054b50,0);u16(tail,files.length,8);u16(tail,files.length,10);
  u32(tail,centSize,12);u32(tail,offset,16);
  const all=[...parts,...central,tail];const result=new Uint8Array(all.reduce((a,b)=>a+b.length,0));
  let i=0;for(const part of all){result.set(part,i);i+=part.length}return result;
}


// v20.4 — password-backed D1 sessions: no browser-managed Basic auth cache.
const ADMIN_SESSION_COOKIE='__Host-temorary_admin';
const ADMIN_SESSION_SECONDS=8*60*60;
const ADMIN_PBKDF2_ROUNDS=100000;
let authSchemaPromise=null;
function ensureAdminAuthTables(db){
  if(!authSchemaPromise){
    authSchemaPromise=Promise.all([
      db.prepare('CREATE TABLE IF NOT EXISTS admin_auth_credentials (id INTEGER PRIMARY KEY CHECK(id=1), salt TEXT NOT NULL, hash TEXT NOT NULL, iterations INTEGER NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)').run(),
      db.prepare('CREATE TABLE IF NOT EXISTS admin_auth_sessions (token_hash TEXT PRIMARY KEY NOT NULL, expires_at INTEGER NOT NULL, created_at INTEGER NOT NULL)').run()
    ]).catch(e=>{authSchemaPromise=null;throw e});
  }
  return authSchemaPromise;
}
function randomToken(){
  const arr=crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...arr)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function base64Bytes(input){
  const b=atob(input.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-input.length%4)%4));
  return Uint8Array.from(b,c=>c.charCodeAt(0));
}
function toBase64Url(bytes){return btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
async function sha256(s){return toBase64Url(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))}
async function passwordHash(password,salt,iterations){
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:base64Bytes(salt),iterations},key,256);
  return toBase64Url(bits);
}
function cookieValue(request,name){
  const raw=request.headers.get('Cookie')||'';
  const pair=raw.split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='));
  return pair?pair.slice(name.length+1):'';
}
function sessionCookie(token,maxAge){
  return ADMIN_SESSION_COOKIE+'='+token+'; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age='+maxAge;
}
function sameOriginAdminPost(request,url){
  const origin=request.headers.get('Origin');
  const site=request.headers.get('Sec-Fetch-Site');
  if(origin&&origin!==url.origin)return false;
  if(site&&site!=='same-origin'&&site!=='none')return false;
  return request.headers.get('X-Requested-With')==='TemoraryAdmin' && (request.headers.get('Content-Type')||'').toLowerCase().startsWith('application/json');
}
async function configuredAdminVerifier(db){return db.prepare('SELECT salt,hash,iterations FROM admin_auth_credentials WHERE id=1').first()}
async function validAdminPassword(db,env,password){
  const row=await configuredAdminVerifier(db);
  if(row){
    const derived=await passwordHash(password,row.salt,Number(row.iterations));
    return safeEqual(derived,row.hash);
  }
  return safeEqual(password,env.ADMIN_PASSWORD);
}
async function currentAdminSession(request,db){
  const token=cookieValue(request,ADMIN_SESSION_COOKIE);
  if(!/^[A-Za-z0-9_-]{40,64}$/.test(token))return null;
  const hash=await sha256(token);
  const row=await db.prepare('SELECT expires_at FROM admin_auth_sessions WHERE token_hash=?').bind(hash).first();
  return row&&Number(row.expires_at)>Math.floor(Date.now()/1000)?{hash}:null;
}
async function authApi(request,env,url){
  if(request.method!=='POST')return json({ok:false,error:'Method Not Allowed'},405);
  if(!sameOriginAdminPost(request,url))return json({ok:false,error:'Invalid request origin'},403);
  if(url.pathname==='/api/auth/logout'){
    const token=cookieValue(request,ADMIN_SESSION_COOKIE);
    if(/^[A-Za-z0-9_-]{40,64}$/.test(token))await env.DB.prepare('DELETE FROM admin_auth_sessions WHERE token_hash=?').bind(await sha256(token)).run();
    return new Response(JSON.stringify({ok:true}),{headers:{'Content-Type':'application/json','Cache-Control':'no-store','Set-Cookie':sessionCookie('',0)}});
  }
  let body;
  try{body=await readJson(request)}catch(_){return json({ok:false,error:'잘못된 요청입니다.'},400)}
  if(url.pathname==='/api/auth/login'){
    if(typeof body.password!=='string')return json({ok:false,error:'비밀번호를 확인하세요.'},400);
    if(!await validAdminPassword(env.DB,env,body.password))return json({ok:false,error:'비밀번호가 일치하지 않습니다.'},401);
    const token=randomToken(),now=Math.floor(Date.now()/1000);
    await env.DB.prepare('INSERT INTO admin_auth_sessions(token_hash,expires_at,created_at) VALUES(?,?,?)').bind(await sha256(token),now+ADMIN_SESSION_SECONDS,now).run();
    return new Response(JSON.stringify({ok:true}),{headers:{'Content-Type':'application/json','Cache-Control':'no-store','Set-Cookie':sessionCookie(token,ADMIN_SESSION_SECONDS),'X-Content-Type-Options':'nosniff'}});
  }
  if(url.pathname==='/api/auth/password'){
    if(!await currentAdminSession(request,env.DB))return json({ok:false,error:'로그인이 필요합니다.'},401);
    const {currentPassword,newPassword}=body;
    if(typeof currentPassword!=='string'||typeof newPassword!=='string'||!newPassword.trim())return json({ok:false,error:'새 비밀번호를 입력하세요.'},400);
    if(!await validAdminPassword(env.DB,env,currentPassword))return json({ok:false,error:'현재 비밀번호가 일치하지 않습니다.'},403);
    const salt=randomToken(),hash=await passwordHash(newPassword,salt,ADMIN_PBKDF2_ROUNDS);
    await env.DB.batch([
      env.DB.prepare('INSERT INTO admin_auth_credentials(id,salt,hash,iterations,updated_at) VALUES(1,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET salt=excluded.salt,hash=excluded.hash,iterations=excluded.iterations,updated_at=CURRENT_TIMESTAMP').bind(salt,hash,ADMIN_PBKDF2_ROUNDS),
      env.DB.prepare('DELETE FROM admin_auth_sessions')
    ]);
    return new Response(JSON.stringify({ok:true}),{headers:{'Content-Type':'application/json','Cache-Control':'no-store','Set-Cookie':sessionCookie('',0),'X-Content-Type-Options':'nosniff'}});
  }
  return json({ok:false,error:'Not Found'},404);
}
const ADMIN_LOGIN_PAGE=`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>관리자 로그인</title><style>
*{box-sizing:border-box}body{margin:0;min-height:100dvh;display:grid;place-items:center;padding:20px;background:#f3f6fb;color:#21344b;font:16px -apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo",sans-serif}
.card{width:min(100%,390px);padding:26px;background:#fff;border:1px solid #d8e3f0;box-shadow:0 10px 35px #19395713;border-radius:15px}h1{font-size:23px;margin:0 0 8px;color:#173e68}.hint{font-size:14px;color:#728296;margin-bottom:24px}label{display:block;font-weight:700;margin-bottom:7px}input{width:100%;height:50px;border-radius:9px;border:1px solid #cbd8e7;padding:10px 12px;font:inherit}button{width:100%;height:49px;margin-top:17px;background:#286ba9;color:#fff;border:0;border-radius:9px;font-size:17px;font-weight:700}button:disabled{opacity:.65}#loginError{min-height:20px;margin:12px 0 0;color:#b23440;font-size:14px}
</style></head><body><section class="card"><h1>관리자 로그인</h1><p class="hint">월간 근무표 관리</p><form id="loginForm"><label for="password">비밀번호</label><input id="password" type="password" autocomplete="current-password" autofocus required><button id="submit" type="submit">로그인</button><p id="loginError" role="status"></p></form></section><script>
document.getElementById('loginForm').addEventListener('submit',async(e)=>{e.preventDefault();const b=document.getElementById('submit'),p=document.getElementById('password'),msg=document.getElementById('loginError');b.disabled=true;msg.textContent='';try{const r=await fetch('/api/auth/login',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-Requested-With':'TemoraryAdmin'},body:JSON.stringify({password:p.value})});const data=await r.json();if(!r.ok||!data.ok)throw new Error(data.error||'로그인 실패');location.replace('/');}catch(error){msg.textContent=error.message;b.disabled=false;}});
</script></body></html>`;
function htmlResponse(html){return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','X-Frame-Options':'DENY'}})}

export default {
  async fetch(request, env) {
    const url=new URL(request.url);
    // Browser icon requests must not trigger login prompts or expose data.
    if((request.method==='GET'||request.method==='HEAD') && (
      url.pathname==='/favicon.ico' ||
      /^\/apple-touch-icon(?:-precomposed|-\d+x\d+)?\.png$/.test(url.pathname)
    ))return new Response(null,{status:204,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
    if(!env?.DB)return json({ok:false,stage:'binding_missing'},503);
    if(!env?.ADMIN_PASSWORD)return json({ok:false,stage:'admin_password_missing'},503);
    try{await ensureAdminAuthTables(env.DB)}catch(error){console.error('Auth DB init error',error);return json({ok:false,stage:'auth_tables_failed'},503)}
    try{
      if(url.pathname.startsWith('/api/auth/'))return await authApi(request,env,url);
      const session=await currentAdminSession(request,env.DB);
      if(!session){
        if(url.pathname.startsWith('/api/'))return json({ok:false,error:'로그인이 필요합니다.'},401);
        if(request.method==='GET')return htmlResponse(ADMIN_LOGIN_PAGE);
        return new Response('Unauthorized',{status:401});
      }
      if(url.pathname==='/login')return Response.redirect(url.origin+'/',303);
      if(url.pathname.startsWith('/api/')){
        try{return await employeeApi(request,env,url)}catch(error){console.error('D1 Worker API error',error);return json({ok:false,stage:'query_failed',error:'D1 쿼리 실패. Worker 로그와 D1 테이블 구성을 확인하세요.'},500)}
      }
      if(request.method!=='GET')return new Response('Method Not Allowed',{status:405});
      return htmlResponse(PAGE);
    }catch(error){console.error('Admin session error',error);return json({ok:false,stage:'auth_query_failed'},500)}
  }
};

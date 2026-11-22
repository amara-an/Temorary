// 직원용 모바일 페이지 v4.6.2: 월별 신청 마감과 무관하게 모든 현재 휴무자를 표시.
// 패스키는 아직 미구현. 관리자에서 직원 추가와 접속키 발급을 관리합니다.
const PAGE = String.raw`<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#f7f8fa"><title>월간 근무표</title>
<style>
:root{font-family:system-ui,-apple-system,"Apple SD Gothic Neo",sans-serif;color:#172235;background:#f7f8fa;font-size:18px}
*{box-sizing:border-box}body{margin:0}button,input{font:inherit}button{cursor:pointer;touch-action:manipulation}main{max-width:480px;margin:auto;padding:16px 14px 35px}.bar{display:flex;justify-content:space-between;align-items:center;gap:10px;background:#eaf0f7;border:1px solid #d8e2ee;border-radius:12px;padding:4px 8px}.month{font-size:25px;font-weight:800;white-space:nowrap}.arrow{height:46px;width:46px;border:0;background:transparent;border-radius:12px;font-size:26px}.go-leave{display:block;width:100%;margin:14px 0 20px;border:1px solid #ccd3dc;background:#fff;border-radius:10px;min-height:52px;font-size:17px;font-weight:700;color:#d64b43}.calendar{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;border:1px solid #cbd5e1;border-radius:14px;background:#fff;padding:8px}.weekday{font-size:15px;text-align:center;font-weight:700;padding:8px 0}.sun{color:#c93f43}.sat{color:#4375b5}.day{min-height:62px;padding:5px 1px;border:1px solid #dbe1e9;border-radius:9px;background:#fff;display:flex;flex-direction:column;align-items:center;gap:3px;justify-content:flex-start;min-width:0}.day .num{font-size:19px;font-weight:700}.day small{font-size:11px;white-space:nowrap;color:#5f6877}.day.selected{outline:2px solid #3975b5;background:#eaf3ff}.day.off small{color:#c63f43;font-weight:700}.day:disabled{background:transparent;border-color:transparent}.detail{margin-top:20px;background:#fff;border:1px solid #e1e6ed;border-radius:14px;padding:14px 10px;text-align:center}.detail .date{font-size:20px;font-weight:750}.detail .time{font-size:29px;font-weight:800;margin:8px 0;letter-spacing:-.7px}.muted{color:#6a7280}.note{font-size:13px;color:#6a7280;margin-top:15px;line-height:1.5}.back{width:100%;min-height:50px;border:1px solid #ccd3dc;border-radius:10px;background:#fff;font-weight:700;margin:14px 0}.info{background:#fff;padding:18px;border:1px solid #e1e6ed;border-radius:13px;margin-top:17px}.info h2{margin:0 0 14px;font-size:23px}.info p{margin:6px 0;font-size:17px}.action{min-height:56px;width:100%;border:0;background:#225f9e;color:white;border-radius:12px;font-size:20px;font-weight:750;margin-top:15px}.action.secondary{color:#af3434;background:#fff;border:1px solid #d8b4b4}.action:disabled{opacity:.5}.types{display:grid;gap:10px;margin-top:16px}.type{display:flex;justify-content:center;align-items:center;gap:12px;border:2px solid #d5dae1;border-radius:14px;background:#fff;padding:18px 5px;min-height:72px;width:100%}.type.active{border-color:#377eb6;background:#eef6ff}.type .red{color:#d64b43;font-size:24px;font-weight:800}.type .rest{font-size:22px;font-weight:800}.confirm{background:#fff;border:1px solid #e1e6ed;border-radius:13px;padding:19px;margin-top:18px}.buttons{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px}.buttons button{min-height:54px;border-radius:10px;font-size:18px;font-weight:750;border:1px solid #aeb9c5;background:#fff}.buttons button.ok{color:#fff;background:#22629e;border-color:#22629e}.buttons button.danger{background:#b94343;border-color:#b94343;color:white}.buttons button:disabled{opacity:.6}
.deadline-banner{margin:14px 0 10px;padding:15px 14px;background:#fff0f1;border:1px solid #f0c8cf;border-radius:12px;color:#8d293d;line-height:1.45}
.deadline-banner strong{display:block;font-size:18px;line-height:1.4}
.deadline-banner.closed{background:#f2f3f5;border-color:#d8dce2;color:#606872}
.deadline-banner.open{background:#f0f7ff;border-color:#cddfee;color:#225f9e}
.leave-topline{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0 20px;align-items:stretch}
.leave-topline .back{width:100%;margin:0;min-height:54px}
.leave-topline .deadline-banner{margin:0;min-height:54px;padding:8px 5px;display:flex;align-items:center;justify-content:center;text-align:center}
.leave-topline .deadline-banner strong{font-size:16px;line-height:1.3}
/* 날짜별 신청자 정보: 이름과 휴무 종류만 노출 */
.own-shift{font-size:18px;font-weight:700;margin:2px 0 12px;color:#273c59}
.applicants{text-align:left}
.applicants-heading{display:flex;justify-content:space-between;align-items:center;font-size:17px;font-weight:800;margin-bottom:9px}
.applicants-heading span{font-size:14px;font-weight:500;color:#6a7280}
.applicants-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.applicant{display:flex;justify-content:space-between;align-items:center;gap:6px;border-radius:9px;background:#f5f7fa;border:1px solid #e0e5ed;padding:9px 10px;min-width:0;font-size:15px}
.applicant-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:700}
.applicant-kind{white-space:nowrap;color:#a23c45;font-size:13px}
.applicants-empty{color:#7a8290;font-size:15px;padding:7px 0}.limit-status{font-size:13px;color:#6a7280;margin:-2px 0 10px}
.own-leave{margin-top:10px;font-size:15px;color:#6a7280}
/* 모바일 대화상자: 본문 아래에 추가하지 않고 뷰포트에 고정 */
.modal-layer{position:fixed;inset:0;z-index:1000;background:rgba(21,34,50,.55);display:flex;align-items:center;justify-content:center;padding:max(18px,env(safe-area-inset-top)) 14px max(18px,env(safe-area-inset-bottom))}.modal{width:min(100%,430px);max-height:min(85dvh,750px);overflow-y:auto;overscroll-behavior:contain;background:#fff;border-radius:18px;padding:22px 18px;box-shadow:0 16px 60px #14223950}.modal h2{font-size:23px;margin:0 0 12px}.modal p{font-size:17px;line-height:1.5}.modal .types{margin-top:10px}.modal .buttons{position:sticky;bottom:0;background:#fff;padding-top:10px}body.modal-open{overflow:hidden}.helper{padding:10px 12px;border:1px solid #d9e2ef;border-radius:10px;background:#f3f7fb;color:#53667d;font-size:13px;line-height:1.5}.error{color:#ad3030;margin:9px 0;font-size:15px}.login-card{background:#fff;border:1px solid #dce4ef;padding:24px 17px;border-radius:14px;margin-top:30px}.login-card h1{font-size:24px}.login-card input{display:block;width:100%;height:52px;border-radius:10px;border:1px solid #aebccc;margin-top:12px;padding:10px}.work-tools{display:grid;grid-template-columns:minmax(0,1fr) 116px;gap:10px;margin:14px 0 20px}
.work-tools .go-leave{margin:0;min-height:52px}
.export-btn{width:100%;height:52px;background:#fff;color:#225f9e;border:1px solid #b9ccdf;border-radius:10px;font-size:16px;font-weight:700}
.statusbar{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:12px;color:#53667d;margin-bottom:10px}.logout{background:transparent;border:1px solid #ccd5df;border-radius:8px;padding:6px 10px;font-size:12px}.loading{text-align:center;padding:60px 0;color:#6a7280}
@media(max-width:360px){main{padding-inline:9px}.day{min-height:56px}.day .num{font-size:17px}.day small{font-size:10px}.detail .time{font-size:26px}.modal{padding:18px 12px}.modal .type{min-height:64px}}
</style></head><body><main id="app"><div class="loading">연결 확인 중…</div></main><div id="dialogHost"></div>
<script>
const app=document.getElementById('app'),dialogHost=document.getElementById('dialogHost');
const today=new Date(), names={full:'하루 종일',am:'오전',pm:'오후'};
let year=today.getFullYear(),month=today.getMonth(),selected=today.getDate(),page='work',choice='full',dialog='',person=null,monthly=null,loading=true,errorText='',sending=false;
const key=(y,m,d)=>y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
const monthKey=()=>year+'-'+String(month+1).padStart(2,'0');
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function dateVal(d){return monthly?.days?.[key(year,month,d)]||null}
function shift(d){const row=dateVal(d);if(!row)return {label:'미배정',time:'근무 배정 전'};if(row.status!=='cancelled'&&row.leave==='full')return {label:'휴무',time:'휴무'};if(row.status!=='cancelled'&&row.leave==='annual')return {label:'연차',time:'연차'};if(row.code){return {label:row.code,time:row.start&&row.end?row.start+' ~ '+row.end:'시간 미설정'}}return {label:'미배정',time:'근무 배정 전'}}
function monthNav(){return '<div class="bar"><button class="arrow" data-act="prev" aria-label="이전 달">‹</button><div class="month">'+year+'년 '+(month+1)+'월</div><button class="arrow" data-act="next" aria-label="다음 달">›</button></div>'}
function deadlineBanner(){const deadline=monthly?.deadline||'',accepting=monthly?.accepting===true;const cls=!deadline?(accepting?' open':' closed'):accepting?'':' closed';const message=!deadline?(accepting?'신청 가능':'신청 기간 외'):('마감 '+Number(deadline.slice(5,7))+'월 '+Number(deadline.slice(8,10))+'일');return '<div class="deadline-banner'+cls+'" role="status"><strong>'+escapeHTML(message)+'</strong></div>'}
function applicantsForDay(d){return monthly?.applicants?.[key(year,month,d)]||[]}
function atDayLimit(){const n=monthly?.maxApplicants;return n!==null&&n!==undefined&&Number(monthly?.leaveCounts?.[key(year,month,selected)]||0)>=n}
function showApplicants(d){const people=applicantsForDay(d),capacity=monthly?.maxApplicants,used=Number(monthly?.leaveCounts?.[key(year,month,d)]||0);let h='<div class="applicants"><div class="applicants-heading">신청자 <span>'+people.length+'명</span></div>';
if(capacity!==null&&capacity!==undefined)h+='<div class="limit-status">휴무 인원 '+used+' / '+capacity+'명</div>';
if(people.length){h+='<div class="applicants-list">';for(const person of people)h+='<div class="applicant"><span class="applicant-name">'+escapeHTML(person.name)+'</span><span class="applicant-kind">'+escapeHTML(person.type==='annual'?'연차':(person.type==='full'?'휴무':names[person.type]||person.type))+'</span></div>';h+='</div>'}
else h+='<div class="applicants-empty">신청자 없음</div>';
return h+'</div>'}
function workTime(sh){return sh.label==='휴무'||sh.label==='연차'||sh.label==='미배정'?'—':sh.time}
function leaveCalendarLabel(row){if(!row||row.status==='cancelled')return '';return ({full:'휴무',am:'오전 휴무',pm:'오후 휴무',annual:'연차'})[row.leave]||''}
function cal(){const first=new Date(year,month,1).getDay(),len=new Date(year,month+1,0).getDate();let h='<div class="calendar">';['일','월','화','수','목','금','토'].forEach((w,i)=>h+='<div class="weekday '+(i===0?'sun':i===6?'sat':'')+'">'+w+'</div>');for(let i=0;i<Math.ceil((first+len)/7)*7;i++){const d=i-first+1;if(d<1||d>len){h+='<button class="day" disabled aria-hidden="true"></button>';continue}const row=dateVal(d),val=page==='work'?shift(d):null;let label=page==='work'?val.label:leaveCalendarLabel(row);h+='<button class="day '+(d===selected?'selected ':'')+((val?.label==='휴무'||val?.label==='연차')?'off':'')+'" data-day="'+d+'"><span class="num">'+d+'</span><small>'+escapeHTML(label)+'</small></button>'}return h+'</div>'}
function render(){if(loading){app.innerHTML='<div class="loading">데이터 불러오는 중…</div>';dialogHost.innerHTML='';return}if(!person){app.innerHTML='<section class="login-card"><h1>직원용 근무표</h1><form id="testLogin"><label for="loginId">로그인 ID</label><input id="loginId" name="loginId" autocomplete="username" required placeholder="직원 이름"><label for="testKey">접속키</label><input id="testKey" name="testKey" type="password" autocomplete="off" required placeholder="관리자가 발급한 접속키"><button class="action" type="submit">로그인</button></form>'+(errorText?'<p role="alert" class="error">'+escapeHTML(errorText)+'</p>':'')+'</section>';dialogHost.innerHTML='';document.body.classList.remove('modal-open');return}
const row=dateVal(selected),sh=shift(selected),capacity=monthly?.maxApplicants,used=Number(monthly?.leaveCounts?.[key(year,month,selected)]||0);
const atCapacity=capacity!==null&&capacity!==undefined&&used>=capacity,periodOpen=monthly?.accepting===true,canApply=periodOpen&&!atCapacity;
let h='<div class="statusbar"><span>'+escapeHTML(person.name)+'</span><button class="logout" data-act="logout">로그아웃</button></div>'+monthNav();
if(page==='work')h+='<div class="work-tools"><button class="go-leave" data-act="leave">휴무 신청 / 취소</button><button class="export-btn" data-act="pdf">PDF 저장</button></div>'+cal()+'<section class="detail"><div class="time">'+escapeHTML(workTime(sh))+'</div></section>';
else{
 h+='<div class="leave-topline"><button class="back" data-act="work">← 돌아가기</button>'+deadlineBanner()+'</div>'+cal()+'<section class="info">'+showApplicants(selected);

 h+='</section>';
 if(row?.owned&&row.status==='active')h+='<button class="action secondary" data-act="cancel" '+(periodOpen?'':'disabled')+'>'+(periodOpen?'신청 취소':'신청 기간 외')+'</button>';
 else if(!row?.leave||row.status==='cancelled')h+='<button class="action" data-act="choose" '+(canApply?'':'disabled')+'>'+(canApply?'휴무 신청':periodOpen?'정원 마감':'신청 기간 외')+'</button>';

}
if(errorText)h+='<p role="alert" class="error">'+escapeHTML(errorText)+'</p>';
app.innerHTML=h;drawModal()}
function drawModal(){document.body.classList.toggle('modal-open',!!dialog);if(!dialog){dialogHost.innerHTML='';return}let h='<div class="modal-layer" data-backdrop="1"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="dialogTitle" tabindex="-1">';
if(dialog==='choose'){h+='<h2 id="dialogTitle">언제 쉬시겠습니까?</h2><p class="muted">'+(month+1)+'월 '+selected+'일</p><div class="types">';for(const [id,label] of Object.entries(names))h+='<button class="type '+(choice===id?'active':'')+'" data-type="'+id+'" aria-pressed="'+(choice===id?'true':'false')+'" '+(sending?'disabled':'')+'><span class="red">'+label+'</span><span class="rest">휴무</span></button>';h+='</div><div class="buttons"><button data-act="dismiss" '+(sending?'disabled':'')+'>취소</button><button class="ok" data-act="submit" '+(sending?'disabled':'')+'>'+(sending?'신청 중…':'신청하기')+'</button></div>'}
else if(dialog==='cancel'){const kind=dateVal(selected)?.leave||'full';h+='<h2 id="dialogTitle">신청을 취소하시겠습니까?</h2><p><strong>'+(month+1)+'월 '+selected+'일 · '+escapeHTML(names[kind]||kind)+' 휴무</strong></p><div class="buttons"><button data-act="dismiss" '+(sending?'disabled':'')+'>돌아가기</button><button class="danger" data-act="confirm" '+(sending?'disabled':'')+'>'+(sending?'처리 중…':'취소 확정')+'</button></div>'}
h+='</section></div>';dialogHost.innerHTML=h;const popup=dialogHost.querySelector('.modal');popup?.focus({preventScroll:true})}
async function api(path,opts={}){const response=await fetch(path,{credentials:'same-origin',cache:'no-store',...opts,headers:{...(opts.body?{'Content-Type':'application/json','X-Requested-With':'EmployeeCalendar'}:{}),...(opts.headers||{})}});let data;try{data=await response.json()}catch{throw Error('서버 응답을 읽을 수 없습니다.')}if(!response.ok||!data.ok)throw Error(data.error||'연결 오류 ('+response.status+')');return data}
async function loadMonth(){errorText='';loading=true;render();try{monthly=await api('/api/month?month='+encodeURIComponent(monthKey()))}catch(e){monthly=null;errorText=e.message}finally{loading=false;render()}}
async function bootstrap(){try{const r=await api('/api/me');person=r.person;await loadMonth()}catch{person=null;loading=false;render()}}
async function submitLogin(e){e.preventDefault();const form=e.target;const loginId=form.querySelector('[name=loginId]').value.trim(),input=form.querySelector('[name=testKey]'),accessCode=input.value;const btn=form.querySelector('[type=submit]');btn.disabled=true;btn.textContent='연결 확인 중…';try{const res=await api('/api/login',{method:'POST',body:JSON.stringify({loginId,accessCode})});person=res.person;errorText='';input.value='';await loadMonth()}catch(err){errorText=err.message;btn.disabled=false;btn.textContent='로그인';const box=app.querySelector('[role=alert]');if(box)box.textContent=errorText;else{const p=document.createElement('p');p.className='error';p.setAttribute('role','alert');p.textContent=errorText;form.after(p)}}}
async function applyAction(action){if(sending)return;sending=true;drawModal();const date=key(year,month,selected),type=choice;try{await api('/api/leave',{method:'POST',body:JSON.stringify({action,date,type})});dialog='';await loadMonth()}catch(e){errorText=e.message;dialog='';render()}finally{sending=false}}

function publishedRows(result){const m=new Map();for(const r of result.shifts||[])m.set(r.work_date,r);return m}
function fileDownload(blob,filename){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.style.display='none';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000)}
function pdfImageJpeg(jpeg,w,h){const enc=new TextEncoder(),chunks=[],positions=[];let len=0;const put=v=>{const bytes=typeof v==='string'?enc.encode(v):v;chunks.push(bytes);len+=bytes.length};put('%PDF-1.4\n');function object(id,s){positions[id]=len;put(id+' 0 obj\n'+s+'\nendobj\n')}object(1,'<< /Type /Catalog /Pages 2 0 R >>');object(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');object(3,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>');positions[4]=len;put('4 0 obj\n<< /Type /XObject /Subtype /Image /Width '+w+' /Height '+h+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+jpeg.length+' >>\nstream\n');put(jpeg);put('\nendstream\nendobj\n');const stream='q\n595.28 0 0 841.89 0 0 cm\n/Im0 Do\nQ\n';positions[5]=len;put('5 0 obj\n<< /Length '+enc.encode(stream).length+' >>\nstream\n'+stream+'endstream\nendobj\n');const xref=len;put('xref\n0 6\n0000000000 65535 f \n');for(let i=1;i<=5;i++)put(String(positions[i]).padStart(10,'0')+' 00000 n \n');put('trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n');return new Blob(chunks,{type:'application/pdf'})}
async function pdfFromExport(result){
 const w=1240,h=1754,canvas=document.createElement('canvas');
 canvas.width=w;canvas.height=h;
 const c=canvas.getContext('2d');if(!c)throw Error('PDF 생성 불가');
 c.fillStyle='#fff';c.fillRect(0,0,w,h);
 const font='system-ui,-apple-system,"Apple SD Gothic Neo",sans-serif';
 function text(s,x,y,size=27,color='#172235',weight=600,align='center'){
  c.font=weight+' '+size+'px '+font;c.fillStyle=color;c.textAlign=align;c.textBaseline='middle';c.fillText(String(s),x,y);
 }
 function roundRect(x,y,width,height,radius=14){
  const r=Math.min(radius,width/2,height/2);c.beginPath();c.moveTo(x+r,y);c.lineTo(x+width-r,y);c.quadraticCurveTo(x+width,y,x+width,y+r);c.lineTo(x+width,y+height-r);c.quadraticCurveTo(x+width,y+height,x+width-r,y+height);c.lineTo(x+r,y+height);c.quadraticCurveTo(x,y+height,x,y+height-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath();
 }
 const [yStr,mStr]=result.month.split('-'),y=Number(yStr),m=Number(mStr);
 const first=new Date(y,m-1,1).getDay();
 const days=new Date(y,m,0).getDate();
 const weeks=Math.ceil((first+days)/7);
 const margin=74,tableWidth=w-margin*2;
 // 실제 근무달력과 같은 월 표시줄 및 일~토 7열 달력.
 c.fillStyle='#eaf0f7';c.strokeStyle='#d8e2ee';c.lineWidth=2;
 roundRect(margin,83,tableWidth,110,18);c.fill();c.stroke();
 text(y+'년 '+m+'월',w/2,139,58,'#172235',800);
 if(result.name)text(result.name,w-margin-20,227,23,'#5f6877',600,'right');
 const outerY=251,outerH=1397,gap=10,pad=12;
 c.fillStyle='#fff';c.strokeStyle='#cbd5e1';c.lineWidth=2;
 roundRect(margin,outerY,tableWidth,outerH,19);c.fill();c.stroke();
 const innerX=margin+pad,innerWidth=tableWidth-pad*2;
 const cellWidth=(innerWidth-gap*6)/7;
 const weekdayTop=outerY+pad,weekdayH=64;
 const names=['일','월','화','수','목','금','토'];
 for(let j=0;j<7;j++)text(names[j],innerX+j*(cellWidth+gap)+cellWidth/2,weekdayTop+weekdayH/2,28,j===0?'#c93f43':j===6?'#4375b5':'#172235',750);
 const startY=weekdayTop+weekdayH+gap;
 const cellH=(outerH-2*pad-weekdayH-gap*(weeks-1)-gap)/weeks;
 const byDay=publishedRows(result);
 for(let i=0;i<weeks*7;i++){
  const day=i-first+1;
  if(day<1||day>days)continue;
  const weekday=i%7,row=Math.floor(i/7);
  const x=innerX+weekday*(cellWidth+gap),top=startY+row*(cellH+gap);
  c.fillStyle='#fff';c.strokeStyle='#dbe1e9';c.lineWidth=2;
  roundRect(x,top,cellWidth,cellH,13);c.fill();c.stroke();
  text(day,x+cellWidth/2,top+45,34,weekday===0?'#c93f43':weekday===6?'#4375b5':'#172235',750);
  const date=result.month+'-'+String(day).padStart(2,'0');
  const code=(byDay.get(date)?.code||'').trim();
  const label=code==='휴'?'휴무':code==='연'?'연차':code||'미배정';
  const off=label==='휴무'||label==='연차';
  text(label,x+cellWidth/2,top+cellH*.60,label.length>4?23:31,off?'#c63f43':code?'#5f6877':'#8a94a2',off?750:600);
 }
 const jpeg=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('PDF 변환 실패')),'image/jpeg',.92));
 return pdfImageJpeg(new Uint8Array(await jpeg.arrayBuffer()),w,h);
}
async function downloadSchedule(){if(sending)return;sending=true;errorText='';try{const data=await api('/api/export-month?month='+encodeURIComponent(monthKey()));const filename=data.month+'_'+data.name.replace(/[\\/:*?"<>|]/g,'_');fileDownload(await pdfFromExport(data),filename+'.pdf')}catch(e){errorText=e.message;render()}finally{sending=false}}


function dispatchClick(e){const btn=e.target.closest('button');if(!btn)return;const a=btn.dataset.act,d=btn.dataset.day,t=btn.dataset.type;if(!a&&!d&&!t)return;if(d){selected=Number(d);dialog='';errorText='';render();return}if(t){choice=t;render();return}if(a==='prev'||a==='next'){month+=a==='prev'?-1:1;if(month<0){year--;month=11}if(month>11){year++;month=0}selected=Math.min(selected,new Date(year,month+1,0).getDate());dialog='';loadMonth();return}if(a==='pdf'){downloadSchedule();return}if(a==='logout'){api('/api/logout',{method:'POST',body:'{}'}).catch(()=>{}).finally(()=>{person=null;monthly=null;dialog='';errorText='';render()});return}if(a==='leave'){page='leave';dialog=''}else if(a==='work'){page='work';dialog=''}else if(a==='choose'){if(monthly?.accepting!==true||atDayLimit())return;choice='full';dialog='choose'}else if(a==='submit'){if(monthly?.accepting!==true||atDayLimit())return;applyAction('submit');return}else if(a==='cancel'){dialog='cancel'}else if(a==='dismiss'){dialog=''}else if(a==='confirm'){applyAction('cancel');return}render()}
app.addEventListener('click',dispatchClick);dialogHost.addEventListener('click',dispatchClick);
dialogHost.addEventListener('click',e=>{if(e.target.classList.contains('modal-layer')){dialog='';render()}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&dialog){dialog='';render()}});
app.addEventListener('submit',e=>{if(e.target.id==='testLogin')submitLogin(e)});
bootstrap();
</script></body></html>`;

const ENCODER = new TextEncoder();
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const SESSION_COOKIE = '__Host-employee_session';
const ONE_DAY = 86400;
function json(data,status=200,headers={}){return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}})}
function validDate(s){if(typeof s!=='string'||!DATE_RE.test(s))return false;const [y,m,d]=s.split('-').map(Number);const dt=new Date(Date.UTC(y,m-1,d));return dt.getUTCFullYear()===y&&dt.getUTCMonth()===m-1&&dt.getUTCDate()===d}
function safeEq(a,b){const a1=ENCODER.encode(String(a)),b1=ENCODER.encode(String(b));let diff=a1.length^b1.length;for(let i=0;i<Math.max(a1.length,b1.length);i++)diff|=(a1[i]||0)^(b1[i]||0);return diff===0}
function b64u(bytes){return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
async function sha256(value){return b64u(new Uint8Array(await crypto.subtle.digest('SHA-256',ENCODER.encode(value))))}
function sessionToken(){return b64u(crypto.getRandomValues(new Uint8Array(32)))}
function sessionCookie(token,ttl){return SESSION_COOKIE+'='+token+'; Path=/; Max-Age='+ttl+'; HttpOnly; Secure; SameSite=Strict'}
function getSessionToken(request){return (request.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(SESSION_COOKIE+'='))?.slice(SESSION_COOKIE.length+1)||''}
let employeeAccountsReady=false;
async function ensureAccountSchema(db){
 if(employeeAccountsReady)return;
 await db.batch([
   db.prepare(`CREATE TABLE IF NOT EXISTS employee_login_accounts (
      employee_id TEXT PRIMARY KEY NOT NULL,login_id TEXT UNIQUE NOT NULL,
      salt TEXT, secret_hash TEXT,version INTEGER NOT NULL DEFAULT 0,
      failed_count INTEGER NOT NULL DEFAULT 0,lock_until INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(employee_id) REFERENCES employees(id))`),
   db.prepare(`CREATE TABLE IF NOT EXISTS employee_login_sessions (
      token_hash TEXT PRIMARY KEY NOT NULL,employee_id TEXT NOT NULL,
      version INTEGER NOT NULL,expires_at INTEGER NOT NULL)`)
 ]);
 employeeAccountsReady=true;
}
async function sessionId(request,db){
 const raw=getSessionToken(request);if(!/^[A-Za-z0-9_-]{40,64}$/.test(raw))return null;
 const row=await db.prepare(`SELECT s.employee_id FROM employee_login_sessions s
  JOIN employee_login_accounts a ON a.employee_id=s.employee_id AND a.version=s.version
  JOIN employees e ON e.id=s.employee_id AND e.active=1
  WHERE s.token_hash=? AND s.expires_at>?`).bind(await sha256(raw),Math.floor(Date.now()/1000)).first();
 return row?.employee_id||null;
}
async function login(db,body){
 await ensureAccountSchema(db);
 const loginId=typeof body.loginId==='string'?body.loginId.trim():'';
 const accessCode=typeof body.accessCode==='string'?body.accessCode:'';
 if(!loginId||loginId.length>90||!accessCode||accessCode.length>100)return json({ok:false,error:'로그인 ID 또는 접속키를 확인하세요.'},400);
 const account=await db.prepare(`SELECT a.employee_id,a.salt,a.secret_hash,a.version,a.failed_count,a.lock_until,e.name
  FROM employee_login_accounts a JOIN employees e ON e.id=a.employee_id
  WHERE a.login_id=? AND e.active=1`).bind(loginId).first();
 if(!account||!account.secret_hash||!account.salt)return json({ok:false,error:'로그인 ID 또는 접속키를 확인하세요.'},401);
 const now=Math.floor(Date.now()/1000);
 if(Number(account.lock_until)>now)return json({ok:false,error:'잠시 후 다시 시도하세요.'},429);
 const attempt=await sha256(account.salt+'|'+accessCode);
 if(!safeEq(attempt,account.secret_hash)){
  const n=Number(account.failed_count||0)+1;
  await db.prepare(`UPDATE employee_login_accounts SET failed_count=?,lock_until=? WHERE employee_id=?`).bind(n>=5?0:n,n>=5?now+600:0,account.employee_id).run();
  return json({ok:false,error:'로그인 ID 또는 접속키를 확인하세요.'},401);
 }
 const token=sessionToken();
 await db.batch([
  db.prepare('UPDATE employee_login_accounts SET failed_count=0,lock_until=0 WHERE employee_id=?').bind(account.employee_id),
  db.prepare('INSERT INTO employee_login_sessions(token_hash,employee_id,version,expires_at) VALUES (?,?,?,?)').bind(await sha256(token),account.employee_id,account.version,now+ONE_DAY),
  db.prepare('DELETE FROM employee_login_sessions WHERE expires_at<?').bind(now)
 ]);
 return json({ok:true,person:{name:account.name}},200,{'Set-Cookie':sessionCookie(token,ONE_DAY)});
}
async function readBody(req){if(!(req.headers.get('content-type')||'').startsWith('application/json'))throw Error('JSON만 허용됩니다.');const txt=await req.text();if(txt.length>4096)throw Error('요청이 너무 큽니다.');const obj=JSON.parse(txt);if(!obj||typeof obj!=='object'||Array.isArray(obj))throw Error('잘못된 요청입니다.');return obj}
let ownSchemaReady=false;
async function ensureOwnSchema(db){if(ownSchemaReady)return;await db.batch([
 db.prepare(`CREATE TABLE IF NOT EXISTS employee_leave_requests (
 employee_id TEXT NOT NULL,work_date TEXT NOT NULL,leave_type TEXT NOT NULL CHECK(leave_type IN ('full','am','pm')),
 status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','cancelled')),
 requested_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(employee_id,work_date))`),
 db.prepare("CREATE TABLE IF NOT EXISTS schedule_deadlines (month TEXT PRIMARY KEY NOT NULL,deadline TEXT NOT NULL DEFAULT '')"),
 db.prepare("CREATE TABLE IF NOT EXISTS schedule_leave_limits (month TEXT PRIMARY KEY NOT NULL,max_applicants INTEGER)")
 ]);
 // Preserve v4.6 caps if the legacy column was already installed.
 try{const cols=(await db.prepare('PRAGMA table_info(schedule_deadlines)').all()).results||[];
  if(cols.some(x=>x.name==='max_applicants'))await db.prepare('INSERT OR IGNORE INTO schedule_leave_limits(month,max_applicants) SELECT month,max_applicants FROM schedule_deadlines WHERE max_applicants IS NOT NULL').run();
 }catch(e){console.warn('leave quota legacy copy skipped',String(e))}
 ownSchemaReady=true} 
let publicationSchemaReady=false;
async function ensurePublishedReadSchema(db){
 if(publicationSchemaReady)return;
 await db.batch([
 db.prepare('CREATE TABLE IF NOT EXISTS schedule_publications (month TEXT PRIMARY KEY NOT NULL,published_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)'),
 db.prepare(`CREATE TABLE IF NOT EXISTS schedule_published_shifts (
 employee_id TEXT NOT NULL,work_date TEXT NOT NULL,code TEXT NOT NULL,
 start_time TEXT NOT NULL DEFAULT '',end_time TEXT NOT NULL DEFAULT '',
 PRIMARY KEY(employee_id,work_date))`)
 ]);
 publicationSchemaReady=true;
}
async function me(db,id){return db.prepare('SELECT id,name FROM employees WHERE id=? AND active=1').bind(id).first()}
function monthEnd(month){const [y,m]=month.split('-').map(Number);return new Date(Date.UTC(y,m,1)).toISOString().slice(0,7)+'-01'}
function kstDate(){return new Date(Date.now()+9*3600000).toISOString().slice(0,10)}
function leaveAccepting(month,deadline,today=kstDate()){return month>=today.slice(0,7)&&(!deadline||today<=deadline)}
async function getMonth(db,id,month){const start=month+'-01',end=monthEnd(month);await ensureOwnSchema(db);await ensurePublishedReadSchema(db);const res=await db.batch([
 db.prepare(`SELECT s.work_date,s.code,s.start_time,s.end_time FROM schedule_published_shifts s WHERE s.employee_id=? AND s.work_date>=? AND s.work_date<? AND s.code NOT IN ('휴','연')`).bind(id,start,end),
 db.prepare(`SELECT l.work_date,l.leave_type,l.status,r.leave_type AS own_type,r.status AS own_status FROM schedule_leaves l LEFT JOIN employee_leave_requests r ON r.employee_id=l.employee_id AND r.work_date=l.work_date WHERE l.employee_id=? AND l.work_date>=? AND l.work_date<?`).bind(id,start,end),
 db.prepare('SELECT deadline FROM schedule_deadlines WHERE month=?').bind(month),
 // The applicant list is a read-only view of all active leave, regardless of the
 // request deadline or whether the leave was created by the employee or admin.
 // employee_leave_requests is only needed to decide who may cancel their own leave.
 db.prepare(`SELECT l.work_date,e.name,l.leave_type FROM schedule_leaves l
 JOIN employees e ON e.id=l.employee_id
 WHERE l.work_date>=? AND l.work_date<? AND l.status='active'
 ORDER BY l.work_date,e.name,e.id`).bind(start,end),
 db.prepare("SELECT work_date,COUNT(DISTINCT employee_id) AS n FROM schedule_leaves WHERE work_date>=? AND work_date<? AND status='active' GROUP BY work_date").bind(start,end)
]);const deadline=res[2].results?.[0]?.deadline||'';let quota=null;try{quota=await db.prepare('SELECT max_applicants FROM schedule_leave_limits WHERE month=?').bind(month).first()}catch(e){console.warn('leave quota read failed',String(e))}const days={};for(const x of res[0].results||[]){const row=days[x.work_date]||(days[x.work_date]={});row.code=x.code;row.start=x.start_time||'';row.end=x.end_time||''}for(const x of res[1].results||[]){const row=days[x.work_date]||(days[x.work_date]={});row.leave=x.leave_type;row.status=x.status;row.owned=Boolean(x.own_type&&x.own_type===x.leave_type&&x.own_status==='active'&&x.status==='active')}const applicants={};for(const x of res[3].results||[]){(applicants[x.work_date]||(applicants[x.work_date]=[])).push({name:x.name,type:x.leave_type})}const leaveCounts={};for(const x of res[4].results||[])leaveCounts[x.work_date]=x.n;return {ok:true,month,days,applicants,leaveCounts,maxApplicants:quota?.max_applicants??null,deadline,accepting:leaveAccepting(month,deadline)}}
async function leaveAction(db,id,body){await ensureOwnSchema(db);if(!validDate(body.date))return json({ok:false,error:'잘못된 날짜입니다.'},400);const {date,action}=body;if(!['submit','cancel'].includes(action))return json({ok:false,error:'잘못된 요청입니다.'},400);const month=date.slice(0,7),policy=await db.prepare('SELECT deadline FROM schedule_deadlines WHERE month=?').bind(month).first();
if(!leaveAccepting(month,policy?.deadline||''))return json({ok:false,error:'신청 기간이 종료됐습니다.'},409);const old=await db.prepare(`SELECT l.leave_type,l.status,r.leave_type AS requested_type,r.status AS requested_status FROM schedule_leaves l LEFT JOIN employee_leave_requests r ON l.employee_id=r.employee_id AND l.work_date=r.work_date WHERE l.employee_id=? AND l.work_date=?`).bind(id,date).first();
if(action==='cancel'){
 if(!old||old.status!=='active'||old.requested_status!=='active'||old.requested_type!==old.leave_type)return json({ok:false,error:'본인이 신청한 휴무만 취소할 수 있습니다.'},403);
 const marker=old.leave_type==='full'?'휴':'';
 const stmts=[db.prepare("UPDATE schedule_leaves SET status='cancelled' WHERE employee_id=? AND work_date=? AND status='active'").bind(id,date),db.prepare("UPDATE employee_leave_requests SET status='cancelled' WHERE employee_id=? AND work_date=? AND status='active'").bind(id,date)];
 if(marker)stmts.push(db.prepare('DELETE FROM schedule_shifts WHERE employee_id=? AND work_date=? AND code=?').bind(id,date,marker));await db.batch(stmts);return json({ok:true,status:'cancelled'});
}
if(!['full','am','pm'].includes(body.type))return json({ok:false,error:'휴무 종류를 선택하세요.'},400);
if(old?.status==='active')return json({ok:false,error:'이미 등록된 휴무가 있습니다.'},409);
const shift=await db.prepare('SELECT code FROM schedule_shifts WHERE employee_id=? AND work_date=?').bind(id,date).first();
if(shift&&shift.code!=='휴'&&shift.code!=='연')return json({ok:false,error:'이미 근무가 배정되어 있어 관리자 확인이 필요합니다.'},409);
if(shift?.code==='연')return json({ok:false,error:'연차로 지정된 날짜입니다.'},409);
let quota=null;try{quota=await db.prepare('SELECT max_applicants FROM schedule_leave_limits WHERE month=?').bind(month).first()}catch(e){console.warn('leave quota read failed',String(e))}const max=quota?.max_applicants??null;
// The guarded INSERT and dependent writes share one D1 batch/transaction.
// A full day, AM, PM or annual leave uses one daily place per active employee.
const stmts=[
 db.prepare(`INSERT INTO schedule_leaves(employee_id,work_date,leave_type,status)
   SELECT ?,?,?,'active' WHERE (? IS NULL OR (SELECT COUNT(DISTINCT employee_id) FROM schedule_leaves WHERE work_date=? AND status='active') < ?)
   ON CONFLICT(employee_id,work_date) DO UPDATE SET leave_type=excluded.leave_type,status='active' WHERE schedule_leaves.status='cancelled'`).bind(id,date,body.type,max,date,max),
 db.prepare(`INSERT INTO employee_leave_requests(employee_id,work_date,leave_type,status,requested_at)
   SELECT ?,?,?,'active',CURRENT_TIMESTAMP WHERE EXISTS (
     SELECT 1 FROM schedule_leaves WHERE employee_id=? AND work_date=? AND leave_type=? AND status='active')
   ON CONFLICT(employee_id,work_date) DO UPDATE SET leave_type=excluded.leave_type,status='active',requested_at=CURRENT_TIMESTAMP`).bind(id,date,body.type,id,date,body.type)
];
if(body.type==='full')stmts.push(db.prepare(`INSERT INTO schedule_shifts(employee_id,work_date,code)
 SELECT ?,?,'휴' WHERE EXISTS (SELECT 1 FROM employee_leave_requests WHERE employee_id=? AND work_date=? AND leave_type='full' AND status='active')
 ON CONFLICT(employee_id,work_date) DO UPDATE SET code='휴'`).bind(id,date,id,date));
else stmts.push(db.prepare(`DELETE FROM schedule_shifts WHERE employee_id=? AND work_date=? AND code='휴'
 AND EXISTS (SELECT 1 FROM employee_leave_requests WHERE employee_id=? AND work_date=? AND status='active')`).bind(id,date,id,date));
const results=await db.batch(stmts);
if((results[0]?.meta?.changes??0)===0)return json({ok:false,error:'해당 날짜의 휴무 신청 정원이 찼습니다.'},409);
return json({ok:true,status:'active'});
}
export default {async fetch(request,env){const url=new URL(request.url),path=url.pathname,method=request.method;
if(method==='GET'&&(path==='/'||path==='/index.html'))return new Response(PAGE,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow'}});
if(path==='/health')return json({ok:true,mode:'employee-accounts-test',database:!!env.DB});
if(!path.startsWith('/api/'))return new Response('Not found',{status:404});
if(!env.DB)return json({ok:false,error:'D1 바인딩 DB가 없습니다.'},503);

if(method==='POST'){
 const origin=request.headers.get('origin');if(origin&&origin!==url.origin)return json({ok:false,error:'허용되지 않은 출처입니다.'},403);
 if(request.headers.get('X-Requested-With')!=='EmployeeCalendar')return json({ok:false,error:'허용되지 않은 요청입니다.'},403);
}
try{
 await ensureAccountSchema(env.DB);
 if(path==='/api/login'&&method==='POST')return login(env.DB,await readBody(request));
 if(path==='/api/logout'&&method==='POST'){
   const token=getSessionToken(request);
   if(token)await env.DB.prepare('DELETE FROM employee_login_sessions WHERE token_hash=?').bind(await sha256(token)).run();
   return json({ok:true},200,{'Set-Cookie':sessionCookie('',0)});
 }
 const id=await sessionId(request,env.DB);if(!id)return json({ok:false,error:'로그인이 필요합니다.'},401);
 const person=await me(env.DB,id);if(!person)return json({ok:false,error:'활성 직원이 아닙니다.'},403);
 if(path==='/api/export-month'&&method==='GET'){
  const month=url.searchParams.get('month');if(!MONTH_RE.test(month||''))return json({ok:false,error:'잘못된 월입니다.'},400);
  await ensurePublishedReadSchema(env.DB);
  const pub=await env.DB.prepare('SELECT published_at FROM schedule_publications WHERE month=?').bind(month).first();
  if(!pub)return json({ok:false,error:'아직 배포된 근무표가 없습니다.'},409);
  const start=month+'-01',end=monthEnd(month);
  const shifts=await env.DB.prepare('SELECT work_date,code,start_time,end_time FROM schedule_published_shifts WHERE employee_id=? AND work_date>=? AND work_date<? ORDER BY work_date').bind(id,start,end).all();
  return json({ok:true,month,name:person.name,publishedAt:pub.published_at,shifts:shifts.results||[]});
 }
 if(path==='/api/me'&&method==='GET')return json({ok:true,person:{name:person.name}});
 if(path==='/api/month'&&method==='GET'){
  const month=url.searchParams.get('month');if(!MONTH_RE.test(month||''))return json({ok:false,error:'잘못된 월입니다.'},400);
  return json(await getMonth(env.DB,id,month));
 }
 if(path==='/api/leave'&&method==='POST')return leaveAction(env.DB,id,await readBody(request));
 return json({ok:false,error:'Not found'},404);
}catch(e){return json({ok:false,error:e?.message||'서버 처리 오류'},500)}
}};

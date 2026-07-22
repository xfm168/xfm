import{o as e}from"./rolldown-runtime-DAXXjFlN.js";import{m as t}from"./auth-DyO5HVg_.js";import{t as n}from"./index-2PKH3K0u.js";import"./FeatureCard-ChwcYVHr.js";import"./ScoreBar-CmweeUpx.js";import{t as r}from"./Modal-BnVoalPM.js";var i=n();function a({score:e,label:t=`玄风指数`,size:n=120,strokeWidth:r=8,className:a=``}){let o=(n-r)/2,s=2*Math.PI*o,c=Math.max(0,Math.min(100,e))/100*s;return(0,i.jsx)(`div`,{className:[`xbiz-score-ring`,a].filter(Boolean).join(` `),style:{width:n,height:n},children:(0,i.jsxs)(`svg`,{viewBox:`0 0 ${n} ${n}`,className:`xbiz-score-ring__svg`,children:[(0,i.jsxs)(`defs`,{children:[(0,i.jsxs)(`linearGradient`,{id:`xbiz-score-gradient`,x1:`0%`,y1:`0%`,x2:`100%`,y2:`100%`,children:[(0,i.jsx)(`stop`,{offset:`0%`,stopColor:`#B8860B`}),(0,i.jsx)(`stop`,{offset:`50%`,stopColor:`#D4AF37`}),(0,i.jsx)(`stop`,{offset:`100%`,stopColor:`#E8C56A`})]}),(0,i.jsxs)(`filter`,{id:`xbiz-score-glow`,x:`-50%`,y:`-50%`,width:`200%`,height:`200%`,children:[(0,i.jsx)(`feGaussianBlur`,{stdDeviation:`2`,result:`blur`}),(0,i.jsxs)(`feMerge`,{children:[(0,i.jsx)(`feMergeNode`,{in:`blur`}),(0,i.jsx)(`feMergeNode`,{in:`SourceGraphic`})]})]})]}),(0,i.jsx)(`circle`,{cx:n/2,cy:n/2,r:o,className:`xbiz-score-ring__bg`,strokeWidth:r}),(0,i.jsx)(`circle`,{cx:n/2,cy:n/2,r:o,className:`xbiz-score-ring__fg`,stroke:`url(#xbiz-score-gradient)`,strokeWidth:r,strokeDasharray:`${c} ${s}`,strokeDashoffset:s*.25,filter:`url(#xbiz-score-glow)`}),(0,i.jsx)(`text`,{x:n/2,y:n/2-2,className:`xbiz-score-ring__num`,textAnchor:`middle`,children:e}),(0,i.jsx)(`text`,{x:n/2,y:n/2+16,className:`xbiz-score-ring__label`,textAnchor:`middle`,children:t})]})})}var o=e(t(),1);function s(e){return e.version===`3.2`}var c=1080,l=1920,u={bgPrimary:`#071629`,bgSecondary:`#0B1F3B`,goldLight:`#E8C56A`,gold:`#D4AF37`,goldDark:`#B8860B`,textPrimary:`#F5F1E8`,textSecondary:`#B8C4D6`,textMuted:`#6B7D94`,border:`rgba(212, 175, 55, 0.3)`,success:`#6B9E7A`,warning:`#C4A24A`,error:`#C46060`};function d(e){return e>=90?{label:`极佳`,color:u.success,emoji:`🌟`}:e>=80?{label:`优良`,color:u.goldLight,emoji:`✨`}:e>=70?{label:`良好`,color:u.gold,emoji:`👍`}:e>=60?{label:`一般`,color:u.warning,emoji:`⚠️`}:{label:`待改善`,color:u.error,emoji:`🔧`}}function f(e){return new Promise((t,n)=>{let r=new Image;r.crossOrigin=`anonymous`,r.onload=()=>t(r),r.onerror=n,r.src=e})}function p(e,t,n,r,i,a){e.beginPath(),e.moveTo(t+a,n),e.lineTo(t+r-a,n),e.quadraticCurveTo(t+r,n,t+r,n+a),e.lineTo(t+r,n+i-a),e.quadraticCurveTo(t+r,n+i,t+r-a,n+i),e.lineTo(t+a,n+i),e.quadraticCurveTo(t,n+i,t,n+i-a),e.lineTo(t,n+a),e.quadraticCurveTo(t,n,t+a,n),e.closePath()}function m(e,t,n,r,i,a){let o=t.split(``),s=``,c=r,l=0;for(let t=0;t<o.length;t++){let r=s+o[t];e.measureText(r).width>i&&s!==``?(e.fillText(s,n,c),s=o[t],c+=a,l++):s=r}return s&&(e.fillText(s,n,c),l++),l}function h(e,t){let n=document.createElement(`canvas`);n.width=e,n.height=t;let r=n.getContext(`2d`);if(!r)throw Error(`Canvas 2D 上下文创建失败`);return{canvas:n,ctx:r}}async function g(e,t={}){let{width:n=c,height:r=l,quality:i=.92,format:a=`jpeg`}=t,{canvas:o,ctx:d}=h(n,r),f=d.createLinearGradient(0,0,0,r);f.addColorStop(0,`#0A1A2F`),f.addColorStop(.5,`#0D2240`),f.addColorStop(1,`#071629`),d.fillStyle=f,d.fillRect(0,0,n,r),_(d,n,r);let p=80;p=v(d,n,p),d.fillStyle=u.textSecondary,d.font=`32px sans-serif`,d.textAlign=`center`,d.fillText(e.roomName,n/2,p),p+=60,p=await y(d,e.imageData,n,p),p=b(d,e.overallScore,n,p);let m=[];m.push(`可信度 ${e.credibility.score} 分`),s(e)&&m.push(`发现 ${e.issueCount} 个问题`),d.fillStyle=u.textMuted,d.font=`26px sans-serif`,d.textAlign=`center`,d.fillText(m.join(`  ·  `),n/2,p),p+=60,d.strokeStyle=u.border,d.lineWidth=1,d.beginPath(),d.moveTo(120,p),d.lineTo(n-120,p),d.stroke(),p+=50,p=x(d,e.mainIssues.slice(0,3),n,p),S(d,n,r);let g=a===`jpeg`?`image/jpeg`:`image/png`;return o.toDataURL(g,i)}function _(e,t,n){[{x:t*.1,y:n*.08,r:80,alpha:.08},{x:t*.9,y:n*.15,r:120,alpha:.06},{x:t*.05,y:n*.7,r:100,alpha:.05},{x:t*.95,y:n*.85,r:90,alpha:.07}].forEach(t=>{let n=e.createRadialGradient(t.x,t.y,0,t.x,t.y,t.r);n.addColorStop(0,`rgba(212, 175, 55, ${t.alpha})`),n.addColorStop(1,`rgba(212, 175, 55, 0)`),e.fillStyle=n,e.beginPath(),e.arc(t.x,t.y,t.r,0,Math.PI*2),e.fill()})}function v(e,t,n){let r=t/2,i=n+50,a=e.createRadialGradient(r,i,0,r,i,50);return a.addColorStop(0,u.goldLight),a.addColorStop(1,u.goldDark),e.fillStyle=a,e.beginPath(),e.arc(r,i,50,0,Math.PI*2),e.fill(),e.fillStyle=u.bgPrimary,e.font=`bold 48px serif`,e.textAlign=`center`,e.textBaseline=`middle`,e.fillText(`☯`,r,i),e.textBaseline=`alphabetic`,e.fillStyle=u.textPrimary,e.font=`bold 56px sans-serif`,e.textAlign=`center`,e.fillText(`玄风门`,r,i+50+70),e.fillStyle=u.gold,e.font=`28px sans-serif`,e.fillText(`风水勘测报告`,r,i+50+120),i+50+170}async function y(e,t,n,r){let i=n-160,a=r;e.save(),p(e,80,a,i,540,24),e.fillStyle=`rgba(255, 255, 255, 0.05)`,e.fill(),e.strokeStyle=u.border,e.lineWidth=2,e.stroke(),e.clip();try{let n=await f(t),r=Math.max(i/n.width,540/n.height),o=n.width*r,s=n.height*r,c=80+(i-o)/2,l=a+(540-s)/2;e.drawImage(n,c,l,o,s)}catch{e.fillStyle=u.textMuted,e.font=`32px sans-serif`,e.textAlign=`center`,e.fillText(`图片加载中`,80+i/2,a+540/2)}return e.restore(),r+540+40}function b(e,t,n,r){let i=n/2,a=d(t);return e.fillStyle=a.color,e.font=`28px sans-serif`,e.textAlign=`center`,e.fillText(`${a.emoji} ${a.label}`,i,r),e.fillStyle=u.goldLight,e.font=`bold 160px sans-serif`,e.textAlign=`center`,e.textBaseline=`middle`,e.fillText(String(t),i,r+100),e.textBaseline=`alphabetic`,e.fillStyle=u.textSecondary,e.font=`32px sans-serif`,e.fillText(`分`,i+100,r+100),r+200}function x(e,t,n,r){let i=n-160;if(e.fillStyle=u.textPrimary,e.font=`bold 34px sans-serif`,e.textAlign=`left`,e.fillText(`核心问题`,80,r),r+=20,t.length===0)return e.fillStyle=u.textMuted,e.font=`28px sans-serif`,e.fillText(`未发现明显问题，格局良好`,80,r+40),r+80;let a=r+50;return t.forEach((t,n)=>{e.fillStyle=n===0?u.error:n===1?u.warning:u.gold,e.beginPath(),e.arc(100,a-8,16,0,Math.PI*2),e.fill(),e.fillStyle=u.bgPrimary,e.font=`bold 22px sans-serif`,e.textAlign=`center`,e.textBaseline=`middle`,e.fillText(String(n+1),100,a-8),e.textBaseline=`alphabetic`,e.textAlign=`left`,e.fillStyle=u.textPrimary,e.font=`28px sans-serif`;let r=m(e,t,135,a,i-70,40);a+=r*40+20}),a+40}function S(e,t,n){let r=t/2,i=n-340,a=r-180/2;e.fillStyle=`#FFFFFF`,p(e,a,i,180,180,12),e.fill(),e.strokeStyle=u.border,e.lineWidth=2,e.stroke(),e.strokeStyle=`#333`,e.lineWidth=1;for(let t=0;t<10;t++)for(let n=0;n<10;n++)Math.random()>.5&&(e.fillStyle=`#222`,e.fillRect(a+t*18,i+n*18,18,18));[[0,0],[126,0],[0,126]].forEach(([t,n])=>{e.fillStyle=`#222`,e.fillRect(a+t,i+n,54,54),e.fillStyle=`#FFF`,e.fillRect(a+t+18*.5,i+n+18*.5,36,36),e.fillStyle=`#222`,e.fillRect(a+t+18,i+n+18,18,18)}),e.fillStyle=u.textSecondary,e.font=`26px sans-serif`,e.textAlign=`center`,e.fillText(`扫码查看完整报告`,r,i+180+45),e.fillStyle=u.textMuted,e.font=`22px sans-serif`,e.fillText(`玄风门 · 专业风水勘测`,r,n-80),e.fillStyle=u.gold,e.font=`20px sans-serif`,e.fillText(`xuanfengmen.com`,r,n-50)}function C(e,t=`general`){let n=d(e.overallScore),r=e.mainIssues.slice(0,3),i=s(e);switch(t){case`wechat`:return w(e,n,r,i);case`moments`:return T(e,n,r,i);case`xiaohongshu`:return E(e,n,r,i);default:return D(e,n,r,i)}}function w(e,t,n,r){return[`${t.emoji} 【玄风门风水勘测】`,``,`📍 ${e.roomName}`,`📊 综合评分：${e.overallScore} 分（${t.label}）`,`🎯 可信度：${e.credibility.score} 分`,r?`🔍 发现问题：${e.issueCount} 个`:``,``,`⚠️ 核心问题：`,...n.map((e,t)=>`  ${t+1}. ${e}`),``,`💡 建议：下载玄风门 APP 查看完整整改方案`,``,`—— 玄风门 · 让风水更科学 ——`].filter(Boolean).join(`
`)}function T(e,t,n,r){return(e.overallScore>=80?[`${t.emoji} 家里风水居然这么好！`,``,`刚用玄风门测了一下${e.roomName}，`,`综合评分 ${e.overallScore} 分！${t.label}水平！`,``,...n.map(e=>`✅ ${e}`),``,`推荐大家也测测看～`,`#玄风门 #风水 #家居`]:[`${t.emoji} 原来我家风水有这些问题...`,``,`用玄风门测了${e.roomName}，`,`评分 ${e.overallScore} 分，${t.label}。`,r?`发现了 ${e.issueCount} 个问题。`:``,``,`⚠️ 主要问题：`,...n.map(e=>`  • ${e}`),``,`准备按照建议整改一下，期待效果！`,`#玄风门 #风水 #家居改造`]).filter(Boolean).join(`
`)}function E(e,t,n,r){return(e.overallScore>=80?[`🏮 姐妹们！我家风水居然有${e.overallScore}分！`,``,`最近被安利了玄风门这个APP，`,`抱着试一试的心态测了我家`+e.roomName+`，`,`结果居然有${e.overallScore}分！${t.label}！🎉`,``,`✨ 优点盘点：`,...n.map((e,t)=>`${t+1}. ${e}`),``,`有兴趣的姐妹可以试试～`,`测完回来告诉我你们家多少分呀～`,``,`#风水 #家居 #玄风门 #好物分享`,`#居家好物 #生活小技巧`]:[`💔 测完我家风水，我沉默了...`,``,`跟风下了玄风门，测了下我家`+e.roomName+`，`,`只有${e.overallScore}分...${t.label}`,r?`足足有${e.issueCount}个问题...`:``,``,`😣 踩雷清单：`,...n.map((e,t)=>`${t+1}. ${e}`),``,`已经在看整改方案了，`,`改完再来更新效果！有同款的姐妹吗？`,``,`#风水 #家居改造 #玄风门 #踩雷`,`#居家避坑 #装修干货`]).filter(Boolean).join(`
`)}function D(e,t,n,r){return[`【玄风门 · 风水勘测报告】`,``,`空间名称：${e.roomName}`,`空间类型：${e.roomType}`,`综合评分：${e.overallScore} 分（${t.label}）`,`分析可信度：${e.credibility.score} 分`,r?`问题数量：${e.issueCount} 个`:``,``,`核心问题：`,...n.map((e,t)=>`${t+1}. ${e}`),``,`分析时间：${new Date(e.createdAt).toLocaleString(`zh-CN`)}`,``,`—— 来自玄风门 xuanfengmen.com`].filter(Boolean).join(`
`)}function O(e){let t=d(e.overallScore),n=s(e),r=e.mainIssues.slice(0,5),i=e.remediationPlans.slice(0,3),a=``;return n&&(a=`
      <div class="section">
        <h3>📊 12 维评分</h3>
        <div class="dim-grid">
          ${e.score12DDetails.slice(0,6).map(e=>`
            <div class="dim-item">
              <span class="dim-name">${e.name}</span>
              <span class="dim-score">${e.score}</span>
            </div>
          `).join(``)}
        </div>
      </div>
    `),`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>玄风门风水报告 - ${e.roomName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(180deg, #0A1A2F 0%, #071629 100%);
      color: #F5F1E8;
      min-height: 100vh;
      padding: 20px;
    }
    .report-container {
      max-width: 600px;
      margin: 0 auto;
      background: rgba(11, 31, 59, 0.85);
      border-radius: 16px;
      padding: 32px;
      border: 1px solid rgba(212, 175, 55, 0.2);
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
    }
    .logo {
      font-size: 48px;
      margin-bottom: 8px;
    }
    .title {
      font-size: 28px;
      color: #D4AF37;
      margin-bottom: 4px;
    }
    .subtitle {
      font-size: 14px;
      color: #6B7D94;
    }
    .room-info {
      text-align: center;
      margin-bottom: 24px;
    }
    .room-name {
      font-size: 20px;
      color: #F5F1E8;
      margin-bottom: 16px;
    }
    .score-display {
      text-align: center;
      padding: 24px;
      background: rgba(212, 175, 55, 0.08);
      border-radius: 12px;
      margin-bottom: 24px;
    }
    .score-value {
      font-size: 72px;
      font-weight: bold;
      color: #E8C56A;
      line-height: 1;
    }
    .score-unit {
      font-size: 20px;
      color: #B8C4D6;
    }
    .score-level {
      margin-top: 8px;
      font-size: 16px;
      color: ${t.color};
    }
    .meta-row {
      display: flex;
      justify-content: center;
      gap: 24px;
      margin-bottom: 24px;
      font-size: 14px;
      color: #6B7D94;
    }
    .section {
      margin-bottom: 24px;
    }
    .section h3 {
      font-size: 18px;
      color: #F5F1E8;
      margin-bottom: 12px;
      padding-left: 10px;
      border-left: 3px solid #D4AF37;
    }
    .issue-list {
      list-style: none;
    }
    .issue-item {
      padding: 12px;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 8px;
      margin-bottom: 8px;
      display: flex;
      gap: 10px;
      align-items: flex-start;
    }
    .issue-num {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #C46060;
      color: #fff;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .issue-text {
      font-size: 14px;
      line-height: 1.6;
      color: #B8C4D6;
    }
    .plan-list {
      list-style: none;
    }
    .plan-item {
      padding: 12px;
      background: rgba(107, 158, 122, 0.08);
      border-radius: 8px;
      margin-bottom: 8px;
      font-size: 14px;
      line-height: 1.6;
      color: #B8C4D6;
    }
    .dim-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    .dim-item {
      padding: 10px;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 8px;
      text-align: center;
    }
    .dim-name {
      display: block;
      font-size: 12px;
      color: #6B7D94;
      margin-bottom: 4px;
    }
    .dim-score {
      font-size: 20px;
      font-weight: bold;
      color: #D4AF37;
    }
    .footer {
      text-align: center;
      margin-top: 32px;
      padding-top: 20px;
      border-top: 1px solid rgba(212, 175, 55, 0.1);
      font-size: 12px;
      color: #6B7D94;
    }
    .footer-brand {
      color: #D4AF37;
      margin-bottom: 4px;
    }
  </style>
</head>
<body>
  <div class="report-container">
    <div class="header">
      <div class="logo">☯</div>
      <div class="title">玄风门</div>
      <div class="subtitle">风水勘测精简报告</div>
    </div>

    <div class="room-info">
      <div class="room-name">📍 ${e.roomName}</div>
    </div>

    <div class="score-display">
      <span class="score-value">${e.overallScore}</span>
      <span class="score-unit">分</span>
      <div class="score-level">${t.emoji} ${t.label}</div>
    </div>

    <div class="meta-row">
      <span>可信度 ${e.credibility.score} 分</span>
      ${n?`<span>${e.issueCount} 个问题</span>`:``}
    </div>

    ${a}

    ${r.length>0?`
    <div class="section">
      <h3>⚠️ 核心问题</h3>
      <ul class="issue-list">
        ${r.map((e,t)=>`
          <li class="issue-item">
            <span class="issue-num">${t+1}</span>
            <span class="issue-text">${e}</span>
          </li>
        `).join(``)}
      </ul>
    </div>
    `:``}

    ${i.length>0?`
    <div class="section">
      <h3>💡 整改建议</h3>
      <ul class="plan-list">
        ${i.map(e=>`
          <li class="plan-item">${e}</li>
        `).join(``)}
      </ul>
    </div>
    `:``}

    <div class="footer">
      <div class="footer-brand">玄风门 · 让风水更科学</div>
      <div>本报告由玄风门自动生成 · xuanfengmen.com</div>
      <div style="margin-top: 4px;">生成时间：${new Date(e.createdAt).toLocaleString(`zh-CN`)}</div>
    </div>
  </div>
</body>
</html>
  `.trim()}async function k(e,t={}){try{let{filename:n,...r}=t,i=await g(e,r),a=document.createElement(`a`);return a.href=i,a.download=n||`玄风门风水报告_${e.roomName}_${Date.now()}.${r.format===`png`?`png`:`jpg`}`,document.body.appendChild(a),a.click(),document.body.removeChild(a),!0}catch(e){return console.error(`分享海报下载失败：`,e),!1}}async function A(e){try{if(navigator.clipboard&&navigator.clipboard.writeText)return await navigator.clipboard.writeText(e),!0;let t=document.createElement(`textarea`);t.value=e,t.style.position=`fixed`,t.style.opacity=`0`,document.body.appendChild(t),t.select();let n=document.execCommand(`copy`);return document.body.removeChild(t),n}catch{return!1}}function j(e){return`${typeof window<`u`?`${window.location.origin}/share`:`https://xuanfengmen.com/share`}?${new URLSearchParams({id:e.id,name:e.roomName,score:String(e.overallScore)}).toString()}`}async function M(e,t=`general`){if(!navigator.share)return!1;try{let n=C(e,t);return await navigator.share({title:`玄风门风水报告 - ${e.roomName}`,text:n,url:j(e)}),!0}catch{return!1}}function N({open:e,onClose:t,record:n}){let[a,s]=(0,o.useState)(`image`),[c,l]=(0,o.useState)(``),[u,d]=(0,o.useState)(!1),[f,p]=(0,o.useState)(``),[m,h]=(0,o.useState)(``),_=(0,o.useCallback)(async()=>{if(c)return c;d(!0);try{let e=await g(n);return l(e),e}catch(e){return console.error(`海报生成失败：`,e),``}finally{d(!1)}},[n,c]);(0,o.useCallback)(async()=>{e&&!c&&a===`image`&&_()},[e,c,a,_]);let v=(0,o.useCallback)(e=>{s(e),e===`image`&&!c&&_()},[c,_]),y=(0,o.useCallback)(async()=>{await k(n)&&(p(`image`),setTimeout(()=>p(``),2e3))},[n]),b=(0,o.useCallback)(async e=>{await A(C(n,e))&&(p(`text-${e}`),setTimeout(()=>p(``),2e3))},[n]),x=(0,o.useCallback)(async()=>{await A(j(n))&&(p(`link`),setTimeout(()=>p(``),2e3))},[n]),S=(0,o.useCallback)(async()=>{await A(O(n))&&(p(`report`),setTimeout(()=>p(``),2e3))},[n]),w=(0,o.useCallback)(()=>{let e=j(n);h(e),s(`image`)},[n]),T=(0,o.useCallback)(async()=>{await M(n,`moments`)||(b(`moments`),y())},[n,b,y]),E=(0,o.useCallback)(async()=>{await M(n,`xiaohongshu`)||(b(`xiaohongshu`),y())},[n,b,y]);return(0,i.jsx)(r,{open:e,onClose:t,title:`分享报告`,className:`share-panel-modal`,children:(0,i.jsxs)(`div`,{className:`share-panel`,children:[(0,i.jsxs)(`div`,{className:`share-tabs`,children:[(0,i.jsxs)(`button`,{className:`share-tab ${a===`image`?`active`:``}`,onClick:()=>v(`image`),children:[(0,i.jsx)(`span`,{className:`share-tab-icon`,children:`🖼️`}),(0,i.jsx)(`span`,{children:`图片海报`})]}),(0,i.jsxs)(`button`,{className:`share-tab ${a===`text`?`active`:``}`,onClick:()=>v(`text`),children:[(0,i.jsx)(`span`,{className:`share-tab-icon`,children:`📝`}),(0,i.jsx)(`span`,{children:`分享文案`})]}),(0,i.jsxs)(`button`,{className:`share-tab ${a===`link`?`active`:``}`,onClick:()=>v(`link`),children:[(0,i.jsx)(`span`,{className:`share-tab-icon`,children:`🔗`}),(0,i.jsx)(`span`,{children:`链接报告`})]})]}),a===`image`&&(0,i.jsxs)(`div`,{className:`share-content`,children:[(0,i.jsx)(`div`,{className:`poster-preview-wrap`,children:u?(0,i.jsxs)(`div`,{className:`poster-loading`,children:[(0,i.jsx)(`div`,{className:`poster-spinner`}),(0,i.jsx)(`span`,{children:`生成海报中...`})]}):c?(0,i.jsx)(`img`,{src:c,alt:`分享海报`,className:`poster-preview`}):(0,i.jsxs)(`div`,{className:`poster-placeholder`,children:[(0,i.jsx)(`span`,{className:`placeholder-icon`,children:`🖼️`}),(0,i.jsx)(`span`,{children:`点击下方按钮生成海报`})]})}),(0,i.jsxs)(`div`,{className:`share-quick-buttons`,children:[(0,i.jsxs)(`button`,{className:`share-quick-btn wechat`,onClick:w,title:`分享到微信`,children:[(0,i.jsx)(`span`,{className:`quick-btn-icon`,children:`💬`}),(0,i.jsx)(`span`,{className:`quick-btn-label`,children:`微信`})]}),(0,i.jsxs)(`button`,{className:`share-quick-btn moments`,onClick:T,title:`分享到朋友圈`,children:[(0,i.jsx)(`span`,{className:`quick-btn-icon`,children:`🌙`}),(0,i.jsx)(`span`,{className:`quick-btn-label`,children:`朋友圈`})]}),(0,i.jsxs)(`button`,{className:`share-quick-btn xiaohongshu`,onClick:E,title:`分享到小红书`,children:[(0,i.jsx)(`span`,{className:`quick-btn-icon`,children:`📕`}),(0,i.jsx)(`span`,{className:`quick-btn-label`,children:`小红书`})]}),(0,i.jsxs)(`button`,{className:`share-quick-btn save`,onClick:y,title:`保存图片`,children:[(0,i.jsx)(`span`,{className:`quick-btn-icon`,children:`💾`}),(0,i.jsx)(`span`,{className:`quick-btn-label`,children:f===`image`?`已保存`:`保存`})]})]}),!c&&!u&&(0,i.jsx)(`button`,{className:`share-generate-btn`,onClick:_,children:`生成分享海报`})]}),a===`text`&&(0,i.jsxs)(`div`,{className:`share-content`,children:[(0,i.jsxs)(`div`,{className:`share-text-section`,children:[(0,i.jsx)(`h4`,{className:`share-section-title`,children:`选择平台风格`}),(0,i.jsxs)(`div`,{className:`share-text-platforms`,children:[(0,i.jsxs)(`button`,{className:`platform-btn ${f===`text-wechat`?`copied`:``}`,onClick:()=>b(`wechat`),children:[(0,i.jsx)(`span`,{className:`platform-icon`,children:`💬`}),(0,i.jsx)(`span`,{className:`platform-name`,children:`微信`}),(0,i.jsx)(`span`,{className:`platform-action`,children:f===`text-wechat`?`✓ 已复制`:`复制文案`})]}),(0,i.jsxs)(`button`,{className:`platform-btn ${f===`text-moments`?`copied`:``}`,onClick:()=>b(`moments`),children:[(0,i.jsx)(`span`,{className:`platform-icon`,children:`🌙`}),(0,i.jsx)(`span`,{className:`platform-name`,children:`朋友圈`}),(0,i.jsx)(`span`,{className:`platform-action`,children:f===`text-moments`?`✓ 已复制`:`复制文案`})]}),(0,i.jsxs)(`button`,{className:`platform-btn ${f===`text-xiaohongshu`?`copied`:``}`,onClick:()=>b(`xiaohongshu`),children:[(0,i.jsx)(`span`,{className:`platform-icon`,children:`📕`}),(0,i.jsx)(`span`,{className:`platform-name`,children:`小红书`}),(0,i.jsx)(`span`,{className:`platform-action`,children:f===`text-xiaohongshu`?`✓ 已复制`:`复制文案`})]}),(0,i.jsxs)(`button`,{className:`platform-btn ${f===`text-general`?`copied`:``}`,onClick:()=>b(`general`),children:[(0,i.jsx)(`span`,{className:`platform-icon`,children:`📋`}),(0,i.jsx)(`span`,{className:`platform-name`,children:`通用版`}),(0,i.jsx)(`span`,{className:`platform-action`,children:f===`text-general`?`✓ 已复制`:`复制文案`})]})]})]}),(0,i.jsxs)(`div`,{className:`share-text-preview`,children:[(0,i.jsx)(`h4`,{className:`share-section-title`,children:`文案预览`}),(0,i.jsx)(`div`,{className:`text-preview-box`,children:(0,i.jsx)(`pre`,{children:C(n,`general`)})})]})]}),a===`link`&&(0,i.jsxs)(`div`,{className:`share-content`,children:[(0,i.jsxs)(`div`,{className:`share-link-section`,children:[(0,i.jsx)(`h4`,{className:`share-section-title`,children:`分享链接`}),(0,i.jsxs)(`div`,{className:`link-box`,children:[(0,i.jsx)(`span`,{className:`link-text`,children:j(n)}),(0,i.jsx)(`button`,{className:`link-copy-btn ${f===`link`?`copied`:``}`,onClick:x,children:f===`link`?`已复制`:`复制链接`})]}),(0,i.jsx)(`p`,{className:`link-hint`,children:`复制链接发送给好友，对方打开即可查看报告摘要`})]}),(0,i.jsxs)(`div`,{className:`share-report-section`,children:[(0,i.jsx)(`h4`,{className:`share-section-title`,children:`精简版报告`}),(0,i.jsx)(`p`,{className:`report-desc`,children:`复制 HTML 格式的精简报告，可直接粘贴到邮件或文档中`}),(0,i.jsx)(`button`,{className:`report-copy-btn ${f===`report`?`copied`:``}`,onClick:S,children:f===`report`?`✓ 已复制报告代码`:`复制 HTML 报告`})]})]}),(0,i.jsxs)(`div`,{className:`share-footer`,children:[(0,i.jsxs)(`span`,{children:[`📊 `,n.roomName,` · `,n.overallScore,` 分`]}),(0,i.jsx)(`span`,{className:`share-brand`,children:`玄风门`})]})]})})}export{a as n,N as t};
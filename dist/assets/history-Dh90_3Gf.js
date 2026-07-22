async function e(e,d,f){let p=t();try{return r(p,e),i(p,d.score12D),e.includeRadarChart&&a(p,d.score12D),e.includeAnnotations&&f.length>0&&o(p,f),s(p,d),c(p,d.remediationPlans),e.includeClassical&&l(p,d.classicalInterpretation),u(p,d),await m(p)}finally{n(p)}}function t(){let e=document.createElement(`div`);return e.style.cssText=`
    position: fixed;
    left: -9999px;
    top: 0;
    width: 794px;
    background: #fff;
    font-family: "Noto Sans SC", "Microsoft YaHei", sans-serif;
    color: #1a1a1a;
    line-height: 1.6;
  `,document.body.appendChild(e),e}function n(e){e.parentNode&&e.parentNode.removeChild(e)}function r(e,t){let n=document.createElement(`div`);n.className=`pdf-page pdf-cover`,n.style.cssText=d+`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%);
    color: #fff;
  `;let r=new Date().toLocaleDateString(`zh-CN`,{year:`numeric`,month:`long`,day:`numeric`});n.innerHTML=`
    <div style="margin-bottom: 40px;">
      ${t.logo?`<img src="${t.logo}" style="width: 120px; height: auto;" />`:`<div style="font-size: 64px; font-weight: bold;">玄</div>`}
    </div>
    <h1 style="font-size: 32px; font-weight: bold; margin: 0 0 16px 0; letter-spacing: 4px;">${p(t.title)}</h1>
    <h2 style="font-size: 20px; font-weight: normal; margin: 0 0 40px 0; opacity: 0.9;">${p(t.subtitle)}</h2>
    <div style="font-size: 14px; opacity: 0.7;">生成日期：${r}</div>
    <div style="font-size: 12px; opacity: 0.5; margin-top: 80px;">玄风门智能风水分析系统 V3.1</div>
  `,e.appendChild(n)}function i(e,t){let n=f(`综合评分`),r=`
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="font-size: 56px; font-weight: bold; color: #1a365d;">${t.overall}</div>
      <div style="font-size: 18px; color: #666; margin-top: 8px;">综合评分 / 100</div>
      <div style="font-size: 16px; color: #2c5282; margin-top: 8px;">评级：${t.level}</div>
    </div>
    <div style="font-size: 14px; color: #333; text-align: center; margin-bottom: 24px;">${p(t.summary)}</div>
    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
      <thead>
        <tr style="background: #edf2f7;">
          <th style="padding: 10px; text-align: left; border-bottom: 2px solid #cbd5e0;">维度</th>
          <th style="padding: 10px; text-align: center; border-bottom: 2px solid #cbd5e0;">评分</th>
          <th style="padding: 10px; text-align: center; border-bottom: 2px solid #cbd5e0;">等级</th>
          <th style="padding: 10px; text-align: left; border-bottom: 2px solid #cbd5e0;">说明</th>
        </tr>
      </thead>
      <tbody>
  `,i=Object.values(t.dimensions);for(let e of i){let t=e.score>=80?`#276749`:e.score>=60?`#c05621`:`#c53030`;r+=`
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${p(e.name)}</td>
        <td style="padding: 10px; text-align: center; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: ${t};">${e.score}</td>
        <td style="padding: 10px; text-align: center; border-bottom: 1px solid #e2e8f0;">${p(e.level)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #666;">${p(e.description)}</td>
      </tr>
    `}r+=`</tbody></table>`,n.innerHTML=r,e.appendChild(n)}function a(e,t){let n=f(`12维雷达图分析`),r=Object.values(t.dimensions),i=Math.PI*2/r.length,a=``,o=``;for(let e=0;e<r.length;e++){let t=e*i-Math.PI/2,n=r[e].score/100,s=200+150*n*Math.cos(t),c=200+150*n*Math.sin(t);a+=`${s},${c} `;let l=200+174*Math.cos(t),u=200+174*Math.sin(t);o+=`<text x="${l}" y="${u}" text-anchor="${l>200?`start`:l<200?`end`:`middle`}" font-size="12" fill="#4a5568">${p(r[e].name)}</text>`}let s=``;for(let e=1;e<=5;e++){let t=150/5*e;s+=`<circle cx="200" cy="200" r="${t}" fill="none" stroke="#e2e8f0" stroke-width="1"/>`}n.innerHTML=`
    <div style="text-align: center;">
      <svg width="400" height="400" viewBox="0 0 400 400" style="margin: 0 auto; display: block;">
        ${s}
        <polygon points="${a.trim()}" fill="rgba(44, 82, 130, 0.2)" stroke="#2c5282" stroke-width="2"/>
        ${o}
      </svg>
      <p style="font-size: 12px; color: #999; margin-top: 16px;">注：此雷达图基于 12 维评分体系自动生成</p>
    </div>
  `,e.appendChild(n)}function o(e,t){let n=f(`空间标注分析`),r=`<div style="font-size: 14px; margin-bottom: 16px;">共识别 ${t.length} 处标注：</div>`;for(let e of t){let t={problem:`#c53030`,risk:`#c05621`,suggestion:`#2c5282`,wealth:`#276749`,health:`#38a169`,career:`#744210`}[e.type]??`#4a5568`;r+=`
      <div style="border-left: 4px solid ${t}; padding: 12px 16px; margin-bottom: 12px; background: #f7fafc;">
        <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px; color: ${t};">
          [${p(e.type)}] ${p(e.label)}
        </div>
        <div style="font-size: 13px; color: #333; margin-bottom: 4px;">${p(e.suggestion)}</div>
        <div style="font-size: 12px; color: #999;">
          严重等级：${e.severity} | 规则：${e.ruleId}
        </div>
      </div>
    `}n.innerHTML=r,e.appendChild(n)}function s(e,t){let n=[{title:`格局分析`,data:t.patternAnalysis},{title:`藏风聚气分析`,data:t.windQiAnalysis},{title:`财位分析`,data:t.wealthAnalysis},{title:`健康影响分析`,data:t.healthAnalysis},{title:`事业影响分析`,data:t.careerAnalysis},{title:`家庭关系分析`,data:t.familyAnalysis}];for(let t of n){let n=f(t.title),r=``;if(t.title===`格局分析`){let e=t.data;r=`
        <div style="margin-bottom: 16px;">
          <h3 style="font-size: 16px; color: #1a365d; margin-bottom: 8px;">格局描述</h3>
          <p style="font-size: 13px; color: #333; line-height: 1.8;">${p(e.description)}</p>
        </div>
        <div style="margin-bottom: 16px;">
          <h3 style="font-size: 16px; color: #1a365d; margin-bottom: 8px;">风水原理</h3>
          <p style="font-size: 13px; color: #333; line-height: 1.8;">${p(e.principle)}</p>
        </div>
        <div style="margin-bottom: 16px;">
          <h3 style="font-size: 16px; color: #1a365d; margin-bottom: 8px;">通俗解释</h3>
          <p style="font-size: 13px; color: #333; line-height: 1.8;">${p(e.explanation)}</p>
        </div>
        ${e.strength.length>0?`<div style="margin-bottom: 8px;"><strong>优势：</strong>${e.strength.map(e=>p(e)).join(`、`)}</div>`:``}
        ${e.weakness.length>0?`<div><strong>不足：</strong>${e.weakness.map(e=>p(e)).join(`、`)}</div>`:``}
      `}else if(t.title===`藏风聚气分析`){let e=t.data;r=`
        <p style="font-size: 13px; color: #333; margin-bottom: 12px; line-height: 1.8;">${p(e.description)}</p>
        <div style="margin-bottom: 8px;"><strong>气流状况：</strong>${p(e.qiFlow)}</div>
        <div style="margin-bottom: 16px;"><strong>藏风效果：</strong>${p(e.windGathering)}</div>
        ${e.suggestions.length>0?`<div style="background: #f0fff4; padding: 12px; border-radius: 4px;"><strong>建议：</strong><ul>${e.suggestions.map(e=>`<li>${p(e)}</li>`).join(``)}</ul></div>`:``}
      `}else if(t.title===`财位分析`){let e=t.data;r=`
        <p style="font-size: 13px; color: #333; margin-bottom: 12px; line-height: 1.8;">${p(e.description)}</p>
        ${e.wealthPositions.length>0?`<div style="margin-bottom: 16px;"><strong>财位分布：</strong></div>`+e.wealthPositions.map(e=>`
          <div style="border: 1px solid #e2e8f0; padding: 10px; margin-bottom: 8px; border-radius: 4px;">
            <div style="font-weight: bold;">${p(e.name)} (${p(e.location)})</div>
            <div style="font-size: 12px; color: #666;">状态：${e.status===`good`?`良好`:e.status===`average`?`一般`:`需改善`}</div>
            <div style="font-size: 12px; color: #666;">建议：${p(e.suggestion)}</div>
          </div>
        `).join(``):`<div style="color: #999;">未检测到特殊财位信息</div>`}
        ${e.suggestions.length>0?`<div style="background: #fffaf0; padding: 12px; border-radius: 4px;"><strong>财运建议：</strong><ul>${e.suggestions.map(e=>`<li>${p(e)}</li>`).join(``)}</ul></div>`:``}
      `}else if(t.title===`健康影响分析`){let e=t.data;r=`
        <p style="font-size: 13px; color: #333; margin-bottom: 12px; line-height: 1.8;">${p(e.description)}</p>
        ${e.healthFactors.length>0?`<div style="margin-bottom: 8px;"><strong>健康影响因素：</strong>${e.healthFactors.map(e=>p(e)).join(`、`)}</div>`:``}
        ${e.riskAreas.length>0?`<div style="margin-bottom: 16px;"><strong style="color: #c53030;">风险区域：</strong>${e.riskAreas.map(e=>p(e)).join(`、`)}</div>`:``}
        ${e.suggestions.length>0?`<div style="background: #fff5f5; padding: 12px; border-radius: 4px;"><strong>健康建议：</strong><ul>${e.suggestions.map(e=>`<li>${p(e)}</li>`).join(``)}</ul></div>`:``}
      `}else if(t.title===`事业影响分析`){let e=t.data;r=`
        <p style="font-size: 13px; color: #333; margin-bottom: 12px; line-height: 1.8;">${p(e.description)}</p>
        ${e.careerFactors.length>0?`<div style="margin-bottom: 8px;"><strong>事业影响因素：</strong>${e.careerFactors.map(e=>p(e)).join(`、`)}</div>`:``}
        ${e.opportunities.length>0?`<div style="margin-bottom: 8px;"><strong style="color: #276749;">机遇：</strong>${e.opportunities.map(e=>p(e)).join(`、`)}</div>`:``}
        ${e.obstacles.length>0?`<div style="margin-bottom: 16px;"><strong style="color: #c53030;">障碍：</strong>${e.obstacles.map(e=>p(e)).join(`、`)}</div>`:``}
        ${e.suggestions.length>0?`<div style="background: #ebf8ff; padding: 12px; border-radius: 4px;"><strong>事业建议：</strong><ul>${e.suggestions.map(e=>`<li>${p(e)}</li>`).join(``)}</ul></div>`:``}
      `}else if(t.title===`家庭关系分析`){let e=t.data;r=`
        <p style="font-size: 13px; color: #333; margin-bottom: 12px; line-height: 1.8;">${p(e.description)}</p>
        ${e.harmonyFactors.length>0?`<div style="margin-bottom: 8px;"><strong style="color: #276749;">和谐因素：</strong>${e.harmonyFactors.map(e=>p(e)).join(`、`)}</div>`:``}
        ${e.tensionAreas.length>0?`<div style="margin-bottom: 16px;"><strong style="color: #c53030;">紧张区域：</strong>${e.tensionAreas.map(e=>p(e)).join(`、`)}</div>`:``}
        ${e.suggestions.length>0?`<div style="background: #faf5ff; padding: 12px; border-radius: 4px;"><strong>家庭建议：</strong><ul>${e.suggestions.map(e=>`<li>${p(e)}</li>`).join(``)}</ul></div>`:``}
      `}n.innerHTML=r,e.appendChild(n)}}function c(e,t){let n=f(`整改方案`);if(t.length===0){n.innerHTML=`<div style="text-align: center; color: #999; padding: 40px;">未生成整改方案</div>`,e.appendChild(n);return}let r=`<div style="font-size: 14px; margin-bottom: 16px;">共 ${t.length} 项整改方案，按优先级排序：</div>`;for(let e=0;e<t.length;e++){let n=t[e],i=n.urgency===`immediate`?`#c53030`:n.urgency===`shortTerm`?`#c05621`:n.urgency===`longTerm`?`#744210`:`#718096`,a=n.urgency===`immediate`?`立即执行`:n.urgency===`shortTerm`?`短期执行`:n.urgency===`longTerm`?`长期规划`:`可选优化`;r+=`
      <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <div style="font-weight: bold; font-size: 15px; color: #1a365d;">${e+1}. ${p(n.issue)}</div>
          <div style="font-size: 12px; color: ${i}; border: 1px solid ${i}; padding: 2px 8px; border-radius: 4px;">${a}</div>
        </div>
        <div style="font-size: 13px; color: #333; margin-bottom: 8px;"><strong>原因：</strong>${p(n.cause)}</div>
        <div style="font-size: 13px; color: #333; margin-bottom: 8px;"><strong>方案：</strong>${p(n.solution.summary)}</div>
        <div style="font-size: 12px; color: #666; margin-bottom: 8px;">
          步骤：${n.solution.steps.map((e,t)=>`${t+1}. ${p(e)}`).join(` `)}
        </div>
        <div style="display: flex; gap: 16px; font-size: 12px; color: #666;">
          <span>难度：${`★`.repeat(n.difficulty)}${`☆`.repeat(5-n.difficulty)}</span>
          <span>成本：${n.cost===`free`?`免费`:n.cost===`low`?`低`:n.cost===`medium`?`中`:n.cost===`high`?`高`:`很高`}</span>
          <span>耗时：${p(n.solution.timeRequired)}</span>
          <span>DIY：${n.solution.diyPossible?`可自行整改`:`建议请专业人士`}</span>
        </div>
        <div style="font-size: 12px; color: #38a169; margin-top: 8px;"><strong>预计效果：</strong>${p(n.expectedEffect)}</div>
        ${n.solution.cautions.length>0?`<div style="font-size: 12px; color: #c05621; margin-top: 8px;"><strong>注意：</strong>${n.solution.cautions.map(e=>p(e)).join(`；`)}</div>`:``}
      </div>
    `}n.innerHTML=r,e.appendChild(n)}function l(e,t){let n=f(`经典理论依据`),r=``;if(t.theories.length===0)r=`<div style="text-align: center; color: #999; padding: 40px;">本报告未引用特定经典理论条目</div>`;else{r=`<div style="font-size: 14px; margin-bottom: 16px;">本报告依据以下经典理论进行分析：</div>`;for(let e of t.theories)r+=`
        <div style="border-left: 3px solid #744210; padding: 12px 16px; margin-bottom: 16px; background: #fffaf0;">
          <div style="font-weight: bold; font-size: 14px; color: #744210; margin-bottom: 6px;">${p(e.name)}</div>
          <div style="font-size: 12px; color: #999; margin-bottom: 6px;">出处：${p(e.source)}</div>
          <div style="font-size: 13px; color: #333; margin-bottom: 8px; line-height: 1.7;">${p(e.content)}</div>
          <div style="font-size: 12px; color: #666;"><strong>应用：</strong>${p(e.application)}</div>
        </div>
      `}t.summary&&(r+=`
      <div style="margin-top: 24px; padding: 16px; background: #f7fafc; border-radius: 4px;">
        <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px; color: #1a365d;">理论总结</div>
        <div style="font-size: 13px; color: #333; line-height: 1.7;">${p(t.summary)}</div>
      </div>
    `),n.innerHTML=r,e.appendChild(n)}function u(e,t){let n=f(`结论与总结`);n.innerHTML=`
    <div style="font-size: 15px; line-height: 1.8; color: #333; margin-bottom: 24px;">
      ${p(t.summary)}
    </div>
    <div style="border-top: 1px solid #e2e8f0; padding-top: 24px;">
      <div style="font-size: 14px; font-weight: bold; color: #1a365d; margin-bottom: 12px;">分析可信度</div>
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
        <div style="font-size: 32px; font-weight: bold; color: #2c5282;">${t.credibility.score}</div>
        <div>
          <div style="font-size: 14px; color: #333;">等级：${t.credibility.level===`veryHigh`?`极高`:t.credibility.level===`high`?`高`:t.credibility.level===`medium`?`中`:t.credibility.level===`low`?`低`:`极低`}</div>
          <div style="font-size: 12px; color: #666;">${p(t.credibility.explanation)}</div>
        </div>
      </div>
    </div>
    <div style="margin-top: 32px; text-align: center; color: #999; font-size: 12px;">
      <div>本报告由玄风门智能风水分析系统 V3.1 自动生成</div>
      <div>仅供参考，重大决策请咨询专业风水师</div>
    </div>
  `,e.appendChild(n)}var d=`
  width: 794px;
  min-height: 1123px;
  padding: 48px 56px;
  box-sizing: border-box;
  page-break-after: always;
  background: #fff;
`;function f(e){let t=document.createElement(`div`);t.className=`pdf-page`,t.style.cssText=d;let n=document.createElement(`div`);n.style.cssText=`border-bottom: 2px solid #1a365d; padding-bottom: 12px; margin-bottom: 24px;`,n.innerHTML=`<div style="font-size: 18px; font-weight: bold; color: #1a365d;">${p(e)}</div>`,t.appendChild(n);let r=document.createElement(`div`);return r.className=`pdf-page-body`,t.appendChild(r),Object.getOwnPropertyDescriptor(Element.prototype,`innerHTML`),Object.defineProperty(t,"innerHTML",{set(t){n.innerHTML=`<div style="font-size: 18px; font-weight: bold; color: #1a365d;">${p(e)}</div>`,r.innerHTML=t},get(){return t.innerHTML},configurable:!0}),t}function p(e){let t=document.createElement(`div`);return t.textContent=e,t.innerHTML}async function m(e){return typeof window.html2canvas==`function`&&typeof window.jspdf?.jsPDF==`function`?h(e):g(e)}async function h(e){let t=window.html2canvas,{jsPDF:n}=window.jspdf,r=e.querySelectorAll(`.pdf-page`),i=new n({unit:`px`,format:`a4`,orientation:`portrait`});for(let e=0;e<r.length;e++){let n=r[e],a=await t(n,{scale:2,useCORS:!0,logging:!1}),o=a.toDataURL(`image/png`),s=i.internal.pageSize.getWidth(),c=a.height*s/a.width;e>0&&i.addPage(),i.addImage(o,`PNG`,0,0,s,c)}return i.output(`datauristring`)}async function g(e){let t=`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>玄风门风水报告</title>
      <style>
        @page { size: A4; margin: 0; }
        body { margin: 0; font-family: "Noto Sans SC", "Microsoft YaHei", sans-serif; }
        .pdf-page { width: 210mm; min-height: 297mm; padding: 20mm; box-sizing: border-box; page-break-after: always; background: #fff; }
        .pdf-page:last-child { page-break-after: auto; }
      </style>
    </head>
    <body>
      ${e.innerHTML}
    </body>
    </html>
  `,n=new Blob([t],{type:`text/html;charset=utf-8`});return URL.createObjectURL(n)}function _(e,t){let n=document.createElement(`a`);n.href=e,n.download=t||`xuanfeng_fengshui_report_${Date.now()}.pdf`,document.body.appendChild(n),n.click(),document.body.removeChild(n)}var v=`xuanfeng_fengshui_history_v3`;function y(){return`fs_`+Date.now().toString(36)+`_`+Math.random().toString(36).slice(2,6)}function b(e){return e.length<=204800*1.4?e:e.slice(0,286720)}function x(e,t,n,r){let i=r.professionalReport,a=r.report,o={id:y(),roomType:e,roomName:t,imageData:b(n),overallScore:a?.overallScore??0,score8D:r.score8D?{pattern:r.score8D.dimensions.pattern.score,windGathering:r.score8D.dimensions.windGathering.score,qiGathering:r.score8D.dimensions.qiGathering.score,mingHall:r.score8D.dimensions.mingHall.score,flowPath:r.score8D.dimensions.flowPath.score,lighting:r.score8D.dimensions.lighting.score,elementHarmony:r.score8D.dimensions.elementHarmony.score,advice:r.score8D.dimensions.advice.score}:void 0,confidenceLevel:i?.confidence.level??`moderate`,confidenceScore:i?.confidence.score??0,mainIssues:i?.issues?.slice(0,3).map(e=>e.title)??[],mainSuggestions:i?.adjustments?.slice(0,3).map(e=>e.issue)??[],createdAt:new Date().toISOString(),analysisDurationMs:r.totalTime},s=[o,...S()].slice(0,50);return localStorage.setItem(v,JSON.stringify(s)),o}function S(){try{let e=localStorage.getItem(v);if(!e)return[];let t=JSON.parse(e);return Array.isArray(t)?t:[]}catch{return[]}}function C(e){let t=S(),n=t.filter(t=>t.id!==e);return n.length===t.length?!1:(localStorage.setItem(v,JSON.stringify(n)),!0)}function w(e){return[`【玄风门 · 风水勘测报告】`,``,`空间类型：${e.roomName}`,`综合评分：${e.overallScore} 分`,`分析可信度：${e.confidenceScore} 分`,``,`主要问题：`,...e.mainIssues.map((e,t)=>`${t+1}. ${e}`),``,`主要建议：`,...e.mainSuggestions.map((e,t)=>`${t+1}. ${e}`),``,`生成时间：${new Date(e.createdAt).toLocaleString(`zh-CN`)}`,``,`—— 来自玄风门 xuanfengmen.com`].join(`
`)}var T=`xuanfeng_fengshui_history_v31`;function E(){return`fsv31_`+Date.now().toString(36)+`_`+Math.random().toString(36).slice(2,8)}function D(e){return e.length<=307200*1.4?e:e.slice(0,430080)}function O(e){return e.length<=50*1024*1.4?e:e.slice(0,71680)}function k(e){let t={id:E(),roomType:e.roomType,roomName:e.roomName,imageData:D(e.imageData),thumbnail:O(e.imageData),overallScore:e.overallScore,score12D:e.score12D,credibility:e.credibility,mainIssues:e.mainIssues.slice(0,5),remediationPlans:e.remediationPlans.slice(0,5),annotations:e.annotations,createdAt:new Date().toISOString(),analysisDurationMs:e.analysisDurationMs,status:`active`,favorite:!1,tags:e.tags??[],notes:``},n=[t,...A()].slice(0,100);return localStorage.setItem(T,JSON.stringify(n)),t}function A(){try{let e=localStorage.getItem(T);if(!e)return[];let t=JSON.parse(e);return Array.isArray(t)?t:[]}catch{return[]}}function j(e){let t=A(),n=t.filter(t=>t.id!==e);return n.length===t.length?!1:(localStorage.setItem(T,JSON.stringify(n)),!0)}function M(e,t){let n=A(),r=!1,i=n.map(n=>n.id===e?(r=!0,t(n)):n);return r?(localStorage.setItem(T,JSON.stringify(i)),!0):!1}function N(e){return M(e,e=>({...e,favorite:!e.favorite}))}function P(e,t){return M(e,e=>({...e,status:t}))}function F(){let e=A(),t={version:`3.1`,exportTime:new Date().toISOString(),count:e.length,records:e};return JSON.stringify(t,null,2)}function I(e){return[`【玄风门 · V3.1 风水勘测报告】`,``,`空间类型：${e.roomName}`,`综合评分：${e.overallScore} 分`,`分析可信度：${e.credibility.score} 分`,`整改状态：${e.status===`active`?`待整改`:e.status===`remediated`?`已整改`:`已归档`}`,``,`主要问题：`,...e.mainIssues.map((e,t)=>`${t+1}. ${e}`),``,`整改方案：`,...e.remediationPlans.map((e,t)=>`${t+1}. ${e}`),``,e.notes?`备注：${e.notes}`:``,``,`生成时间：${new Date(e.createdAt).toLocaleString(`zh-CN`)}`,``,`—— 来自玄风门 xuanfengmen.com`].filter(Boolean).join(`
`)}export{k as a,C as c,x as d,_ as f,A as i,w as l,F as n,N as o,e as p,I as r,P as s,j as t,S as u};
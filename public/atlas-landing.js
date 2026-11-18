
const I = {
  check:'<path d="M20 6 9 17l-5-5"/>',
  arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
  play:'<path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/>',
  x:'<path d="M6 6l12 12M18 6 6 18"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  db:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
  nodes:'<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M8.5 6h7M7.2 8.2l3.6 7.6M16.8 8.2l-3.6 7.6"/>',
  spark:'<path d="M12 3l1.8 4.9L19 9.7l-5.2 1.8L12 16.4l-1.8-4.9L5 9.7l5.2-1.8Z"/><path d="M19 15l.7 1.8L21.5 17.5l-1.8.7L19 20l-.7-1.8-1.8-.7 1.8-.7Z"/>',
  layers:'<path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>',
  box:'<path d="M3 7l9-4 9 4-9 4-9-4Z"/><path d="M3 7v10l9 4 9-4V7M12 11v10"/>',
  bars:'<path d="M4 20V11M10 20V4M16 20v-6M21 20H3"/>',
  shield:'<path d="M12 3 4 6v6c0 5 3.4 8.3 8 9 4.6-.7 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/>',
  audit:'<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
  scale:'<path d="M12 3v18M6 21h12M5 7h14"/><path d="m5 7-3 7a3 3 0 0 0 6 0L5 7ZM19 7l-3 7a3 3 0 0 0 6 0l-3-7Z"/>',
  branch:'<circle cx="6" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="8" r="2"/><path d="M6 7v10M18 10v1a5 5 0 0 1-5 5H6"/>',
  cloud:'<path d="M17.5 19H7a5 5 0 1 1 1.1-9.9A6 6 0 0 1 19.6 11 4 4 0 0 1 17.5 19Z"/>',
  server:'<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/>',
  lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  plug:'<path d="M9 2v6M15 2v6M6 8h12v3a6 6 0 0 1-12 0V8ZM12 17v5"/>',
  msg:'<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/>',
  wifioff:'<path d="M2 2l20 20M8.5 16.5a5 5 0 0 1 7 0M5 12.9a10 10 0 0 1 5.2-2.8M19 12.9a10 10 0 0 0-2.2-1.6M2 8.8a15 15 0 0 1 4.2-2.6M22 8.8A15 15 0 0 0 10.7 5M12 20h.01"/>',
  hardhat:'<path d="M2 18h20v2H2zM4 18v-3a8 8 0 0 1 16 0v3M10 7V5h4v2M12 7v5"/>',
  wrench:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9l-3.8 3.8Z"/>',
  trend:'<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  alert:'<path d="M12 3 2 21h20L12 3Z"/><path d="M12 10v4M12 17h.01"/>',
  globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  gift:'<path d="M20 12v9H4v-9M2 7h20v5H2zM12 21V7M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7ZM12 7h4.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7Z"/>',
  code:'<path d="M8 6 2 12l6 6M16 6l6 6-6 6"/>',
  cpu:'<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
  users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  eye:'<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  camera:'<path d="M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13" r="3.5"/>',
  route:'<circle cx="6" cy="19" r="3"/><circle cx="18" cy="5" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>',
  star:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z" fill="currentColor" stroke="none"/>',
  chev:'<path d="m6 9 6 6 6-6"/>',
  sliders:'<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  key:'<circle cx="8" cy="15" r="4"/><path d="m10.8 12.2 8.2-8.2M16 7l3 3M14 9l2 2"/>',
  download:'<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  coin:'<circle cx="12" cy="12" r="9"/><path d="M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .9-3 2s1.3 1.7 3 2 3 .9 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5M12 6v2M12 16v2"/>',
  loop:'<path d="M21 12a9 9 0 0 1-15.4 6.4M3 12A9 9 0 0 1 18.4 5.6"/><path d="M18 2v4h-4M6 22v-4h4"/>'
};

const SECTORS=[
 ['Manufacturing',[
  ['FORGEX','Factory Operations, Resource Governance & Execution','Demand planning, production scheduling, quality visibility, cost control and factory performance.',['Demand forecasting','Production scheduling','Yield optimisation']],
  ['THRIVEX','Throughput, Reliability & Industrial Value Execution','Throughput, equipment effectiveness, bottleneck visibility and downtime reduction.',['OEE performance tracking','Bottleneck detection','Shift performance comparison']],
  ['QUALARA','Quality Assurance, Learning & Risk Analytics','Inspections, non-conformance tracking, corrective actions and quality evidence.',['Inspection checklist automation','Non-conformance reporting','Audit readiness dashboard']],
  ['SAFERA','Safety Event, Field Evidence & Risk Analytics','Hazard detection, incident tracking and emerging safety-risk prediction.',['Safety incident reporting','High-risk activity alerts','Safety trend prediction']]]],
 ['Maintenance & Field',[
  ['MANTIS','Maintenance & Asset Networked Technical Intelligence System','Predictive maintenance, equipment health, technician planning and spare parts.',['Predictive maintenance','Equipment health scoring','Spare parts optimisation']],
  ['RELIAX','Reliability Intelligence & Asset Execution','Utilisation, cost, reliability, downtime and replacement planning for assets.',['Equipment utilisation tracking','Asset cost-per-hour analysis','Replacement planning support']],
  ['FIELDRA','Field Execution, Inspection, Logging & Daily Reporting Assistant','Mobile-ready daily activity, site progress, delays, photos and approvals.',['Daily activity capture','Photo and evidence management','Supervisor approval workflow']],
  ['SERVORA','Service Operations & Response Assistant','Work orders, field teams, customer requests and service levels.',['Work order management','Field technician dispatch','SLA monitoring']]]],
 ['Supply Chain',[
  ['VELOX','Value-Chain Execution, Logistics & Optimisation Exchange','End-to-end route planning, inventory positioning, supplier risk and procurement visibility.',['Route optimisation','Supplier risk scoring','Shipment tracking']],
  ['PROQURA','Procurement Quality, Risk & Approval Assistant','Purchase requests, suppliers, approvals, expediting and price variance.',['Purchase request workflow','Procurement approval routing','Price variance monitoring']],
  ['STOCKRA','Stock Control, Replenishment & Availability Intelligence','Stock levels, material demand, replenishment and stockout risk.',['Stock level optimisation','Stockout risk alerts','Reorder recommendations']],
  ['FLEETRA','Fleet Logistics, Efficiency & Execution Tracking Assistant','Vehicle utilisation, transport planning, fuel efficiency and delivery performance.',['Fleet utilisation tracking','Fuel efficiency analysis','Logistics cost visibility']]]],
 ['Mining',[
  ['OREX','Ore Resource Execution Intelligence','Production forecasting, ore grade estimation, extraction planning and risk monitoring.',['Ore grade prediction models','Production forecasting','Safety incident prediction']],
  ['HAULORA','Haulage Optimisation & Load Operations Resource Assistant','Truck allocation, cycle times, fuel usage, queueing and material movement.',['Haul cycle monitoring','Truck allocation optimisation','Queue and wait-time detection']],
  ['GEONEX','Geology Networked Execution Intelligence','Exploration data, ore body models, grade control and operational planning.',['Grade control analytics','Production reconciliation','Drill and blast insights']]]],
 ['Oil, Gas & Energy',[
  ['PETROS','Petroleum Technical Reliability & Operations System','Well performance, pipeline integrity, production optimisation and safety.',['Well performance modelling','Pipeline integrity prediction','Cost-per-barrel analysis']],
  ['ENERGA','Energy Network Execution & Reliability Governance Assistant','Assets, outages, demand patterns and service reliability for utilities.',['Asset condition monitoring','Outage and incident tracking','Service reliability dashboard']],
  ['PIPELA','Pipeline Integrity, Performance & Evidence Logging Assistant','Inspection data, failure risk, maintenance actions and field evidence.',['Integrity risk scoring','Leak and anomaly alerts','Inspection evidence tracking']]]],
 ['Construction & EPC',[
  ['BUILDX','Built Environment Intelligence & Delivery Execution','Project controls, cost visibility, progress reporting and delivery risk.',['Project progress tracking','Cost forecast to complete','Delivery risk prediction']],
  ['PROJERA','Project Execution, Risk & Analytics Assistant','Cost, schedule, productivity, margin and risk across active projects.',['Earned value analysis','Schedule slippage alerts','Project risk early warnings']],
  ['CLAIMA','Contractual Liability, Claims & Impact Management Assistant','Obligations, notices, evidence and commercial exposure in contracts.',['Contract obligation extraction','Variation notice tracking','Claims evidence mapping']],
  ['DRAWIX','Drawing, Revision & Workflow Intelligence Exchange','Design releases, drawing revisions, IFC gates and approvals.',['Drawing revision tracking','IFC gate control','Document approval workflows']]]],
 ['Marketing & Sales',[
  ['AIMOS','AI Marketing Operating System','Campaign strategy, customer intelligence, performance analytics and AI optimisation.',['Customer segmentation and personas','Marketing mix modelling','Customer lifetime value prediction']],
  ['CHANEX','Channel Network Execution Intelligence','Dealer, distributor and partner performance for channel-led businesses.',['Dealer performance tracking','Territory performance visibility','Cross-sell opportunity detection']],
  ['BIDERA','Bid Intelligence, Decision & Response Assistant','Tender qualification, proposal development, pricing discipline and win rate.',['Bid / no-bid recommendation','Tender requirement extraction','Win-loss analysis']]]],
 ['Property & Facilities',[
  ['PROPERA','Property Operations, Performance & Engagement Resource Assistant','Leads, appraisals, listings, contracts and agent activity.',['Lead capture and scoring','Property appraisal support','Agent activity tracking']],
  ['FACIRA','Facilities Intelligence & Response Assistant','Asset maintenance, service requests, contractors and building operations.',['Facility work order tracking','Contractor performance monitoring','Tenant request management']],
  ['LEASERA','Lease Evidence, Analytics & Risk Assistant','Lease obligations, key dates, renewal risk and portfolio exposure.',['Lease obligation extraction','Renewal date monitoring','Portfolio risk dashboard']]]],
 ['Hospitality & Retail',[
  ['GUESTRA','Guest Experience, Service Tracking & Response Assistant','Guest service, property performance, workforce planning and issue resolution.',['Guest feedback analysis','Housekeeping task optimisation','SOP and policy assistant']],
  ['MERCHA','Merchandising, Retail & Customer Health Assistant','Store sales, inventory movement, staffing, promotions and customer behaviour.',['Store performance tracking','Promotion effectiveness analysis','Customer behaviour insights']]]],
 ['Enterprise',[
  ['DOCURA','Document Understanding, Retrieval & Automation','Find, summarise, classify and govern business-critical documents.',['Document Q&A assistant','Automatic classification','Policy and procedure search']],
  ['DATARA','Data Assurance, Taxonomy & Record Alignment','Master data quality across product, asset, supplier and customer records.',['Duplicate record detection','Data quality scoring','Source-of-record governance']],
  ['FINORA','Financial Intelligence, Operations & Risk Assistant','Budget control, cash visibility, cost forecasting and project profitability.',['Cashflow forecasting','Project margin analysis','Financial exception alerts']],
  ['CREWRA','Crew Rostering, Engagement & Workforce Resource Assistant','Labour demand, availability, skills, certifications and site rosters.',['Labour demand forecasting','Roster optimisation','Skills and certification matching']],
  ['KNOWRA','Knowledge Network, Operations & Workflow Retrieval Assistant','Turns procedures, reports and lessons learned into searchable intelligence.',['Internal knowledge search','Lessons learned capture','Decision history tracking']],
  ['ORCHESTRA','Operational Routing, Control, Human-in-the-loop Execution & System Triggering','Connects systems, approvals, documents, data and AI agents into governed workflows.',['Workflow automation','Approval routing','Exception handling']]]]
];

const OUT={
 MANTIS:['Predict equipment failure','Identify equipment risk before production is interrupted.'],
 RELIAX:['Know the true cost of every asset','See utilisation, cost-per-hour and when replacement makes sense.'],
 SERVORA:['Respond to breakdowns faster','Dispatch the right technician and track every service level.'],
 FIELDRA:['Capture field work as it happens','Daily activity, delays and photo evidence, approved by supervisors.'],
 THRIVEX:['Find and fix bottlenecks','Track OEE, classify downtime and compare shift performance.'],
 FORGEX:['Plan production with confidence','Forecast demand, schedule production and control cost and yield.'],
 ORCHESTRA:['Automate cross-system workflows','Route approvals, handle exceptions and trigger actions across systems.'],
 QUALARA:['Close quality issues faster','Automate inspections, track non-conformances and stay audit-ready.'],
 DOCURA:['Find the right document instantly','Search, classify and control SOPs, specifications and drawings.'],
 DATARA:['Trust your master data','Detect duplicates, enforce naming standards and score data quality.'],
 SAFERA:['Spot safety risks early','Track incidents and hazards and predict emerging safety risk.'],
 CREWRA:['Put qualified people on every shift','Match skills and certifications to rosters and site needs.'],
 STOCKRA:['Cut excess stock without stockouts','Optimise stock levels and get reorder recommendations.'],
 PROQURA:['Speed up purchasing approvals','Route purchase requests, track suppliers and monitor price variance.'],
 VELOX:['See supply risk before it hits','Score supplier risk, track shipments and position inventory.'],
 FLEETRA:['Lower logistics cost','Improve fleet utilisation, routes and fuel efficiency.'],
 AIMOS:['Spend marketing budget where it works','Segment customers, model marketing mix and optimise budgets.'],
 CHANEX:['Grow sales through your channel','Track dealer and territory performance and find cross-sell.'],
 BIDERA:['Win more tenders','Qualify bids, extract requirements and learn from win-loss.'],
 PROJERA:['Catch schedule and margin slippage early','Earned value, budget vs actual and project risk warnings.'],
 BUILDX:['Deliver projects with fewer surprises','Progress, cost-to-complete and delivery risk in one view.'],
 CLAIMA:['Protect your commercial position','Track contract obligations, variations and claims evidence.'],
 DRAWIX:['Build from the right drawing','Control drawing revisions, IFC gates and approvals.'],
 OREX:['Forecast ore grade and production','Plan extraction with grade prediction and production forecasts.'],
 HAULORA:['Move more material per truck hour','Optimise truck allocation, cycle times and queues.'],
 GEONEX:['Connect geology to production','Reconcile resource models, grade control and production results.'],
 PETROS:['Optimise well and pipeline performance','Model well performance and predict pipeline integrity risk.'],
 ENERGA:['Keep the network reliable','Monitor asset condition, outages and maintenance priorities.'],
 PIPELA:['Prioritise pipeline integrity work','Score integrity risk and track inspection evidence.'],
 PROPERA:['Convert more property leads','Score leads, support appraisals and track agent activity.'],
 FACIRA:['Run facilities efficiently','Track work orders, contractors and tenant requests.'],
 LEASERA:['Never miss a lease date','Extract obligations and monitor renewals and rent reviews.'],
 GUESTRA:['Resolve guest issues faster','Analyse feedback and prioritise service issues.'],
 MERCHA:['Lift store performance','Track store sales, promotions and customer behaviour.'],
 FINORA:['Forecast cash and margin','Budget vs actual, cashflow forecasting and margin analysis.'],
 KNOWRA:['Keep expert knowledge in the business','Search procedures, lessons learned and decision history.']
};
function paintIcons(root){
  (root||document).querySelectorAll('i[data-i]').forEach(el=>{
    const s=el.dataset.s||20, svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('width',s);svg.setAttribute('height',s);svg.setAttribute('viewBox','0 0 24 24');
    svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.9');
    svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');
    svg.innerHTML=I[el.dataset.i]||'';
    if(el.getAttribute('style'))svg.setAttribute('style',el.getAttribute('style'));
    if(el.getAttribute('class'))svg.setAttribute('class',el.getAttribute('class'));
    el.replaceWith(svg);
  });
}
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;')}
const isMobile=()=>matchMedia('(max-width:720px)').matches;
const RM=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const store={get:k=>{try{return sessionStorage.getItem(k)}catch(e){return null}},set:(k,v)=>{try{sessionStorage.setItem(k,v)}catch(e){}}};

/* focus trap for any dialog */
function trapDialog(dlg,close){
  dlg.addEventListener('keydown',e=>{
    if(e.key==='Escape'){close();return;}
    if(e.key==='Tab'){const f=[...dlg.querySelectorAll('button,a[href]')].filter(x=>!x.closest('[hidden]')),a=f[0],z=f[f.length-1];
      if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus();} else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus();}}
  });
  dlg.addEventListener('click',e=>{if(e.target===dlg)close();});
}

/* mobile rails: peek + dots + prev/next so users know more cards exist */
/* in-action stage: the frame stays, the operation inside it changes.
   One deck of windows. The progress bar on the active tab drives the autoplay: it only runs while the stage is on screen,
   pauses on hover or focus, stops for good after any interaction, and never starts with reduced motion.
   The front window can be thrown away with a flick; the deck leans a few degrees toward the pointer on fine-pointer devices. */
function initStage(){
  const st=$('[data-stage]');if(!st)return;
  const tabs=[...st.querySelectorAll('.stage-tab')],names=[...st.querySelectorAll('.stage-name')],tps=[...st.querySelectorAll('.stage-tp')],
        wins=[...st.querySelectorAll('.deck-win')],glow=st.querySelector('.stage-glow'),deck=st.querySelector('.stage-deck'),n=tabs.length;
  let idx=0,prev=-1,playing=!RM(),seen=false,outTimer=0;
  const restart=()=>{st.classList.remove('is-playing');void st.offsetWidth;st.classList.toggle('is-playing',playing&&seen);};
  function go(i,user){
    prev=idx;idx=(i+n)%n;
    tabs.forEach((t,k)=>{const on=k===idx;t.classList.toggle('on',on);t.setAttribute('aria-selected',String(on));t.tabIndex=on?0:-1;});
    tps.forEach((t,k)=>t.classList.toggle('on',k===idx));
    names.forEach((t,k)=>{t.classList.toggle('on',k===idx);t.classList.toggle('out',k===prev&&prev!==idx);});
    clearTimeout(outTimer);outTimer=setTimeout(()=>names.forEach(t=>t.classList.remove('out')),420);
    wins.forEach((w,k)=>{const pos=(k-idx+n)%n;w.dataset.pos=pos;w.style.setProperty('--rel',pos);w.setAttribute('aria-hidden',pos?'true':'false');});
    glow.style.setProperty('--glow',tps[idx].dataset.accent);
    if(user)playing=false;
    restart();
    const rail=tabs[idx].parentElement;const dx=tabs[idx].getBoundingClientRect().left-rail.getBoundingClientRect().left;rail.scrollTo({left:Math.max(0,rail.scrollLeft+dx-12),behavior:RM()?'auto':'smooth'});
  }
  tabs.forEach((t,k)=>t.addEventListener('click',()=>go(k,true)));
  st.querySelector('.stage-prev').addEventListener('click',()=>go(idx-1,true));
  st.querySelector('.stage-next').addEventListener('click',()=>go(idx+1,true));
  tabs.forEach(t=>t.addEventListener('keydown',e=>{
    const d={ArrowRight:1,ArrowDown:1,ArrowLeft:-1,ArrowUp:-1}[e.key];
    if(d){e.preventDefault();go(idx+d,true);tabs[idx].focus();}
    else if(e.key==='Home'){e.preventDefault();go(0,true);tabs[0].focus();}
    else if(e.key==='End'){e.preventDefault();go(n-1,true);tabs[n-1].focus();}
  }));
  tabs.forEach(t=>t.querySelector('.stage-bar').addEventListener('animationend',e=>{if(e.animationName==='stageFill'&&playing&&seen)go(idx+1,false);}));
  let introduced=false;
  new IntersectionObserver(es=>{
    seen=es[0].isIntersecting;
    if(seen&&!introduced){introduced=true;st.classList.add('is-in');setTimeout(()=>st.classList.add('intro-done'),1700);}
    restart();
  },{threshold:.3}).observe(st);
  const pause=v=>st.classList.toggle('paused',v);
  st.addEventListener('mouseenter',()=>pause(true));st.addEventListener('mouseleave',()=>pause(false));
  st.addEventListener('focusin',()=>pause(true));st.addEventListener('focusout',()=>pause(false));

  /* throw the front window: distance or a quick flick moves on, otherwise it settles back */
  let drag=null;
  deck.addEventListener('pointerdown',e=>{
    const w=e.target.closest('.deck-win');if(!w||w.dataset.pos!=='0'||e.button>0)return;
    drag={w,x:e.clientX,t:performance.now(),dx:0};try{w.setPointerCapture(e.pointerId);}catch(_){}w.classList.add('dragging');
  });
  deck.addEventListener('pointermove',e=>{
    if(!drag)return;drag.dx=e.clientX-drag.x;
    drag.w.style.transform='translate3d('+drag.dx+'px,0,0) rotate('+(drag.dx*.025)+'deg)';
    drag.w.style.opacity=String(Math.max(.35,1-Math.abs(drag.dx)/700));
  });
  const release=()=>{
    if(!drag)return;const{w,dx,t}=drag;drag=null;
    const v=Math.abs(dx)/Math.max(1,performance.now()-t);
    w.classList.remove('dragging');w.style.transform='';w.style.opacity='';
    if(Math.abs(dx)>110||v>.5)go(idx+(dx<0?1:-1),true);
  };
  deck.addEventListener('pointerup',release);deck.addEventListener('pointercancel',release);deck.addEventListener('lostpointercapture',release);
  /* the browser's own image drag would start a ghost picture and cancel ours */
  deck.addEventListener('dragstart',e=>e.preventDefault());
  deck.addEventListener('selectstart',e=>{if(drag)e.preventDefault();});

  /* decorative lean toward the pointer, eased so it has weight */
  if(matchMedia('(hover: hover) and (pointer: fine)').matches&&!RM()){
    let tx=0,ty=0,cx=0,cy=0,raf=0;
    const tick=()=>{
      cx+=(tx-cx)*.08;cy+=(ty-cy)*.08;
      deck.style.transform='rotateX('+(3+cy).toFixed(2)+'deg) rotateY('+(-8+cx).toFixed(2)+'deg)';
      raf=(Math.abs(tx-cx)>.01||Math.abs(ty-cy)>.01)?requestAnimationFrame(tick):0;
    };
    st.addEventListener('pointermove',e=>{if(drag)return;const r=st.getBoundingClientRect();tx=((e.clientX-r.left)/r.width-.5)*-7;ty=((e.clientY-r.top)/r.height-.5)*5;if(!raf)raf=requestAnimationFrame(tick);});
    st.addEventListener('pointerleave',()=>{tx=0;ty=0;if(!raf)raf=requestAnimationFrame(tick);});
  }
  go(0,false);
}
function railify(rail){
  let ctl=rail.nextElementSibling;
  if(!ctl||!ctl.classList.contains('rail-ctl')){ctl=document.createElement('div');ctl.className='rail-ctl';rail.after(ctl);
    rail.addEventListener('scroll',()=>railSync(rail),{passive:true});}
  const n=rail.children.length;
  ctl.innerHTML=`<button type="button" class="rp" aria-label="Previous card"><i data-i="arrow" data-s="16" style="transform:rotate(180deg)"></i></button><span class="rail-dots" role="img">${'<i></i>'.repeat(n)}</span><button type="button" class="rn" aria-label="Next card"><i data-i="arrow" data-s="16"></i></button>`;
  ctl.hidden=n<2; paintIcons(ctl);
  ctl.querySelector('.rp').onclick=()=>railGo(rail,railIdx(rail)-1);
  ctl.querySelector('.rn').onclick=()=>railGo(rail,railIdx(rail)+1);
  railSync(rail);
}
function railIdx(rail){const c=[...rail.children];let best=0,bd=1e9;c.forEach((el,i)=>{const d=Math.abs(el.offsetLeft+el.clientWidth/2-rail.scrollLeft-rail.clientWidth/2);if(d<bd){bd=d;best=i;}});return best;}
function railGo(rail,i){const c=rail.children;i=Math.max(0,Math.min(c.length-1,i));const el=c[i];rail.scrollTo({left:el.offsetLeft-(rail.clientWidth-el.clientWidth)/2,behavior:RM()?'auto':'smooth'});}
function railSync(rail){const ctl=rail.nextElementSibling;if(!ctl||!ctl.classList.contains('rail-ctl'))return;const i=railIdx(rail),n=rail.children.length;
  ctl.querySelectorAll('.rail-dots i').forEach((d,k)=>d.classList.toggle('on',k===i));
  ctl.querySelector('.rail-dots').setAttribute('aria-label',`Card ${i+1} of ${n}`);
  ctl.querySelector('.rp').disabled=i===0;ctl.querySelector('.rn').disabled=i===n-1;}

/* keyboard arrows for any tablist */
function arrowNav(list){
  list.addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
    const tabs=[...list.querySelectorAll('[role=tab]')], i=tabs.indexOf(document.activeElement);
    if(i<0)return; e.preventDefault();
    let n=e.key==='ArrowRight'?i+1:e.key==='ArrowLeft'?i-1:e.key==='Home'?0:tabs.length-1;
    n=(n+tabs.length)%tabs.length; tabs[n].click(); list.querySelectorAll('[role=tab]')[n].focus();
  });
}

/* ---------- applications ---------- */
const APP={};
SECTORS.forEach(([sec,apps])=>apps.forEach(a=>{APP[a[0]]={code:a[0],full:a[1],desc:a[2],sec};}));
const OTABS=[
 ['Reduce downtime','Maintenance','wrench',[
   ['MANTIS','Reduce unplanned downtime','Predict equipment risk, prioritise maintenance and manage spares.'],
   ['RELIAX','Know when to repair or replace','Track utilisation, cost-per-hour and reliability trends for every asset.'],
   ['SERVORA','Respond to breakdowns faster','Dispatch the right technician and track every service level.'],
   ['FIELDRA','Capture field work as it happens','Daily activity, delays and photo evidence, approved by supervisors.']]],
 ['Improve throughput','Production','trend',[
   ['THRIVEX','Find and fix bottlenecks','Track OEE, classify downtime and compare shift performance.'],
   ['FORGEX','Run the factory to plan','Forecast demand, schedule production and control yield.'],
   ['ORCHESTRA','Remove manual hand-offs','Route approvals and trigger actions across systems automatically.']]],
 ['Improve quality','Quality','shield',[
   ['QUALARA','Close quality issues faster','Automate inspections, track non-conformances and stay audit-ready.'],
   ['DOCURA','Work from the right procedure','Find, control and version SOPs, specifications and drawings.'],
   ['DATARA','Trust your master data','Detect duplicates, enforce naming standards and score data quality.']]],
 ['Improve safety','Safety','hardhat',[
   ['SAFERA','Spot safety risks early','Track incidents and hazards and predict emerging safety risk.'],
   ['FIELDRA','Evidence from every shift','Photo evidence and supervisor approvals from the field.'],
   ['CREWRA','Qualified people on every shift','Match skills and certifications to rosters and site needs.']]],
 ['Optimise inventory','Inventory','box',[
   ['STOCKRA','Cut excess stock without stockouts','Optimise stock levels and get reorder recommendations.'],
   ['PROQURA','Speed up purchasing','Route purchase requests, track suppliers and expedite deliveries.'],
   ['VELOX','See supply risk before it hits','Score supplier risk, track shipments and position inventory.']]],
 ['Plan better','Planning','calendar',[
   ['FORGEX','Plan production with confidence','Demand forecasting and constraint-aware production scheduling.'],
   ['CREWRA','Plan the right crew','Forecast labour demand and optimise rosters.'],
   ['STOCKRA','Plan materials ahead','Forecast material demand and get stockout alerts early.']]],
 ['Control cost','Cost','coin',[
   ['FINORA','Forecast cash and margin','Budget vs actual, cashflow forecasting and margin analysis.'],
   ['RELIAX','Know the true cost of every asset','Asset cost-per-hour and replacement planning.'],
   ['PROQURA','Control purchase prices','Monitor price variance and supplier performance.'],
   ['FLEETRA','Lower logistics cost','Improve fleet utilisation, routes and fuel efficiency.']]]
];
/* business functions for the browse filter */
const FN={'Maintenance & Reliability':['MANTIS','RELIAX','SERVORA','FACIRA','ENERGA','PIPELA'],
 'Production & Operations':['FORGEX','THRIVEX','FIELDRA','OREX','HAULORA','GEONEX','PETROS'],
 'Quality & Safety':['QUALARA','SAFERA'],
 'Supply Chain & Procurement':['VELOX','PROQURA','STOCKRA','FLEETRA'],
 'Projects & Engineering':['BUILDX','PROJERA','CLAIMA','DRAWIX'],
 'Commercial & Customer':['AIMOS','CHANEX','BIDERA','PROPERA','LEASERA','GUESTRA','MERCHA'],
 'Finance, People & Knowledge':['DOCURA','DATARA','FINORA','CREWRA','KNOWRA','ORCHESTRA']};
const FNOF={};Object.entries(FN).forEach(([f,cs])=>cs.forEach(c=>FNOF[c]=f));
SECTORS.forEach(([sec,apps])=>apps.forEach(a=>{APP[a[0]].caps=a[3];}));
APP.MANTIS.caps=['Asset health','Maintenance prioritisation','Spare parts intelligence'];
const dot=t=>/[.!?]$/.test(t)?t:t+'.';
/* three levels only: application · outcome · 2–3 capabilities. Detail opens in a modal. */
function card(code,outcome){
  const a=APP[code];
  return `<article class="app3"><div class="a3-top"><span class="app-mark" aria-hidden="true">${a.code.slice(0,2)}</span><h3>${a.code}</h3></div>
    <p class="a3-out">${esc(dot(outcome))}</p>
    <ul class="a3-caps" aria-label="Key capabilities">${a.caps.slice(0,3).map(c=>`<li><i data-i="check" data-s="14"></i>${esc(c)}</li>`).join('')}</ul>
    <button class="a3-more" type="button" data-app="${a.code}" data-out="${esc(outcome)}" aria-label="View details of ${a.code}">View details <i data-i="arrow" data-s="14"></i></button></article>`;
}
function bindMore(box){box.querySelectorAll('.a3-more').forEach(b=>b.onclick=()=>openApp(b.dataset.app,b.dataset.out));}
function renderOutcome(idx){
  const t=$('#otabs');
  t.innerHTML=OTABS.map((o,i)=>`<button class="otab${i===idx?' on':''}" role="tab" id="ot${i}" aria-controls="apps-out" aria-selected="${i===idx}" tabindex="${i===idx?0:-1}" data-o="${i}" type="button"><span class="oi"><i data-i="${o[2]}" data-s="18"></i></span><span><b>${esc(o[0])}</b><small>${esc(o[1])}</small></span></button>`).join('');
  const items=OTABS[idx][3], box=$('#apps-out');
  box.setAttribute('aria-labelledby','ot'+idx);
  box.className='apps2 snap'+(items.length===3?' cols3':'');
  box.innerHTML=items.map(x=>card(x[0],x[1])).join('');
  t.querySelectorAll('.otab').forEach(b=>b.onclick=()=>renderOutcome(+b.dataset.o));
  paintIcons(t);paintIcons(box);bindMore(box);railify(box);
}
/* browse: one decision. Pick a business function (or all) and its applications appear.
   Three show first; "View all" opens the rest. An industry filter can still arrive from the footer links. */
const BF={ind:new Set(),fn:new Set(['Maintenance & Reliability'])};
const BF_PREVIEW=3; let bfAll=false, bfBuilt=false;
const SECT_OF={};SECTORS.forEach(([s,apps])=>apps.forEach(a=>{SECT_OF[a[0]]=s;}));
const ALL_CODES=SECTORS.flatMap(([,apps])=>apps.map(a=>a[0]));
function browseList(){
  const fn=[...BF.fn][0];
  return (fn?FN[fn]:ALL_CODES).filter(c=>!BF.ind.size||BF.ind.has(SECT_OF[c]));
}
/* the highlight slides between tabs instead of jumping */
function moveInd(){
  const tabs=$('#bf-fn'),ind=tabs&&tabs.querySelector('.sol-ind'),on=tabs&&tabs.querySelector('.sol-tab[aria-selected="true"]');
  if(!ind||!on)return;
  const horiz=getComputedStyle(tabs).flexDirection.indexOf('row')===0;
  ind.style.width=on.offsetWidth+'px';ind.style.height=on.offsetHeight+'px';
  ind.style.translate=horiz?on.offsetLeft+'px 0':'0 '+on.offsetTop+'px';
}
function buildBrowseTabs(){
  const tabs=$('#bf-fn'),fns=Object.keys(FN);
  const items=[...fns.map(f=>[f,f,FN[f].length]),['all','All applications',ALL_CODES.length]];
  tabs.innerHTML='<span class="sol-ind" aria-hidden="true"></span>'+items.map(([v,label,n],i)=>
    `<button type="button" role="tab" id="sol-tab-${i}" class="sol-tab${v==='all'?' sol-tab-all':''}" data-v="${esc(v)}" aria-controls="sol-panel"><span>${esc(label)}</span><span class="sol-n">${n}</span></button>`).join('');
  const pick=btn=>{const v=btn.dataset.v;BF.fn=v==='all'?new Set():new Set([v]);bfAll=false;renderBrowse(true);resultsIntoView();};
  /* a new filter starts a new list: if the user had scrolled down the old one, bring the first card back into view */
  const resultsIntoView=()=>{
    const head=$('#bf-count');if(!head)return;
    const stuck=getComputedStyle(tabs).flexDirection.indexOf('row')===0;      /* phone: the chip row is sticky above the list */
    const gap=stuck?tabs.getBoundingClientRect().bottom+8:112;
    const top=head.getBoundingClientRect().top;
    if(top>=gap)return;
    /* the wheel glide may still be easing toward an old target and would drag the page back: stop it, then jump */
    dispatchEvent(new CustomEvent('atlas:scroll-jump'));
    scrollTo({top:Math.max(0,scrollY+top-gap),behavior:'auto'});
  };
  tabs.addEventListener('click',ev=>{const b=ev.target.closest('.sol-tab');if(b)pick(b);});
  tabs.addEventListener('keydown',ev=>{
    const step={ArrowDown:1,ArrowRight:1,ArrowUp:-1,ArrowLeft:-1};
    const all=[...tabs.querySelectorAll('.sol-tab')];
    let i=all.indexOf(document.activeElement);
    if(i<0||!(ev.key in step||ev.key==='Home'||ev.key==='End'))return;
    ev.preventDefault();
    i=ev.key==='Home'?0:ev.key==='End'?all.length-1:(i+step[ev.key]+all.length)%all.length;
    all[i].focus();pick(all[i]);
  });
  addEventListener('resize',moveInd);
  bfBuilt=true;
}
function renderBrowse(animate){
  if(!bfBuilt)buildBrowseTabs();
  const tabs=$('#bf-fn'),sel=[...BF.fn][0]||'all',list=browseList();
  tabs.querySelectorAll('.sol-tab').forEach(b=>{const on=b.dataset.v===sel;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;});
  const active=tabs.querySelector('.sol-tab[aria-selected="true"]'),panel=$('#sol-panel');
  if(panel&&active)panel.setAttribute('aria-labelledby',active.id);
  const ind=tabs.querySelector('.sol-ind');
  if(ind&&!ind.dataset.placed){ind.style.transition='none';moveInd();void ind.offsetWidth;ind.style.transition='';ind.dataset.placed='1';}else moveInd();
  if(animate&&active&&getComputedStyle(tabs).flexDirection.indexOf('row')===0)    /* phone: keep the chosen tab in view */
    tabs.scrollTo({left:active.offsetLeft-(tabs.clientWidth-active.offsetWidth)/2,behavior:'smooth'});

  const shown=bfAll?list:list.slice(0,BF_PREVIEW);
  const indTags=[...BF.ind].map(v=>`<button type="button" class="bf-tag" data-v="${esc(v)}" aria-label="Remove industry filter: ${esc(v)}">${esc(v)}<i data-i="x" data-s="12"></i></button>`).join('');
  $('#bf-count').innerHTML=`<h3 class="sol-title">${esc(sel==='all'?'All applications':sel)}</h3><span class="sol-sub">${list.length} application${list.length===1?'':'s'}</span>${indTags}`;
  $('#apps-ind').innerHTML=list.length
    ?`<div class="sol-grid">${shown.map(c=>{const o=OUT[c]||[APP[c].full];return card(c,o[0]);}).join('')}</div>`+
      (list.length>BF_PREVIEW?`<div class="bf-viewall"><button type="button" class="btn btn-outline btn-sm js-bf-all" aria-expanded="${bfAll}">${bfAll?'Show fewer':`View all ${list.length} applications`}</button></div>`:'')
    :'<div class="bf-empty"><p>No applications match.</p></div>';
  $$('.js-bf-all').forEach(b=>b.onclick=()=>{bfAll=!bfAll;renderBrowse(false);const nb=$('.js-bf-all');if(nb)nb.focus({preventScroll:true});});
  $$('#bf-count .bf-tag').forEach(t=>t.onclick=()=>{BF.ind.delete(t.dataset.v);bfAll=false;renderBrowse(true);});
  paintIcons($('#bf-count'));paintIcons($('#apps-ind'));bindMore($('#apps-ind'));
  if(animate&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
    [...$('#apps-ind').querySelectorAll('.app3')].forEach((c,i)=>c.animate([{opacity:0,translate:'0 14px'},{opacity:1,translate:'0 0'}],{duration:420,delay:i*55,easing:'cubic-bezier(.23,1,.32,1)',fill:'backwards'}));
    $('#bf-count').animate([{opacity:0},{opacity:1}],{duration:260,easing:'ease-out'});
  }
}
/* application detail modal */
const amod=$('#app-modal'); let amLast=null;
function openApp(code,outcome){
  const a=APP[code];amLast=document.activeElement;
  $('#am-mark').textContent=a.code.slice(0,2);$('#am-name').textContent=a.code;$('#am-full').textContent=a.full;
  $('#am-out').textContent=dot(outcome||(OUT[code]||[''])[0]);$('#am-desc').textContent=a.desc;
  $('#am-ind').textContent=a.sec;$('#am-fn').textContent=FNOF[code]||'';
  $('#am-caps').innerHTML=a.caps.map(c=>`<li><i data-i="check" data-s="16"></i>${esc(c)}</li>`).join('');
  paintIcons(amod);amod.hidden=false;$('#am-x').focus();
}
function closeApp(){amod.hidden=true;amLast&&amLast.focus();}
$('#am-x').onclick=closeApp;$('#am-cta').onclick=()=>{amod.hidden=true;};
trapDialog(amod,closeApp);
$$('.js-open-ind').forEach(a=>a.addEventListener('click',()=>{$('#industries').open=true;
  const sec=SECTORS.map(x=>x[0]).find(n=>n.startsWith(a.textContent.trim()));if(sec){BF.ind=new Set([sec]);BF.fn.clear();bfAll=false;renderBrowse();}}));

/* ---------- activation gantt ---------- */
const ROAD=[['Enterprise Intelligence','DOCURA · DATARA · FINORA',6,10],['Marketing, Sales & Channel','AIMOS · CHANEX · BIDERA',8,10],['Supply Chain & Logistics','VELOX · PROQURA · STOCKRA',8,12],['Property, Hospitality & Retail','PROPERA · FACIRA · GUESTRA',8,12],['Manufacturing & Industrial','FORGEX · THRIVEX · QUALARA',10,14,1],['Maintenance, Assets & Field','MANTIS · RELIAX · FIELDRA',10,14],['Construction, EPC & Engineering','BUILDX · PROJERA · CLAIMA',10,16],['Mining & Resources','OREX · HAULORA · GEONEX',12,16],['Oil, Gas & Energy','PETROS · ENERGA · PIPELA',12,18]];
function renderGantt(){
  const max=20, gl=[4,8,12,16].map(w=>`<span class="gl" style="left:${w/max*100}%"></span>`).join('');
  $('#gantt').innerHTML=ROAD.map(r=>`<div class="g-row"><div class="g-name">${esc(r[0])}<small>${r[1]}</small></div><div class="g-track">${gl}<span class="g-bar${r[4]?' hl':''}" style="width:${r[3]/max*100}%;--fast:${r[2]/r[3]*100}%" role="img" aria-label="${esc(r[0])}: ${r[2]} to ${r[3]} weeks"><span>${r[2]}–${r[3]} weeks</span></span></div></div>`).join('');
  $('#gaxis').innerHTML=[0,4,8,12,16,20].map(w=>`<span style="left:${w/max*100}%">${w}</span>`).join('');
}

/* ---------- ONTRIX impact scenarios ---------- */
const OG=[
 {name:'A supplier is late',nodes:['supplier','part','wo','machine','prod'],edges:['e-ps','e-wp','e-mw','e-mp'],
  steps:[['Supplier','Bearing supplier delays delivery by 6 days'],['Spare part','Bearing 6205 stock will run out'],['Work order','Preventive maintenance is blocked'],['Machine','Failure risk on Press Line 3 rises'],['Production order','Order #4471, due Friday, is at risk']],
  rule:'<b>IF</b> spare_part.stock = 0 <b>AND</b> work_order.priority = high <b>THEN</b> <em>flag production_order.at_risk</em>'},
 {name:'A sensor spikes',nodes:['sensor','machine','wo','part'],edges:['e-ms','e-mw','e-wp'],
  steps:[['Sensor','Vibration on S-12 is up 38%'],['Machine','Press Line 3 health score drops'],['Work order','Preventive maintenance is raised'],['Spare part','Bearing 6205 is reserved (2 in stock)']],
  rule:'<b>IF</b> vibration.trend &gt; 30% <b>AND</b> asset.criticality = high <b>THEN</b> <em>create work_order</em>'},
 {name:'A machine stops',nodes:['machine','prod','wo'],edges:['e-mp','e-mw'],
  steps:[['Machine','Press Line 3 stops unexpectedly'],['Production order','Order #4471 needs a new slot'],['Work order','Corrective maintenance is raised']],
  rule:'<b>IF</b> machine.status = stopped <b>THEN</b> <em>reschedule production_order AND notify planner</em>'}
];
function renderOG(i){
  const s=OG[i];
  $('#og-tabs').innerHTML=OG.map((o,j)=>`<button class="og-tab" role="tab" type="button" aria-selected="${j===i}" tabindex="${j===i?0:-1}" data-g="${j}">${esc(o.name)}</button>`).join('');
  $$('#og-tabs .og-tab').forEach(b=>b.onclick=()=>renderOG(+b.dataset.g));
  $('#og').classList.add('focus');
  $$('.og .node').forEach(n=>{const k=s.nodes.indexOf(n.id.slice(2));n.classList.toggle('on',k>=0);n.classList.toggle('start',k===0);n.querySelector('.bdg text').textContent=k>=0?k+1:'';});
  $$('.og .edge').forEach(e=>e.classList.toggle('on',s.edges.includes(e.id)));
  $('#og-steps').innerHTML=s.steps.map((x,k)=>`<li><span class="sn">${k+1}</span><div><small>${x[0]}</small><span class="tx">${esc(x[1])}</span></div></li>`).join('');
  $('#og-rule').innerHTML=s.rule;
  $('#og-steps').setAttribute('aria-label','How ATLAS knew this: '+s.steps.map(x=>x[0].toLowerCase()).join(', then '));
}

/* ---------- NEXA decision ---------- */
function setApproved(on){
  $('#dc').classList.toggle('approved',on);
  $('#appr-btns').hidden=on; $('#appr-done').hidden=!on;
  $('#appr-h').textContent=on?'Approved':'Awaiting Maintenance Manager';
  $('#dc-status span').textContent=on?'Approved by a person':'Human approval required';
  $('#ds-appr .dot').innerHTML=on?'<i data-i="check" data-s="14"></i>':'5';
  $('#ds-res .dot').innerHTML=on?'<i data-i="check" data-s="14"></i>':'6';
  const L=on?['Work order created in your maintenance system','Technician scheduled for night shift','Spare part reserved']:['Work order will be created in your maintenance system','Technician will be scheduled for night shift','Spare part will be reserved'];
  $('#res-list').innerHTML=L.map(t=>`<li><i data-i="${on?'check':'clock'}" data-s="15"></i>${t}</li>`).join('');
  paintIcons($('#dc'));
}
$('#btn-approve').onclick=()=>{setApproved(true);$('#btn-reset').focus();};
$('#btn-reset').onclick=()=>{setApproved(false);$('#btn-approve').focus();};

/* ---------- pricing: build-your-own configurator (no prices shown) ---------- */
const CFG=new Set();let CFG_STEP=0;
const CFG_PROBLEM={
  'Maintenance & Reliability':'Assets keep failing and maintenance is mostly reactive.',
  'Production & Operations':'Output, throughput and site operations are hard to see.',
  'Quality & Safety':'Quality escapes and safety incidents carry a real cost.',
  'Supply Chain & Procurement':'Stock, suppliers and logistics drive cost and delay.',
  'Projects & Engineering':'Projects slip on cost, scope and drawings.',
  'Commercial & Customer':'Winning, serving and keeping customers takes too much effort.',
  'Finance, People & Knowledge':'Data, documents, people and money live in silos.'};
(function cfgBuild(){
  const wrap=$('#cfg-fns'); if(!wrap)return;
  const FNS=Object.keys(FN);
  const tabs='<div class="cfg-tabs" role="tablist" aria-label="Business functions">'+FNS.map((fn,i)=>'<button type="button" role="tab" class="cfg-tab" data-step="'+i+'" aria-selected="false"><b>0'+(i+1)+'</b><span>'+esc(fn)+'</span></button>').join('')+'</div>';
  const pager='<div class="cfg-pager"><button type="button" class="cfg-pg cfg-prev"><i data-i="arrow" data-s="16"></i><span><small>Previous</small><b></b></span></button><button type="button" class="cfg-pg cfg-next"><span><small></small><b></b></span><i data-i="arrow" data-s="16"></i></button></div>';
  wrap.innerHTML=tabs+Object.entries(FN).map(([fn,codes],gi)=>
    '<section class="cfg-g" data-fn="'+esc(fn)+'" aria-labelledby="cg'+gi+'"><header class="cfg-gh"><span class="cfg-no" aria-hidden="true">0'+(gi+1)+'</span>'+
    '<div class="cfg-gt"><h3 id="cg'+gi+'">'+esc(fn)+'</h3><p>'+esc(CFG_PROBLEM[fn]||'')+'</p></div>'+
    '<div class="cfg-gm"><span class="cfg-gc">0 / '+codes.length+'</span><span class="cfg-bar" aria-hidden="true"><i></i></span>'+
    '<button type="button" class="cfg-all" data-fn="'+esc(fn)+'" aria-pressed="false">Select all</button></div></header>'+
    '<ul class="cfg-apps">'+codes.map(c=>'<li><button type="button" class="cfg-app" data-c="'+c+'" aria-pressed="false">'+
      '<span class="cfg-t"><b>'+c+'</b><span>'+esc(APP[c].desc)+'</span></span><span class="cfg-ck"><i data-i="check" data-s="14"></i></span></button></li>').join('')+
    '</ul></section>').join('')+pager;
  paintIcons(wrap);
  wrap.addEventListener('click',e=>{
    const tab=e.target.closest('.cfg-tab'), pg=e.target.closest('.cfg-pg'), all=e.target.closest('.cfg-all'), app=e.target.closest('.cfg-app');
    if(tab){cfgStep(+tab.dataset.step);return;}
    if(pg){if(pg.classList.contains('cfg-prev'))cfgStep(CFG_STEP-1);else if(CFG_STEP>=Object.keys(FN).length-1)$('.js-quote').click();else cfgStep(CFG_STEP+1);return;}
    if(all){const cs=FN[all.dataset.fn],full=cs.every(c=>CFG.has(c));cs.forEach(c=>full?CFG.delete(c):CFG.add(c));}
    else if(app){const c=app.dataset.c;CFG.has(c)?CFG.delete(c):CFG.add(c);}
    else return;
    cfgSync();
  });
  $('#cfg-list').addEventListener('click',e=>{const x=e.target.closest('[data-rm]');if(!x)return;CFG.delete(x.dataset.rm);cfgSync();});
  cfgStep(0,0,true);
  cfgSync();
})();

function cfgStep(i,dir,silent){
  const n=Object.keys(FN).length,wrap=$('#cfg-fns');if(!wrap)return;
  i=Math.max(0,Math.min(n-1,i));dir=dir===undefined?(i>=CFG_STEP?1:-1):dir;CFG_STEP=i;
  const names=Object.keys(FN);
  $$('#cfg-fns .cfg-g').forEach((g,k)=>{const on=k===i;if(g.hidden===on){g.hidden=!on;
    if(on&&!silent&&!RM())g.animate([{opacity:0,transform:'translateX('+(dir*28)+'px)'},{opacity:1,transform:'none'}],{duration:380,easing:'cubic-bezier(.23,1,.32,1)'});}});
  $$('#cfg-fns .cfg-tab').forEach((b,k)=>{b.setAttribute('aria-selected',k===i);b.tabIndex=k===i?0:-1;});
  const pv=wrap.querySelector('.cfg-prev'),nx=wrap.querySelector('.cfg-next'),last=i===n-1;
  pv.disabled=i===0;pv.querySelector('b').textContent=i?names[i-1]:'';
  nx.querySelector('small').textContent=last?'All set':'Next';nx.querySelector('b').textContent=last?'Request a quote':names[i+1];
  nx.classList.toggle('cfg-done',last);
}
function cfgSync(){
  $$('#cfg-fns .cfg-app').forEach(b=>{const on=CFG.has(b.dataset.c);b.classList.toggle('on',on);b.setAttribute('aria-pressed',on);});
  $$('#cfg-fns .cfg-all').forEach(b=>{const cs=FN[b.dataset.fn],n=cs.filter(c=>CFG.has(c)).length,full=n===cs.length;
    b.textContent=full?'Clear':'Select all';b.setAttribute('aria-pressed',full);});
  const sel=ALL_CODES.filter(c=>CFG.has(c)), n=sel.length;
  $('#cfg-count').textContent=n?n+(n===1?' application selected':' applications selected'):'Nothing selected yet';
  $('#cfg-empty').hidden=n>0;
  $('#cfg-list').innerHTML=sel.map(c=>'<li><span><b>'+c+'</b><small>'+esc(FNOF[c])+'</small></span><button type="button" data-rm="'+c+'" aria-label="Remove '+c+'"><i data-i="x" data-s="12"></i></button></li>').join('');
  paintIcons($('#cfg-list'));
  $('#cfg-sum').classList.toggle('has',n>0);
  $$('#cfg-fns .cfg-g').forEach(g=>{const cs=FN[g.dataset.fn],k=cs.filter(c=>CFG.has(c)).length;
    g.classList.toggle('on',k>0);const tb=$('#cfg-fns .cfg-tab[data-step="'+[...g.parentNode.querySelectorAll('.cfg-g')].indexOf(g)+'"]');if(tb)tb.classList.toggle('has',k>0);g.querySelector('.cfg-gc').textContent=k+' / '+cs.length;g.style.setProperty('--p',k/cs.length);});
}
/* the quote form lists the same applications, grouped by business function */
(function(){
  const p=$('#f-pkg-p'); if(!p)return; const foot=p.querySelector('.ms-foot');
  const groups=Object.entries(FN).map(([fn,cs])=>'<div class="ms-g" role="group" aria-label="'+esc(fn)+'"><span class="ms-gl" aria-hidden="true">'+esc(fn)+'</span>'+
    cs.map(c=>'<label class="ms-o"><input type="checkbox" name="package" value="'+c+'"><span>'+c+'</span></label>').join('')+'</div>').join('');
  const other='<div class="ms-g" role="group" aria-label="Other"><span class="ms-gl" aria-hidden="true">Other</span><label class="ms-o"><input type="checkbox" name="package" value="Something not listed (custom)"><span>Something not listed (custom)</span></label></div>';
  p.innerHTML=groups+other; p.appendChild(foot);
})();
$$('.js-quote').forEach(a=>a.addEventListener('click',()=>{const ms=$('#f-pkg');
  ms.querySelectorAll('input').forEach(i=>{i.checked=CFG.has(i.value);});msPaint(ms);}));
/* package buttons pre-fill the form; Early Access ticks the trial box */
/* multi-select dropdowns (checkbox lists) */
const msVal=ms=>[...ms.querySelectorAll('input:checked')].map(i=>i.value);
function msPaint(ms){const v=msVal(ms),out=ms.querySelector('.ms-v');
  out.textContent=!v.length?'Not sure yet':v.length<3?v.join(', '):`${v[0]} +${v.length-1} more`;
  out.classList.toggle('ph',!v.length);}
function msOpen(ms,on,focusBtn){const b=ms.querySelector('.ms-btn'),p=ms.querySelector('.ms-p');
  if(on)$$('.ms').forEach(o=>{if(o!==ms)msOpen(o,false);});
  p.hidden=!on;b.setAttribute('aria-expanded',on);
  if(on)ms.querySelector('input').focus(); else if(focusBtn)b.focus();}
$$('.ms').forEach(ms=>{
  ms.querySelector('.ms-btn').onclick=()=>msOpen(ms,ms.querySelector('.ms-p').hidden);
  ms.querySelectorAll('input').forEach(i=>i.addEventListener('change',()=>msPaint(ms)));
  ms.querySelector('.ms-clear').onclick=()=>{ms.querySelectorAll('input').forEach(i=>i.checked=false);msPaint(ms);ms.querySelector('input').focus();};
  ms.querySelector('.ms-done').onclick=()=>msOpen(ms,false,true);
  ms.addEventListener('keydown',e=>{if(e.key==='Escape'&&!ms.querySelector('.ms-p').hidden){e.stopPropagation();msOpen(ms,false,true);}});
  ms.addEventListener('focusout',e=>{if(!ms.contains(e.relatedTarget)&&e.relatedTarget)msOpen(ms,false);});
  msPaint(ms);
});
document.addEventListener('click',e=>{$$('.ms').forEach(ms=>{if(!ms.contains(e.target))msOpen(ms,false);});});
$$('.js-ea').forEach(b=>b.addEventListener('click',()=>{$('#f-ea').checked=true;
  if($('#form-body').hidden){$('#form-ok').hidden=true;$('#form-body').hidden=false;}
  $('#form').scrollIntoView({behavior:RM()?'auto':'smooth',block:'center'});$('#f-name').focus({preventScroll:true});}));
/* billing-unit tooltip */
const tipB=$('#tip-btn'), tipP=$('#tip-site');
function tip(on){tipP.hidden=!on;tipB.setAttribute('aria-expanded',on);}
let tipPin=false;
tipB.onclick=()=>{tipPin=!tipPin||tipP.hidden;tip(tipPin);};
tipB.addEventListener('mouseenter',()=>tip(true));
$('.unit-tip').addEventListener('mouseleave',()=>{if(!tipPin)tip(false);});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!tipP.hidden){tipPin=false;tip(false);tipB.focus();}});
document.addEventListener('click',e=>{if(!e.target.closest('.unit-tip')){tipPin=false;tip(false);}});

/* ---------- FAQ ---------- */
let FCAT=store.get('faqcat')||'all', FALL=false;
function applyFaq(){
  $$('#faq-list details').forEach(d=>{const show=FCAT==='all'?(FALL||d.dataset.top):d.dataset.c===FCAT;d.classList.toggle('hide',!show);});
  $$('.fcats .fchip').forEach(c=>{const on=c.dataset.c===FCAT;c.classList.toggle('on',on);c.setAttribute('aria-pressed',on);});
  const n=$$('#faq-list details').length;
  $('#faq-all').hidden=!(FCAT==='all'&&!FALL);
  $('#faq-all').textContent=`View all questions (${n})`;
}
$$('.fcats .fchip').forEach(c=>c.onclick=()=>{FCAT=c.dataset.c;store.set('faqcat',FCAT);applyFaq();});
$('#faq-all').onclick=()=>{FALL=true;applyFaq();$$('#faq-list details:not(.hide)')[6]?.querySelector('summary').focus();};
function openFaq(id){FCAT='cp';store.set('faqcat',FCAT);applyFaq();$(id).open=true;}
$$('.js-fp').forEach(a=>a.addEventListener('click',()=>openFaq('#faq-fp')));
$$('.js-site').forEach(a=>a.addEventListener('click',()=>{tip(false);openFaq('#faq-site');}));

/* ---------- form validation ---------- */
$('#form').addEventListener('submit',e=>{
  e.preventDefault();
  const f=[['#f-name','#e-name',v=>v.trim().length>1],['#f-mail','#e-mail',v=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())],['#f-co','#e-co',v=>v.trim().length>1]];
  let first=null;
  f.forEach(([i,er,ok])=>{const el=$(i),good=ok(el.value);el.setAttribute('aria-invalid',!good);$(er).hidden=good;if(!good&&!first)first=el;});
  if(first){first.focus();return;}
  $('#ok-sum').innerHTML=[['Name',$('#f-name').value],['Work email',$('#f-mail').value],['Company',$('#f-co').value],['Improve',msVal($('#f-goal')).join(', ')||'Not sure yet'],['Package',msVal($('#f-pkg')).join(', ')||'Not sure yet'],['Early Access trial',$('#f-ea').checked?'Yes, I’d like to participate':'Not requested']].map(r=>`<dt>${r[0]}</dt><dd>${esc(r[1].trim())}</dd>`).join('');
  $('#form-body').hidden=true;$('#form-ok').hidden=false;$('#form-ok').focus();
});
$('#ok-edit').onclick=()=>{$('#form-ok').hidden=true;$('#form-body').hidden=false;$('#f-name').focus();};
$$('#form input').forEach(el=>el.addEventListener('input',()=>{if(el.getAttribute('aria-invalid')==='true'){el.removeAttribute('aria-invalid');$('#'+el.getAttribute('aria-describedby')).hidden=true;}}));

/* ---------- demo modal ---------- */
const modal=$('#modal'); let lastFocus=null;
function openModal(){lastFocus=document.activeElement;modal.hidden=false;$('#modal-x').focus();}
function closeModal(){modal.hidden=true;lastFocus&&lastFocus.focus();}
$$('.js-demo').forEach(b=>b.onclick=openModal);
$('#modal-x').onclick=closeModal;
$('#modal-cta').onclick=()=>{modal.hidden=true;};
trapDialog(modal,closeModal);

/* ---------- navbar: highlight the section that fills most of the viewport ---------- */
const SPY=['how-it-works','solutions','platform','integrations','ontrix','nexa','get-started','pricing','trust','faq','walkthrough'].map(id=>document.getElementById(id));
let spyRaf=0, spyCur='';
/* Section bounds are cached in document coordinates and refreshed only when the page resizes, so
   scrolling never forces a layout read (it used to call getBoundingClientRect on every section each frame). */
let spyBounds=[],spyNavH=0,spyLinks=[],spyDirty=true;
function spyMeasure(){const y=scrollY;spyNavH=$('.nav').offsetHeight;spyLinks=$$('.nav-links a, .atlas-mobile-menu > div:first-child a');
  spyBounds=SPY.map(el=>{const r=el.getBoundingClientRect();return {id:el.id,top:r.top+y,bottom:r.bottom+y};});spyDirty=true;}
function spyUpdate(){spyRaf=0;const refY=scrollY+spyNavH+(innerHeight-spyNavH)*0.3;let best='';
  spyBounds.forEach(b=>{if(b.top<=refY&&b.bottom>refY)best=b.id;});
  if(best===spyCur&&!spyDirty)return;
  spyCur=best;spyDirty=false;
  spyLinks.forEach(a=>{const on=!!best&&(a.dataset.sec||'').split(' ').includes(best);a.classList.toggle('on',on);on?a.setAttribute('aria-current','true'):a.removeAttribute('aria-current');});}
addEventListener('scroll',()=>{if(!spyRaf)spyRaf=requestAnimationFrame(spyUpdate);},{passive:true});
const spyRemeasure=()=>{spyMeasure();if(!spyRaf)spyRaf=requestAnimationFrame(spyUpdate);};
addEventListener('resize',spyRemeasure);
if('ResizeObserver' in window)new ResizeObserver(spyRemeasure).observe($('main'));
spyMeasure();spyUpdate();

/* mobile sticky CTA: compact, dismissible; hidden over the hero, the final form and while typing */
const mcta=$('#mcta'); let heroVis=true, formVis=false, typing=false;
if(store.get('mcta')==='x')mcta.classList.add('gone');
const upd=()=>mcta.classList.toggle('show',!heroVis&&!formVis&&!typing&&railVis.size===0);
new IntersectionObserver(e=>{heroVis=e[0].isIntersecting;upd();}).observe($('.hero2-ctas'));
new IntersectionObserver(e=>{formVis=e[0].isIntersecting;upd();}).observe($('#form'));
const railVis=new Set();const railIO=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting)railVis.add(e.target);else railVis.delete(e.target);});upd();});
$$('.rail-dots,.dots-nav,.plans3,.snap').forEach(el=>railIO.observe(el));
document.addEventListener('focusin',e=>{typing=!!e.target.closest('input,select,textarea');upd();});
$('#mcta-x').onclick=()=>{mcta.classList.add('gone');store.set('mcta','x');};
/* mobile: secondary detail starts collapsed (design fix M-03) */
(function(){
  const mq=matchMedia('(max-width:720px)');
  const BOXES=[['.tcol','.tcol-h'],['.lockin','.li-h']];
  const intg=$('#integrations');
  if(intg){
    const grid=intg.querySelector('.integ-grid');
    if(grid){
      const tgl=document.createElement('button');
      tgl.type='button';tgl.className='btn btn-ghost btn-sm mc-toggle';
      tgl.setAttribute('aria-expanded','false');tgl.textContent='Show supported systems';
      grid.parentNode.insertBefore(tgl,grid);
      tgl.addEventListener('click',()=>{
        const open=intg.classList.toggle('mc-open');
        tgl.setAttribute('aria-expanded',String(open));
        tgl.textContent=open?'Hide supported systems':'Show supported systems';
      });
    }
  }
  function setup(){
    BOXES.forEach(([b,h])=>$$(b).forEach(box=>{
      const head=box.querySelector(':scope > '+h);
      if(!head)return;
      if(mq.matches){
        box.classList.add('mc');
        head.setAttribute('role','button');head.tabIndex=0;
        head.setAttribute('aria-expanded',String(box.classList.contains('mc-open')));
      }else{
        box.classList.toggle('mc',false);box.classList.toggle('mc-open',false);
        ['role','tabindex','aria-expanded'].forEach(a=>head.removeAttribute(a));
      }
    }));
    if(intg)intg.classList.toggle('mc-ready',mq.matches);
  }
  document.addEventListener('click',e=>{
    if(!mq.matches)return;
    const head=e.target.closest('.tcol-h,.li-h');
    if(!head)return;
    const box=head.parentElement;
    if(!box.classList.contains('mc'))return;
    head.setAttribute('aria-expanded',String(box.classList.toggle('mc-open')));
  });
  document.addEventListener('keydown',e=>{
    if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('.tcol-h[role=button],.li-h[role=button]')){
      e.preventDefault();e.target.click();
    }
  });
  mq.addEventListener('change',setup);setup();
})();
/* mobile: long secondary blocks fold behind one toggle (design fix M-03) */
(function(){
  const mq=matchMedia('(max-width:720px)');
  /* '.shift' (How operations change) is no longer folded: the table stays open on phones and tablets */
  const BLOCKS=[
    ['.roles-row','Show the four views','Hide the four views'],
    ['.dep3','Show deployment options','Hide deployment options']
  ];
  const items=BLOCKS.map(([sel,showText,hideText])=>{
    const block=$(sel);
    if(!block)return null;
    const btn=document.createElement('button');
    btn.type='button';btn.className='btn btn-ghost btn-sm mc-toggle mcb-toggle';
    btn.setAttribute('aria-expanded','false');btn.textContent=showText;
    block.parentNode.insertBefore(btn,block);
    btn.addEventListener('click',()=>{
      const open=block.classList.toggle('mcb-open');
      btn.setAttribute('aria-expanded',String(open));
      btn.textContent=open?hideText:showText;
    });
    return block;
  }).filter(Boolean);
  const sync=()=>items.forEach(b=>{b.classList.toggle('mcb',mq.matches);if(!mq.matches)b.classList.remove('mcb-open');});
  mq.addEventListener('change',sync);sync();
})();
/* Solutions: second filter group opens on demand */
(function(){
  const more=$('.bf-more'),box=$('.bf');
  if(!more||!box)return;
  more.addEventListener('click',()=>{
    const open=box.classList.toggle('bf-open');
    more.setAttribute('aria-expanded',String(open));
    more.firstChild.textContent=open?'Hide business function filter ':'Filter by business function ';
  });
})();
['#og-tabs'].forEach(s=>arrowNav($(s)));
railify($('.prob-grid'));initStage();renderBrowse();renderGantt();renderOG(0);applyFaq();paintIcons();

/* ---------- scroll choreography ----------
   The page-level fade-up (LandingPage.tsx) moves whole blocks. This moves what is inside them:
   cards arrive one after another, the platform layers stack, the chart bars grow and the
   comparison spine draws. Only transform and opacity, once per element, and nothing is hidden
   unless this script runs and the visitor has not asked for reduced motion. */
(function(){
  if(!('IntersectionObserver' in window)||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  document.documentElement.classList.add('rv-on');
  const STEP=70, CAP=8, DUR=600;

  /* 1 · groups whose children arrive in sequence */
  const GROUPS=['.prob-grid','.loop4','.phases','.layers','.plans3','.pillars','.dep3','.feat-grid','.integ-grid','.tacc-list'];
  const groups=[...new Set(GROUPS.flatMap(s=>$$(s)))];
  groups.forEach(g=>{
    [...g.children].forEach((c,i)=>{c.classList.add('rv-item');c.style.setProperty('--i',Math.min(i,CAP));});
    g.classList.add('rv-group');
  });

  /* 2 · scenes with their own choreography */
  const scenes=[...$$('.plat'),...$$('.gantt'),...$$('.cmp2')];
  $$('.gantt .g-row').forEach((r,i)=>r.style.setProperty('--i',i));
  $$('.cmp2 .cmp2-row').forEach((row,i)=>{
    const a=row.querySelector('.a'),b=row.querySelector('.b');
    [a,b].forEach(c=>{if(!c)return;c.classList.add('rv-item');c.style.setProperty('--i',i);});
    a&&a.classList.add('rv-from-l');b&&b.classList.add('rv-from-r');
  });
  const cmp=$('.cmp2');if(cmp)cmp.classList.add('rv-group');

  /* once the entrance is over, hand the elements back to their own CSS (hover transitions etc.) */
  const settle=g=>{
    const n=Math.min(g.querySelectorAll('.rv-item').length,CAP+1);
    setTimeout(()=>{
      g.querySelectorAll('.rv-item').forEach(c=>{c.classList.remove('rv-item','rv-from-l','rv-from-r');c.style.removeProperty('--i');});
      g.classList.remove('rv-group');
    },DUR+n*STEP+400);
  };
  const io=new IntersectionObserver(es=>es.forEach(e=>{
    if(!e.isIntersecting&&e.boundingClientRect.top>=0)return;
    const t=e.target;io.unobserve(t);
    t.classList.add('rv-in');
    if(t.classList.contains('rv-group')||t.querySelector('.rv-item'))settle(t);
  }),{threshold:0,rootMargin:'0px 0px -12% 0px'});
  [...groups,...scenes].forEach(el=>io.observe(el));
})();

/* ---------- platform diagram: plates spin with scroll ----------
   Scrubbed to scroll position, not triggered. Each of the three plates turns inside its own plane,
   at its own rate and alternating direction. The drawn design is exactly what shows when the
   diagram is centred in the viewport; scrolling either way turns the plates up to a quarter turn. */
(function(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const plat=$('.plat'),art=$('.plat-art'),svg=art&&art.querySelector('svg');
  if(!plat||!svg)return;
  const layers=[...svg.querySelectorAll(':scope > g')];          /* DOM order is bottom to top */
  const SPIN=[-70,90,-110];                                        /* degrees at the scroll extremes, alternating direction */
  const THICK=14;                                                  /* slab thickness, as drawn */
  const NS='http://www.w3.org/2000/svg';
  /* each plate: a 100 x 100 square in plate space, projected by the same affine map as the drawn polygon */
  const plates=layers.map((g,i)=>{
    const polys=[...g.querySelectorAll(':scope > polygon')];       /* [side, side, top] */
    const top=polys[2],grid=g.querySelector(':scope > g[transform^="matrix"]');
    if(!top||!grid)return null;
    const pts=top.getAttribute('points').trim().split(/\s+/).map(s=>s.split(',').map(Number));
    const [T,R,,L]=pts;                                            /* top, right, bottom, left corners */
    const a=[(R[0]-T[0])/100,(R[1]-T[1])/100],c=[(L[0]-T[0])/100,(L[1]-T[1])/100];
    const sides=[polys[0],polys[1]];
    for(let k=0;k<2;k++){const n=polys[0].cloneNode();g.insertBefore(n,top);sides.push(n);}
    sides.forEach(s=>s.removeAttribute('fill-opacity'));
    return {g,top,grid,T,a,c,sides,matrix:grid.getAttribute('transform').replace(/matrix\(([^)]+)\)/,(m,v)=>'matrix('+v.trim().split(/\s+/).join(',')+')'),spin:SPIN[i]||0};
  }).filter(Boolean);
  let cur=0,target=0,raf=0,live=false,near=false;

  const progress=()=>{
    const r=art.getBoundingClientRect(),vh=innerHeight;
    return Math.max(-1,Math.min(1,(r.top+r.height/2-vh/2)/(vh/2+r.height/2)));
  };
  const paintPlate=(pl,deg)=>{
    const t=deg*Math.PI/180,cs=Math.cos(t),sn=Math.sin(t);
    /* spin the surface (grid and nodes) inside its own plane */
    pl.grid.style.transform=pl.matrix+' translate(50px,50px) rotate('+deg.toFixed(2)+'deg) translate(-50px,-50px)';
    /* rebuild the silhouette from the rotated square so the edges follow */
    const P=[[0,0],[100,0],[100,100],[0,100]].map(([x,y])=>{
      const dx=x-50,dy=y-50,rx=50+dx*cs-dy*sn,ry=50+dx*sn+dy*cs;
      return [pl.T[0]+pl.a[0]*rx+pl.c[0]*ry,pl.T[1]+pl.a[1]*rx+pl.c[1]*ry];
    });
    const cx=(P[0][0]+P[1][0]+P[2][0]+P[3][0])/4;
    const f=n=>n.toFixed(1);
    const edges=P.map((p,i)=>{const q=P[(i+1)%4];return {p,q,my:(p[1]+q[1])/2,mx:(p[0]+q[0])/2};}).sort((u,v)=>u.my-v.my);
    edges.forEach((e,i)=>{                                        /* back edges first, so front edges overlap them */
      const s=pl.sides[i];
      s.setAttribute('points',f(e.p[0])+','+f(e.p[1])+' '+f(e.q[0])+','+f(e.q[1])+' '+f(e.q[0])+','+f(e.q[1]+THICK)+' '+f(e.p[0])+','+f(e.p[1]+THICK));
      s.setAttribute('fill-opacity',e.mx<cx?'1':'.75');
    });
    pl.top.setAttribute('points',P.map(p=>f(p[0])+','+f(p[1])).join(' '));
  };
  const paint=()=>{plates.forEach(pl=>paintPlate(pl,cur*pl.spin));};
  const tick=()=>{
    raf=0;
    cur+=(target-cur)*0.14;                                        /* ease toward the scroll position */
    if(Math.abs(target-cur)<0.0008)cur=target;
    paint();
    if(cur!==target&&near)raf=requestAnimationFrame(tick);
  };
  const kick=()=>{if(!live||!near)return;target=progress();if(!raf)raf=requestAnimationFrame(tick);};

  new IntersectionObserver(es=>es.forEach(e=>{near=e.isIntersecting;if(near)kick();}),{rootMargin:'200px 0px 200px 0px'}).observe(art);
  addEventListener('scroll',kick,{passive:true});
  addEventListener('resize',kick);

  /* wait for the entrance (layers landing) before taking over the same property */
  const go=()=>{
    cur=target=progress();paint();
    plat.classList.add('rv-live');live=true;kick();
  };
  if(plat.classList.contains('rv-in')||!document.documentElement.classList.contains('rv-on'))go();
  else{
    const mo=new MutationObserver(()=>{if(plat.classList.contains('rv-in')){mo.disconnect();setTimeout(go,1600);}});
    mo.observe(plat,{attributes:true,attributeFilter:['class']});
  }
})();

/* ---------- dot-matrix section labels ----------
   Every .eyebrow is drawn as a grid of dots (a few of them blue). Near the pointer the dots are
   pushed away and turn blue, then spring back. The real text stays in the DOM for screen readers
   and the canvas is decoration. With reduced motion the labels are drawn once and never move. */
(function(){
  const labels=$$('.eyebrow');
  if(!labels.length)return;
  const still=matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* values below are for a FONT_PX label; every label rescales them by (its font size / FONT_PX) */
  /* a fine, tightly packed hexagonal lattice: about 23 rows across the capital height, dots almost touching */
  const FONT_PX=104, B_STEP=3.3, B_DOT_R=1.3, B_PAD=130, B_REACH=125, B_PUSH=10, MAX_CHARS=40, MIN_FONT_PX=30, LINE_BREAK_PX=40, SS=4, ROW=.866, WEIGHT=600;
  const SPRING=.065, DAMP=.82, COOL=.93;

  const lum=c=>{const m=c.match(/\d+(\.\d+)?/g)||[0,0,0];const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);};return .2126*f(+m[0])+.7152*f(+m[1])+.0722*f(+m[2]);};
  const seeded=i=>{const x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x);};
  const instances=[];

  function build(el){
    const text=[...el.childNodes].map(n=>n.textContent.trim()).filter(Boolean).join(' ');
    if(!text||text.length>MAX_CHARS)return;                        /* sentences stay as ordinary text */
    const onDark=lum(getComputedStyle(el).color)>.3;               /* light text colour means a dark section */
    const ink=onDark?[255,255,255]:[20,15,46], blue=onDark?[167,139,250]:[124,58,237];   /* "blue" is the accent: the site's purple */
    const rgb=a=>'rgb('+a[0]+','+a[1]+','+a[2]+')';
    const mix=k=>[0,1,2].map(i=>Math.round(ink[i]*(1-k)+blue[i]*k));

    /* sample the text on an offscreen canvas */
    const off=document.createElement('canvas'),octx=off.getContext('2d',{willReadFrequently:true});
    const avail=(el.parentElement&&el.parentElement.clientWidth)||Infinity;
    const base=+el.dataset.dmSize||FONT_PX;                        /* a label may ask for its own starting size */
    const fontAt=px=>WEIGHT+' '+px+'px Sora, Manrope, system-ui, sans-serif';
    const widthAt=(s,px)=>{octx.font=fontAt(px);return octx.measureText(s).width;};
    /* one line that never runs wider than its column. When that would shrink the dots too small (phones),
       split into two balanced lines so the same dot-matrix label is used at every screen size */
    let lines=[text];
    let fpx=Math.floor(base*Math.min(1,avail/(widthAt(text,base)+2)));
    if(fpx<LINE_BREAK_PX&&text.indexOf(' ')>0){
      const words=text.split(' ');let best=null;
      for(let i=1;i<words.length;i++){
        const a=words.slice(0,i).join(' '),b=words.slice(i).join(' ');
        const wide=Math.max(widthAt(a,base),widthAt(b,base));
        if(!best||wide<best.wide)best={lines:[a,b],wide};
      }
      if(best){const f2=Math.floor(base*Math.min(1,avail/(best.wide+2)));if(f2>=fpx*1.25){lines=best.lines;fpx=f2;}}
    }
    if(fpx<MIN_FONT_PX)return;                                      /* truly too small to read as dots: keep the plain label */
    /* on small sizes the lattice keeps a minimum pitch, so the dots stay visible instead of fusing into grey */
    const k=fpx/FONT_PX, STEP=Math.max(B_STEP*k,2.2), DOT_R=Math.min(Math.max(B_DOT_R*k,.95),STEP*.42), PAD=Math.round(B_PAD*k), REACH=B_REACH*k, PUSH=B_PUSH*k;
    const LH=Math.round(fpx*1.06);
    const w=Math.ceil(Math.max(...lines.map(s=>widthAt(s,fpx))))+2, h=Math.ceil(fpx*1.3)+(lines.length-1)*LH;
    /* draw 4x so each dot can be decided from the coverage of its whole cell, which keeps edges clean */
    off.width=w*SS;off.height=h*SS;
    octx.font=fontAt(fpx*SS);octx.textBaseline='alphabetic';octx.fillStyle='#000';
    lines.forEach((s,i)=>octx.fillText(s,SS,Math.round(fpx*.98*SS)+i*LH*SS));
    const data=octx.getImageData(0,0,w*SS,h*SS).data, W=w*SS;
    /* hexagonal lattice: every other row is shifted by half a step, rows sit 0.866 steps apart */
    const box=Math.max(2,Math.round(STEP*SS*.75)), half=box>>1, H=h*SS;
    const dots=[];let n=0;
    for(let r=0,gy=STEP*ROW/2;gy<h;r++,gy+=STEP*ROW){
      for(let gx=STEP/2+(r%2?STEP/2:0);gx<w;gx+=STEP){
        const x0=Math.round(gx*SS)-half,y0=Math.round(gy*SS)-half;
        n++;
        if(x0<0||y0<0||x0+box>W||y0+box>H)continue;
        let sum=0;
        for(let yy=0;yy<box;yy++){const row=((y0+yy)*W+x0)*4+3;for(let xx=0;xx<box;xx++)sum+=data[row+xx*4];}
        if(sum/(box*box*255)>.5)dots.push({hx:gx,hy:gy,x:gx,y:gy,vx:0,vy:0,hot:0,accent:seeded(n)<.05});
      }
    }

    /* markup: real text for assistive tech, canvas for the eyes */
    el.textContent='';
    const sr=document.createElement('span');sr.className='sr';sr.textContent=text;
    const cv=document.createElement('canvas');cv.className='dm-canvas';cv.setAttribute('aria-hidden','true');
    el.append(sr,cv);el.classList.add('dm');
    el.style.setProperty('--dm-w',w+'px');el.style.setProperty('--dm-h',h+'px');
    const dpr=Math.min(devicePixelRatio||1,2),cw=w+PAD*2,ch=h+PAD*2;
    cv.style.width=cw+'px';cv.style.height=ch+'px';cv.style.left=-PAD+'px';cv.style.top=-PAD+'px';
    cv.width=Math.round(cw*dpr);cv.height=Math.round(ch*dpr);
    const ctx=cv.getContext('2d');

    const inst={el,dots,w,h,reach:REACH,px:null,py:null,raf:0,visible:true,
      draw(){
        ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,cw,ch);
        ctx.fillStyle=rgb(ink);ctx.beginPath();
        const special=[];
        for(const d of dots){
          if(d.accent||d.hot>.02){special.push(d);continue;}
          const x=PAD+d.x,y=PAD+d.y;ctx.moveTo(x+DOT_R,y);ctx.arc(x,y,DOT_R,0,6.2832);
        }
        ctx.fill();
        for(const d of special){
          const k=d.accent?1:Math.min(1,d.hot);
          ctx.fillStyle=rgb(d.accent?blue:mix(k));
          ctx.beginPath();ctx.arc(PAD+d.x,PAD+d.y,DOT_R*(1+.25*Math.min(1,d.hot)),0,6.2832);ctx.fill();
        }
      },
      step(){
        inst.raf=0;let moving=false;
        for(const d of dots){
          if(inst.px!==null){
            const dx=d.x-inst.px,dy=d.y-inst.py,dist=Math.hypot(dx,dy)||.001;
            if(dist<REACH){const f=Math.pow(1-dist/REACH,2)*PUSH;d.vx+=dx/dist*f;d.vy+=dy/dist*f;d.hot=Math.max(d.hot,Math.min(1,(1-dist/REACH)*1.6));}
          }
          d.vx+=(d.hx-d.x)*SPRING;d.vy+=(d.hy-d.y)*SPRING;
          d.vx*=DAMP;d.vy*=DAMP;d.x+=d.vx;d.y+=d.vy;d.hot*=COOL;
          if(Math.abs(d.vx)>.01||Math.abs(d.vy)>.01||Math.abs(d.x-d.hx)>.05||Math.abs(d.y-d.hy)>.05||d.hot>.02)moving=true;
        }
        inst.draw();
        if(moving||inst.px!==null)inst.raf=requestAnimationFrame(inst.step);
        else{for(const d of dots){d.x=d.hx;d.y=d.hy;d.hot=0;}inst.draw();}
      },
      wake(){if(!inst.raf)inst.raf=requestAnimationFrame(inst.step);}
    };
    inst.draw();instances.push(inst);
  }

  const start=()=>{
    labels.forEach(build);
    if(still||!instances.length)return;
    const io=new IntersectionObserver(es=>es.forEach(e=>{const i=instances.find(x=>x.el===e.target);if(i)i.visible=e.isIntersecting;}),{rootMargin:'80px'});
    instances.forEach(i=>io.observe(i.el));
    addEventListener('pointermove',e=>{
      if(e.pointerType==='touch')return;
      for(const i of instances){
        if(!i.visible)continue;
        const r=i.el.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
        const inside=x>-i.reach&&x<i.w+i.reach&&y>-i.reach&&y<i.h+i.reach;
        if(inside){i.px=x;i.py=y;i.wake();}
        else if(i.px!==null){i.px=null;i.wake();}
      }
    },{passive:true});
    document.addEventListener('pointerleave',()=>instances.forEach(i=>{if(i.px!==null){i.px=null;i.wake();}}));
  };
  (document.fonts&&document.fonts.load?document.fonts.load('600 104px Sora').catch(()=>{}):Promise.resolve()).then(()=>document.fonts&&document.fonts.ready?document.fonts.ready:null).then(start,start);
})();

/* ---------- nav: denser glass once the page has scrolled ---------- */
(function(){
  const nav=$('.nav');
  if(!nav)return;
  /* --nav-t runs 0..1 as the bar leaves the dark hero and crosses onto light sections.
     It is eased toward its target every frame, so the glass changes gradually, never in a step. */
  const hero=$('.hero2');
  let cur=0,tgt=0,raf=0,end=900,written='';
  /* the hero height is cached: reading offsetHeight on every scroll event forced a layout each frame */
  const readEnd=()=>{end=hero?hero.offsetHeight:900;};
  const measure=()=>{tgt=Math.max(0,Math.min(1,(scrollY-(end-210))/260));};
  const tick=()=>{
    raf=0;cur+=(tgt-cur)*.16;
    if(Math.abs(tgt-cur)<.002)cur=tgt;
    const v=cur.toFixed(3);
    if(v!==written){written=v;nav.style.setProperty('--nav-t',v);}
    if(cur!==tgt)raf=requestAnimationFrame(tick);
  };
  const kick=()=>{measure();if(cur!==tgt&&!raf)raf=requestAnimationFrame(tick);};
  const rekick=()=>{readEnd();kick();};
  addEventListener('scroll',kick,{passive:true});addEventListener('resize',rekick);
  if(hero&&'ResizeObserver' in window)new ResizeObserver(rekick).observe(hero);
  readEnd();measure();cur=tgt;written=String(cur);nav.style.setProperty('--nav-t',cur);
})();

/* ---------- hero video ----------
   Plays only when it should: not with reduced motion, not on Save-Data, and paused while the hero is
   off screen so it costs nothing further down the page. It fades in once frames are actually playing. */
(function(){
  const first=$('.hero-video');
  if(!first)return;
  const conn=navigator.connection||{};
  if(matchMedia('(prefers-reduced-motion: reduce)').matches||conn.saveData){first.remove();return;}

  /* Seamless loop: two copies of the same video. Shortly before the playing one ends, the other starts
     from 0 and fades in over it, so there is never a visible end or restart. */
  const FADE=1.2;
  const second=first.cloneNode(true);
  [first,second].forEach(v=>{v.loop=false;v.removeAttribute('loop');v.muted=true;v.defaultMuted=true;});
  second.removeAttribute('autoplay');second.classList.remove('on');
  first.parentNode.appendChild(second);
  first.style.zIndex=1;second.style.zIndex=2;
  let cur=first,nxt=second,fading=false;

  const tryPlay=v=>{const p=v.play();if(p&&p.catch)p.catch(()=>{});};
  const firstShow=()=>cur.classList.add('on');
  first.addEventListener('playing',firstShow,{once:true});
  first.addEventListener('timeupdate',()=>{if(first.currentTime>0)firstShow();},{once:true});
  if(!first.paused&&first.readyState>=3)firstShow();                /* it may have started before this script ran */

  const swap=()=>{
    const old=cur;cur=nxt;nxt=old;
    old.pause();
    old.style.transition='none';old.classList.remove('on');old.currentTime=0;void old.offsetWidth;old.style.transition='';
    cur.style.zIndex=1;nxt.style.zIndex=2;                           /* the one waiting is always on top, invisible */
    fading=false;
  };
  const watch=()=>{
    const d=cur.duration;
    if(!fading&&d&&isFinite(d)&&!cur.paused&&d-cur.currentTime<=FADE+.05){
      fading=true;
      nxt.currentTime=0;tryPlay(nxt);nxt.classList.add('on');       /* opacity transition does the dissolve */
      setTimeout(swap,FADE*1000+60);
    }
    raf=requestAnimationFrame(watch);
  };
  let raf=0;
  const start=()=>{if(!raf)raf=requestAnimationFrame(watch);};
  const stop=()=>{cancelAnimationFrame(raf);raf=0;};

  tryPlay(first);start();
  new IntersectionObserver(es=>es.forEach(e=>{
    if(e.isIntersecting){tryPlay(cur);if(fading)tryPlay(nxt);start();}
    else{first.pause();second.pause();stop();}
  }),{threshold:.05}).observe(first.parentNode);
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){first.pause();second.pause();stop();}
    else{tryPlay(cur);if(fading)tryPlay(nxt);start();}
  });
})();

/* ---------- overview stage ----------
   1. The statement lights up word by word, scrubbed to scroll (the hook: you read by scrolling).
   2. Terms from the sentence drift around it at different depths (parallax).
   3. The dot field and glow lag behind the page, so the section has a back and a front.
   Everything is derived from the scroll position and eased toward it. Only transform, translate
   and opacity move. Without this script, or with reduced motion, the section is simply static. */
(function(){
  const sec=$('#overview'),st=sec&&sec.querySelector('.ov-statement');
  if(!sec||!st)return;
  const still=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const chips=[...sec.querySelectorAll('.ov-chip')],lattice=sec.querySelector('.ov-lattice'),glow=sec.querySelector('.ov-glow');

  /* split the sentence into words (text is kept as is; only wrapped) and mark the key phrases */
  const HIGHLIGHT=['enterprise AI platform','manufacturing and construction'];
  const words=[];
  const walk=node=>{
    [...node.childNodes].forEach(n=>{
      if(n.nodeType===3){
        const frag=document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part=>{
          if(!part)return;
          if(/^\s+$/.test(part)){frag.appendChild(document.createTextNode(part));return;}
          const s=document.createElement('span');s.className='ov-w';s.textContent=part;frag.appendChild(s);words.push(s);
        });
        n.replaceWith(frag);
      }else if(n.nodeType===1)walk(n);
    });
  };
  walk(st);
  const norm=w=>w.textContent.toLowerCase().replace(/[^a-z0-9]/g,'');
  HIGHLIGHT.forEach(p=>{
    const parts=p.toLowerCase().split(' ').map(x=>x.replace(/[^a-z0-9]/g,''));
    for(let i=0;i+parts.length<=words.length;i++)
      if(parts.every((x,j)=>norm(words[i+j])===x))for(let j=0;j<parts.length;j++)words[i+j].classList.add('ov-hl');
  });

  /* place the drifting terms from their data attributes */
  chips.forEach(c=>{
    c.style.left=c.dataset.x+'%';c.style.top=c.dataset.y+'%';
    const b=+c.dataset.blur;if(b)c.style.filter='blur('+b+'px)';
  });
  sec.classList.add('ov-ready');
  if(still)return;                                                  /* static: everything stays lit and in place */

  sec.classList.add('ov-pinned');                                   /* the stage holds the screen while the words light up */
  words.forEach(w=>w.style.setProperty('--o',0));
  const AMP=380;                                                    /* px a depth-1 term travels from centre to edge */
  let sp=0,tp=0,cur=0,tgt=0,raf=0,near=false;                       /* word progress / section progress, current / target */

  const measure=()=>{
    const vh=innerHeight,r=sec.getBoundingClientRect();
    /* words: lit across the first 80% of the time the stage is pinned, then held fully lit */
    const pinRange=Math.max(1,r.height-vh);
    tp=Math.max(0,Math.min(1,-r.top/(pinRange*.8)));
    /* depth motion: 1 while the stage arrives from below, exactly 0 (the drawn layout) the moment it pins,
       a slow drift to -0.3 while it is pinned, then on up to -1 as it leaves */
    if(r.top>0)tgt=Math.min(1,r.top/vh);
    else if(r.top>=-pinRange)tgt=r.top/pinRange*.3;
    else tgt=Math.max(-1,-.3+(r.top+pinRange)/vh);
  };
  const paint=()=>{
    const n=words.length,reach=tp*(n+4);
    for(let i=0;i<n;i++){
      const o=Math.max(0,Math.min(1,sp*(n+4)-i));
      const w=words[i];
      if(w._o===undefined||Math.abs(w._o-o)>.012){w._o=o;w.style.setProperty('--o',o.toFixed(3));}
    }
    chips.forEach((c,i)=>{
      const d=+c.dataset.depth,dir=i%2?1:-1;
      c.style.translate=(cur*d*dir*60).toFixed(1)+'px '+(cur*d*AMP).toFixed(1)+'px';
      c.style.rotate=(cur*d*dir*7).toFixed(2)+'deg';
    });
    if(lattice)lattice.style.translate='0 '+(-cur*AMP*.34).toFixed(1)+'px';
    if(glow)glow.style.translate='-50% calc(-50% + '+(cur*AMP*.18).toFixed(1)+'px)';
  };
  const tick=()=>{
    raf=0;
    sp+=(tp-sp)*.16;cur+=(tgt-cur)*.12;
    if(Math.abs(tp-sp)<.0008)sp=tp;if(Math.abs(tgt-cur)<.0008)cur=tgt;
    paint();
    if((sp!==tp||cur!==tgt)&&near)raf=requestAnimationFrame(tick);
  };
  const kick=()=>{if(!near)return;measure();if(!raf)raf=requestAnimationFrame(tick);};
  new IntersectionObserver(es=>es.forEach(e=>{near=e.isIntersecting;if(near)kick();}),{rootMargin:'160px 0px 160px 0px'}).observe(sec);
  addEventListener('scroll',kick,{passive:true});addEventListener('resize',kick);
  measure();sp=tp;cur=tgt;paint();
})();



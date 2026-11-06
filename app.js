'use strict';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.getElementById('mobile-nav');
function closeMenu(){mobileNav.hidden=true;menuButton.setAttribute('aria-expanded','false');menuButton.lastElementChild.textContent='+';}
menuButton.addEventListener('click',()=>{const expanded=menuButton.getAttribute('aria-expanded')==='true';mobileNav.hidden=expanded;menuButton.setAttribute('aria-expanded',String(!expanded));menuButton.lastElementChild.textContent=expanded?'+':'−';});
mobileNav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu();});
window.matchMedia('(min-width: 701px)').addEventListener('change',event=>{if(event.matches)closeMenu();});

const projects={
  meghalaya:{kicker:'RESTORATION & CARBON / EARTHTREE DATA SERVICES',title:'Regeneration Meghalaya',intro:'Geospatial analysis and operational workflows for an afforestation, reforestation and revegetation (ARR) project in Meghalaya.',question:'How can multi-temporal land-cover information, eligibility criteria and spatial quality checks support a consistent restoration project dataset?',contributions:['Performed eligibility area analysis using remote-sensing datasets, land-use history and spatial exclusions.','Managed ARR geodatabases and designed strata, grids and sampling plots.','Developed Python and Earth Engine scripts for attribute generation and other repeatable GIS tasks.','Led GIS analysts and coordinated with drone, forestry, community engagement, carbon accounting and audit teams.'],outputs:'Sampling frames, eligibility layers, QA/QC checks, verification maps, tabular data packs and spatial services.',tools:'QGIS · Google Earth Engine · Python · PostgreSQL / PostGIS · GeoServer',note:'Project focus: spatial eligibility, monitoring workflows and quality-controlled GIS deliverables.'},
  himalaya:{kicker:'CONSERVATION / WII–UNDP SECURE HIMALAYA',title:'Mapping conservation values',intro:'Spatial analysis to identify and delineate areas with high conservation values in the SECURE Himalaya landscape of Himachal Pradesh.',question:'Where are important conservation values located, and how can spatial evidence support landscape management recommendations?',contributions:['Processed survey and spatial datasets for GIS analysis.','Undertook land-use / land-cover analysis, species distribution modelling and HCV delineation.','Developed Python scripts and ModelBuilder tools to support geospatial workflows.','Prepared maps and supported coordination with government stakeholders, NGOs and local communities.'],outputs:'High conservation value maps, supporting GIS analyses and contributions to a technical report and management recommendations.',tools:'ArcGIS · QGIS · ERDAS Imagine · Google Earth Engine · Python · R',note:'A multidisciplinary conservation project combining spatial analysis, field information and stakeholder perspectives.'},
  assam:{kicker:'ECOSYSTEM SERVICES / IIFM · TEEB AGRIFOOD',title:'Land use, ecosystems & value',intro:'GIS consulting for the TEEB AgriFood Initiative in Assam, connecting geospatial information with environmental assessment.',question:'How can spatial and environmental evidence help assess the consequences of agricultural and land-use choices?',contributions:['Integrate satellite, UAV, LiDAR and GIS information for terrain, vegetation and land-cover assessment.','Build spatial databases and thematic maps across environmental and socio-economic datasets.','Contribute to biophysical and environmental modelling and scenario assessment.','Translate analysis into technical reports, policy-relevant information and training materials.'],outputs:'Ongoing work on spatial datasets, environmental analysis and modelling to support ecosystem-service assessment.',tools:'GIS & remote sensing · Python / R · SWAT · InVEST · DSSAT',note:'Ongoing work: spatial analysis and environmental assessment for the TEEB AgriFood Initiative in Assam.'},
  water:{kicker:'HYDROLOGY / IIRS · ACADEMIC DISSERTATION · 2018',title:'Exploring water futures',intro:'Assessment of climate-change impacts on the hydrological regime of a river basin, with a web portal to communicate simulated water-balance components.',question:'How can basin simulations be made easier to explore and interpret through a geospatial web interface?',contributions:['Collected data and set up a suitable hydrological model in a GIS environment.','Performed basin hydrological simulations to explore climate-change impacts.','Developed a web portal using HTML, CSS, JavaScript and Leaflet.','Implemented measurement, layer visibility, zoom and basin-information controls.'],outputs:'A dissertation workflow and a web-based visualization of simulated water-balance components.',tools:'SWAT · QGIS · HTML / CSS · JavaScript · Leaflet',note:'Academic dissertation project completed at the Indian Institute of Remote Sensing in 2018.'}
};
const dialog=document.getElementById('project-dialog');
let lastProjectButton=null;
document.querySelectorAll('[data-project]').forEach(button=>button.addEventListener('click',()=>{
  const p=projects[button.dataset.project];lastProjectButton=button;
  document.getElementById('dialog-kicker').textContent=p.kicker;
  document.getElementById('dialog-title').textContent=p.title;
  document.getElementById('dialog-intro').textContent=p.intro;
  document.getElementById('dialog-content').innerHTML=`<div class="dialog-grid"><div><h3>The question</h3><p>${p.question}</p><h3>Outputs & purpose</h3><p>${p.outputs}</p><h3>Tools & methods</h3><p>${p.tools}</p></div><div><h3>My contribution</h3><ul>${p.contributions.map(c=>`<li>${c}</li>`).join('')}</ul></div></div><p class="dialog-note">${p.note}</p>`;
  dialog.showModal();dialog.scrollTop=0;document.body.classList.add('dialog-open');
}));
function closeProject(){dialog.close();}
document.getElementById('close-project').addEventListener('click',closeProject);
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeProject();}});
dialog.addEventListener('close',()=>{document.body.classList.remove('dialog-open');if(lastProjectButton)lastProjectButton.focus({preventScroll:true});});
document.getElementById('copy-email').addEventListener('click',async()=>{const status=document.getElementById('copy-status');try{await navigator.clipboard.writeText('email2shivyadav@gmail.com');status.textContent='Email copied.';}catch{status.textContent='Please copy the email address above.';}});

if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}});},{threshold:.08});
  document.querySelectorAll('.section-top,.about-intro,.work-heading,.project,.research-heading,.publication').forEach(el=>{el.classList.add('reveal');observer.observe(el);});
  const navObserver=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){document.querySelectorAll('.navigation nav a').forEach(a=>a.classList.toggle('active',a.hash==='#'+entry.target.id));}});},{rootMargin:'-20% 0px -55% 0px'});
  document.querySelectorAll('main>section[id]').forEach(section=>navObserver.observe(section));
}

// Procedural artwork only. The terrain is not a geographic dataset or project result.
function makeTerrain(canvas,kind='hero'){
  const ctx=canvas.getContext('2d');if(!ctx)return null;
  const n=kind==='hero'?68:48;
  let angle=-.52,width=0,height=0,visible=true;
  const peaks=[[-.4,.2,.55,.25],[.15,-.15,.82,.3],[.47,.4,.5,.22],[-.55,-.5,.5,.28],[.5,-.55,.6,.2]];
  function elevation(x,z){let h=0;for(const [px,pz,a,s]of peaks)h+=a*Math.exp(-((x-px)**2+(z-pz)**2)/(s*s));const detail=(Math.sin(23*x+7*z)+Math.sin(38*z-13*x)*.5+Math.cos(53*x+41*z)*.25)*.035;h=Math.max(.025,h+detail);if(kind==='agriculture')h=h*.42;if(kind==='snow')h=h*1.2;const edge=Math.min(1,(1-Math.abs(x))*6,(1-Math.abs(z))*6);return h*(.65+.35*Math.max(0,edge));}
  const points=[];for(let z=0;z<=n;z++){const row=[];for(let x=0;x<=n;x++){const xx=x/n*2-1,zz=z/n*2-1;row.push({x:xx,z:zz,h:elevation(xx,zz)});}points.push(row);}
  function mix(a,b,t){return a.map((v,i)=>Math.round(v+(b[i]-v)*Math.max(0,Math.min(1,t))));}
  function draw(){if(!visible||!width||!height)return;ctx.clearRect(0,0,width,height);const scale=Math.min(width*.38,height*.79);const ca=Math.cos(angle),sa=Math.sin(angle);function project(p){const rx=p.x*ca-p.z*sa,rz=p.x*sa+p.z*ca;return {x:width*.5+rx*scale,y:height*.61+rz*scale*.38-p.h*scale*.75,depth:rz};}
    const faces=[];for(let z=0;z<n;z++)for(let x=0;x<n;x++){const raw=[points[z][x],points[z][x+1],points[z+1][x+1],points[z+1][x]];const p=raw.map(project);const h=raw.reduce((s,p)=>s+p.h,0)/4;const slope=(raw[1].h-raw[0].h)*n*.32+(raw[2].h-raw[1].h)*n*.18;let col;
      if(kind==='snow'){col=mix([55,82,75],[220,226,212],Math.pow(Math.min(h/1.1,1),.6));if(h>.65)col=mix(col,[245,244,225],(h-.65)*2.7);}
      else if(kind==='agriculture'){const field=Math.sin(x*.4+z*.6)>0;col=mix(field?[96,115,58]:[137,137,71],[209,193,127],h*1.8);}
      else{col=mix([31,66,43],[165,172,100],Math.pow(Math.min(h,1),.7));if(h>.5)col=mix(col,[187,183,131],(h-.5)*1.4);}
      const light=Math.max(.55,Math.min(1.25,.9-slope*.26));col=col.map(v=>Math.max(0,Math.min(255,Math.round(v*light))));faces.push({p,depth:p.reduce((s,p)=>s+p.depth,0)/4,col});}
    ctx.save();ctx.shadowColor='#18382530';ctx.shadowBlur=35;ctx.fillStyle='#17302520';ctx.beginPath();ctx.ellipse(width*.5,height*.76,scale*.9,scale*.25,0,0,Math.PI*2);ctx.fill();ctx.restore();
    faces.sort((a,b)=>a.depth-b.depth);for(const f of faces){ctx.beginPath();f.p.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=`rgb(${f.col.join(',')})`;ctx.fill();ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=.6;ctx.stroke();}
    // Sparse surface lines make the model's constructed nature visible.
    ctx.lineWidth=.5;ctx.strokeStyle=kind==='snow'?'#eff4e741':'#edf3be25';for(let z=0;z<=n;z+=4){ctx.beginPath();points[z].forEach((p,i)=>{const s=project(p);i?ctx.lineTo(s.x,s.y):ctx.moveTo(s.x,s.y)});ctx.stroke();}
  }
  function resize(){const r=canvas.getBoundingClientRect();width=r.width;height=r.height;const dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw();}
  new ResizeObserver(resize).observe(canvas);
  if('IntersectionObserver'in window)new IntersectionObserver(es=>{visible=es[0].isIntersecting;if(visible)draw();}).observe(canvas);
  return{setAngle(a){angle=a;draw();},getAngle(){return angle;},isVisible(){return visible;}};
}
document.querySelectorAll('[data-terrain]').forEach(c=>makeTerrain(c,c.dataset.terrain));


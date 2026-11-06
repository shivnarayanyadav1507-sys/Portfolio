// Frames extracted from the supplied video: cursor control never depends on media seeking.
const stage = document.getElementById('explorer-stage');
const canvas = document.getElementById('explorer-canvas');
const ctx = canvas.getContext('2d');
const toggle = document.getElementById('earth-motion');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const frames = new Array(45);
let desired = 0.5, current = 0.5, drawn = -1, raf = 0, last = 0;
let ready = false, paused = reduced.matches, touching = null, loaded = 0;
function frameFor(p) { return Math.round(p <= .5 ? p * 48 : 24 + (p - .5) * 40); }
function controls() {
  toggle.hidden = false;
  toggle.setAttribute('aria-pressed', String(paused));
  toggle.setAttribute('aria-label', paused ? 'Enable character motion' : 'Pause character motion');
  toggle.textContent = paused ? 'Enable motion' : 'Pause motion';
  toggle.classList.toggle('is-paused', paused);
  stage.dataset.paused = String(paused);
}
// Remove pale background connected to image edges for the forest-green theme.
const darkFrameCache=new Map();
function darkFrame(index){
 if(darkFrameCache.has(index))return darkFrameCache.get(index);
 const out=document.createElement('canvas');out.width=canvas.width;out.height=canvas.height;
 const c=out.getContext('2d',{willReadFrequently:true});c.drawImage(frames[index],0,0,out.width,out.height);
 const image=c.getImageData(0,0,out.width,out.height),data=image.data,W=out.width,H=out.height;
 const seen=new Uint8Array(W*H),queue=new Int32Array(W*H);let head=0,tail=0;
 function add(i){if(i<0||i>=W*H||seen[i])return;seen[i]=1;const p=i*4,r=data[p],g=data[p+1],b=data[p+2];if(r>170&&g>175&&b>155&&Math.abs(r-g)<13&&Math.abs(g-b)<32){queue[tail++]=i;data[p+3]=0;}}
 for(let x=0;x<W;x++){add(x);add((H-1)*W+x);}for(let y=0;y<H;y++){add(y*W);add(y*W+W-1);}
 while(head<tail){const i=queue[head++];if(i%W)add(i-1);if(i%W<W-1)add(i+1);add(i-W);add(i+W);}
 const alpha=new Uint8Array(W*H);for(let i=0;i<alpha.length;i++)alpha[i]=data[i*4+3];
 for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x;data[i*4+3]=Math.min(alpha[i],alpha[i-1],alpha[i+1],alpha[i-W],alpha[i+W]);}
 c.putImageData(image,0,0);darkFrameCache.set(index,out);if(darkFrameCache.size>8)darkFrameCache.delete(darkFrameCache.keys().next().value);return out;
}
window.addEventListener('themechange',()=>{drawn=-1;draw();});

function draw() {
  const wanted = frameFor(current);
  let selected = wanted;
  if (!frames[selected]) {
    selected = frames.reduce((best, img, i) => img && (best < 0 || Math.abs(i-wanted) < Math.abs(best-wanted)) ? i : best, -1);
  }
  if (selected < 0 || selected === drawn) return;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(document.documentElement.dataset.theme==='dark'?darkFrame(selected):frames[selected], 0, 0, canvas.width, canvas.height);
  drawn = selected;
  stage.classList.add('is-ready');
  stage.dataset.frame = String(selected);
}
function wake() { if (!raf && ready && !paused && !document.hidden) raf = requestAnimationFrame(tick); }
function tick(now) {
  raf = 0;
  if (paused || document.hidden) { last = 0; return; }
  const dt = last ? Math.min((now-last)/1000, .05) : 1/60;
  last = now;
  current += (desired-current) * (1-Math.exp(-18*dt));
  if (Math.abs(desired-current) < .002) current = desired;
  draw();
  if (current !== desired) wake(); else last = 0;
}
function setProgress(value) {
  desired = Math.max(0, Math.min(1, value));
  stage.dataset.target = desired.toFixed(3);
  wake();
}
function track(event) {
  if (paused || event.pointerType === 'touch') return;
  const box = stage.getBoundingClientRect();
  const anchor = Math.max(1, Math.min(innerWidth-1, box.left + box.width*.52));
  setProgress(event.clientX <= anchor ? .5 * event.clientX/anchor : .5+.5*(event.clientX-anchor)/(innerWidth-anchor));
}
// Mouse fallback also supports environments that do not forward PointerEvents.
window.addEventListener('pointermove', track, {passive:true});
window.addEventListener('mousemove', track, {passive:true});
document.documentElement.addEventListener('pointerleave', () => { if (!paused) setProgress(.5); });
stage.addEventListener('keydown', event => {
  if (paused || !['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
  event.preventDefault();
  setProgress(event.key === 'Home' ? 0 : event.key === 'End' ? 1 : desired + (event.key === 'ArrowLeft' ? -.1 : .1));
});
toggle.addEventListener('click', () => {
  paused = !paused; controls();
  if (paused) { cancelAnimationFrame(raf); raf=0; last=0; } else wake();
});
function touch(event) {
  const box = stage.getBoundingClientRect();
  setProgress((event.clientX-box.left)/box.width);
}
stage.addEventListener('pointerdown', event => {
  if (event.pointerType !== 'touch' || paused) return;
  touching = event.pointerId; touch(event);
}, {passive:true});
stage.addEventListener('pointermove', event => { if (event.pointerId === touching && !paused) touch(event); }, {passive:true});
window.addEventListener('pointerup', () => { touching = null; });
window.addEventListener('pointercancel', () => { touching = null; });
reduced.addEventListener('change', event => { paused=event.matches; controls(); wake(); });
document.addEventListener('visibilitychange', () => { last=0; wake(); });
controls();
stage.dataset.target = '0.500';
// Load neutral first, then turns. Six workers avoid flooding the network.
const queue = [24,0,44,...Array.from({length:45},(_,i)=>i).filter(i=>![24,0,44].includes(i))];
async function worker() {
  while (queue.length) {
    const i = queue.shift();
    for (let attempt=0; attempt<2; attempt++) {
      try {
        const img = new Image();
        img.src = new URL(`assets/explorer-frames/${String(i+1).padStart(2,'0')}.jpg`, import.meta.url).href;
        await img.decode(); frames[i]=img; loaded++;
        stage.dataset.loaded = String(loaded);
        if (!ready) { ready=true; stage.dataset.ready='true'; controls(); }
        draw(); wake(); break;
      } catch { /* Retry this frame once; the nearest loaded pose remains usable. */ }
    }
  }
}
Promise.all(Array.from({length:6},worker)).then(() => {
  if (!ready) toggle.hidden = true;
});

/* Character: transparent looping video.
   assets/character-stacked.mp4 holds the picture in the top half and its alpha mask in the bottom half
   (H.264 has no alpha channel, and this works in every browser, iPhones included).
   WebGL puts the two halves back together. The picture was packed on storm grey, so edge pixels are
   un-mixed from that grey to stay clean on any background. Without WebGL, the still poster stays. */
(() => {
  const canvas = document.getElementById('character-canvas');
  const stage = document.getElementById('character-stage');
  if (!canvas || !stage) return;
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, preserveDrawingBuffer: false });
  if (!gl) return;

  const vs = `attribute vec2 p; varying vec2 uv;
    void main(){ uv = vec2((p.x + 1.0) * 0.5, (1.0 - p.y) * 0.5); gl_Position = vec4(p, 0.0, 1.0); }`;
  const fs = `precision mediump float; varying vec2 uv; uniform sampler2D t;
    const vec3 G = vec3(90.0, 96.0, 104.0) / 255.0;
    void main(){
      vec3 c = texture2D(t, vec2(uv.x, uv.y * 0.5)).rgb;
      float a = texture2D(t, vec2(uv.x, 0.5 + uv.y * 0.5)).r;
      a = clamp((a - 0.02) / 0.96, 0.0, 1.0);
      vec3 f = a > 0.01 ? clamp((c - (1.0 - a) * G) / a, 0.0, 1.0) : vec3(0.0);
      gl_FragColor = vec4(f * a, a);
    }`;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const video = document.createElement('video');
  video.muted = true; video.loop = true; video.playsInline = true; video.preload = 'auto';
  video.setAttribute('muted', ''); video.setAttribute('playsinline', '');
  video.src = new URL('assets/character-stacked.mp4', document.baseURI).href;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let ready = false, wanted = true, raf = 0;

  function draw() {
    if (video.readyState < 2) return;
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (!ready) { ready = true; stage.classList.add('is-ready'); }
  }
  const hasRVFC = 'requestVideoFrameCallback' in HTMLVideoElement.prototype;
  function loop() {
    draw();
    if (video.paused) return;
    if (hasRVFC) video.requestVideoFrameCallback(loop); else raf = requestAnimationFrame(loop);
  }
  function play() {
    if (reduced.matches || !wanted) return;
    const p = video.play();
    if (p && p.then) p.then(loop).catch(() => { /* autoplay blocked (e.g. low power mode): keep the poster or last frame */ });
  }
  video.addEventListener('loadeddata', () => {
    if (reduced.matches) { video.currentTime = 2; video.addEventListener('seeked', draw, { once: true }); }
    else play();
  });
  reduced.addEventListener('change', () => { if (reduced.matches) video.pause(); else play(); });

  /* intro.js pauses the clip once the character is fully blurred into the background */
  window.charVideo = {
    setActive(on) {
      if (on === wanted) return;
      wanted = on;
      if (on) play(); else { video.pause(); cancelAnimationFrame(raf); }
    }
  };
})();

/* Tattoin Line — prévia do simulador (versão estática, canvas puro).
   No app real o editor usa Konva; as regras (coordenadas relativas à foto) são as mesmas. */
(function () {
  'use strict';
  var root = document.getElementById('sim');
  if (!root || !window.TL_DATA) return;
  var FLASH = window.TL_DATA.FLASH.filter(function (f) { return f.status === 'disponivel'; });
  var ART = window.TL_DATA.ART;
  var $ = function (s) { return root.querySelector(s); };
  var LIM = { minScale: 0.04, maxScale: 1.6, minOp: 0.1 };
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function brl0(n) { return 'R$ ' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  var S = { design: null, art: null, photo: null, t: null, past: [], future: [], selected: true, compare: false, style: '', q: '', limit: 12 };

  /* ---------- desenhos ---------- */
  function artSvg(f, color) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="800" height="800" fill="none" stroke="' + color + '" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="' + ART[f.art] + '"/></svg>';
  }
  function loadImg(src) {
    return new Promise(function (res, rej) { var i = new Image(); i.onload = function () { res(i); }; i.onerror = function () { rej(new Error('Não foi possível abrir a imagem.')); }; i.src = src; });
  }
  function renderGrid() {
    var q = S.q.trim().toLowerCase();
    var list = FLASH.filter(function (f) { return (!S.style || f.style === S.style) && (!q || f.name.toLowerCase().indexOf(q) > -1 || f.style.toLowerCase().indexOf(q) > -1); });
    $('#sim-grid').innerHTML = list.slice(0, S.limit).map(function (f) {
      var on = S.design && S.design.id === f.id;
      return '<li><button type="button" class="sim-pick" data-id="' + f.id + '" aria-pressed="' + on + '"><span class="sim-thumb">' + artSvg(f, 'currentColor') + '</span><span class="n">' + esc(f.name) + '</span><span class="m">' + brl0(f.price) + ' · ' + esc(f.size) + '</span></button></li>';
    }).join('') || '<li class="small">Nenhum projeto com esse filtro.</li>';
    $('#sim-more').hidden = list.length <= S.limit;
  }
  function renderChips() {
    var styles = FLASH.map(function (f) { return f.style; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
    $('#sim-chips').innerHTML = ['<button type="button" class="chip" data-style="" aria-pressed="' + !S.style + '">Todos</button>'].concat(styles.map(function (s) { return '<button type="button" class="chip" data-style="' + esc(s) + '" aria-pressed="' + (S.style === s) + '">' + esc(s) + '</button>'; })).join('');
  }
  function pickProject(f) {
    loadImg('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(artSvg(f, '#141210'))).then(function (img) {
      S.design = { kind: 'projeto', id: f.id, name: f.name, price: f.price };
      setArt(img); renderGrid();
    }).catch(fail);
  }
  function setArt(img) { S.art = img; reset(); update(); }

  /* ---------- foto ---------- */
  function toCanvas(src, w, h) {
    var s = Math.min(1, 2400 / Math.max(w, h)); var c = document.createElement('canvas');
    c.width = Math.round(w * s); c.height = Math.round(h * s); c.getContext('2d').drawImage(src, 0, 0, c.width, c.height); return c;
  }
  function sniff(file) {
    return file.slice(0, 12).arrayBuffer().then(function (b) {
      var u = new Uint8Array(b);
      if (u[0] === 0xff && u[1] === 0xd8 && u[2] === 0xff) return 'jpeg';
      if (u[0] === 0x89 && u[1] === 0x50 && u[2] === 0x4e && u[3] === 0x47) return 'png';
      if (String.fromCharCode.apply(null, u.slice(0, 4)) === 'RIFF' && String.fromCharCode.apply(null, u.slice(8, 12)) === 'WEBP') return 'webp';
      return null;
    });
  }
  function photoFromFile(file) {
    return sniff(file).then(function (t) {
      if (!t) throw new Error('Arquivo não reconhecido. Use JPG, PNG ou WebP.');
      if (file.size > 12 * 1024 * 1024) throw new Error('Foto muito grande. O limite é 12 MB.');
      return createImageBitmap(file, { imageOrientation: 'from-image' });
    }).then(function (bmp) {
      if (bmp.width < 300 || bmp.height < 300) throw new Error('Foto muito pequena (mínimo 300 × 300 px).');
      var c = toCanvas(bmp, bmp.width, bmp.height); bmp.close && bmp.close(); return c;
    });
  }
  function setPhoto(c) { S.photo = c; reset(); update(); }

  /* ---------- estado ---------- */
  function initial() {
    if (!S.photo || !S.art) return { x: 0.5, y: 0.5, scale: 0.3, rotation: 0, opacity: 0.92 };
    var asp = S.art.naturalHeight / S.art.naturalWidth, target = 0.35 * Math.min(S.photo.width, S.photo.height);
    return { x: 0.5, y: 0.5, scale: (asp > 1 ? target / asp : target) / S.photo.width, rotation: 0, opacity: 0.92 };
  }
  function sanitize(t) {
    var r = t.rotation % 360; if (r > 180) r -= 360; if (r <= -180) r += 360;
    return { x: clamp(t.x, 0, 1), y: clamp(t.y, 0, 1), scale: clamp(t.scale, LIM.minScale, LIM.maxScale), rotation: Math.round(r * 10) / 10, opacity: clamp(t.opacity, LIM.minOp, 1) };
  }
  function reset() { S.t = initial(); S.past = []; S.future = []; }
  function commit(next) {
    next = sanitize(next);
    if (JSON.stringify(next) === JSON.stringify(S.t)) return;
    S.past.push(S.t); if (S.past.length > 50) S.past.shift(); S.future = []; S.t = next; update();
  }
  function undo() { if (!S.past.length) return; S.future.unshift(S.t); S.t = S.past.pop(); update(); }
  function redo() { if (!S.future.length) return; S.past.push(S.t); S.t = S.future.shift(); update(); }

  /* ---------- palco ---------- */
  var box = $('#sim-box'), cv = $('#sim-canvas'), ctx = cv.getContext('2d'), stage = { w: 0, h: 0, ox: 0, oy: 0 }, dpr = 1, live = null;
  function layout() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    var bw = box.clientWidth, bh = box.clientHeight;
    cv.width = bw * dpr; cv.height = bh * dpr; cv.style.width = bw + 'px'; cv.style.height = bh + 'px';
    if (S.photo) { var s = Math.min(bw / S.photo.width, bh / S.photo.height); stage.w = S.photo.width * s; stage.h = S.photo.height * s; stage.ox = (bw - stage.w) / 2; stage.oy = (bh - stage.h) / 2; }
    draw();
  }
  function geom(t) {
    var w = t.scale * stage.w, h = w * (S.art.naturalHeight / S.art.naturalWidth);
    return { cx: stage.ox + t.x * stage.w, cy: stage.oy + t.y * stage.h, w: w, h: h, a: t.rotation * Math.PI / 180 };
  }
  function local(g, px, py) { var dx = px - g.cx, dy = py - g.cy, c = Math.cos(-g.a), s = Math.sin(-g.a); return { x: dx * c - dy * s, y: dx * s + dy * c }; }
  function world(g, lx, ly) { var c = Math.cos(g.a), s = Math.sin(g.a); return { x: g.cx + lx * c - ly * s, y: g.cy + lx * s + ly * c }; }
  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
    if (!S.photo) return;
    ctx.drawImage(S.photo, stage.ox, stage.oy, stage.w, stage.h);
    if (!S.art || S.compare) return;
    var t = live || S.t, g = geom(t);
    ctx.save(); ctx.translate(g.cx, g.cy); ctx.rotate(g.a); ctx.globalAlpha = t.opacity; ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(S.art, -g.w / 2, -g.h / 2, g.w, g.h); ctx.restore();
    if (!S.selected) return;
    ctx.save(); ctx.translate(g.cx, g.cy); ctx.rotate(g.a);
    ctx.strokeStyle = '#a3342a'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 4]); ctx.strokeRect(-g.w / 2, -g.h / 2, g.w, g.h); ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(0, -g.h / 2); ctx.lineTo(0, -g.h / 2 - 26); ctx.stroke();
    [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, null]].forEach(function (p) {
      var x = p[0] * g.w / 2, y = p[1] === null ? -g.h / 2 - 28 : p[1] * g.h / 2;
      ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fillStyle = '#fff8f2'; ctx.fill(); ctx.stroke();
    });
    ctx.restore();
  }
  function hit(px, py) {
    if (!S.art || !S.photo || S.compare) return null;
    var g = geom(S.t), l = local(g, px, py), hw = g.w / 2, hh = g.h / 2, r = 16;
    if (S.selected) {
      if (Math.hypot(l.x, l.y + hh + 28) < r) return 'rotate';
      if ([[-1, -1], [1, -1], [-1, 1], [1, 1]].some(function (p) { return Math.hypot(l.x - p[0] * hw, l.y - p[1] * hh) < r; })) return 'scale';
    }
    if (Math.abs(l.x) <= hw && Math.abs(l.y) <= hh) return 'move';
    return null;
  }
  var ptrs = {}, gesture = null;
  function pos(e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  cv.addEventListener('pointerdown', function (e) {
    if (!S.photo || !S.art) return;
    var p = pos(e); ptrs[e.pointerId] = p; cv.setPointerCapture(e.pointerId);
    var ids = Object.keys(ptrs);
    if (ids.length === 2) {
      var a = ptrs[ids[0]], b = ptrs[ids[1]];
      gesture = { mode: 'pinch', t0: live || S.t, d0: Math.hypot(b.x - a.x, b.y - a.y), a0: Math.atan2(b.y - a.y, b.x - a.x) };
      return;
    }
    var mode = hit(p.x, p.y);
    S.selected = !!mode; if (!mode) { draw(); return; }
    var g = geom(S.t);
    gesture = { mode: mode, t0: S.t, p0: p, g: g, d0: Math.hypot(p.x - g.cx, p.y - g.cy), a0: Math.atan2(p.y - g.cy, p.x - g.cx) };
    draw();
  });
  cv.addEventListener('pointermove', function (e) {
    if (!ptrs[e.pointerId]) { var m = hit.apply(null, (function (p) { return [p.x, p.y]; })(pos(e))); cv.style.cursor = m === 'move' ? 'move' : m ? 'grab' : 'default'; return; }
    ptrs[e.pointerId] = pos(e);
    if (!gesture) return;
    var t0 = gesture.t0, p = ptrs[e.pointerId], n;
    if (gesture.mode === 'pinch') {
      var ids = Object.keys(ptrs); if (ids.length < 2) return;
      var a = ptrs[ids[0]], b = ptrs[ids[1]];
      n = { x: t0.x, y: t0.y, opacity: t0.opacity, scale: t0.scale * Math.hypot(b.x - a.x, b.y - a.y) / gesture.d0, rotation: t0.rotation + (Math.atan2(b.y - a.y, b.x - a.x) - gesture.a0) * 180 / Math.PI };
    } else if (gesture.mode === 'move') {
      n = { x: t0.x + (p.x - gesture.p0.x) / stage.w, y: t0.y + (p.y - gesture.p0.y) / stage.h, scale: t0.scale, rotation: t0.rotation, opacity: t0.opacity };
    } else if (gesture.mode === 'scale') {
      var g = gesture.g; n = { x: t0.x, y: t0.y, rotation: t0.rotation, opacity: t0.opacity, scale: t0.scale * Math.hypot(p.x - g.cx, p.y - g.cy) / gesture.d0 };
    } else {
      var g2 = gesture.g, ang = (Math.atan2(p.y - g2.cy, p.x - g2.cx) - gesture.a0) * 180 / Math.PI, rot = t0.rotation + ang;
      var snap = Math.round(rot / 45) * 45; if (Math.abs(rot - snap) < 4) rot = snap;
      n = { x: t0.x, y: t0.y, scale: t0.scale, opacity: t0.opacity, rotation: rot };
    }
    live = sanitize(n); syncInputs(live); draw();
  });
  function endPtr(e) {
    delete ptrs[e.pointerId];
    if (gesture && Object.keys(ptrs).length === 0) { var l = live; gesture = null; live = null; if (l) commit(l); }
    else if (gesture && gesture.mode === 'pinch') { gesture = null; if (live) { var l2 = live; live = null; commit(l2); } }
  }
  cv.addEventListener('pointerup', endPtr); cv.addEventListener('pointercancel', endPtr);

  /* ---------- controles ---------- */
  function syncInputs(t) {
    var pct = function (v) { return Math.round(v * 100); };
    $('#r-scale').value = pct(t.scale); $('#o-scale').textContent = pct(t.scale) + '%';
    $('#r-rot').value = Math.round(t.rotation); $('#o-rot').textContent = Math.round(t.rotation) + '°';
    $('#r-op').value = pct(t.opacity); $('#o-op').textContent = pct(t.opacity) + '%';
  }
  function update() {
    var ready = !!(S.photo && S.art);
    root.classList.toggle('is-ready', ready);
    $('#sim-adjust').hidden = !ready; $('#sim-actions').hidden = !ready;
    $('#sim-empty').hidden = !!S.photo; cv.hidden = !S.photo;
    $('#btn-photo').textContent = S.photo ? 'Trocar foto' : 'Enviar foto';
    $('#btn-undo').disabled = !S.past.length; $('#btn-redo').disabled = !S.future.length;
    $('#btn-compare').textContent = S.compare ? 'Mostrar desenho' : 'Ver sem o desenho';
    $('#btn-book').textContent = S.design && S.design.kind === 'projeto' ? 'Agendar esta tatuagem' : 'Pedir orçamento';
    $('#sim-cur').textContent = S.design ? (S.design.kind === 'projeto' ? ' · ' + S.design.name + ', ' + brl0(S.design.price) : ' · Desenho próprio') : '';
    if (S.t) syncInputs(S.t);
    layout();
  }
  function fail(e) { var el = $('#sim-error'); el.textContent = e.message || String(e); el.hidden = false; setTimeout(function () { el.hidden = true; }, 6000); }

  ['scale', 'rot', 'op'].forEach(function (k) {
    var el = $('#r-' + k);
    el.addEventListener('input', function () {
      var t = Object.assign({}, S.t), v = Number(el.value);
      if (k === 'scale') t.scale = v / 100; else if (k === 'rot') t.rotation = v; else t.opacity = v / 100;
      live = sanitize(t); syncInputs(live); draw();
    });
    el.addEventListener('change', function () { if (live) { var l = live; live = null; commit(l); } });
  });
  root.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.id) { var f = FLASH.find(function (x) { return x.id === b.dataset.id; }); if (f) pickProject(f); }
    if (b.hasAttribute('data-style')) { S.style = b.dataset.style; S.limit = 12; renderChips(); renderGrid(); }
    if (b.dataset.tab) {
      root.querySelectorAll('[data-tab]').forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
      $('#tab-projetos').hidden = b.dataset.tab !== 'projetos'; $('#tab-proprio').hidden = b.dataset.tab !== 'proprio';
    }
    switch (b.id) {
      case 'sim-more': S.limit += 12; renderGrid(); break;
      case 'btn-photo': $('#in-photo').click(); break;
      case 'btn-sample': loadImg('sim-exemplo.jpg').then(function (i) { setPhoto(toCanvas(i, i.naturalWidth, i.naturalHeight)); }).catch(fail); break;
      case 'btn-camera': openCamera(); break;
      case 'btn-own': $('#in-art').click(); break;
      case 'btn-undo': undo(); break;
      case 'btn-redo': redo(); break;
      case 'btn-center': commit(Object.assign({}, S.t, { x: 0.5, y: 0.5 })); break;
      case 'btn-reset': commit(initial()); break;
      case 'btn-remove': S.art = null; S.design = null; reset(); renderGrid(); update(); break;
      case 'btn-compare': S.compare = !S.compare; update(); break;
      case 'btn-download': download(); break;
      case 'btn-book': location.href = S.design && S.design.kind === 'projeto' ? 'agendar.html?projeto=' + S.design.id + '&origem=simulador' : 'agendar.html?origem=simulador'; break;
    }
  });
  $('#sim-search').addEventListener('input', function (e) { S.q = e.target.value; S.limit = 12; renderGrid(); });
  $('#in-photo').addEventListener('change', function (e) { var f = e.target.files[0]; e.target.value = ''; if (f) photoFromFile(f).then(setPhoto).catch(fail); });
  $('#in-art').addEventListener('change', function (e) {
    var f = e.target.files[0]; e.target.value = ''; if (!f) return;
    sniff(f).then(function (t) {
      if (t !== 'png' && t !== 'webp') throw new Error('Use um PNG ou WebP com fundo transparente para o desenho.');
      if (f.size > 8 * 1024 * 1024) throw new Error('Desenho muito grande. O limite é 8 MB.');
      return loadImg(URL.createObjectURL(f));
    }).then(function (img) { S.design = { kind: 'proprio' }; $('#own-name').textContent = 'Usando: ' + f.name; setArt(img); renderGrid(); }).catch(fail);
  });
  $('#sim-stage').addEventListener('keydown', function (e) {
    if (!S.photo || !S.art) return;
    var mod = e.metaKey || e.ctrlKey, k = e.key.toLowerCase(), st = e.shiftKey ? 0.02 : 0.005, t = S.t, m = null;
    if (mod && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
    if (mod && k === 'y') { e.preventDefault(); redo(); return; }
    if (e.key === 'ArrowLeft') m = { x: t.x - st }; else if (e.key === 'ArrowRight') m = { x: t.x + st };
    else if (e.key === 'ArrowUp') m = { y: t.y - st }; else if (e.key === 'ArrowDown') m = { y: t.y + st };
    else if (e.key === '+' || e.key === '=') m = { scale: t.scale * 1.05 }; else if (e.key === '-') m = { scale: t.scale / 1.05 };
    else if (e.key === '[') m = { rotation: t.rotation - (e.shiftKey ? 15 : 2) }; else if (e.key === ']') m = { rotation: t.rotation + (e.shiftKey ? 15 : 2) };
    if (m) { e.preventDefault(); commit(Object.assign({}, t, m)); }
  });

  function download() {
    var W = S.photo.width, H = S.photo.height, c = document.createElement('canvas'); c.width = W; c.height = H;
    var x = c.getContext('2d'), t = S.t, w = t.scale * W, h = w * S.art.naturalHeight / S.art.naturalWidth;
    x.drawImage(S.photo, 0, 0); x.save(); x.translate(t.x * W, t.y * H); x.rotate(t.rotation * Math.PI / 180); x.globalAlpha = t.opacity; x.globalCompositeOperation = 'multiply';
    x.drawImage(S.art, -w / 2, -h / 2, w, h); x.restore();
    var fs = Math.max(12, Math.round(W / 60)), cap = 'Simulação ilustrativa · Tattoin Line'; x.font = '500 ' + fs + 'px system-ui, sans-serif';
    var tw = x.measureText(cap).width, pad = fs * 0.8; x.fillStyle = 'rgba(0,0,0,.45)'; x.fillRect(W - tw - pad * 2, H - fs - pad * 1.6, tw + pad * 2, fs + pad * 1.6);
    x.fillStyle = '#fff'; x.textAlign = 'right'; x.textBaseline = 'bottom'; x.fillText(cap, W - pad, H - pad * 0.8);
    c.toBlob(function (b) { var u = URL.createObjectURL(b), a = document.createElement('a'); a.href = u; a.download = 'simulacao-tatuagem.png'; a.click(); setTimeout(function () { URL.revokeObjectURL(u); }, 2000); }, 'image/png');
  }

  /* ---------- câmera ---------- */
  var camEl = document.getElementById('sim-cam'), video = camEl.querySelector('video'), stream = null, facing = 'environment';
  function stopCam() { if (stream) stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
  function startCam() {
    stopCam(); camEl.querySelector('.alert').hidden = true;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return camErr('Este navegador não permite usar a câmera aqui. Envie uma foto da galeria.');
    navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facing }, width: { ideal: 1920 } }, audio: false }).then(function (s) {
      stream = s; video.srcObject = s; video.classList.toggle('mirror', facing === 'user'); video.play();
    }).catch(function (e) { camErr(e.name === 'NotAllowedError' ? 'Permissão da câmera negada. Libere o acesso ou envie uma foto.' : 'Não foi possível abrir a câmera. Envie uma foto.'); });
  }
  function camErr(m) { var a = camEl.querySelector('.alert'); a.textContent = m; a.hidden = false; }
  function openCamera() { camEl.hidden = false; startCam(); }
  function closeCamera() { stopCam(); camEl.hidden = true; }
  camEl.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.cam === 'close') closeCamera();
    if (b.dataset.cam === 'flip') { facing = facing === 'environment' ? 'user' : 'environment'; startCam(); }
    if (b.dataset.cam === 'shot' && video.videoWidth) { var c = toCanvas(video, video.videoWidth, video.videoHeight); closeCamera(); setPhoto(c); }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !camEl.hidden) closeCamera(); });

  /* ---------- início ---------- */
  new ResizeObserver(layout).observe(box);
  renderChips(); renderGrid(); reset(); update();
  var pre = new URLSearchParams(location.search).get('projeto');
  if (pre) { var pf = FLASH.find(function (f) { return f.id === pre; }); if (pf) pickProject(pf); }
})();

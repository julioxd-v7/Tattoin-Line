/* Tattoin Line — site estático. Dados demonstrativos: edite CONFIG, WORKS e FLASH. */
(function () {
  'use strict';

  var CONFIG = {
    artist: 'Caio Martins',
    whatsapp: '5581900000000', // [TROQUE] DDI + DDD + número, só dígitos
    whatsappLabel: '(81) 9 0000-0000',
    email: 'contato@tattoinline.com.br', // [TROQUE]
    depositPercent: 30,
    depositMin: 100,
    workDays: [2, 3, 4, 5, 6], // ter a sáb
    blockedDates: ['2026-11-02', '2026-11-15', '2026-11-20', '2026-12-25', '2027-01-01']
  };

  var ART = {
    skull: 'M50 12 C30 12 20 26 20 44 C20 56 26 62 32 66 L32 78 C32 82 35 84 38 84 L62 84 C65 84 68 82 68 78 L68 66 C74 62 80 56 80 44 C80 26 70 12 50 12 Z M30 48 C30 42 36 39 41 40 C46 41 46 47 44 51 C42 55 36 57 33 55 C31 54 30 51 30 48 Z M70 48 C70 42 64 39 59 40 C54 41 54 47 56 51 C58 55 64 57 67 55 C69 54 70 51 70 48 Z M50 56 L46 64 L54 64 Z M38 72 L62 72 M44 72 L44 84 M50 72 L50 84 M56 72 L56 84',
    sprig: 'M50 92 C50 62 50 40 50 10 M50 74 C40 70 33 62 31 52 M50 74 C60 70 67 62 69 52 M50 54 C42 50 37 42 36 33 M50 54 C58 50 63 42 64 33 M50 34 C45 31 42 25 42 18 M50 34 C55 31 58 25 58 18',
    snake: 'M30 88 C72 82 72 62 50 58 C28 54 28 36 50 32 C68 29 70 18 58 12 L64 9',
    moon: 'M62 18 A32 32 0 1 0 62 82 A25 25 0 1 1 62 18 Z M18 92 C34 86 66 86 82 92',
    peony: 'M50 30 C38 30 30 40 34 52 C38 64 62 64 66 52 C70 40 62 30 50 30 M50 30 C46 40 46 48 50 56 C54 48 54 40 50 30 M40 60 L50 90 L60 60 M50 76 C40 72 34 74 30 80',
    grid: 'M50 12 L86 74 L14 74 Z M50 36 L68 66 L32 66 Z M50 12 L50 88 M14 74 L86 74',
    letter: 'M14 60 C24 30 34 30 31 55 C29 70 39 70 47 50 C51 40 57 40 55 55 C54 66 63 66 69 52 C73 44 79 44 86 52',
    raven: 'M18 60 C34 40 55 38 70 46 L84 42 L74 52 C66 62 46 66 30 62 Z M52 62 L48 76 M58 61 L58 74',
    fern: 'M50 92 L50 12 M50 22 L40 18 M50 22 L60 18 M50 34 L36 28 M50 34 L64 28 M50 46 L33 39 M50 46 L67 39 M50 58 L33 51 M50 58 L67 51 M50 70 L36 64 M50 70 L64 64',
    moth: 'M50 30 L50 76 M50 38 C30 20 13 30 21 50 C27 62 42 58 50 50 M50 38 C70 20 87 30 79 50 C73 62 58 58 50 50 M50 56 C38 63 34 77 44 81 M50 56 C62 63 66 77 56 81 M47 29 L41 18 M53 29 L59 18',
    dagger: 'M50 6 L56 58 L50 64 L44 58 Z M34 58 L66 58 M50 64 L50 82 M43 82 L57 82 M50 82 L50 94 M50 14 L50 52',
    thistle: 'M50 92 L50 46 M50 46 C38 46 34 31 40 22 C44 30 50 26 50 17 C50 26 56 30 60 22 C66 31 62 46 50 46 M50 72 C40 68 34 60 36 54 M50 66 C60 62 66 56 64 50',
    rose: 'M50 30 C36 30 30 42 34 52 C38 62 62 62 66 52 C70 42 64 30 50 30 Z M50 36 C42 38 42 48 50 50 C58 48 58 38 50 36 M40 58 L50 92 M50 72 C40 66 32 70 28 76 M50 80 C60 74 68 76 72 82',
    eye: 'M14 50 C30 28 70 28 86 50 C70 72 30 72 14 50 Z M50 40 A10 10 0 1 1 50 60 A10 10 0 1 1 50 40',
    key: 'M22 50 A12 12 0 1 1 46 50 A12 12 0 1 1 22 50 M46 50 L84 50 M72 50 L72 61 M80 50 L80 58'
  };

  var WORKS = [
    { id: 'caveira-e-rosa', title: 'Caveira e rosa', style: 'Blackwork', region: 'Antebraço', year: 2026, art: 'skull', photos: 3, desc: 'Caveira em traço firme com rosa lateral, pensada para o volume do antebraço.' },
    { id: 'ramo-de-oliveira', title: 'Ramo de oliveira', style: 'Fine line', region: 'Braço', year: 2026, art: 'sprig', photos: 2, desc: 'Ramo acompanhando o eixo do braço, folhas em traço único.' },
    { id: 'serpente', title: 'Serpente', style: 'Blackwork', region: 'Costela', year: 2026, art: 'snake', photos: 2, desc: 'Composição vertical com preenchimento sólido e respiros em pele.' },
    { id: 'lua-e-mare', title: 'Lua e maré', style: 'Minimalista', region: 'Tornozelo', year: 2025, art: 'moon', photos: 1, desc: 'Peça pequena em linhas contínuas.' },
    { id: 'peonia', title: 'Peônia', style: 'Fine line', region: 'Ombro', year: 2025, art: 'peony', photos: 2, desc: 'Flor com sombreado pontilhado leve.' },
    { id: 'grade-sagrada', title: 'Grade sagrada', style: 'Geométrico', region: 'Costas', year: 2025, art: 'grid', photos: 3, desc: 'Malha geométrica ajustada à curvatura das costas.' },
    { id: 'carta-a-mao', title: 'Carta à mão', style: 'Lettering', region: 'Clavícula', year: 2024, art: 'letter', photos: 1, desc: 'Lettering a partir da caligrafia da própria cliente.' },
    { id: 'corvo', title: 'Corvo', style: 'Blackwork', region: 'Panturrilha', year: 2024, art: 'raven', photos: 2, desc: 'Silhueta em preto sólido com contorno fino.' },
    { id: 'samambaia', title: 'Samambaia', style: 'Fine line', region: 'Coluna', year: 2024, art: 'fern', photos: 2, desc: 'Peça longa acompanhando a coluna.' }
  ];

  var FLASH = [
    { id: 'adaga', name: 'Adaga', price: 450, size: '14 × 4 cm', minutes: 90, style: 'Blackwork', status: 'disponivel', art: 'dagger', desc: 'Lâmina longa com guarda simples. Funciona bem no antebraço interno ou na panturrilha.' },
    { id: 'mariposa-noturna', name: 'Mariposa noturna', price: 680, size: '12 × 9 cm', minutes: 180, style: 'Blackwork', status: 'disponivel', art: 'moth', desc: 'Asas simétricas com textura pontilhada e corpo em preto sólido.' },
    { id: 'rosa', name: 'Rosa', price: 520, size: '10 × 8 cm', minutes: 120, style: 'Fine line', status: 'disponivel', art: 'rose', desc: 'Rosa aberta com haste curta e duas folhas.' },
    { id: 'caveira-flash', name: 'Caveira clássica', price: 600, size: '10 × 9 cm', minutes: 150, style: 'Blackwork', status: 'disponivel', art: 'skull', desc: 'Caveira frontal com dentes marcados, leitura forte a distância.' },
    { id: 'cardo', name: 'Cardo', price: 520, size: '14 × 5 cm', minutes: 120, style: 'Fine line', status: 'reservado', art: 'thistle', desc: 'Flor de cardo em traço fino.' },
    { id: 'olho-vigia', name: 'Olho vigia', price: 600, size: '10 × 7 cm', minutes: 150, style: 'Blackwork', status: 'vendido', art: 'eye', desc: 'Olho com moldura amendoada.' }
  ];

  window.TL_DATA = { FLASH: FLASH, ART: ART };

  var SIZES = [
    { id: 'p', label: 'Até 5 cm', from: 300, minutes: 60 },
    { id: 'm', label: '5 a 10 cm', from: 420, minutes: 150 },
    { id: 'g', label: '10 a 20 cm', from: 650, minutes: 240 },
    { id: 'xg', label: 'Maior que 20 cm', from: null, minutes: null }
  ];

  var STATUS = {
    disponivel: { label: 'Disponível', cls: 'badge-ok' },
    reservado: { label: 'Reservado', cls: 'badge-warn' },
    vendido: { label: 'Vendido', cls: 'badge-off' }
  };

  function svg(path, opts) {
    opts = opts || {};
    return '<svg aria-hidden="true" viewBox="0 0 100 100" fill="none" stroke="' + (opts.stroke || 'currentColor') + '" stroke-width="' + (opts.width || 1.3) + '" stroke-linecap="round" stroke-linejoin="round"><path d="' + path + '"></path></svg>';
  }
  function brl(n) { return 'R$ ' + n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function brl0(n) { return 'R$ ' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function deposit(total) { return Math.max(CONFIG.depositMin, Math.round(total * CONFIG.depositPercent / 100)); }
  function dur(m) { var h = Math.floor(m / 60), r = m % 60; return h ? h + ' h' + (r ? ' ' + r + ' min' : '') : r + ' min'; }
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Cartões ---------- */
  var DIRS = ['left', 'up', 'up', 'right'];
  function workCard(w, i, asButton) {
    var tag = asButton ? 'button type="button" data-open="' + w.id + '"' : 'a href="tatuagens.html#' + w.id + '"';
    var end = asButton ? 'button' : 'a';
    return '<' + tag + ' class="work" data-rv="' + DIRS[i % 4] + '" style="--d:' + (i % 4) * 90 + 'ms" aria-label="' + esc(w.title + ', ' + w.style) + '">' +
      '<div class="ph" role="img" aria-label="' + esc('Foto: ' + w.title + ', ' + w.style.toLowerCase() + ', ' + w.region.toLowerCase()) + '">' + svg(ART[w.art], { stroke: 'currentColor' }) +
      '<span class="num">N.º ' + String(47 - WORKS.indexOf(w)).padStart(3, '0') + '</span>' + (w.photos > 1 ? '<span class="count">' + w.photos + ' fotos</span>' : '') + '</div>' +
      '<div class="meta"><span class="title">' + esc(w.title) + '</span><span class="style">' + esc(w.style) + '</span></div></' + end + '>';
  }
  function flashCard(f, i) {
    var st = STATUS[f.status];
    var action = f.status === 'disponivel'
      ? '<a class="btn btn-ink" href="agendar.html?projeto=' + f.id + '">Reservar este projeto</a><a class="sim-link" href="simulador.html?projeto=' + f.id + '">Ver no meu corpo</a>'
      : '<span class="reserved">' + (f.status === 'reservado' ? 'Reservado' : 'Já tatuado') + '</span>';
    return '<article class="flash" data-rv="up" style="--d:' + (i % 4) * 90 + 'ms">' +
      '<div class="ph" role="img" aria-label="' + esc('Desenho: ' + f.name) + '">' + svg(ART[f.art], { width: 1.4 }) + '<span class="badge ' + st.cls + '">' + st.label + '</span></div>' +
      '<div class="row"><h3>' + esc(f.name) + '</h3><span class="price">' + brl0(f.price) + '</span></div>' +
      '<p>' + esc(f.size + ' · ≈ ' + dur(f.minutes) + ' · ' + f.style) + '</p>' + action + '</article>';
  }

  /* ---------- Menu mobile ---------- */
  function initMenu() {
    var btn = $('.menu-btn'), nav = $('.nav');
    if (!btn || !nav) return;
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }); });
  }

  /* ---------- Revelação ao rolar ---------- */
  var io = null;
  function initReveal() {
    if (!('IntersectionObserver' in window)) return;
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        el.classList.add('rv-go');
        requestAnimationFrame(function () { el.classList.remove('rv-wait'); });
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    watchReveal();
  }
  function watchReveal(scope) {
    if (!io) return;
    var vh = window.innerHeight;
    $$('[data-rv]:not(.rv-seen)', scope).forEach(function (el) {
      el.classList.add('rv-seen');
      // Só esconde o que ainda está abaixo da tela: o que já aparece fica visível desde o início.
      if (el.getBoundingClientRect().top > vh * 0.92) { el.classList.add('rv-wait'); io.observe(el); }
    });
  }

  /* ---------- Parallax das caveiras ---------- */
  function initParallax() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var items = $$('[data-parallax]');
    if (!items.length) return;
    var ticking = false;
    function update() {
      var vh = window.innerHeight;
      items.forEach(function (el) {
        var r = el.getBoundingClientRect();
        var k = parseFloat(el.getAttribute('data-parallax'));
        el.style.transform = 'translate3d(0,' + ((r.top + r.height / 2 - vh / 2) * k).toFixed(1) + 'px,0)';
      });
      ticking = false;
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  /* ---------- Páginas ---------- */
  function initHome() {
    var w = $('#home-works'); if (w) w.innerHTML = WORKS.slice(0, 4).map(function (x, i) { return workCard(x, i, false); }).join('');
    var f = $('#home-flash'); if (f) f.innerHTML = FLASH.filter(function (x) { return x.status !== 'vendido'; }).slice(0, 4).map(flashCard).join('');
  }

  function initPortfolio() {
    var grid = $('#works'); if (!grid) return;
    var state = { style: 'Todos', q: '' };
    var styles = ['Todos'].concat(WORKS.map(function (w) { return w.style; }).filter(function (s, i, a) { return a.indexOf(s) === i; }));
    var bar = $('#filters');
    bar.innerHTML = styles.map(function (s) { return '<button type="button" class="filter" aria-pressed="' + (s === 'Todos') + '" data-style="' + esc(s) + '">' + esc(s) + '</button>'; }).join('');
    var empty = $('#empty'), count = $('#count');
    function render() {
      var q = state.q.trim().toLowerCase();
      var list = WORKS.filter(function (w) {
        return (state.style === 'Todos' || w.style === state.style) && (!q || (w.title + ' ' + w.style + ' ' + w.region).toLowerCase().indexOf(q) >= 0);
      });
      grid.innerHTML = list.map(function (w, i) { return workCard(w, i, true); }).join('');
      empty.hidden = list.length > 0;
      count.textContent = list.length + (list.length === 1 ? ' trabalho' : ' trabalhos');
      watchReveal(grid);
    }
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-style]'); if (!b) return;
      state.style = b.getAttribute('data-style');
      $$('.filter', bar).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      render();
    });
    $('#q').addEventListener('input', function (e) { state.q = e.target.value; render(); });
    $('#clear').addEventListener('click', function () { state = { style: 'Todos', q: '' }; $('#q').value = ''; $$('.filter', bar).forEach(function (x, i) { x.setAttribute('aria-pressed', i === 0 ? 'true' : 'false'); }); render(); });
    grid.addEventListener('click', function (e) { var b = e.target.closest('[data-open]'); if (b) openLightbox(b.getAttribute('data-open'), b); });
    render();
    var hash = location.hash.slice(1);
    if (hash && WORKS.some(function (w) { return w.id === hash; })) openLightbox(hash);
  }

  var lbReturn = null;
  function openLightbox(id, from) {
    var w = WORKS.filter(function (x) { return x.id === id; })[0]; if (!w) return;
    lbReturn = from || null;
    var img = 0;
    var lb = $('#lightbox');
    var related = WORKS.filter(function (x) { return x.style === w.style && x.id !== w.id; }).concat(WORKS.filter(function (x) { return x.style !== w.style; })).slice(0, 3);
    var tones = ['#ece6dc', '#e3dcd0', '#efeae2'];
    function draw() {
      lb.innerHTML =
        '<div class="lb-bar"><span class="small">' + esc(w.title) + ' — imagem ' + (img + 1) + ' de ' + w.photos + '</span>' +
        '<div style="display:flex;gap:8px"><button type="button" class="btn btn-ghost btn-sm" id="lb-share">Copiar link</button>' +
        '<button type="button" class="icon-btn" id="lb-close" aria-label="Fechar"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 6l12 12M18 6L6 18"></path></svg></button></div></div>' +
        '<div class="wrap lb-body"><div class="lb-stage">' +
        (w.photos > 1 ? '<button type="button" class="icon-btn" id="lb-prev" aria-label="Imagem anterior"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M15 6l-6 6 6 6"></path></svg></button>' : '') +
        '<div class="lb-img" role="img" aria-label="' + esc('Foto ' + (img + 1) + ': ' + w.title) + '" style="background:' + tones[img % 3] + '">' + svg(ART[w.art], { stroke: '#2e2c29', width: 1.1 }) + '</div>' +
        (w.photos > 1 ? '<button type="button" class="icon-btn" id="lb-next" aria-label="Próxima imagem"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 6l6 6-6 6"></path></svg></button>' : '') +
        '</div><div style="display:flex;flex-direction:column;gap:20px;min-width:0"><h2 class="h2" id="lb-title">' + esc(w.title) + '</h2>' +
        '<dl class="dl"><div><dt>Estilo</dt><dd>' + esc(w.style) + '</dd></div><div><dt>Região</dt><dd>' + esc(w.region) + '</dd></div><div><dt>Ano</dt><dd>' + w.year + '</dd></div><div><dt>Artista</dt><dd>' + esc(CONFIG.artist) + '</dd></div></dl>' +
        '<p class="muted" style="margin:0">' + esc(w.desc) + '</p>' +
        '<a class="btn btn-accent" style="align-self:flex-start" href="agendar.html?estilo=' + encodeURIComponent(w.style) + '">Quero algo neste estilo</a>' +
        '<div style="display:flex;flex-direction:column;gap:12px;border-top:1px solid var(--line);padding-top:16px"><span class="small">Relacionados</span><div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px">' +
        related.map(function (r) { return '<button type="button" class="work" data-rel="' + r.id + '" aria-label="Abrir ' + esc(r.title) + '"><div class="ph" style="aspect-ratio:1/1">' + svg(ART[r.art], { stroke: 'currentColor', width: 1.8 }) + '</div><span class="small">' + esc(r.title) + '</span></button>'; }).join('') +
        '</div></div></div></div>';
      $('#lb-close', lb).onclick = close;
      if (w.photos > 1) { $('#lb-prev', lb).onclick = function () { img = (img - 1 + w.photos) % w.photos; draw(); $('#lb-prev', lb).focus(); }; $('#lb-next', lb).onclick = function () { img = (img + 1) % w.photos; draw(); $('#lb-next', lb).focus(); }; }
      $('#lb-share', lb).onclick = function () {
        var url = location.href.split('#')[0] + '#' + w.id, btn = this;
        var done = function () { btn.textContent = 'Link copiado'; };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, function () { btn.textContent = url; });
        else btn.textContent = url;
      };
      $$('[data-rel]', lb).forEach(function (b) { b.onclick = function () { openLightbox(b.getAttribute('data-rel'), lbReturn); }; });
    }
    function close() { lb.hidden = true; lb.innerHTML = ''; document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; if (history.replaceState) history.replaceState(null, '', location.pathname + location.search); if (lbReturn) lbReturn.focus(); }
    function onKey(e) { if (e.key === 'Escape') close(); if (e.key === 'ArrowRight' && w.photos > 1) { img = (img + 1) % w.photos; draw(); } if (e.key === 'ArrowLeft' && w.photos > 1) { img = (img - 1 + w.photos) % w.photos; draw(); } }
    lb.hidden = false; document.body.style.overflow = 'hidden';
    document.removeEventListener('keydown', lb._onKey || function () {});
    lb._onKey = onKey; document.addEventListener('keydown', onKey);
    draw();
    $('#lb-close', lb).focus();
  }

  function initFlash() {
    var g = $('#flash-all'); if (!g) return;
    g.innerHTML = FLASH.map(flashCard).join('');
    var c = { disponivel: 0, reservado: 0, vendido: 0 };
    FLASH.forEach(function (f) { c[f.status]++; });
    $('#flash-count').textContent = c.disponivel + ' disponíveis · ' + c.reservado + ' reservado · ' + c.vendido + ' já tatuado';
  }

  function initPrices() {
    var t = $('#sizes'); if (!t) return;
    t.innerHTML = SIZES.map(function (s) {
      return '<tr><th scope="row">' + s.label + '</th><td>' + (s.minutes ? '≈ ' + dur(s.minutes) : 'Várias sessões') + '</td><td>' + (s.from ? 'A partir de ' + brl0(s.from) : '<a href="agendar.html">Solicitar orçamento</a>') + '</td><td>' + (s.from ? brl0(deposit(s.from)) : '—') + '</td></tr>';
    }).join('');
    var ex = 560, d = deposit(ex);
    $('#ex-total').textContent = brl(ex); $('#ex-dep').textContent = brl(d); $('#ex-rest').textContent = brl(ex - d);
    $('#dep-rule').textContent = CONFIG.depositPercent + '% do valor estimado (mínimo de ' + brl0(CONFIG.depositMin) + ')';
  }

  /* ---------- Agendamento (envio pelo WhatsApp) ---------- */
  function initBooking() {
    var root = $('#booking'); if (!root) return;
    var params = new URLSearchParams(location.search);
    var S = {
      step: 1, service: params.get('projeto') ? 'flash' : 'custom', project: params.get('projeto') || '',
      name: '', email: '', phone: '', style: params.get('estilo') || 'Fine line', region: '', size: 'm', idea: '',
      date: '', time: '', agree: false, tried: false, month: 0
    };
    var available = FLASH.filter(function (f) { return f.status === 'disponivel'; });
    if (S.project && !available.some(function (f) { return f.id === S.project; })) { S.project = ''; S.service = 'custom'; }
    var LABELS = ['Serviço', 'Detalhes', 'Data e horário', 'Revisão', 'Enviar'];

    function proj() { return available.filter(function (f) { return f.id === S.project; })[0] || available[0]; }
    function quote() { return S.service === 'custom' && S.size === 'xg'; }
    function pricing() {
      if (S.service === 'consult') return { label: 'Consulta de avaliação', total: 80, dep: 80, minutes: 30, from: false };
      if (S.service === 'flash') { var p = proj(); return { label: 'Projeto: ' + p.name, total: p.price, dep: deposit(p.price), minutes: p.minutes, from: false }; }
      var s = SIZES.filter(function (x) { return x.id === S.size; })[0];
      if (!s.from) return { label: 'Sessão personalizada (orçamento)', total: null, dep: null, minutes: null, from: false };
      return { label: 'Sessão personalizada · ' + s.label, total: s.from, dep: deposit(s.from), minutes: s.minutes, from: true };
    }
    function ymd(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
    function slotsFor(dateStr, minutes) {
      var base = minutes >= 240 ? ['10:00', '15:00'] : minutes <= 30 ? ['10:00', '11:00', '14:00', '16:00', '18:00'] : ['10:00', '14:00', '17:30'];
      var seed = dateStr.split('-').reduce(function (a, b) { return a + Number(b); }, 0);
      return base.map(function (t, i) { return { t: t, busy: (seed + i) % 4 === 0 }; });
    }
    var WD = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
    var MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    function whenLabel() {
      if (!S.date) return 'Data a escolher';
      var p = S.date.split('-').map(Number), d = new Date(p[0], p[1] - 1, p[2]);
      return WD[d.getDay()] + ', ' + p[2] + ' de ' + MONTHS[p[1] - 1] + (S.time ? ' · ' + S.time : '');
    }
    function valid2() {
      var e = {};
      if (S.name.trim().length < 3) e.name = 'Informe seu nome completo.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(S.email)) e.email = 'Informe um e-mail válido.';
      if (S.phone.replace(/\D/g, '').length < 10) e.phone = 'Informe o WhatsApp com DDD.';
      if (S.service !== 'flash' && S.idea.trim().length < 10) e.idea = 'Descreva a ideia em pelo menos uma frase.';
      return e;
    }
    function message() {
      var p = pricing();
      var lines = ['Olá, ' + CONFIG.artist + '! Quero agendar pelo site.', '', '• Serviço: ' + p.label];
      if (!quote()) lines.push('• Data: ' + whenLabel() + ' (horário de Recife)');
      if (p.total) lines.push('• Valor ' + (p.from ? 'estimado: a partir de ' : 'total: ') + brl(p.total), '• Sinal: ' + brl(p.dep) + ' · Saldo no dia: ' + brl(p.total - p.dep));
      if (S.service !== 'flash') { lines.push('• Estilo: ' + S.style, '• Região: ' + (S.region || 'a definir')); if (S.service === 'custom') lines.push('• Tamanho: ' + SIZES.filter(function (x) { return x.id === S.size; })[0].label); lines.push('• Ideia: ' + S.idea.trim()); }
      lines.push('', 'Nome: ' + S.name.trim(), 'E-mail: ' + S.email.trim(), 'WhatsApp: ' + S.phone.trim(), '', 'Li e concordo com a política de cancelamento.');
      return lines.join('\n');
    }

    function render() {
      var p = pricing(), errs = S.tried ? valid2() : {};
      var html = '<ol class="steps" aria-label="Etapas">' + LABELS.map(function (l, i) {
        var n = i + 1, cur = n === S.step, done = n < S.step;
        return '<li' + (cur ? ' aria-current="step"' : '') + (done ? ' class="done"' : '') + '><span class="n">' + (done ? '✓' : n) + '</span>' + l + '</li>';
      }).join('') + '</ol><div class="booking"><div class="booking-main"><div class="step-panel" id="panel">';

      if (S.step === 1) {
        html += '<fieldset style="border:0;margin:0;padding:0;display:flex;flex-direction:column;gap:12px"><legend class="h3" style="padding:0 0 12px">O que você quer agendar?</legend>' +
          opt('custom', 'Sessão personalizada', 'a partir de R$ 300', 'Desenho exclusivo criado a partir da sua ideia.') +
          opt('flash', 'Projeto autoral disponível', 'preço fixo', 'Um desenho do catálogo, tatuado uma única vez.') +
          opt('consult', 'Consulta ou avaliação', 'R$ 80 · 30 min', 'Para fechamentos, coberturas ou dúvidas antes de decidir.') + '</fieldset>';
        if (S.service === 'flash') html += '<label class="field" style="max-width:420px"><span>Projeto</span><select class="select" id="f-project">' + available.map(function (f) { return '<option value="' + f.id + '"' + (proj().id === f.id ? ' selected' : '') + '>' + esc(f.name) + ' — ' + brl0(f.price) + '</option>'; }).join('') + '</select></label>';
      }
      if (S.step === 2) {
        html += '<h2 class="h3">Seus dados e a ideia</h2>';
        if (S.service === 'flash') { var pj = proj(); html += '<div class="notice"><strong>' + esc(pj.name) + '</strong> · ' + esc(pj.size + ' · ≈ ' + dur(pj.minutes)) + ' — dados do projeto preenchidos automaticamente.</div>'; }
        html += '<div class="form-grid">' + field('name', 'Nome completo', 'text', 'name', errs.name) + field('email', 'E-mail', 'email', 'email', errs.email) + field('phone', 'WhatsApp', 'tel', 'tel', errs.phone, '(81) 9 0000-0000') + '</div>';
        if (S.service !== 'flash') {
          html += '<div class="form-grid"><label class="field"><span>Estilo desejado</span><select class="select" id="f-style">' + ['Fine line', 'Blackwork', 'Minimalista', 'Geométrico', 'Lettering', 'Não sei ainda'].map(function (s) { return '<option' + (s === S.style ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></label>' +
            '<label class="field"><span>Região do corpo</span><input class="input" id="f-region" value="' + esc(S.region) + '" placeholder="ex.: antebraço interno"></label>' +
            (S.service === 'custom' ? '<label class="field"><span>Tamanho aproximado</span><select class="select" id="f-size">' + SIZES.map(function (s) { return '<option value="' + s.id + '"' + (s.id === S.size ? ' selected' : '') + '>' + s.label + '</option>'; }).join('') + '</select></label>' : '') + '</div>' +
            '<label class="field"><span>Descreva a ideia</span><textarea class="textarea" id="f-idea" placeholder="O que você imagina, significado, elementos que não podem faltar…"' + (errs.idea ? ' aria-invalid="true" aria-describedby="e-idea"' : '') + '>' + esc(S.idea) + '</textarea>' + (errs.idea ? '<p class="err" id="e-idea">' + errs.idea + '</p>' : '') + '</label>' +
            '<p class="small" style="margin:0">Referências visuais: envie as imagens direto na conversa do WhatsApp, depois de enviar o pedido.</p>';
        }
      }
      if (S.step === 3) {
        if (quote()) { html += '<h2 class="h3">Data a combinar</h2><p class="muted" style="margin:0">Peças maiores que 20 cm precisam de orçamento antes. Depois da avaliação, você recebe as datas possíveis.</p>'; }
        else {
          var now = new Date(), base = new Date(now.getFullYear(), now.getMonth() + S.month, 1);
          var first = base.getDay(), daysIn = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
          var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          var cells = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'].map(function (d) { return '<span class="dow">' + d + '</span>'; });
          for (var b = 0; b < first; b++) cells.push('<button type="button" class="day blank" disabled tabindex="-1" aria-hidden="true"></button>');
          for (var d = 1; d <= daysIn; d++) {
            var dt = new Date(base.getFullYear(), base.getMonth(), d), ds = ymd(dt);
            var off = dt <= today || CONFIG.workDays.indexOf(dt.getDay()) < 0 || CONFIG.blockedDates.indexOf(ds) >= 0;
            cells.push('<button type="button" class="day" data-date="' + ds + '"' + (off ? ' disabled' : '') + ' aria-pressed="' + (S.date === ds) + '" aria-label="' + d + ' de ' + MONTHS[dt.getMonth()] + (off ? ', indisponível' : '') + '">' + d + '</button>');
          }
          html += '<div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:8px"><h2 class="h3">Escolha data e horário</h2><span class="small">Horário de Recife (UTC−3) · sessão de ' + dur(p.minutes) + '</span></div>' +
            '<div class="form-grid" style="gap:32px;align-items:start"><div style="display:flex;flex-direction:column;gap:12px"><div style="display:flex;justify-content:space-between;align-items:center">' +
            '<button type="button" class="icon-btn" id="m-prev" aria-label="Mês anterior"' + (S.month === 0 ? ' disabled' : '') + '><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M15 6l-6 6 6 6"></path></svg></button>' +
            '<strong style="text-transform:capitalize">' + MONTHS[base.getMonth()] + ' ' + base.getFullYear() + '</strong>' +
            '<button type="button" class="icon-btn" id="m-next" aria-label="Próximo mês"' + (S.month >= 2 ? ' disabled' : '') + '><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 6l6 6-6 6"></path></svg></button></div>' +
            '<div class="cal">' + cells.join('') + '</div><p class="small" style="margin:0">Atendimento de terça a sábado. Riscados: indisponível, folga ou feriado.</p></div>' +
            '<div style="display:flex;flex-direction:column;gap:12px"><strong>' + (S.date ? whenLabel().split(' · ')[0] : 'Horários') + '</strong>' +
            (S.date ? '<div class="slots">' + slotsFor(S.date, p.minutes).map(function (s) { return '<button type="button" class="slot" data-time="' + s.t + '"' + (s.busy ? ' disabled aria-label="' + s.t + ', ocupado"' : '') + ' aria-pressed="' + (S.time === s.t) + '">' + s.t + '</button>'; }).join('') + '</div>' : '<p class="muted" style="margin:0">Selecione um dia para ver os horários.</p>') +
            '<p class="small" style="margin:0">A agenda mostrada é uma prévia. O horário só fica garantido depois da confirmação e do pagamento do sinal.</p>' + (S.tried && !S.time ? '<p class="err" role="alert">Escolha um dia e um horário.</p>' : '') + '</div></div>';
        }
      }
      if (S.step === 4) {
        html += '<h2 class="h3">Revise antes de enviar</h2><div class="summary"><div><span class="label">Serviço</span><span>' + esc(p.label) + '</span></div>' +
          (quote() ? '' : '<div><span class="label">Data e horário</span><span>' + esc(whenLabel()) + '</span></div><div><span class="label">Duração estimada</span><span>' + dur(p.minutes) + '</span></div>') +
          '<div><span class="label">Cliente</span><span>' + esc(S.name) + '</span></div></div>' +
          '<div style="display:flex;flex-direction:column;gap:8px;color:var(--muted);font-size:15px"><strong style="color:var(--fg)">Política de cancelamento</strong><p style="margin:0">Reagendamento gratuito até 72 h antes, uma vez. Cancelamento com mais de 72 h: sinal devolvido. Com menos de 72 h ou não comparecimento: o sinal não é devolvido. O sinal é descontado do valor total.</p>' +
          (p.from ? '<p style="margin:0">O valor é uma estimativa a partir do tamanho informado; o valor final é confirmado antes da sessão.</p>' : '') + '</div>' +
          '<label style="display:flex;gap:12px;align-items:flex-start;cursor:pointer"><input type="checkbox" id="f-agree"' + (S.agree ? ' checked' : '') + ' style="width:20px;height:20px;margin-top:2px;accent-color:var(--accent)"><span>Li e concordo com a política de cancelamento, as condições da reserva e a <a href="privacidade.html">política de privacidade</a>.</span></label>' +
          (S.tried && !S.agree ? '<p class="err" role="alert">É preciso concordar com as condições para continuar.</p>' : '');
      }
      if (S.step === 5) {
        var msg = message(), url = 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(msg);
        html += '<h2 class="h3">Envie seu pedido</h2><p class="muted" style="margin:0">Seu pedido abre no WhatsApp com tudo preenchido. Respondo com a confirmação do horário e o link para pagar o sinal por PIX ou cartão.</p>' +
          '<div style="display:flex;flex-wrap:wrap;gap:10px"><a class="btn btn-accent" href="' + url + '" target="_blank" rel="noopener">Abrir no WhatsApp</a><button type="button" class="btn btn-ghost" id="copy">Copiar mensagem</button></div>' +
          '<label class="field"><span>Mensagem</span><textarea class="textarea" id="msg" readonly style="min-height:240px">' + esc(msg) + '</textarea></label>' +
          '<p class="small" style="margin:0">Se o WhatsApp não abrir, copie a mensagem e envie para <strong>' + esc(CONFIG.whatsappLabel) + '</strong> ou para ' + esc(CONFIG.email) + '. Seu horário ainda não está reservado: ele só é confirmado após a resposta e o pagamento do sinal.</p>';
      }
      html += '</div>';
      if (S.step < 5) html += '<div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;border-top:1px solid var(--line);padding-top:20px"><button type="button" class="btn btn-ghost" id="back"' + (S.step === 1 ? ' disabled' : '') + '>Voltar</button><button type="button" class="btn btn-accent" id="next">' + (S.step === 4 ? 'Concordo, continuar' : 'Continuar') + '</button></div>';
      else html += '<div><button type="button" class="btn btn-ghost" id="back">Voltar e editar</button></div>';
      html += '</div><aside class="booking-aside" aria-label="Resumo"><div class="summary"><div><span class="label">Resumo</span></div>' +
        '<div style="flex-direction:column;gap:2px"><strong>' + esc(p.label) + '</strong><span class="small">' + esc(quote() ? 'Data a combinar após orçamento' : whenLabel()) + '</span>' + (p.minutes ? '<span class="small">Duração estimada: ' + dur(p.minutes) + '</span>' : '') + '</div>' +
        (p.total ? '<div><span>' + (p.from ? 'Valor estimado' : 'Valor total') + '</span><strong>' + (p.from ? 'a partir de ' : '') + brl(p.total) + '</strong></div>' +
          '<div><span>' + (S.service === 'consult' ? 'Pagamento integral' : 'Sinal (' + CONFIG.depositPercent + '%)') + '</span><span>' + brl(p.dep) + '</span></div><div><span>Saldo no dia</span><span>' + brl(p.total - p.dep) + '</span></div>'
          : '<div><span>Valor</span><strong>Sob orçamento</strong></div>') + '</div></aside></div>';
      root.innerHTML = html;
      bind();
    }
    function opt(id, title, price, desc) {
      return '<label class="option"><input type="radio" name="service" value="' + id + '"' + (S.service === id ? ' checked' : '') + '><span style="flex:1;display:flex;flex-direction:column;gap:4px"><span style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px"><strong style="font-size:17px">' + title + '</strong><span class="small">' + price + '</span></span><span class="muted">' + desc + '</span></span></label>';
    }
    function field(k, label, type, ac, err, ph) {
      return '<label class="field"><span>' + label + '</span><input class="input" id="f-' + k + '" type="' + type + '" autocomplete="' + ac + '" value="' + esc(S[k]) + '"' + (ph ? ' placeholder="' + ph + '"' : '') + (err ? ' aria-invalid="true" aria-describedby="e-' + k + '"' : '') + '>' + (err ? '<p class="err" id="e-' + k + '">' + err + '</p>' : '') + '</label>';
    }
    function bind() {
      $$('input[name="service"]', root).forEach(function (r) { r.onchange = function () { S.service = r.value; if (S.service === 'flash' && !S.project && available[0]) S.project = available[0].id; S.time = ''; render(); }; });
      var fp = $('#f-project', root); if (fp) fp.onchange = function () { S.project = fp.value; S.time = ''; render(); };
      ['name', 'email', 'phone', 'region', 'idea'].forEach(function (k) { var el = $('#f-' + k, root); if (el) el.oninput = function () { S[k] = el.value; }; });
      var fs = $('#f-style', root); if (fs) fs.onchange = function () { S.style = fs.value; };
      var fz = $('#f-size', root); if (fz) fz.onchange = function () { S.size = fz.value; S.time = ''; render(); };
      $$('.day[data-date]', root).forEach(function (b) { b.onclick = function () { S.date = b.getAttribute('data-date'); S.time = ''; render(); }; });
      $$('.slot', root).forEach(function (b) { b.onclick = function () { S.time = b.getAttribute('data-time'); render(); }; });
      var mp = $('#m-prev', root); if (mp) mp.onclick = function () { S.month = Math.max(0, S.month - 1); render(); };
      var mn = $('#m-next', root); if (mn) mn.onclick = function () { S.month = Math.min(2, S.month + 1); render(); };
      var ag = $('#f-agree', root); if (ag) ag.onchange = function () { S.agree = ag.checked; };
      var back = $('#back', root); if (back) back.onclick = function () { S.step = Math.max(1, S.step - 1); S.tried = false; render(); window.scrollTo({ top: root.offsetTop - 80 }); };
      var next = $('#next', root); if (next) next.onclick = function () {
        if (S.step === 2 && Object.keys(valid2()).length) { S.tried = true; render(); var bad = $('[aria-invalid="true"]', root); if (bad) bad.focus(); return; }
        if (S.step === 3 && !quote() && !S.time) { S.tried = true; render(); return; }
        if (S.step === 4 && !S.agree) { S.tried = true; render(); return; }
        S.step++; S.tried = false; render(); window.scrollTo({ top: root.offsetTop - 80 });
      };
      var cp = $('#copy', root); if (cp) cp.onclick = function () {
        var ta = $('#msg', root);
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ta.value).then(function () { cp.textContent = 'Mensagem copiada'; }, function () { ta.select(); cp.textContent = 'Selecione e copie'; });
        else { ta.select(); cp.textContent = 'Selecione e copie'; }
      };
    }
    render();
  }

  /* ---------- Tema claro/escuro ---------- */
  function initTheme() {
    var btn = $('#theme-btn'); if (!btn) return;
    var root = document.documentElement;
    var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;
    function current() { var t = root.getAttribute('data-theme'); return t === 'light' || t === 'dark' ? t : (mq && mq.matches ? 'light' : 'dark'); }
    function label() { var c = current(); btn.setAttribute('aria-label', c === 'dark' ? 'Mudar para o tema claro' : 'Mudar para o tema escuro'); btn.setAttribute('aria-pressed', c === 'light' ? 'true' : 'false'); }
    btn.addEventListener('click', function () {
      var next = current() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('tl-theme', next); } catch (e) { /* sem armazenamento: vale só nesta visita */ }
      label();
    });
    if (mq && mq.addEventListener) mq.addEventListener('change', label);
    label();
  }

  /* ---------- Transição entre páginas ---------- */
  function initPageTransition() {
    // sem View Transitions entre documentos: anima a entrada do conteúdo
    if (!('onpagereveal' in window)) document.documentElement.classList.add('no-vt');
    var bar = document.createElement('div');
    bar.className = 'page-progress'; bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
      var url = new URL(a.href, location.href);
      if (url.origin !== location.origin || (url.pathname === location.pathname && url.hash)) return;
      bar.classList.remove('done'); void bar.offsetWidth; bar.classList.add('on');
    });
    window.addEventListener('pageshow', function () { bar.classList.remove('on'); bar.classList.add('done'); });
  }

  function start() {
    initPageTransition();
    initTheme();
    $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
    initMenu();
    initHome(); initPortfolio(); initFlash(); initPrices(); initBooking();
    initReveal(); initParallax();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

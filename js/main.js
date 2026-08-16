/* ============================================================
   ЛЕМУРИЯ — main.js: генерация контента + интерактив
============================================================ */
(function () {
  'use strict';

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* фото по ключу из window.IMG */
  const IMGS = window.IMG || {};
  function im(key, w) {
    if (typeof key === 'string' && key.indexOf('http') === 0) return key;
    const src = IMGS[key] || '';
    return w ? src.replace(/w=\d+/, 'w=' + w) : src;
  }

  document.addEventListener('DOMContentLoaded', function () {

    /* ---------- иконки Lucide ---------- */
    try { if (window.lucide) lucide.createIcons(); } catch (e) { /* без иконок */ }

    /* ---------- прелоадер ---------- */
    const loader = $('#loader'), loaderFill = $('#loaderFill');
    let fake = 0;
    const fakeInt = setInterval(function () {
      fake = Math.min(92, fake + Math.random() * 14);
      if (loaderFill) loaderFill.style.width = fake + '%';
    }, 180);
    function hideLoader() {
      clearInterval(fakeInt);
      if (loaderFill) loaderFill.style.width = '100%';
      setTimeout(function () {
        if (loader) loader.style.opacity = '0';
        const hero = $('#hero');
        if (hero) {
          hero.classList.add('hero-anim');
          $$('.hero-reveal', hero).forEach(function (el, i) { el.style.transitionDelay = (i * 0.13) + 's'; });
        }
        setTimeout(function () { if (loader) loader.style.display = 'none'; }, 750);
      }, 350);
    }
    window.addEventListener('load', hideLoader);
    setTimeout(hideLoader, 3800); // страховка

    /* ---------- шапка ---------- */
    const nav = $('#nav'), burger = $('#burger'), mobileMenu = $('#mobileMenu');
    window.addEventListener('scroll', function () {
      nav.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });
    burger.addEventListener('click', function () {
      burger.classList.toggle('open');
      mobileMenu.classList.toggle('hidden');
    });

    /* ---------- навигация ---------- */
    const sections = window.NAV_SECTIONS || [];
    const navTop = window.NAV_TOP || sections;
    const mkLink = (s) => '<a href="#' + s.id + '" class="nav-link" data-target="' + s.id + '">' + esc(s.label) + '</a>';
    const mkMob = (s) => '<a href="#' + s.id + '" class="block px-4 py-2.5 rounded-md hover:bg-white/5 text-mist hover:text-white" data-target="' + s.id + '">' + esc(s.label) + '</a>';
    $('#navMenu').innerHTML = navTop.map(mkLink).join('');
    $('#mobileMenuList').innerHTML = sections.map(mkMob).join('');
    $$('#mobileMenuList a').forEach(function (a) {
      a.addEventListener('click', function () { burger.classList.remove('open'); mobileMenu.classList.add('hidden'); });
    });

    // scrollspy
    const spySections = ['hero'].concat(sections.map(s => s.id)).map(id => $('#' + id)).filter(Boolean);
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          const id = en.target.id;
          $$('[data-target]').forEach(function (a) { a.classList.toggle('active', a.getAttribute('data-target') === id); });
        }
      });
    }, { rootMargin: '-38% 0px -55% 0px' });
    spySections.forEach(function (s) { io.observe(s); });

    /* ---------- прогресс и кнопка наверх ---------- */
    const progressBar = $('#progressBar'), toTop = $('#toTop');
    window.addEventListener('scroll', function () {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
      toTop.classList.toggle('show', window.scrollY > 700);
    }, { passive: true });
    toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });

    /* ---------- счётчики ---------- */
    function animateCount(el) {
      const target = parseFloat(el.getAttribute('data-count') || el.getAttribute('data-target')) || 0;
      const suffix = el.getAttribute('data-suffix') || '';
      const dur = 1600, t0 = performance.now();
      (function tick(now) {
        const p = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased).toLocaleString('ru-RU') + suffix;
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    }
    const counterIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { animateCount(en.target); counterIO.unobserve(en.target); }
      });
    }, { threshold: 0.5 });

    /* ---------- hero stats ---------- */
    $('#heroStats').innerHTML = (window.HERO_STATS || []).map(function (s) {
      return '<div class="glass-chip !rounded-md !py-3.5 !px-4 flex flex-col gap-1">' +
        '<span class="text-2xl italic font-bold text-sun" style="font-family:\'Playfair Display\',serif" data-count="' + s.n + '" data-suffix="' + esc(s.suffix) + '">0</span>' +
        '<span class="text-[11px] text-mist leading-tight">' + esc(s.label) + '</span></div>';
    }).join('');
    $$('#heroStats [data-count]').forEach(function (el) { counterIO.observe(el); });

    /* ---------- бегущие строки ---------- */
    function marqueeInto(containerSel, items, cls) {
      const el = $(containerSel);
      if (!el) return;
      const seq = '<div class="marquee-seq flex items-center gap-8 whitespace-nowrap flex-shrink-0">' +
        items.map(function (it) {
          return '<span class="' + cls + '">' + esc(it) + '</span>' +
            '<span class="marquee-sep">✦</span>';
        }).join('') + '</div>';
      el.innerHTML = seq + seq;
    }
    marqueeInto('#marqueeTrack', window.MARQUEE || [], 'marquee-item');
    marqueeInto('#quotesTrack', window.QUOTES || [], 'marquee-item text-base');

    /* ---------- 01 love ---------- */
    $('#loveGrid').innerHTML = (window.LOVE || []).map(function (c) {
      return '<article class="love-card reveal-item" style="min-height:430px">' +
        '<img src="' + im(c.img, 800) + '" alt="' + esc(c.alt) + '" class="absolute inset-0 w-full h-full object-cover" loading="lazy">' +
        '<div class="love-body"><div class="flex items-center gap-3 mb-3"><span class="love-emoji">' + c.emoji + '</span><h3 class="font-display font-bold text-xl">' + esc(c.title) + '</h3></div>' +
        '<p class="text-mist text-sm leading-relaxed">' + esc(c.text) + '</p></div></article>';
    }).join('');

    /* ---------- 02 таймлайн ---------- */
    const tl = $('#timeline');
    tl.innerHTML = '<div class="timeline-line" id="timelineLine"></div>' +
      (window.TIMELINE || []).map(function (t) {
        return '<div class="tl-item reveal-item pb-10">' +
          '<span class="tl-dot"></span><div class="tl-year">' + esc(t.year) + '</div>' +
          '<div class="tl-card overflow-hidden"><img src="' + im(t.img, 800) + '" alt="' + esc(t.title) + '" class="w-full h-36 object-cover" loading="lazy">' +
          '<div class="p-5"><h3 class="font-display font-bold text-xl">' + esc(t.title) + '</h3><p class="text-mist text-sm mt-2 leading-relaxed">' + esc(t.text) + '</p></div></div></div>';
      }).join('');
    const tlLine = $('#timelineLine');
    new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (en) { if (en.isIntersecting) { tlLine.classList.add('drawn'); obs.disconnect(); } });
    }, { threshold: 0.15 }).observe(tl);

    /* ---------- 03 остров ---------- */
    $('#islandStats').innerHTML = (window.ISLAND_STATS || []).map(function (s) {
      return '<div><div class="text-2xl italic font-bold text-sun" style="font-family:\'Playfair Display\',serif"><span data-count="' + s.n + '" data-suffix="' + esc(s.suffix) + '">0</span></div>' +
        '<div class="text-mist text-xs mt-1 leading-snug">' + esc(s.label) + '</div></div>';
    }).join('');
    $$('#islandStats [data-count]').forEach(function (el) { counterIO.observe(el); });

    /* ---------- 04 виды ---------- */
    const filtersBox = $('#speciesFilters');
    filtersBox.innerHTML = (window.SPECIES_FILTERS || []).map(function (f) {
      return '<button class="filter-chip' + (f.id === 'all' ? ' active' : '') + '" data-filter="' + f.id + '">' + esc(f.label) + '</button>';
    }).join('');
    const speciesGrid = $('#speciesGrid');
    const famEmoji = { lemuridae: '🐒', indriidae: '🎵', cheirogaleidae: '🐭', lepilemuridae: '🐨', daubentoniidae: '🦇' };
    speciesGrid.innerHTML = (window.SPECIES || []).map(function (s) {
      return '<article class="species-card reveal-item" data-family="' + s.family + '">' +
        '<div class="relative h-56 overflow-hidden"><img src="' + im(s.img, 800) + '" alt="' + esc(s.alt) + '" class="w-full h-full object-cover" loading="lazy">' +
        '<div class="img-grad"></div><span class="absolute top-3 left-3 tag-chip status-chip">МСОП: ' + s.status + '</span>' +
        '<div class="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">' +
        '<h3 class="font-display font-bold text-xl leading-tight">' + esc(s.name) + '</h3>' +
        '<span class="text-3xl drop-shadow">' + (famEmoji[s.family] || '🐒') + '</span></div></div>' +
        '<div class="p-5">' +
        '<div class="flex flex-wrap gap-2 mb-3">' +
        '<span class="tag-chip">' + esc(s.latin) + '</span><span class="tag-chip">' + esc(s.familyName) + '</span><span class="tag-chip">' + esc(s.size) + '</span></div>' +
        '<p class="text-mist text-sm leading-relaxed mb-4">' + esc(s.fact) + '</p>' +
        '<div class="flex flex-wrap gap-1.5">' + s.tags.map(function (t) { return '<span class="tag-chip !text-[10px]">' + esc(t) + '</span>'; }).join('') + '</div></div></article>';
    }).join('');
    filtersBox.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-filter]');
      if (!btn) return;
      $$('#speciesFilters .filter-chip').forEach(function (b) { b.classList.toggle('active', b === btn); });
      const f = btn.getAttribute('data-filter');
      $$('#speciesGrid .species-card').forEach(function (card) {
        card.classList.toggle('hidden-card', f !== 'all' && card.getAttribute('data-family') !== f);
      });
    });

    /* ---------- 06 статьи ---------- */
    $('#articlesGrid').innerHTML = (window.ARTICLES || []).map(function (a) {
      return '<article class="article-card reveal-item">' +
        '<div class="relative h-44 overflow-hidden"><img src="' + im(a.img, 800) + '" alt="' + esc(a.alt) + '" class="w-full h-full object-cover" loading="lazy">' +
        '<div class="img-grad"></div>' +
        '<span class="absolute bottom-3 right-3 glass-chip text-[11px]">⏱ ' + a.minutes + ' мин</span></div>' +
        '<div class="p-6 flex flex-col flex-1"><div class="article-kicker">' + a.emoji + ' ' + esc(a.tag) + '</div>' +
        '<h3 class="font-display font-bold text-lg leading-snug mt-2">' + esc(a.title) + '</h3>' +
        '<p class="text-mist text-sm mt-2 leading-relaxed">' + esc(a.lead) + '</p>' +
        '<details class="article-details mt-auto pt-4"><summary class="article-summary">Читать статью целиком</summary>' +
        '<div class="article-body pt-4"><p class="text-sm leading-relaxed text-ink/90">' + esc(a.text) + '</p>' +
        '<p class="article-sources mt-4">📚 Источники: ' + esc(a.sources) + '</p></div></details></div></article>';
    }).join('');

    /* ---------- 07 кино ---------- */
    $('#moviesTrack').innerHTML = (window.MOVIES || []).map(function (m) {
      return '<article class="movie-card reveal-item">' +
        '<div class="movie-poster"><img src="' + im(m.img, 800) + '" alt="' + esc(m.alt) + '" class="w-full h-full object-cover" loading="lazy">' +
        '<span class="movie-badge">' + esc(m.year) + '</span></div>' +
        '<div class="p-6"><div class="text-[10px] tracking-[.24em] uppercase text-sun font-extrabold">' + esc(m.type) + '</div>' +
        '<h3 class="font-display font-bold text-xl mt-2">' + esc(m.title) + '</h3>' +
        '<p class="text-mist text-sm mt-3 leading-relaxed">' + esc(m.text) + '</p>' +
        '<div class="mt-4 inline-flex tag-chip !border-sun/50 !text-sun">🏆 ' + esc(m.score) + '</div></div></article>';
    }).join('');

    /* ---------- 07 кино: горизонтальная лента (скролл + драг + стрелки, без пиннинга) ---------- */
    const mvViewport = $('#moviesViewport');
    if (mvViewport) {
      const mvPrev = $('#moviesPrev'), mvNext = $('#moviesNext');
      const step = function () { return Math.min(mvViewport.clientWidth * 0.85, 460); };
      if (mvPrev) mvPrev.addEventListener('click', function () { mvViewport.scrollBy({ left: -step(), behavior: 'smooth' }); });
      if (mvNext) mvNext.addEventListener('click', function () { mvViewport.scrollBy({ left: step(), behavior: 'smooth' }); });
      const upd = function () {
        const atStart = mvViewport.scrollLeft <= 8;
        const atEnd = mvViewport.scrollLeft + mvViewport.clientWidth >= mvViewport.scrollWidth - 8;
        if (mvPrev) mvPrev.style.opacity = atStart ? '.25' : '1';
        if (mvNext) mvNext.style.opacity = atEnd ? '.25' : '1';
      };
      mvViewport.addEventListener('scroll', upd, { passive: true });
      window.addEventListener('resize', upd);
      upd();
      // перетаскивание мышью (тач-скролл остаётся нативным)
      let mDown = false, mSx = 0, mSl = 0;
      mvViewport.addEventListener('pointerdown', function (e) {
        if (e.pointerType !== 'mouse') return;
        mDown = true; mSx = e.clientX; mSl = mvViewport.scrollLeft;
      });
      window.addEventListener('pointermove', function (e) {
        if (!mDown) return;
        mvViewport.scrollLeft = mSl - (e.clientX - mSx);
      });
      window.addEventListener('pointerup', function () { mDown = false; });
    }

    /* ---------- 08 книги ---------- */
    $('#booksGrid').innerHTML = (window.BOOKS || []).map(function (b) {
      const cover = b.meme
        ? '<div class="book-cover">' +
          '<img src="' + im(b.img, 800) + '" alt="' + esc(b.title) + '" class="w-full h-full object-cover" loading="lazy">' +
          '<div class="absolute inset-0 bg-gradient-to-b from-night/30 via-transparent to-night/70"></div>' +
          '<span class="meme-text meme-top">' + esc(b.title) + '</span>' +
          '<span class="meme-text meme-bottom">' + esc(b.memeText || '') + '</span></div>'
        : '<div class="book-cover"><img src="' + im(b.img, 800) + '" alt="' + esc(b.title) + '" class="w-full h-full object-cover" loading="lazy">' +
          '<span class="absolute top-3 left-3 glass-chip text-[11px]">' + esc(b.type) + '</span></div>';
      return '<article class="book-card reveal-item">' + cover +
        '<div class="p-6"><h3 class="font-display font-bold text-lg">' + esc(b.title) + '</h3>' +
        '<div class="text-sun text-xs mt-1.5 font-bold">' + esc(b.author) + '</div>' +
        '<p class="text-mist text-sm mt-3 leading-relaxed">' + esc(b.text) + '</p></div></article>';
    }).join('');

    /* ---------- 09 галерея + лайтбокс ---------- */
    const gallery = (window.GALLERY || []).map(function (g, i) {
      return '<figure class="gallery-item reveal-item" data-idx="' + i + '">' +
        '<img src="' + im(g.img, 600) + '" alt="' + esc(g.caption) + '" loading="lazy" class="gallery-img">' +
        '<figcaption>' + esc(g.caption) + '</figcaption></figure>';
    }).join('');
    $('#galleryGrid').innerHTML = gallery;
    initLightbox();

    /* ---------- 10 словарь ---------- */
    $('#glossaryGrid').innerHTML = (window.GLOSSARY || []).map(function (t) {
      return '<div class="gloss-card reveal-item"><h4 class="gloss-term">' + esc(t.term) + '</h4><p>' + esc(t.def) + '</p></div>';
    }).join('');

    /* ---------- 11 зоопарки ---------- */
    $('#zoosGrid').innerHTML = (window.ZOOS || []).map(function (z) {
      return '<article class="zoo-card reveal-item">' +
        '<div class="relative h-44 overflow-hidden"><img src="' + im(z.img, 800) + '" alt="' + esc(z.title) + '" class="w-full h-full object-cover" loading="lazy">' +
        '<span class="absolute bottom-3 left-3 glass-chip">' + z.emoji + ' ' + esc(z.chip) + '</span></div>' +
        '<div class="p-6"><h3 class="font-display font-bold text-lg">' + esc(z.title) + '</h3>' +
        '<div class="text-sage text-xs mt-1 font-bold">' + esc(z.place) + '</div>' +
        '<p class="text-mist text-sm mt-3 leading-relaxed">' + esc(z.text) + '</p></div></article>';
    }).join('');

    /* ---------- 12 охрана ---------- */
    $('#orgsList').innerHTML = (window.CONSERVATION_WHO || []).map(function (o) {
      return '<li class="flex gap-2.5"><span class="text-sage flex-shrink-0">✦</span><span>' + esc(o) + '</span></li>';
    }).join('');
    $('#saveGrid').innerHTML = (window.THREATS || []).map(function (c) {
      return '<div class="threat-card reveal-item"><div class="text-4xl mb-3">' + c.emoji + '</div>' +
        '<h3 class="font-display font-bold text-lg">' + esc(c.title) + '</h3>' +
        '<p class="text-mist text-sm mt-2.5 leading-relaxed">' + esc(c.text) + '</p></div>';
    }).join('') + '<div class="sm:col-span-2 grid sm:grid-cols-3 gap-6">' + (window.EFFORTS || []).map(function (c) {
      return '<div class="action-card reveal-item"><div class="text-4xl mb-3">' + c.emoji + '</div>' +
        '<h3 class="font-display font-bold text-lg">' + esc(c.title) + '</h3>' +
        '<p class="text-mist text-sm mt-2.5 leading-relaxed">' + esc(c.text) + '</p></div>';
    }).join('') + '</div>';

    /* ---------- 13 факты ---------- */
    $('#factsGrid').innerHTML = (window.FACTS || []).map(function (f) {
      return '<div class="fact-card reveal-item" tabindex="0" role="button" aria-label="Перевернуть карточку">' +
        '<div class="fact-inner">' +
        '<div class="fact-face fact-front"><span class="fact-emoji">' + f.e + '</span>' +
        '<h3 class="font-display font-bold text-base mt-3">' + esc(f.q) + '</h3>' +
        '<span class="text-[9px] tracking-[.34em] uppercase text-mist mt-2">нажми</span></div>' +
        '<div class="fact-face fact-back">' + esc(f.a) + '</div>' +
        '</div></div>';
    }).join('');
    function flipCard(card) { card.classList.toggle('flipped'); }
    $$('#factsGrid .fact-card').forEach(function (c) {
      c.addEventListener('click', function () { flipCard(c); });
      c.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flipCard(c); } });
    });

    /* ---------- 14 квиз ---------- */
    initQuiz();

    /* ---------- подвал ---------- */
    $('#footerLinks').innerHTML = sections.map(function (s) {
      return '<li><a href="#' + s.id + '" class="text-mist hover:text-sage transition-colors">' + esc(s.label) + '</a></li>';
    }).join('');
    $('#techChips').innerHTML = (window.TECH || []).map(function (t) {
      return '<span class="tag-chip !text-[11px]">' + esc(t) + '</span>';
    }).join('');

    /* ---------- reveal-анимации ---------- */
    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);

      // появление блоков (карточки киноленты не трогаем — они внутри ленты)
      gsap.utils.toArray('.reveal-item, .sec-head, .chart-card').forEach(function (el) {
        if (el.classList.contains('movie-card')) return;
        gsap.from(el, {
          y: 46, opacity: 0, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true }
        });
      });

      // параллакс фото-фона hero
      gsap.to('#heroPhoto', {
        yPercent: 14, ease: 'none',
        scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true }
      });

      // параллакс номеров секций
      gsap.utils.toArray('.sec-num').forEach(function (el) {
        gsap.fromTo(el, { y: 40 }, {
          y: -40, ease: 'none',
          scrollTrigger: { trigger: el.closest('section'), start: 'top bottom', end: 'bottom top', scrub: true }
        });
      });
    } else {
      // фолбэк без GSAP
      const vp = $('#moviesViewport');
      if (vp) vp.style.overflowX = 'auto';
      const rio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('visible'); rio.unobserve(en.target); }
        });
      }, { threshold: 0.08 });
      $$('.reveal-item').forEach(function (el) { el.classList.add('reveal-up'); rio.observe(el); });
    }
  });

  /* ===================== ЛАЙТБОКС ===================== */
  function initLightbox() {
    const items = $$('#galleryGrid .gallery-item');
    if (!items.length) return;
    const overlay = document.createElement('div');
    overlay.id = 'lightbox';
    overlay.className = 'lightbox';
    overlay.innerHTML = '<button class="lb-close" aria-label="Закрыть">✕</button>' +
      '<button class="lb-nav lb-prev" aria-label="Назад">‹</button>' +
      '<button class="lb-nav lb-next" aria-label="Вперёд">›</button>' +
      '<figure class="lb-figure"><img src="" alt=""><figcaption></figcaption></figure>';
    document.body.appendChild(overlay);
    const img = overlay.querySelector('img');
    const cap = overlay.querySelector('figcaption');
    const prev = overlay.querySelector('.lb-prev');
    const next = overlay.querySelector('.lb-next');
    let idx = 0;
    function show(i) {
      idx = (i + items.length) % items.length;
      const imEl = items[idx].querySelector('img');
      img.src = imEl.src.replace(/w=\d+/, 'w=1600');
      img.alt = items[idx].querySelector('figcaption').textContent;
      cap.textContent = items[idx].querySelector('figcaption').textContent;
    }
    function open(i) { show(i); overlay.classList.add('open'); document.body.style.overflow = 'hidden'; }
    function close() { overlay.classList.remove('open'); document.body.style.overflow = ''; }
    items.forEach(function (fig, i) { fig.addEventListener('click', function () { open(i); }); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    overlay.querySelector('.lb-close').addEventListener('click', close);
    prev.addEventListener('click', function (e) { e.stopPropagation(); show(idx - 1); });
    next.addEventListener('click', function (e) { e.stopPropagation(); show(idx + 1); });
    document.addEventListener('keydown', function (e) {
      if (!overlay.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
  }

  /* ===================== КВИЗ ===================== */
  function initQuiz() {
    const box = $('#quizBox');
    const Q = window.QUIZ;
    if (!box || !Q) return;

    let idx = 0, scores = { catta: 0, indri: 0, ayeaye: 0, sifaka: 0 };

    function renderQuestion() {
      const q = Q.questions[idx];
      box.innerHTML =
        '<div class="flex items-center justify-between gap-4 mb-5">' +
        '<span class="text-[11px] tracking-[.3em] uppercase text-sun font-extrabold">Вопрос ' + (idx + 1) + ' / ' + Q.questions.length + '</span>' +
        '<span class="text-mist text-xs">' + Math.round((idx / Q.questions.length) * 100) + '%</span></div>' +
        '<div class="quiz-progress mb-6"><div style="width:' + ((idx / Q.questions.length) * 100) + '%"></div></div>' +
        '<h3 class="font-display font-bold text-xl lg:text-2xl mb-6">' + esc(q.q) + '</h3>' +
        '<div class="grid gap-3">' +
        q.options.map(function (o) {
          return '<button class="quiz-option" data-score="' + o.s + '"><span class="q-emoji">' + o.e + '</span><span>' + esc(o.t) + '</span></button>';
        }).join('') + '</div>';
    }

    function renderResult() {
      const best = Object.entries(scores).sort(function (a, b) { return b[1] - a[1]; })[0][0];
      const r = Q.results[best];
      box.innerHTML =
        '<div class="text-center">' +
        '<div class="quiz-result-badge">' + r.e + '</div>' +
        '<h3 class="font-display font-bold text-2xl lg:text-3xl mt-6 text-transparent bg-clip-text bg-gradient-to-r from-sage to-sun">' + esc(r.name) + '</h3>' +
        '<p class="text-mist leading-relaxed mt-4 max-w-xl mx-auto">' + esc(r.text) + '</p>' +
        '<div class="flex flex-wrap justify-center gap-4 mt-8">' +
        '<button id="quizRestart" class="btn-primary">Пройти ещё раз 🔄</button>' +
        '<a href="#species" class="btn-ghost">Посмотреть виды 🐒</a></div></div>';
      const rb = $('#quizRestart');
      if (rb) rb.addEventListener('click', function () { idx = 0; scores = { catta: 0, indri: 0, ayeaye: 0, sifaka: 0 }; renderQuestion(); });
    }

    box.addEventListener('click', function (e) {
      const opt = e.target.closest('.quiz-option');
      if (!opt) return;
      scores[opt.getAttribute('data-score')]++;
      idx++;
      if (idx < Q.questions.length) {
        renderQuestion();
      } else {
        renderResult();
      }
    });

    renderQuestion();
  }
})();

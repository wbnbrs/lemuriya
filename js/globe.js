/* ============================================================
   ЛЕМУРИЯ — Three.js: частицы в хиро
============================================================ */
(function () {
  'use strict';
  if (typeof THREE === 'undefined') return;

  function makeSprite(emoji, size) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    ctx.font = Math.round(size * 0.78) + 'px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, size / 2, size / 2 + size * 0.04);
    const tex = new THREE.CanvasTexture(c);
    return new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  }

  function heroParticles() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    } catch (e) { canvas.style.display = 'none'; return; }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.z = 8;

    // пылинки
    const N = 620;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const cFern = new THREE.Color('#a3c585');
    const cAmber = new THREE.Color('#e07b39');
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 26;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
      const c = Math.random() > 0.75 ? cAmber : cFern;
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const dots = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.055, vertexColors: true, transparent: true, opacity: 0.75,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    scene.add(dots);

    // парящие эмодзи-спрайты
    const sprites = ['🐒', '👑', '🌴', '🍃'].map((e, i) => {
      const s = makeSprite(e, 110);
      s.material.opacity = 0.5;
      s.scale.setScalar(1.4 - i * 0.22);
      s.position.set((i % 2 ? 1 : -1) * (3 + i * 1.4), (i - 1.5) * 1.8, -1 - i * 0.8);
      s.userData = { phase: i * 1.7, amp: 0.5 + i * 0.2 };
      scene.add(s);
      return s;
    });

    const mouse = { x: 0, y: 0 };
    window.addEventListener('pointermove', function (ev) {
      mouse.x = (ev.clientX / window.innerWidth - 0.5) * 2;
      mouse.y = (ev.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    let w = canvas.clientWidth, h = canvas.clientHeight;
    function resize() {
      w = canvas.clientWidth; h = canvas.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    }
    window.addEventListener('resize', resize);
    resize();

    const clock = new THREE.Clock();
    (function loop() {
      requestAnimationFrame(loop);
      const t = clock.getElapsedTime();
      dots.rotation.y = t * 0.012 + mouse.x * 0.06;
      dots.position.y = Math.sin(t * 0.2) * 0.3;
      sprites.forEach(function (s) {
        s.position.y += Math.sin(t * 0.4 + s.userData.phase) * 0.0012;
        s.rotation.z = Math.sin(t * 0.3 + s.userData.phase) * 0.12;
      });
      camera.position.x += (mouse.x * 0.5 - camera.position.x) * 0.03;
      camera.position.y += (-mouse.y * 0.35 - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    })();

    // плавное затухание при скролле
    const hero = document.getElementById('hero');
    window.addEventListener('scroll', function () {
      const p = Math.min(1, window.scrollY / (window.innerHeight * 0.9));
      hero.style.setProperty('--hero-dim', p);
      canvas.style.opacity = String(1 - p);
    }, { passive: true });
  }

  heroParticles();
})();

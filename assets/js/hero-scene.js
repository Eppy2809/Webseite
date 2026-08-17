/* =========================================================
   Valtro-Webdesign — Hero-Szene (Three.js)
   Dezente 3D-Ebene: Partikelschale, Draht-Ikosaeder, leichte
   Maus-Parallaxe. Läuft nur, wenn sie sichtbar ist.

   Wird ausschließlich per dynamischem import() aus main.js geladen,
   und zwar nur auf Geräten mit Zeiger und breitem Viewport. Handys
   sparen damit die rund 690 KB von three.js komplett ein.
   ========================================================= */
import * as THREE from '../vendor/three.module.min.js';

const canvas = document.getElementById('heroCanvas');
const hero = document.querySelector('.hero');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (canvas && hero && !reduced) {
  try {
    initScene();
  } catch (err) {
    // Ohne WebGL bleibt der CSS-Verlauf als Hintergrund stehen.
    canvas.remove();
    console.warn('Hero-Szene deaktiviert:', err);
  }
}

function initScene() {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 15);

  const world = new THREE.Group();
  scene.add(world);

  /* ---------- Partikelschale ---------- */
  const COUNT = 2000;
  const positions = new Float32Array(COUNT * 3);
  const seeds = new Float32Array(COUNT);
  const RADIUS = 5.1;
  const golden = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < COUNT; i++) {
    // Fibonacci-Verteilung: gleichmäßige Punkte auf der Kugel
    const y = 1 - (i / (COUNT - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;

    positions[i * 3] = Math.cos(theta) * r * RADIUS;
    positions[i * 3 + 1] = y * RADIUS;
    positions[i * 3 + 2] = Math.sin(theta) * r * RADIUS;
    seeds[i] = Math.random();
  }

  const pointsGeo = new THREE.BufferGeometry();
  pointsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  pointsGeo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));

  const uniforms = {
    uTime: { value: 0 },
    uOpacity: { value: 0 },
    uSize: { value: renderer.getPixelRatio() * 2.2 },
    uColorA: { value: new THREE.Color('#0f8b7d') },
    uColorB: { value: new THREE.Color('#c8781f') }
  };

  const pointsMat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    vertexShader: /* glsl */`
      uniform float uTime;
      uniform float uSize;
      attribute float aSeed;
      varying float vFade;
      varying float vSeed;

      void main() {
        vec3 p = position;

        // sanftes Atmen der Schale
        float wave = sin(p.y * 0.8 + uTime * 0.55)
                   + cos(p.x * 0.65 - uTime * 0.42)
                   + sin(p.z * 0.72 + uTime * 0.33);
        p += normalize(p) * wave * 0.22;

        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;

        // Punkte hinten kleiner und blasser
        float depth = clamp((mv.z + 12.0) / 14.0, 0.0, 1.0);
        vFade = depth;
        vSeed = aSeed;

        float twinkle = 0.65 + 0.35 * sin(uTime * 1.6 + aSeed * 30.0);
        gl_PointSize = uSize * (0.55 + depth) * twinkle * (300.0 / -mv.z);
      }
    `,
    fragmentShader: /* glsl */`
      uniform float uOpacity;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      varying float vFade;
      varying float vSeed;

      void main() {
        // runde, weiche Punkte
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        if (d > 0.5) discard;
        float alpha = smoothstep(0.5, 0.05, d);

        vec3 color = mix(uColorA, uColorB, vSeed);
        gl_FragColor = vec4(color, alpha * uOpacity * (0.25 + vFade * 0.75));
      }
    `
  });

  const points = new THREE.Points(pointsGeo, pointsMat);
  world.add(points);

  /* ---------- Draht-Ikosaeder ---------- */
  const wireMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#0f8b7d'),
    wireframe: true,
    transparent: true,
    opacity: 0
  });
  const wire = new THREE.Mesh(new THREE.IcosahedronGeometry(3.1, 1), wireMat);
  world.add(wire);

  const wireInner = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.7, 0),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color('#c8781f'),
      wireframe: true,
      transparent: true,
      opacity: 0
    })
  );
  world.add(wireInner);

  /* ---------- Größe ---------- */
  function resize() {
    const w = hero.clientWidth;
    const h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;

    // Auf schmalen Displays weiter weg, damit die Kugel ins Bild passt
    camera.position.z = 17;
    camera.updateProjectionMatrix();

    // Szene nach rechts schieben, damit die Headline frei bleibt
    world.position.x = w < 900 ? 0 : Math.min(4.2, camera.position.z * 0.17);
    world.position.y = w < 900 ? 1.2 : 0;
    uniforms.uSize.value = renderer.getPixelRatio() * 2.2;
  }
  resize();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 120);
  });

  /* ---------- Maus-Parallaxe ---------- */
  const pointer = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };

  window.addEventListener('pointermove', (e) => {
    target.x = (e.clientX / window.innerWidth - 0.5) * 2;
    target.y = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  /* ---------- Nur rendern, wenn sichtbar ---------- */
  let visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0 })
      .observe(hero);
  }
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) clock.getDelta();
  });

  /* ---------- Schleife ---------- */
  const clock = new THREE.Clock();
  let fadeIn = 0;

  function tick() {
    requestAnimationFrame(tick);
    if (!visible || document.hidden) return;

    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.getElapsedTime();

    // Einblenden nach dem Preloader
    fadeIn = Math.min(1, fadeIn + dt * 0.55);
    const eased = fadeIn * fadeIn * (3 - 2 * fadeIn);
    uniforms.uOpacity.value = eased * 0.62;
    wireMat.opacity = eased * 0.16;
    wireInner.material.opacity = eased * 0.22;

    uniforms.uTime.value = t;

    pointer.x += (target.x - pointer.x) * 0.045;
    pointer.y += (target.y - pointer.y) * 0.045;

    world.rotation.y = t * 0.05 + pointer.x * 0.28;
    world.rotation.x = pointer.y * 0.18;

    wire.rotation.y = -t * 0.09;
    wire.rotation.x = t * 0.05;
    wireInner.rotation.y = t * 0.16;
    wireInner.rotation.z = -t * 0.11;

    renderer.render(scene, camera);
  }
  tick();
}

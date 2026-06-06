/* bg3d.js — fundo 3D ambiente (Three.js via CDN).
   Uma constelação de partículas na cor accent, derivando devagar atrás do
   conteúdo. Decorativo: o .bg é pointer-events:none e aria-hidden, então
   nada disso interfere na leitura ou na interação com os cards.
   Cuidados: theme-aware (observa data-theme), leve (cap de pixelRatio,
   pausa em aba oculta), e respeita prefers-reduced-motion (frame estático). */
import * as THREE from "three";

const host = document.querySelector(".bg");
if (host && window.WebGLRenderingContext) {
  try {
    initBg(host);
  } catch (e) {
    /* se o WebGL falhar, a página segue normal só com o gradiente CSS */
    console.warn("bg3d desativado:", e);
  }
}

function cssColor(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function initBg(host) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = matchMedia("(max-width: 640px)").matches;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.z = 14;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0); // transparente: deixa o gradiente CSS por baixo

  const canvas = renderer.domElement;
  canvas.style.position = "absolute";
  canvas.style.inset = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  host.appendChild(canvas);

  /* ---------- constelação ---------- */
  const COUNT = mobile ? 130 : 250;
  const spread = 26;
  const positions = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * spread;
    positions[i * 3 + 1] = (Math.random() - 0.5) * spread * 0.8;
    positions[i * 3 + 2] = (Math.random() - 0.5) * spread * 0.6;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    color: new THREE.Color(cssColor("--accent", "#4D7C2A")),
    size: 0.1,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  const points = new THREE.Points(geo, mat);
  scene.add(points);

  /* ---------- resize ---------- */
  function resize() {
    const w = host.clientWidth || window.innerWidth;
    const h = host.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  /* ---------- theme-aware: troca a cor das partículas com o tema ---------- */
  const obs = new MutationObserver(() => mat.color.set(cssColor("--accent", "#4D7C2A")));
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  /* ---------- parallax suave (o .bg é pointer-events:none → ouvimos na window) ---------- */
  let targetX = 0, targetY = 0, curX = 0, curY = 0;
  if (!reduce) {
    window.addEventListener(
      "pointermove",
      (e) => {
        targetX = e.clientX / window.innerWidth - 0.5;
        targetY = e.clientY / window.innerHeight - 0.5;
      },
      { passive: true }
    );
  }

  const clock = new THREE.Clock();
  function frame() {
    const t = clock.getElapsedTime();
    points.rotation.y = t * 0.04;
    points.rotation.x = Math.sin(t * 0.06) * 0.08;
    curX += (targetX - curX) * 0.03;
    curY += (targetY - curY) * 0.03;
    camera.position.x = curX * 2.2;
    camera.position.y = -curY * 1.6;
    camera.lookAt(scene.position);
    renderer.render(scene, camera);
  }

  if (reduce) {
    renderer.render(scene, camera); // um único frame estático (constelação parada)
  } else {
    renderer.setAnimationLoop(frame);
    /* economia: pausa o loop quando a aba não está visível */
    document.addEventListener("visibilitychange", () => {
      renderer.setAnimationLoop(document.hidden ? null : frame);
    });
  }
}

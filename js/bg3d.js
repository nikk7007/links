/* bg3d.js — fundo 3D ambiente (Three.js via CDN).
   Estrelas cadentes na cor accent riscando o fundo, sobre um campo de
   estrelas bem sutil parado por trás. Decorativo: o .bg é pointer-events:none
   e aria-hidden, então nada disso interfere na leitura ou na interação.
   Cuidados: theme-aware (observa data-theme), leve (cap de pixelRatio,
   pausa em aba oculta), e respeita prefers-reduced-motion (frame estático,
   sem meteoros — só o campo de estrelas parado). */
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
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
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
  canvas.style.width = "150%";
  canvas.style.height = "150%";
  host.appendChild(canvas);

  const accent = () => new THREE.Color(cssColor("--accent", "#4D7C2A"));

  /* ---------- campo de estrelas (parado, bem discreto) ---------- */
  const COUNT = mobile ? 110 : 220;
  const spread = 26;
  const positions = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * spread;
    positions[i * 3 + 1] = (Math.random() - 0.5) * spread * 0.8;
    positions[i * 3 + 2] = (Math.random() - 0.5) * spread * 0.6;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const starMat = new THREE.PointsMaterial({
    color: accent(),
    size: 0.08,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
  });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  /* ---------- estrelas cadentes ----------
     Cada meteoro é uma linha que vai do "head" (brilhante) até a cauda
     (transparente). A cauda aponta para trás no sentido do movimento, e a
     opacidade geral sobe/desce ao longo da vida (sin), dando o entra-e-sai. */
  const SEG = 24;
  const streakGeo = new THREE.BufferGeometry();
  const streakPos = new Float32Array((SEG + 1) * 3);
  const streakProg = new Float32Array(SEG + 1); // 0 = head, 1 = cauda
  for (let i = 0; i <= SEG; i++) {
    streakPos[i * 3] = -(i / SEG); // unidade ao longo de -X (escala depois)
    streakProg[i] = i / SEG;
  }
  streakGeo.setAttribute("position", new THREE.BufferAttribute(streakPos, 3));
  streakGeo.setAttribute("aProgress", new THREE.BufferAttribute(streakProg, 1));

  function makeMeteorMaterial() {
    return new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: accent() },
        uOpacity: { value: 0 },
      },
      vertexShader: `
        attribute float aProgress;
        varying float vProgress;
        void main() {
          vProgress = aProgress;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        varying float vProgress;
        void main() {
          // brilhante no head, some na cauda
          float a = pow(1.0 - vProgress, 1.8) * uOpacity;
          gl_FragColor = vec4(uColor, a);
        }
      `,
      transparent: true,
      depthWrite: false,
    });
  }

  const POOL = mobile ? 7 : 14;
  const meteors = [];
  const now = () => performance.now() / 1000;
  for (let i = 0; i < POOL; i++) {
    const mat = makeMeteorMaterial();
    const line = new THREE.Line(streakGeo, mat);
    line.visible = false;
    scene.add(line);
    meteors.push({ line, mat, active: false, nextAt: now() + Math.random() * 2 });
  }

  function launch(m) {
    // sempre do topo-esquerda para o chão-direita (diagonal ↘)
    const angle = -Math.PI / 4 + (Math.random() - 0.5) * 0.18; // ~ -45° com leve variação
    const speed = 22 + Math.random() * 16;
    m.vx = Math.cos(angle) * speed;
    m.vy = Math.sin(angle) * speed;
    m.x = -spread * 0.55 + (Math.random() - 0.5) * spread * 0.5; // entra pela esquerda/topo
    m.y = spread * 0.42 + Math.random() * spread * 0.2;
    m.z = (Math.random() - 0.5) * 6;
    m.len = 2.6 + Math.random() * 3.2;
    m.age = 0;
    m.duration = 0.9 + Math.random() * 0.8;
    m.active = true;
    m.line.visible = true;
    m.line.rotation.z = angle; // alinha a cauda (-X local) ao rastro
    m.line.scale.x = m.len;
  }

  function updateMeteor(m, dt) {
    if (!m.active) {
      if (now() >= m.nextAt) launch(m);
      return;
    }
    m.age += dt;
    const p = m.age / m.duration;
    if (p >= 1) {
      m.active = false;
      m.line.visible = false;
      m.mat.uniforms.uOpacity.value = 0;
      m.nextAt = now() + 0.15 + Math.random() * 1.1; // intervalo até a próxima
      return;
    }
    m.x += m.vx * dt;
    m.y += m.vy * dt;
    m.line.position.set(m.x, m.y, m.z);
    m.mat.uniforms.uOpacity.value = Math.sin(p * Math.PI) * 0.9;
  }

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

  /* ---------- theme-aware: troca a cor com o tema ---------- */
  const obs = new MutationObserver(() => {
    const c = accent();
    starMat.color.copy(c);
    meteors.forEach((m) => m.mat.uniforms.uColor.value.copy(c));
  });
  obs.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  /* ---------- parallax suave (o .bg é pointer-events:none → ouvimos na window) ---------- */
  let targetX = 0,
    targetY = 0,
    curX = 0,
    curY = 0;
  if (!reduce) {
    window.addEventListener(
      "pointermove",
      (e) => {
        targetX = e.clientX / window.innerWidth - 0.5;
        targetY = e.clientY / window.innerHeight - 0.5;
      },
      { passive: true },
    );
  }

  const clock = new THREE.Clock();
  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.getElapsedTime();
    stars.rotation.y = t * 0.02; // deriva quase imperceptível
    meteors.forEach((m) => updateMeteor(m, dt));
    curX += (targetX - curX) * 0.03;
    curY += (targetY - curY) * 0.03;
    camera.position.x = curX * 2.2;
    camera.position.y = -curY * 1.6;
    camera.lookAt(scene.position);
    renderer.render(scene, camera);
  }

  if (reduce) {
    renderer.render(scene, camera); // frame estático: só o campo de estrelas
  } else {
    renderer.setAnimationLoop(frame);
    /* economia: pausa o loop quando a aba não está visível */
    document.addEventListener("visibilitychange", () => {
      renderer.setAnimationLoop(document.hidden ? null : frame);
    });
  }
}

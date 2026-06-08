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
  const COUNT = mobile ? 50 : 110;
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
    meteors.push({
      line,
      mat,
      active: false,
      nextAt: now() + Math.random() * 2,
    });
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

  /* ---------- cometas que seguem o mouse ----------
     3 seguidores: cada um persegue a posição do mouse de `delay` segundos
     atrás (lida de um histórico) e se aproxima dela na sua própria `ease`
     (velocidade). A cauda aponta no sentido contrário ao movimento e estica
     com a velocidade, então vira um cometinha quando o mouse se mexe e some
     num pontinho quando ele para. Desligados em prefers-reduced-motion. */
  let halfW = 10,
    halfH = 8; // metade do plano visível em z=0 (preenchido no resize)
  const FOLLOWERS = reduce
    ? []
    : [
        { delay: 0.05, ease: 0.18 }, // rápido e grudado
        { delay: 0.18, ease: 0.1 }, // intermediário
        { delay: 0.35, ease: 0.06 }, // lento e arrastado
      ].map((cfg) => {
        const mat = makeMeteorMaterial();
        mat.uniforms.uOpacity.value = 0.85;
        const line = new THREE.Line(streakGeo, mat);
        line.visible = false;
        scene.add(line);
        return { ...cfg, line, mat, x: 0, y: 0, px: 0, py: 0 };
      });

  const mouse = { x: 0, y: 0 };
  const history = []; // { t, x, y } amostrado por frame
  function mouseSampleAt(time) {
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].t <= time) return history[i];
    }
    return history[0] || mouse;
  }
  function updateFollowers(t) {
    if (!FOLLOWERS.length) return;
    history.push({ t, x: mouse.x, y: mouse.y });
    while (history.length && history[0].t < t - 1) history.shift();
    for (const f of FOLLOWERS) {
      const tgt = mouseSampleAt(t - f.delay);
      f.px = f.x;
      f.py = f.y;
      f.x += (tgt.x - f.x) * f.ease;
      f.y += (tgt.y - f.y) * f.ease;
      const vx = f.x - f.px,
        vy = f.y - f.py;
      const speed = Math.hypot(vx, vy);
      f.line.position.set(f.x, f.y, 0);
      if (speed > 0.0008) f.line.rotation.z = Math.atan2(vy, vx);
      // parado = sem cauda (escala 0 → some); com teto menor que antes
      f.line.scale.x = Math.min(speed * 16, 3.2);
      f.line.visible = f.line.scale.x > 0.01;
    }
  }

  /* ---------- resize ---------- */
  function resize() {
    const w = host.clientWidth || window.innerWidth;
    const h = host.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    halfH = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
    halfW = halfH * camera.aspect;
  }
  resize();
  window.addEventListener("resize", resize);

  /* ---------- theme-aware: troca a cor com o tema ---------- */
  const obs = new MutationObserver(() => {
    const c = accent();
    starMat.color.copy(c);
    meteors.forEach((m) => m.mat.uniforms.uColor.value.copy(c));
    FOLLOWERS.forEach((f) => f.mat.uniforms.uColor.value.copy(c));
  });
  obs.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  /* ---------- mouse → mundo (só alimenta os cometas; o fundo não reage) ----------
     O .bg é pointer-events:none, então ouvimos na window. A câmera fica
     parada: o campo de estrelas não tem mais parallax. */
  if (!reduce) {
    window.addEventListener(
      "pointermove",
      (e) => {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        mouse.x = nx * 2 * halfW; // pointer → coordenadas de mundo (z=0)
        mouse.y = -ny * 2 * halfH;
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
    updateFollowers(t);
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

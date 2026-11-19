// The pour: a Lait paper cup, a steel pitcher, a ribbon of milk and a latte-art heart that blooms
// as you scroll. Everything is procedural (no model files). Scroll progress p (0..1) drives the
// whole scene, so the same code renders live and frame-by-frame in ?capture mode.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export function webglOK() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const sm = (a: number, b: number, x: number) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

// Cup dimensions (world units)
const H = 1.9, RB = 0.6, RT = 0.86, WALL = 0.035, BASE = 0.09;
const innerR = (y: number) => mix(RB, RT, y / H) - WALL;
const LEVEL0 = 0.95, LEVEL1 = 1.74; // espresso level → full cup

function cupTexture() {
  const c = document.createElement('canvas');
  c.width = 2048; c.height = 1024;
  const g = c.getContext('2d')!;
  g.fillStyle = '#fffdf8'; g.fillRect(0, 0, c.width, c.height);
  // paper grain
  const img = g.getImageData(0, 0, c.width, c.height);
  for (let i = 0; i < img.data.length; i += 4) { const n = (Math.random() - 0.5) * 7; img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n; }
  g.putImageData(img, 0, 0);
  const cx = c.width / 2;
  g.fillStyle = '#1c1a17'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '330px "Caveat Brush", "Segoe Script", cursive';
  g.fillText('LAiT', cx, 470);
  g.font = '600 46px "Manrope Variable", "Manrope", system-ui, sans-serif';
  g.letterSpacing = '6px';
  g.fillStyle = '#5e574f';
  g.fillText('AL AIN · AL JIMI', cx, 690);
  // cognac heart doodle
  g.save(); g.translate(cx + 250, 300); g.rotate(0.25); g.strokeStyle = '#b05a26'; g.lineWidth = 9; g.lineCap = 'round';
  g.beginPath(); g.moveTo(0, 30); g.bezierCurveTo(-60, -10, -40, -60, 0, -28); g.bezierCurveTo(40, -60, 60, -10, 0, 30); g.stroke(); g.restore();
  // thin bands top and bottom
  g.fillStyle = '#1c1a17'; g.fillRect(0, 70, c.width, 5); g.fillRect(0, 950, c.width, 5);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.wrapS = THREE.RepeatWrapping;
  return t;
}

function shadowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d')!;
  const r = g.createRadialGradient(128, 128, 10, 128, 128, 128);
  r.addColorStop(0, 'rgba(40,28,20,0.55)'); r.addColorStop(0.45, 'rgba(40,28,20,0.22)'); r.addColorStop(1, 'rgba(40,28,20,0)');
  g.fillStyle = r; g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

const SURFACE_FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime, uFill, uPour, uBlob, uHeart, uTail;
  uniform vec2 uPourAt;
  float dot2(vec2 v) { return dot(v, v); }
  float sdHeart(vec2 p) {
    p.x = abs(p.x);
    if (p.y + p.x > 1.0) return sqrt(dot2(p - vec2(0.25, 0.75))) - sqrt(2.0) / 4.0;
    return sqrt(min(dot2(p - vec2(0.0, 1.0)), dot2(p - 0.5 * max(p.x + p.y, 0.0)))) * sign(p.x - p.y);
  }
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
  void main() {
    vec2 uv = vUv * 2.0 - 1.0;          // disc space, radius 1
    float r = length(uv);
    // crema: warm caramel in the middle, deeper toward the wall, with a mottled tiger-stripe
    float n = noise(uv * 7.0 + uTime * 0.05) * 0.6 + noise(uv * 19.0 - uTime * 0.03) * 0.4;
    vec3 crema = mix(vec3(0.62, 0.36, 0.17), vec3(0.36, 0.2, 0.1), smoothstep(0.1, 1.0, r));
    crema = mix(crema, vec3(0.74, 0.48, 0.26), n * 0.35);
    // while milk goes in, the crema lightens toward latte brown
    crema = mix(crema, vec3(0.76, 0.56, 0.38), uFill * 0.55);
    vec2 d0 = uv - uPourAt;
    float dp = length(d0);
    crema = mix(crema, vec3(0.86, 0.7, 0.54), smoothstep(0.32, 0.0, dp) * uPour * 0.65);
    float rings = sin(dp * 46.0 - uTime * 9.0) * exp(-dp * 4.5) * uPour;
    crema *= 1.0 + rings * 0.05;

    // milk art: a round blob that morphs into a heart, then the pull-through tail
    vec2 hc = uv - vec2(0.0, 0.06);
    float ang = atan(hc.y, hc.x);
    float wob = (sin(ang * 7.0 + uTime * 1.3) * 0.012 + (noise(hc * 6.0 + uTime * 0.2) - 0.5) * 0.03);
    float dC = length(hc) - mix(0.0, 0.5, uBlob) + wob * (1.0 - 0.6 * uHeart);
    float s = 0.86;
    vec2 hp = vec2(hc.x, hc.y + 0.5 * s) / s;      // heart sdf space, point at the bottom
    float dH = sdHeart(hp) * s + wob * 0.4;
    float d = mix(dC, dH, uHeart);
    // the tail the pitcher draws as it lifts away
    float tail = max(abs(uv.x) - mix(0.004, 0.02, smoothstep(-0.78, -0.4, uv.y)), max(-0.78 - uv.y, uv.y + 0.38));
    d = min(d, mix(1.0, tail, uTail));
    float milk = 1.0 - smoothstep(-0.006, 0.008, d);
    float halo = smoothstep(0.07, 0.0, d) * (1.0 - milk);
    vec3 milkC = vec3(0.995, 0.975, 0.94) - noise(uv * 30.0) * 0.025;
    vec3 col = mix(crema, vec3(0.83, 0.67, 0.5), halo * 0.75);
    col = mix(col, milkC, milk * step(0.001, uBlob));

    // meniscus and a soft window highlight
    col *= mix(1.0, 0.78, smoothstep(0.82, 1.0, r));
    col += smoothstep(0.985, 0.93, r) * smoothstep(0.88, 0.95, r) * 0.08;
    float hl = smoothstep(0.42, 0.0, length((uv - vec2(-0.38, 0.42)) * vec2(1.0, 1.9)));
    col += hl * 0.06;
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

const STREAM_VERT = /* glsl */ `
  uniform vec3 uP0, uP1, uP2;
  uniform float uR0, uR1, uTime, uThin;
  varying float vT;
  varying vec3 vN, vView;
  vec3 bez(float t) { float a = 1.0 - t; return a * a * uP0 + 2.0 * a * t * uP1 + t * t * uP2; }
  void main() {
    float t = position.y + 0.5;
    vT = t;
    vec3 c = bez(t);
    vec3 tan = normalize(2.0 * (1.0 - t) * (uP1 - uP0) + 2.0 * t * (uP2 - uP1));
    vec3 side = normalize(cross(tan, vec3(0.0, 0.0, 1.0)));
    vec3 up = normalize(cross(side, tan));
    vec2 ring = normalize(position.xz);
    float rad = mix(uR0, uR1, pow(t, 0.7)) * uThin;
    rad *= 1.0 + sin(t * 38.0 - uTime * 16.0) * 0.07 + sin(t * 13.0 + uTime * 5.0) * 0.05;
    vec3 n = side * ring.x + up * ring.y;
    vec3 p = c + n * rad;
    vN = normalize(normalMatrix * n);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;
const STREAM_FRAG = /* glsl */ `
  precision highp float;
  varying float vT;
  varying vec3 vN, vView;
  uniform float uHead, uTail;
  void main() {
    if (vT > uHead || vT < uTail) discard;
    float f = pow(1.0 - abs(dot(normalize(vN), vView)), 2.0);
    vec3 col = mix(vec3(0.99, 0.975, 0.95), vec3(0.86, 0.82, 0.76), f * 0.8);
    col += pow(max(dot(normalize(vN), normalize(vec3(-0.4, 0.7, 0.6))), 0.0), 18.0) * 0.25;
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

const STEAM_FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime, uAlpha, uSeed;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
  void main() {
    vec2 uv = vUv;
    float x = uv.x - 0.5 + sin(uv.y * 5.0 - uTime * 0.9 + uSeed) * 0.12 * uv.y + (noise(vec2(uv.y * 3.0 - uTime * 0.5, uSeed)) - 0.5) * 0.2;
    float w = mix(0.05, 0.16, uv.y);
    float a = smoothstep(w, 0.0, abs(x)) * smoothstep(0.0, 0.2, uv.y) * smoothstep(1.0, 0.45, uv.y);
    a *= 0.55 + 0.45 * noise(vec2(x * 8.0, uv.y * 4.0 - uTime * 0.8));
    gl_FragColor = vec4(1.0, 1.0, 1.0, a * uAlpha * 0.5);
  }
`;
const BASIC_VERT = /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

export function startIntro({ canvas }: { canvas: HTMLCanvasElement }) {
  const capture = new URLSearchParams(location.search).has('capture');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: capture });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 60);

  scene.add(new THREE.HemisphereLight(0xfffaf0, 0xe8dccb, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(-3, 6, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffe7cf, 0.7); rim.position.set(4, 3, -3); scene.add(rim);

  /* cup */
  const cup = new THREE.Group(); scene.add(cup);
  const outerPts = Array.from({ length: 24 }, (_, i) => { const y = 0.02 + (H - 0.02) * (i / 23); return new THREE.Vector2(mix(RB, RT, y / H), y); });
  const outer = new THREE.Mesh(new THREE.LatheGeometry(outerPts, 128, Math.PI, Math.PI * 2),
    new THREE.MeshStandardMaterial({ map: cupTexture(), roughness: 0.82, metalness: 0, envMapIntensity: 0.5 }));
  cup.add(outer);
  // redraw the print once the brush font has arrived
  Promise.all([document.fonts.load('330px "Caveat Brush"'), document.fonts.load('600 46px "Manrope Variable"')]).then(() => {
    const mat = outer.material as THREE.MeshStandardMaterial; mat.map?.dispose(); mat.map = cupTexture(); mat.needsUpdate = true; if (!running) render();
  }).catch(() => {});
  const innerPts = Array.from({ length: 12 }, (_, i) => { const y = BASE + (H - BASE) * (i / 11); return new THREE.Vector2(innerR(y), y); });
  const inner = new THREE.Mesh(new THREE.LatheGeometry(innerPts, 96), new THREE.MeshStandardMaterial({ color: 0xf4ece0, roughness: 0.9, side: THREE.BackSide }));
  cup.add(inner);
  const rimM = new THREE.Mesh(new THREE.TorusGeometry(RT - WALL / 2, 0.028, 16, 128), new THREE.MeshStandardMaterial({ color: 0xfffcf6, roughness: 0.7 }));
  rimM.rotation.x = Math.PI / 2; rimM.position.y = H; cup.add(rimM);
  const bottom = new THREE.Mesh(new THREE.CircleGeometry(RB, 64), new THREE.MeshStandardMaterial({ color: 0xf2ebe0, roughness: 0.9 }));
  bottom.rotation.x = Math.PI / 2; bottom.position.y = 0.02; cup.add(bottom);

  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.set(0.25, 0.001, -0.1); scene.add(shadow);

  /* liquid surface */
  const surfU = { uTime: { value: 0 }, uFill: { value: 0 }, uPour: { value: 0 }, uBlob: { value: 0 }, uHeart: { value: 0 }, uTail: { value: 0 }, uPourAt: { value: new THREE.Vector2(0.25, 0.2) } };
  const surface = new THREE.Mesh(new THREE.CircleGeometry(1, 96), new THREE.ShaderMaterial({ uniforms: surfU, vertexShader: BASIC_VERT, fragmentShader: SURFACE_FRAG }));
  surface.rotation.x = -Math.PI / 2; cup.add(surface);

  /* pitcher */
  const pitcher = new THREE.Group(); scene.add(pitcher);
  const body = new THREE.Group(); pitcher.add(body);
  const pp = [[0.001, 0], [0.4, 0], [0.43, 0.04], [0.45, 0.5], [0.4, 0.92], [0.37, 1.02], [0.41, 1.12], [0.45, 1.16]].map(([x, y]) => new THREE.Vector2(x, y));
  const steel = new THREE.MeshStandardMaterial({ color: 0xd9d6d0, metalness: 1, roughness: 0.22, side: THREE.DoubleSide });
  const pitcherBody = new THREE.Mesh(new THREE.LatheGeometry(pp, 64), steel);
  body.add(pitcherBody);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.035, 12, 40, Math.PI * 1.1), steel);
  handle.position.set(-0.44, 0.58, 0); handle.rotation.z = Math.PI / 2 + 0.05; body.add(handle);
  // body pivots around its spout (rim at +x)
  body.position.set(-0.45, -1.16, 0);
  pitcher.scale.setScalar(0.78);

  /* milk stream */
  const streamU = { uP0: { value: v3(0, 3, 0) }, uP1: { value: v3(0, 2.5, 0) }, uP2: { value: v3(0, 1.5, 0) }, uR0: { value: 0.045 }, uR1: { value: 0.026 }, uTime: { value: 0 }, uThin: { value: 1 }, uHead: { value: 0 }, uTail: { value: 0 } };
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 16, 48, true), new THREE.ShaderMaterial({ uniforms: streamU, vertexShader: STREAM_VERT, fragmentShader: STREAM_FRAG, side: THREE.DoubleSide }));
  stream.frustumCulled = false; scene.add(stream);

  /* steam */
  const steam: THREE.Mesh[] = [0, 1, 2].map((i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.5), new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 }, uAlpha: { value: 0 }, uSeed: { value: i * 2.7 } }, vertexShader: BASIC_VERT, fragmentShader: STEAM_FRAG, transparent: true, depthWrite: false }));
    m.position.set((i - 1) * 0.28, H + 0.72, (i - 1) * 0.12); scene.add(m); return m;
  });

  /* camera path: [p, position, target] */
  const keys: [number, THREE.Vector3, THREE.Vector3][] = [
    [0.0, v3(0, 2.2, 7.8), v3(0, 1.55, 0)],
    [0.2, v3(1.0, 3.1, 6.4), v3(0.1, 1.5, 0)],
    [0.48, v3(-0.6, 3.6, 4.6), v3(0.05, 1.45, 0)],
    [0.7, v3(0, 6.2, 1.25), v3(0, 1.7, 0)],
    [0.8, v3(0, 5.2, 0.7), v3(0, 1.72, 0)],
    [1.0, v3(0, LEVEL1 + 0.22, 0.12), v3(0, LEVEL1, 0)],
  ];
  const camPos = v3(0, 0, 0), camTar = v3(0, 0, 0);
  function cameraAt(p: number, aspect: number) {
    let k = 0; while (k < keys.length - 2 && p > keys[k + 1][0]) k++;
    const [p0, a0, t0] = keys[k], [p1, a1, t1] = keys[k + 1];
    const t = sm(p0, p1, p);
    camPos.lerpVectors(a0, a1, t); camTar.lerpVectors(t0, t1, t);
    // portrait screens: pull back while the whole cup is in frame
    const pull = aspect < 1 ? mix(1, Math.min(1.5, 0.82 / aspect), 1 - sm(0.62, 0.9, p)) : 1;
    camPos.sub(camTar).multiplyScalar(pull).add(camTar);
    camera.position.copy(camPos); camera.lookAt(camTar);
  }

  /* the choreography */
  const P0 = v3(0, 0, 0), P1 = v3(0, 0, 0), P2 = v3(0, 0, 0), spout = v3(0, 0, 0);
  let progress = 0, time = 0;
  function pose(p: number) {
    const fill = sm(0.12, 0.58, p);
    const level = mix(LEVEL0, LEVEL1, fill);
    const rr = innerR(level) - 0.004;
    surface.position.y = level; surface.scale.setScalar(rr);

    // pitcher: arrives, tilts, pours from the back edge toward the middle, then drags forward and lifts
    const arrive = sm(0.04, 0.16, p), leave = sm(0.62, 0.76, p);
    const drag = sm(0.48, 0.6, p);
    const tilt = mix(0.2, 1.45, sm(0.08, 0.2, p)) + 0.35 * sm(0.3, 0.5, p) - 1.4 * leave;
    const hx = mix(0.42, 0.06, sm(0.14, 0.45, p)) - 0.03 * drag;
    const hz = mix(-0.12, 0.0, sm(0.14, 0.45, p)) + 0.34 * drag;
    const hy = H + mix(0.95, 0.42, sm(0.2, 0.5, p)) + 0.18 * drag + 1.6 * leave;
    pitcher.position.set(mix(3.2, hx, arrive) + 2.4 * leave, mix(4.4, hy, arrive), hz);
    pitcher.rotation.set(0, 0, tilt);
    pitcher.visible = arrive > 0.001 && leave < 0.999;
    body.updateMatrixWorld(true);
    pitcher.updateMatrixWorld(true);
    spout.set(0.45, 1.16, 0); pitcherBody.localToWorld(spout);

    // stream from the spout down to the surface
    const on = sm(0.15, 0.19, p) * (1 - sm(0.59, 0.63, p));
    const landX = mix(0.18, 0.0, sm(0.18, 0.46, p)), landZ = mix(-0.12, 0.06, sm(0.18, 0.46, p)) + 0.3 * drag;
    P0.copy(spout); P2.set(landX, level, landZ);
    P1.set(mix(P0.x, P2.x, 0.15) + 0.06, mix(P0.y, P2.y, 0.45), mix(P0.z, P2.z, 0.2));
    streamU.uP0.value.copy(P0); streamU.uP1.value.copy(P1); streamU.uP2.value.copy(P2);
    streamU.uHead.value = sm(0.15, 0.2, p) * 1.01;
    streamU.uTail.value = sm(0.59, 0.64, p) * 1.01;
    streamU.uThin.value = mix(1, 0.45, drag) * (0.4 + 0.6 * on);
    stream.visible = on > 0.001 || (p > 0.15 && p < 0.64);

    surfU.uFill.value = fill;
    surfU.uPour.value = on * (1 - sm(0.4, 0.5, p) * 0.5);
    surfU.uPourAt.value.set(landX / rr, -landZ / rr);
    surfU.uBlob.value = sm(0.36, 0.5, p);
    surfU.uHeart.value = sm(0.5, 0.6, p);
    surfU.uTail.value = sm(0.56, 0.62, p);

    cup.rotation.y = -0.18 + 0.12 * Math.sin(time * 0.35) * (1 - sm(0.1, 0.3, p));
    const sa = (1 - sm(0.05, 0.16, p)) + sm(0.64, 0.72, p) * (1 - sm(0.8, 0.88, p)) * 0.8;
    steam.forEach((m, i) => { const mat = m.material as THREE.ShaderMaterial; mat.uniforms.uAlpha.value = sa; mat.uniforms.uTime.value = time + i; m.position.y = level + 0.8 + (H - level) * 0.4; m.lookAt(camera.position.x, m.position.y, camera.position.z); m.visible = sa > 0.01; });
  }

  let w = 0, h = 0;
  function resize() {
    const cw = canvas.clientWidth || innerWidth, ch = canvas.clientHeight || innerHeight;
    if (cw === w && ch === h) return;
    w = cw; h = ch;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, capture ? 2 : 1.75));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = camera.aspect < 1 ? 36 : 30;
    camera.updateProjectionMatrix();
  }

  function render() {
    resize();
    surfU.uTime.value = time; streamU.uTime.value = time;
    cameraAt(progress, camera.aspect);
    pose(progress);
    renderer.render(scene, camera);
  }

  let raf = 0, running = false, last = 0;
  const loop = (now: number) => {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    time += dt;
    if (progress < 0.985) render();
  };

  const api = {
    start() { resize(); render(); if (!capture) api.play(); },
    play() { if (running || capture) return; running = true; last = 0; raf = requestAnimationFrame(loop); },
    pause() { running = false; cancelAnimationFrame(raf); },
    setProgress(p: number) { progress = clamp(p); if (!running) render(); },
  };
  if (capture) (window as any).__laitIntro = { step(p: number, dt = 1 / 30) { time += dt; progress = clamp(p); render(); }, ready: true };
  addEventListener('resize', () => { if (!running) render(); });
  return api;
}

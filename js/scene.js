// Qura landing — one persistent 3D scene.
//
// Scene 0  Hero: three woven glass rings (clinicians, providers, suppliers), or the beating
//          heart variant (HERO_SHAPE), with 3D-orbiting cards (DOM, projected).
//   ↓      On scroll the shape dissolves into particles.
// Scene 1  Ecosystem: the particles form a network sphere.
// Scene 2  Fragmented: the sphere bursts, glass fragment cards fly out,
//          then the particles spread off-screen (state.fragExit) leaving only cards.
// Scene 3   No particles. The cards fly into the verified profile card.
// Scene 4–5 The night (4) and morning (5) glass panels float beside the copy,
//           and the page background shifts colour per scene.
// Scene 6–7 Plain DOM scenes (film, community cards). The offer banner sits between 3 and 4.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const R = Math.random;
const gauss = () => { let u = 0, v = 0; while (!u) u = R(); while (!v) v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const onSphere = (r) => { const u = R() * 2 - 1, t = R() * Math.PI * 2, s = Math.sqrt(1 - u * u); return [r * s * Math.cos(t), r * u, r * s * Math.sin(t)]; };
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const DEG = Math.PI / 180;
const latLon = (lat, lon, r) => {
  const phi = (90 - lat) * DEG, th = (lon + 180) * DEG;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
};
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const bump = (s, k, w = 1.4) => { const x = clamp(1 - Math.abs(s - k) * w, 0, 1); return x * x * (3 - 2 * x); };

const C = {
  teal: [0.0, 0.64, 0.61], tealLt: [0.36, 0.8, 0.76], sky: [0.24, 0.5, 0.88],
  slate: [0.58, 0.65, 0.75], slateDk: [0.4, 0.47, 0.58], skyLt: [0.55, 0.72, 0.96],
};

const Y0 = 2.6;                       // height of the "action" above the floor
const BLOB_X = 3.0, BLOB_R = 1.9, ORBIT_R = 3.15;
const HERO_SHAPE = 'rings';           // 'rings' (three linked communities) or 'heart' (beating heart + ECG)

// per-scene parameters (index = scene number)
const S = {
  camY:  [Y0, Y0, 3.4, 3.1, 3.4, 3.4, 3.5, 3.5],
  camZ:  [13.6, 13.0, 14.6, 13, 13.6, 13.6, 13.5, 13.5],
  lookY: [Y0, Y0, 2.2, 2.8, 3.4, 3.4, 2.7, 2.7],
  panX:  [0, 0, 0, 3.6, -3.9, 3.9, 0, 0],   // where the floating scene panels sit
  panRY: [0, 0, 0, -0.35, 0.22, -0.22, 0, 0],
  bg:    ['#f7fafc', '#f7fafc', '#e4e9f1', '#e8f7f4', '#0e1b33', '#fff1e6', '#eef3f9', '#f7fafc'],
};
const LAST = S.camY.length - 1;
// particles only live in scenes 0–2
const PX = [BLOB_X, 3.5, 0], PSIZE = [1, 0.62, 1], PSPIN = [0.4, 0.75, 0.12], PCHAOS = [0.02, 0.06, 0.14];

const NOISE = /* glsl */`
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;


// Three woven rings, atom-style: three long ellipses turned 0°, 60° and 120° in one plane, each rising
// and dipping (z = h·sin 4u) so they weave over and under one another without touching.
function ringGeometries(a, b, tube, h = 0.28) {
  return [0, 1, 2].map((k) => {
    const th = k * Math.PI / 3, c = Math.cos(th), s = Math.sin(th), pts = [];
    for (let i = 0; i < 200; i++) {
      const u = (i / 200) * Math.PI * 2, x = a * Math.cos(u), y = b * Math.sin(u);
      pts.push(new THREE.Vector3(x * c - y * s, x * s + y * c, h * Math.sin(4 * u)));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 400, tube, 40, true);
  });
}

// A puffy heart: an extruded heart outline with a deep, many-step bevel so it reads as blown glass.
function heartGeometry(height) {
  const sh = new THREE.Shape();
  sh.moveTo(5, 5);
  sh.bezierCurveTo(5, 5, 4, 0, 0, 0);
  sh.bezierCurveTo(-6, 0, -6, 7, -6, 7);
  sh.bezierCurveTo(-6, 11, -3, 15.4, 5, 19);
  sh.bezierCurveTo(12, 15.4, 16, 11, 16, 7);
  sh.bezierCurveTo(16, 7, 16, 0, 10, 0);
  sh.bezierCurveTo(7, 0, 5, 5, 5, 5);
  const g = new THREE.ExtrudeGeometry(sh, { depth: 1.5, bevelEnabled: true, bevelThickness: 4.2, bevelSize: 3.2, bevelSegments: 20, curveSegments: 64 });
  g.rotateZ(Math.PI);                 // the outline is drawn point-down in screen space
  g.center();
  g.computeBoundingBox();
  const k = height / (g.boundingBox.max.y - g.boundingBox.min.y);
  g.scale(k, k, k * 0.9);
  g.computeVertexNormals();
  return g;
}

// ECG trace (flat → P → QRS spike → T → flat), as a straight-segment path in the x/y plane.
const ECG_R = 0.5;                    // where the big R spike sits along the trace (0..1)
function ecgPath(w, amp, z) {
  const pts = [[-0.5, 0], [-0.17, 0], [-0.13, 0.12], [-0.09, 0], [-0.03, 0], [-0.01, -0.18], [0, 1], [0.015, -0.42], [0.035, 0], [0.1, 0], [0.15, 0.22], [0.2, 0], [0.5, 0]];
  const path = new THREE.CurvePath();
  for (let k = 0; k < pts.length - 1; k++) {
    const a = pts[k], b = pts[k + 1];
    path.add(new THREE.LineCurve3(new THREE.Vector3(a[0] * w, a[1] * amp, z), new THREE.Vector3(b[0] * w, b[1] * amp, z)));
  }
  return path;
}

export function initScene({ canvas, cssRoot, orbitCards = [], chips = [], colLabels = [], panels = [], pings = [], mobile = false, reduced = false }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  const PR = Math.min(window.devicePixelRatio || 1, 1.75);
  renderer.setPixelRatio(PR);
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  const css = new CSS3DRenderer({ element: cssRoot });
  css.setSize(innerWidth, innerHeight);

  const scene = new THREE.Scene();
  const cssScene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 200);
  camera.position.set(0, Y0, 13.6);

  const state = { target: 0, intro: 0, hero: 0, fragExit: 0, frag: 0, fragOut: 0 };   // frag: progress through the pinned problem → fix sequence
  const mouse = { x: 0, y: 0 };
  addEventListener('pointermove', (e) => { mouse.x = e.clientX / innerWidth - 0.5; mouse.y = e.clientY / innerHeight - 0.5; }, { passive: true });

  // ================= HERO: the Qura core =================
  const hero = new THREE.Group(); scene.add(hero);
  const blobU = { uTime: { value: 0 }, uDissolve: { value: 0 }, uAlpha: { value: 0 }, uAmp: { value: 1 }, uMouse: { value: new THREE.Vector2() } };
  const heroMat = (tint, tintK, liquidK = 0, phase = 0) => new THREE.ShaderMaterial({
      uniforms: { ...blobU, uTint: { value: new THREE.Color(tint) }, uTintK: { value: tintK }, uLiquid: { value: liquidK }, uPhase: { value: phase } }, transparent: true, toneMapped: false,
      vertexShader: NOISE + /* glsl */`
        uniform float uTime, uAmp, uLiquid, uPhase; uniform vec2 uMouse;
        varying vec3 vNormal, vView, vObj; varying float vN;
        // liquid surface: slow noise ripples plus swells that travel round each ring
        float liquid(vec3 p, float along){
          float f = snoise(p * 1.25 + vec3(0., uTime * .35, uTime * .22)) * .55
                  + snoise(p * 2.9 - vec3(uTime * .45, 0., uTime * .3)) * .25;
          float swell = pow(.5 + .5 * sin(6.2831 * (along * 2. - uTime * .22 + uPhase)), 3.);
          return f * .025 + swell * .035;
        }
        void main(){
          vec3 n = normalize(position + vec3(.0001));
          vN = (snoise(n*1.1 + vec3(uTime*.18, uTime*.12, 0.)) * .17
              + snoise(n*2.6 - vec3(0., uTime*.3, uTime*.2)) * .05
              + dot(normal.xy, uMouse) * .12) * uAmp;      // drifting colour
          vec3 p = position, nrm = normal;
          if (uLiquid > 0.) {
            float h = liquid(position, uv.x);
            float e = .03;                                   // bend the normal with the surface so light flows over the ripples
            vec3 g = vec3(liquid(position + vec3(e,0.,0.), uv.x) - h, liquid(position + vec3(0.,e,0.), uv.x) - h, liquid(position + vec3(0.,0.,e), uv.x) - h) / e;
            p += normal * h * uLiquid;
            nrm = normalize(normal - (g - dot(g, normal) * normal) * uLiquid * .9);
          }
          vObj = position;
          vNormal = normalize(normalMatrix * nrm);
          vec4 mv = modelViewMatrix * vec4(p, 1.);
          vView = -mv.xyz;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: NOISE + /* glsl */`
        uniform float uDissolve, uAlpha, uTime, uTintK; uniform vec3 uTint;
        varying vec3 vNormal, vView, vObj; varying float vN;
        void main(){
          vec3 N = normalize(vNormal), V = normalize(vView);
          vec3 L = normalize(vec3(-.55, .75, .7));
          float fres = pow(1. - max(dot(N, V), 0.), 2.4);
          float diff = dot(N, L) * .5 + .5;
          vec3 pearl = mix(vec3(.72, .86, .91), vec3(.96, .99, 1.), diff);
          vec3 grad = mix(vec3(0., .70, .66), vec3(.38, .60, .98), smoothstep(-1., 1., N.y + N.x * .6));
          grad = mix(grad, uTint, uTintK);
          vec3 col = mix(pearl, grad, clamp(.42 + vN * 2.2, 0., .9));
          vec3 irid = .5 + .5 * cos(6.2831 * (fres * 1.1 + vN * 2.5 + vec3(0., .33, .67)));
          col = mix(col, col * (.75 + .5 * irid), fres * .5);
          col += vec3(0., .55, .52) * fres * .35;
          col += pow(max(dot(reflect(-L, N), V), 0.), 48.) * .5;    // crisp glass highlight
          col += pow(max(dot(reflect(-normalize(vec3(.7,-.3,.6)), N), V), 0.), 12.) * .12 * vec3(.6,.8,1.);
          if (uDissolve > 0.001) {
            float d = snoise(vObj * 1.6) * .5 + .5;
            float th = uDissolve * 1.15 - .05;
            if (d < th) discard;
            col = mix(vec3(0., .76, .72), col, smoothstep(th, th + .07, d));
          }
          gl_FragColor = vec4(col, uAlpha);
        }`,
    });
  const blob = new THREE.Group();
  let heroGeo;
  if (HERO_SHAPE === 'heart') {
    heroGeo = heartGeometry(BLOB_R * 2.05);
    blob.add(new THREE.Mesh(heroGeo, heroMat('#00a39b', 0)));
  } else {
    const rings = ringGeometries(BLOB_R * 1.13, BLOB_R * 0.43, 0.125);
    const tints = ['#00a39b', '#3d7fe0', '#1b8fb0'];          // clinicians · providers · suppliers
    rings.forEach((g, k) => blob.add(new THREE.Mesh(g, heroMat(tints[k], 0.42, 0, k / 3))));   // rigid glass (set the 3rd arg to 1 for the liquid look)
    heroGeo = mergeGeometries(rings);
  }
  hero.add(blob);

  const shadowTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(16,29,56,0.28)'); g.addColorStop(0.6, 'rgba(16,29,56,0.08)'); g.addColorStop(1, 'rgba(16,29,56,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();
  const blobShadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0, toneMapped: false });
  const blobShadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), blobShadowMat);
  blobShadow.scale.set(4.6, 0.9, 1); blobShadow.position.set(0, -BLOB_R - 0.9, -0.5);
  hero.add(blobShadow);

  const orbitTilt = new THREE.Euler(1.2, 0, -0.22);
  const orbit = new THREE.Group(); orbit.rotation.copy(orbitTilt); hero.add(orbit);
  const ringMats = [];
  [[ORBIT_R, 0x8fa6c2], [ORBIT_R * 0.78, 0x00a39b], [ORBIT_R * 1.22, 0x8fa6c2]].forEach(([r, c], k) => {
    const pts = new THREE.EllipseCurve(0, 0, r, r).getPoints(160).map((p) => new THREE.Vector3(p.x, 0, p.y));
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    const m = k === 0
      ? new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: 0, toneMapped: false })
      : new THREE.LineDashedMaterial({ color: c, transparent: true, opacity: 0, dashSize: 0.08, gapSize: 0.12, toneMapped: false });
    const line = new THREE.LineLoop(g, m);
    if (k) line.computeLineDistances();
    orbit.add(line); ringMats.push(m);
  });
  const sats = [];
  for (let k = 0; k < 5; k++) {
    const m = new THREE.MeshBasicMaterial({ color: k % 2 ? 0x3d7fe0 : 0x00a39b, transparent: true, opacity: 0, toneMapped: false });
    const s = new THREE.Mesh(new THREE.SphereGeometry(k % 2 ? 0.05 : 0.07, 16, 16), m);
    s.userData = { r: k % 2 ? ORBIT_R * 0.78 : ORBIT_R * 1.22, a: R() * 6.28, sp: 0.25 + R() * 0.3 };
    orbit.add(s); sats.push(s);
  }

  // ECG line: a travelling bright head with a fading trail; the heart beats as the head crosses the spike
  const ecgU = { uHead: { value: 0 }, uAlpha: { value: 0 } };
  const ecgMat = (glow) => new THREE.ShaderMaterial({
    uniforms: ecgU, transparent: true, depthWrite: false, toneMapped: false,
    vertexShader: /* glsl */`varying float vT; void main(){ vT = uv.x; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: /* glsl */`
      uniform float uHead, uAlpha; varying float vT;
      void main(){
        float d = uHead - vT; if (d < 0.) d += 1.;               // distance behind the head
        float trail = exp(-d * 5.);
        float edge = smoothstep(0., .06, vT) * smoothstep(1., .94, vT);
        vec3 col = mix(vec3(.24,.5,.88), vec3(0.,.64,.61), trail);
        float a = (${glow ? '.28' : '1.'} * trail + ${glow ? '0.' : '.1'}) * edge * uAlpha;
        gl_FragColor = vec4(col, a);
      }`,
  });
  const ecgCurve = ecgPath(BLOB_R * 3.9, BLOB_R * 0.62, BLOB_R * 0.95);
  const ecg = new THREE.Group();
  ecg.add(new THREE.Mesh(new THREE.TubeGeometry(ecgCurve, 600, 0.028, 8, false), ecgMat(false)));
  ecg.add(new THREE.Mesh(new THREE.TubeGeometry(ecgCurve, 600, 0.085, 8, false), ecgMat(true)));
  ecg.position.y = -0.05;
  if (HERO_SHAPE === 'heart') hero.add(ecg);
  const heroRot = new THREE.Euler();

  // ================= PARTICLES (scenes 0–2 only) =================
  const N = mobile ? 4500 : 9000;
  const build = (fn) => {
    const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { const [p, c] = fn(i); pos.set(p, i * 3); col.set(c, i * 3); }
    return { pos, col };
  };
  const F = [];
  const heartSampler = new MeshSurfaceSampler(new THREE.Mesh(heroGeo.index ? heroGeo.toNonIndexed() : heroGeo)).build();
  const hp = new THREE.Vector3();
  F.push(build(() => { heartSampler.sample(hp); return [[hp.x, hp.y, hp.z], mix(C.teal, C.sky, R() * 0.6)]; }));  // hero shape's surface
  const RG = 2.7;                                                                                               // dotted globe
  F.push(build(() => {
    const k = R(); let lat, lon;
    if (k < 0.42) { lat = -80 + 20 * Math.floor(R() * 9); lon = R() * 360 - 180; }
    else if (k < 0.84) { lon = -180 + 20 * Math.floor(R() * 18); lat = R() * 170 - 85; }
    else { lat = Math.asin(R() * 2 - 1) / DEG; lon = R() * 360 - 180; }
    const v = latLon(lat, lon, RG * (k < 0.84 ? 1 : 0.995));
    return [[v.x, v.y, v.z], k < 0.84 ? mix(C.sky, C.teal, R() * 0.55) : mix(C.slate, C.skyLt, R())];
  }));
  F.push(build(() => [[(R() - 0.5) * 20, (R() - 0.5) * 9, (R() - 0.5) * 8 - 1], mix(C.slate, C.slateDk, R())])); // fragments
  const MAXP = F.length - 1;

  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(F[0].pos), col = new Float32Array(F[0].col), rnd = new Float32Array(N);
  for (let i = 0; i < N; i++) rnd[i] = R();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aRand', new THREE.BufferAttribute(rnd, 1));
  const BASE = mobile ? 62 : 56;
  const U = { uTime: { value: 0 }, uSize: { value: BASE }, uPR: { value: PR }, uChaos: { value: 0 }, uOpacity: { value: 0 }, uBurst: { value: 0 }, uExit: { value: 0 }, uClear: { value: 0 } };
  const points = new THREE.Points(geo, new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      attribute vec3 color; attribute float aRand;
      uniform float uTime, uSize, uPR, uChaos, uBurst, uExit, uClear;
      varying vec3 vColor; varying float vTw; varying float vFade;
      void main(){
        vec3 p = position; float t = uTime;
        vec3 dir = normalize(p + vec3(.0001, .0002, .0003));
        p += dir * uBurst * (.4 + aRand * 1.4);
        p += dir * uExit * uExit * (10. + aRand * 16.);           // fly off-screen
        p += vec3(sin(t*.31 + aRand*40.), cos(t*.27 + aRand*31.), sin(t*.23 + aRand*23.)) * (uChaos*.65 + .02);
        vec4 mv = modelViewMatrix * vec4(p, 1.);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * uPR * (.5 + aRand*.8) / -mv.z;
        vColor = color; vTw = .7 + .3*sin(t*2.2 + aRand*80.);
        vec2 ndc = gl_Position.xy / gl_Position.w;
        float e = length((ndc - vec2(0., -.06)) / vec2(.62, .5));          // ellipse around the headline
        vFade = mix(1., .04 + .96 * smoothstep(.72, 1.15, e), uClear);
      }`,
    fragmentShader: /* glsl */`
      uniform float uOpacity; varying vec3 vColor; varying float vTw; varying float vFade;
      void main(){
        float d = length(gl_PointCoord - .5);
        gl_FragColor = vec4(vColor, smoothstep(.5, .32, d) * vTw * vFade * uOpacity);
      }`,
  }));
  points.frustumCulled = false;
  const pg = new THREE.Group(); pg.add(points); scene.add(pg);

  // globe effects (scene 1): crisp graticule, glowing arcs from London, market markers
  const globeFx = new THREE.Group(); points.add(globeFx);
  const gratMat = new THREE.LineBasicMaterial({ color: 0x1b8fb0, transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
  const grat = [];
  for (let lat = -60; lat <= 60; lat += 20) {
    const pts = []; for (let lo = -180; lo <= 180; lo += 4) pts.push(latLon(lat, lo, RG * 1.002));
    grat.push(new THREE.BufferGeometry().setFromPoints(pts));
  }
  for (let lo = -180; lo < 180; lo += 20) {
    const pts = []; for (let la = -88; la <= 88; la += 4) pts.push(latLon(la, lo, RG * 1.002));
    grat.push(new THREE.BufferGeometry().setFromPoints(pts));
  }
  grat.forEach((g) => globeFx.add(new THREE.Line(g, gratMat)));

  const MARKETS = pings.map((el) => ({ el, lat: +el.dataset.lat, lon: +el.dataset.lon }));
  const markerMats = [], ripples = [], arcs = [];
  const hub = MARKETS.findIndex((m) => m.el.dataset.hub !== undefined);
  MARKETS.forEach((m, k) => {
    m.pos = latLon(m.lat, m.lon, RG * 1.01);
    m.normal = m.pos.clone().normalize();
    const mm = new THREE.MeshBasicMaterial({ color: k === hub ? 0x101d38 : 0x00a39b, transparent: true, opacity: 0, toneMapped: false });
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), mm); dot.position.copy(m.pos); globeFx.add(dot); markerMats.push(mm);
    const rm = new THREE.MeshBasicMaterial({ color: 0x00c2b8, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, toneMapped: false });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.09, 0.12, 40), rm);
    ring.position.copy(m.pos); ring.lookAt(m.pos.clone().multiplyScalar(2)); globeFx.add(ring); ripples.push(ring);
  });
  if (hub >= 0) MARKETS.forEach((m, k) => {
    if (k === hub) return;
    const a = MARKETS[hub].pos, b = m.pos, mid = a.clone().add(b).multiplyScalar(0.5);
    mid.setLength(RG + a.distanceTo(b) * 0.42);
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const coreM = new THREE.MeshBasicMaterial({ color: 0x3d7fe0, transparent: true, opacity: 0, toneMapped: false, depthWrite: false });
    const glowM = new THREE.MeshBasicMaterial({ color: 0x00c2b8, transparent: true, opacity: 0, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending });
    const geoC = new THREE.TubeGeometry(curve, 96, 0.022, 8), geoG = new THREE.TubeGeometry(curve, 96, 0.06, 8);
    const tube = new THREE.Mesh(geoC, coreM), glowT = new THREE.Mesh(geoG, glowM);
    const spark = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), new THREE.MeshBasicMaterial({ color: 0xe9fffd, transparent: true, opacity: 0, toneMapped: false }));
    globeFx.add(tube, glowT, spark);
    arcs.push({ curve, coreM, glowM, tube, glowT, spark, idx: geoC.index.count, k });
  });


  // ================= CSS3D: fragments + scene panels =================
  const cssStage = new THREE.Group(); cssScene.add(cssStage);   // frame of the floating scene panels
  const cssWorld = new THREE.Group(); cssScene.add(cssWorld);
  const toCss = (el, parent, s = 0.01) => { const o = new CSS3DObject(el); o.scale.setScalar(s); parent.add(o); return o; };
  const chipObjs = chips.map((el, k) => {
    const o = toCss(el, cssWorld, 0.009);
    const a = (k / chips.length) * Math.PI * 2 + 0.3;
    o.userData = {
      jitter: new THREE.Vector3(gauss() * 0.5, gauss() * 0.5, gauss() * 0.3),
      // ellipse around the copy; the lower cards drop further and spread wider so they clear the headline
      to: new THREE.Vector3(Math.cos(a) * (Math.sin(a) < -0.6 ? 7.4 : Math.abs(Math.sin(a)) < 0.6 ? 7.4 : 6.6), Y0 + 0.4 + Math.sin(a) * 2.6 - (Math.sin(a) < -0.6 ? 1.15 : 0), (R() - 0.5) * 1.2),
      // gentle, alternating tilt (readable, still scattered)
      rot: new THREE.Euler((k % 2 ? 1 : -1) * (0.08 + R() * 0.1), (k % 3 - 1) * 0.22, (k % 2 ? -1 : 1) * (0.06 + R() * 0.1)),
      col: +el.dataset.col, row: +el.dataset.row, nurse: el.dataset.key === 'nurse',
      faces: [...el.querySelectorAll('.gc-face')], stamp: el.querySelector('.gc-stamp'), lastSt: -1, lastOp: -1, flipped: false,
    };
    return o;
  });
  const colCount = [0, 0, 0]; chipObjs.forEach((o) => colCount[o.userData.col]++);
  // board slot (act 2/3): three columns, rows centred in each column; on phones a 2 × 4 grid in card order
  const boardPos = (o, k, out) => {
    const u = o.userData;
    if (mob) return out.set((k % 2 ? 1.05 : -1.05), 0.7 + 1.6 - Math.floor(k / 2) * 1.05, 0.2);
    const n = colCount[u.col];
    return out.set((u.col - 1) * 4.4 * layoutK, 1.1 + ((n - 1) / 2 - u.row) * 1.38, 0.2);
  };
  const labelObjs = colLabels.map((el) => {
    const o = toCss(el, cssWorld, 0.0125);
    o.userData = { col: +el.dataset.collabel, lastOp: -1, lastMod: -1 };
    return o;
  });
  const bp = new THREE.Vector3();
  const PANEL_S = 0.0132;                              // scene panels: big and readable
  const panelObjs = panels.map((el) => {
    const h = el.offsetHeight || 420;
    const o = toCss(el, cssStage, PANEL_S);
    o.userData = { k: +el.dataset.scene, h: h * PANEL_S };
    return o;
  });

  // ================= Layout + loop =================
  let W = innerWidth, H = innerHeight, layoutK = 1, mob = false, heroX = BLOB_X, heroY = 0, heroK = 1, mobileK = 1;
  const layout = () => {
    W = innerWidth; H = innerHeight; mob = W < 900;
    camera.aspect = W / H; camera.updateProjectionMatrix();
    renderer.setSize(W, H, false); css.setSize(W, H);
    layoutK = mob ? 0 : clamp((W / H) / 1.75, 0.75, 1.1);
    mobileK = mob ? 0.62 : 1; heroK = mob ? 0.75 : 1;
    heroX = mob ? 1.7 : BLOB_X * layoutK; heroY = mob ? 2.9 : 0;
  };
  layout(); addEventListener('resize', layout);

  const bgCols = S.bg.map((h) => new THREE.Color(h));
  const bgNow = new THREE.Color();
  const clock = new THREE.Clock();
  const cv = new THREE.Vector3(), tv = new THREE.Vector3();
  const gatherTo = new THREE.Vector3();
  let sCur = 0, lastS = -1, spin = 0, lastBg = '', cardsVisible = true, pingsShown = true;
  const camDir = new THREE.Vector3(), wpos = new THREE.Vector3(), wnorm = new THREE.Vector3();

  function tick() {
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    const h = state.hero, intro = state.intro;
    sCur += (state.target - sCur) * Math.min(1, dt * (reduced ? 6 : 2.6));
    const s = clamp(sCur, 0, LAST);
    let i = Math.floor(s); if (i >= LAST) i = LAST - 1;
    const f = s - i, e = f * f * (3 - 2 * f);
    const L = (arr) => arr[i] + (arr[i + 1] - arr[i]) * e;
    const panIn = smooth(1.25, 2.0, s);                    // panel frame settles during scene 2

    // background colour journey
    bgNow.copy(bgCols[i]).lerp(bgCols[i + 1], e);
    const hex = '#' + bgNow.getHexString();
    if (hex !== lastBg) { document.body.style.backgroundColor = hex; lastBg = hex; }

    // ---------- hero orb ----------
    const dissolve = smooth(0.2, 0.75, h);
    const blobScale = (0.6 + 0.4 * smooth(0, 1, intro)) * (1 + 0.18 * smooth(0, 0.35, h)) * mobileK * heroK;
    hero.visible = dissolve < 0.999 || s < 0.3;
    hero.position.set(heroX, Y0 + heroY, 0);
    hero.scale.setScalar(blobScale);
    blob.visible = dissolve < 0.999;
    blobU.uTime.value = t * (reduced ? 0.3 : 1);
    blobU.uDissolve.value = dissolve;
    blobU.uAlpha.value = smooth(0, 0.6, intro);
    blobU.uAmp.value = 1 + 0.8 * smooth(0, 0.4, h);
    blobU.uMouse.value.x += (mouse.x * 1.2 - blobU.uMouse.value.x) * Math.min(1, dt * 2);
    blobU.uMouse.value.y += (-mouse.y * 1.2 - blobU.uMouse.value.y) * Math.min(1, dt * 2);
    const head = (t * (reduced ? 0.18 : 0.42)) % 1;                       // ECG head position along the trace
    const ph = (head - ECG_R + 1) % 1;                                    // time since the head crossed the spike
    const beat = Math.exp(-ph * 38) + 0.55 * Math.exp(-Math.max(0, ph - 0.07) * 38) * (ph > 0.07 ? 1 : 0);   // lub-dub
    if (HERO_SHAPE === 'heart') {
      blob.rotation.set(Math.sin(t * 0.27) * 0.06 - mouse.y * 0.15, Math.sin(t * 0.35) * 0.32 + mouse.x * 0.3, 0);
      blob.scale.setScalar(1 + 0.055 * beat * (1 - dissolve));
    } else {
      const sp = reduced ? 0.25 : 1;                                       // rings tumble slowly, as one
      blob.rotation.set(Math.sin(t * 0.3 * sp) * 0.16 - mouse.y * 0.2, Math.sin(t * 0.24 * sp) * 0.22 + mouse.x * 0.3, t * 0.1 * sp);   // faces you, sways, turns in its own plane
    }
    heroRot.copy(blob.rotation);
    const ringA = smooth(0, 1, intro) * (1 - smooth(0, 0.35, h));
    blobShadowMat.opacity = smooth(0, 1, intro) * (1 - dissolve);
    ringMats.forEach((m, k) => (m.opacity = (k === 0 ? 0.55 : 0.4) * ringA));
    ecgU.uHead.value = head; ecgU.uAlpha.value = ringA; ecg.visible = HERO_SHAPE === 'heart' && ringA > 0.01;
    orbit.rotation.set(orbitTilt.x + mouse.y * 0.15, mouse.x * 0.25, orbitTilt.z);
    orbit.scale.setScalar(1 + 0.6 * smooth(0, 0.4, h));
    sats.forEach((o) => {
      o.userData.a += dt * o.userData.sp;
      o.position.set(Math.cos(o.userData.a) * o.userData.r, 0, Math.sin(o.userData.a) * o.userData.r);
      o.material.opacity = ringA;
    });

    // orbiting DOM cards (true 3D positions projected to the screen)
    const cardA = smooth(0, 1, intro) * (1 - smooth(0, 0.3, h));
    const showCards = cardA > 0.01 && !mob;
    if (showCards || cardsVisible) {
      hero.updateMatrixWorld(true);
      const n = orbitCards.length;
      orbitCards.forEach((el, k) => {
        if (!showCards) { el.style.opacity = 0; return; }
        const a = t * (reduced ? 0.03 : 0.11) + (k / n) * Math.PI * 2;
        cv.set(Math.cos(a) * ORBIT_R, 0, Math.sin(a) * ORBIT_R).applyMatrix4(orbit.matrixWorld).project(camera);
        const front = (Math.sin(a) + 1) / 2;
        const x = (cv.x + 1) / 2 * W, y = (1 - cv.y) / 2 * H;
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%) scale(${(0.72 + 0.32 * front).toFixed(3)})`;
        el.style.opacity = ((0.25 + 0.75 * front) * cardA).toFixed(3);
        el.style.zIndex = front > 0.5 ? 3 : 1;
        el.style.filter = front < 0.45 ? `blur(${((0.45 - front) * 5).toFixed(1)}px)` : 'none';
      });
      cardsVisible = showCards;
    }

    // ---------- particles (scenes 0–2) ----------
    const ps = Math.min(s, MAXP);
    let pi = Math.floor(ps); if (pi >= MAXP) pi = MAXP - 1;
    const pf = ps - pi, pe = pf * pf * (3 - 2 * pf);
    const PL = (arr) => arr[pi] + (arr[pi + 1] - arr[pi]) * pe;
    const pOp = smooth(0.25, 0.6, h) * (1 - smooth(0.05, 0.95, state.fragExit)) * (1 - smooth(2.3, 2.8, s));
    points.visible = pOp > 0.002;
    if (points.visible) {
      if (Math.abs(ps - lastS) > 1e-4) {
        const A = F[pi], B = F[pi + 1];
        for (let k = 0; k < N; k++) {
          let tt = pf * 1.6 - rnd[k] * 0.6; tt = tt < 0 ? 0 : tt > 1 ? 1 : tt; tt = tt * tt * (3 - 2 * tt);
          const j = k * 3;
          pos[j] = A.pos[j] + (B.pos[j] - A.pos[j]) * tt;
          pos[j + 1] = A.pos[j + 1] + (B.pos[j + 1] - A.pos[j + 1]) * tt;
          pos[j + 2] = A.pos[j + 2] + (B.pos[j + 2] - A.pos[j + 2]) * tt;
          col[j] = A.col[j] + (B.col[j] - A.col[j]) * tt;
          col[j + 1] = A.col[j + 1] + (B.col[j + 1] - A.col[j + 1]) * tt;
          col[j + 2] = A.col[j + 2] + (B.col[j + 2] - A.col[j + 2]) * tt;
        }
        geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
        lastS = ps;
      }
      const sp = PL(PSPIN);
      spin += dt * 0.12 * sp * (reduced ? 0.3 : 1);
      const home = Math.round(spin / (Math.PI * 2)) * Math.PI * 2;
      spin += (home - spin) * (1 - sp) * Math.min(1, dt * 1.6);
      if (pi === 0) pg.rotation.set(heroRot.x + (0.32 - heroRot.x) * pe, heroRot.y + (spin - 1.8 - heroRot.y) * pe, heroRot.z * (1 - pe));   // hero shape's turn →
      else pg.rotation.set(0.32, spin - 1.8, 0);                                                                                        // UK/Europe facing, tilted north
      const onOrb = pi === 0 ? 1 - pe : 0;
      pg.position.set(PL(PX) * layoutK + (heroX - PX[0] * layoutK) * onOrb, Y0 + heroY * onOrb, 0);
      pg.scale.setScalar(mobileK * (1 + (blobScale / mobileK - 1) * onOrb));
      U.uChaos.value = PL(PCHAOS);
      U.uBurst.value = 0.9 * smooth(0.45, 1, h) * onOrb;
      U.uExit.value = state.fragExit;
      U.uClear.value = smooth(1.35, 1.9, s);
      U.uSize.value = BASE * PL(PSIZE);
      U.uTime.value = t;
    }
    U.uOpacity.value = pOp;

    // ---------- globe effects + flag pings (scene 1) ----------
    const gv = Math.max(0, 1 - Math.abs(s - 1) * 3.2) * (points.visible ? 1 : 0);
    globeFx.visible = gv > 0.002;
    gratMat.opacity = 0.55 * gv;
    if (globeFx.visible) {
      markerMats.forEach((m) => (m.opacity = gv));
      ripples.forEach((r, k) => { const p = (t * 0.55 + k * 0.37) % 1; r.scale.setScalar(1 + p * 2.6); r.material.opacity = gv * (1 - p) * 0.9; });
      arcs.forEach((a, n) => {
        const grow = clamp(gv * 1.4 - n * 0.08, 0, 1);
        a.tube.geometry.setDrawRange(0, Math.floor(a.idx * grow / 6) * 6);
        a.glowT.geometry.setDrawRange(0, Math.floor(a.idx * grow / 6) * 6);
        a.coreM.opacity = gv; a.glowM.opacity = 0.5 * gv;
        const u = (t * 0.32 + n * 0.21) % 1;
        a.spark.position.copy(a.curve.getPointAt(u * grow));
        a.spark.material.opacity = gv * (grow > 0.98 ? 1 : 0);
      });
    }
    const showPings = gv > 0.05 && !mob;
    if (showPings || pingsShown) {
      pg.updateMatrixWorld(true);
      camera.getWorldDirection(camDir);
      cv.setFromMatrixPosition(pg.matrixWorld).project(camera);
      const gcx = (cv.x + 1) / 2 * W;
      MARKETS.forEach((m, k) => {
        if (!showPings) { m.el.style.opacity = 0; return; }
        wpos.copy(m.pos).applyMatrix4(points.matrixWorld);
        wnorm.copy(m.normal).transformDirection(points.matrixWorld);
        const facing = clamp((-wnorm.dot(camDir) - 0.15) / 0.5, 0, 1);
        const cyc = (t * 0.11 + k / MARKETS.length) % 1;                  // each ping pops in turn
        const life = smooth(0, 0.05, cyc) * (1 - smooth(0.3, 0.37, cyc));
        cv.copy(wpos).project(camera);
        const x = (cv.x + 1) / 2 * W, y = (1 - cv.y) / 2 * H;
        const pop = 0.85 + 0.15 * smooth(0, 0.05, cyc);
        const flip = x > gcx;                                               // right half of the globe: pill opens to the left
        if (flip !== m.flip) { m.el.classList.toggle('flip', flip); m.flip = flip; }
        m.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(${flip ? 'calc(-100% + 14px)' : '-14px'}, calc(-100% - 10px)) scale(${pop.toFixed(3)})`;
        m.el.style.opacity = (life * facing * gv).toFixed(3);
      });
      pingsShown = showPings;
    }


    // scene 2 cards: burst out of the sphere and scatter (problem stamps land), then fly into a three-column
    // board flipping to their fixed side; after the pin only the nurse's card flies on into the verified profile
    const fp = state.frag;
    const spread = smooth(1.05, 1.9, s), gather = smooth(2.2, 2.9, s);
    const leave = state.fragOut;                                              // board scrolls away with the page (0 → 1 over half a screen)
    const cOp = smooth(1.1, 1.55, s) * (1 - smooth(2.7, 2.98, s));
    const mk = mob ? 0.5 : 1;
    gatherTo.set(mob ? 0 : 4.0 * layoutK, mob ? Y0 + 1.5 : 2.9, 1.0);
    chipObjs.forEach((o, k) => {
      const u = o.userData;
      tv.set(3.3 * layoutK, Y0, 0).add(u.jitter);
      cv.set(u.to.x * mk, Y0 + (u.to.y - Y0) * (mob ? 1.3 : 1), u.to.z);
      tv.lerp(cv, spread);
      const bk = smooth(0.36 + k * 0.02, 0.56 + k * 0.02, fp);                 // this card's flight onto the board
      tv.y += Math.sin(t * 0.8 + k) * 0.12 * spread * (1 - bk);
      tv.lerp(boardPos(o, k, bp), bk);
      tv.z += Math.sin(Math.PI * bk) * 1.2;                                   // lifts towards you mid-flight
      const g = u.nurse ? gather : 0;
      tv.lerp(gatherTo, g);
      if (!u.nurse) tv.y += leave * 5.3;
      o.position.copy(tv);
      const r = spread * (1 - bk) * (1 - g);
      const flip = Math.PI * smooth(0.25, 0.85, bk);
      o.rotation.set(u.rot.x * r, u.rot.y * r + flip, u.rot.z * r);
      const side = flip > Math.PI / 2;
      if (side !== u.flipped) { o.element.classList.toggle('flipped', side); u.flipped = side; }
      const sc = (mob ? 0.8 : 1) * (0.0118 + ((mob ? 0.0088 / 0.8 : 0.0125) - 0.0118) * bk);
      o.scale.setScalar(sc * (0.35 + 0.65 * spread) * (1 - 0.7 * g));
      const op = u.nurse ? cOp : cOp * (1 - smooth(0.2, 0.9, leave));
      o.visible = op > 0.005;
      if (Math.abs(op - u.lastOp) > 0.002) { u.faces.forEach((f) => (f.style.opacity = op.toFixed(3))); u.lastOp = op; }
      const st = smooth(0.05 + k * 0.03, 0.09 + k * 0.03, fp);               // problem stamp lands, one card after another
      if (Math.abs(st - u.lastSt) > 0.002) { u.stamp.style.setProperty('--st', st.toFixed(3)); u.lastSt = st; }
    });
    labelObjs.forEach((o) => {
      const u = o.userData;
      const op = mob ? 0 : smooth(0.58, 0.66, fp) * (1 - smooth(0.2, 0.9, leave));
      o.visible = op > 0.005;
      if (!o.visible) return;
      o.position.set((u.col - 1) * 4.4 * layoutK, 1.1 + ((colCount[1] - 1) / 2) * 1.38 + 1.25 + leave * 5.3, 0.2);
      if (Math.abs(op - u.lastOp) > 0.002) { o.element.style.opacity = op.toFixed(3); u.lastOp = op; }
      const mod = smooth(0.7, 0.8, fp);
      if (Math.abs(mod - u.lastMod) > 0.002) { o.element.style.setProperty('--mod', mod.toFixed(3)); u.lastMod = mod; }
    });

    // scene panels floating beside the copy
    panelObjs.forEach((o) => {
      const v = bump(s, o.userData.k, 1.9);
      o.visible = v > 0.005;
      if (!o.visible) return;
      o.position.set(0, 3.2 - 1.8 * (1 - v) + Math.sin(t * 0.9 + o.userData.k) * 0.08, 0.15);   // centred in view, floats gently
      o.rotation.set(0, 0, 0);
      o.element.style.opacity = v.toFixed(3);
    });

    // ---------- camera ----------
    const zK = mob ? 1.18 + 0.17 * panIn : 1;
    camera.position.x += (mouse.x * 0.7 - camera.position.x) * Math.min(1, dt * 2);
    camera.position.y += (L(S.camY) - mouse.y * 0.4 - camera.position.y) * Math.min(1, dt * 3);
    camera.position.z += (L(S.camZ) * zK - camera.position.z) * Math.min(1, dt * 3);
    camera.lookAt(0, L(S.lookY) + (mob ? -1.5 * panIn : 0), 0);

    cssStage.position.set(L(S.panX) * layoutK, (mob ? 3.0 : 0) - 5 * (1 - panIn), 0);
    cssStage.rotation.set(0, L(S.panRY) + mouse.x * 0.1, 0);
    cssStage.scale.setScalar(mob ? 0.55 : 1);
    renderer.render(scene, camera);
    css.render(cssScene, camera);
  }

  return { state, tick };
}

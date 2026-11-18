// Professora 3D: three.js + @pixiv/three-vrm, animação procedural (sem arquivos de animação).
// Gera /prof3d.js com: node build.mjs
import { WebGLRenderer, Scene, PerspectiveCamera, DirectionalLight, AmbientLight, Group, Vector3, Mesh, PlaneGeometry, MeshBasicMaterial, CanvasTexture } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';

const BONES = ['hips', 'spine', 'chest', 'neck', 'head', 'leftUpperArm', 'leftLowerArm', 'leftHand', 'rightUpperArm', 'rightLowerArm', 'rightHand', 'leftUpperLeg', 'leftLowerLeg', 'leftFoot', 'rightUpperLeg', 'rightLowerLeg', 'rightFoot'];
const FOV = 30;

export async function createTeacher(canvas, stage, url, opts = {}) {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  const scene = new Scene();
  const cam = new PerspectiveCamera(FOV, 1, 0.1, 60);
  const sun = new DirectionalLight(0xffffff, Math.PI * 0.85); sun.position.set(1.2, 2.5, 3); scene.add(sun);
  scene.add(new AmbientLight(0xffffff, 1.1));

  const loader = new GLTFLoader();
  loader.register((p) => new VRMLoaderPlugin(p));
  const gltf = await loader.loadAsync(url, opts.onProgress);
  const vrm = gltf.userData.vrm;
  VRMUtils.removeUnnecessaryVertices(gltf.scene);
  VRMUtils.combineSkeletons(gltf.scene);
  VRMUtils.rotateVRM0(vrm);
  const v0 = vrm.meta && vrm.meta.metaVersion === '0';
  vrm.scene.traverse((o) => { o.frustumCulled = false; });
  const root = new Group(); root.add(vrm.scene); scene.add(root);
  if (vrm.lookAt) vrm.lookAt.target = cam;

  // sombra redonda no chão
  const sc = document.createElement('canvas'); sc.width = sc.height = 64;
  const g = sc.getContext('2d'); const rg = g.createRadialGradient(32, 32, 2, 32, 32, 32);
  rg.addColorStop(0, 'rgba(13,63,122,.38)'); rg.addColorStop(1, 'rgba(13,63,122,0)'); g.fillStyle = rg; g.fillRect(0, 0, 64, 64);
  const shadow = new Mesh(new PlaneGeometry(0.75, 0.42), new MeshBasicMaterial({ map: new CanvasTexture(sc), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.003; scene.add(shadow);

  const B = {}; BONES.forEach((n) => { B[n] = vrm.humanoid.getNormalizedBoneNode(n); });
  vrm.update(0);
  const hp = new Vector3(); B.head.getWorldPosition(hp);
  const modelH = hp.y + 0.2;

  // layout: pés em f, topo da cabeça em gTop (frações da altura do palco)
  let W = 1, H = 1, halfH = 1, aspect = 1;
  function resize() {
    W = stage.clientWidth; H = stage.clientHeight; aspect = W / H;
    const mobile = W < 700;
    const f = mobile ? 0.95 : 0.95, gTop = mobile ? 0.47 : 0.33;
    halfH = modelH / (2 * (f - gTop));
    const d = halfH / Math.tan((FOV / 2) * Math.PI / 180);
    const cy = (f - 0.5) * 2 * halfH;
    cam.aspect = aspect; cam.position.set(0, cy, d); cam.lookAt(0, cy, 0); cam.updateProjectionMatrix();
    renderer.setSize(W, H, false);
  }
  resize();
  const worldX = (frac) => (frac - 0.5) * 2 * halfH * aspect;

  // estado
  let x = 0, fracX = 0.2, targetFrac = 0.2, target = null, onArrive = null, yaw = 0, yawT = 0, mode = 'idle', talking = false;
  let walkW = 0, phase = 0, t = 0, blinkT = 2.5, blink = 0, happy = 0, cheerHop = 0;
  const cur = {}; BONES.forEach((n) => { cur[n] = [0, 0, 0]; });
  const YAW = { front: 0, board: Math.PI - 0.55, right: Math.PI / 2, left: -Math.PI / 2 };

  function setX(frac) { fracX = frac; x = worldX(frac); }
  setX(opts.startX == null ? 0.2 : opts.startX);

  function pose(m, tt) {
    const s = Math.sin, br = s(tt * 2.1) * 0.025;
    const p = {
      spine: [br, 0, 0], chest: [br * 0.6, 0, 0], neck: [0, 0, 0], head: [0, 0, s(tt * 0.8) * 0.05],
      leftUpperArm: [0, 0, -1.2], leftLowerArm: [0, -0.3, 0], leftHand: [0, 0, 0],
      rightUpperArm: [0, 0, 1.2], rightLowerArm: [0, 0.3, 0], rightHand: [0, 0, 0],
      leftUpperLeg: [0, 0, 0], leftLowerLeg: [0, 0, 0], leftFoot: [0, 0, 0],
      rightUpperLeg: [0, 0, 0], rightLowerLeg: [0, 0, 0], rightFoot: [0, 0, 0], hips: [0, 0, 0]
    };
    if (m === 'wave') {
      p.leftUpperArm = [0, -0.25, 1.05];
      p.leftLowerArm = [0, 0, 0.35 - s(tt * 9) * 0.45];
      p.head = [0, -0.12, 0.08];
    } else if (m === 'write') {
      p.rightUpperArm = [0, 0.75 + Math.cos(tt * 6.5) * 0.07, -0.62 + s(tt * 9.5) * 0.09];
      p.rightLowerArm = [0, 0.55, -0.15];
      p.rightHand = [0, 0, -0.2];
      p.head = [-0.12, 0.15, 0];
    } else if (m === 'point') {
      p.leftUpperArm = [0, -0.45, -0.1];
      p.leftLowerArm = [0, -0.2, 0];
      p.leftHand = [0, 0, 0.15];
      p.head = [0, -0.18, 0.06];
    } else if (m === 'cheer') {
      const k = s(tt * 10) * 0.12;
      p.leftUpperArm = [0, 0, 1.0 + k]; p.leftLowerArm = [0, 0, 0.35];
      p.rightUpperArm = [0, 0, -1.0 - k]; p.rightLowerArm = [0, 0, -0.35];
      p.head = [0, 0, s(tt * 5) * 0.1];
    }
    return p;
  }

  function apply(name, e) {
    const b = B[name]; if (!b) return;
    if (v0) b.rotation.set(-e[0], e[1], -e[2]); else b.rotation.set(e[0], e[1], e[2]);
  }

  function update(dt) {
    t += dt;
    // locomoção
    let moving = false;
    if (target != null) {
      const dx = target - x, sp = 0.95 * dt;
      if (Math.abs(dx) <= sp) { x = target; target = null; const cb = onArrive; onArrive = null; if (cb) cb(); }
      else { x += Math.sign(dx) * sp; moving = true; yawT = dx > 0 ? YAW.right : YAW.left; }
    }
    walkW += ((moving ? 1 : 0) - walkW) * (1 - Math.exp(-dt * 10));
    if (moving) phase += dt * 5.4;
    // giro suave
    let dy = yawT - yaw; while (dy > Math.PI) dy -= 2 * Math.PI; while (dy < -Math.PI) dy += 2 * Math.PI;
    yaw += dy * (1 - Math.exp(-dt * 5));
    // pose
    const tgt = pose(moving ? 'idle' : mode, t), k = 1 - Math.exp(-dt * 14);
    BONES.forEach((n) => { const c = cur[n], q = tgt[n]; for (let i = 0; i < 3; i++) c[i] += (q[i] - c[i]) * k; });
    const s = Math.sin(phase), w = walkW;
    BONES.forEach((n) => {
      const e = cur[n].slice();
      if (w > 0.001) {
        if (n === 'leftUpperLeg') e[0] += -s * 0.32 * w;
        if (n === 'rightUpperLeg') e[0] += s * 0.32 * w;
        if (n === 'leftLowerLeg') e[0] += Math.max(0, -s) * 0.45 * w;
        if (n === 'rightLowerLeg') e[0] += Math.max(0, s) * 0.45 * w;
        if (n === 'leftUpperArm') e[0] += s * 0.35 * w;
        if (n === 'rightUpperArm') e[0] += -s * 0.35 * w;
        if (n === 'spine') e[1] += s * 0.08 * w;
        if (n === 'hips') e[1] += -s * 0.06 * w;
      }
      apply(n, e);
    });
    cheerHop += (((mode === 'cheer' && !moving) ? 1 : 0) - cheerHop) * (1 - Math.exp(-dt * 8));
    const bob = Math.abs(Math.cos(phase)) * 0.03 * w + Math.abs(Math.sin(t * 8)) * 0.06 * cheerHop;
    root.position.set(x, bob, 0); root.rotation.y = yaw;
    shadow.position.x = x; shadow.scale.setScalar(1 - bob * 2);
    // rosto
    blinkT -= dt; if (blinkT < 0) { blink = 1; blinkT = 2.2 + Math.random() * 2.8; }
    blink = Math.max(0, blink - dt * 7);
    happy += (((talking || mode === 'cheer') ? 1 : 0.25) - happy) * (1 - Math.exp(-dt * 6));
    const em = vrm.expressionManager;
    if (em) {
      em.setValue('blink', Math.sin(blink * Math.PI));
      em.setValue('happy', happy * 0.7);
      em.setValue('aa', talking ? Math.max(0, Math.sin(t * 15)) * 0.55 : 0);
    }
    vrm.update(dt);
  }

  const hv = new Vector3();
  return {
    vrm,
    update,
    render() { renderer.render(scene, cam); },
    resize() { const fr = fracX; resize(); x = worldX(fr); if (target != null) target = worldX(targetFrac); },
    setX,
    walkTo(frac) { targetFrac = frac; fracX = frac; return new Promise((res) => { target = worldX(frac); onArrive = res; }); },
    face(m) { yawT = YAW[m] != null ? YAW[m] : 0; },
    pose(m) { mode = m; },
    talk(on) { talking = !!on; },
    head() {
      B.head.getWorldPosition(hv); hv.y += 0.12; hv.project(cam);
      return { x: (hv.x + 1) / 2 * W, y: (1 - hv.y) / 2 * H, s: H / (2 * halfH) };
    },
    dispose() { renderer.dispose(); }
  };
}

// Adapted from the user-approved rapid-fire study. Geometry and choreography
// stay continuous; only real round data enters this renderer.
import * as THREE from "./vendor/three/three.module.min.js";

export function createScene(canvas, data) {
  let renderer,
    scene,
    disposed = false;
  const textures = new Set();
  function dispose() {
    if (disposed) return;
    disposed = true;
    const geometries = new Set(),
      materials = new Set();
    scene?.traverse((object) => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.material)
        for (const m of [object.material].flat()) materials.add(m);
    });
    for (const g of geometries) g.dispose();
    for (const m of materials) m.dispose();
    for (const t of textures) t.dispose();
    renderer?.dispose();
    renderer?.forceContextLoss();
  }
  try {
    const DURATION = 3600,
      STRIKE = 1560,
      FLIGHT_START = 1320,
      RAPID_START = 120,
      RAPID_STEP = 36,
      INSERT_MS = 28,
      PAPER_Y = 5.012,
      CONTACT_OFFSET = PAPER_Y + 1.05;
    const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)),
      out = (k) => 1 - Math.pow(1 - clamp(k), 3),
      inOut = (k) =>
        (k = clamp(k)) < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    const priorPoints = data.arrows
      .slice(0, 29)
      .map((p) => ({ x: p.x, z: p.y }));
    const final = data.arrows[29],
      paperRadius = data.face.radius + 0.35;
    const extent = Math.max(
      12,
      ...data.arrows.map((p) => Math.max(Math.abs(p.x), Math.abs(p.y))),
    );
    if (extent > 1000)
      throw new Error("Shot coordinates exceed the 3D presentation range");
    const backingSize = Math.max(
      23.6,
      ...data.arrows.map((p) => Math.hypot(p.x, p.y) * 2 + 2),
    );
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x071120, 0);
    const TAU = Math.PI * 2;
    let seed = 619;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const tex = (w, h, draw) => {
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      draw(c.getContext("2d"), w, h);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      textures.add(t);
      return t;
    };
    const carbon = tex(128, 128, (c, w, h) => {
      c.fillStyle = "#252a30";
      c.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 16)
        for (let x = 0; x < w; x += 16) {
          const flip = ((x + y) / 16) % 2;
          c.fillStyle = flip ? "#2a2e33" : "#20252b";
          c.fillRect(x, y, 16, 16);
          c.strokeStyle = flip ? "rgba(113,121,128,.14)" : "rgba(4,9,14,.2)";
          c.lineWidth = 1;
          for (let k = 2; k < 16; k += 3) {
            c.beginPath();
            c.moveTo(x + (flip ? k : 0), y + (flip ? 0 : k));
            c.lineTo(x + (flip ? k : 16), y + (flip ? 16 : k));
            c.stroke();
          }
        }
    });
    carbon.wrapS = carbon.wrapT = THREE.RepeatWrapping;
    carbon.repeat.set(3, 45);
    const wrap = tex(512, 512, (c, w, h) => {
      c.fillStyle = "#eeeadd";
      c.fillRect(0, 0, w, h);
      c.fillStyle = "#d76a28";
      c.fillRect(0, 8, w, 24);
      c.fillRect(0, h - 27, w, 7);
      for (const x of [90, 345]) {
        c.save();
        c.translate(x, 365);
        c.rotate(-Math.PI / 2);
        c.fillStyle = "#253244";
        c.font = "600 45px Arial";
        c.fillText("ROPERS", 0, 0);
        c.restore();
      }
    });
    const paper = tex(1024, 1024, (c, w, h) => {
      c.fillStyle = "#f2eee2";
      c.fillRect(0, 0, w, h);
      const scale = w / (paperRadius * 2);
      for (const { r, score } of [...data.face.rings].reverse()) {
        const col = score >= 9 ? "#ffd400" : score >= 7 ? "#e8352b" : "#2a7fd4";
        c.beginPath();
        c.arc(w / 2, h / 2, r * scale, 0, TAU);
        c.fillStyle = col;
        c.fill();
      }
      c.strokeStyle = "rgba(18,22,25,.68)";
      c.lineWidth = 2.7;
      for (const r of [
        ...data.face.rings.map((ring) => ring.r),
        data.face.xRadius,
      ]) {
        c.beginPath();
        c.arc(w / 2, h / 2, r * scale, 0, TAU);
        c.stroke();
      }
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(w / 2 - 18, h / 2);
      c.lineTo(w / 2 + 18, h / 2);
      c.moveTo(w / 2, h / 2 - 18);
      c.lineTo(w / 2, h / 2 + 18);
      c.stroke();
      c.font = "500 31px Arial";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillStyle = "rgba(17,27,37,.70)";
      for (const [r, label] of [
        [9, "6"],
        [7, "7"],
        [5, "8"],
        [3, "9"],
      ]) {
        c.fillText(label, w / 2 - r * scale, h / 2);
        c.fillText(label, w / 2 + r * scale, h / 2);
      }
      for (let i = 0; i < 26000; i++) {
        const x = rand() * w,
          y = rand() * h;
        c.fillStyle =
          rand() > 0.5 ? "rgba(255,255,240,.045)" : "rgba(47,34,19,.035)";
        c.fillRect(x, y, 1 + rand() * 2, 1 + rand() * 2);
      }
    });
    const foam = tex(256, 256, (c, w, h) => {
      c.fillStyle = "#171d25";
      c.fillRect(0, 0, w, h);
      for (let i = 0; i < 8500; i++) {
        const v = 12 + Math.floor(rand() * 27);
        c.fillStyle = `rgb(${v},${v + 3},${v + 7})`;
        c.fillRect(rand() * w, rand() * h, rand() * 2 + 0.4, rand() * 2 + 0.4);
      }
    });
    foam.wrapS = foam.wrapT = THREE.RepeatWrapping;
    foam.repeat.set(4, 4);
    const tear = tex(512, 512, (c, w, h) => {
      c.clearRect(0, 0, w, h);
      const cx = w / 2,
        cy = h / 2;
      c.beginPath();
      for (let i = 0; i <= 36; i++) {
        const a = (i / 36) * TAU,
          r = 116 + (rand() - 0.5) * 23;
        const x = cx + Math.cos(a) * r,
          y = cy + Math.sin(a) * r;
        i ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.closePath();
      c.fillStyle = "#16150e";
      c.fill();
      for (let i = 0; i < 38; i++) {
        const a = rand() * TAU,
          r = 105 + rand() * 18,
          x = cx + Math.cos(a) * r,
          y = cy + Math.sin(a) * r;
        c.strokeStyle = i % 3 ? "#e9dfba" : "#827348";
        c.lineWidth = 1.3 + rand() * 2;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x + Math.cos(a) * rand() * 22, y + Math.sin(a) * rand() * 22);
        c.stroke();
      }
    });
    const environment = tex(1024, 512, (c, w, h) => {
      c.fillStyle = "#384456";
      c.fillRect(0, 0, w, h);
      const panel = (x, y, r, col) => {
        const g = c.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, col);
        g.addColorStop(1, "rgba(56,68,86,0)");
        c.fillStyle = g;
        c.fillRect(0, 0, w, h);
      };
      panel(220, 170, 250, "#fff2d9");
      panel(800, 200, 190, "#b9d7ff");
      panel(500, 55, 145, "#eaf3ff");
    });
    environment.mapping = THREE.EquirectangularReflectionMapping;
    scene = new THREE.Scene();
    scene.environment = environment;
    scene.environmentIntensity = 0.7;
    scene.add(new THREE.HemisphereLight(0xdce8ff, 0x263047, 1.35));
    const key = new THREE.DirectionalLight(0xffead4, 2.2);
    key.position.set(-30, 80, 35);
    key.target.position.set(0, 30, 0);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -45;
    key.shadow.camera.right = 45;
    key.shadow.camera.top = 45;
    key.shadow.camera.bottom = -45;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 180;
    key.shadow.bias = -0.00008;
    key.shadow.normalBias = 0.015;
    scene.add(key, key.target);
    const rim = new THREE.DirectionalLight(0x8ebfff, 1.5);
    rim.position.set(20, 60, -25);
    scene.add(rim);
    const carbonMat = new THREE.MeshPhysicalMaterial({
      map: carbon,
      color: 0xffffff,
      metalness: 0.12,
      roughness: 0.34,
      clearcoat: 0.65,
      clearcoatRoughness: 0.25,
    });
    const wrapMat = new THREE.MeshStandardMaterial({
      map: wrap,
      roughness: 0.62,
    });
    const collarMat = new THREE.MeshStandardMaterial({
      color: 0x708394,
      metalness: 0.85,
      roughness: 0.26,
    });
    const orangeMat = new THREE.MeshPhysicalMaterial({
      color: 0xf2621a,
      roughness: 0.39,
      metalness: 0,
      clearcoat: 0.18,
    });
    const ivoryMat = new THREE.MeshPhysicalMaterial({
      color: 0xf6f3ea,
      roughness: 0.48,
      metalness: 0,
      clearcoat: 0.12,
    });
    const nockMat = new THREE.MeshPhysicalMaterial({
      color: 0xf77927,
      roughness: 0.16,
      metalness: 0,
      transmission: 0.62,
      thickness: 0.5,
      ior: 1.48,
      clearcoat: 0.8,
      clearcoatRoughness: 0.16,
    });
    const arrow = new THREE.Group();
    scene.add(arrow);
    function mesh(geometry, material, parent = arrow) {
      const m = new THREE.Mesh(geometry, material);
      m.castShadow = true;
      m.receiveShadow = true;
      parent.add(m);
      return m;
    }
    mesh(
      new THREE.CylinderGeometry(0.38, 0.38, 64, 40, 64),
      carbonMat,
    ).position.y = 32;
    mesh(
      new THREE.ConeGeometry(0.38, 2.1, 48),
      new THREE.MeshStandardMaterial({
        color: 0x526070,
        metalness: 0.8,
        roughness: 0.3,
      }),
    ).rotation.z = Math.PI;
    mesh(new THREE.CylinderGeometry(0.388, 0.388, 7, 64), wrapMat).position.y =
      59.9;
    mesh(
      new THREE.CylinderGeometry(0.405, 0.405, 0.18, 64),
      collarMat,
    ).position.y = 64.05;
    mesh(new THREE.CylinderGeometry(0.31, 0.29, 1.25, 48), nockMat).position.y =
      64.75;
    const vaneShape = new THREE.Shape();
    vaneShape.moveTo(0.39, 56.7);
    vaneShape.lineTo(0.39, 62.85);
    vaneShape.bezierCurveTo(1.25, 62.95, 1.83, 62.75, 1.72, 61.9);
    vaneShape.bezierCurveTo(1.62, 60.8, 1.28, 57.4, 0.39, 56.7);
    const vaneGeometry = new THREE.ExtrudeGeometry(vaneShape, {
      depth: 0.055,
      bevelEnabled: true,
      bevelThickness: 0.018,
      bevelSize: 0.018,
      bevelSegments: 3,
      curveSegments: 24,
      steps: 1,
    });
    vaneGeometry.translate(0, 0, -0.0275);
    const positions = vaneGeometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i),
        y = positions.getY(i),
        z = positions.getZ(i),
        a = ((y - 56.7) / 6.15) * 0.18;
      positions.setXYZ(
        i,
        x * Math.cos(a) + z * Math.sin(a),
        y,
        -x * Math.sin(a) + z * Math.cos(a),
      );
    }
    vaneGeometry.computeVertexNormals();
    for (let i = 0; i < 3; i++) {
      const v = mesh(vaneGeometry, i === 0 ? orangeMat : ivoryMat);
      v.rotation.y = (i * TAU) / 3;
      const foot = mesh(
        new THREE.CylinderGeometry(
          0.402,
          0.402,
          6.2,
          24,
          1,
          true,
          Math.PI / 2 - 0.12,
          0.24,
        ),
        i === 0 ? orangeMat : ivoryMat,
      );
      foot.position.y = 59.8;
      foot.rotation.y = (i * TAU) / 3;
    }
    const nockBodyProfile = [
      [0, 65.15],
      [0.3, 65.15],
      [0.35, 65.28],
      [0.395, 65.65],
      [0.395, 66.35],
      [0.38, 66.55],
      [0, 66.55],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    mesh(new THREE.LatheGeometry(nockBodyProfile, 64), nockMat);
    const jawRadius = 0.39,
      jawGap = 0.145,
      jawAngle = Math.acos(jawGap / jawRadius);
    const jawShape = new THREE.Shape();
    jawShape.moveTo(
      jawGap,
      -Math.sqrt(jawRadius * jawRadius - jawGap * jawGap),
    );
    jawShape.absarc(0, 0, jawRadius, -jawAngle, jawAngle, false);
    jawShape.closePath();
    const jawGeometry = new THREE.ExtrudeGeometry(jawShape, {
      depth: 0.8,
      bevelEnabled: true,
      bevelThickness: 0.055,
      bevelSize: 0.045,
      bevelSegments: 6,
      curveSegments: 24,
    });
    jawGeometry.rotateX(-Math.PI / 2);
    jawGeometry.translate(0, 66.53, 0);
    mesh(jawGeometry, nockMat);
    mesh(jawGeometry, nockMat).rotation.y = Math.PI;
    for (const y of [65.3, 65.48]) {
      const ring = mesh(new THREE.TorusGeometry(0.333, 0.018, 10, 64), nockMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = y;
    }
    // Bake each approved part's placement into its own geometry. The shared
    // centerline then bends shaft, wrap, vanes, and nock as one continuous arrow.
    const flexible = [];
    for (const part of arrow.children) {
      part.updateMatrix();
      part.geometry = part.geometry.clone();
      part.geometry.applyMatrix4(part.matrix);
      part.position.set(0, 0, 0);
      part.quaternion.identity();
      part.scale.set(1, 1, 1);
      part.frustumCulled = false;
      const g = part.geometry;
      flexible.push({
        part,
        base: new Float32Array(g.attributes.position.array),
        normals: new Float32Array(g.attributes.normal.array),
      });
    }
    arrow.rotation.y = THREE.MathUtils.degToRad(-15);
    const backing = mesh(
      new THREE.CylinderGeometry(backingSize / 2, backingSize / 2, 1.8, 96),
      new THREE.MeshStandardMaterial({ map: foam, roughness: 1 }),
      scene,
    );
    backing.position.y = 4;
    const paperEdge = mesh(
      new THREE.CylinderGeometry(paperRadius, paperRadius, 0.06, 96),
      new THREE.MeshStandardMaterial({ color: 0xe2dccc, roughness: 1 }),
      scene,
    );
    paperEdge.position.y = 4.97;
    const face = mesh(
      new THREE.CircleGeometry(paperRadius, 96),
      new THREE.MeshBasicMaterial({ map: paper, toneMapped: false }),
      scene,
    );
    face.rotation.x = -Math.PI / 2;
    face.position.y = 5.012;
    face.receiveShadow = false;
    face.castShadow = false;
    const faceShadow = mesh(
      new THREE.CircleGeometry(paperRadius, 96),
      new THREE.ShadowMaterial({ color: 0x11131a, opacity: 0.32 }),
      scene,
    );
    faceShadow.rotation.x = -Math.PI / 2;
    faceShadow.position.y = 5.018;
    faceShadow.castShadow = false;
    const hole = mesh(
      new THREE.PlaneGeometry(1.8, 1.8),
      new THREE.MeshStandardMaterial({
        map: tear,
        transparent: true,
        roughness: 1,
        depthWrite: false,
        alphaTest: 0.02,
      }),
      scene,
    );
    hole.rotation.x = -Math.PI / 2;
    hole.position.y = 5.027;
    hole.castShadow = false;
    const pulse = mesh(
      new THREE.TorusGeometry(0.6, 0.012, 8, 96),
      new THREE.MeshBasicMaterial({
        color: 0xd96b27,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        toneMapped: false,
      }),
      scene,
    );
    pulse.rotation.x = -Math.PI / 2;
    pulse.position.y = 5.08;
    pulse.castShadow = false;
    pulse.receiveShadow = false;
    const fibers = [];
    for (let i = 0; i < 9; i++) {
      const angle = (i * TAU) / 9 + 0.11,
        petal = new THREE.Shape();
      petal.moveTo(-0.018, 0);
      petal.lineTo(0.018, 0);
      petal.lineTo(0.007, 0.13 + (i % 3) * 0.025);
      petal.closePath();
      const p = mesh(
        new THREE.ShapeGeometry(petal),
        new THREE.MeshStandardMaterial({
          color: i % 3 ? 0xece4c9 : 0xbcab78,
          side: THREE.DoubleSide,
          roughness: 1,
        }),
        scene,
      );
      p.position.set(Math.cos(angle) * 0.43, 5.03, Math.sin(angle) * 0.43);
      p.rotation.set(-Math.PI / 2, 0, angle - Math.PI / 2);
      p.castShadow = false;
      fibers.push({ mesh: p, angle });
    }

    arrow.position.x = final.x;
    arrow.position.z = final.y;
    for (const item of [hole, pulse]) {
      item.position.x = final.x;
      item.position.z = final.y;
    }
    for (const f of fibers) {
      f.mesh.position.x += final.x;
      f.mesh.position.z += final.y;
    }
    const earlier = new THREE.Group();
    scene.add(earlier);
    const oldCarbon = new THREE.MeshStandardMaterial({
        map: carbon,
        color: 0xa4adb9,
        metalness: 0.08,
        roughness: 0.56,
      }),
      oldWrap = new THREE.MeshStandardMaterial({
        map: wrap,
        color: 0xb6c0cd,
        roughness: 0.7,
      }),
      oldIvory = new THREE.MeshStandardMaterial({
        color: 0xc0c8d1,
        roughness: 0.6,
      }),
      oldOrange = new THREE.MeshStandardMaterial({
        color: 0xb65c2a,
        roughness: 0.55,
      }),
      oldNock = new THREE.MeshStandardMaterial({
        color: 0xc16c34,
        roughness: 0.38,
      }),
      oldCollar = new THREE.MeshStandardMaterial({
        color: 0x667688,
        metalness: 0.4,
        roughness: 0.5,
      });
    // Earlier shots are a visual memory layer. Keep their physical geometry,
    // but let the full-strength last arrow and its shadow carry the focal moment.
    for (const material of [
      oldCarbon,
      oldWrap,
      oldIvory,
      oldOrange,
      oldNock,
      oldCollar,
    ]) {
      material.transparent = true;
      material.opacity = 0.42;
      material.depthWrite = true;
    }
    const priorBatches = [];
    const priorScale = 0.78;
    const pose = new THREE.Object3D(),
      instancePoses = priorPoints.map((p, i) => {
        pose.position.set(
          p.x,
          PAPER_Y * (1 - priorScale) - (0.7 + (i % 7) * 0.61),
          p.z,
        );
        pose.rotation.set(0, i * 2.39996, 0);
        pose.scale.set(priorScale, priorScale, priorScale);
        pose.updateMatrix();
        return pose.matrix.clone();
      });
    for (let i = 0; i < flexible.length; i++) {
      const source = flexible[i].part;
      if (i === 1) continue; // buried points need no separate draw call
      let geometry = source.geometry.clone();
      if (i === 0) {
        geometry.dispose();
        geometry = new THREE.CylinderGeometry(0.38, 0.38, 64, 12, 1);
        geometry.translate(0, 32, 0);
      }
      if (i === 2) {
        geometry.dispose();
        geometry = new THREE.CylinderGeometry(0.388, 0.388, 7, 12);
        geometry.translate(0, 59.9, 0);
      }
      const material =
        source.material === carbonMat
          ? oldCarbon
          : source.material === wrapMat
            ? oldWrap
            : source.material === ivoryMat
              ? oldIvory
              : source.material === orangeMat
                ? oldOrange
                : source.material === nockMat
                  ? oldNock
                  : oldCollar;
      const instanced = new THREE.InstancedMesh(
        geometry,
        material,
        priorPoints.length,
      );
      instanced.castShadow = false;
      instanced.receiveShadow = true;
      instanced.frustumCulled = false;
      instancePoses.forEach((matrix, j) => instanced.setMatrixAt(j, matrix));
      instanced.instanceMatrix.needsUpdate = true;
      earlier.add(instanced);
      priorBatches.push(instanced);
    }
    const oldHoles = new THREE.InstancedMesh(
      new THREE.PlaneGeometry(1.8, 1.8),
      hole.material.clone(),
      priorPoints.length,
    );
    oldHoles.frustumCulled = false;
    priorPoints.forEach((p, i) => {
      pose.position.set(p.x, 5.027, p.z);
      pose.rotation.set(-Math.PI / 2, 0, 0);
      pose.scale.set(0.85, 0.85, 0.85);
      pose.updateMatrix();
      oldHoles.setMatrixAt(i, pose.matrix);
    });
    oldHoles.instanceMatrix.needsUpdate = true;
    earlier.add(oldHoles);
    oldHoles.material.opacity = 0.55;
    const arrivalPose = new THREE.Matrix4();
    let priorSeated = false;
    function updatePrior(t) {
      const recapComplete =
        t >= RAPID_START + (priorPoints.length - 1) * RAPID_STEP + INSERT_MS;
      if (priorSeated && recapComplete) return priorPoints.length;
      const count = clamp(
        Math.floor((t - RAPID_START) / RAPID_STEP) + 1,
        0,
        priorPoints.length,
      );
      for (let i = 0; i < count; i++) {
        const elapsed = t - (RAPID_START + i * RAPID_STEP),
          seat = out(elapsed / INSERT_MS);
        arrivalPose.copy(instancePoses[i]);
        arrivalPose.elements[13] += (1 - seat) * 4.5;
        for (const batch of priorBatches) batch.setMatrixAt(i, arrivalPose);
      }
      for (const batch of priorBatches) {
        batch.count = count;
        batch.instanceMatrix.needsUpdate = true;
      }
      oldHoles.count = count;
      priorSeated = recapComplete;
      return count;
    }

    const camera = new THREE.PerspectiveCamera(
      20,
      1,
      10,
      Math.max(500, extent * 15),
    );
    camera.up.set(0, 0, -1);
    let lastWidth = 0,
      lastHeight = 0,
      lastBendTime = -1;
    function bendAt(t) {
      t = Math.min(t, STRIKE + 560);
      if (t === lastBendTime) return;
      lastBendTime = t;
      const dt = t - STRIKE;
      let offset = 36;
      if (t >= FLIGHT_START && t < STRIKE)
        offset =
          CONTACT_OFFSET +
          (36 - CONTACT_OFFSET) *
            (1 - (t - FLIGHT_START) / (STRIKE - FLIGHT_START));
      else if (t >= STRIKE)
        offset = CONTACT_OFFSET * Math.pow(1 - clamp(dt / 40), 2);
      arrow.position.y = offset;
      arrow.visible = t >= FLIGHT_START;
      if (t < FLIGHT_START) {
        hole.visible = false;
        pulse.visible = false;
        for (const f of fibers) f.mesh.visible = false;
        return;
      }
      const anchor = PAPER_Y - offset,
        length = 67.4 - anchor;
      const decay = dt >= 0 && dt < 560 ? Math.exp(-dt / 125) : 0;
      const amplitudeX = dt >= 0 ? 1.8 * decay * Math.sin((TAU * dt) / 115) : 0;
      const amplitudeZ =
        dt >= 0 ? 0.68 * decay * Math.sin((TAU * dt) / 129) : 0;
      for (const item of flexible) {
        const p = item.part.geometry.attributes.position,
          n = item.part.geometry.attributes.normal,
          a = p.array,
          b = n.array;
        for (let i = 0; i < a.length; i += 3) {
          const x = item.base[i],
            y = item.base[i + 1],
            z = item.base[i + 2],
            s = clamp((y - anchor) / length);
          const shape = (s * s * (3 - s)) / 2,
            slope = (3 * s - 1.5 * s * s) / length,
            dx = amplitudeX * shape,
            dz = amplitudeZ * shape;
          const sx = amplitudeX * slope,
            sz = amplitudeZ * slope,
            il = 1 / Math.sqrt(1 + sx * sx + sz * sz),
            qw = Math.sqrt((1 + il) / 2),
            qx = (sz * il) / (2 * qw),
            qz = (-sx * il) / (2 * qw);
          const ry = 2 * (qz * x - qx * z);
          a[i] = x - qz * ry + dx;
          a[i + 1] = y + qw * ry;
          a[i + 2] = z + qx * ry + dz;
          const nx = item.normals[i],
            ny = item.normals[i + 1],
            nz = item.normals[i + 2],
            tx = -2 * qz * ny,
            ty = 2 * (qz * nx - qx * nz),
            tz = 2 * qx * ny;
          b[i] = nx + qw * tx - qz * ty;
          b[i + 1] = ny + qw * ty + qz * tx - qx * tz;
          b[i + 2] = nz + qw * tz + qx * ty;
        }
        p.needsUpdate = true;
        n.needsUpdate = true;
      }
      const hit = t >= STRIKE,
        penetration = clamp(dt / 40),
        pulseProgress = clamp(dt / 280);
      hole.visible = hit;
      hole.scale.setScalar(0.28 + 0.72 * penetration);
      pulse.visible = hit && dt < 280;
      pulse.scale.setScalar(1 + 1.5 * (1 - Math.pow(1 - pulseProgress, 3)));
      pulse.material.opacity = 0.6 * (1 - pulseProgress);
      for (const f of fibers) {
        f.mesh.visible = hit;
        f.mesh.scale.setScalar(0.45 + 0.55 * penetration);
        f.mesh.rotation.x =
          -Math.PI / 2 +
          (hit
            ? 0.1 +
              0.18 *
                Math.exp(-Math.max(0, dt) / 85) *
                Math.sin(Math.max(0, dt) / 24)
            : 0);
      }
    }

    function draw(time, w, h, targetY) {
      if (disposed || !w || !h) return;
      if (w !== lastWidth || h !== lastHeight) {
        renderer.setSize(w, h, false);
        lastWidth = w;
        lastHeight = h;
      }
      const intro = out(time / 600),
        focus = out((time - 1160) / 160),
        dock = inOut((time - 2020) / 880);
      const width =
        (30 - 3.2 * intro - 0.65 * focus + (33.5 - 26.15) * dock) *
        Math.max(1, (extent + 2) / 14);
      const centerY = h * 0.414 + (targetY - h * 0.414) * dock;
      camera.position.set(
        8 + (0.25 - 8) * dock,
        200 - 22 * intro + 62 * dock,
        12 - intro + (0.5 - 11) * dock,
      );
      camera.lookAt(0, PAPER_Y, 0);
      const distance = camera.position.distanceTo(
        new THREE.Vector3(0, PAPER_Y, 0),
      );
      camera.fov = THREE.MathUtils.radToDeg(
        2 * Math.atan(width / ((w / h) * 2 * distance)),
      );
      camera.aspect = w / h;
      camera.setViewOffset(w, h, 0, h / 2 - centerY, w, h);
      bendAt(time);
      updatePrior(time);
      renderer.render(scene, camera);
    }
    function prepare(w, h, targetY) {
      // Compile every material before hiding final-arrow meshes at time zero.
      // Warm the impact's shadows/transmission pass too; a first-use driver
      // stall there would otherwise jump straight over the focal moment.
      renderer.compile(scene, camera);
      draw(STRIKE + 40, w, h, targetY);
      draw(0, w, h, targetY);
    }
    return { draw, prepare, dispose };
  } catch (error) {
    dispose();
    throw error;
  }
}

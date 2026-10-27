// Android compatibility renderer. Project real three-dimensional geometry into
// Canvas 2D; never create a WebGL context or compile a device graphics shader.
// This avoids the reported Pixel 10 / Android 17 WebGL driver failure while
// retaining physical arrows, recorded positions, flex, and camera continuity.
const TAU = Math.PI * 2,
  PAPER = 5.012;
const clamp = (v) => Math.max(0, Math.min(1, v));
const out = (v) => 1 - (1 - clamp(v)) ** 3;
const smooth = (v) =>
  (v = clamp(v)) < 0.5 ? 4 * v ** 3 : 1 - (-2 * v + 2) ** 3 / 2;
const sub = (a, b) => a.map((v, i) => v - b[i]);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const unit = (a) => {
  const n = Math.hypot(...a) || 1;
  return a.map((v) => v / n);
};
const palette = {
  carbon: [39, 45, 53],
  wrap: [238, 234, 221],
  collar: [112, 131, 148],
  orange: [242, 98, 26],
  ivory: [246, 243, 234],
  nock: [255, 133, 48],
};

function model(detail) {
  const faces = [];
  const add = (points, material, double = false) =>
    faces.push({ points, material, double });
  function lathe(profile, material, sides = detail ? 16 : 6) {
    for (let j = 1; j < profile.length; j++)
      for (let i = 0; i < sides; i++) {
        const a = (i * TAU) / sides,
          b = ((i + 1) * TAU) / sides;
        const [r0, y0] = profile[j - 1],
          [r1, y1] = profile[j];
        add(
          [
            [r0 * Math.cos(a), y0, r0 * Math.sin(a)],
            [r1 * Math.cos(a), y1, r1 * Math.sin(a)],
            [r1 * Math.cos(b), y1, r1 * Math.sin(b)],
            [r0 * Math.cos(b), y0, r0 * Math.sin(b)],
          ],
          material,
        );
      }
  }
  const shaftSegments = detail ? 24 : 1;
  lathe(
    Array.from({ length: shaftSegments + 1 }, (_, i) => [
      0.38,
      (64 * i) / shaftSegments,
    ]),
    "carbon",
  );
  lathe(
    [
      [0.388, 56.4],
      [0.388, 56.85],
    ],
    "orange",
  );
  lathe(
    [
      [0.388, 56.85],
      [0.388, 60],
      [0.388, 63.4],
    ],
    "wrap",
  );
  lathe(
    [
      [0.39, 63.2],
      [0.39, 63.38],
    ],
    "orange",
  );
  lathe(
    [
      [0.405, 63.96],
      [0.405, 64.14],
    ],
    "collar",
  );
  lathe(
    [
      [0.31, 64.12],
      [0.3, 65.15],
      [0.35, 65.28],
      [0.395, 65.65],
      [0.395, 66.35],
      [0.38, 66.55],
    ],
    "nock",
  );
  // Curved, lightly helical vanes follow the approved profile.
  const bezier = (a, b, c, d, t) =>
    (1 - t) ** 3 * a +
    3 * (1 - t) ** 2 * t * b +
    3 * (1 - t) * t * t * c +
    t ** 3 * d;
  const boundary = [
    [0.39, 56.7],
    [0.39, 62.85],
  ];
  const steps = detail ? 12 : 5;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    boundary.push([
      bezier(0.39, 1.25, 1.83, 1.72, t),
      bezier(62.85, 62.95, 62.75, 61.9, t),
    ]);
  }
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    boundary.push([
      bezier(1.72, 1.62, 1.28, 0.39, t),
      bezier(61.9, 60.8, 57.4, 56.7, t),
    ]);
  }
  for (let vane = 0; vane < 3; vane++) {
    const material = vane ? "ivory" : "orange";
    const point = ([x, y], side) => {
      const angle = (vane * TAU) / 3 + ((y - 56.7) / 6.15) * 0.18;
      return [
        x * Math.cos(angle) + side * Math.sin(angle),
        y,
        -x * Math.sin(angle) + side * Math.cos(angle),
      ];
    };
    const center = [0.68, 60.8];
    for (let i = 0; i < boundary.length; i++) {
      const a = boundary[i],
        b = boundary[(i + 1) % boundary.length];
      for (const side of [-0.035, 0.035]) {
        const triangle = [point(center, side), point(a, side), point(b, side)];
        add(side > 0 ? triangle.reverse() : triangle, material);
      }
      add(
        [point(a, -0.035), point(b, -0.035), point(b, 0.035), point(a, 0.035)],
        material,
        true,
      );
    }
  }
  // Two cylindrical jaws leave a real open string groove at the end.
  const radius = 0.39,
    angle = Math.acos(0.145 / radius),
    jawSteps = detail ? 14 : 5;
  for (const rotation of [0, Math.PI]) {
    const point = (a, y) => [
      Math.cos(a + rotation) * radius,
      y,
      Math.sin(a + rotation) * radius,
    ];
    const arc = Array.from(
      { length: jawSteps + 1 },
      (_, i) => -angle + (2 * angle * i) / jawSteps,
    );
    for (let i = 0; i < jawSteps; i++) {
      add(
        [
          point(arc[i], 66.53),
          point(arc[i], 67.33),
          point(arc[i + 1], 67.33),
          point(arc[i + 1], 66.53),
        ],
        "nock",
        true,
      );
    }
    add(
      arc.map((a) => point(a, 67.33)),
      "nock",
      true,
    );
    add(
      [
        point(-angle, 66.53),
        point(angle, 66.53),
        point(angle, 67.33),
        point(-angle, 67.33),
      ],
      "nock",
      true,
    );
  }
  return faces;
}

function targetTexture(face, foam = false) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = foam ? 256 : 1024;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("Canvas 2D unavailable");
  const w = canvas.width,
    radius = face.radius + 0.35;
  c.fillStyle = foam ? "#171f2a" : "#f2eee2";
  c.fillRect(0, 0, w, w);
  let seed = 619;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  if (!foam) {
    const scale = w / (radius * 2);
    for (const ring of [...face.rings].reverse()) {
      c.beginPath();
      c.arc(w / 2, w / 2, ring.r * scale, 0, TAU);
      c.fillStyle =
        ring.score >= 9 ? "#ffd400" : ring.score >= 7 ? "#e8352b" : "#2a7fd4";
      c.fill();
    }
    c.strokeStyle = "#25272c";
    c.lineWidth = 3.5;
    for (const r of [...face.rings.map((ring) => ring.r), face.xRadius]) {
      c.beginPath();
      c.arc(w / 2, w / 2, r * scale, 0, TAU);
      c.stroke();
    }
    c.font = "500 28px sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillStyle = "#253244";
    for (const [r, label] of [
      [9, "6"],
      [7, "7"],
      [5, "8"],
      [3, "9"],
    ]) {
      c.fillText(label, w / 2 - r * scale, w / 2);
      c.fillText(label, w / 2 + r * scale, w / 2);
    }
    c.beginPath();
    c.moveTo(w / 2 - 8, w / 2);
    c.lineTo(w / 2 + 8, w / 2);
    c.moveTo(w / 2, w / 2 - 8);
    c.lineTo(w / 2, w / 2 + 8);
    c.stroke();
  }
  for (let i = 0; i < (foam ? 5000 : 11000); i++) {
    c.fillStyle = random() > 0.5 ? "rgba(255,255,240,.04)" : "rgba(0,0,0,.04)";
    c.fillRect(random() * w, random() * w, 1.2, 1.2);
  }
  return canvas;
}

export function createScene(canvas, data) {
  const screen = canvas.getContext("2d", { alpha: true });
  const memory = document.createElement("canvas"),
    memoryContext = memory.getContext("2d", { alpha: true });
  if (!screen || !memoryContext) throw new Error("Canvas 2D unavailable");
  let ctx = screen;
  const detailed = model(true),
    recap = model(false);
  const paper = targetTexture(data.face),
    foam = targetTexture(data.face, true);
  const extent = Math.max(
    12,
    ...data.arrows.map((p) => Math.max(Math.abs(p.x), Math.abs(p.y))),
  );
  if (extent > 1000)
    throw new Error("Shot coordinates exceed presentation range");
  const backingRadius = Math.max(
    11.8,
    ...data.arrows.map((p) => Math.hypot(p.x, p.y) + 1),
  );
  const light = unit([-30, 80, 35]);
  let disposed = false;

  function draw(time, w, h, targetY) {
    if (disposed || !w || !h) return;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    if (
      canvas.width !== Math.round(w * dpr) ||
      canvas.height !== Math.round(h * dpr)
    ) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      memory.width = canvas.width;
      memory.height = canvas.height;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const intro = out(time / 600),
      focus = out((time - 1160) / 160),
      dock = smooth((time - 2020) / 880);
    const width =
      (30 - 3.2 * intro - 0.65 * focus + (33.5 - 26.15) * dock) *
      Math.max(1, (extent + 2) / 14);
    const camera = [
      8 + (0.25 - 8) * dock,
      200 - 22 * intro + 62 * dock,
      12 - intro + (0.5 - 11) * dock,
    ];
    const forward = unit(sub([0, PAPER, 0], camera));
    const right = unit(cross(forward, [0, 0, -1])),
      up = cross(right, forward);
    const focal = (w / width) * Math.hypot(...sub(camera, [0, PAPER, 0]));
    const centerY = h * 0.414 + (targetY - h * 0.414) * dock;
    const project = (point) => {
      const p = sub(point, camera),
        depth = dot(p, forward);
      return [
        w / 2 + (dot(p, right) * focal) / depth,
        centerY - (dot(p, up) * focal) / depth,
        depth,
      ];
    };
    const path = (points) => {
      ctx.beginPath();
      points.forEach((p, i) => {
        const q = project(p);
        i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]);
      });
      ctx.closePath();
    };
    const circle = (x, y, z, r, count = 64) =>
      Array.from({ length: count }, (_, i) => [
        x + Math.cos((i * TAU) / count) * r,
        y,
        z + Math.sin((i * TAU) / count) * r,
      ]);
    function plane(image, radius, y) {
      ctx.save();
      path(circle(0, y, 0, radius));
      ctx.clip();
      const p = project([0, y, 0]),
        x = project([1, y, 0]),
        z = project([0, y, 1]);
      ctx.transform(
        x[0] - p[0],
        x[1] - p[1],
        z[0] - p[0],
        z[1] - p[1],
        p[0],
        p[1],
      );
      ctx.drawImage(image, -radius, -radius, radius * 2, radius * 2);
      ctx.restore();
    }
    ctx.fillStyle = "#0e1520";
    path(circle(0, 3.1, 0, backingRadius));
    ctx.fill();
    plane(foam, backingRadius, 4.9);
    plane(paper, data.face.radius + 0.35, PAPER);

    const arrived = Math.min(
      29,
      Math.max(0, Math.floor((time - 120) / 36) + 1),
    );
    function hole(p, final = false) {
      path(circle(p.x, PAPER + 0.03, p.y, final ? 0.29 : 0.24, 12));
      ctx.fillStyle = final ? "#151819" : "#393b32";
      ctx.fill();
      if (!final) return;
      const onPaper = Math.hypot(p.x, p.y) <= data.face.radius + 0.35;
      for (let i = 0; i < 9; i++) {
        const angle = (i * TAU) / 9;
        path([
          [
            p.x + Math.cos(angle) * 0.31,
            PAPER + 0.035,
            p.y + Math.sin(angle) * 0.31,
          ],
          [
            p.x + Math.cos(angle + 0.08) * 0.53,
            PAPER + 0.05,
            p.y + Math.sin(angle + 0.08) * 0.53,
          ],
          [
            p.x + Math.cos(angle + 0.12) * 0.32,
            PAPER + 0.035,
            p.y + Math.sin(angle + 0.12) * 0.32,
          ],
        ]);
        ctx.fillStyle = onPaper ? "#e9dfc5" : "#293340";
        ctx.fill();
      }
    }
    ctx.globalAlpha = 0.55;
    for (let i = 0; i < arrived; i++) hole(data.arrows[i]);
    ctx.globalAlpha = 1;
    const final = data.arrows[29],
      dt = time - 1560;
    if (dt >= 0) hole(final, true);

    function arrowTransform(origin, yaw, scale, bend) {
      const cosine = Math.cos(yaw),
        sine = Math.sin(yaw);
      const anchor = PAPER - origin[1],
        length = 67.4 - anchor;
      return (p) => {
        let [x, y, z] = p;
        if (bend) {
          const s = clamp((y - anchor) / length),
            shape = (s * s * (3 - s)) / 2;
          const slope = (3 * s - 1.5 * s * s) / length;
          const sx = bend[0] * slope,
            sz = bend[1] * slope,
            il = 1 / Math.sqrt(1 + sx * sx + sz * sz);
          const qw = Math.sqrt((1 + il) / 2),
            qx = (sz * il) / (2 * qw),
            qz = (-sx * il) / (2 * qw);
          const ry = 2 * (qz * x - qx * z);
          [x, y, z] = [
            x - qz * ry + bend[0] * shape,
            y + qw * ry,
            z + qx * ry + bend[1] * shape,
          ];
        }
        return [
          origin[0] + (x * cosine + z * sine) * scale,
          origin[1] + y * scale,
          origin[2] + (-x * sine + z * cosine) * scale,
        ];
      };
    }
    function clipPaper(points) {
      const result = [];
      for (let i = 0; i < points.length; i++) {
        const a = points[i],
          b = points[(i + 1) % points.length];
        if (a[1] >= PAPER) result.push(a);
        if (a[1] >= PAPER !== b[1] >= PAPER) {
          const k = (PAPER - a[1]) / (b[1] - a[1]);
          result.push(a.map((v, axis) => v + (b[axis] - v) * k));
        }
      }
      return result;
    }
    function arrowMesh(faces, transform, alpha) {
      const visible = [];
      for (const face of faces) {
        const vertices = face.points.map(transform);
        const n = unit(
          cross(sub(vertices[1], vertices[0]), sub(vertices[2], vertices[0])),
        );
        const facing = dot(n, sub(camera, vertices[0]));
        if (!face.double && facing <= 0) continue;
        const clipped = clipPaper(vertices);
        if (clipped.length < 3) continue;
        const points = clipped.map(project);
        const normal = facing < 0 ? n.map((v) => -v) : n;
        const shade = 0.48 + 0.54 * Math.max(0, dot(normal, light));
        const color = palette[face.material].map((v) =>
          Math.min(255, Math.round(v * shade)),
        );
        visible.push({
          points,
          depth: points.reduce((sum, p) => sum + p[2], 0) / points.length,
          fill: `rgb(${color.join(",")})`,
          alpha: face.material === "nock" ? alpha * 0.88 : alpha,
        });
      }
      visible.sort((a, b) => b.depth - a.depth);
      ctx.lineJoin = "round";
      ctx.lineWidth = 0.35;
      for (const face of visible) {
        ctx.globalAlpha = face.alpha;
        ctx.beginPath();
        face.points.forEach((p, i) =>
          i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]),
        );
        ctx.closePath();
        ctx.fillStyle = ctx.strokeStyle = face.fill;
        ctx.fill();
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    // Composite the recap once, keeping overlapping faces from turning the
    // deliberately subdued memory layer opaque as the group fills in.
    ctx = memoryContext;
    try {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < arrived; i++) {
        const p = data.arrows[i],
          scale = 0.78,
          seat = out((time - 120 - i * 36) / 28);
        const y =
          PAPER * (1 - scale) - (0.7 + (i % 7) * 0.61) + (1 - seat) * 4.5;
        arrowMesh(
          recap,
          arrowTransform([p.x, y, p.y], i * 2.39996, scale, null),
          1,
        );
      }
    } finally {
      ctx = screen;
    }
    ctx.globalAlpha = 0.42;
    ctx.drawImage(memory, 0, 0, w, h);
    ctx.globalAlpha = 1;
    if (time >= 1320) {
      const contact = PAPER + 1.05;
      const offset =
        dt < 0
          ? contact + (36 - contact) * (1 - (time - 1320) / 240)
          : contact * (1 - clamp(dt / 40)) ** 2;
      const decay = dt >= 0 && dt < 560 ? Math.exp(-dt / 125) : 0;
      const bend = [
        1.8 * decay * Math.sin((TAU * dt) / 115),
        0.68 * decay * Math.sin((TAU * dt) / 129),
      ];
      const transform = arrowTransform(
        [final.x, offset, final.y],
        -Math.PI / 12,
        1,
        bend,
      );
      if (dt >= 0) {
        ctx.save();
        path(circle(0, PAPER, 0, backingRadius));
        ctx.clip();
        ctx.beginPath();
        for (let i = 0; i <= 24; i++) {
          const p = transform([0, 5 + (62 * i) / 24, 0]),
            height = Math.max(0, p[1] - PAPER);
          const q = project([
            p[0] + (height * 30) / 80,
            PAPER + 0.01,
            p[2] - (height * 35) / 80,
          ]);
          i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]);
        }
        ctx.strokeStyle = "#101522";
        ctx.globalAlpha = 0.18;
        ctx.lineWidth = Math.max(1, (w / width) * 0.55);
        ctx.stroke();
        ctx.restore();
      }
      arrowMesh(detailed, transform, 1);
      if (dt >= 0 && dt < 280) {
        const q = clamp(dt / 280);
        path(circle(final.x, PAPER + 0.08, final.y, 0.6 * (1 + 1.5 * out(q))));
        ctx.strokeStyle = "#d96b27";
        ctx.globalAlpha = 0.6 * (1 - q);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  }
  return {
    draw,
    prepare() {},
    dispose() {
      if (disposed) return;
      disposed = true;
      screen.clearRect(0, 0, canvas.width, canvas.height);
      paper.width = paper.height = foam.width = foam.height = 1;
      memory.width = memory.height = 1;
      canvas.width = canvas.height = 1;
    },
  };
}

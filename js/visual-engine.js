(() => {
  /* ── Generative art engine ─────────────────────────────────────────────
               Every "image" on this page is rendered here: lit heightfields (satin,
               liquid chrome, marble busts, engraved topography), a refractive glass
               orb, and vector line works with additive glow. Finished with a
               vignette and film grain. Paints lazily, one slice per frame. */
  const TAU = Math.PI * 2,
    clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v),
    sstep = (a, b, v) => {
      v = clamp((v - a) / (b - a));
      return v * v * (3 - 2 * v);
    };
  const R = (s) => {
    let a = s >>> 0 || 1;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  const NZ = (seed) => {
    const r = R(seed * 977 + 13),
      p = new Uint8Array(512),
      gx = new Float32Array(256),
      gy = new Float32Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = (r() * (i + 1)) | 0,
        t = p[i];
      p[i] = p[j];
      p[j] = t;
    }
    for (let i = 0; i < 256; i++) {
      p[i + 256] = p[i];
      const a = r() * TAU;
      gx[i] = Math.cos(a);
      gy[i] = Math.sin(a);
    }
    return (x, y) => {
      const fx = Math.floor(x),
        fy = Math.floor(y),
        X = fx & 255,
        Y = fy & 255;
      x -= fx;
      y -= fy;
      const u = x * x * x * (x * (x * 6 - 15) + 10),
        v = y * y * y * (y * (y * 6 - 15) + 10);
      const aa = p[p[X] + Y],
        ab = p[p[X] + Y + 1],
        ba = p[p[X + 1] + Y],
        bb = p[p[X + 1] + Y + 1];
      const n00 = gx[aa] * x + gy[aa] * y,
        n10 = gx[ba] * (x - 1) + gy[ba] * y,
        n01 = gx[ab] * x + gy[ab] * (y - 1),
        n11 = gx[bb] * (x - 1) + gy[bb] * (y - 1);
      const l1 = n00 + (n10 - n00) * u,
        l2 = n01 + (n11 - n01) * u;
      return l1 + (l2 - l1) * v;
    };
  };
  const fbm = (n, x, y, o) => {
    let s = 0,
      a = 0.5;
    for (let i = 0; i < o; i++) {
      s += a * n(x, y);
      x = x * 2.03 + 17.1;
      y = y * 2.03 - 9.7;
      a *= 0.5;
    }
    return s;
  };
  const hex = (h) => [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
  const mkLut = (stops) => {
    const c = stops.map(hex),
      L = new Uint8ClampedArray(768);
    for (let i = 0; i < 256; i++) {
      const t = (i / 255) * (c.length - 1),
        k = Math.min(c.length - 2, t | 0),
        f = t - k,
        s = f * f * (3 - 2 * f);
      for (let j = 0; j < 3; j++)
        L[i * 3 + j] = c[k][j] + (c[k + 1][j] - c[k][j]) * s;
    }
    return L;
  };
  const PAL = {
    night: {
      bg: "#0a0908",
      ramp: ["#030303", "#141210", "#3a362f", "#a39a8a", "#f4ecdd", "#ffffff"],
      acc: "#d7ff3f",
    },
    bone: {
      light: 1,
      bg: "#e4ded2",
      ramp: ["#3d3830", "#7c7468", "#b5ad9f", "#dcd5c8", "#efeae1", "#ffffff"],
      acc: "#ff5a2e",
    },
    ember: {
      bg: "#0f0604",
      ramp: ["#050201", "#2a0c05", "#7e2310", "#e0542a", "#ffb27e", "#fff1e2"],
      acc: "#ffe8c9",
    },
    violet: {
      bg: "#07060d",
      ramp: ["#030208", "#140f2c", "#3b2f84", "#8f78f0", "#d9cfff", "#ffffff"],
      acc: "#d7ff3f",
    },
    lime: {
      bg: "#c9f03a",
      ramp: ["#121805", "#3d4f0b", "#8db318", "#d7ff3f", "#f1ffc2", "#ffffff"],
      acc: "#0d0c0b",
    },
    ash: {
      bg: "#121211",
      ramp: ["#050505", "#1d1c1a", "#4d4a45", "#a8a197", "#ece6db", "#ffffff"],
      acc: "#ff5a2e",
    },
  };
  PAL._stone = {
    ramp: ["#050505", "#1f1c19", "#5a544c", "#a59d90", "#e6dfd2", "#ffffff"],
    acc: "#ffffff",
  };
  for (const k in PAL) {
    const p = PAL[k];
    p.lut = mkLut(p.ramp);
    p.a = hex(p.acc);
  }
  const lut = (p, t, o, i) => {
    const k = ((clamp(t) * 255) | 0) * 3;
    o[i] = p.lut[k];
    o[i + 1] = p.lut[k + 1];
    o[i + 2] = p.lut[k + 2];
  };
  const rampCss = (p, t, a = 1) => {
    const k = ((clamp(t) * 255) | 0) * 3;
    return `rgba(${p.lut[k]},${p.lut[k + 1]},${p.lut[k + 2]},${a})`;
  };
  const L = (() => {
    const v = [-0.48, -0.58, 0.66],
      m = Math.hypot(...v);
    return v.map((x) => x / m);
  })();
  const HV = (() => {
    const v = [L[0], L[1], L[2] + 1],
      m = Math.hypot(...v);
    return v.map((x) => x / m);
  })();

  /* raster helpers: compute at a pixel budget, upscale smoothly */
  const raster = (x, w, h, budget, fn) => {
    const s = Math.min(1.5, Math.sqrt(budget / (w * h)));
    const W = Math.max(2, Math.round(w * s)),
      H = Math.max(2, Math.round(h * s));
    const img = new ImageData(W, H),
      d = img.data,
      o = [0, 0, 0];
    for (let j = 0; j < H; j++)
      for (let i = 0; i < W; i++) {
        fn(i / s, j / s, o);
        const k = (j * W + i) * 4;
        d[k] = o[0];
        d[k + 1] = o[1];
        d[k + 2] = o[2];
        d[k + 3] = 255;
      }
    blit(x, img, w, h);
  };
  const blit = (x, img, w, h) => {
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    c.getContext("2d").putImageData(img, 0, 0);
    x.imageSmoothingEnabled = true;
    x.imageSmoothingQuality = "high";
    x.drawImage(c, 0, 0, w, h);
  };
  /* heightfield: sample once, then shade with finite-difference normals */
  const relief = (x, w, h, budget, height, shade) => {
    const s = Math.min(1.5, Math.sqrt(budget / (w * h)));
    const W = Math.max(3, Math.round(w * s)),
      H = Math.max(3, Math.round(h * s));
    const B = new Float32Array(W * H);
    for (let j = 0; j < H; j++)
      for (let i = 0; i < W; i++) B[j * W + i] = height(i / s, j / s);
    const img = new ImageData(W, H),
      d = img.data,
      o = [0, 0, 0];
    for (let j = 0; j < H; j++)
      for (let i = 0; i < W; i++) {
        const k = j * W + i,
          il = i > 0 ? k - 1 : k,
          ir = i < W - 1 ? k + 1 : k,
          ju = j > 0 ? k - W : k,
          jd = j < H - 1 ? k + W : k;
        const dx = ((B[ir] - B[il]) * s) / (ir - il || 1),
          dy = ((B[jd] - B[ju]) * s) / ((jd - ju) / W || 1);
        const m = 1 / Math.hypot(dx, dy, 1);
        shade(-dx * m, -dy * m, m, B[k], i / s, j / s, o, Math.hypot(dx, dy));
        d[k * 4] = o[0];
        d[k * 4 + 1] = o[1];
        d[k * 4 + 2] = o[2];
        d[k * 4 + 3] = 255;
      }
    blit(x, img, w, h);
  };
  const warp = (n, u, v, o) => {
    const qx = fbm(n, u, v, 3),
      qy = fbm(n, u + 5.2, v + 1.3, 3);
    return fbm(n, u + 1.9 * qx, v + 1.9 * qy, o);
  };

  const ART = {
    none() {},
    /* satin: domain-warped heightfield, wrapped diffuse + sheen */
    silk(x, w, h, r, n, p) {
      const G = p.gain || 1,
        m = Math.min(w, h),
        sc = (1.7 / m) * (0.8 + r() * 0.5) * (p.scale || 1),
        ox = r() * 40,
        oy = r() * 40,
        amp = m * 0.16;
      relief(
        x,
        w,
        h,
        110000,
        (X, Y) => warp(n, X * sc + ox, Y * sc + oy, 4) * amp,
        (nx, ny, nz, H, X, Y, o) => {
          const dl = nx * L[0] + ny * L[1] + nz * L[2],
            wr = clamp((dl + 0.4) / 1.4),
            sp = Math.pow(clamp(nx * HV[0] + ny * HV[1] + nz * HV[2]), 46),
            sheen = Math.pow(1 - nz, 2.2);
          const t = p.light
            ? 0.32 + 0.6 * wr + (0.06 * H) / amp
            : (0.04 + 0.62 * wr * wr + 0.12 * (H / amp + 0.5)) * G;
          lut(p, t, o, 0);
          const a = sheen * 0.22 * (p.light ? 0.4 : 1),
            S = sp * G;
          o[0] += p.a[0] * a + S * 190;
          o[1] += p.a[1] * a + S * 185;
          o[2] += p.a[2] * a + S * 175;
        },
      );
    },
    /* liquid metal: reflect view vector into environment */
    chrome(x, w, h, r, n, p) {
      const m = Math.min(w, h),
        sc = (0.62 / m) * (0.85 + r() * 0.3),
        ox = r() * 40,
        oy = r() * 40,
        amp = m * 0.24,
        tilt = (r() - 0.5) * 0.6;
      relief(
        x,
        w,
        h,
        110000,
        (X, Y) => warp(n, X * sc + ox, Y * sc + oy, 2) * amp,
        (nx, ny, nz, H, X, Y, o) => {
          const rx = 2 * nz * nx,
            ry = 2 * nz * ny + tilt * 0.3;
          let e = 0.05 + 0.5 * Math.pow(clamp(0.5 - 0.55 * ry), 2.4);
          e +=
            0.85 * Math.exp(-Math.pow((ry + 0.45) / 0.16, 2)) +
            0.4 * Math.exp(-Math.pow((rx - 0.5) / 0.14, 2)) +
            0.25 * Math.exp(-Math.pow((rx + 0.55) / 0.2, 2));
          const hz = 0.6 * Math.exp(-Math.pow((ry - 0.12) / 0.08, 2));
          lut(p, p.light ? 0.15 + e * 0.8 : e, o, 0);
          o[0] += p.a[0] * hz * 0.45;
          o[1] += p.a[1] * hz * 0.45;
          o[2] += p.a[2] * hz * 0.45;
        },
      );
    },
    /* engraved topography: anti-aliased iso-lines over a hillshade */
    contour(x, w, h, r, n, p) {
      const m = Math.min(w, h),
        sc = (1.05 / m) * (0.8 + r() * 0.4),
        ox = r() * 40,
        oy = r() * 40,
        amp = m * 0.2,
        gap = amp / 16;
      relief(
        x,
        w,
        h,
        230000,
        (X, Y) => warp(n, X * sc + ox, Y * sc + oy, 4) * amp,
        (nx, ny, nz, H, X, Y, o, g) => {
          const k = H / gap,
            f = k - Math.floor(k),
            dist = (Math.min(f, 1 - f) * gap) / Math.max(g, 1e-3),
            major = ((Math.round(k) % 5) + 5) % 5 == 0;
          const line = 1 - sstep(major ? 0.7 : 0.25, major ? 1.7 : 1.05, dist);
          const hs = clamp(nx * L[0] + ny * L[1] + nz * L[2]);
          if (p.light) {
            lut(p, 0.72 + 0.24 * hs, o, 0);
          } else {
            lut(p, 0.05 + 0.16 * hs + 0.05 * (H / amp + 0.5), o, 0);
          }
          const lc = major ? p.a : null;
          const t = p.light ? 0.3 : 0.86;
          const q = [0, 0, 0];
          lut(p, t, q, 0);
          const c = lc || q,
            a = line * (major ? 0.85 : 0.5);
          o[0] += (c[0] - o[0]) * a;
          o[1] += (c[1] - o[1]) * a;
          o[2] += (c[2] - o[2]) * a;
        },
      );
    },
    /* glass orb: refraction, fresnel rim, specular, caustic on the floor */
    orb(x, w, h, r, n, p) {
      const m = Math.min(w, h),
        cx = w * (0.5 + (r() - 0.5) * 0.16),
        cy = h * 0.45,
        Rr = m * 0.31,
        fl = cy + Rr * 1.02,
        sc = 2.4 / m,
        ox = r() * 30;
      const bg = (X, Y, o) => {
        const v = fbm(n, X * sc + ox, Y * sc * 0.6, 3);
        let t = p.light
          ? 0.62 + 0.3 * (1 - Y / h) + 0.12 * v
          : 0.03 + 0.16 * Math.pow(1 - Y / h, 1.5) + 0.1 * (v + 0.5);
        const dx = X - cx;
        t *=
          1 -
          0.55 *
            Math.exp(
              -(dx * dx) / (Rr * Rr * 1.3) -
                Math.pow((Y - fl) / (Rr * 0.16), 2),
            );
        lut(p, t, o, 0);
        const c =
          0.85 *
          Math.exp(
            -Math.pow((dx + Rr * 0.18) / (Rr * 0.5), 2) -
              Math.pow((Y - fl - Rr * 0.04) / (Rr * 0.07), 2),
          );
        o[0] += p.a[0] * c;
        o[1] += p.a[1] * c;
        o[2] += p.a[2] * c;
      };
      const q = [0, 0, 0];
      raster(x, w, h, 170000, (X, Y, o) => {
        bg(X, Y, o);
        const dx = (X - cx) / Rr,
          dy = (Y - cy) / Rr,
          d2 = dx * dx + dy * dy;
        if (d2 >= 1) return;
        const d = Math.sqrt(d2),
          nz = Math.sqrt(1 - d2),
          ed = clamp((1 - d) * Rr * 1.2);
        bg(
          cx - dx * Rr * 0.72 * (1 + nz * 0.3),
          cy - dy * Rr * 0.72 * (1 + nz * 0.3) - Rr * 0.1,
          q,
        );
        const fr = 0.06 + 0.94 * Math.pow(1 - nz, 4.5),
          sp = Math.pow(clamp(dx * HV[0] + dy * HV[1] + nz * HV[2]), 160),
          sp2 = Math.pow(clamp(-dx * 0.6 + dy * 0.75 + nz * 0.2), 30) * 0.35,
          glow = Math.pow(clamp(dy * 0.8 + 0.25), 3) * 0.45;
        const rim = [0, 0, 0];
        lut(p, 0.92, rim, 0);
        for (let i = 0; i < 3; i++) {
          let c =
            q[i] * 1.15 * (1 - fr) +
            rim[i] * fr +
            255 * (sp * 1.3 + sp2) +
            p.a[i] * glow;
          o[i] += (c - o[i]) * ed;
        }
      });
    },
    /* polished stone head: a featureless ovoid in low-key lighting */
    bust(x, w, h, r, n, p) {
      const m = Math.min(w, h * 0.9),
        cx = w * (0.5 + (r() - 0.5) * 0.12),
        cy = h * (0.47 + r() * 0.06),
        th = (r() - 0.5) * 1.1 + (r() < 0.5 ? 0.35 : -0.35),
        A = m * 0.25,
        B = m * 0.33,
        co = Math.cos(th),
        si = Math.sin(th),
        side = th > 0 ? 1 : -1,
        vs = r() * 30;
      const M = PAL._stone;
      const rot = (X, Y) => {
        const dx = X - cx,
          dy = Y - cy;
        return [dx * co + dy * si, -dx * si + dy * co];
      };
      const H = (X, Y) => {
        const [u, v] = rot(X, Y);
        let d = 1 - (u / A) ** 2 - (v / B) ** 2;
        let z = d > 0 ? B * 0.8 * Math.sqrt(d) : 0;
        if (z > 0) z += fbm(n, (X / m) * 18, (Y / m) * 18, 2) * m * 0.0012;
        return z;
      };
      relief(x, w, h, 100000, H, (nx, ny, nz, Hv, X, Y, o) => {
        const g = Math.exp(
            -((X - w * 0.32) ** 2 + (Y - h * 0.22) ** 2) / (2 * m * m * 0.5),
          ),
          sh = Math.exp(
            -((X - cx - m * 0.05) ** 2 / (A * A * 1.4)) -
              (Y - cy - B * 0.95) ** 2 / (B * 0.16) ** 2,
          );
        lut(
          p,
          (p.light ? 0.55 + 0.38 * g : 0.03 + 0.24 * g) * (1 - 0.55 * sh),
          o,
          0,
        );
        const [u, v] = rot(X, Y),
          e = 1 - (u / A) ** 2 - (v / B) ** 2,
          a = clamp(e * m * 0.12);
        if (a <= 0) return;
        const dl = nx * L[0] + ny * L[1] + nz * L[2],
          wr = clamp((dl + 0.18) / 1.18),
          sp = Math.pow(clamp(nx * HV[0] + ny * HV[1] + nz * HV[2]), 38),
          rim =
            Math.pow(clamp(1 - nz), 3) * clamp(nx * 0.75 + ny * 0.35 + 0.35),
          occ = clamp(0.35 + 0.65 * sstep(-0.4, 0.6, -v / B + 0.2));
        const vein = Math.pow(
            1 -
              Math.abs(
                Math.sin(
                  ((u * 0.8 + v * 0.5) / m) * 8 +
                    fbm(n, (X / m) * 2.5 + vs, (Y / m) * 2.5, 4) * 6,
                ),
              ),
            30,
          ),
          c = [0, 0, 0];
        lut(M, (0.04 + 0.9 * wr * wr) * (0.55 + 0.45 * occ), c, 0);
        for (let i = 0; i < 3; i++) {
          const val =
            c[i] * (1 - 0.18 * vein) +
            255 * sp * 0.32 +
            p.a[i] * rim * 0.9 +
            p.lut[((0.75 * 255) | 0) * 3 + i] * rim * 0.25;
          o[i] += (val - o[i]) * a;
        }
      });
    },
    /* sound-wave ridgelines with depth fog and a glowing horizon row */
    ridge(x, w, h, r, n, p) {
      const sky = x.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, rampCss(p, p.light ? 0.8 : 0.02));
      sky.addColorStop(0.6, rampCss(p, p.light ? 0.92 : 0.1));
      sky.addColorStop(1, rampCss(p, p.light ? 0.85 : 0.03));
      x.fillStyle = sky;
      x.fillRect(0, 0, w, h);
      const rows = Math.max(26, Math.min(64, (h / 10) | 0)),
        sp = h / (rows + 8),
        amp = sp * 11,
        hl = (rows * 0.58) | 0;
      for (let i = 0; i < rows; i++) {
        const y0 = sp * (i + 7),
          pts = [];
        for (let X = -4; X <= w + 4; X += 2.5) {
          const e = Math.exp(-Math.pow((X - w / 2) / (w * 0.23), 2));
          const v =
            Math.max(
              0,
              n(X * 0.011, i * 0.33) + n(X * 0.034, i * 0.6) * 0.35 + 0.1,
            ) * e;
          pts.push(X, y0 - v * amp);
        }
        const depth = i / rows;
        x.beginPath();
        x.moveTo(-4, h);
        for (let k = 0; k < pts.length; k += 2) x.lineTo(pts[k], pts[k + 1]);
        x.lineTo(w + 4, h);
        x.closePath();
        const fg = x.createLinearGradient(0, y0 - amp, 0, y0 + sp * 3);
        fg.addColorStop(0, rampCss(p, p.light ? 0.9 : 0.06));
        fg.addColorStop(1, rampCss(p, p.light ? 0.86 : 0.015));
        x.fillStyle = fg;
        x.fill();
        x.beginPath();
        for (let k = 0; k < pts.length; k += 2)
          k ? x.lineTo(pts[k], pts[k + 1]) : x.moveTo(pts[k], pts[k + 1]);
        const sg = x.createLinearGradient(0, 0, w, 0);
        const hi = i == hl;
        sg.addColorStop(0, rampCss(p, p.light ? 0.4 : 0.25, 0));
        sg.addColorStop(
          0.5,
          hi ? p.acc : rampCss(p, p.light ? 0.08 : 0.98, 0.5 + 0.5 * depth),
        );
        sg.addColorStop(1, rampCss(p, p.light ? 0.4 : 0.25, 0));
        x.strokeStyle = sg;
        x.lineWidth = hi ? 1.8 : 1 + depth * 0.6;
        x.shadowColor = hi ? p.acc : rampCss(p, 0.9, 0.5);
        x.shadowBlur = hi ? 18 : p.light ? 0 : 4;
        x.stroke();
        x.shadowBlur = 0;
      }
    },
    /* plotted rose curves with additive glow */
    petal(x, w, h, r, n, p) {
      const cx = w / 2,
        cy = h / 2,
        M = Math.min(w, h) * 0.46,
        k = 3 + ((r() * 5) | 0),
        J = 180;
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, M * 1.3);
      g.addColorStop(0, rampCss(p, p.light ? 0.97 : 0.16));
      g.addColorStop(1, rampCss(p, p.light ? 0.8 : 0.01));
      x.fillStyle = g;
      x.fillRect(0, 0, w, h);
      x.globalCompositeOperation = p.light ? "multiply" : "lighter";
      x.lineWidth = 0.55;
      for (let j = 0; j < J; j++) {
        const s = 0.12 + 0.88 * (j / J),
          rot = j * 0.0105;
        x.beginPath();
        for (let a = 0; a <= TAU + 0.015; a += 0.015) {
          const rr =
            M *
            s *
            (0.22 + 0.78 * Math.abs(Math.cos((k * a) / 2))) *
            (1 + n(Math.cos(a) * 1.2, Math.sin(a) * 1.2 + j * 0.012) * 0.14);
          const X = cx + Math.cos(a + rot) * rr,
            Y = cy + Math.sin(a + rot) * rr;
          a ? x.lineTo(X, Y) : x.moveTo(X, Y);
        }
        const ac = j % 30 == 0;
        x.strokeStyle = ac
          ? p.acc
          : rampCss(
              p,
              p.light ? 0.25 + 0.35 * (j / J) : 0.45 + 0.5 * (j / J),
              p.light ? 0.35 : 0.22,
            );
        x.globalAlpha = ac ? 0.8 : 1;
        x.stroke();
      }
      x.globalAlpha = 1;
      x.globalCompositeOperation = "source-over";
    },
    /* flow field with additive light trails */
    flow(x, w, h, r, n, p) {
      const g = x.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, rampCss(p, p.light ? 0.9 : 0.06));
      g.addColorStop(1, rampCss(p, p.light ? 0.78 : 0.01));
      x.fillStyle = g;
      x.fillRect(0, 0, w, h);
      const N = Math.min(2600, ((w * h) / 150) | 0),
        sc = 0.0021 * (0.7 + r() * 0.6);
      x.globalCompositeOperation = p.light ? "multiply" : "lighter";
      x.lineWidth = 0.55;
      for (let i = 0; i < N; i++) {
        let X = r() * w,
          Y = r() * h;
        const t = 0.5 + 0.5 * n(X * 0.002 + 9, Y * 0.002);
        x.beginPath();
        x.moveTo(X, Y);
        for (let s = 0; s < 110; s++) {
          const a = fbm(n, X * sc, Y * sc, 2) * TAU * 1.5;
          X += Math.cos(a) * 2;
          Y += Math.sin(a) * 2;
          x.lineTo(X, Y);
        }
        const ac = i % 53 == 0;
        x.strokeStyle = ac
          ? p.acc
          : rampCss(
              p,
              p.light ? 0.2 + 0.3 * t : 0.4 + 0.55 * t,
              p.light ? 0.22 : 0.13,
            );
        x.stroke();
      }
      x.globalCompositeOperation = "source-over";
    },
  };
  /* finishing: vignette + film grain from a shared tile */
  let grainTile = null;
  const grain = () => {
    if (grainTile) return grainTile;
    const c = document.createElement("canvas");
    c.width = c.height = 192;
    const g = c.getContext("2d"),
      im = g.createImageData(192, 192),
      r = R(99);
    for (let i = 0; i < im.data.length; i += 4) {
      const v = r() * 255;
      im.data[i] = im.data[i + 1] = im.data[i + 2] = v;
      im.data[i + 3] = 255;
    }
    g.putImageData(im, 0, 0);
    return (grainTile = c);
  };
  const finish = (x, w, h, p) => {
    const v = x.createRadialGradient(
      w * 0.5,
      h * 0.45,
      Math.min(w, h) * 0.25,
      w * 0.5,
      h * 0.5,
      Math.hypot(w, h) * 0.62,
    );
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(1, `rgba(0,0,0,${p.light ? 0.16 : 0.5})`);
    x.fillStyle = v;
    x.fillRect(0, 0, w, h);
    x.globalCompositeOperation = "overlay";
    x.globalAlpha = p.light ? 0.1 : 0.13;
    x.fillStyle = x.createPattern(grain(), "repeat");
    x.fillRect(0, 0, w, h);
    x.globalAlpha = 1;
    x.globalCompositeOperation = "source-over";
  };

  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || window.innerWidth < 768;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const size = (c, forceDpr) => {
    const w = c.clientWidth,
      h = c.clientHeight;
    if (!w || !h) return null;
    const d = forceDpr != null ? forceDpr : Math.min(1.5, devicePixelRatio || 1);
    c.width = Math.round(w * d);
    c.height = Math.round(h * d);
    const x = c.getContext("2d");
    x.setTransform(d, 0, 0, d, 0, 0);
    return { x, w, h };
  };
  const paint = (c) => {
    const kind = c.dataset.art;
    if (!ART[kind] || kind === "none") return;
    const s = size(c);
    if (!s) return;
    c._w = s.w;
    c._h = s.h;
    const seed = +c.dataset.seed || 1,
      p = Object.assign({}, PAL[c.dataset.pal] || PAL.night, {
        gain: +c.dataset.gain || 1,
        scale: +c.dataset.scale || 1,
      });
    s.x.fillStyle = p.bg;
    s.x.fillRect(0, 0, s.w, s.h);
    try {
      ART[kind](s.x, s.w, s.h, R(seed), NZ(seed), p);
    } catch (e) {
      console.error(e);
    }
    finish(s.x, s.w, s.h, p);
    c.classList.add("is-painted");
  };
  /* live particles: transparent layer with additive trails, over the satin */
  const live = (c) => {
    const n = NZ(+c.dataset.seed || 7),
      acc = "215,255,63";
    let S = null,
      parts = [],
      t = 0,
      on = false,
      raf = 0,
      lastTick = 0;
    // Mobile: far fewer particles, ~30fps throttle
    const maxParts = isMobile ? 400 : 2600;
    const fpsInterval = isMobile ? 1000 / 30 : 0;
    const spawn = (w, h) => ({
      x: Math.random() * w,
      y: h * (0.15 + Math.random() * 0.95),
      l: 80 + Math.random() * 240,
      a: Math.random() < 0.04,
    });
    const step = () => {
      const { x, w, h } = S;
      x.globalCompositeOperation = "destination-out";
      x.fillStyle = "rgba(0,0,0,.05)";
      x.fillRect(0, 0, w, h);
      x.globalCompositeOperation = "lighter";
      const sc = 0.0016,
        A = new Path2D(),
        B = new Path2D();
      for (const q of parts) {
        const a = fbm(n, q.x * sc + t, q.y * sc - t * 0.7, 2) * TAU * 1.6;
        const nx = q.x + Math.cos(a) * 1.5,
          ny = q.y + Math.sin(a) * 1.5 - 0.5;
        (q.a ? B : A).moveTo(q.x, q.y);
        (q.a ? B : A).lineTo(nx, ny);
        q.x = nx;
        q.y = ny;
        if (--q.l < 0 || nx < -5 || nx > w + 5 || ny < -5)
          Object.assign(q, spawn(w, h), { y: h + 2 });
      }
      x.lineWidth = 0.8;
      x.strokeStyle = "rgba(255,236,214,.13)";
      x.stroke(A);
      x.strokeStyle = `rgba(${acc},.5)`;
      x.stroke(B);
      x.globalCompositeOperation = "source-over";
      t += 0.0012;
    };
    const setup = () => {
      S = size(c, isMobile ? 1 : undefined);
      if (!S) return;
      S.x.clearRect(0, 0, S.w, S.h);
      const N = Math.min(maxParts, ((S.w * S.h) / 560) | 0);
      parts = Array.from({ length: N }, () => spawn(S.w, S.h));
      // Skip pre-warm on mobile to avoid blocking main thread
      if (!isMobile) for (let i = 0; i < 70; i++) step();
    };
    const loop = (now) => {
      if (!on) return;
      if (S) {
        if (fpsInterval === 0 || now - lastTick >= fpsInterval) {
          step();
          lastTick = now;
        }
      }
      raf = requestAnimationFrame(loop);
    };

    new IntersectionObserver((es) => {
      const v = es[0].isIntersecting && !document.hidden;
      if (v && !on) {
        on = true;
        loop();
      } else if (!v) {
        on = false;
        cancelAnimationFrame(raf);
      }
    }).observe(c);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        on = false;
        cancelAnimationFrame(raf);
      }
    });
    c._live = { resize: setup };
  };
  /* lazy, time-sliced painting */
  const queue = new Set();
  let busy = false;
  const pump = () => {
    const t0 = performance.now();
    for (const c of queue) {
      queue.delete(c);
      if (c._near) paint(c);
      else c._dirty = true;
      if (performance.now() - t0 > 10) break;
    }
    if (queue.size) requestAnimationFrame(pump);
    else busy = false;
  };
  const want = (c) => {
    if (!c._near) {
      c._dirty = true;
      return;
    }
    queue.add(c);
    if (!busy) {
      busy = true;
      requestAnimationFrame(pump);
    }
  };
  const io = new IntersectionObserver(
    (es) =>
      es.forEach((e) => {
        const c = e.target;
        c._near = e.isIntersecting;
        if (c._near && c._dirty) {
          c._dirty = false;
          want(c);
        }
      }),
    { rootMargin: "900px 0px" },
  );
  const ro = new ResizeObserver((es) =>
    es.forEach((e) => {
      const c = e.target;
      if (c._live) return c._live.resize();
      if (c.clientWidth === c._w && c.clientHeight === c._h) return;
      c._dirty = true;
      if (c._near) {
        c._dirty = false;
        want(c);
      }
    }),
  );
  const seen = new WeakSet();
  window.artInit = (root) =>
    root.querySelectorAll("canvas.art").forEach((c) => {
      if (seen.has(c)) return;
      seen.add(c);
      if (c.hasAttribute("data-live")) {
        if (!reduce) {
          live(c);
          ro.observe(c);
        }
        return;
      }
      c._dirty = true;
      io.observe(c);
      ro.observe(c);
    });
  artInit(document);
})();

(() => {
  const root = document.documentElement;
  const init = (sel, fn) =>
    document.querySelectorAll(sel).forEach((el) => {
      try {
        fn(el);
      } catch (e) {
        console.error(e);
      }
    });
  const cssVar = (name) => getComputedStyle(root).getPropertyValue(name).trim();
  const px = (name) => parseFloat(cssVar(name)) || 0;
  init(".site-header", (header) => {
    const btn = header.querySelector(".menu-btn");
    if (!btn) return;
    const set = (open) => {
      header.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    };
    btn.addEventListener("click", () =>
      set(!header.classList.contains("is-open")),
    );
    header
      .querySelectorAll(".nav a")
      .forEach((a) => a.addEventListener("click", () => set(false)));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") set(false);
    });
  });
  init("form[data-sent]", (form) => {
    const status = form.querySelector(".form-status");
    const btn = form.querySelector("[type=submit]");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }
      if (status) { status.textContent = ""; status.style.color = ""; }
      try {
        const data = new FormData(form);
        data.append("access_key", "YOUR_WEB3FORMS_KEY"); // ← replace with key from web3forms.com
        data.append("subject", "New inquiry from Lumoqra website");
        data.append("from_name", "Lumoqra Website");
        const res = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          body: data,
        });
        const json = await res.json();
        if (json.success) {
          if (status) status.textContent = form.dataset.sent || "Message sent!";
          form.reset();
        } else {
          throw new Error(json.message || "Submission failed");
        }
      } catch (err) {
        if (status) {
          status.textContent = "Something went wrong. Please email us directly at lumoqra@gmail.com";
          status.style.color = "var(--ember)";
        }
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = "Submit Inquiry"; }
      }
    });
  });
  if (!root.classList.contains("motion")) {
    console.warn("[Lumoqra] .motion class missing: animations disabled");
    return;
  }
  if (!window.gsap || !window.ScrollTrigger) {
    console.error("[Lumoqra] GSAP or ScrollTrigger failed to load: animations disabled");
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({
    autoRefreshEvents: "visibilitychange,DOMContentLoaded,resize",
  });
  // ── Global Smooth Scrolling (Lenis / Locomotive Style) ───────────
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.25,
      infinite: false,
    });

    lenis.on("scroll", ScrollTrigger.update);

    // Sync with GSAP requestAnimationFrame ticker
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  } else {
    window.addEventListener("scroll", () => ScrollTrigger.update(), { passive: true });
  }

  // ── Hero to Services Snap Controller (Mobile & Desktop) ──────────
  // Specifically snaps from Hero into Services when scrolling down,
  // and back to Hero when scrolling up from Services. Everywhere else is free scrolling.
  const getServicesTop = () => {
    const services = document.getElementById("services");
    if (!services) return window.innerHeight;
    const header = document.querySelector(".site-header");
    const headerH = header ? header.offsetHeight : 0;
    return Math.max(0, services.offsetTop - headerH);
  };

  let isHeroSnapping = false;
  let heroSnapCooldown = 0;

  const snapHeroService = (targetPos) => {
    isHeroSnapping = true;
    if (lenis) {
      lenis.scrollTo(targetPos, {
        duration: 0.95,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        onComplete: () => {
          setTimeout(() => {
            isHeroSnapping = false;
          }, 80);
        },
      });
    } else {
      window.scrollTo({ top: targetPos, behavior: "smooth" });
      setTimeout(() => {
        isHeroSnapping = false;
      }, 600);
    }
  };

  // Wheel interception: Hero <-> Services snap only
  window.addEventListener(
    "wheel",
    (e) => {
      if (isHeroSnapping) {
        e.preventDefault();
        return;
      }
      const now = Date.now();
      if (now - heroSnapCooldown < 350) return;

      const servicesTop = getServicesTop();
      const currentY = lenis ? lenis.scroll : (window.pageYOffset || document.documentElement.scrollTop);

      // In Hero scrolling DOWN -> snap directly to Services
      if (currentY < servicesTop * 0.75 && e.deltaY > 4) {
        e.preventDefault();
        heroSnapCooldown = now;
        snapHeroService(servicesTop);
      }
      // At top of Services scrolling UP -> snap back to Hero
      else if (currentY > 20 && currentY <= servicesTop + 60 && e.deltaY < -4) {
        e.preventDefault();
        heroSnapCooldown = now;
        snapHeroService(0);
      }
    },
    { passive: false }
  );

  // Mobile Touch Swipe: Hero <-> Services snap only
  let touchStartHeroY = 0;
  window.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length === 1) touchStartHeroY = e.touches[0].clientY;
    },
    { passive: true }
  );

  window.addEventListener(
    "touchend",
    (e) => {
      if (isHeroSnapping) return;
      const diffY = touchStartHeroY - e.changedTouches[0].clientY;
      const servicesTop = getServicesTop();
      const currentY = lenis ? lenis.scroll : (window.pageYOffset || document.documentElement.scrollTop);

      // Swiped UP in Hero (scroll down) -> snap to Services
      if (currentY < servicesTop * 0.75 && diffY > 30) {
        snapHeroService(servicesTop);
      }
      // Swiped DOWN at Services (scroll up) -> snap to Hero
      else if (currentY > 20 && currentY <= servicesTop + 80 && diffY < -30) {
        snapHeroService(0);
      }
    },
    { passive: true }
  );

  // Smooth anchor navigation
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (!id || id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const header = document.querySelector(".site-header");
      const headerH = header ? header.offsetHeight : 0;
      if (lenis) {
        lenis.scrollTo(target, {
          offset: id === "#hero" ? 0 : -headerH,
          duration: 1.2,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        });
      } else {
        const targetY = id === "#hero" ? 0 : Math.max(0, target.offsetTop - headerH);
        window.scrollTo({ top: targetY, behavior: "smooth" });
      }
    });
  });
  const docPos = (el) => {
    let x = 0,
      y = 0;
    for (let n = el; n; n = n.offsetParent) {
      x += n.offsetLeft;
      y += n.offsetTop;
    }
    return { x, y };
  };
  const splitWords = (el, cls = "w") => {
    const out = [];
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(part));
              return;
            }
            const s = document.createElement("span");
            s.className = cls;
            s.textContent = part;
            frag.appendChild(s);
            out.push(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.classList.contains("stop")) walk(n);
      });
    };
    walk(el);
    return out;
  };
  const addStop = (title) => {
    if (!title || !title.classList.contains("dot")) return null;
    let st = title.querySelector(".stop");
    if (!st) {
      st = document.createElement("span");
      st.className = "stop";
      st.setAttribute("aria-hidden", "true");
      title.appendChild(st);
    }
    title.classList.add("has-stop");
    return st;
  };
  const splitChars = (el) => {
    const chars = [];
    splitWords(el, "wd").forEach((w) => {
      const t = w.textContent;
      w.textContent = "";
      [...t].forEach((c) => {
        const s = document.createElement("span");
        s.className = "ch";
        s.textContent = c;
        w.appendChild(s);
        chars.push(s);
      });
    });
    return chars;
  };
  const headerH = () => {
    const h = document.querySelector(".site-header");
    return h ? h.offsetHeight : 0;
  };
  const relPos = (el, anc) => {
    let x = 0,
      y = 0;
    for (let n = el; n && n !== anc; n = n.offsetParent) {
      x += n.offsetLeft;
      y += n.offsetTop;
    }
    return { x, y };
  };
  const fx = [];
  const add = (sel, run, prep) => fx.push({ sel, run, prep });
  // Hero animation removed — simple hero--simple layout no longer uses scroll animations
  add(".projects-list", (grid) => {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 761px)", () => {
      const cards = [...grid.querySelectorAll(".pcard")];
      // Stagger the middle card down slightly for a layered feel
      cards.forEach((card, i) => {
        const offset = i === 1 ? 60 : i === 2 ? 30 : 0;
        if (offset === 0) return;
        gsap.fromTo(
          card,
          { y: offset },
          {
            y: -offset,
            ease: "none",
            scrollTrigger: {
              trigger: card,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      });
    });
  });
  // Services circle-flood animation removed — tabs UI replaces accordion/svc-track
  add(
    ".process",
    (sec, d) => {
      const { track, split, title, fig, a, b, over } = d;
      const img = fig.querySelector(".art");
      const cap = fig.querySelector("figcaption");
      const log = fig.querySelector(".split-log");
      const pad = () => parseFloat(getComputedStyle(title).paddingLeft) || 0;
      const shiftA = () => -(relPos(a, split).x - pad());
      const shiftB = () =>
        split.clientWidth - pad() - (relPos(b, split).x + b.offsetWidth);
      const r = px("--r-xl");
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: track,
          start: () => "top " + headerH(),
          end: () => "bottom bottom-=" + px("--frame"),
          scrub: true,
          invalidateOnRefresh: true,
        },
      });
      tl.fromTo(
        fig,
        {
          opacity: 0,
          clipPath: "inset(50% 49.5% 50% 49.5% round 14px)",
        },
        {
          opacity: 1,
          duration: 0.18,
          ease: "power1.out",
        },
        0.05,
      )
        .fromTo(
          fig,
          {
            clipPath: "inset(48% 49.5% 48% 49.5% round 14px)",
          },
          {
            clipPath: `inset(0% 0% 0% 0% round ${r}px)`,
            ease: "power2.inOut",
            duration: 0.95,
          },
          0.05,
        );
      // Text split animation: desktop only (wrapping on mobile breaks x-offset calc)
      gsap.matchMedia().add("(min-width: 761px)", () => {
        tl.fromTo(
          [a, over.querySelector(".half-a")],
          { x: 0 },
          { x: shiftA, ease: "power2.inOut", duration: 0.9 },
          0,
        ).fromTo(
          [b, over.querySelector(".half-b")],
          { x: 0 },
          { x: shiftB, ease: "power2.inOut", duration: 0.9 },
          0,
        );
      });
      if (img)
        tl.fromTo(
          img,
          { scale: 1.35 },
          { scale: 1, ease: "power2.out", duration: 1 },
          0,
        );
      if (cap)
        tl.fromTo(
          cap,
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.2 },
          0.85,
        );
      if (log)
        tl.fromTo(
          log,
          { opacity: 0, y: -16 },
          { opacity: 1, y: 0, duration: 0.2 },
          0.8,
        );
      tl.to({}, { duration: 0.15 });
    },
    (sec) => {
      const track = sec.querySelector(".split-track");
      const split = sec.querySelector("[data-split]");
      const title = split && split.querySelector(".split-title");
      const fig = split && split.querySelector(".split-photo");
      if (!track || !title || !fig) return null;
      addStop(title);
      const words = splitWords(title);
      if (!words.length) return null;
      const cut = Math.ceil(words.length / 2);
      const a = document.createElement("span"),
        b = document.createElement("span");
      a.className = "half half-a";
      b.className = "half half-b";
      let seen = 0,
        gap = null;
      [...title.childNodes].forEach((n) => {
        if (n.nodeType === 1 && n.classList.contains("w")) {
          seen++;
          (seen > cut ? b : a).appendChild(n);
        } else if (n.nodeType === 3 && seen === cut && !gap) gap = n;
        else (seen > cut ? b : a).appendChild(n);
      });
      title.textContent = "";
      title.append(a, gap || document.createTextNode(" "), b);
      const over = document.createElement("div");
      over.className = "split-over";
      over.setAttribute("aria-hidden", "true");
      over.appendChild(title.cloneNode(true));
      fig.insertBefore(over, fig.querySelector(".split-log"));
      return { track, split, title, fig, a, b, over };
    },
  );
  add(
    "[data-marquee]",
    (box, track) => {
      const tween = gsap.to(track, {
        xPercent: -50,
        ease: "none",
        repeat: -1,
        duration: Math.max(20, track.scrollWidth / 2 / 38),
        paused: true,
      });
      let hover = false,
        seen = false;
      const sync = () => (hover || !seen ? tween.pause() : tween.play());
      box.addEventListener("mouseenter", () => {
        hover = true;
        sync();
      });
      box.addEventListener("mouseleave", () => {
        hover = false;
        sync();
      });
      box.addEventListener("focusin", () => {
        hover = true;
        sync();
      });
      box.addEventListener("focusout", () => {
        hover = false;
        sync();
      });
      ScrollTrigger.create({
        trigger: box,
        start: "top bottom",
        end: "bottom top",
        onToggle: (s) => {
          seen = s.isActive;
          sync();
        },
      });
    },
    (box) => {
      const track = box.querySelector(".marquee-track");
      if (!track || !track.children.length) return null;
      [...track.children].forEach((li) => {
        const c = li.cloneNode(true);
        c.setAttribute("aria-hidden", "true");
        c.querySelectorAll("a,button").forEach((el) =>
          el.setAttribute("tabindex", "-1"),
        );
        track.appendChild(c);
      });
      if (window.artInit) artInit(track);
      return track;
    },
  );
  add("[data-loops]", (sec) => {
    ScrollTrigger.create({
      trigger: sec,
      start: "top bottom",
      end: "bottom top",
      onToggle: (s) => sec.classList.toggle("is-off", !s.isActive),
    });
  });
  add(
    "[data-ink]",
    (el, words) => {
      gsap.fromTo(
        words,
        { opacity: 0.16 },
        {
          opacity: 1,
          ease: "none",
          stagger: 0.12,
          scrollTrigger: {
            trigger: el,
            start: "top 82%",
            end: "bottom 50%",
            scrub: true,
          },
        },
      );
    },
    (el) => {
      const w = splitWords(el);
      return w.length ? w : null;
    },
  );
  const speedGroups = new Set();
  add("[data-speed]", (el) => {
    const group = el.parentElement;
    if (!group || speedGroups.has(group)) return;
    speedGroups.add(group);
    const items = [...group.children].filter((c) =>
      parseFloat(c.dataset.speed),
    );
    if (!items.length) return;
    const k = (c) => () =>
      parseFloat(c.dataset.speed) *
      window.innerHeight *
      (window.innerWidth < 761 ? 0.35 : 1);
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: group,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
        invalidateOnRefresh: true,
      },
    });
    items.forEach((c) => {
      const f = k(c);
      tl.fromTo(c, { y: f }, { y: () => -f(), duration: 1 }, 0);
    });
  });
  add(
    "[data-rise]",
    (el, chars) => {
      gsap.fromTo(
        chars,
        { yPercent: 130 },
        {
          yPercent: 0,
          ease: "power3.out",
          duration: 1.1,
          stagger: 0.045,
          scrollTrigger: {
            trigger: el,
            start: "top 92%",
            toggleActions: "play none none reverse",
          },
        },
      );
    },
    (el) => {
      const chars = splitChars(el);
      if (!chars.length) return null;
      const st = addStop(el);
      if (st) {
        const w = document.createElement("span");
        w.className = "wd";
        st.replaceWith(w);
        w.appendChild(st);
        chars.push(st);
      }
      el.classList.add("is-split");
      return chars;
    },
  );
  const start = () => {
    const jobs = [];
    document.querySelectorAll(fx.map((f) => f.sel).join(",")).forEach((el) =>
      fx.forEach((f) => {
        if (!el.matches(f.sel)) return;
        let data;
        if (f.prep) {
          try {
            data = f.prep(el);
          } catch (e) {
            console.error(e);
            return;
          }
          if (data == null) return;
        }
        jobs.push(() => {
          try {
            f.run(el, data);
          } catch (e) {
            console.error(e);
          }
        });
      }),
    );
    const ch = new MessageChannel();
    const next = () => {
      const t0 = performance.now();
      do {
        const j = jobs.shift();
        if (j) j();
      } while (jobs.length && performance.now() - t0 < 8);
      if (jobs.length) {
        ch.port2.postMessage(0);
      } else {
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      }
    };
    ch.port1.onmessage = next;
    ch.port2.postMessage(0);
  };
  let started = false;
  const boot = () => {
    if (started) return;
    started = true;
    start();
  };
  if (document.fonts && document.fonts.status !== "loaded") {
    document.fonts.ready.then(boot).catch(boot);
    setTimeout(boot, 1200);
  } else {
    boot();
  }
})();


/* ── Services Tab Switcher ─────────────────────────────────────── */
(function () {
  const nav = document.querySelector(".svc-tab-nav");
  if (!nav) return;
  const btns = nav.querySelectorAll(".svc-tab-btn");
  const panels = document.querySelectorAll(".svc-tab-panel");

  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      // Update buttons
      btns.forEach((b) => {
        b.classList.remove("is-active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("is-active");
      btn.setAttribute("aria-selected", "true");
      // Update panels
      panels.forEach((p) => p.classList.remove("is-active"));
      const target = document.querySelector(`.svc-tab-panel[data-panel="${tab}"]`);
      if (target) target.classList.add("is-active");
    });
  });
})();


/* ── React Bits: Shape Grid (Official vanilla port) ────────────────────────── */
(function () {
  const container = document.getElementById('hero-shape-grid');
  if (!container) return;

  let canvas = container.querySelector('canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.className = 'shape-grid-canvas';
    container.appendChild(canvas);
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const SHAPES = ['square', 'tile', 'hexagon', 'triangle', 'diamond', 'circle', 'cross', 'dot'];
  const DIRECTIONS = {
    right: [1, 0],
    left: [-1, 0],
    up: [0, -1],
    down: [0, 1],
    diagonal: [Math.SQRT1_2, -Math.SQRT1_2],
    none: [0, 0]
  };
  const SQRT3 = Math.sqrt(3);
  const OFFSET = 32768;
  const FAR = 2.5;
  const MAX_PIXELS = 8e6;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const smoothstep = (edge0, edge1, value) => {
    const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  };

  const smootherstep = t => t * t * t * (t * (t * 6 - 15) + 10);

  const hash = (i, j) => {
    const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
    return s - Math.floor(s);
  };

  const keyOf = (i, j) => (i + OFFSET) * 65536 + (j + OFFSET);

  const fadeMask = amount => {
    if (amount <= 0) return 'none';
    const edge = amount * 26;
    const stops = [];
    for (let k = 0; k <= 8; k++) {
      const t = k / 8;
      stops.push(`rgba(0, 0, 0, ${smootherstep(t).toFixed(3)}) ${(t * edge).toFixed(2)}%`);
    }
    const inner = stops.join(', ');
    const outer = [...stops]
      .reverse()
      .map(stop => stop.replace(/ ([\d.]+)%$/, (_, value) => ` ${(100 - parseFloat(value)).toFixed(2)}%`))
      .join(', ');
    const axis = direction => `linear-gradient(${direction}, ${inner}, ${outer})`;
    return `${axis('to right')}, ${axis('to bottom')}`;
  };

  const lightnessOf = color => {
    let hex = String(color).trim().replace(/^#/, '');
    if (hex.length === 3 || hex.length === 4) hex = hex.replace(/./g, '$&$&');
    hex = hex.slice(0, 6);
    if (!/^[0-9a-f]{6}$/i.test(hex)) return 0.6;
    const value = parseInt(hex, 16);
    const channels = [value >> 16, (value >> 8) & 255, value & 255];
    return (Math.max(...channels) + Math.min(...channels)) / 510;
  };

  const tint = (hue, lightness) =>
    `hsl(${(((hue % 360) + 360) % 360).toFixed(1)}, 90%, ${(lightness * 100).toFixed(1)}%)`;

  const multiply = (a, b) =>
    [0, 1, 2, 3, 4, 5, 6, 7, 8].map(k => {
      const r = k - (k % 3);
      const c = k % 3;
      return a[r] * b[c] + a[r + 1] * b[c + 3] + a[r + 2] * b[c + 6];
    });

  const invert = m => {
    const [a, b, c, d, e, f, g, h, i] = m;
    const A = e * i - f * h;
    const B = f * g - d * i;
    const C = d * h - e * g;
    const det = a * A + b * B + c * C;
    return [A, c * h - b * i, b * f - c * e, B, a * i - c * g, c * d - a * f, C, b * g - a * h, a * e - b * d].map(
      value => value / det
    );
  };

  const project = (m, x, y) => {
    const w = m[6] * x + m[7] * y + m[8];
    return [(m[0] * x + m[1] * y + m[2]) / w, (m[3] * x + m[4] * y + m[5]) / w];
  };

  const flatView = (width, height) => ({
    x0: 0,
    y0: 0,
    width,
    height,
    inverse: null,
    transform: 'none',
    mist: null,
    far: FAR,
    reach: Math.hypot(width, height) / 2
  });

  const viewFor = (tiltX, tiltY, width, height, cellSize) => {
    if (!tiltX && !tiltY) return flatView(width, height);
    const ax = (tiltX * Math.PI) / 180;
    const ay = (tiltY * Math.PI) / 180;
    const depth = Math.max(width, height) * 1.25;
    const cx = width / 2;
    const cy = height / 2;
    const tilt = [
      Math.cos(ay),
      0,
      0,
      Math.sin(ax) * Math.sin(ay),
      Math.cos(ax),
      0,
      (Math.sin(ay) * Math.cos(ax)) / depth,
      -Math.sin(ax) / depth,
      1
    ];
    const forward = multiply(multiply([1, 0, cx, 0, 1, cy, 0, 0, 1], tilt), [1, 0, -cx, 0, 1, -cy, 0, 0, 1]);
    const inverse = invert(forward);
    const facing = Math.cos(ax) * Math.cos(ay);
    const far = clamp(Math.sqrt((facing * cellSize) / 5), 1.15, FAR);
    const near = Math.min(Math.sqrt((facing * cellSize) / 14), far - 0.35);
    const nearness = (x, y) => inverse[6] * x + inverse[7] * y + inverse[8] - 1 / far;
    const corners = [
      [0, 0],
      [width, 0],
      [width, height],
      [0, height]
    ];
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    const include = (x, y) => {
      const [px, py] = project(inverse, x, y);
      x0 = Math.min(x0, px);
      y0 = Math.min(y0, py);
      x1 = Math.max(x1, px);
      y1 = Math.max(y1, py);
    };
    corners.forEach((a, k) => {
      const b = corners[(k + 1) % 4];
      const na = nearness(a[0], a[1]);
      const nb = nearness(b[0], b[1]);
      if (na >= 0) include(a[0], a[1]);
      if (na >= 0 !== nb >= 0) {
        const t = na / (na - nb);
        include(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t);
      }
    });
    if (!(x1 > x0 && y1 > y0)) return flatView(width, height);
    x0 = Math.floor(x0 / 16) * 16;
    y0 = Math.floor(y0 / 16) * 16;
    x1 = Math.ceil(x1 / 16) * 16;
    y1 = Math.ceil(y1 / 16) * 16;
    const m = multiply(forward, [1, 0, x0, 0, 1, y0, 0, 0, 1]);
    const transform = `matrix3d(${[m[0], m[3], 0, m[6], m[1], m[4], 0, m[7], 0, 0, 1, 0, m[2], m[5], 0, m[8]].join(', ')})`;
    const gx = forward[6];
    const gy = forward[7];
    const slope = Math.hypot(gx, gy);
    const mist =
      slope > 1e-9
        ? [
            cx + (gx / slope) * ((near - 1) / slope),
            cy + (gy / slope) * ((near - 1) / slope),
            cx + (gx / slope) * ((far - 1) / slope),
            cy + (gy / slope) * ((far - 1) / slope)
          ]
        : null;
    const reach = Math.max(
      Math.hypot(x0 - cx, y0 - cy),
      Math.hypot(x1 - cx, y0 - cy),
      Math.hypot(x1 - cx, y1 - cy),
      Math.hypot(x0 - cx, y1 - cy)
    );
    return { x0, y0, width: x1 - x0, height: y1 - y0, inverse, transform, mist, far, reach };
  };

  const layoutFor = (shape, size) => {
    if (shape === 'hexagon') {
      const radius = size / SQRT3;
      return { stepX: radius * 1.5, stepY: size, radius };
    }
    if (shape === 'triangle') {
      const side = (size * 2) / SQRT3;
      return { stepX: side / 2, stepY: size, side };
    }
    return { stepX: size, stepY: size };
  };

  const centerOf = (shape, layout, i, j) => {
    const { stepX, stepY } = layout;
    if (shape === 'hexagon') return [i * stepX, j * stepY + (Math.abs(i) % 2 === 1 ? stepY / 2 : 0)];
    if (shape === 'triangle') {
      const up = (((i + j) % 2) + 2) % 2 === 0;
      return [i * stepX, j * stepY + (up ? stepY * (2 / 3) : stepY / 3)];
    }
    if (shape === 'cross' || shape === 'dot') return [i * stepX, j * stepY];
    return [(i + 0.5) * stepX, (j + 0.5) * stepY];
  };

  const traceCell = (ctx, shape, layout, size, i, j, x, y, inset) => {
    if (shape === 'hexagon') {
      const r = layout.radius - inset;
      for (let k = 0; k < 6; k++) {
        const angle = (Math.PI / 3) * k;
        const px = x + r * Math.cos(angle);
        const py = y + r * Math.sin(angle);
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
    } else if (shape === 'triangle') {
      const up = (((i + j) % 2) + 2) % 2 === 0;
      const half = layout.side / 2 - inset * 1.7;
      const height = size - inset * 2.6;
      const top = up ? y - height * (2 / 3) : y + height * (2 / 3);
      const base = up ? y + height / 3 : y - height / 3;
      ctx.moveTo(x, top);
      ctx.lineTo(x + half, base);
      ctx.lineTo(x - half, base);
      ctx.closePath();
    } else if (shape === 'diamond') {
      const r = size / 2 - inset;
      ctx.moveTo(x, y - r);
      ctx.lineTo(x + r, y);
      ctx.lineTo(x, y + r);
      ctx.lineTo(x - r, y);
      ctx.closePath();
    } else if (shape === 'circle') {
      ctx.moveTo(x + size / 2 - inset, y);
      ctx.arc(x, y, Math.max(0.5, size / 2 - inset), 0, Math.PI * 2);
    } else if (shape === 'tile') {
      const half = size / 2 - Math.max(inset, size * 0.06);
      const r = Math.min(half, size * 0.22);
      ctx.roundRect(x - half, y - half, half * 2, half * 2, r);
    } else if (shape === 'cross') {
      const arm = size * 0.16 + inset;
      ctx.moveTo(x - arm, y);
      ctx.lineTo(x + arm, y);
      ctx.moveTo(x, y - arm);
      ctx.lineTo(x, y + arm);
    } else if (shape === 'dot') {
      const r = size * 0.05 + inset;
      ctx.moveTo(x + r, y);
      ctx.arc(x, y, r, 0, Math.PI * 2);
    } else {
      const half = size / 2 - inset;
      ctx.rect(x - half, y - half, half * 2, half * 2);
    }
  };

  // React Bits ShapeGrid Settings configured for Lumoqra Brand Palette:
  // - Dark violet lines (#2b1b4a / rgba(196,181,253,0.18))
  // - Vibrant glowing hover border (#a78bfa / #c4b5fd)
  // - Violet glow fill (#8b5cf6 with fillOpacity 0.18)
  // - Perspective tilt (tiltX: 18, tiltY: -12)
  // - Diagonal drift with responsive speed
  const settings = {
    shape: 'square',
    cellSize: 42,
    lineWidth: 1,
    direction: 'diagonal',
    speed: 0.35,
    lineColor: 'rgba(196, 181, 253, 0.14)',
    hoverColor: '#c4b5fd',
    hoverFillColor: 'rgba(139, 92, 246, 0.22)',
    fillOpacity: 0.22,
    rainbow: false,
    tone: 0.6,
    tiltX: 16,
    tiltY: -10,
    radius: 1.8,
    trail: 0.7,
    glow: 0.45,
    twinkle: 0.15,
    clickCascade: true,
    intro: true,
    paused: false,
    dpr: Math.min(window.devicePixelRatio || 1, 2)
  };

  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  const state = {
    alive: true,
    raf: 0,
    last: 0,
    time: 0,
    visible: true,
    width: 1,
    height: 1,
    ratio: 1,
    view: flatView(1, 1),
    offsetX: 0,
    offsetY: 0,
    started: false,
    startedAt: 0,
    inside: false,
    pointerX: 0,
    pointerY: 0,
    spotX: 0,
    spotY: 0,
    spotVX: 0,
    spotVY: 0,
    spotPower: 0,
    lit: new Map(),
    hues: new Map(),
    cascades: [],
    cascadeHue: 0
  };

  const resize = () => {
    const s = settings;
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    const view = viewFor(s.tiltX, s.tiltY, width, height, s.cellSize);
    let ratio = s.dpr ?? Math.min(window.devicePixelRatio || 1, 2);
    const pixels = view.width * view.height * ratio * ratio;
    if (pixels > MAX_PIXELS) ratio *= Math.sqrt(MAX_PIXELS / pixels);
    state.width = width;
    state.height = height;
    state.ratio = ratio;
    state.view = view;
    const pixelWidth = Math.max(1, Math.round(view.width * ratio));
    const pixelHeight = Math.max(1, Math.round(view.height * ratio));
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    const cssWidth = `${view.width}px`;
    const cssHeight = `${view.height}px`;
    if (canvas.style.width !== cssWidth) canvas.style.width = cssWidth;
    if (canvas.style.height !== cssHeight) canvas.style.height = cssHeight;
    if (canvas.style.transform !== view.transform) canvas.style.transform = view.transform;
  };

  const toPlane = (x, y) => {
    const { inverse, far } = state.view;
    if (!inverse) return [x, y];
    if (inverse[6] * x + inverse[7] * y + inverse[8] < 1 / far) return null;
    return project(inverse, x, y);
  };

  const range = (layout, margin) => {
    const { stepX, stepY } = layout;
    const { view } = state;
    return [
      Math.floor((state.offsetX + view.x0 - margin) / stepX) - 1,
      Math.ceil((state.offsetX + view.x0 + view.width + margin) / stepX) + 1,
      Math.floor((state.offsetY + view.y0 - margin) / stepY) - 1,
      Math.ceil((state.offsetY + view.y0 + view.height + margin) / stepY) + 1
    ];
  };

  const nearestCell = (s, layout, wx, wy) => {
    const { stepX, stepY } = layout;
    const ci = Math.round(wx / stepX);
    const cj = Math.round(wy / stepY);
    let best = Infinity;
    let cell = [ci, cj];
    for (let i = ci - 2; i <= ci + 2; i++) {
      for (let j = cj - 2; j <= cj + 2; j++) {
        const [x, y] = centerOf(s.shape, layout, i, j);
        const d = (x - wx) ** 2 + (y - wy) ** 2;
        if (d < best) {
          best = d;
          cell = [i, j];
        }
      }
    }
    return cell;
  };

  const illuminate = (s, layout, dt) => {
    const decay = Math.exp(-dt / s.trail);
    for (const [key, value] of state.lit) {
      const next = value * decay;
      if (next < 0.004) {
        state.lit.delete(key);
        state.hues.delete(key);
      } else state.lit.set(key, next);
    }
    if (state.spotPower < 0.01) return;
    const wx = state.spotX + state.offsetX;
    const wy = state.spotY + state.offsetY;
    const reach = Math.max(s.radius, 0.5) * s.cellSize;
    const [hi, hj] = nearestCell(s, layout, wx, wy);
    const spanI = Math.ceil(reach / layout.stepX) + 2;
    const spanJ = Math.ceil(reach / layout.stepY) + 2;
    const hue = state.time * 120;
    for (let i = hi - spanI; i <= hi + spanI; i++) {
      for (let j = hj - spanJ; j <= hj + spanJ; j++) {
        const [x, y] = centerOf(s.shape, layout, i, j);
        const distance = Math.hypot(x - wx, y - wy);
        let value = s.radius > 0 ? smoothstep(reach, reach * 0.15, distance) : 0;
        if (i === hi && j === hj) value = Math.max(value, 1);
        value *= state.spotPower;
        if (value <= 0.004) continue;
        const key = keyOf(i, j);
        if (value > (state.lit.get(key) ?? 0)) {
          state.lit.set(key, value);
          state.hues.set(key, hue + ((x + y) / s.cellSize) * 12);
        }
      }
    }
  };

  const cascadeAt = (s, x, y) => {
    let value = 0;
    for (const cascade of state.cascades) {
      const ring = Math.round(Math.hypot(x - cascade.x, y - cascade.y) / s.cellSize);
      const local = state.time - cascade.time - ring * 0.055;
      if (local < 0) continue;
      const pulse = Math.exp(-((local / 0.085) ** 2)) * cascade.power * Math.max(0, 1 - ring / cascade.reach);
      if (pulse > value) {
        value = pulse;
        state.cascadeHue = cascade.hue + ring * 16;
      }
    }
    return value;
  };

  const draw = () => {
    const s = settings;
    const { view, ratio } = state;
    const layout = layoutFor(s.shape, s.cellSize);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(ratio, 0, 0, ratio, -view.x0 * ratio, -view.y0 * ratio);

    const left = view.x0;
    const top = view.y0;
    const right = view.x0 + view.width;
    const bottom = view.y0 + view.height;
    const size = s.cellSize;
    const [i0, i1, j0, j1] = range(layout, size);
    const markers = s.shape === 'cross' || s.shape === 'dot';
    const elapsed = state.time - state.startedAt;
    const introRadius = s.intro && !reduce ? elapsed * view.reach * 1.8 : Infinity;
    const originX = state.width / 2;
    const originY = state.height / 2;
    const centerX = originX + state.offsetX;
    const centerY = originY + state.offsetY;

    ctx.lineWidth = s.lineWidth;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = s.lineColor;
    ctx.fillStyle = s.lineColor;
    ctx.beginPath();
    if (s.shape === 'square') {
      for (let i = i0; i <= i1; i++) {
        const x = i * layout.stepX - state.offsetX;
        ctx.moveTo(x, top - size);
        ctx.lineTo(x, bottom + size);
      }
      for (let j = j0; j <= j1; j++) {
        const y = j * layout.stepY - state.offsetY;
        ctx.moveTo(left - size, y);
        ctx.lineTo(right + size, y);
      }
    } else {
      for (let i = i0; i <= i1; i++) {
        for (let j = j0; j <= j1; j++) {
          const [cx, cy] = centerOf(s.shape, layout, i, j);
          traceCell(ctx, s.shape, layout, size, i, j, cx - state.offsetX, cy - state.offsetY, 0);
        }
      }
    }
    if (s.shape === 'dot') ctx.fill();
    else ctx.stroke();

    if (introRadius !== Infinity) {
      const gradient = ctx.createRadialGradient(originX, originY, 0, originX, originY, Math.max(1, introRadius));
      gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
      gradient.addColorStop(0.82, 'rgba(0, 0, 0, 1)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.globalCompositeOperation = 'destination-in';
      ctx.fillStyle = gradient;
      ctx.fillRect(left, top, view.width, view.height);
      ctx.globalCompositeOperation = 'source-over';
    }

    const glowing = s.glow > 0;
    for (let i = i0; i <= i1; i++) {
      for (let j = j0; j <= j1; j++) {
        const [cx, cy] = centerOf(s.shape, layout, i, j);
        const key = keyOf(i, j);
        let value = state.lit.get(key) ?? 0;
        let hue = state.hues.get(key) ?? 0;
        if (state.cascades.length) {
          const pulse = cascadeAt(s, cx, cy);
          if (pulse > value) {
            value = pulse;
            hue = state.cascadeHue;
          }
        }
        if (s.twinkle > 0 && !reduce) {
          const seed = hash(i, j);
          const wave = Math.sin(state.time * (0.35 + seed * 0.5) + seed * 40);
          const sparkle = s.twinkle * 0.7 * Math.max(0, wave) ** 18;
          if (sparkle > value) {
            value = sparkle;
            hue = seed * 360;
          }
        }
        if (introRadius !== Infinity) {
          const front = introRadius - Math.hypot(cx - centerX, cy - centerY);
          if (front < 0) continue;
          const wave = Math.exp(-((front / (size * 1.4)) ** 2)) * 0.85;
          if (wave > value) {
            value = wave;
            hue = (Math.atan2(cy - centerY, cx - centerX) * 180) / Math.PI + state.time * 120;
          }
        }
        if (value <= 0.01) continue;
        const color = s.rainbow ? tint(hue, s.tone) : s.hoverColor;
        const x = cx - state.offsetX;
        const y = cy - state.offsetY;
        ctx.beginPath();
        traceCell(ctx, s.shape, layout, size, i, j, x, y, markers ? value * size * 0.08 : s.lineWidth * 0.5);
        if (markers) {
          ctx.globalAlpha = Math.min(1, value);
          if (glowing) {
            ctx.shadowColor = color;
            ctx.shadowBlur = s.glow * 14 * value;
          }
          if (s.shape === 'dot') {
            ctx.fillStyle = color;
            ctx.fill();
          } else {
            ctx.strokeStyle = color;
            ctx.lineWidth = s.lineWidth * (1 + value * 0.6);
            ctx.stroke();
          }
          ctx.shadowBlur = 0;
          continue;
        }
        if (s.fillOpacity > 0) {
          ctx.globalAlpha = Math.min(1, value) * s.fillOpacity;
          ctx.fillStyle = s.rainbow ? color : s.hoverFillColor;
          ctx.fill();
        }
        ctx.globalAlpha = Math.min(1, value) * 0.85;
        if (glowing) {
          ctx.shadowColor = color;
          ctx.shadowBlur = s.glow * 16 * value;
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = s.lineWidth;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }
    ctx.globalAlpha = 1;

    if (view.mist) {
      const [mx0, my0, mx1, my1] = view.mist;
      const gradient = ctx.createLinearGradient(mx0, my0, mx1, my1);
      for (let k = 0; k <= 8; k++) {
        const t = k / 8;
        gradient.addColorStop(t, `rgba(0, 0, 0, ${(1 - smootherstep(t)).toFixed(3)})`);
      }
      ctx.globalCompositeOperation = 'destination-in';
      ctx.fillStyle = gradient;
      ctx.fillRect(left, top, view.width, view.height);
      ctx.globalCompositeOperation = 'source-over';
    }
  };

  const frame = now => {
    state.raf = 0;
    if (!state.alive) return;
    const s = settings;
    const dt = state.last ? Math.min(0.05, (now - state.last) / 1000) : 1 / 60;
    state.last = now;
    resize();
    if (!state.started) {
      state.started = true;
      state.startedAt = state.time;
    }
    if (!s.paused) {
      state.time += dt;
      if (!reduce) {
        const [dx, dy] = DIRECTIONS[s.direction];
        state.offsetX -= dx * s.speed * 60 * dt;
        state.offsetY -= dy * s.speed * 60 * dt;
      }
      const want = state.inside ? 1 : 0;
      state.spotPower += (want - state.spotPower) * (1 - Math.exp(-(want ? 10 : 5) * dt));
      const stiffness = 220;
      const damping = 2 * Math.sqrt(stiffness) * 0.85;
      state.spotVX += (stiffness * (state.pointerX - state.spotX) - damping * state.spotVX) * dt;
      state.spotVY += (stiffness * (state.pointerY - state.spotY) - damping * state.spotVY) * dt;
      state.spotX += state.spotVX * dt;
      state.spotY += state.spotVY * dt;
      illuminate(s, layoutFor(s.shape, s.cellSize), dt);
      state.cascades = state.cascades.filter(cascade => state.time - cascade.time < cascade.reach * 0.055 + 0.4);
    }
    draw();
    const settled =
      s.paused ||
      (s.speed === 0 || s.direction === 'none' || reduce
        ? state.lit.size === 0 &&
          state.cascades.length === 0 &&
          s.twinkle === 0 &&
          state.spotPower < 0.005 &&
          state.time - state.startedAt > 3
        : false);
    if (!settled && state.visible) state.raf = requestAnimationFrame(frame);
    else state.last = 0;
  };

  const wake = () => {
    if (!state.raf && state.alive && state.visible) state.raf = requestAnimationFrame(frame);
  };

  const pointFrom = event => {
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return null;
    return toPlane(x, y);
  };

  const onMove = event => {
    const point = pointFrom(event);
    if (point && !state.inside && state.spotPower < 0.02) {
      state.spotX = point[0];
      state.spotY = point[1];
      state.spotVX = 0;
      state.spotVY = 0;
    }
    state.inside = point !== null;
    if (point) {
      state.pointerX = point[0];
      state.pointerY = point[1];
      wake();
    }
  };

  const onLeave = () => {
    state.inside = false;
  };

  const onDown = event => {
    const s = settings;
    if (!s.clickCascade) return;
    const point = pointFrom(event);
    if (!point) return;
    state.cascades.push({
      x: point[0] + state.offsetX,
      y: point[1] + state.offsetY,
      time: state.time,
      power: 1,
      reach: Math.hypot(state.view.width, state.view.height) / s.cellSize,
      hue: state.time * 120
    });
    if (state.cascades.length > 6) state.cascades.shift();
    wake();
  };

  // Mask on container
  const mask = fadeMask(1);
  if (mask !== 'none') {
    container.style.maskImage = mask;
    container.style.webkitMaskImage = mask;
    container.style.maskComposite = 'intersect';
    container.style.webkitMaskComposite = 'source-in';
  }

  const resizeObserver = new ResizeObserver(() => {
    resize();
    draw();
    wake();
  });
  resizeObserver.observe(container);

  const visibility = new IntersectionObserver(entries => {
    state.visible = entries.some(entry => entry.isIntersecting);
    if (state.visible) wake();
  });
  visibility.observe(container);

  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerdown', onDown, { passive: true });
  document.documentElement.addEventListener('pointerleave', onLeave);
  window.addEventListener('blur', onLeave);

  resize();
  wake();
})();

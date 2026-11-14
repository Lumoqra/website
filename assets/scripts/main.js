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


/* ── React Bits: Shape Grid (Glowing, Scrolling & Heat-Safe) ────────────────────────── */
(function () {
  const container = document.getElementById('hero-shape-grid');
  if (!container) return;

  let canvas = container.querySelector('canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.className = 'shape-grid-canvas';
    container.appendChild(canvas);
  }

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  const isMobile = window.matchMedia('(max-width: 768px)').matches || ('ontouchstart' in window && window.innerWidth < 1024);
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  const OFFSET = 32768;
  const FAR = 2.5;
  const MAX_PIXELS = isMobile ? 1.8e6 : 4.0e6;
  const SQRT1_2 = Math.SQRT1_2;

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

  // Original aesthetic settings restored with tuned parameters
  const settings = {
    cellSize: 42,
    lineWidth: 1,
    speed: 0.32,
    lineColor: 'rgba(196, 181, 253, 0.16)',
    hoverColor: '#c4b5fd',
    hoverFillColor: 'rgba(139, 92, 246, 0.22)',
    fillOpacity: 0.22,
    tiltX: 16,
    tiltY: -10,
    radius: 1.8,
    trail: 0.7,
    glow: 0.45,
    twinkle: isMobile ? 0.08 : 0.14,
    dpr: isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 1.5)
  };

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
    cascades: [],
    needsResize: true
  };

  const resize = () => {
    state.needsResize = false;
    const s = settings;
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    const view = viewFor(s.tiltX, s.tiltY, width, height, s.cellSize);
    let ratio = s.dpr;
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

  const range = (stepX, stepY, margin) => {
    const { view } = state;
    return [
      Math.floor((state.offsetX + view.x0 - margin) / stepX) - 1,
      Math.ceil((state.offsetX + view.x0 + view.width + margin) / stepX) + 1,
      Math.floor((state.offsetY + view.y0 - margin) / stepY) - 1,
      Math.ceil((state.offsetY + view.y0 + view.height + margin) / stepY) + 1
    ];
  };

  const illuminate = (s, step, dt) => {
    const decay = Math.exp(-dt / s.trail);
    for (const [key, value] of state.lit) {
      const next = value * decay;
      if (next < 0.005) {
        state.lit.delete(key);
      } else state.lit.set(key, next);
    }
    if (state.spotPower < 0.01) return;
    const wx = state.spotX + state.offsetX;
    const wy = state.spotY + state.offsetY;
    const reach = Math.max(s.radius, 0.5) * s.cellSize;
    const hi = Math.round(wx / step);
    const hj = Math.round(wy / step);
    const span = Math.ceil(reach / step) + 2;
    for (let i = hi - span; i <= hi + span; i++) {
      for (let j = hj - span; j <= hj + span; j++) {
        const cx = (i + 0.5) * step;
        const cy = (j + 0.5) * step;
        const distance = Math.hypot(cx - wx, cy - wy);
        let value = s.radius > 0 ? smoothstep(reach, reach * 0.15, distance) : 0;
        if (i === hi && j === hj) value = Math.max(value, 1);
        value *= state.spotPower;
        if (value <= 0.005) continue;
        const key = keyOf(i, j);
        if (value > (state.lit.get(key) ?? 0)) {
          state.lit.set(key, value);
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
      }
    }
    return value;
  };

  const draw = () => {
    const s = settings;
    const { view, ratio } = state;
    const size = s.cellSize;
    const step = size;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(ratio, 0, 0, ratio, -view.x0 * ratio, -view.y0 * ratio);

    const left = view.x0;
    const top = view.y0;
    const right = view.x0 + view.width;
    const bottom = view.y0 + view.height;
    const [i0, i1, j0, j1] = range(step, step, size);
    const elapsed = state.time - state.startedAt;
    const introRadius = !reduce && elapsed < 2.2 ? elapsed * view.reach * 1.8 : Infinity;
    const originX = state.width / 2;
    const originY = state.height / 2;
    const centerX = originX + state.offsetX;
    const centerY = originY + state.offsetY;

    // 1. Base Scrolling Grid with slight violet luminous line glow
    ctx.lineWidth = s.lineWidth;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = s.lineColor;
    ctx.beginPath();
    for (let i = i0; i <= i1; i++) {
      const x = i * step - state.offsetX;
      ctx.moveTo(x, top - size);
      ctx.lineTo(x, bottom + size);
    }
    for (let j = j0; j <= j1; j++) {
      const y = j * step - state.offsetY;
      ctx.moveTo(left - size, y);
      ctx.lineTo(right + size, y);
    }
    ctx.stroke();

    // 2. Intro Wave
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

    // 3. Ambient Twinkle & Active Cell Highlights (Creates the subtle shimmering grid glow)
    const activeCells = new Map(state.lit);

    // Subtle random twinkle on select cells
    if (s.twinkle > 0 && !reduce) {
      // Sample a subset for performance
      const stepSample = isMobile ? 3 : 2;
      for (let i = i0; i <= i1; i += stepSample) {
        for (let j = j0; j <= j1; j += stepSample) {
          const seed = hash(i, j);
          const wave = Math.sin(state.time * (0.35 + seed * 0.5) + seed * 40);
          const sparkle = s.twinkle * 0.7 * Math.max(0, wave) ** 18;
          if (sparkle > 0.02) {
            const key = keyOf(i, j);
            if (sparkle > (activeCells.get(key) ?? 0)) {
              activeCells.set(key, sparkle);
            }
          }
        }
      }
    }

    if (state.cascades.length || introRadius !== Infinity) {
      for (let i = i0; i <= i1; i++) {
        for (let j = j0; j <= j1; j++) {
          const cx = (i + 0.5) * step;
          const cy = (j + 0.5) * step;
          let val = 0;
          if (state.cascades.length) {
            val = Math.max(val, cascadeAt(s, cx, cy));
          }
          if (introRadius !== Infinity) {
            const front = introRadius - Math.hypot(cx - centerX, cy - centerY);
            if (front >= 0) {
              const wave = Math.exp(-((front / (size * 1.4)) ** 2)) * 0.85;
              val = Math.max(val, wave);
            }
          }
          if (val > 0.01) {
            const key = keyOf(i, j);
            if (val > (activeCells.get(key) ?? 0)) {
              activeCells.set(key, val);
            }
          }
        }
      }
    }

    const half = size / 2 - 0.5;
    const canGlow = s.glow > 0 && activeCells.size < 25;

    for (const [key, value] of activeCells) {
      if (value <= 0.01) continue;
      const j = (key % 65536) - OFFSET;
      const i = Math.floor(key / 65536) - OFFSET;
      const cx = (i + 0.5) * step;
      const cy = (j + 0.5) * step;
      const x = cx - state.offsetX;
      const y = cy - state.offsetY;

      // Soft fill
      if (s.fillOpacity > 0) {
        ctx.globalAlpha = Math.min(1, value) * s.fillOpacity;
        ctx.fillStyle = s.hoverFillColor;
        ctx.fillRect(x - half, y - half, half * 2, half * 2);
      }

      // Glowing outline
      ctx.globalAlpha = Math.min(1, value) * 0.88;
      if (canGlow) {
        ctx.shadowColor = s.hoverColor;
        ctx.shadowBlur = s.glow * 14 * value;
      }
      ctx.strokeStyle = s.hoverColor;
      ctx.lineWidth = s.lineWidth * (1 + value * 0.3);
      ctx.strokeRect(x - half, y - half, half * 2, half * 2);
      if (canGlow) ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;

    // 4. Perspective Mist Fade (Soft background depth)
    if (view.mist) {
      const [mx0, my0, mx1, my1] = view.mist;
      const gradient = ctx.createLinearGradient(mx0, my0, mx1, my1);
      for (let k = 0; k <= 6; k++) {
        const t = k / 6;
        gradient.addColorStop(t, `rgba(0, 0, 0, ${(1 - smootherstep(t)).toFixed(3)})`);
      }
      ctx.globalCompositeOperation = 'destination-in';
      ctx.fillStyle = gradient;
      ctx.fillRect(left, top, view.width, view.height);
      ctx.globalCompositeOperation = 'source-over';
    }
  };

  // Fluid 40 FPS target (smooth scrolling with ~40% less CPU than 60Hz)
  const frameInterval = isMobile ? (1000 / 30) : (1000 / 42);

  const frame = now => {
    state.raf = 0;
    if (!state.alive || !state.visible || document.hidden) return;

    if (state.needsResize) {
      resize();
    }

    if (state.last && (now - state.last) < frameInterval) {
      state.raf = requestAnimationFrame(frame);
      return;
    }

    const s = settings;
    const dt = state.last ? Math.min(0.06, (now - state.last) / 1000) : 1 / 35;
    state.last = now;

    if (!state.started) {
      state.started = true;
      state.startedAt = state.time;
    }

    // Smooth continuous diagonal scrolling
    state.time += dt;
    if (!reduce) {
      state.offsetX -= SQRT1_2 * s.speed * 60 * dt;
      state.offsetY -= -SQRT1_2 * s.speed * 60 * dt;
    }

    // Interactive pointer physics
    if (state.inside || state.spotPower > 0.005) {
      const want = state.inside ? 1 : 0;
      state.spotPower += (want - state.spotPower) * (1 - Math.exp(-(want ? 10 : 5) * dt));
      const stiffness = 220;
      const damping = 2 * Math.sqrt(stiffness) * 0.85;
      state.spotVX += (stiffness * (state.pointerX - state.spotX) - damping * state.spotVX) * dt;
      state.spotVY += (stiffness * (state.pointerY - state.spotY) - damping * state.spotVY) * dt;
      state.spotX += state.spotVX * dt;
      state.spotY += state.spotVY * dt;
      illuminate(s, s.cellSize, dt);
    }

    if (state.cascades.length > 0) {
      state.cascades = state.cascades.filter(cascade => state.time - cascade.time < cascade.reach * 0.055 + 0.4);
    }

    draw();

    if (state.visible && !document.hidden) {
      state.raf = requestAnimationFrame(frame);
    } else {
      state.last = 0;
    }
  };

  const wake = () => {
    if (!state.raf && state.alive && state.visible && !document.hidden) {
      state.last = 0;
      state.raf = requestAnimationFrame(frame);
    }
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
    const point = pointFrom(event);
    if (!point) return;
    state.cascades.push({
      x: point[0] + state.offsetX,
      y: point[1] + state.offsetY,
      time: state.time,
      power: 1,
      reach: Math.hypot(state.view.width, state.view.height) / s.cellSize
    });
    if (state.cascades.length > 4) state.cascades.shift();
    wake();
  };

  // Fade mask for soft borders
  const mask = fadeMask(1);
  if (mask !== 'none') {
    container.style.maskImage = mask;
    container.style.webkitMaskImage = mask;
  }

  const resizeObserver = new ResizeObserver(() => {
    state.needsResize = true;
    wake();
  });
  resizeObserver.observe(container);

  // Full stop when scrolled off screen
  const visibility = new IntersectionObserver(entries => {
    const isIntersecting = entries.some(entry => entry.isIntersecting);
    state.visible = isIntersecting;
    if (state.visible) {
      wake();
    } else {
      if (state.raf) {
        cancelAnimationFrame(state.raf);
        state.raf = 0;
      }
      state.last = 0;
    }
  }, { threshold: 0.05 });
  visibility.observe(container);

  // Full stop when tab is inactive
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (state.raf) {
        cancelAnimationFrame(state.raf);
        state.raf = 0;
      }
      state.last = 0;
    } else if (state.visible) {
      wake();
    }
  });

  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerdown', onDown, { passive: true });
  document.documentElement.addEventListener('pointerleave', onLeave);
  window.addEventListener('blur', onLeave);

  resize();
  wake();
})();


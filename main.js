// 場域 section: each list item (tab) shows its matching image (panel) on the left.
document.querySelectorAll("[data-sectors]").forEach((root) => {
  const items = [...root.querySelectorAll(".sector-item")];
  const tabs = [...root.querySelectorAll("[role=tab]")];
  const panels = [...root.querySelectorAll("[role=tabpanel]")];
  const tagNum = root.querySelector("[data-sector-num]");
  const tagName = root.querySelector("[data-sector-name]");
  let current = tabs.findIndex((t) => t.getAttribute("aria-selected") === "true");

  // Once a wipe finishes, drop the image underneath so its edges can't bleed through.
  panels.forEach((panel) =>
    panel.addEventListener("transitionend", (e) => {
      if (e.propertyName === "clip-path" && panel.classList.contains("is-active")) {
        panels.forEach((p) => p.classList.remove("is-prev"));
      }
    })
  );

  function activate(next, { focus = false } = {}) {
    if (next === current) return;
    const incoming = panels[next];

    // Previous image stays underneath while the new one wipes in on top.
    panels.forEach((p) => p.classList.remove("is-prev"));
    panels[current].classList.replace("is-active", "is-prev");

    // Reset the incoming panel to its hidden state without animating, then reveal it.
    incoming.style.transition = "none";
    incoming.classList.remove("is-prev");
    void incoming.offsetWidth;
    incoming.style.transition = "";
    incoming.classList.add("is-active");

    panels.forEach((p, i) => p.toggleAttribute("aria-hidden", i !== next));
    tabs.forEach((t, i) => {
      t.setAttribute("aria-selected", String(i === next));
      t.tabIndex = i === next ? 0 : -1;
      items[i].classList.toggle("is-active", i === next);
    });
    tagNum.textContent = tabs[next].dataset.num;
    tagName.textContent = tabs[next].querySelector(".h4").textContent;
    if (focus) tabs[next].focus();
    current = next;
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => activate(i));
    tab.addEventListener("focus", () => activate(i));
    tab.addEventListener("mouseenter", () => activate(i));
    tab.addEventListener("keydown", (e) => {
      const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (step) {
        e.preventDefault();
        activate((i + step + tabs.length) % tabs.length, { focus: true });
      } else if (e.key === "Home" || e.key === "End") {
        e.preventDefault();
        activate(e.key === "Home" ? 0 : tabs.length - 1, { focus: true });
      }
    });
  });
});

// Mobile menu: the toggle opens/closes the nav panel under the header.
const navToggle = document.querySelector(".nav-toggle");
const nav = document.getElementById("site-nav");
if (navToggle && nav) {
  const setOpen = (open) => {
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "關閉選單" : "開啟選單");
    nav.classList.toggle("is-open", open);
  };
  navToggle.addEventListener("click", () => setOpen(navToggle.getAttribute("aria-expanded") !== "true"));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("is-open")) {
      setOpen(false);
      navToggle.focus();
    }
  });
}

// Header over dark sections (home hero, navy CTA band): switch the nav to light text.
const header = document.querySelector(".site-header");
const darkSections = document.querySelectorAll(".hero, .cta-band");
if (header && darkSections.length) {
  let ticking = false;
  const update = () => {
    const y = header.offsetHeight / 2;
    const onDark = [...darkSections].some((el) => {
      const r = el.getBoundingClientRect();
      return r.top <= y && r.bottom >= y;
    });
    header.classList.toggle("is-on-dark", onDark);
    ticking = false;
  };
  const onScroll = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
  update();
}

// 關於德衡 — 服務場域: hover (or click / focus) a strip to open it into a large image with its text.
document.querySelectorAll("[data-expand]").forEach((root) => {
  const panels = [...root.querySelectorAll(".field-panel")];
  const activate = (next) =>
    panels.forEach((panel, i) => {
      const open = i === next;
      panel.classList.toggle("is-active", open);
      panel.querySelector(".field-panel__btn").setAttribute("aria-expanded", String(open));
      panel.querySelector(".field-panel__body").toggleAttribute("aria-hidden", !open);
    });
  const canHover = matchMedia("(hover: hover)").matches;
  panels.forEach((panel, i) => {
    const btn = panel.querySelector(".field-panel__btn");
    btn.addEventListener("click", () => activate(i));
    btn.addEventListener("focus", () => activate(i));
    if (canHover) panel.addEventListener("mouseenter", () => activate(i));
  });
});

// 服務領域 — mark the system currently in view in the sticky index.
const spyLinks = document.querySelectorAll("[data-spy]");
if (spyLinks.length && "IntersectionObserver" in window) {
  const byId = new Map([...spyLinks].map((a) => [a.dataset.spy, a]));
  const setCurrent = (id) =>
    spyLinks.forEach((a) => (a.dataset.spy === id ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current")));
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && setCurrent(e.target.id)),
    { rootMargin: "-45% 0px -50% 0px" } // the system crossing the middle of the screen
  );
  byId.forEach((_, id) => { const el = document.getElementById(id); if (el) io.observe(el); });
  setCurrent(spyLinks[0].dataset.spy);
}

// 實績案例 — click a row to open it (image wipes in, then the text). #id in the URL opens that case.
document.querySelectorAll("[data-cases]").forEach((root) => {
  const items = [...root.querySelectorAll(".case-item")];
  const setOpen = (item, open) => {
    item.classList.toggle("is-open", open);
    item.querySelector(".case-item__toggle").setAttribute("aria-expanded", String(open));
  };
  items.forEach((item) => {
    item.querySelector(".case-item__toggle").addEventListener("click", () => setOpen(item, !item.classList.contains("is-open")));
  });
  const fromHash = location.hash && items.find((item) => "#" + item.id === location.hash);
  if (fromHash) requestAnimationFrame(() => setOpen(fromHash, true));
});

// 聯繫 — validate on submit, show messages under fields, focus the first problem.
document.querySelectorAll("form[data-validate]").forEach((form) => {
  const status = form.querySelector(".contact-form__status");
  const messageFor = (el) => {
    if (el.validity.valueMissing) return `請填寫${form.querySelector(`label[for="${el.id}"]`).firstChild.textContent.trim()}`;
    if (el.validity.typeMismatch && el.type === "email") return "Email 格式不正確，例如 name@company.com";
    return "";
  };
  const check = (el) => {
    const msg = messageFor(el);
    el.setAttribute("aria-invalid", String(Boolean(msg)));
    document.getElementById(el.getAttribute("aria-describedby")).textContent = msg;
    return !msg;
  };
  const controls = [...form.querySelectorAll("input, textarea")];
  // once a field has been flagged, re-check it as the visitor fixes it
  controls.forEach((el) => el.addEventListener("input", () => el.getAttribute("aria-invalid") === "true" && check(el)));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const invalid = controls.filter((el) => !check(el));
    if (invalid.length) {
      invalid[0].focus();
      status.textContent = "";
      return;
    }
    const endpoint = form.dataset.endpoint;
    if (!endpoint) {
      status.textContent = "送出功能尚未設定，請稍後再試。";
      return;
    }
    status.textContent = "送出中…";
    try {
      const res = await fetch(endpoint, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(res.status);
      form.reset();
      status.textContent = "已收到您的需求，我們會盡快與您聯繫。";
    } catch {
      status.textContent = "送出失敗，請稍後再試。";
    }
  });
});

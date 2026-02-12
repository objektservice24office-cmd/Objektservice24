(() => {
  "use strict";

  // ---------- Helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);

  // ---------- Footer Year ----------
  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());

  // ---------- Mobile Menu (Burger) ----------
  const burger = $("#burger");
  const panel = $("#panel");

  const setMenu = (open) => {
    if (!burger || !panel) return;
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    panel.setAttribute("aria-hidden", open ? "false" : "true");
    panel.classList.toggle("open", open);
    document.documentElement.classList.toggle("no-scroll", open);
  };

  on(burger, "click", () => {
    const open = burger.getAttribute("aria-expanded") !== "true";
    setMenu(open);
  });

  // close menu when clicking a panel link
  $$("#panel a").forEach((a) => on(a, "click", () => setMenu(false)));

  // close menu on ESC
  on(document, "keydown", (e) => {
    if (e.key === "Escape") setMenu(false);
  });

  // close menu if click outside (panel open)
  on(document, "click", (e) => {
    if (!burger || !panel) return;
    const open = burger.getAttribute("aria-expanded") === "true";
    if (!open) return;
    const t = e.target;
    if (panel.contains(t) || burger.contains(t)) return;
    setMenu(false);
  });

  // ---------- Consent (GTM consent mode) ----------
  const consentBox = $("#consent");
  const btnAccept = $("#accept");
  const btnDecline = $("#decline");

  const CONSENT_KEY = "os24_consent_v1"; // stores "granted" | "denied"

  const setConsentUI = (show) => {
    if (!consentBox) return;
    consentBox.setAttribute("aria-hidden", show ? "false" : "true");
    consentBox.classList.toggle("open", show);
  };

  const applyConsent = (state /* "granted" | "denied" */) => {
    try {
      localStorage.setItem(CONSENT_KEY, state);
    } catch (_) {}

    // Only call gtag if it exists (GTM may load later)
    if (typeof window.gtag === "function") {
      window.gtag("consent", "update", {
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
        analytics_storage: state === "granted" ? "granted" : "denied",
        functionality_storage: "granted",
        security_storage: "granted",
      });
    }
  };

  // show banner only if not decided
  let stored = null;
  try {
    stored = localStorage.getItem(CONSENT_KEY);
  } catch (_) {}
  if (!stored) setConsentUI(true);

  on(btnAccept, "click", () => {
    applyConsent("granted");
    setConsentUI(false);
  });

  on(btnDecline, "click", () => {
    applyConsent("denied");
    setConsentUI(false);
  });

  // ---------- Form Validation (Netlify-compatible) ----------
  const form = $("#leadForm");
  const err = $("#formError");

  const isValidEmail = (v) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());

  const showError = (msg) => {
    if (!err) return;
    err.textContent = msg || "Bitte alle Pflichtfelder (*) korrekt ausfüllen.";
    err.style.display = "block";
  };

  const hideError = () => {
    if (!err) return;
    err.style.display = "none";
  };

  if (form) {
    // IMPORTANT: do NOT hijack submit when valid
    on(form, "submit", (e) => {
      hideError();

      const fd = new FormData(form);
      const data = Object.fromEntries(fd.entries());

      const ok =
        String(data.firma || "").trim().length > 0 &&
        String(data.ansprechpartner || "").trim().length > 0 &&
        String(data.telefon || "").trim().length > 0 &&
        isValidEmail(data.email) &&
        String(data.adresse || "").trim().length > 0 &&
        String(data.objektart || "").trim().length > 0 &&
        String(data.module || "").trim().length > 0;

      if (!ok) {
        e.preventDefault();
        showError("Bitte alle Pflichtfelder (*) korrekt ausfüllen.");
        return;
      }

      // no preventDefault here -> Netlify handles POST + redirect
    });

    // optional: hide error while typing
    ["input", "change"].forEach((ev) => on(form, ev, hideError, true));
  }
})();

// /Assets/JS/main.js
(() => {
  "use strict";

  const CONSENT_KEY = "objektservice24_consent_v1";

  // ===== helpers =====
  window.dataLayer = window.dataLayer || [];
  function pushEvent(eventName, params) {
    try {
      window.dataLayer.push(Object.assign({ event: eventName }, params || {}));
    } catch (_) {}
  }

  const $ = (id) => document.getElementById(id);

  // ===== footer year =====
  const yearEl = $("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // ===== mobile menu =====
  const burger = $("burger");
  const panel = $("panel");
  let lastFocus = null;

  function setPanel(open) {
    if (!panel || !burger) return;
    panel.style.display = open ? "block" : "none";
    panel.setAttribute("aria-hidden", String(!open));
    burger.setAttribute("aria-expanded", String(open));

    if (open) {
      lastFocus = document.activeElement;
      const firstLink = panel.querySelector("a");
      if (firstLink) firstLink.focus();
    } else if (lastFocus && typeof lastFocus.focus === "function") {
      lastFocus.focus();
    }
  }

  if (burger && panel) {
    burger.addEventListener("click", () => {
      const isOpen = burger.getAttribute("aria-expanded") === "true";
      setPanel(!isOpen);
    });

    panel.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setPanel(false)));

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && burger.getAttribute("aria-expanded") === "true") setPanel(false);
    });
  }

  // ===== click tracking =====
  document.addEventListener("click", (e) => {
    const el = e.target.closest("a,button");
    if (!el) return;

    if (el.matches('a[href^="tel:"]')) pushEvent("lead_phone_click", { channel: "telephone" });
    if (el.matches('a[href^="mailto:"]')) pushEvent("lead_email_click", { channel: "email" });

    const cta = el.dataset && el.dataset.cta ? String(el.dataset.cta) : "";
    if (cta) {
      pushEvent("call_to_action_click", {
        name: cta,
        text: (el.textContent || "").trim()
      });
    }
  });

  // ===== consent banner =====
  const consentEl = $("consent");
  const acceptBtn = $("accept");
  const declineBtn = $("decline");

  function showConsent() {
    if (!consentEl) return;
    consentEl.style.display = "block";
    consentEl.setAttribute("aria-hidden", "false");
    pushEvent("consent_banner_shown", {});
    (acceptBtn || declineBtn)?.focus?.();
  }

  function hideConsent() {
    if (!consentEl) return;
    consentEl.style.display = "none";
    consentEl.setAttribute("aria-hidden", "true");
  }

  function applyConsent(state) {
    localStorage.setItem(CONSENT_KEY, state);
    const granted = state === "granted";

    if (typeof window.gtag === "function") {
      window.gtag("consent", "update", {
        ad_storage: "denied",
        analytics_storage: granted ? "granted" : "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
        functionality_storage: "granted",
        security_storage: "granted"
      });
    } else {
      pushEvent("consent_update", { analytics_storage: granted ? "granted" : "denied" });
    }

    pushEvent(granted ? "consent_granted" : "consent_denied", {});
    hideConsent();
  }

  const storedConsent = localStorage.getItem(CONSENT_KEY);
  if (!storedConsent && consentEl) showConsent();

  if (acceptBtn) acceptBtn.addEventListener("click", () => applyConsent("granted"));
  if (declineBtn) declineBtn.addEventListener("click", () => applyConsent("denied"));

  // If consent was stored, apply silently without showing banner
  if (storedConsent && consentEl) {
    // do NOT show banner; just update consent
    applyConsent(storedConsent);
  }

  // ===== Netlify Forms: validation only (NO manual submit, NO mailto) =====
  const form = $("leadForm");
  const err = $("formError");

  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());

  function getFormData(formEl) {
    return Object.fromEntries(new FormData(formEl).entries());
  }

  function validateLead(data) {
    return (
      String(data.firma || "").trim().length > 0 &&
      String(data.ansprechpartner || "").trim().length > 0 &&
      String(data.telefon || "").trim().length > 0 &&
      isValidEmail(data.email) &&
      String(data.adresse || "").trim().length > 0 &&
      String(data.objektart || "").trim().length > 0 &&
      String(data.module || "").trim().length > 0
    );
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      if (err) err.style.display = "none";

      const data = getFormData(form);
      const ok = validateLead(data);

      if (!ok) {
        e.preventDefault(); // block only on invalid
        if (err) {
          err.style.display = "block";
          err.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        pushEvent("lead_form_error", { reason: "missing_required_fields" });
        return;
      }

      // let browser POST to Netlify; redirect handled by action="/danke.html"
      pushEvent("lead_form_submit_netlify", {
        module: String(data.module || ""),
        objectType: String(data.objektart || "")
      });
    });
  }
})();


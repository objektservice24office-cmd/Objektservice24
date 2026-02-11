// /assets/js/main.js
(() => {
  "use strict";

  const CONSENT_KEY = "objektservice24_consent_v1";

  // Jahr im Footer
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // dataLayer helper (GTM)
  window.dataLayer = window.dataLayer || [];
  const pushEvent = (event, params = {}) => {
    try { window.dataLayer.push({ event, ...params }); } catch (_) {}
  };

  // Mobile Menü
  const burger = document.getElementById("burger");
  const panel = document.getElementById("panel");
  let lastFocus = null;

  const setPanel = (open) => {
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
  };

  if (burger && panel) {
    burger.addEventListener("click", () => {
      const isOpen = burger.getAttribute("aria-expanded") === "true";
      setPanel(!isOpen);
    });

    panel.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => setPanel(false))
    );

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && burger.getAttribute("aria-expanded") === "true") {
        setPanel(false);
      }
    });
  }

  // Klick-Events (Telefon/Mail/CTA)
  document.addEventListener("click", (e) => {
    const el = e.target.closest("a,button");
    if (!el) return;

    if (el.matches('a[href^="tel:"]')) pushEvent("lead_phone_click", { channel: "telephone" });
    if (el.matches('a[href^="mailto:"]')) pushEvent("lead_email_click", { channel: "email" });

    if (el.dataset && el.dataset.cta) {
      pushEvent("call_to_action_click", { name: el.dataset.cta, text: (el.textContent || "").trim() });
    }
  });

  // Consent Banner
  const consentEl = document.getElementById("consent");
  const acceptBtn = document.getElementById("accept");
  const declineBtn = document.getElementById("decline");

  const showConsent = () => {
    if (!consentEl) return;
    consentEl.style.display = "block";
    consentEl.setAttribute("aria-hidden", "false");
    pushEvent("consent_banner_shown");
    (acceptBtn || declineBtn)?.focus?.();
  };

  const hideConsent = () => {
    if (!consentEl) return;
    consentEl.style.display = "none";
    consentEl.setAttribute("aria-hidden", "true");
  };

  const applyConsent = (state) => {
    localStorage.setItem(CONSENT_KEY, state);

    const granted = state === "granted";
    if (typeof window.gtag === "function") {
      window.gtag("consent", "update", {
        ad_storage: "denied",
        analytics_storage: granted ? "granted" : "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
    } else {
      pushEvent("consent_update", { analytics_storage: granted ? "granted" : "denied" });
    }

    pushEvent(granted ? "consent_granted" : "consent_denied");
    hideConsent();
  };

  const stored = localStorage.getItem(CONSENT_KEY);
  if (!stored && consentEl) showConsent();
  if (stored && consentEl) applyConsent(stored);

  acceptBtn?.addEventListener("click", () => applyConsent("granted"));
  declineBtn?.addEventListener("click", () => applyConsent("denied"));

  // ===== Netlify Form: nur validieren, Submit NICHT kaputtmachen =====
  const form = document.getElementById("leadForm");
  const err = document.getElementById("formError");

  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());

  if (form) {
    form.addEventListener("submit", (e) => {
      if (err) err.style.display = "none";

      const data = Object.fromEntries(new FormData(form).entries());

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
        if (err) {
          err.style.display = "block";
          err.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        pushEvent("lead_form_error", { reason: "missing_required_fields" });
        return;
      }

      // Erfolg: NICHT preventDefault, NICHT form.submit()
      pushEvent("lead_form_submit", {
        module: String(data.module || ""),
        objectType: String(data.objektart || ""),
      });
    });
  }
})();


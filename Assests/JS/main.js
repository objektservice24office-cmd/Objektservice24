// /Assets/JS/main.js
(() => {
  "use strict";

  const CONTACT_EMAIL = "objektservice24.office@gmail.com";
  const CONSENT_KEY = "objektservice24_consent_v1";

  // Footer Jahr
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // DataLayer Helper
  window.dataLayer = window.dataLayer || [];
  function pushEvent(eventName, params) {
    try { window.dataLayer.push(Object.assign({ event: eventName }, params || {})); } catch (_) {}
  }

  // Mobile Menü
  const burger = document.getElementById("burger");
  const panel  = document.getElementById("panel");
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

    panel.querySelectorAll("a").forEach(a =>
      a.addEventListener("click", () => setPanel(false))
    );

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && burger.getAttribute("aria-expanded") === "true") {
        setPanel(false);
      }
    });
  }

  // Klick-Events
  document.addEventListener("click", (e) => {
    const el = e.target.closest("a,button");
    if (!el) return;

    if (el.matches('a[href^="tel:"]')) pushEvent("lead_phone_click", { channel: "telephone" });
    if (el.matches('a[href^="mailto:"]')) pushEvent("lead_email_click", { channel: "email" });

    if (el.dataset && el.dataset.cta) {
      pushEvent("call_to_action_click", { name: el.dataset.cta, text: (el.textContent || "").trim() });
    }
  });

  // Consent Banner + Consent Update (gtag Consent Mode)
  const consentEl = document.getElementById("consent");
  const acceptBtn = document.getElementById("accept");
  const declineBtn = document.getElementById("decline");

  function showConsent() {
    if (!consentEl) return;
    consentEl.style.display = "block";
    consentEl.setAttribute("aria-hidden", "false");
    pushEvent("consent_banner_shown", {});
    const btn = acceptBtn || declineBtn;
    if (btn) btn.focus();
  }

  function hideConsent() {
    if (!consentEl) return;
    consentEl.style.display = "none";
    consentEl.setAttribute("aria-hidden", "true");
  }

  function applyConsent(state) {
    localStorage.setItem(CONSENT_KEY, state);

    if (state === "granted") {
      if (typeof window.gtag === "function") {
        window.gtag("consent", "update", {
          ad_storage: "denied",
          analytics_storage: "granted",
          ad_user_data: "denied",
          ad_personalization: "denied"
        });
      } else {
        // Fallback: zumindest als Event in die dataLayer
        pushEvent("consent_update", { analytics_storage: "granted" });
      }
      pushEvent("consent_granted", {});
    } else {
      if (typeof window.gtag === "function") {
        window.gtag("consent", "update", {
          ad_storage: "denied",
          analytics_storage: "denied",
          ad_user_data: "denied",
          ad_personalization: "denied"
        });
      } else {
        pushEvent("consent_update", { analytics_storage: "denied" });
      }
      pushEvent("consent_denied", {});
    }

    hideConsent();
  }

  const stored = localStorage.getItem(CONSENT_KEY);
  if (!stored && consentEl) showConsent();
  else if (stored && consentEl) applyConsent(stored);

  if (acceptBtn) acceptBtn.addEventListener("click", () => applyConsent("granted"));
  if (declineBtn) declineBtn.addEventListener("click", () => applyConsent("denied"));

  // Formular: mailto (wie dein Ansatz – zuverlässig wird’s erst mit Serverless)
  const form = document.getElementById("leadForm");
  const err  = document.getElementById("formError");
  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (err) err.style.display = "none";

      const data = Object.fromEntries(new FormData(form).entries());
      const ok =
        String(data.firma || "").trim().length > 0 &&
        String(data.ansprechpartner || "").trim().length > 0 &&
        String(data.telefon || "").trim().length > 0 &&
        isValidEmail(String(data.email || "").trim()) &&
        String(data.adresse || "").trim().length > 0 &&
        String(data.objektart || "").trim().length > 0 &&
        String(data.module || "").trim().length > 0;

      if (!ok) {
        if (err) {
          err.style.display = "block";
          err.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        pushEvent("lead_form_error", { reason: "missing_required_fields" });
        return;
      }

      pushEvent("lead_form_valid", { module: data.module, objectType: data.objektart });

      const subject = `ObjektService24 – Anfrage Objektprüfung | ${data.adresse} | ${data.objektart}`;
      const body = [
        "Guten Tag,",
        "",
        "ich bitte um eine unverbindliche Objektprüfung und Angebotserstellung.",
        "",
        "Kontaktdaten",
        `Hausverwaltung oder Firma: ${data.firma}`,
        `Ansprechpartner: ${data.ansprechpartner}`,
        `Telefon: ${data.telefon}`,
        `E-Mail: ${data.email}`,
        "",
        "Objekt",
        `Adresse: ${data.adresse}`,
        `Objektart: ${data.objektart}`,
        `Gewünschte Module: ${data.module}`,
        "",
        "Kurzbeschreibung",
        `${data.nachricht ? data.nachricht : "-"}`,
        "",
        "Bitte Rückmeldung mit nächstem Schritt (Besichtigung, Unterlagenbedarf, Angebot).",
        "",
        "Mit freundlichen Grüßen"
      ].join("\n");

      pushEvent("lead_form_send_via_email_client", { channel: "mailto" });

      window.location.href =
        `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  }
})();

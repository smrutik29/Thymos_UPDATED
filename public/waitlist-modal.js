/*
 * Thymos Health — native "Join Our Waitlist" modal.
 *
 * Replaces the old JotForm (form.jotform.com/250676778229169). Self-contained:
 * injects its own styles + markup, posts to /api/waitlist, and opens whenever
 * the visitor clicks anything that used to point at the JotForm — i.e. any
 *   <a data-waitlist-trigger>            (the rewritten Sign In / Join buttons)
 *   <a href*="form.jotform.com/250676778229169">   (belt-and-suspenders)
 *
 * Load once per page, right before </body>:
 *   <script src="waitlist-modal.js" defer></script>
 */
(function () {
  "use strict";

  if (window.__thymosWaitlistModalLoaded) return;
  window.__thymosWaitlistModalLoaded = true;

  var JOTFORM_MARKER = "form.jotform.com/250676778229169";

  var US_STATES = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
    "Connecticut", "Delaware", "District of Columbia", "Florida", "Georgia",
    "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
    "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
    "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
    "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina",
    "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania",
    "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas",
    "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin",
    "Wyoming", "American Samoa", "Guam", "Northern Mariana Islands",
    "Puerto Rico", "U.S. Virgin Islands"
  ];

  // Keep in sync with CONSENT_TEXT in src/lib/schemas/waitlist.ts — the
  // server stores its own copy, so a mismatch just means the stored record
  // won't read the same as what the user saw.
  var CONSENT_TEXT =
    "I agree to receive emails from Thymos Health about my waitlist status, " +
    "new-patient enrollment, and related updates. I understand I can " +
    "unsubscribe at any time via the link in any email, and that my " +
    "information will be handled per the Thymos Health Privacy Policy.";

  var PRIVACY_HREF = "Thymos Privacy Policy.dc.html";

  // Cloudflare Turnstile site key (public). A <meta name="turnstile-site-key">
  // on the page overrides this if present.
  var TURNSTILE_SITE_KEY = (function () {
    var m = document.querySelector('meta[name="turnstile-site-key"]');
    return (m && m.content) || "0x4AAAAAAEgd99jX8gK0sp_v";
  })();
  var TURNSTILE_API = "https://challenges.cloudflare.com/turnstile/v0/api.js";

  // ---- styles -------------------------------------------------------------
  var CSS = [
    "#twl-overlay{position:fixed;inset:0;z-index:100000;display:none;align-items:center;justify-content:center;padding:24px;",
    "background:rgba(16,6,80,0.55);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);",
    "opacity:0;transition:opacity .18s ease;font-family:'Montserrat',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;}",
    "#twl-overlay.twl-open{display:flex;opacity:1;}",
    "#twl-overlay *{box-sizing:border-box;}",
    ".twl-modal{position:relative;width:100%;max-width:520px;max-height:calc(100vh - 48px);overflow-y:auto;",
    "background:#fff;border-radius:16px;padding:32px 32px 28px;box-shadow:0 24px 60px rgba(16,6,80,0.28);",
    "transform:translateY(12px) scale(.97);transition:transform .2s ease;}",
    "#twl-overlay.twl-open .twl-modal{transform:none;}",
    ".twl-close{position:absolute;top:16px;right:16px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;",
    "background:none;border:none;border-radius:8px;color:#100650;cursor:pointer;font-size:22px;line-height:1;transition:background .15s ease;}",
    ".twl-close:hover,.twl-close:focus-visible{background:rgba(16,6,80,0.08);outline:none;}",
    ".twl-title{margin:0 36px 6px 0;font-family:'Lexend','Montserrat',sans-serif;font-weight:700;font-size:1.5rem;color:#100650;line-height:1.25;}",
    ".twl-sub{margin:0 0 20px;font-size:.9rem;line-height:1.5;color:#555;}",
    ".twl-field{margin-bottom:14px;}",
    ".twl-row{display:flex;gap:12px;}",
    ".twl-row .twl-field{flex:1;}",
    ".twl-label{display:block;font-size:.8rem;font-weight:600;color:#333;margin-bottom:5px;}",
    ".twl-label .twl-req{color:#ea6047;}",
    ".twl-input,.twl-select,.twl-textarea{width:100%;padding:10px 12px;border:1px solid #ccc;border-radius:8px;font-size:.95rem;",
    "font-family:inherit;color:#222;background:#fff;transition:border-color .15s ease,box-shadow .15s ease;}",
    ".twl-input:focus,.twl-select:focus,.twl-textarea:focus{outline:none;border-color:#ea6047;box-shadow:0 0 0 3px rgba(234,96,71,0.18);}",
    ".twl-textarea{resize:vertical;min-height:76px;}",
    ".twl-consent{display:flex;gap:10px;align-items:flex-start;margin:6px 0 18px;font-size:.78rem;line-height:1.5;color:#555;}",
    ".twl-consent input{margin-top:2px;width:16px;height:16px;flex-shrink:0;accent-color:#ea6047;}",
    ".twl-consent a{color:#100650;text-decoration:underline;}",
    ".twl-submit{width:100%;padding:12px 16px;background:#ea6047;color:#fff;border:none;border-radius:8px;",
    "font-size:1rem;font-weight:600;font-family:inherit;cursor:pointer;transition:background .15s ease;}",
    ".twl-submit:hover:not(:disabled){background:#c14930;}",
    ".twl-submit:disabled{opacity:.65;cursor:default;}",
    ".twl-error{margin:12px 0 0;color:#c1372b;font-size:.83rem;line-height:1.45;}",
    ".twl-safe{margin:14px 0 0;text-align:center;font-size:.75rem;color:#888;}",
    ".twl-success{text-align:center;padding:12px 0 4px;}",
    ".twl-success h3{margin:0 0 8px;font-family:'Lexend','Montserrat',sans-serif;font-size:1.3rem;color:#100650;}",
    ".twl-success p{margin:0;font-size:.9rem;line-height:1.55;color:#555;}",
    ".twl-hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0;overflow:hidden;}",
    "@media (max-width:520px){.twl-modal{padding:26px 20px 22px;}.twl-row{flex-direction:column;gap:0;}}"
  ].join("");

  // ---- markup -----------------------------------------------------------
  function stateOptions() {
    var out = '<option value="" disabled selected>Please select</option>';
    for (var i = 0; i < US_STATES.length; i++) {
      var s = US_STATES[i].replace(/"/g, "&quot;");
      out += '<option value="' + s + '">' + s + "</option>";
    }
    return out;
  }

  var REFERRALS = [
    "Google Search", "Facebook", "Instagram", "LinkedIn", "Friend",
    "Word of Mouth", "Email", "Other"
  ];
  function referralOptions() {
    var out = '<option value="" disabled selected>Please select</option>';
    for (var i = 0; i < REFERRALS.length; i++) {
      out += '<option value="' + REFERRALS[i] + '">' + REFERRALS[i] + "</option>";
    }
    return out;
  }

  var FORM_HTML =
    '<form class="twl-form" novalidate>' +
      '<div class="twl-row">' +
        '<div class="twl-field">' +
          '<label class="twl-label" for="twl-first">First name <span class="twl-req">*</span></label>' +
          '<input class="twl-input" id="twl-first" name="firstName" type="text" autocomplete="given-name" maxlength="100" required>' +
        "</div>" +
        '<div class="twl-field">' +
          '<label class="twl-label" for="twl-last">Last name <span class="twl-req">*</span></label>' +
          '<input class="twl-input" id="twl-last" name="lastName" type="text" autocomplete="family-name" maxlength="100" required>' +
        "</div>" +
      "</div>" +
      '<div class="twl-field">' +
        '<label class="twl-label" for="twl-email">Email <span class="twl-req">*</span></label>' +
        '<input class="twl-input" id="twl-email" name="email" type="email" autocomplete="email" maxlength="254" required>' +
      "</div>" +
      '<div class="twl-field">' +
        '<label class="twl-label" for="twl-state">State of residence <span class="twl-req">*</span></label>' +
        '<select class="twl-select" id="twl-state" name="state" required>' + stateOptions() + "</select>" +
      "</div>" +
      '<div class="twl-field">' +
        '<label class="twl-label" for="twl-ref">Where did you hear about us? <span class="twl-req">*</span></label>' +
        '<select class="twl-select" id="twl-ref" name="referralSource" required>' + referralOptions() + "</select>" +
      "</div>" +
      '<div class="twl-field">' +
        '<label class="twl-label" for="twl-q">Any specific questions for us?</label>' +
        '<textarea class="twl-textarea" id="twl-q" name="questions" maxlength="2000"></textarea>' +
      "</div>" +
      '<label class="twl-consent">' +
        '<input type="checkbox" id="twl-consent" name="consent" required>' +
        "<span>" + CONSENT_TEXT.replace(
          "Thymos Health Privacy Policy",
          '<a href="' + PRIVACY_HREF + '" target="_blank" rel="noopener">Thymos Health Privacy Policy</a>'
        ) + "</span>" +
      "</label>" +
      '<div class="cf-turnstile" data-sitekey="' + TURNSTILE_SITE_KEY + '" data-theme="light" style="margin-bottom:14px;"></div>' +
      '<button class="twl-submit" type="submit">Join the waitlist</button>' +
      '<p class="twl-error" hidden></p>' +
      '<p class="twl-safe">🔒 Your information is safe with us.</p>' +
      // Honeypot
      '<input class="twl-hp" type="text" name="companyWebsite" tabindex="-1" autocomplete="off" aria-hidden="true">' +
    "</form>";

  var SUCCESS_HTML =
    '<div class="twl-success">' +
      "<h3>You're on the list.</h3>" +
      "<p>Thanks for joining — we'll email you the moment Thymos opens more new-patient spots.</p>" +
    "</div>";

  // ---- build + wire ----------------------------------------------------
  var overlay, modal, form, errorEl, submitBtn, lastFocused;

  function loadTurnstileScript() {
    if (document.querySelector('script[src^="' + TURNSTILE_API + '"]')) return;
    var s = document.createElement("script");
    s.src = TURNSTILE_API;
    s.async = true;
    s.defer = true;
    document.head.appendChild(s);
  }

  function build() {
    var style = document.createElement("style");
    style.id = "twl-styles";
    style.textContent = CSS;
    document.head.appendChild(style);
    loadTurnstileScript();

    overlay = document.createElement("div");
    overlay.id = "twl-overlay";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML =
      '<div class="twl-modal" role="dialog" aria-modal="true" aria-labelledby="twl-title">' +
        '<button class="twl-close" type="button" aria-label="Close">×</button>' +
        '<h2 class="twl-title" id="twl-title">Join Our Waitlist</h2>' +
        '<p class="twl-sub">Be the first to know when Thymos starts enrolling more new patients.</p>' +
        FORM_HTML +
      "</div>";
    document.body.appendChild(overlay);

    modal = overlay.querySelector(".twl-modal");
    form = overlay.querySelector(".twl-form");
    errorEl = overlay.querySelector(".twl-error");
    submitBtn = overlay.querySelector(".twl-submit");

    overlay.querySelector(".twl-close").addEventListener("click", close);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && overlay.classList.contains("twl-open")) close();
    });
    form.addEventListener("submit", onSubmit);
  }

  function open(e) {
    if (e) e.preventDefault();
    if (!overlay) build();
    lastFocused = document.activeElement;
    overlay.classList.add("twl-open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    var first = overlay.querySelector("#twl-first");
    if (first) setTimeout(function () { first.focus(); }, 30);
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove("twl-open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
  }

  function onSubmit(e) {
    e.preventDefault();
    errorEl.hidden = true;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    var tsField = form.querySelector('[name="cf-turnstile-response"]');
    var tsToken = tsField ? tsField.value : "";
    if (!tsToken) {
      showError("Please complete the verification challenge and try again.");
      return;
    }

    // Honeypot filled -> silently pretend success.
    if (form.companyWebsite.value.trim() !== "") {
      modal.innerHTML = SUCCESS_HTML +
        '<button class="twl-submit" type="button" style="margin-top:18px;">Close</button>';
      modal.querySelector(".twl-submit").addEventListener("click", close);
      return;
    }

    var payload = {
      firstName: form.firstName.value.trim(),
      lastName: form.lastName.value.trim(),
      email: form.email.value.trim(),
      state: form.state.value,
      referralSource: form.referralSource.value,
      questions: form.questions.value.trim(),
      consent: form.consent.checked,
      sourcePage: document.title,
      turnstileToken: tsToken,
      companyWebsite: ""
    };

    submitBtn.disabled = true;
    submitBtn.textContent = "Joining…";

    fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        if (!res.ok) throw new Error("bad_status");
        modal.innerHTML =
          '<button class="twl-close" type="button" aria-label="Close">×</button>' +
          SUCCESS_HTML;
        modal.querySelector(".twl-close").addEventListener("click", close);
      })
      .catch(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = "Join the waitlist";
        // Turnstile tokens are single-use — get a fresh one for the retry.
        if (window.turnstile) {
          try { window.turnstile.reset(); } catch (_) {}
        }
        showError(
          "Something went wrong submitting the form. Please try again in a moment."
        );
      });
  }

  // Delegated so it still works if a page's component runtime re-renders the
  // trigger nodes after load.
  document.addEventListener("click", function (e) {
    if (!e.target.closest) return;
    var trigger = e.target.closest(
      '[data-waitlist-trigger], a[href*="' + JOTFORM_MARKER + '"]'
    );
    if (trigger) open(e);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();

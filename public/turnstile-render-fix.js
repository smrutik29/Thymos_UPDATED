/*
 * Thymos Health — reliable Cloudflare Turnstile rendering on pages whose
 * form lives inside the client-side template runtime (support.js).
 *
 * Turnstile's default "implicit" mode auto-scans the DOM for .cf-turnstile
 * elements once, as soon as its script loads, and renders directly into
 * whatever it finds. On these pages the form (and its .cf-turnstile div) is
 * initially raw, parser-created markup that the page's own runtime then
 * tears down and re-mounts via React once React/Babel finish loading from
 * unpkg.com. If Turnstile's implicit scan runs against the ORIGINAL div
 * (common — it loads independently, on its own schedule) and React then
 * replaces that div as part of its own mount, Turnstile's internal widget
 * tracking is left pointing at a container that no longer exists ("Cannot
 * find Widget ..." in the console) — and it does not know to look for a
 * replacement. The now-current .cf-turnstile div stays permanently empty,
 * so the visitor can never get a token and the form fails every submit.
 *
 * The fix: load the Turnstile script in *explicit* mode (render=explicit,
 * see the script tag on the pages that include this file) so it never
 * auto-scans at all, and drive rendering ourselves, watching for
 * .cf-turnstile elements — including ones React swaps in later — via
 * MutationObserver so it's correct regardless of hydration timing.
 */
(function () {
  "use strict";

  var rendered = new WeakSet();

  function renderInto(el) {
    if (rendered.has(el)) return;
    var sitekey = el.getAttribute("data-sitekey");
    if (!sitekey) return;
    rendered.add(el);
    window.turnstile.render(el, { sitekey: sitekey });
  }

  function scan(node) {
    if (!node || node.nodeType !== 1) return;
    if (node.classList && node.classList.contains("cf-turnstile")) renderInto(node);
    if (node.querySelectorAll) {
      var found = node.querySelectorAll(".cf-turnstile");
      for (var i = 0; i < found.length; i++) renderInto(found[i]);
    }
  }

  // Called by the Turnstile script itself once loaded (see ?onload= on its
  // script tag) — nothing renders before this fires, so there's no
  // implicit-vs-explicit race to begin with.
  window.thymosRenderTurnstile = function () {
    scan(document.documentElement);
    new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var added = mutations[i].addedNodes;
        for (var j = 0; j < added.length; j++) scan(added[j]);
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
  };
})();

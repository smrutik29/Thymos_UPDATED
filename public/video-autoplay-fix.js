/*
 * Thymos Health — reliable autoplay for the marketing pages' hero/inline
 * videos.
 *
 * The .dc.html pages ship a <video autoplay muted playsinline preload="auto">
 * as real, parser-created markup, then the page's own client runtime
 * (support.js) tears it down and re-mounts a React-managed copy once React/
 * Babel finish loading from unpkg.com. Chrome doesn't reliably honor
 * `autoplay` on a <video> element that was (re)created via JS rather than
 * parsed from the initial HTML, so each page compensates with an explicit
 * `.play()` call wired to the video's onLoadedMetadata/onCanPlay — but that
 * handler is a page-local function, and on a slow mobile connection the
 * *first*, parser-created video's metadata can finish loading before
 * support.js has bootstrapped enough to attach it. The browser then runs the
 * still-literal template placeholder as inline JS (a ReferenceError), the
 * event is lost — it doesn't fire again later — and the video is left
 * paused.
 *
 * This script is a redundant, page-independent safety net: it watches for
 * *any* <video autoplay> element (the original one and whatever replaces it)
 * and calls .play() itself as soon as each one is ready, regardless of
 * whether the page's own handler ran.
 *
 * 2026-09-12: the MutationObserver approach above is not sufficient on its
 * own. Traced live on thymoshealth.com: the page's own client runtime keeps
 * rebuilding large parts of the DOM well after initial load — hundreds of
 * mutations in a single batch, recurring periodically, not just once at
 * hydration — so a video's *final* persisted DOM node can end up being one
 * this script's observer never happened to see at a moment its
 * loadedmetadata/canplay events were still ahead of it. Confirmed live: a
 * hero video sat fully loaded (readyState 4, no error) but paused and
 * unwired minutes after load, while a manual `.play()` call in the console
 * started it instantly — i.e. nothing was blocking playback, something was
 * just never asking for it. Rather than chase every re-render path in a
 * third-party runtime we don't control, add a lightweight interval sweep
 * that keeps asking: any `<video autoplay>` with no visible `controls` is
 * pure decorative background footage nobody can have intentionally paused,
 * so if it's ever found paused with enough data to play, play it. Videos
 * that expose `controls` (a person can legitimately click pause) are left
 * out of the sweep and rely on the event-driven `wire()` above only, so a
 * visitor's own pause is never overridden.
 */
(function () {
  "use strict";

  function wire(video) {
    if (video.__thymosAutoplayWired) return;
    video.__thymosAutoplayWired = true;

    var tryPlay = function () {
      video.play().catch(function () {});
    };
    video.addEventListener("loadedmetadata", tryPlay);
    video.addEventListener("canplay", tryPlay);
    video.addEventListener("ended", function () {
      if (video.loop) {
        video.currentTime = 0;
        tryPlay();
      }
    });
    if (video.readyState >= 1) tryPlay();
  }

  function scan(node) {
    if (!node || node.nodeType !== 1) return;
    if (node.tagName === "VIDEO" && node.autoplay) wire(node);
    if (node.querySelectorAll) {
      var found = node.querySelectorAll("video[autoplay]");
      for (var i = 0; i < found.length; i++) wire(found[i]);
    }
  }

  scan(document.documentElement);

  new MutationObserver(function (mutations) {
    for (var i = 0; i < mutations.length; i++) {
      var added = mutations[i].addedNodes;
      for (var j = 0; j < added.length; j++) scan(added[j]);
    }
  }).observe(document.documentElement, { childList: true, subtree: true });

  // Failsafe sweep — see 2026-09-12 note above. `:not([controls])` keeps
  // this from ever fighting a visitor who paused a video that has its own
  // visible pause button.
  setInterval(function () {
    var videos = document.querySelectorAll("video[autoplay]:not([controls])");
    for (var i = 0; i < videos.length; i++) {
      var video = videos[i];
      wire(video); // no-op if already wired; catches nodes scan()/the observer missed
      if (video.paused && video.readyState >= 2) {
        video.play().catch(function () {});
      }
    }
  }, 800);
})();

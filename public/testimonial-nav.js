/*
 * Thymos Health — homepage testimonial carousel arrows (mobile only).
 *
 * On mobile the "REAL PEOPLE, REAL RESULTS" testimonials switch from the
 * desktop auto-scrolling marquee to a one-card-per-view, swipeable strip
 * (see .tm-marquee / .tm-track / .tm-nav-arrow rules in mobile-fixes.css).
 * These two arrow buttons page through it by exactly one viewport width,
 * which — since each card is forced to full width there — always lands on
 * the next/previous card's scroll-snap point.
 *
 * Defined as a plain global (not addEventListener) so the buttons' literal
 * onclick="" attributes resolve correctly however/whenever the page's own
 * client runtime (re)creates the surrounding markup.
 */
window.thymosScrollTestimonials = function (direction) {
  var marquee = document.querySelector(".tm-marquee");
  if (!marquee) return;
  marquee.scrollBy({ left: marquee.clientWidth * direction, behavior: "smooth" });
};
